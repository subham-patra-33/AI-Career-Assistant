const mongoose = require("mongoose");
const Activity = require("../models/Activity");
const User = require("../models/User");
const Resume = require("../models/Resume");
const InterviewSession = require("../models/InterviewSession");

/**
 * Standard Activity Types
 */
const ACTIVITY_TYPES = {
  STUDENT_REGISTERED: "STUDENT_REGISTERED",
  STUDENT_LOGIN: "STUDENT_LOGIN",
  RESUME_CREATED: "RESUME_CREATED",
  ATS_ANALYSIS: "ATS_ANALYSIS",
  JOB_MATCH: "JOB_MATCH",
  AI_MOCK_INTERVIEW_STARTED: "AI_MOCK_INTERVIEW_STARTED",
  AI_MOCK_INTERVIEW_COMPLETED: "AI_MOCK_INTERVIEW_COMPLETED",
  QUESTION_BANK_INTERVIEW_STARTED: "QUESTION_BANK_INTERVIEW_STARTED",
  QUESTION_BANK_INTERVIEW_COMPLETED: "QUESTION_BANK_INTERVIEW_COMPLETED",
  CAREER_ASSISTANT_USED: "CAREER_ASSISTANT_USED",
  SKILL_GAP_ANALYSIS: "SKILL_GAP_ANALYSIS",
};

/**
 * Log an activity record in MongoDB
 * Non-blocking, safe execution that never disrupts the calling feature
 */
async function logActivity(userId, activityType, feature = "", metadata = {}) {
  try {
    if (!activityType) return null;

    let validUserId = null;
    if (userId && mongoose.isValidObjectId(userId)) {
      validUserId = userId;
    }

    if (mongoose.connection.readyState !== 1) {
      return null;
    }

    const activity = await Activity.create({
      userId: validUserId,
      activityType,
      feature: feature || "",
      metadata: metadata || {},
      createdAt: new Date(),
    });

    return activity;
  } catch (err) {
    console.error(`⚠️ [ActivityService] Failed to log ${activityType}:`, err.message);
    return null;
  }
}

/**
 * Get aggregated statistics for the Admin Analytics Dashboard
 */
async function getAdminStats() {
  const [
    totalStudents,
    totalAdmins,
    totalLogins,
    resumesCreated,
    atsUsage,
    jobMatchUsage,
    aiInterviewUsage,
    aiInterviewCompleted,
    questionBankUsage,
    questionBankCompleted,
    careerAssistantUsage,
    skillGapUsage,
    totalResumes,
  ] = await Promise.all([
    User.countDocuments({ role: { $ne: "admin" } }),
    User.countDocuments({ role: "admin" }),
    Activity.countDocuments({ activityType: ACTIVITY_TYPES.STUDENT_LOGIN }),
    Activity.countDocuments({ activityType: ACTIVITY_TYPES.RESUME_CREATED }),
    Activity.countDocuments({ activityType: ACTIVITY_TYPES.ATS_ANALYSIS }),
    Activity.countDocuments({ activityType: ACTIVITY_TYPES.JOB_MATCH }),
    Activity.countDocuments({ activityType: ACTIVITY_TYPES.AI_MOCK_INTERVIEW_STARTED }),
    Activity.countDocuments({ activityType: ACTIVITY_TYPES.AI_MOCK_INTERVIEW_COMPLETED }),
    Activity.countDocuments({ activityType: ACTIVITY_TYPES.QUESTION_BANK_INTERVIEW_STARTED }),
    Activity.countDocuments({ activityType: ACTIVITY_TYPES.QUESTION_BANK_INTERVIEW_COMPLETED }),
    Activity.countDocuments({ activityType: ACTIVITY_TYPES.CAREER_ASSISTANT_USED }),
    Activity.countDocuments({ activityType: ACTIVITY_TYPES.SKILL_GAP_ANALYSIS }),
    Resume.countDocuments(),
  ]);

  return {
    totalStudents,
    totalAdmins,
    totalLogins,
    resumesCreated: Math.max(resumesCreated, totalResumes),
    atsUsage,
    jobMatchUsage,
    aiInterviewUsage,
    aiInterviewCompleted,
    questionBankUsage,
    questionBankCompleted,
    careerAssistantUsage,
    skillGapUsage,
    totalResumes,
  };
}

module.exports = {
  ACTIVITY_TYPES,
  logActivity,
  getAdminStats,
};
