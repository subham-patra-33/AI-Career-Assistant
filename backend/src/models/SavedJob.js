const mongoose = require("mongoose");

const savedJobSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    jobId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      default: "",
      trim: true,
    },
    company: {
      type: String,
      default: "",
      trim: true,
    },
    location: {
      type: String,
      default: "",
      trim: true,
    },
    salary: {
      type: String,
      default: "",
    },
    applyUrl: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    applicationStatus: {
      type: String,
      enum: ["Saved", "Applied", "Interview", "Rejected"],
      default: "Saved",
      index: true,
    },
    jobData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    savedAt: {
      type: Date,
      default: Date.now,
    },
    appliedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Unique index to prevent duplicate saves of the same job for a user
savedJobSchema.index({ userId: 1, jobId: 1 }, { unique: true });

module.exports = mongoose.model("SavedJob", savedJobSchema);
