const jwt = require('jsonwebtoken');
const config = require('../config');

// Auth middleware: verifies JWT and sets req.userId.
// In development, when DEV_ALLOW_ANONYMOUS=true, missing Authorization header will be allowed
// and req.userId will be null to make local testing easier.
module.exports = function (req, res, next) {
  const header = req.headers.authorization || req.headers.Authorization;
  if (!header) {
    if (process.env.DEV_ALLOW_ANONYMOUS === 'true') {
      req.userId = null;
      return next();
    }
    return res.status(401).json({ message: 'Missing authorization header' });
  }
  const parts = header.split(' ');
  const token = parts.length === 2 ? parts[1] : parts[0];
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.userId = payload.id || payload.sub;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
