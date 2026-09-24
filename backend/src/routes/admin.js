const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const controller = require("../controllers/adminController");

router.use(authMiddleware);
router.use(adminOnly);

router.get("/users", controller.listUsersWithResumeCounts);
router.get("/stats", controller.getStats);

module.exports = router;
