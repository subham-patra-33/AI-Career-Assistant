const jwt = require("jsonwebtoken");
const config = require("../config");
const User = require("../models/User");

/**
 * Admin authorization middleware
 * Section 10: QUESTION BANK ADMINISTRATION
 */
module.exports = async function adminAuth(req, res, next) {
  const header = req.headers.authorization || req.headers.Authorization;

  // Development bypass if explicitly configured
  if (process.env.DEV_ALLOW_ADMIN === "true") {
    req.userId = "dev_admin";
    req.isAdmin = true;
    return next();
  }

  if (!header) {
    if (process.env.DEV_ALLOW_ANONYMOUS === "true") {
      req.userId = "dev_admin";
      req.isAdmin = true;
      return next();
    }
    return res.status(401).json({ message: "Missing authorization header" });
  }

  const parts = header.split(" ");
  const token = parts.length === 2 ? parts[1] : parts[0];

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.userId = payload.id || payload.sub;

    // Check admin role in User model if connected
    if (payload.role === "admin") {
      req.isAdmin = true;
      return next();
    }

    try {
      const user = await User.findById(req.userId).lean();
      if (user && user.role === "admin") {
        req.isAdmin = true;
        return next();
      }
    } catch {}

    // In dev mode when no user is marked admin yet, allow if user exists or fallback
    if (process.env.NODE_ENV === "development") {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Admin authorization required to perform this action.",
    });
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
