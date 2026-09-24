const express = require("express");
const router = express.Router();

const multer = require("multer");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const https = require("https");

const Resume = require("../models/Resume");
const auth = require("../middleware/auth");

const {
  callGemini,
  generateSuggestions,
  generateGeminiJSON,
} = require("../utils/gemini");
const aiService = require("../services/aiService");
const questionBankService = require("../services/questionBankService");
const InterviewSession = require("../models/InterviewSession");
const { logActivity, ACTIVITY_TYPES } = require("../services/activityService");

router.use(auth);

// ============================================================
// UPLOAD CONFIGURATION
// ============================================================

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const name = String(file.originalname || "").toLowerCase();
    const mime = String(file.mimetype || "").toLowerCase();

    if (
      mime === "application/pdf" ||
      name.endsWith(".pdf")
    ) {
      return cb(null, true);
    }

    cb(new Error("Only PDF resume files are supported."));
  },
});

const atsUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ============================================================
// HELPERS
// ============================================================

function safeString(value, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.trim();
}

function safeArray(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item == null) return "";
      return String(item).trim();
    })
    .filter(Boolean);
}

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, n));
}

function normalizeResumeTitle(data = {}) {
  const name =
    safeString(data.fullName) ||
    safeString(data.name) ||
    "My";

  const role =
    safeString(data.targetRole) ||
    safeString(data.role) ||
    "Professional";

  return `${name}'s ${role} Resume`;
}

function normalizeProviderError(error) {
  const message = String(error?.message || error || "");
  const lower = message.toLowerCase();

  if (
    error?.code === "GEMINI_QUOTA" ||
    error?.status === 429 ||
    lower.includes("quota") ||
    lower.includes("rate limit") ||
    lower.includes("resource exhausted")
  ) {
    return {
      status: 429,
      code: "GEMINI_QUOTA",
      message:
        "Gemini API quota or rate limit has been reached.",
    };
  }

  if (
    error?.code === "GEMINI_AUTH" ||
    error?.status === 401 ||
    lower.includes("api key") ||
    lower.includes("unauthorized") ||
    lower.includes("permission denied")
  ) {
    return {
      status: 401,
      code: "GEMINI_AUTH",
      message:
        "Gemini API authentication failed. Check the backend Gemini API configuration.",
    };
  }

  if (
    error?.code === "GEMINI_MODEL" ||
    lower.includes("model not found") ||
    lower.includes("not found")
  ) {
    return {
      status: 502,
      code: "GEMINI_MODEL",
      message:
        "The configured Gemini model is unavailable.",
    };
  }

  if (
    error?.code === "GEMINI_TIMEOUT" ||
    lower.includes("timeout") ||
    lower.includes("timed out")
  ) {
    return {
      status: 504,
      code: "GEMINI_TIMEOUT",
      message:
        "Gemini took too long to respond.",
    };
  }

  return {
    status: Number.isInteger(error?.status)
      ? error.status
      : 500,
    code:
      error?.code ||
      "AI_GENERATION_FAILED",
    message:
      message ||
      "The AI request failed.",
  };
}

function requestJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const request = https.request(
      url,
      {
        method: options.method || "GET",
        headers: options.headers || {},
        family: options.family || 6,
        timeout: options.timeout || 30000,
      },
      (response) => {
        let body = "";

        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });

        response.on("end", () => {
          let parsed = null;

          try {
            parsed = JSON.parse(body);
          } catch {
            parsed = null;
          }

          if (
            response.statusCode < 200 ||
            response.statusCode >= 300
          ) {
            const error = new Error(
              parsed?.display_name ||
                parsed?.message ||
                `HTTP ${response.statusCode}`
            );
            error.status = response.statusCode;
            error.body = parsed || body;
            return reject(error);
          }

          resolve(parsed || {});
        });
      }
    );

    request.on("timeout", () => {
      request.destroy(
        new Error("Adzuna request timed out.")
      );
    });

    request.on("error", reject);
    request.end();
  });
}

function getAdzunaCredentials() {
  const appId =
    process.env.ADZUNA_APP_ID ||
    process.env.ADZUNA_ID;

  const appKey =
    process.env.ADZUNA_APP_KEY ||
    process.env.ADZUNA_KEY;

  const country =
    process.env.ADZUNA_COUNTRY ||
    "in";

  if (!appId || !appKey) {
    throw new Error(
      "Adzuna credentials are missing. Set ADZUNA_APP_ID and ADZUNA_APP_KEY in backend/.env."
    );
  }

  return {
    appId,
    appKey,
    country,
  };
}

