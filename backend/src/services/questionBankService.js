const mongoose = require("mongoose");
const InterviewQuestion = require("../models/InterviewQuestion");
const InterviewSession = require("../models/InterviewSession");
const { SEED_QUESTIONS } = require("../data/seedQuestions");
const { resolveRole, getRoleCategories } = require("../config/interviewRoles");
const aiService = require("./aiService");

/**
 * In-memory fallback copy of seed questions with synthetic IDs
 * to guarantee 100% operation even if MongoDB is offline.
 */
const MEMORY_SEED_QUESTIONS = SEED_QUESTIONS.map((q, idx) => ({
  ...q,
  _id: `seed_${idx + 1}`,
  id: `seed_${idx + 1}`,
}));

/**
 * Ensures seed data is loaded into MongoDB if collection is empty
 */
async function ensureSeedData() {
  try {
    if (mongoose.connection.readyState !== 1) return;
    const count = await InterviewQuestion.countDocuments();
    if (count === 0) {
      console.log("🌱 Seeding InterviewQuestion collection with initial curated questions...");
      await InterviewQuestion.insertMany(SEED_QUESTIONS);
      console.log(`✅ Seeded ${SEED_QUESTIONS.length} curated interview questions successfully.`);
    }
  } catch (error) {
    console.error("⚠️ Failed to auto-seed interview questions:", error.message);
  }
}

/**
 * Shuffles array in-place using Fisher-Yates algorithm
 */
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Normalizes difficulty input
 */
function normalizeDifficulty(diff) {
  const d = String(diff || "medium").toLowerCase();
  if (d.includes("easy") || d.includes("begin")) return "Easy";
  if (d.includes("hard") || d.includes("adv")) return "Hard";
  return "Medium";
}

/**
 * Normalizes interview type input
 */
function normalizeInterviewType(type) {
  const t = String(type || "technical").toLowerCase();
  if (t.includes("behav")) return "Behavioral";
  if (t.includes("mix") || t.includes("hr")) return "Mixed";
  return "Technical";
}

/**
 * Retrieves user's practice profile from past InterviewSessions
 * Section 14: USAGE-BASED SELECTION
 */
async function getUserUsageStats(userId) {
  const stats = {
    usedQuestionIds: new Set(),
    recentQuestionIds: new Set(),
    categoryPerformance: {}, // category -> { totalScore, count, avgScore }
    difficultyPerformance: {},
    totalInterviews: 0,
  };

  if (!userId || !mongoose.isValidObjectId(userId)) {
    return stats;
  }

  try {
    if (mongoose.connection.readyState !== 1) return stats;

    const sessions = await InterviewSession.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    stats.totalInterviews = sessions.length;

    sessions.forEach((session, sessionIdx) => {
      (session.questions || []).forEach((q) => {
        const qId = String(q.questionId || q.question || "");
        if (qId) {
          stats.usedQuestionIds.add(qId);
          if (sessionIdx < 3) {
            stats.recentQuestionIds.add(qId);
          }
        }

        const cat = q.category || "General";
        if (!stats.categoryPerformance[cat]) {
          stats.categoryPerformance[cat] = { totalScore: 0, count: 0, avgScore: 0 };
        }
        stats.categoryPerformance[cat].totalScore += Number(q.score || 0);
        stats.categoryPerformance[cat].count += 1;
        stats.categoryPerformance[cat].avgScore =
          stats.categoryPerformance[cat].totalScore / stats.categoryPerformance[cat].count;
      });
    });
  } catch (err) {
    console.error("Error retrieving user usage stats:", err.message);
  }

  return stats;
}

/**
 * Fetches all candidate questions for a given role and type
 */
