const User = require("../models/User");
const Resume = require("../models/Resume");
const Activity = require("../models/Activity");
const { ACTIVITY_TYPES } = require("../services/activityService");

// GET /api/admin/users
// Returns every registered user with their resume count and lastLogin.
async function listUsersWithResumeCounts(req, res) {
  try {
    const users = await User.find()
      .select("name username role createdAt lastLogin isActive")
      .lean();

    // One aggregation query to count resumes per user, instead of N queries.
    const counts = await Resume.aggregate([
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ]);
    const countMap = {};
    counts.forEach((c) => {
      if (c._id) countMap[c._id.toString()] = c.count;
    });

    const result = users.map((u) => ({
      id: u._id,
      name: u.name || "",
      username: u.username,
      role: u.role || "user",
      createdAt: u.createdAt,
      lastLogin: u.lastLogin || null,
      isActive: u.isActive !== false,
      resumeCount: countMap[u._id.toString()] || 0,
    }));

    res.json(result);
  } catch (err) {
    console.error("Admin listUsers error:", err.message);
    res.status(500).json({ message: "Failed to load users" });
  }
}

// GET /api/admin/stats
// Returns real database statistics for the Admin Analytics section.
async function getStats(req, res) {
  try {
    const [
      totalUsers,
      totalStudents,
      totalAdmins,
      totalNormalUsers,
      activeUsers,
      inactiveUsers,
      totalResumes,
      totalLogins,
      resumesCreatedActivity,
      atsUsage,
      jobMatchUsage,
      aiInterviewUsage,
      aiInterviewCompleted,
      questionBankUsage,
      questionBankCompleted,
      careerAssistantUsage,
      skillGapUsage,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: { $ne: "admin" } }),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "user" }),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      Resume.countDocuments(),
      Activity.countDocuments({ activityType: ACTIVITY_TYPES.STUDENT_LOGIN }),
      Activity.countDocuments({ activityType: ACTIVITY_TYPES.RESUME_CREATED }),
      Activity.countDocuments({ activityType: ACTIVITY_TYPES.ATS_ANALYSIS }),
      Activity.countDocuments({ activityType: ACTIVITY_TYPES.JOB_MATCH }),
      Activity.countDocuments({ activityType: ACTIVITY_TYPES.AI_MOCK_INTERVIEW_STARTED }),
      Activity.countDocuments({ activityType: ACTIVITY_TYPES.AI_MOCK_INTERVIEW_COMPLETED }),
      Activity.countDocuments({ activityType: ACTIVITY_TYPES.QUESTION_BANK_INTERVIEW_STARTED }),
      Activity.countDocuments({ activityType: ACTIVITY_TYPES.QUESTION_BANK_INTERVIEW_COMPLETED }),
      Activity.countDocuments({ activityType: ACTIVITY_TYPES.CAREER_ASSISTANT_USED }),
      Activity.countDocuments({ activityType: ACTIVITY_TYPES.SKILL_GAP_ANALYSIS }),
    ]);

    // --------------------------------------------------
    // USER GROWTH - LAST 7 DAYS
    // --------------------------------------------------
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // --------------------------------------------------
    // RESUME GROWTH - LAST 7 DAYS
    // --------------------------------------------------
    const resumeGrowth = await Resume.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // --------------------------------------------------
    // ROLE DISTRIBUTION
    // --------------------------------------------------
    const roleDistribution = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // --------------------------------------------------
    // MOST ACTIVE USERS
    // Based on number of resumes created
    // --------------------------------------------------
    const mostActiveUsers = await Resume.aggregate([
      {
        $group: {
          _id: "$userId",
          resumeCount: { $sum: 1 },
        },
      },
      {
        $sort: {
          resumeCount: -1,
        },
      },
      {
        $limit: 5,
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          username: "$user.username",
          name: "$user.name",
          resumeCount: 1,
        },
      },
    ]);

    // --------------------------------------------------
    // MOST USED RESUME TEMPLATES
    // --------------------------------------------------
    const templateUsage = await Resume.aggregate([
      {
        $group: {
          _id: "$templateId",
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
      {
        $limit: 5,
      },
    ]);

    res.json({
      totalUsers,
      totalStudents,
      totalAdmins,
      totalNormalUsers,
      activeUsers,
      inactiveUsers,
      totalResumes,
      totalLogins,
      resumesCreated: Math.max(resumesCreatedActivity, totalResumes),
      atsUsage,
      jobMatchUsage,
      aiInterviewUsage,
      aiInterviewCompleted,
      questionBankUsage,
      questionBankCompleted,
      careerAssistantUsage,
      skillGapUsage,

      analytics: {
        userGrowth,
        resumeGrowth,
        roleDistribution,
        mostActiveUsers,
        templateUsage,
      },
    });
  } catch (err) {
    console.error("Admin stats error:", err.message);
    res.status(500).json({
      message: "Failed to load statistics",
    });
  }
}

module.exports = {
  listUsersWithResumeCounts,
  getStats,
};
