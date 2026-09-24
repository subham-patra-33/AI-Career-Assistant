const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Resume = require("../models/Resume");
const SavedJob = require("../models/SavedJob");
const InterviewSession = require("../models/InterviewSession");
const Activity = require("../models/Activity");

router.use(auth);

/**
 * GET /api/career-progress
 * Returns dynamic, database-backed career progress metrics for the authenticated user
 */
router.get("/", async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required to view career progress",
      });
    }

    // Run parallel count queries restricted strictly to req.userId
    const [
      resumesCreated,
      jobsSaved,
      applications,
      interviews,
      latestInterview,
      hasSkillGapActivity,
      hasSkillGapResume,
      recentActivities,
    ] = await Promise.all([
      Resume.countDocuments({ userId: req.userId }),
      SavedJob.countDocuments({ userId: req.userId }),
      SavedJob.countDocuments({
        userId: req.userId,
        applicationStatus: { $in: ["Applied", "Interview"] },
      }),
      InterviewSession.countDocuments({ userId: req.userId }),
      InterviewSession.findOne({ userId: req.userId }).sort({ createdAt: -1 }).lean(),
      Activity.exists({
        userId: req.userId,
        activityType: "SKILL_GAP_ANALYSIS",
      }),
      Resume.exists({
        userId: req.userId,
        "data.skillGapAnalysis": { $exists: true },
      }),
      Activity.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(6).lean(),
    ]);

    const interviewScore = latestInterview ? Number(latestInterview.score) || 0 : 0;
    const skillGapStatus = hasSkillGapActivity || hasSkillGapResume ? "Completed" : "Pending";

    // Deterministic overall progress calculation (0 - 100%)
    // Each of the 4 core career pillars is worth 25%
    let completedSteps = 0;
    if (resumesCreated > 0) completedSteps++;
    if (skillGapStatus === "Completed") completedSteps++;
    if (interviews > 0 || interviewScore > 0) completedSteps++;
    if (applications > 0 || jobsSaved > 0) completedSteps++;

    const overallProgress = Math.round((completedSteps / 4) * 100);

    return res.json({
      success: true,
      data: {
        resumesCreated,
        jobsSaved,
        applications,
        interviews,
        overallProgress,
        interviewScore,
        skillGapStatus,
        recentActivities: recentActivities || [],
      },
    });
  } catch (error) {
    console.error("❌ Failed to fetch career progress:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to calculate career progress",
    });
  }
});

module.exports = router;