async function fetchEligibleQuestions({ role, interviewType, isActive = true }) {
  let questions = [];

  const roleConfig = resolveRole(role);
  const categories = getRoleCategories(role, interviewType);

  try {
    if (mongoose.connection.readyState === 1) {
      const query = {
        isActive,
      };

      // Match either role or role categories
      const roleRegex = new RegExp(roleConfig.canonicalName, "i");
      query.$or = [
        { role: roleRegex },
        { category: { $in: categories } },
      ];

      if (interviewType === "Behavioral") {
        query.interviewType = "Behavioral";
      } else if (interviewType === "Technical") {
        query.interviewType = "Technical";
      }

      questions = await InterviewQuestion.find(query).lean();
    }
  } catch (err) {
    console.error("MongoDB question fetch error:", err.message);
  }

  // Fallback to in-memory seed questions if MongoDB returned none or failed
  if (!questions || questions.length === 0) {
    questions = MEMORY_SEED_QUESTIONS.filter((q) => {
      if (isActive && !q.isActive) return false;

      const matchesRole =
        q.role.toLowerCase() === roleConfig.canonicalName.toLowerCase() ||
        categories.map((c) => c.toLowerCase()).includes(q.category.toLowerCase());

      if (!matchesRole) return false;

      if (interviewType === "Behavioral") {
        return q.interviewType === "Behavioral";
      }
      if (interviewType === "Technical") {
        return q.interviewType === "Technical";
      }
      return true;
    });
  }

  return questions;
}

/**
 * Core Question Selection Algorithm
 * Section 4 & 5 & 14
 */
async function selectQuestions({
  role = "Full Stack Developer",
  interviewType = "Technical",
  difficulty = "Medium",
  questionCount = 5,
  excludeQuestionIds = [],
  userId = null,
} = {}) {
  const normDifficulty = normalizeDifficulty(difficulty);
  const normType = normalizeInterviewType(interviewType);
  const count = Math.min(25, Math.max(1, Number(questionCount) || 5));

  const roleConfig = resolveRole(role);
  const userStats = await getUserUsageStats(userId);

  const eligibleCandidates = await fetchEligibleQuestions({
    role,
    interviewType: normType,
    isActive: true,
  });

  const excludeSet = new Set((excludeQuestionIds || []).map(String));
  const rationales = [];

  // Filter out questions already used in the current session
  const filteredCandidates = eligibleCandidates.filter((q) => {
    const id = String(q._id || q.id || q.question);
    return !excludeSet.has(id);
  });

  // If exclusions left us with too few, allow reusing non-current session questions
  const candidatePool = filteredCandidates.length >= count ? filteredCandidates : eligibleCandidates;

  // Score each candidate based on difficulty match, usage, and weakness targeting
  const scoredCandidates = candidatePool.map((q) => {
    const id = String(q._id || q.id || q.question);
    let weight = 100;

    // 1. Difficulty alignment
    if (q.difficulty === normDifficulty) {
      weight += 40;
    } else {
      // Adjacent difficulty gets partial score
      weight += 10;
    }

    // 2. Avoid recent questions (Section 5)
    if (userStats.recentQuestionIds.has(id)) {
      weight -= 60;
    } else if (userStats.usedQuestionIds.has(id)) {
      weight -= 30;
    } else {
      weight += 20; // Unseen question bonus
    }

    // 3. Weakness-based prioritization (Section 14)
    const catPerf = userStats.categoryPerformance[q.category];
    if (catPerf) {
      if (catPerf.avgScore < 60) {
        weight += 35; // Poorly scored category gets priority
        if (!rationales.includes(`Prioritizing ${q.category} to reinforce areas needing improvement`)) {
          rationales.push(`Prioritizing ${q.category} to reinforce areas needing improvement`);
        }
      }
    } else {
      // Never practiced category bonus
      weight += 15;
    }

    // 4. Jitter to ensure randomness across repeated runs
    weight += Math.random() * 25;

    return { question: q, weight };
  });

  // Group by category to enforce topic diversity (Section 4 & 5)
  const byCategory = {};
  scoredCandidates.forEach(({ question, weight }) => {
    const cat = question.category || "General";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push({ question, weight });
  });

  // Sort candidates within each category by weight descending
  Object.keys(byCategory).forEach((cat) => {
    byCategory[cat].sort((a, b) => b.weight - a.weight);
  });

  const selectedQuestions = [];
  const selectedIds = new Set();
  const categories = Object.keys(byCategory);
  let catIndex = 0;
  let safetyLoop = 0;

  // Round-robin selection across diverse categories
  while (selectedQuestions.length < count && safetyLoop < 100) {
    safetyLoop++;
    let addedInRound = false;

    // Shuffle categories slightly each round for freshness
    const shuffledCategories = shuffle(categories);

    for (const cat of shuffledCategories) {
      if (selectedQuestions.length >= count) break;
      const list = byCategory[cat];
      const nextCandidate = list.find(
        (item) => !selectedIds.has(String(item.question._id || item.question.id || item.question.question))
      );

      if (nextCandidate) {
        selectedQuestions.push(nextCandidate.question);
        selectedIds.add(String(nextCandidate.question._id || nextCandidate.question.id || nextCandidate.question.question));
        addedInRound = true;
      }
    }

    if (!addedInRound) {
      // Fallback: fill remaining from all candidates regardless of category quota
      const remaining = scoredCandidates
        .sort((a, b) => b.weight - a.weight)
        .map((sc) => sc.question)
        .filter((q) => !selectedIds.has(String(q._id || q.id || q.question)));

      for (const rem of remaining) {
        if (selectedQuestions.length >= count) break;
        selectedQuestions.push(rem);
        selectedIds.add(String(rem._id || rem.id || rem.question));
      }
      break;
    }
  }

  // Shuffle final list so order is natural
  const finalQuestions = shuffle(selectedQuestions);

  return {
    success: true,
    mode: "question-bank",
    role: roleConfig.canonicalName,
    difficulty: normDifficulty,
    interviewType: normType,
    count: finalQuestions.length,
    rationales,
    questions: finalQuestions.map((q, idx) => ({
      _id: q._id || q.id || `qb_${idx}`,
      id: q._id || q.id || `qb_${idx}`,
      question: q.question,
      category: q.category,
      difficulty: q.difficulty,
      interviewType: q.interviewType,
      expectedTopics: q.expectedTopics || [],
      keywords: q.keywords || [],
      answerGuidance: q.answerGuidance || "",
    })),
  };
}

