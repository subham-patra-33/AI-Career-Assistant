const express = require("express");
const router = express.Router();
const SavedJob = require("../models/SavedJob");
const auth = require("../middleware/auth");

router.use(auth);

/**
 * GET /api/jobs/saved
 * List all saved jobs for current authenticated student
 */
router.get("/saved", async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const savedJobs = await SavedJob.find({ userId: req.userId })
      .sort({ updatedAt: -1, savedAt: -1 })
      .lean();

    return res.json({
      success: true,
      data: savedJobs,
      count: savedJobs.length,
    });
  } catch (error) {
    console.error("❌ Failed to fetch saved jobs:", error.message);
    return res.status(500).json({ success: false, message: "Failed to load saved jobs" });
  }
});

/**
 * POST /api/jobs/saved/toggle
 * Toggle save / unsave for a job
 */
router.post("/saved/toggle", async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const {
      jobId,
      id,
      title = "",
      company = "",
      location = "",
      salary = "",
      applyUrl = "",
      description = "",
      jobData = {},
    } = req.body || {};

    const effectiveJobId = String(jobId || id || applyUrl || `${title}-${company}`).trim();
    if (!effectiveJobId) {
      return res.status(400).json({ success: false, message: "Job ID or application URL is required" });
    }

    const existing = await SavedJob.findOne({
      userId: req.userId,
      jobId: effectiveJobId,
    });

    if (existing) {
      await SavedJob.deleteOne({ _id: existing._id });
      return res.json({
        success: true,
        saved: false,
        message: "Job removed from saved jobs",
        jobId: effectiveJobId,
      });
    }

    const newSavedJob = await SavedJob.create({
      userId: req.userId,
      jobId: effectiveJobId,
      title: String(title).trim(),
      company: String(company).trim(),
      location: String(location).trim(),
      salary: String(salary).trim(),
      applyUrl: String(applyUrl).trim(),
      description: String(description).trim(),
      applicationStatus: "Saved",
      jobData,
      savedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      saved: true,
      message: "Job saved successfully",
      job: newSavedJob,
    });
  } catch (error) {
    console.error("❌ Failed to toggle saved job:", error.message);
    return res.status(500).json({ success: false, message: "Failed to toggle saved job" });
  }
});

/**
 * PUT /api/jobs/saved/:jobId/status
 * Update application status of a saved job (Saved, Applied, Interview, Rejected)
 */
router.put("/saved/:jobId/status", async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const { jobId } = req.params;
    const { status } = req.body || {};

    const validStatuses = ["Saved", "Applied", "Interview", "Rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const updateFields = { applicationStatus: status };
    if (status === "Applied" || status === "Interview") {
      updateFields.appliedAt = new Date();
    }

    const updatedJob = await SavedJob.findOneAndUpdate(
      { userId: req.userId, jobId },
      { $set: updateFields },
      { new: true }
    );

    if (!updatedJob) {
      return res.status(404).json({ success: false, message: "Saved job not found" });
    }

    return res.json({
      success: true,
      message: `Job status updated to ${status}`,
      job: updatedJob,
    });
  } catch (error) {
    console.error("❌ Failed to update job status:", error.message);
    return res.status(500).json({ success: false, message: "Failed to update job status" });
  }
});

/**
 * DELETE /api/jobs/saved/:jobId
 * Remove a saved job
 */
router.delete("/saved/:jobId", async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const { jobId } = req.params;
    const deleted = await SavedJob.findOneAndDelete({
      userId: req.userId,
      jobId,
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Saved job not found" });
    }

    return res.json({
      success: true,
      message: "Job removed successfully",
      jobId,
    });
  } catch (error) {
    console.error("❌ Failed to remove saved job:", error.message);
    return res.status(500).json({ success: false, message: "Failed to remove job" });
  }
});

/**
 * POST /api/jobs/apply
 * Mark a job as applied
 */
router.post("/apply", async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const {
      jobId,
      id,
      title = "",
      company = "",
      location = "",
      salary = "",
      applyUrl = "",
      description = "",
      jobData = {},
    } = req.body || {};

    const effectiveJobId = String(jobId || id || applyUrl || `${title}-${company}`).trim();
    if (!effectiveJobId) {
      return res.status(400).json({ success: false, message: "Job ID or application URL is required" });
    }

    const job = await SavedJob.findOneAndUpdate(
      { userId: req.userId, jobId: effectiveJobId },
      {
        $set: {
          title: String(title).trim(),
          company: String(company).trim(),
          location: String(location).trim(),
          salary: String(salary).trim(),
          applyUrl: String(applyUrl).trim(),
          description: String(description).trim(),
          applicationStatus: "Applied",
          appliedAt: new Date(),
          jobData,
        },
        $setOnInsert: {
          userId: req.userId,
          jobId: effectiveJobId,
          savedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      message: "Job marked as applied",
      job,
    });
  } catch (error) {
    console.error("❌ Failed to mark job as applied:", error.message);
    return res.status(500).json({ success: false, message: "Failed to mark job as applied" });
  }
});

module.exports = router;