async function requestAdzuna(params = {}) {
  const { appId, appKey, country } =
    getAdzunaCredentials();

  const page = Math.max(
    1,
    Number(params.page) || 1
  );

  const limit = Math.min(
    50,
    Math.max(1, Number(params.limit) || 20)
  );

  const query =
    safeString(params.query) ||
    safeString(params.role) ||
    safeString(params.targetRole) ||
    safeString(params.search) ||
    safeString(params.title) ||
    "software developer";

  const where = safeString(params.location);

  const search = new URLSearchParams();
  search.set("app_id", appId);
  search.set("app_key", appKey);
  search.set("results_per_page", String(limit));
  search.set("what", query);

  if (where) search.set("where", where);

  if (params.sort) {
    const allowed = [
      "relevance",
      "date",
      "salary",
    ];

    if (allowed.includes(params.sort)) {
      search.set("sort_by", params.sort);
    }
  }

  if (params.postedWithin) {
    const days = Number(params.postedWithin);
    if (Number.isFinite(days) && days > 0) {
      search.set("max_days_old", String(days));
    }
  }

  const fullTime =
    params.jobType === "full_time" ||
    params.jobType === "full-time";

  const partTime =
    params.jobType === "part_time" ||
    params.jobType === "part-time";

  const contract =
    params.jobType === "contract";

  const permanent =
    params.jobType === "permanent";

  if (fullTime) search.set("full_time", "1");
  if (partTime) search.set("part_time", "1");
  if (contract) search.set("contract", "1");
  if (permanent) search.set("permanent", "1");

  const url =
    `https://api.adzuna.com/v1/api/jobs/${encodeURIComponent(country)}/search/${page}?${search.toString()}`;

  return requestJson(url, {
    family: 6,
    timeout: 30000,
    headers: {
      Accept: "application/json",
      "User-Agent": "AI-Resume-Generator/1.0",
    },
  });
}

function normalizeJob(job = {}) {
  const redirectUrl =
    job.redirect_url ||
    job.redirectUrl ||
    job.url ||
    "";

  return {
    id:
      job.id != null
        ? String(job.id)
        : redirectUrl,

    title:
      safeString(job.title) ||
      "Untitled job",

    company:
      safeString(job.company?.display_name) ||
      safeString(job.company?.name) ||
      "Company not specified",

    location:
      safeString(job.location?.display_name) ||
      safeString(job.location?.area?.join?.(", ")) ||
      "Location not specified",

    description:
      safeString(job.description),

    url: redirectUrl,

    salaryMin:
      Number.isFinite(Number(job.salary_min))
        ? Number(job.salary_min)
        : null,

    salaryMax:
      Number.isFinite(Number(job.salary_max))
        ? Number(job.salary_max)
        : null,

    salaryPeriod:
      safeString(job.salary_is_predicted)
        ? "predicted"
        : "",

    created:
      job.created || null,

    category:
      safeString(job.category?.label) ||
      safeString(job.category?.tag),

    contractType:
      safeString(job.contract_type),

    contractTime:
      safeString(job.contract_time),

    provider: "Adzuna",
  };
}

// ============================================================
// IMPORT EXISTING RESUME PDF
// ============================================================

router.post(
  "/parse-resume-file",
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No resume file was uploaded.",
        });
      }

      const pdf = await pdfParse(req.file.buffer);
      const resumeText = String(pdf.text || "").trim();

      if (!resumeText) {
        return res.status(422).json({
          success: false,
          error:
            "The PDF does not contain readable text. Please upload a text-based PDF.",
        });
      }

      if (resumeText.length < 50) {
        return res.status(422).json({
          success: false,
          error:
            "The PDF contains too little readable text to analyze.",
        });
      }

      const prompt = `
You are a professional resume parser.

Extract only information actually present in this resume.
Never invent companies, education, jobs, dates, skills, projects,
certifications, achievements or contact information.
If something is missing, return an empty string or empty array.
Return ONLY valid JSON.

RESUME TEXT:
------------------------
${resumeText.slice(0, 60000)}
------------------------
`;

      const parsedResume =
        await generateGeminiJSON(
          prompt,
          {
            type: "object",
            properties: {
              name: { type: "string" },
              contact: {
                type: "object",
                properties: {
                  email: { type: "string" },
                  phone: { type: "string" },
                  location: { type: "string" },
                  linkedin: { type: "string" },
                  github: { type: "string" },
                },
                required: [
                  "email",
                  "phone",
                  "location",
                  "linkedin",
                  "github",
                ],
              },
              targetRole: { type: "string" },
              summary: { type: "string" },
              skills: {
                type: "array",
                items: { type: "string" },
              },
              experience: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    company: { type: "string" },
                    role: { type: "string" },
                    duration: { type: "string" },
                    bullets: {
                      type: "array",
                      items: { type: "string" },
                    },
                  },
                  required: [
                    "company",
                    "role",
                    "duration",
                    "bullets",
                  ],
                },
              },
              projects: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    technologies: {
                      type: "array",
                      items: { type: "string" },
                    },
                  },
                  required: [
                    "name",
                    "description",
                    "technologies",
                  ],
                },
              },
              education: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    institution: { type: "string" },
                    degree: { type: "string" },
                    duration: { type: "string" },
                  },
                  required: [
                    "institution",
                    "degree",
                    "duration",
                  ],
                },
              },
              certifications: {
                type: "array",
                items: { type: "string" },
              },
              achievements: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: [
              "name",
              "contact",
              "targetRole",
              "summary",
              "skills",
              "experience",
              "projects",
              "education",
              "certifications",
              "achievements",
            ],
          },
          {
            timeout: 60000,
            temperature: 0.1,
          }
        );

      return res.json({
        success: true,
        resume: parsedResume,
        text: resumeText,
        fileName: req.file.originalname || "resume.pdf",
      });
    } catch (error) {
      console.error(
        "❌ Resume PDF Import Error:",
        error
      );

      const provider = normalizeProviderError(error);

      return res.status(provider.status).json({
        success: false,
        code: provider.code,
        error: provider.message,
        message: provider.message,
      });
    }
  }
);

