const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    activityType: {
      type: String,
      required: true,
      index: true,
    },
    feature: {
      type: String,
      default: "",
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

activitySchema.index({ activityType: 1, createdAt: -1 });
activitySchema.index({ userId: 1, activityType: 1 });

module.exports = mongoose.model("Activity", activitySchema);