/**
 * Helper to match keywords/concepts with root/stem recognition
 * Handles variations like hoist/hoisting/hoisted, reassign/reassigned/reassignment
 */
function matchesConcept(text, concept) {
  const c = String(concept || "").toLowerCase().trim();
  if (!c) return false;
  if (text.includes(c)) return true;

  const stem = c.replace(/(ing|ed|ment|tion|s|es|able|ive)$/, "");
  if (stem.length >= 4 && text.includes(stem)) return true;

  const words = text.split(/[^a-z0-9]+/);
  return words.some((w) => {
    if (w.length >= 4 && (w.startsWith(stem) || stem.startsWith(w))) return true;
    return false;
  });
}

/**
 * Deterministic Answer Evaluation Engine
 * Section 6: QUESTION BANK ANSWER EVALUATION
 * Works offline / without Gemini API
 */
function evaluateAnswerDeterministic({
  question,
  answer = "",
  expectedTopics = [],
  keywords = [],
  answerGuidance = "",
  interviewType = "Technical",
}) {
  const cleanAnswer = String(answer || "").trim();
  const lowerAnswer = cleanAnswer.toLowerCase();
  const words = cleanAnswer.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  if (!cleanAnswer || wordCount < 3) {
    return {
      score: 1,
      scoreOutOf100: 10,
      feedback: "Answer is too short or empty. Please provide a detailed response demonstrating your knowledge.",
      strengths: ["Attempted response"],
      improvements: [
        "Provide a complete explanation with technical details and practical examples.",
        expectedTopics.length ? `Cover key topics such as: ${expectedTopics.join(", ")}.` : "Elaborate thoroughly.",
      ],
      evaluationProvider: "local",
      betterAnswer: answerGuidance || "A strong answer thoroughly answers the prompt with structured reasoning.",
    };
  }

  const isBehavioral = String(interviewType).toLowerCase().includes("behav");
  const strengths = [];
  const improvements = [];

  // ============================================================
  // 1. KEYWORD & TOPIC MATCHING
  // ============================================================
  const matchedKeywords = [];
  const missingKeywords = [];

  (keywords || []).forEach((kw) => {
    if (matchesConcept(lowerAnswer, kw)) {
      matchedKeywords.push(kw);
    } else {
      missingKeywords.push(kw);
    }
  });

  const matchedTopics = [];
  const missingTopics = [];

  (expectedTopics || []).forEach((top) => {
    if (matchesConcept(lowerAnswer, top)) {
      matchedTopics.push(top);
    } else {
      missingTopics.push(top);
    }
  });

  // Calculate matching ratios
  const kwRatio = keywords.length ? matchedKeywords.length / keywords.length : 0.6;
  const topRatio = expectedTopics.length ? matchedTopics.length / expectedTopics.length : 0.6;

  // ============================================================
  // 2. LENGTH & DEPTH HEURISTICS
  // ============================================================
  let depthScore = 0; // 0 - 3 points
  if (wordCount >= 100) {
    depthScore = 3.0;
    strengths.push("Comprehensive and detailed explanation.");
  } else if (wordCount >= 50) {
    depthScore = 2.4;
    strengths.push("Good response length covering core points.");
  } else if (wordCount >= 25) {
    depthScore = 1.6;
    improvements.push("Elaborate further with specific implementation details or edge cases.");
  } else {
    depthScore = 0.8;
    improvements.push("Answer is brief; expanding with code or architecture examples will strengthen your answer.");
  }

  // ============================================================
  // 3. BEHAVIORAL / STAR STRUCTURE CHECK
  // ============================================================
  let starScore = 0;
  if (isBehavioral) {
    const situationCues = ["situation", "when", "project", "client", "company", "facing", "during", "at my"];
    const taskCues = ["task", "goal", "needed to", "responsible for", "objective", "had to", "assigned"];
    const actionCues = ["action", "implemented", "developed", "decided", "built", "communicated", "resolved", "led", "created"];
    const resultCues = ["result", "outcome", "improved", "increased", "decreased", "delivered", "successful", "learned", "metric"];

    const hasSituation = situationCues.some((c) => lowerAnswer.includes(c));
    const hasTask = taskCues.some((c) => lowerAnswer.includes(c));
    const hasAction = actionCues.some((c) => lowerAnswer.includes(c));
    const hasResult = resultCues.some((c) => lowerAnswer.includes(c));

    let starElements = 0;
    if (hasSituation) {
      starElements++;
      strengths.push("Clearly outlined context and situation.");
    } else {
      improvements.push("Include a clear Situation: set up the context and background.");
    }

    if (hasTask) {
      starElements++;
      strengths.push("Defined specific goals and responsibilities.");
    } else {
      improvements.push("Specify your exact Task and objective.");
    }

    if (hasAction) {
      starElements++;
      strengths.push("Detailed concrete actions and decisions taken.");
    } else {
      improvements.push("Emphasize the specific Actions YOU implemented.");
    }

    if (hasResult) {
      starElements++;
      strengths.push("Highlighted measurable outcomes and lessons learned.");
    } else {
      improvements.push("Conclude with the Result: quantify impact and what you learned.");
    }

    starScore = (starElements / 4) * 3.5;
  }

  // ============================================================
  // 4. COMBINE SCORES (0 - 10 SCALE)
  // ============================================================
  let rawScore = 0;
  if (isBehavioral) {
    rawScore = starScore + depthScore * 1.2 + kwRatio * 2.0;
  } else {
    // Technical: Keywords (0-3.5) + Topics (0-3.5) + Depth (0-3.0)
    rawScore = kwRatio * 3.5 + topRatio * 3.5 + depthScore;
  }

  // Bound score between 1 and 10
  const finalScore = Math.max(1, Math.min(10, Math.round(rawScore * 10) / 10));
  const scoreOutOf100 = Math.round(finalScore * 10);

  if (matchedKeywords.length) {
    strengths.push(`Accurately addressed key concepts: ${matchedKeywords.slice(0, 4).join(", ")}.`);
  }
  if (missingTopics.length) {
    improvements.push(`Consider mentioning: ${missingTopics.slice(0, 3).join(", ")}.`);
  }

  // Default fallbacks if lists are empty
  if (!strengths.length) {
    strengths.push("Demonstrated foundational understanding of the question.");
  }
  if (!improvements.length) {
    improvements.push("Provide concrete production benchmarks or alternative approaches.");
  }

  let feedback = "";
  if (finalScore >= 8.5) {
    feedback = `Excellent answer! You demonstrated thorough understanding, clear structure, and accurate technical terminology.`;
  } else if (finalScore >= 7.0) {
    feedback = `Strong answer covering the fundamental concepts well. Incorporating additional depth and missing details will make it stand out.`;
  } else if (finalScore >= 5.0) {
    feedback = `Adequate answer with good basic ideas, but lacking depth in key areas and technical specifics.`;
  } else {
    feedback = `The answer touches on the topic but is incomplete. Review the expected topics and answer guidance below to strengthen your response.`;
  }

  return {
    score: finalScore,
    scoreOutOf100,
    overallScore: scoreOutOf100,
    rating: finalScore,
    feedback,
    summary: feedback,
    strengths,
    improvements,
    betterAnswer: answerGuidance || "A well-structured answer clearly covers the core principles with concrete examples.",
    idealAnswer: answerGuidance || "",
    evaluationProvider: "local",
  };
}

