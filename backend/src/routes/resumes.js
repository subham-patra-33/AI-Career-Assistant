const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth");
const controller = require("../controllers/resumeController");

// All resume operations require authentication
router.use(authMiddleware);

router.post("/auto-generate", controller.autoGenerate);

router.get("/", controller.list);
router.post("/", controller.create);

router.get("/:id", controller.getOne);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

router.post("/:id/ai-populate", controller.aiPopulate);
router.post("/:id/generate-pdf", controller.generatePdfHandler);
router.post("/:id/ats-check", controller.atsCheck);

module.exports = router;