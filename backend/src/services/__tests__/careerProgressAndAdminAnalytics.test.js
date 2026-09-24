// backend/src/services/__tests__/careerProgressAndAdminAnalytics.test.js
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
require("dotenv").config();

const assert = require("assert");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const config = require("../../config");
const { connectDB } = require("../../config/db");

const User = require("../../models/User");
const Resume = require("../../models/Resume");
const SavedJob = require("../../models/SavedJob");
const InterviewSession = require("../../models/InterviewSession");
const Activity = require("../../models/Activity");

const { logActivity, ACTIVITY_TYPES, getAdminStats } = require("../../services/activityService");
const adminController = require("../../controllers/adminController");

console.log("\n=======================================================");
console.log("RUNNING CAREER PROGRESS & ADMIN ANALYTICS VERIFICATION");
console.log("=======================================================\n");

let passed = 0;
let total = 0;

async function test(name, fn) {
  total++;
  process.stdout.write(`TEST ${total}: ${name} ... `);
  try {
    await fn();
    console.log("✅ PASSED");
    passed++;
  } catch (e) {
    console.log("❌ FAILED");
    console.error("   Error:", e.message);
  }
}

// Helper to simulate request/response for controllers
function mockReqRes({ userId = null, body = {}, params = {}, query = {}, headers = {} } = {}) {
  const req = {
    userId,
    user: userId ? { id: userId } : null,
    body,
    params,
    query,
    headers: {
      ...headers,
      ...(userId ? { authorization: `Bearer ${jwt.sign({ id: userId }, config.jwtSecret)}` } : {}),
    },
  };

  let statusCode = 200;
  let responseData = null;

  const res = {
    status(code) {
      statusCode = code;
      return res;
    },
    json(data) {
      responseData = data;
      return res;
    },
    getStatusCode() {
      return statusCode;
    },
    getResponseData() {
      return responseData;
    },
  };

  return { req, res };
}

