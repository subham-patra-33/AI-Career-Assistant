const User = require('../models/User');
const Resume = require('../models/Resume');

// GET /api/admin/users
// Returns every registered user with their resume count.
async function listUsersWithResumeCounts(req, res) {
  try {
    const users = await User.find().select('name username email role createdAt').lean();

    // One aggregation query to count resumes per user, instead of N queries.
    const counts = await Resume.aggregate([
      { $group: { _id: '$userId', count: { $sum: 1 } } },
    ]);
    const countMap = {};
    counts.forEach((c) => {
      if (c._id) countMap[c._id.toString()] = c.count;
    });

    const result = users.map((u) => ({
      id: u._id,
      name: u.name || '',
      username: u.username,
      email: u.email || '',
      role: u.role || 'user',
      createdAt: u.createdAt,
      resumeCount: countMap[u._id.toString()] || 0,
    }));

    res.json(result);
  } catch (err) {
    console.error('Admin listUsers error:', err.message);
    res.status(500).json({ message: 'Failed to load users' });
  }
}

// GET /api/admin/stats
// Small aggregate summary for a dashboard-style header.
async function getStats(req, res) {
  try {
    const totalUsers = await User.countDocuments();
    const totalResumes = await Resume.countDocuments();
    res.json({ totalUsers, totalResumes });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load stats' });
  }
}

module.exports = { listUsersWithResumeCounts, getStats };