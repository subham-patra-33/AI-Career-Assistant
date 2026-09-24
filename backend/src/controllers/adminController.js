<<<<<<< HEAD
const User = require('../models/User');
const Resume = require('../models/Resume');

// GET /api/admin/users
// Returns every registered user with their resume count.
async function listUsersWithResumeCounts(req, res) {
  try {
    const users = await User.find().select('name username role createdAt').lean();

    // One aggregation query to count resumes per user, instead of N queries.
    const counts = await Resume.aggregate([
      { $group: { _id: '$userId', count: { $sum: 1 } } },
=======
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
>>>>>>> 1c15bfd (Update GauravGo gaming website)
    ]);
    const countMap = {};
    counts.forEach((c) => {
      if (c._id) countMap[c._id.toString()] = c.count;
    });

<<<<<<< HEAD
const result = users.map((u) => ({
  id: u._id,
  name: u.name || '',
  username: u.username,
  role: u.role || 'user',
  createdAt: u.createdAt,
  resumeCount: countMap[u._id.toString()] || 0,
}));

    res.json(result);
  } catch (err) {
    console.error('Admin listUsers error:', err.message);
    res.status(500).json({ message: 'Failed to load users' });
=======
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
>>>>>>> 1c15bfd (Update GauravGo gaming website)
  }
}

// GET /api/admin/stats
<<<<<<< HEAD
// Small aggregate summary for a dashboard-style header.
// GET /api/admin/stats
// Returns real database statistics for the Admin Analytics section.
// GET /api/admin/stats
=======
>>>>>>> 1c15bfd (Update GauravGo gaming website)
// Returns real database statistics for the Admin Analytics section.
async function getStats(req, res) {
  try {
    const [
      totalUsers,
<<<<<<< HEAD
=======
      totalStudents,
>>>>>>> 1c15bfd (Update GauravGo gaming website)
      totalAdmins,
      totalNormalUsers,
      activeUsers,
      inactiveUsers,
      totalResumes,
<<<<<<< HEAD
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      Resume.countDocuments(),
=======
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
>>>>>>> 1c15bfd (Update GauravGo gaming website)
    ]);

    // --------------------------------------------------
    // USER GROWTH - LAST 7 DAYS
    // --------------------------------------------------
<<<<<<< HEAD

=======
>>>>>>> 1c15bfd (Update GauravGo gaming website)
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: {
<<<<<<< HEAD
            $gte: new Date(
              Date.now() - 7 * 24 * 60 * 60 * 1000
            ),
=======
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
>>>>>>> 1c15bfd (Update GauravGo gaming website)
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
<<<<<<< HEAD
              format: '%Y-%m-%d',
              date: '$createdAt',
=======
              format: "%Y-%m-%d",
              date: "$createdAt",
>>>>>>> 1c15bfd (Update GauravGo gaming website)
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
<<<<<<< HEAD

=======
>>>>>>> 1c15bfd (Update GauravGo gaming website)
    const resumeGrowth = await Resume.aggregate([
      {
        $match: {
          createdAt: {
<<<<<<< HEAD
            $gte: new Date(
              Date.now() - 7 * 24 * 60 * 60 * 1000
            ),
=======
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
>>>>>>> 1c15bfd (Update GauravGo gaming website)
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
<<<<<<< HEAD
              format: '%Y-%m-%d',
              date: '$createdAt',
=======
              format: "%Y-%m-%d",
              date: "$createdAt",
>>>>>>> 1c15bfd (Update GauravGo gaming website)
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
<<<<<<< HEAD

    const roleDistribution = await User.aggregate([
      {
        $group: {
          _id: '$role',
=======
    const roleDistribution = await User.aggregate([
      {
        $group: {
          _id: "$role",
>>>>>>> 1c15bfd (Update GauravGo gaming website)
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
<<<<<<< HEAD

    const mostActiveUsers = await Resume.aggregate([
      {
        $group: {
          _id: '$userId',
=======
    const mostActiveUsers = await Resume.aggregate([
      {
        $group: {
          _id: "$userId",
>>>>>>> 1c15bfd (Update GauravGo gaming website)
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
<<<<<<< HEAD
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
=======
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
>>>>>>> 1c15bfd (Update GauravGo gaming website)
        },
      },
      {
        $unwind: {
<<<<<<< HEAD
          path: '$user',
=======
          path: "$user",
>>>>>>> 1c15bfd (Update GauravGo gaming website)
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
<<<<<<< HEAD
          username: '$user.username',
          name: '$user.name',
=======
          username: "$user.username",
          name: "$user.name",
>>>>>>> 1c15bfd (Update GauravGo gaming website)
          resumeCount: 1,
        },
      },
    ]);

    // --------------------------------------------------
    // MOST USED RESUME TEMPLATES
    // --------------------------------------------------
<<<<<<< HEAD

    const templateUsage = await Resume.aggregate([
      {
        $group: {
          _id: '$templateId',
=======
    const templateUsage = await Resume.aggregate([
      {
        $group: {
          _id: "$templateId",
>>>>>>> 1c15bfd (Update GauravGo gaming website)
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
<<<<<<< HEAD
=======
      totalStudents,
>>>>>>> 1c15bfd (Update GauravGo gaming website)
      totalAdmins,
      totalNormalUsers,
      activeUsers,
      inactiveUsers,
      totalResumes,
<<<<<<< HEAD
=======
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
>>>>>>> 1c15bfd (Update GauravGo gaming website)

      analytics: {
        userGrowth,
        resumeGrowth,
        roleDistribution,
        mostActiveUsers,
        templateUsage,
      },
    });
  } catch (err) {
<<<<<<< HEAD
    console.error('Admin stats error:', err.message);

    res.status(500).json({
      message: 'Failed to load statistics',
=======
    console.error("Admin stats error:", err.message);
    res.status(500).json({
      message: "Failed to load statistics",
>>>>>>> 1c15bfd (Update GauravGo gaming website)
    });
  }
}

module.exports = {
  listUsersWithResumeCounts,
  getStats,
};
<<<<<<< HEAD

module.exports = { listUsersWithResumeCounts, getStats };
=======
>>>>>>> 1c15bfd (Update GauravGo gaming website)