/**
 * Evaluates an interview answer with optional AI or local engine
 * Section 7: OPTIONAL AI EVALUATION
 */
async function evaluateAnswer({
  question,
  questionId,
  answer,
  role = "Full Stack Developer",
  difficulty = "Medium",
  interviewType = "Technical",
  useAI = false,
  resume = "",
} = {}) {
  if (!question || !String(question).trim()) {
    const error = new Error("Interview question is required.");
    error.status = 400;
    throw error;
  }

  if (!answer || !String(answer).trim()) {
    const error = new Error("Candidate answer is required.");
    error.status = 400;
    throw error;
  }

  // Retrieve stored question metadata if questionId is provided
  let questionDoc = null;
  if (questionId) {
    try {
      if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(questionId)) {
        questionDoc = await InterviewQuestion.findById(questionId).lean();
      }
    } catch {}
    if (!questionDoc) {
      questionDoc = MEMORY_SEED_QUESTIONS.find((q) => q._id === questionId || q.id === questionId);
    }
  }

  const expectedTopics = questionDoc?.expectedTopics || [];
  const keywords = questionDoc?.keywords || [];
  const answerGuidance = questionDoc?.answerGuidance || "";
  const resolvedType = questionDoc?.interviewType || interviewType;

  // If user explicitly requested AI-powered evaluation, try Gemini -> Grok
  if (useAI === true) {
    try {
      const aiResult = await aiService.evaluateInterviewAnswer({
        question,
        answer,
        role,
        interviewType: resolvedType,
        difficulty,
      });

      if (aiResult?.data) {
        const rawScore = aiResult.data.score ?? aiResult.data.overallScore ?? 75;
        // Normalize score
        const scoreOutOf100 = rawScore <= 10 ? Math.round(rawScore * 10) : Math.min(100, Math.round(rawScore));
        const scoreOutOf10 = Math.round((scoreOutOf100 / 10) * 10) / 10;

        return {
          success: true,
          mode: "question-bank",
          provider: aiResult.provider,
          data: {
            ...aiResult.data,
            score: scoreOutOf10,
            scoreOutOf100,
            overallScore: scoreOutOf100,
            evaluationProvider: aiResult.provider,
            betterAnswer: aiResult.data.betterAnswer || answerGuidance,
          },
          evaluation: {
            ...aiResult.data,
            score: scoreOutOf10,
            scoreOutOf100,
            overallScore: scoreOutOf100,
            evaluationProvider: aiResult.provider,
            betterAnswer: aiResult.data.betterAnswer || answerGuidance,
          },
        };
      }
    } catch (aiErr) {
      console.warn("⚠️ AI Evaluation unavailable or failed. Falling back smoothly to Question Bank deterministic evaluation:", aiErr.message);
      // Graceful fallback to deterministic evaluation (Section 7 & 13)
    }
  }

  // Local deterministic evaluation (default Question Bank mode)
  const localEval = evaluateAnswerDeterministic({
    question,
    answer,
    expectedTopics,
    keywords,
    answerGuidance,
    interviewType: resolvedType,
  });

  return {
    success: true,
    mode: "question-bank",
    provider: "local",
    data: localEval,
    evaluation: localEval,
    result: localEval,
  };
}

