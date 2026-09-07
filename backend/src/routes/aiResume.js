const express = require("express");
const router = express.Router();

const {
  callGemini,
  generateSuggestions,
  generateMockInterview,
  evaluateInterviewAnswer,
} = require("../utils/gemini");

const auth = require("../middleware/auth");

router.use(auth);

router.post("/generate", async (req, res) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({
        error: "Missing resume data",
      });
    }

    const resume = await callGemini(data);

    res.json({
      success: true,
      resume,
    });
  } catch (error) {
    console.error("❌ AI Resume Error:", error.message);

    res.status(500).json({
      success: false,
      error: error.message || "AI resume generation failed",
    });
  }
});

router.post("/suggestions", async (req, res) => {
  try {
    const suggestions = await generateSuggestions(req.body || {});

    res.json({
      success: true,
      suggestions,
    });
  } catch (error) {
    console.error("❌ AI Suggestions Error:", error.message);

    res.status(500).json({
      success: false,
      error: error.message || "AI suggestions failed",
    });
  }
});

router.post("/mock-interview/start", async (req, res) => {
  try {
    const interview = await generateMockInterview(req.body || {});

    res.json({
      success: true,
      interview,
    });
  } catch (error) {
    console.error("❌ Mock Interview Error:", error.message);

    res.status(500).json({
      success: false,
      error: error.message || "Mock interview generation failed",
    });
  }
});

router.post("/mock-interview/evaluate", async (req, res) => {
  try {
    const { question, answer } = req.body;

    if (!question) {
      return res.status(400).json({
        error: "Missing interview question",
      });
    }

    if (!answer) {
      return res.status(400).json({
        error: "Missing candidate answer",
      });
    }

    const evaluation = await evaluateInterviewAnswer(req.body);

    res.json({
      success: true,
      evaluation,
    });
  } catch (error) {
    console.error("❌ Interview Evaluation Error:", error.message);

    res.status(500).json({
      success: false,
      error: error.message || "Interview evaluation failed",
    });
  }
});

module.exports = router;