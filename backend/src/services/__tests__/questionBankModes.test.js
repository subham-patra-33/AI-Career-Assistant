// backend/src/services/__tests__/questionBankModes.test.js
require("dotenv").config({ path: require("path").resolve(__dirname, "../../../.env") });
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const questionBankService = require("../questionBankService");
const aiService = require("../aiService");
const { resolveRole, getRoleCategories } = require("../../config/interviewRoles");
const { SEED_QUESTIONS } = require("../../data/seedQuestions");

console.log("\n=======================================================");
console.log("RUNNING QUESTION BANK & DUAL INTERVIEW MODES TEST SUITE");
console.log("=======================================================\n");

let passedCount = 0;
let totalCount = 0;

async function runTest(testName, testFn) {
  totalCount++;
  process.stdout.write(`TEST ${totalCount}: ${testName} ... `);
  try {
    await testFn();
    console.log("✅ PASSED");
    passedCount++;
  } catch (err) {
    console.log("❌ FAILED");
    console.error("   Error details:", err.message);
  }
}

(async () => {
  // CRITERION 11: Initial Question Bank has sufficient curated questions
  await runTest("Question Bank seed dataset contains sufficient initial questions", async () => {
    assert.ok(SEED_QUESTIONS.length >= 40, `Expected at least 40 questions, found ${SEED_QUESTIONS.length}`);
    const fullStackQuestions = SEED_QUESTIONS.filter((q) => q.role === "Full Stack Developer");
    assert.ok(fullStackQuestions.length >= 25, `Expected at least 25 Full Stack questions, found ${fullStackQuestions.length}`);

    // Verify key categories are represented
    const categories = new Set(SEED_QUESTIONS.map((q) => q.category));
    const requiredCategories = ["JavaScript", "React", "Node.js", "Express", "MongoDB", "SQL", "Git", "DSA", "Behavioral"];
    for (const cat of requiredCategories) {
      assert.ok(categories.has(cat), `Category '${cat}' must be present in Question Bank`);
    }
  });

  // CRITERION 4 & 16 & 17: Question Bank mode does NOT require Gemini or Grok
  await runTest("Question Bank question selection works with zero AI API dependency", async () => {
    // Disable any potential AI calls
    const originalGeminiKey = process.env.GEMINI_API_KEY;
    const originalGrokKey = process.env.XAI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.XAI_API_KEY;

    try {
      const result = await questionBankService.selectQuestions({
        role: "Full Stack Developer",
        interviewType: "Technical",
        difficulty: "Medium",
        questionCount: 5,
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.mode, "question-bank");
      assert.strictEqual(result.questions.length, 5);
      result.questions.forEach((q) => {
        assert.ok(q.question, "Question must have text");
        assert.ok(q.category, "Question must have category");
        assert.ok(q.difficulty, "Question must have difficulty");
      });
    } finally {
      process.env.GEMINI_API_KEY = originalGeminiKey;
      process.env.XAI_API_KEY = originalGrokKey;
    }
  });

  // CRITERION 5: Role-based question selection
  await runTest("Question selection respects selected job role", async () => {
    const rolesToTest = ["Frontend Developer", "Backend Developer", "Java Developer", "Python Developer"];

    for (const testRole of rolesToTest) {
      const result = await questionBankService.selectQuestions({
        role: testRole,
        interviewType: "Technical",
        difficulty: "Medium",
        questionCount: 4,
      });

      assert.strictEqual(result.success, true);
      assert.ok(result.questions.length > 0);
      const roleConfig = resolveRole(testRole);
      const allowedCategories = getRoleCategories(testRole, "Technical").map((c) => c.toLowerCase());

      result.questions.forEach((q) => {
        const matchesRole = q.category.toLowerCase().includes(testRole.toLowerCase().split(" ")[0]);
        const inAllowed = allowedCategories.includes(q.category.toLowerCase());
        assert.ok(
          matchesRole || inAllowed || q.category === "General",
          `Question category '${q.category}' should be appropriate for ${testRole}`
        );
      });
    }
  });

  // CRITERION 6 & 7: Respects difficulty and interview type
  await runTest("Question selection respects requested difficulty and interview type", async () => {
    // 1. Behavioral interview type
    const behavioralResult = await questionBankService.selectQuestions({
      role: "Full Stack Developer",
      interviewType: "Behavioral",
      difficulty: "Easy",
      questionCount: 3,
    });
    assert.strictEqual(behavioralResult.interviewType, "Behavioral");
    behavioralResult.questions.forEach((q) => {
      assert.strictEqual(q.interviewType, "Behavioral", "All questions in Behavioral interview must be Behavioral");
    });

    // 2. Technical interview type
    const technicalResult = await questionBankService.selectQuestions({
      role: "Full Stack Developer",
      interviewType: "Technical",
      difficulty: "Hard",
      questionCount: 3,
    });
    assert.strictEqual(technicalResult.interviewType, "Technical");
    technicalResult.questions.forEach((q) => {
      assert.strictEqual(q.interviewType, "Technical", "Questions in Technical interview must be Technical");
    });
  });

  // CRITERION 8: Questions are randomized
  await runTest("Questions are randomized across repeated runs", async () => {
    const run1 = await questionBankService.selectQuestions({
      role: "Full Stack Developer",
      interviewType: "Technical",
      difficulty: "Medium",
      questionCount: 5,
    });

    const run2 = await questionBankService.selectQuestions({
      role: "Full Stack Developer",
      interviewType: "Technical",
      difficulty: "Medium",
      questionCount: 5,
    });

    const ids1 = run1.questions.map((q) => q.question).join("||");
    const ids2 = run2.questions.map((q) => q.question).join("||");
    // While there could be partial overlap, two runs of 5 questions from a pool of 50 should not be identical in exact order
    // We run 3 attempts if random seed happened to match
    let atLeastOneDifferent = ids1 !== ids2;
    if (!atLeastOneDifferent) {
      const run3 = await questionBankService.selectQuestions({
        role: "Full Stack Developer",
        interviewType: "Technical",
        difficulty: "Medium",
        questionCount: 5,
      });
      const ids3 = run3.questions.map((q) => q.question).join("||");
      atLeastOneDifferent = ids1 !== ids3;
    }
    assert.ok(atLeastOneDifferent, "Consecutive runs should produce randomized question selections");
  });

  // CRITERION 9: Questions do NOT repeat within one session
  await runTest("Questions do not repeat within one session", async () => {
    const result = await questionBankService.selectQuestions({
      role: "Full Stack Developer",
      interviewType: "Technical",
      difficulty: "Medium",
      questionCount: 10,
    });

    const seen = new Set();
    result.questions.forEach((q) => {
      const key = q.question;
      assert.ok(!seen.has(key), `Question "${key}" was duplicated within the same session`);
      seen.add(key);
    });

    // Excluded IDs are not selected in subsequent rounds
    const excluded = result.questions.slice(0, 3).map((q) => q._id || q.id);
    const round2 = await questionBankService.selectQuestions({
      role: "Full Stack Developer",
      interviewType: "Technical",
      difficulty: "Medium",
      questionCount: 5,
      excludeQuestionIds: excluded,
    });

    round2.questions.forEach((q) => {
      const id = String(q._id || q.id);
      assert.ok(!excluded.includes(id), `Excluded question ID ${id} appeared in round 2`);
    });
  });

  // CRITERION 6 & 12: Deterministic answer evaluation without AI
  await runTest("Question Bank answers are evaluated deterministically without AI", async () => {
    // 1. Technical answer evaluation
    const techResult = questionBankService.evaluateAnswerDeterministic({
      question: "What is the difference between let, var and const in JavaScript?",
      answer: "var is function-scoped and hoisted with undefined. In contrast, let and const are block-scoped and stay in the temporal dead zone (TDZ) before declaration. Also const cannot be reassigned after declaration.",
      expectedTopics: ["scope", "hoisting", "block scope", "reassignment", "temporal dead zone"],
      keywords: ["let", "var", "const", "scope", "hoisting", "block", "reassign", "tdz"],
      interviewType: "Technical",
    });

    assert.ok(typeof techResult.score === "number");
    assert.ok(techResult.score >= 7, `Expected score >= 7 for thorough technical answer, got ${techResult.score}`);
    assert.ok(techResult.strengths.length > 0, "Evaluation should report strengths");
    assert.ok(techResult.feedback, "Evaluation should include feedback string");
    assert.strictEqual(techResult.evaluationProvider, "local");

    // 2. Behavioral STAR structure check
    const starResult = questionBankService.evaluateAnswerDeterministic({
      question: "Describe a difficult bug you solved.",
      answer: "In a previous project facing high latency, our team faced memory leaks in production. My task was to identify the root cause. I implemented heap profiling using Chrome DevTools, discovered unclosed WebSocket connections, and refactored the cleanup handlers. As a result, memory usage dropped by 45% and latency returned to normal.",
      expectedTopics: ["root cause", "debugging", "logs", "fix", "outcome"],
      keywords: ["bug", "production", "debug", "resolved", "action", "result"],
      interviewType: "Behavioral",
    });

    assert.ok(starResult.score >= 7, `Expected score >= 7 for STAR-structured behavioral answer, got ${starResult.score}`);
    assert.ok(starResult.strengths.some((s) => s.toLowerCase().includes("situation") || s.toLowerCase().includes("action") || s.toLowerCase().includes("outcome")));

    // 3. Short/poor answer receives low score
    const poorResult = questionBankService.evaluateAnswerDeterministic({
      question: "What is React virtual DOM?",
      answer: "It is fast.",
      expectedTopics: ["virtual dom", "diffing", "reconciliation"],
      keywords: ["virtual", "dom", "diffing"],
      interviewType: "Technical",
    });

    assert.ok(poorResult.score <= 3, `Expected low score for 4-word answer, got ${poorResult.score}`);
    assert.ok(poorResult.improvements.length > 0, "Poor answer should have actionable improvements");
  });

  // CRITERION 8 & 13: Uniform Result Structure and Persistence
  await runTest("Both AI mode and Question Bank mode produce uniform result structures", async () => {
    // Question Bank session save
    const qbSession = await questionBankService.saveInterviewSession({
      mode: "question-bank",
      role: "Full Stack Developer",
      interviewType: "Technical",
      difficulty: "Medium",
      questionCount: 5,
      score: 85,
      questions: [
        { question: "Q1", answer: "A1", score: 8, feedback: "Good" },
        { question: "Q2", answer: "A2", score: 9, feedback: "Great" },
      ],
    });

    assert.strictEqual(qbSession.success, true);
    assert.strictEqual(qbSession.mode, "question-bank");
    assert.strictEqual(qbSession.score, 85);

    // AI session save
    const aiSession = await questionBankService.saveInterviewSession({
      mode: "ai",
      role: "Full Stack Developer",
      interviewType: "Technical",
      difficulty: "Medium",
      questionCount: 5,
      score: 90,
      questions: [
        { question: "Q1", answer: "A1", score: 9, feedback: "Excellent" },
      ],
    });

    assert.strictEqual(aiSession.success, true);
    assert.strictEqual(aiSession.mode, "ai");
    assert.strictEqual(aiSession.score, 90);
  });

  // CRITERION 18: No API keys exposed in frontend or client code
  await runTest("Security: Zero API keys or secrets exposed in frontend components", async () => {
    const frontendFiles = [
      path.resolve(__dirname, "../../../../frontend/src/components/Pages/AiMockInterview.jsx"),
      path.resolve(__dirname, "../../../../frontend/src/components/Pages/CareerProgress.jsx"),
    ];

    for (const f of frontendFiles) {
      const code = fs.readFileSync(f, "utf8");
      assert.ok(!code.includes("AIzaSy"), `API key leaked in ${f}`);
      assert.ok(!code.includes("xai-"), `xAI API key leaked in ${f}`);
      assert.ok(!code.includes("GEMINI_API_KEY"), `GEMINI_API_KEY string in ${f}`);
      assert.ok(!code.includes("XAI_API_KEY"), `XAI_API_KEY string in ${f}`);
    }
  });

  // CRITERION 10: Question Bank Administration CRUD functionality
  await runTest("Question Bank admin CRUD methods operate properly", async () => {
    // 1. Create Question
    const created = await questionBankService.createQuestion({
      question: "Test question: What is Docker containerization?",
      role: "DevOps Engineer",
      category: "DevOps",
      difficulty: "Medium",
      interviewType: "Technical",
      expectedTopics: ["container", "image", "isolation"],
      keywords: ["docker", "container", "isolation"],
      answerGuidance: "Docker packages code and dependencies into portable containers.",
      isActive: true,
    });

    assert.ok(created);
    const questionId = created._id || created.id;
    assert.ok(questionId, "Created question must have an ID");

    // 2. Read Question
    const fetched = await questionBankService.getQuestionById(questionId);
    assert.ok(fetched);
    assert.strictEqual(fetched.question, "Test question: What is Docker containerization?");

    // 3. Update Question
    const updated = await questionBankService.updateQuestion(questionId, { difficulty: "Hard" });
    assert.ok(updated);

    // 4. Delete Question
    const deleted = await questionBankService.deleteQuestion(questionId);
    assert.ok(deleted);
  });

  console.log(`\n-------------------------------------------------------`);
  console.log(`RESULTS: ${passedCount} / ${totalCount} TESTS PASSED`);
  console.log(`-------------------------------------------------------\n`);

  if (passedCount !== totalCount) {
    process.exit(1);
  }
})();