// ============================================================
// AI RESUME GENERATION + MONGODB SAVE
// ============================================================

router.post(
  "/generate",
  async (req, res) => {
    try {
      const {
        data,
        resumeId = null,
      } = req.body || {};

      if (!req.userId) {
        return res.status(401).json({
          success: false,
          code: "AUTH_REQUIRED",
          message:
            "Please log in before generating or saving a resume.",
        });
      }

      if (!data || typeof data !== "object") {
        return res.status(400).json({
          success: false,
          code: "INVALID_RESUME_DATA",
          message: "Missing or invalid resume data.",
        });
      }

      console.log(
        "📝 AI Resume generation started for:",
        data.fullName || "Unknown candidate"
      );

      const generatedResume =
        await callGemini(data);

      if (
        !generatedResume ||
        typeof generatedResume !== "object"
      ) {
        return res.status(502).json({
          success: false,
          code: "INVALID_AI_RESPONSE",
          message:
            "Gemini returned an invalid resume response.",
        });
      }

      const title = normalizeResumeTitle({
        ...data,
        ...generatedResume,
      });

      const templateId =
        safeString(data.templateId) ||
        safeString(data.template) ||
        "simple-ats";

      const resumeData = {
        ...generatedResume,
        templateId,
        template: templateId,
      };

      let savedResume;

      if (resumeId) {
        savedResume =
          await Resume.findOneAndUpdate(
            {
              _id: resumeId,
              userId: req.userId,
            },
            {
              $set: {
                title,
                templateId,
                data: resumeData,
              },
            },
            {
              new: true,
              runValidators: true,
            }
          );

        if (!savedResume) {
          return res.status(404).json({
            success: false,
            code: "RESUME_NOT_FOUND",
            message:
              "Resume not found or you do not have permission to edit it.",
          });
        }

        console.log(
          "✅ Resume updated in MongoDB:",
          savedResume._id.toString()
        );
      } else {
        savedResume = await Resume.create({
          userId: req.userId,
          title,
          templateId,
          data: resumeData,
        });

        console.log(
          "✅ New resume saved in MongoDB:",
          savedResume._id.toString()
        );

        logActivity(req.userId, ACTIVITY_TYPES.RESUME_CREATED, "resume", {
          resumeId: savedResume._id,
          templateId,
        });
      }

      return res.status(resumeId ? 200 : 201).json({
        success: true,
        resume: savedResume.data,
        resumeId: savedResume._id,
        savedResume,
      });
    } catch (error) {
      console.error(
        "❌ AI Resume Error:",
        error
      );

      const provider = normalizeProviderError(error);

      return res.status(provider.status).json({
        success: false,
        code: provider.code,
        message: provider.message,
      });
    }
  }
);

// ============================================================
// AI SUGGESTIONS
// ============================================================

router.post(
  "/suggestions",
  async (req, res) => {
    try {
      if (typeof generateSuggestions !== "function") {
        return res.status(501).json({
          success: false,
          message:
            "AI suggestions are not configured in gemini.js.",
        });
      }

      const suggestions =
        await generateSuggestions(req.body || {});

      return res.json({
        success: true,
        suggestions,
      });
    } catch (error) {
      console.error(
        "❌ AI Suggestions Error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          error?.message ||
          "AI suggestions failed",
      });
    }
  }
);

// ============================================================
// MOCK INTERVIEW START
// ============================================================

router.post(
  ["/mock-interview", "/mock-interview/start"],
  async (req, res) => {
    try {
      const mode = (req.body?.mode || "").toLowerCase();

      if (mode === "question-bank") {
        // Question Bank mode: Curated role-based questions without AI API (Section 1, 2, 4)
        const response = await questionBankService.selectQuestions({
          ...req.body,
          userId: req.userId,
        });
        logActivity(req.userId, ACTIVITY_TYPES.QUESTION_BANK_INTERVIEW_STARTED, "interview", {
          role: req.body?.role,
          difficulty: req.body?.difficulty,
        });
        return res.json(response);
      }

      // AI mode (default): Gemini with Grok fallback
      const response = await aiService.generateInterviewQuestions(req.body || {});
      logActivity(req.userId, ACTIVITY_TYPES.AI_MOCK_INTERVIEW_STARTED, "interview", {
        role: req.body?.role,
        difficulty: req.body?.difficulty,
      });
      return res.json({
        ...response,
        mode: "ai",
      });
    } catch (error) {
      console.error("❌ Mock Interview Error:", error);

      const status = error.status || 500;
      return res.status(status).json({
        success: false,
        code: error.code || "MOCK_INTERVIEW_ERROR",
        error: error.message || "Mock interview generation failed",
        message: error.message || "Mock interview generation failed",
      });
    }
  }
);

// ============================================================
// MOCK INTERVIEW EVALUATION
// ============================================================

