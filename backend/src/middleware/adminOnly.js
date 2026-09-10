const User = require('../models/User');

module.exports = async function adminOnly(req, res, next) {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Login required' });
    }

    const user = await User.findById(req.userId).lean();

    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        message: 'Admin access required'
      });
    }

    next();
  } catch (err) {
    console.error('Admin check error:', err);
    return res.status(500).json({
      message: 'Server error checking admin access'
    });
  }
};