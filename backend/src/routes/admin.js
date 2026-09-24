<<<<<<< HEAD
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const controller = require('../controllers/adminController');
=======
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const controller = require("../controllers/adminController");
>>>>>>> 1c15bfd (Update GauravGo gaming website)

router.use(authMiddleware);
router.use(adminOnly);

<<<<<<< HEAD
router.get('/users', controller.listUsersWithResumeCounts);
router.get('/stats', controller.getStats);

module.exports = router;
=======
router.get("/users", controller.listUsersWithResumeCounts);
router.get("/stats", controller.getStats);

module.exports = router;
>>>>>>> 1c15bfd (Update GauravGo gaming website)