router.post(
  ["/evaluate-interview", "/mock-interview/evaluate"],
  async (req, res) => {
    try {
      const mode = (req.body?.mode || "").toLowerCase();

      if (mode === "question-bank" || req.body?.questionId || req.body?.useAI === false) {
        // Question Bank mode: deterministic local evaluation (or optional AI if requested)
        const response = await questionBankService.evaluateAnswer(req.body || {});
        return res.json(response);
      }

      // AI mode: Gemini with Grok fallback
      const response = await aiService.evaluateInterviewAnswer(req.body || {});
      return res.json({
        ...response,
        mode: "ai",
      });
    } catch (error) {
      console.error("❌ Interview Evaluation Error:", error);

      const status = error.status || 500;
      return res.status(status).json({
        success: false,
        code: error.code || "EVALUATION_ERROR",
        error: error.message || "Interview evaluation failed",
        message: error.message || "Interview evaluation failed",
      });
    }
  }
);

// ============================================================
// MOCK INTERVIEW SAVE & CAREER PROGRESS
// ============================================================

router.post(
  ["/save-interview", "/mock-interview/save"],
  async (req, res) => {
    try {
      const response = await questionBankService.saveInterviewSession({
        ...req.body,
        userId: req.userId,
      });

      const mode = (req.body?.mode || "").toLowerCase();
      if (mode === "question-bank") {
        logActivity(req.userId, ACTIVITY_TYPES.QUESTION_BANK_INTERVIEW_COMPLETED, "interview", {
          role: req.body?.role,
          score: req.body?.score,
        });
      } else {
        logActivity(req.userId, ACTIVITY_TYPES.AI_MOCK_INTERVIEW_COMPLETED, "interview", {
          role: req.body?.role,
          score: req.body?.score,
        });
      }

      return res.json(response);
    } catch (error) {
      console.error("❌ Save Interview Error:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to save interview result",
      });
    }
  }
);

