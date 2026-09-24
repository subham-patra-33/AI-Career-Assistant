const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const config = require("../config");
const questionBankService = require("../services/questionBankService");
const aiService = require("../services/aiService");
const adminAuth = require("../middleware/adminAuth");
const InterviewSession = require("../models/InterviewSession");
const { logActivity, ACTIVITY_TYPES } = require("../services/activityService");

/**
 * Optional authentication helper:
 * populates req.userId if a valid JWT is present, but does not reject unauthenticated users.
 */
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || req.headers.Authorization;
  if (!header) {
    req.userId = null;
    return next();
  }
  const parts = header.split(" ");
  const token = parts.length === 2 ? parts[1] : parts[0];
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.userId = payload.id || payload.sub;
  } catch {
    req.userId = null;
  }
  next();
}

// ============================================================
// 1. SELECT / START INTERVIEW
// Section 1 & 4: Dual Mode Selection
// ============================================================

router.post(["/start", "/select"], optionalAuth, async (req, res) => {
  try {
    const {
      mode = "question-bank",
      role = "Full Stack Developer",
      interviewType = "Technical",
      difficulty = "Medium",
      questionCount = 5,
      resume = "",
      excludeQuestionIds = [],
    } = req.body || {};

    if (mode === "ai") {
      // AI Interview Mode (Section 1)
      const aiResponse = await aiService.generateInterviewQuestions({
        role,
        interviewType,
        difficulty,
        questionCount,
        resume,
      });

      logActivity(req.userId, ACTIVITY_TYPES.AI_MOCK_INTERVIEW_STARTED, "interview", {
        role,
        difficulty,
      });

      return res.json({
        success: true,
        mode: "ai",
        provider: aiResponse.provider,
        role,
        difficulty,
        interviewType,
        questions: aiResponse.questions || aiResponse.data?.questions || [],
      });
    }

    // Question Bank Mode (Section 1, 4, 5, 14)
    // Curated role-based selection without calling any AI
    const result = await questionBankService.selectQuestions({
      role,
      interviewType,
      difficulty,
      questionCount,
      excludeQuestionIds,
      userId: req.userId,
    });

    logActivity(req.userId, ACTIVITY_TYPES.QUESTION_BANK_INTERVIEW_STARTED, "interview", {
      role,
      difficulty,
    });

    return res.json(result);
  } catch (error) {
    console.error("❌ Interview Start Error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to start interview.",
    });
  }
});

// ============================================================
// 2. EVALUATE INTERVIEW ANSWER
// Section 6 & 7: Question Bank Evaluation + Optional AI
// ============================================================

router.post("/evaluate", optionalAuth, async (req, res) => {
  try {
    const {
      question,
      questionId,
      answer,
      role = "Full Stack Developer",
      difficulty = "Medium",
      interviewType = "Technical",
      useAI = false,
      resume = "",
    } = req.body || {};

    const evaluation = await questionBankService.evaluateAnswer({
      question,
      questionId,
      answer,
      role,
      difficulty,
      interviewType,
      useAI: Boolean(useAI),
      resume,
    });

    return res.json(evaluation);
  } catch (error) {
    console.error("❌ Interview Evaluation Error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Evaluation failed.",
    });
  }
});

// ============================================================
// 3. SAVE INTERVIEW RESULT & UPDATE CAREER PROGRESS
// Section 8 & 9: Uniform Result & Career Progress
// ============================================================

router.post("/save", optionalAuth, async (req, res) => {
  try {
    const {
      mode = "question-bank",
      role = "Full Stack Developer",
      interviewType = "Technical",
      difficulty = "Medium",
      questionCount = 5,
      questions = [],
      score = 0,
      feedback = "",
    } = req.body || {};

    const saved = await questionBankService.saveInterviewSession({
      userId: req.userId,
      mode,
      role,
      interviewType,
      difficulty,
      questionCount,
      questions,
      score,
      feedback,
    });

    if (mode === "ai") {
      logActivity(req.userId, ACTIVITY_TYPES.AI_MOCK_INTERVIEW_COMPLETED, "interview", {
        role,
        score,
      });
    } else {
      logActivity(req.userId, ACTIVITY_TYPES.QUESTION_BANK_INTERVIEW_COMPLETED, "interview", {
        role,
        score,
      });
    }

    return res.json(saved);
  } catch (error) {
    console.error("❌ Save Interview Error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to save interview session.",
    });
  }
});

// ============================================================
// 4. LATEST SCORE & HISTORY
// Section 15: Refreshing preserves progress
// ============================================================

router.get("/latest-score", optionalAuth, async (req, res) => {
  try {
    if (!req.userId) {
      return res.json({ success: true, score: null });
    }

    const latest = await InterviewSession.findOne({ userId: req.userId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      score: latest ? latest.score : null,
      mode: latest ? latest.mode : null,
      createdAt: latest ? latest.createdAt : null,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/history", optionalAuth, async (req, res) => {
  try {
    if (!req.userId) {
      return res.json({ success: true, history: [] });
    }

    const sessions = await InterviewSession.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.json({ success: true, history: sessions });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// 5. QUESTION BANK ADMINISTRATION (CRUD)
// Section 10: Administration support
// ============================================================

router.get("/questions", async (req, res) => {
  try {
    const result = await questionBankService.listQuestions(req.query || {});
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/questions/:id", async (req, res) => {
  try {
    const question = await questionBankService.getQuestionById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }
    return res.json({ success: true, question });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/questions", adminAuth, async (req, res) => {
  try {
    const { question, role, category, difficulty, interviewType } = req.body || {};
    if (!question || !role || !category) {
      return res.status(400).json({ success: false, message: "question, role, and category are required." });
    }
    const created = await questionBankService.createQuestion(req.body);
    return res.status(201).json({ success: true, question: created });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/questions/:id", adminAuth, async (req, res) => {
  try {
    const updated = await questionBankService.updateQuestion(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }
    return res.json({ success: true, question: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/questions/:id", adminAuth, async (req, res) => {
  try {
    const deleted = await questionBankService.deleteQuestion(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }
    return res.json({ success: true, message: "Question deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