/**
 * Saves a completed interview session
 * Section 8 & 9: INTERVIEW RESULT & CAREER PROGRESS
 */
async function saveInterviewSession({
  userId = null,
  mode = "question-bank",
  role = "Full Stack Developer",
  interviewType = "Technical",
  difficulty = "Medium",
  questionCount = 5,
  questions = [],
  score = 0,
  feedback = "",
} = {}) {
  const normalizedScore = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));

  const sessionData = {
    userId: userId && mongoose.isValidObjectId(userId) ? userId : null,
    mode: mode === "ai" ? "ai" : "question-bank",
    role: String(role).trim(),
    interviewType: String(interviewType).trim(),
    difficulty: String(difficulty).trim(),
    questionCount: Number(questionCount) || questions.length || 5,
    questions: questions.map((q) => ({
      questionId: q.questionId && mongoose.isValidObjectId(q.questionId) ? q.questionId : null,
      question: q.question || "",
      category: q.category || "General",
      difficulty: q.difficulty || "Medium",
      answer: q.answer || "",
      score: Number(q.score) || 0,
      feedback: q.feedback || "",
      strengths: q.strengths || [],
      improvements: q.improvements || [],
      evaluationProvider: q.evaluationProvider || "local",
    })),
    score: normalizedScore,
    feedback: feedback || `Completed ${mode === "ai" ? "AI" : "Question Bank"} interview with score ${normalizedScore}%.`,
  };

  let saved = null;
  if (mongoose.connection.readyState === 1) {
    try {
      saved = await InterviewSession.create(sessionData);
    } catch (err) {
      console.error("Failed to persist InterviewSession to MongoDB:", err.message);
    }
  }

  return {
    success: true,
    saved: true,
    mode: sessionData.mode,
    score: normalizedScore,
    sessionId: saved?._id || `local_${Date.now()}`,
    data: saved || sessionData,
  };
}