router.get("/interview-latest-score", async (req, res) => {
  try {
    if (!req.userId) {
      return res.json({ success: true, score: null });
    }
    const latest = await InterviewSession.findOne({ userId: req.userId })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({
      success: true,
      score: latest ? latest.score : null,
      mode: latest ? latest.mode : null,
      createdAt: latest ? latest.createdAt : null,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// CAREER RECOMMENDATIONS
// ============================================================

router.post(
  ["/career-recommendations", "/career-recommendation"],
  async (req, res) => {
    try {
      const response = await aiService.generateCareerRecommendations(req.body || {});
      logActivity(req.userId, ACTIVITY_TYPES.CAREER_ASSISTANT_USED, "careerAssistant");
      return res.json(response);
    } catch (error) {
      console.error("❌ Career Recommendations Error:", error);

      const status = error.status || 500;
      return res.status(status).json({
        success: false,
        code: error.code || "CAREER_RECOMMENDATIONS_ERROR",
        error: error.message || "Failed to generate career recommendations",
        message: error.message || "Failed to generate career recommendations",
      });
    }
  }
);

// ============================================================
// JOB MATCH ANALYSIS
// ============================================================

router.post(
  "/job-match",
  async (req, res) => {
    try {
      const {
        targetRole,
        jobDescription,
        resume,
      } = req.body || {};

      if (!safeString(targetRole)) {
        return res.status(400).json({
          success: false,
          message: "Target job title is required.",
        });
      }

      if (!safeString(jobDescription)) {
        return res.status(400).json({
          success: false,
          message: "Job description is required.",
        });
      }

      if (!safeString(resume)) {
        return res.status(400).json({
          success: false,
          message: "Resume content is required.",
        });
      }

      const prompt = `
Compare the candidate resume with the job description.
Return ONLY valid JSON.
Do not invent candidate experience or skills.

TARGET ROLE:
${targetRole}

JOB DESCRIPTION:
${jobDescription.slice(0, 50000)}

RESUME:
${resume.slice(0, 50000)}
`;

      const result =
        await generateGeminiJSON(
          prompt,
          {
            type: "object",
            properties: {
              score: { type: "number" },
              summary: { type: "string" },
              breakdown: {
                type: "object",
                properties: {
                  skills: { type: "number" },
                  experience: { type: "number" },
                  education: { type: "number" },
                  keywords: { type: "number" },
                },
                required: [
                  "skills",
                  "experience",
                  "education",
                  "keywords",
                ],
              },
              matchedSkills: {
                type: "array",
                items: { type: "string" },
              },
              missingSkills: {
                type: "array",
                items: { type: "string" },
              },
              requiredKeywords: {
                type: "array",
                items: { type: "string" },
              },
              preferredKeywords: {
                type: "array",
                items: { type: "string" },
              },
              experienceGaps: {
                type: "array",
                items: { type: "string" },
              },
              improvements: {
                type: "array",
                items: { type: "string" },
              },
              interviewTopics: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: [
              "score",
              "summary",
              "breakdown",
              "matchedSkills",
              "missingSkills",
              "requiredKeywords",
              "preferredKeywords",
              "experienceGaps",
              "improvements",
              "interviewTopics",
            ],
          },
          { temperature: 0.2, timeout: 90000 }
        );

      logActivity(req.userId, ACTIVITY_TYPES.JOB_MATCH, "jobMatch", {
        targetRole,
      });

      return res.json({
        success: true,
        score: safeNumber(result?.score),
        summary: safeString(result?.summary),
        breakdown: {
          skills: safeNumber(result?.breakdown?.skills),
          experience: safeNumber(result?.breakdown?.experience),
          education: safeNumber(result?.breakdown?.education),
          keywords: safeNumber(result?.breakdown?.keywords),
        },
        matchedSkills: safeArray(result?.matchedSkills),
        missingSkills: safeArray(result?.missingSkills),
        requiredKeywords: safeArray(result?.requiredKeywords),
        preferredKeywords: safeArray(result?.preferredKeywords),
        experienceGaps: safeArray(result?.experienceGaps),
        improvements: safeArray(result?.improvements),
        interviewTopics: safeArray(result?.interviewTopics),
      });
    } catch (error) {
      console.error("❌ Job Match Error:", error);

      return res.status(500).json({
        success: false,
        message:
          "Unable to analyze the job match right now.",
        error:
          process.env.NODE_ENV === "development"
            ? error?.message
            : undefined,
      });
    }
  }
);

// ============================================================
// ATS RESUME ANALYSIS
// ============================================================

router.post(
  "/ats",
  atsUpload.fields([
    { name: "file", maxCount: 1 },
    { name: "resume", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const file =
        req.files?.file?.[0] ||
        req.files?.resume?.[0];

      if (!file) {
        return res.status(400).json({
          success: false,
          message: "Please upload a resume file.",
        });
      }

      const fileName =
        file.originalname || "";
      const lowerName =
        fileName.toLowerCase();
      const mime =
        String(file.mimetype || "").toLowerCase();

      const isPDF =
        mime === "application/pdf" ||
        lowerName.endsWith(".pdf");

      const isDOCX =
        mime ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        lowerName.endsWith(".docx");

      if (!isPDF && !isDOCX) {
        return res.status(400).json({
          success: false,
          message:
            "Unsupported file type. Please upload a PDF or DOCX resume.",
        });
      }

      let resumeText = "";

      if (isPDF) {
        const pdf = await pdfParse(file.buffer);
        resumeText = String(pdf.text || "").trim();
      } else {
        const extracted =
          await mammoth.extractRawText({
            buffer: file.buffer,
          });
        resumeText = String(
          extracted.value || ""
        ).trim();
      }

      if (resumeText.length < 50) {
        return res.status(422).json({
          success: false,
          message:
            "The resume contains too little readable text to analyze.",
        });
      }

      const prompt = `
You are an expert ATS resume evaluator.
Analyze ONLY the information present in the resume.
Return ONLY valid JSON.

RESUME:
${resumeText.slice(0, 50000)}
`;

      const result =
        await generateGeminiJSON(
          prompt,
          {
            type: "object",
            properties: {
              score: { type: "number" },
              summary: { type: "string" },
              keywordScore: { type: "number" },
              contentScore: { type: "number" },
              formatting: { type: "number" },
              contactScore: { type: "number" },
              keywords: {
                type: "array",
                items: { type: "string" },
              },
              missingKeywords: {
                type: "array",
                items: { type: "string" },
              },
              suggestions: {
                type: "array",
                items: { type: "string" },
              },
              sections: {
                type: "object",
                properties: {
                  contact: { type: "string" },
                  summary: { type: "string" },
                  skills: { type: "string" },
                  experience: { type: "string" },
                  projects: { type: "string" },
                  education: { type: "string" },
                  certifications: { type: "string" },
                },
                required: [
                  "contact",
                  "summary",
                  "skills",
                  "experience",
                  "projects",
                  "education",
                  "certifications",
                ],
              },
            },
            required: [
              "score",
              "summary",
              "keywordScore",
              "contentScore",
              "formatting",
              "contactScore",
              "keywords",
              "missingKeywords",
              "suggestions",
              "sections",
            ],
          },
          { temperature: 0.15, timeout: 90000 }
        );

      const resultData = {
        score: safeNumber(result?.score),
        summary: safeString(result?.summary),
        keywordScore: safeNumber(result?.keywordScore),
        contentScore: safeNumber(result?.contentScore),
        formatting: safeNumber(result?.formatting),
        contactScore: safeNumber(result?.contactScore),
        keywords: safeArray(result?.keywords),
        missingKeywords: safeArray(result?.missingKeywords),
        suggestions: safeArray(result?.suggestions),
        sections: {
          contact: safeString(result?.sections?.contact),
          summary: safeString(result?.sections?.summary),
          skills: safeString(result?.sections?.skills),
          experience: safeString(result?.sections?.experience),
          projects: safeString(result?.sections?.projects),
          education: safeString(result?.sections?.education),
          certifications: safeString(result?.sections?.certifications),
        },
      };

      logActivity(req.userId, ACTIVITY_TYPES.ATS_ANALYSIS, "ats");

      return res.json({
        success: true,
        result: resultData,
        fileName,
        fileType: isPDF ? "pdf" : "docx",
      });
    } catch (error) {
      console.error("❌ ATS Analysis Error:", error);

      return res.status(500).json({
        success: false,
        message:
          error?.message ||
          "Unable to analyze the resume right now.",
      });
    }
  }
);

// ============================================================
// SKILL GAP ANALYSIS
// ============================================================

const skillGapUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const name = String(file?.originalname || "").toLowerCase();
    const mime = String(file?.mimetype || "").toLowerCase();

    const isPDF =
      mime === "application/pdf" ||
      name.endsWith(".pdf");

    const isDOCX =
      mime ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      name.endsWith(".docx");

    const isTXT =
      mime === "text/plain" ||
      name.endsWith(".txt");

    if (isPDF || isDOCX || isTXT) {
      return cb(null, true);
    }

    return cb(
      new Error(
        "Only PDF, DOCX or TXT resume files are supported."
      )
    );
  },
});

router.post(
  "/skill-gap",
  skillGapUpload.single("file"),
  async (req, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          code: "AUTH_REQUIRED",
          message:
            "Please log in before using Skill Gap Analysis.",
        });
      }

      const targetRole = safeString(req.body?.targetRole);
      const experienceLevel = safeString(
        req.body?.experienceLevel,
        "Student / Fresher"
      );
      const pastedResumeText = safeString(req.body?.resumeText);
      const resumeId = safeString(req.body?.resumeId);

      if (!targetRole) {
        return res.status(400).json({
          success: false,
          code: "TARGET_ROLE_REQUIRED",
          message: "Please enter your target role.",
        });
      }

      let resumeText = "";
      let sourceType = "text";
      let fileName = "";

      if (req.file) {
        fileName = safeString(
          req.file.originalname,
          "resume"
        );

        console.log("");
        console.log(
          "=================================================="
        );
        console.log("📊 SKILL GAP ANALYSIS");
        console.log(
          "=================================================="
        );
        console.log("👤 User ID:", req.userId);
        console.log("🎯 Target role:", targetRole);
        console.log("📄 File:", fileName);
        console.log("📦 Type:", req.file.mimetype);
        console.log(
          "📦 Size:",
          req.file.size,
          "bytes"
        );

        const lowerName =
          fileName.toLowerCase();

        try {
          if (
            req.file.mimetype ===
              "application/pdf" ||
            lowerName.endsWith(".pdf")
          ) {
            const pdf =
              await pdfParse(req.file.buffer);

            resumeText = String(
              pdf?.text || ""
            ).trim();

            sourceType = "pdf";
          } else if (
            req.file.mimetype ===
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            lowerName.endsWith(".docx")
          ) {
            const extracted =
              await mammoth.extractRawText({
                buffer: req.file.buffer,
              });

            resumeText = String(
              extracted?.value || ""
            ).trim();

            sourceType = "docx";
          } else {
            resumeText =
              req.file.buffer
                .toString("utf8")
                .trim();

            sourceType = "txt";
          }
        } catch (extractError) {
          console.error(
            "❌ Skill gap resume extraction failed:",
            extractError
          );

          return res.status(422).json({
            success: false,
            code: "RESUME_EXTRACTION_FAILED",
            message:
              "We couldn't read this resume. Please upload a readable PDF, DOCX, or TXT file.",
          });
        }
      } else {
        resumeText = pastedResumeText;
        sourceType = "text";
      }

      resumeText = String(
        resumeText || ""
      )
        .replace(/\u0000/g, " ")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      if (resumeText.length < 50) {
        return res.status(422).json({
          success: false,
          code: "RESUME_TEXT_TOO_SHORT",
          message:
            "Please upload a resume or paste at least 50 characters of readable resume text.",
        });
      }

      console.log(
        "📝 Resume text:",
        resumeText.length,
        "characters"
      );

      const prompt = `
You are an expert career advisor, technical recruiter,
and skills-gap analyst.

Analyze the candidate's resume against the target career role.

TARGET ROLE:
${targetRole}

EXPERIENCE LEVEL:
${experienceLevel}

CANDIDATE RESUME:
--------------------------------
${resumeText.slice(0, 50000)}
--------------------------------

Identify:
1. Skills the candidate already demonstrates.
2. Important skills required for the target role.
3. Skills that are missing or insufficiently demonstrated.
4. The candidate's current level for each important skill.
5. The target level expected for the role.
6. The gap between current and target level.
7. Priority of each missing skill.
8. Why each missing skill matters.
9. A practical next action for each gap.
10. A practical learning roadmap.

IMPORTANT RULES:
- Analyze ONLY information supported by the resume.
- Never invent experience, projects, certifications, or skills.
- If a skill is not demonstrated, treat it as missing or unknown.
- Consider the candidate's experience level.
- Make realistic recommendations.
- Do not recommend lying on a resume.
- Do not recommend unnecessary skills.
- Priorities must be High, Medium, or Low.
- Readiness score must be between 0 and 100.
- Return ONLY valid JSON.
`;

      const responseSchema = {
        type: "object",
        properties: {
          readinessScore: {
            type: "number",
          },

          summary: {
            type: "string",
          },

          matchedSkills: {
            type: "array",
            items: {
              type: "object",
              properties: {
                skill: {
                  type: "string",
                },

                currentLevel: {
                  type: "string",
                },

                targetLevel: {
                  type: "string",
                },

                evidence: {
                  type: "string",
                },
              },

              required: [
                "skill",
                "currentLevel",
                "targetLevel",
                "evidence",
              ],
            },
          },

          missingSkills: {
            type: "array",
            items: {
              type: "object",
              properties: {
                skill: {
                  type: "string",
                },

                currentLevel: {
                  type: "string",
                },

                targetLevel: {
                  type: "string",
                },

                priority: {
                  type: "string",
                },

                why: {
                  type: "string",
                },

                action: {
                  type: "string",
                },
              },

              required: [
                "skill",
                "currentLevel",
                "targetLevel",
                "priority",
                "why",
                "action",
              ],
            },
          },

          levelComparison: {
            type: "array",
            items: {
              type: "object",
              properties: {
                skill: {
                  type: "string",
                },

                currentLevel: {
                  type: "string",
                },

                targetLevel: {
                  type: "string",
                },

                gap: {
                  type: "string",
                },
              },

              required: [
                "skill",
                "currentLevel",
                "targetLevel",
                "gap",
              ],
            },
          },

          learningRoadmap: {
            type: "array",
            items: {
              type: "object",
              properties: {
                phase: {
                  type: "string",
                },

                title: {
                  type: "string",
                },

                duration: {
                  type: "string",
                },

                skills: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },

                actions: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },

              required: [
                "phase",
                "title",
                "duration",
                "skills",
                "actions",
              ],
            },
          },
        },

        required: [
          "readinessScore",
          "summary",
          "matchedSkills",
          "missingSkills",
          "levelComparison",
          "learningRoadmap",
        ],
      };

      const aiResponse = await aiService.executeWithFallback({
        featureName: "Skill Gap Analysis",
        prompt,
        systemPrompt:
          "You are an expert career advisor and skills-gap analyst. Return ONLY valid JSON adhering to the specified schema.",
        responseSchema,
        options: {
          temperature: 0.15,
          timeout: 90000,
        },
      });

      const result = aiResponse.data;

      const analysis = {
        readinessScore:
          safeNumber(
            result?.readinessScore
          ),

        summary:
          safeString(
            result?.summary
          ),

        matchedSkills:
          Array.isArray(
            result?.matchedSkills
          )
            ? result.matchedSkills
                .slice(0, 30)
                .map((item) => ({
                  skill:
                    safeString(
                      item?.skill
                    ),

                  currentLevel:
                    safeString(
                      item?.currentLevel,
                      "Known"
                    ),

                  targetLevel:
                    safeString(
                      item?.targetLevel,
                      "Required"
                    ),

                  evidence:
                    safeString(
                      item?.evidence
                    ),
                }))
                .filter(
                  (item) =>
                    item.skill
                )
            : [],

        missingSkills:
          Array.isArray(
            result?.missingSkills
          )
            ? result.missingSkills
                .slice(0, 30)
                .map((item) => {
                  const priority =
                    safeString(
                      item?.priority,
                      "Medium"
                    );

                  return {
                    skill:
                      safeString(
                        item?.skill
                      ),

                    currentLevel:
                      safeString(
                        item?.currentLevel,
                        "Beginner"
                      ),

                    targetLevel:
                      safeString(
                        item?.targetLevel,
                        "Working proficiency"
                      ),

                    priority:
                      [
                        "High",
                        "Medium",
                        "Low",
                      ].includes(
                        priority
                      )
                        ? priority
                        : "Medium",

                    why:
                      safeString(
                        item?.why
                      ),

                    action:
                      safeString(
                        item?.action
                      ),
                  };
                })
                .filter(
                  (item) =>
                    item.skill
                )
            : [],

        levelComparison:
          Array.isArray(
            result?.levelComparison
          )
            ? result.levelComparison
                .slice(0, 30)
                .map((item) => ({
                  skill:
                    safeString(
                      item?.skill
                    ),

                  currentLevel:
                    safeString(
                      item?.currentLevel,
                      "Unknown"
                    ),

                  targetLevel:
                    safeString(
                      item?.targetLevel,
                      "Required"
                    ),

                  gap:
                    safeString(
                      item?.gap
                    ),
                }))
                .filter(
                  (item) =>
                    item.skill
                )
            : [],

        learningRoadmap:
          Array.isArray(
            result?.learningRoadmap
          )
            ? result.learningRoadmap
                .slice(0, 10)
                .map(
                  (
                    item,
                    index
                  ) => ({
                    phase:
                      safeString(
                        item?.phase,
                        `Phase ${index + 1}`
                      ),

                    title:
                      safeString(
                        item?.title,
                        "Learning phase"
                      ),

                    duration:
                      safeString(
                        item?.duration,
                        "1–2 weeks"
                      ),

                    skills:
                      safeArray(
                        item?.skills
                      ),

                    actions:
                      safeArray(
                        item?.actions
                      ),
                  })
                )
            : [],
      };

      let savedResume = null;

      const analysisRecord = {
        ...analysis,

        targetRole,

        experienceLevel,

        sourceType,

        fileName,

        analyzedAt:
          new Date().toISOString(),
      };

      if (resumeId) {
        savedResume =
          await Resume.findOne({
            _id: resumeId,
            userId: req.userId,
          });

        if (!savedResume) {
          return res.status(404).json({
            success: false,
            code: "RESUME_NOT_FOUND",
            message:
              "The selected resume was not found.",
          });
        }

        const existingData =
          savedResume.data &&
          typeof savedResume.data ===
            "object"
            ? savedResume.data
            : {};

        const history =
          Array.isArray(
            existingData.skillGapHistory
          )
            ? existingData.skillGapHistory
            : [];

        savedResume.data = {
          ...existingData,

          skillGapAnalysis:
            analysisRecord,

          skillGapHistory: [
            ...history.slice(-9),
            analysisRecord,
          ],
        };

        await savedResume.save();

        console.log(
          "✅ Skill gap analysis saved to existing resume:",
          String(
            savedResume._id
          )
        );
      } else {
        savedResume =
          await Resume.create({
            userId: req.userId,

            title:
              `${targetRole} Skill Gap Analysis`,

            templateId:
              "simple-ats",

            data: {
              targetRole,

              experienceLevel,

              skillGapAnalysis:
                analysisRecord,

              skillGapHistory: [
                analysisRecord,
              ],
            },
          });

        console.log(
          "✅ New skill gap analysis saved:",
          String(
            savedResume._id
          )
        );
      }

      logActivity(req.userId, ACTIVITY_TYPES.SKILL_GAP_ANALYSIS, "skillGap", {
        targetRole,
      });

      return res.status(200).json({
        success: true,
        provider: aiResponse?.provider || "gemini",
        analysis,

        analysisId:
          String(
            savedResume._id
          ),

        resumeId:
          String(
            savedResume._id
          ),

        message:
          "Skill gap analysis completed successfully.",
      });
    } catch (error) {
      console.error("");
      console.error(
        "=================================================="
      );
      console.error(
        "❌ SKILL GAP ANALYSIS ERROR"
      );
      console.error(
        "=================================================="
      );
      console.error(
        "Message:",
        error?.message || error
      );
      console.error(
        "Stack:",
        error?.stack || "N/A"
      );
      console.error(
        "=================================================="
      );
      console.error("");

      const status =
        Number(
          error?.status ||
            error?.statusCode ||
            error?.response?.status ||
            0
        );

      const message =
        String(
          error?.message ||
            "Skill gap analysis failed."
        );

      const lowerMessage =
        message.toLowerCase();

      if (
        status === 429 ||
        lowerMessage.includes(
          "quota"
        ) ||
        lowerMessage.includes(
          "rate limit"
        ) ||
        lowerMessage.includes(
          "resource exhausted"
        )
      ) {
        return res.status(429).json({
          success: false,
          code: "GEMINI_QUOTA",
          message:
            "Gemini API quota or rate limit reached. Please try again later.",
        });
      }

      if (
        status === 401 ||
        status === 403 ||
        lowerMessage.includes(
          "api key"
        ) ||
        lowerMessage.includes(
          "authentication"
        ) ||
        lowerMessage.includes(
          "permission denied"
        )
      ) {
        return res.status(401).json({
          success: false,
          code: "GEMINI_AUTH",
          message:
            "Gemini API authentication failed. Please check GEMINI_API_KEY in backend/.env.",
        });
      }

      if (
        status === 500 ||
        status === 502 ||
        status === 503 ||
        status === 504 ||
        lowerMessage.includes(
          "temporarily unavailable"
        ) ||
        lowerMessage.includes(
          "service unavailable"
        ) ||
        lowerMessage.includes(
          "timeout"
        ) ||
        lowerMessage.includes(
          "timed out"
        )
      ) {
        return res.status(503).json({
          success: false,
          code: "GEMINI_TEMPORARY_ERROR",
          message:
            "The Gemini AI service is temporarily unavailable. Please try again shortly.",
        });
      }

      return res.status(500).json({
        success: false,
        code: "SKILL_GAP_FAILED",
        message,
      });
    }
  }
);

// ============================================================
// LIVE JOBS - ADZUNA
// ============================================================

router.get(
  "/jobs",
  async (req, res) => {
    try {
      const query =
        safeString(req.query.query) ||
        safeString(req.query.role) ||
        safeString(req.query.targetRole) ||
        safeString(req.query.search) ||
        safeString(req.query.title) ||
        "software developer";

      const data =
        await requestAdzuna({
          ...req.query,
          query,
        });

      const jobs =
        Array.isArray(
          data.results
        )
          ? data.results.map(
              normalizeJob
            )
          : [];

      return res.json({
        success: true,
        provider: "Adzuna",
        attribution:
          "Jobs by Adzuna",

        jobs,

        results: jobs,

        count:
          jobs.length,

        total:
          Number(data.count) ||
          jobs.length,

        page:
          Number(
            req.query.page
          ) || 1,
      });
    } catch (error) {
      console.error(
        "❌ Adzuna jobs error:",
        error?.message || error
      );

      return res.status(
        error?.status || 502
      ).json({
        success: false,
        provider: "Adzuna",
        message:
          error?.message ||
          "Unable to load live jobs right now.",
      });
    }
  }
);

module.exports = router;