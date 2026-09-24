<<<<<<< HEAD
const User = require('../models/User');
=======
const User = require("../models/User");
>>>>>>> 1c15bfd (Update GauravGo gaming website)

module.exports = async function adminOnly(req, res, next) {
  try {
    if (!req.userId) {
<<<<<<< HEAD
      return res.status(401).json({ message: 'Login required' });
=======
      return res.status(401).json({ message: "Login required" });
>>>>>>> 1c15bfd (Update GauravGo gaming website)
    }

    const user = await User.findById(req.userId).lean();

<<<<<<< HEAD
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
=======
    if (!user || user.role !== "admin") {
      return res.status(403).json({
        message: "Admin access required",
      });
    }

    req.isAdmin = true;
    next();
  } catch (err) {
    console.error("Admin check error:", err);
    return res.status(500).json({
      message: "Server error checking admin access",
    });
  }
};
>>>>>>> 1c15bfd (Update GauravGo gaming website)