async function runAll() {
  await connectDB();

  const timestamp = Date.now();
  let studentA = null;
  let studentB = null;
  let adminUser = null;

  try {
    // Setup clean test users
    studentA = await User.create({
      username: `test_student_a_${timestamp}`,
      name: "Student Alpha",
      role: "user",
      passwordHash: "dummyHash",
    });

    studentB = await User.create({
      username: `test_student_b_${timestamp}`,
      name: "Student Beta",
      role: "user",
      passwordHash: "dummyHash",
    });

    adminUser = await User.create({
      username: `test_admin_${timestamp}`,
      name: "Admin User",
      role: "admin",
      passwordHash: "dummyHash",
    });

    // Helper for Career Progress calculation endpoint logic
    async function getCareerProgressForUser(uid) {
      const [
        resumesCreated,
        jobsSaved,
        applications,
        interviews,
        latestInterview,
        hasSkillGapActivity,
        hasSkillGapResume,
      ] = await Promise.all([
        Resume.countDocuments({ userId: uid }),
        SavedJob.countDocuments({ userId: uid }),
        SavedJob.countDocuments({
          userId: uid,
          applicationStatus: { $in: ["Applied", "Interview"] },
        }),
        InterviewSession.countDocuments({ userId: uid }),
        InterviewSession.findOne({ userId: uid }).sort({ createdAt: -1 }).lean(),
        Activity.exists({ userId: uid, activityType: ACTIVITY_TYPES.SKILL_GAP_ANALYSIS }),
        Resume.exists({ userId: uid, "data.skillGapAnalysis": { $exists: true } }),
      ]);

      const interviewScore = latestInterview ? Number(latestInterview.score) || 0 : 0;
      const skillGapStatus = hasSkillGapActivity || hasSkillGapResume ? "Completed" : "Pending";

      let completedSteps = 0;
      if (resumesCreated > 0) completedSteps++;
      if (skillGapStatus === "Completed") completedSteps++;
      if (interviews > 0 || interviewScore > 0) completedSteps++;
      if (applications > 0 || jobsSaved > 0) completedSteps++;

      const overallProgress = Math.round((completedSteps / 4) * 100);

      return {
        resumesCreated,
        jobsSaved,
        applications,
        interviews,
        overallProgress,
        interviewScore,
        skillGapStatus,
      };
    }

    // 1. New student starts with strictly zero values and 0% overall progress
    await test("New student has zero counts and 0% overall progress", async () => {
      const progress = await getCareerProgressForUser(studentA._id);
      assert.strictEqual(progress.resumesCreated, 0, "resumesCreated must be 0");
      assert.strictEqual(progress.jobsSaved, 0, "jobsSaved must be 0");
      assert.strictEqual(progress.applications, 0, "applications must be 0");
      assert.strictEqual(progress.interviews, 0, "interviews must be 0");
      assert.strictEqual(progress.overallProgress, 0, "overallProgress must be 0%");
      assert.strictEqual(progress.interviewScore, 0, "interviewScore must be 0");
      assert.strictEqual(progress.skillGapStatus, "Pending", "skillGapStatus must be Pending");
    });

    // 2. Student creates 1 resume -> resumesCreated = 1, progress = 25%
    await test("Student creates first resume -> resumesCreated = 1, overallProgress = 25%", async () => {
      await Resume.create({
        userId: studentA._id,
        title: "Frontend Developer Resume",
        templateId: "modern-minimal",
        data: { fullName: "Student Alpha" },
      });
      await logActivity(studentA._id, ACTIVITY_TYPES.RESUME_CREATED, "resume");

      const progress = await getCareerProgressForUser(studentA._id);
      assert.strictEqual(progress.resumesCreated, 1, "resumesCreated must be 1");
      assert.strictEqual(progress.overallProgress, 25, "overallProgress must be 25%");
    });

    // 3. Student creates 2nd resume -> resumesCreated = 2
    await test("Student creates second resume -> resumesCreated = 2", async () => {
      await Resume.create({
        userId: studentA._id,
        title: "Full Stack Engineer Resume",
        templateId: "simple-ats",
        data: { fullName: "Student Alpha" },
      });
      await logActivity(studentA._id, ACTIVITY_TYPES.RESUME_CREATED, "resume");

      const progress = await getCareerProgressForUser(studentA._id);
      assert.strictEqual(progress.resumesCreated, 2, "resumesCreated must be 2");
    });

    // 4. Student saves a job -> jobsSaved = 1
    await test("Student saves a job -> jobsSaved = 1", async () => {
      await SavedJob.create({
        userId: studentA._id,
        jobId: `job_123_${timestamp}`,
        title: "React Developer",
        company: "Acme Corp",
        location: "Remote",
        applicationStatus: "Saved",
      });

      const progress = await getCareerProgressForUser(studentA._id);
      assert.strictEqual(progress.jobsSaved, 1, "jobsSaved must be 1");
      assert.strictEqual(progress.overallProgress, 50, "overallProgress must now be 50%");
    });

    // 5. Student applies to a job -> applications = 1
    await test("Student applies to a job -> applications = 1", async () => {
      await SavedJob.create({
        userId: studentA._id,
        jobId: `job_456_${timestamp}`,
        title: "Node.js Developer",
        company: "Beta Systems",
        location: "New York",
        applicationStatus: "Applied",
        appliedAt: new Date(),
      });

      const progress = await getCareerProgressForUser(studentA._id);
      assert.strictEqual(progress.applications, 1, "applications must be 1");
    });

    // 6. Student completes AI Mock Interview -> interviews = 1, interviewScore updated
    await test("Student completes AI Mock Interview -> interviews = 1", async () => {
      await InterviewSession.create({
        userId: studentA._id,
        mode: "ai",
        role: "Full Stack Developer",
        difficulty: "Medium",
        questionCount: 5,
        score: 82,
      });
      await logActivity(studentA._id, ACTIVITY_TYPES.AI_MOCK_INTERVIEW_COMPLETED, "interview", {
        score: 82,
      });

      const progress = await getCareerProgressForUser(studentA._id);
      assert.strictEqual(progress.interviews, 1, "interviews must be 1");
      assert.strictEqual(progress.interviewScore, 82, "interviewScore must be 82");
      assert.strictEqual(progress.overallProgress, 75, "overallProgress must now be 75%");
    });

    // 7. Student completes Question Bank Interview -> interviews = 2
    await test("Student completes Question Bank Interview -> interviews = 2", async () => {
      await InterviewSession.create({
        userId: studentA._id,
        mode: "question-bank",
        role: "Full Stack Developer",
        difficulty: "Hard",
        questionCount: 5,
        score: 91,
      });
      await logActivity(studentA._id, ACTIVITY_TYPES.QUESTION_BANK_INTERVIEW_COMPLETED, "interview", {
        score: 91,
      });

      const progress = await getCareerProgressForUser(studentA._id);
      assert.strictEqual(progress.interviews, 2, "interviews must be 2");
      assert.strictEqual(progress.interviewScore, 91, "latest interviewScore must be 91");
    });

    // 8. Student performs Skill Gap Analysis -> skillGapStatus = Completed, overallProgress = 100%
    await test("Skill Gap Analysis completes all 4 pillars -> overallProgress = 100%", async () => {
      await logActivity(studentA._id, ACTIVITY_TYPES.SKILL_GAP_ANALYSIS, "skillGap", {
        targetRole: "Full Stack Developer",
      });

      const progress = await getCareerProgressForUser(studentA._id);
      assert.strictEqual(progress.skillGapStatus, "Completed", "skillGapStatus must be Completed");
      assert.strictEqual(progress.overallProgress, 100, "overallProgress must be 100%");
    });

    // 9. Page refresh preserves all data from MongoDB
    await test("Page refresh preserves exact career progress values from MongoDB", async () => {
      // Fetching again simulates browser reload / new GET request
      const progress = await getCareerProgressForUser(studentA._id);
      assert.strictEqual(progress.resumesCreated, 2);
      assert.strictEqual(progress.jobsSaved, 2); // 1 Saved + 1 Applied
      assert.strictEqual(progress.applications, 1);
      assert.strictEqual(progress.interviews, 2);
      assert.strictEqual(progress.interviewScore, 91);
      assert.strictEqual(progress.skillGapStatus, "Completed");
      assert.strictEqual(progress.overallProgress, 100);
    });

    // 10. Strict User Isolation: Student B only sees Student B's data
    await test("Strict User Isolation: Student B sees zero data despite Student A's activity", async () => {
      const progressB = await getCareerProgressForUser(studentB._id);
      assert.strictEqual(progressB.resumesCreated, 0, "Student B resumes must be 0");
      assert.strictEqual(progressB.jobsSaved, 0, "Student B jobsSaved must be 0");
      assert.strictEqual(progressB.applications, 0, "Student B applications must be 0");
      assert.strictEqual(progressB.interviews, 0, "Student B interviews must be 0");
      assert.strictEqual(progressB.overallProgress, 0, "Student B overallProgress must be 0%");
      assert.strictEqual(progressB.interviewScore, 0, "Student B interviewScore must be 0");
      assert.strictEqual(progressB.skillGapStatus, "Pending", "Student B skillGapStatus must be Pending");
    });

    // 11. Admin Analytics: Activity tracking logs and increments real DB counters
    await test("Admin Analytics aggregates real activity counters correctly", async () => {
      // Simulate platform operations
      await logActivity(studentA._id, ACTIVITY_TYPES.STUDENT_LOGIN, "auth");
      await logActivity(studentA._id, ACTIVITY_TYPES.ATS_ANALYSIS, "ats");
      await logActivity(studentA._id, ACTIVITY_TYPES.JOB_MATCH, "jobMatch");
      await logActivity(studentA._id, ACTIVITY_TYPES.AI_MOCK_INTERVIEW_STARTED, "interview");
      await logActivity(studentA._id, ACTIVITY_TYPES.QUESTION_BANK_INTERVIEW_STARTED, "interview");
      await logActivity(studentA._id, ACTIVITY_TYPES.CAREER_ASSISTANT_USED, "careerAssistant");

      const stats = await getAdminStats();
      assert.ok(stats.totalStudents >= 2, "totalStudents must count real registered students");
      assert.ok(stats.totalLogins >= 1, "totalLogins must count logged in activities");
      assert.ok(stats.resumesCreated >= 2, "resumesCreated must count real resumes");
      assert.ok(stats.atsUsage >= 1, "atsUsage must count ATS analyses");
      assert.ok(stats.jobMatchUsage >= 1, "jobMatchUsage must count Job Matches");
      assert.ok(stats.aiInterviewUsage >= 1, "aiInterviewUsage must count AI interviews started");
      assert.ok(stats.aiInterviewCompleted >= 1, "aiInterviewCompleted must count AI interviews completed");
      assert.ok(stats.questionBankUsage >= 1, "questionBankUsage must count QB interviews started");
      assert.ok(stats.questionBankCompleted >= 1, "questionBankCompleted must count QB interviews completed");
      assert.ok(stats.careerAssistantUsage >= 1, "careerAssistantUsage must count Career Assistant usage");
      assert.ok(stats.skillGapUsage >= 1, "skillGapUsage must count Skill Gap analyses");
    });

    // 12. Admin Users list includes lastLogin and resumeCount
    await test("Admin listUsersWithResumeCounts returns lastLogin and resume counts", async () => {
      const { req, res } = mockReqRes();
      await adminController.listUsersWithResumeCounts(req, res);

      const usersList = res.getResponseData();
      assert.ok(Array.isArray(usersList), "Expected users array");

      const userA = usersList.find((u) => String(u.id) === String(studentA._id));
      assert.ok(userA, "Student A must exist in admin user list");
      assert.strictEqual(userA.resumeCount, 2, "Student A resumeCount must be 2");
      assert.ok("lastLogin" in userA, "User record must have lastLogin field");
    });

  } finally {
    // Cleanup test artifacts
    if (studentA?._id) {
      await Promise.all([
        User.deleteOne({ _id: studentA._id }),
        Resume.deleteMany({ userId: studentA._id }),
        SavedJob.deleteMany({ userId: studentA._id }),
        InterviewSession.deleteMany({ userId: studentA._id }),
        Activity.deleteMany({ userId: studentA._id }),
      ]);
    }
    if (studentB?._id) {
      await Promise.all([
        User.deleteOne({ _id: studentB._id }),
        Resume.deleteMany({ userId: studentB._id }),
        SavedJob.deleteMany({ userId: studentB._id }),
        InterviewSession.deleteMany({ userId: studentB._id }),
        Activity.deleteMany({ userId: studentB._id }),
      ]);
    }
    if (adminUser?._id) {
      await User.deleteOne({ _id: adminUser._id });
    }

    await mongoose.disconnect();
  }

  console.log(`\n-------------------------------------------------------`);
  console.log(`RESULTS: ${passed} / ${total} TESTS PASSED`);
  console.log(`-------------------------------------------------------\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runAll().catch((err) => {
  console.error("FATAL TEST SUITE ERROR:", err);
  process.exit(1);
});