/**
 * Administration CRUD methods (Section 10)
 */
async function listQuestions({
  role,
  category,
  difficulty,
  interviewType,
  search,
  isActive,
  page = 1,
  limit = 50,
} = {}) {
  if (mongoose.connection.readyState !== 1) {
    let list = [...MEMORY_SEED_QUESTIONS];
    if (role) list = list.filter((q) => q.role.toLowerCase().includes(role.toLowerCase()));
    if (category) list = list.filter((q) => q.category.toLowerCase() === category.toLowerCase());
    if (difficulty) list = list.filter((q) => q.difficulty.toLowerCase() === difficulty.toLowerCase());
    if (interviewType) list = list.filter((q) => q.interviewType.toLowerCase() === interviewType.toLowerCase());
    if (search) list = list.filter((q) => q.question.toLowerCase().includes(search.toLowerCase()));
    return {
      success: true,
      total: list.length,
      page: 1,
      pages: 1,
      questions: list.slice((page - 1) * limit, page * limit),
    };
  }

  const query = {};
  if (role) query.role = new RegExp(role, "i");
  if (category) query.category = new RegExp(`^${category}$`, "i");
  if (difficulty) query.difficulty = normalizeDifficulty(difficulty);
  if (interviewType) query.interviewType = normalizeInterviewType(interviewType);
  if (typeof isActive === "boolean") query.isActive = isActive;
  if (search) query.question = new RegExp(search, "i");

  const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));
  const [questions, total] = await Promise.all([
    InterviewQuestion.find(query).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }).lean(),
    InterviewQuestion.countDocuments(query),
  ]);

  return {
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit) || 1,
    questions,
  };
}

async function getQuestionById(id) {
  if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(id)) {
    const q = await InterviewQuestion.findById(id).lean();
    if (q) return q;
  }
  return MEMORY_SEED_QUESTIONS.find((item) => item._id === id || item.id === id) || null;
}

async function createQuestion(data) {
  if (mongoose.connection.readyState !== 1) {
    const newQ = { ...data, _id: `mem_${Date.now()}`, id: `mem_${Date.now()}` };
    MEMORY_SEED_QUESTIONS.push(newQ);
    return newQ;
  }
  return await InterviewQuestion.create(data);
}

async function updateQuestion(id, updates) {
  if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(id)) {
    return await InterviewQuestion.findByIdAndUpdate(id, updates, { new: true });
  }
  const idx = MEMORY_SEED_QUESTIONS.findIndex((item) => item._id === id || item.id === id);
  if (idx !== -1) {
    MEMORY_SEED_QUESTIONS[idx] = { ...MEMORY_SEED_QUESTIONS[idx], ...updates };
    return MEMORY_SEED_QUESTIONS[idx];
  }
  return null;
}

async function deleteQuestion(id) {
  if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(id)) {
    return await InterviewQuestion.findByIdAndDelete(id);
  }
  const idx = MEMORY_SEED_QUESTIONS.findIndex((item) => item._id === id || item.id === id);
  if (idx !== -1) {
    return MEMORY_SEED_QUESTIONS.splice(idx, 1)[0];
  }
  return null;
}

module.exports = {
  ensureSeedData,
  selectQuestions,
  evaluateAnswer,
  evaluateAnswerDeterministic,
  saveInterviewSession,
  listQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
};
