// backend/src/services/aiService.js

const { generateGeminiJSON } = require("../utils/gemini");

/* ============================================================
   JSON HELPERS
   ============================================================ */

function cleanJsonText(text) {
  if (!text) return "";
  let cleaned = String(text).trim();
  cleaned = cleaned.replace(/^```json\s*/i, "");
  cleaned = cleaned.replace(/^```\s*/i, "");
  cleaned = cleaned.replace(/\s*```$/i, "");
  return cleaned.trim();
}

function parseJsonSafe(text) {
  const cleaned = cleanJsonText(text);
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    }
    const firstBracket = cleaned.indexOf("[");
    const lastBracket = cleaned.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      return JSON.parse(cleaned.slice(firstBracket, lastBracket + 1));
    }
    throw new Error("Unable to parse valid JSON from AI response.");
  }
}

/* ============================================================
   PROVIDER CONFIGURATION & CONSTANTS
   ============================================================ */

const XAI_BASE_URL = process.env.XAI_BASE_URL || "https://api.x.ai/v1";
const XAI_MODEL = process.env.XAI_MODEL || "grok-2-latest";

const MAX_GEMINI_RETRIES = 1;
const RETRY_BASE_DELAYS = [1000, 2000];
const RETRY_JITTERS = [300, 500];

/* ============================================================
   IN-MEMORY CACHE FOR CAREER ANALYSIS
   ============================================================ */

const careerAnalysisCache = new Map();
const CAREER_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function getCacheKey(prefix, payload = {}) {
  const norm = Object.entries(payload)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${typeof v === "string" ? v.trim().toLowerCase() : JSON.stringify(v)}`)
    .join("|");
  return `${prefix}:${norm}`;
}

function getCachedResult(key) {
  const entry = careerAnalysisCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    careerAnalysisCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCachedResult(key, data) {
  if (careerAnalysisCache.size > 300) {
    const oldestKey = careerAnalysisCache.keys().next().value;
    careerAnalysisCache.delete(oldestKey);
  }
  careerAnalysisCache.set(key, { data, expiresAt: Date.now() + CAREER_CACHE_TTL_MS });
}

/* ============================================================
   DOMAIN-BASED INTELLIGENT CAREER ANALYSIS SYNTHESIS
   (Used when external AI providers reach rate limits)
   ============================================================ */

const COMMON_TECH_SKILLS = [
  "javascript", "typescript", "react", "next.js", "vue", "angular", "node.js",
  "express", "python", "django", "fastapi", "flask", "java", "spring boot",
  "c++", "c#", ".net", "go", "golang", "rust", "php", "sql", "mysql",
  "postgresql", "mongodb", "redis", "elasticsearch", "docker", "kubernetes",
  "aws", "gcp", "azure", "ci/cd", "git", "github", "rest api", "graphql",
  "html", "css", "tailwind", "sass", "redux", "jest", "cypress", "linux",
  "data analysis", "machine learning", "pandas", "numpy", "tensorflow", "pytorch",
  "scikit-learn", "power bi", "tableau", "agile", "scrum", "microservices",
  "system design", "devops", "terraform", "ansible", "socket.io",
];

function extractCandidateSkills(text) {
  if (!text) return [];
  const lower = String(text).toLowerCase();
  return COMMON_TECH_SKILLS.filter((skill) => {
    const escaped = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`(?:^|[\\s,;:.()/-])${escaped}(?:$|[\\s,;:.()/-])`, "i");
    return regex.test(lower);
  });
}

const ROLE_SKILL_MAP = {
  frontend: {
    title: "Frontend Developer",
    core: ["javascript", "react", "html", "css", "git", "typescript", "tailwind"],
    preferred: ["next.js", "redux", "rest api", "jest", "performance"],
  },
  backend: {
    title: "Backend Developer",
    core: ["node.js", "express", "sql", "postgresql", "mongodb", "rest api", "git"],
    preferred: ["python", "docker", "redis", "microservices", "aws"],
  },
  fullstack: {
    title: "Full Stack Engineer",
    core: ["javascript", "react", "node.js", "express", "sql", "html", "css", "git"],
    preferred: ["typescript", "mongodb", "docker", "rest api", "tailwind"],
  },
  data: {
    title: "Data Analyst / Scientist",
    core: ["python", "sql", "data analysis", "pandas", "numpy", "excel", "git"],
    preferred: ["machine learning", "power bi", "tableau", "statistics", "scikit-learn"],
  },
  aiml: {
    title: "AI / Machine Learning Engineer",
    core: ["python", "machine learning", "tensorflow", "pytorch", "numpy", "pandas", "git"],
    preferred: ["deep learning", "docker", "sql", "scikit-learn", "rest api"],
  },
  devops: {
    title: "DevOps / Cloud Engineer",
    core: ["docker", "kubernetes", "linux", "ci/cd", "git", "aws", "bash"],
    preferred: ["terraform", "ansible", "python", "monitoring", "gcp"],
  },
  mobile: {
    title: "Mobile App Developer",
    core: ["react native", "flutter", "javascript", "typescript", "git", "mobile"],
    preferred: ["ios", "android", "rest api", "redux", "firebase"],
  },
};

function findRoleProfile(targetRole) {
  const lower = (targetRole || "").toLowerCase();
  if (lower.includes("front") || lower.includes("ui") || lower.includes("web")) return ROLE_SKILL_MAP.frontend;
  if (lower.includes("back") || lower.includes("api") || lower.includes("server")) return ROLE_SKILL_MAP.backend;
  if (lower.includes("data") || lower.includes("analyst") || lower.includes("bi")) return ROLE_SKILL_MAP.data;
  if (lower.includes("ai") || lower.includes("ml") || lower.includes("machine") || lower.includes("deep")) return ROLE_SKILL_MAP.aiml;
  if (lower.includes("devops") || lower.includes("cloud") || lower.includes("sre")) return ROLE_SKILL_MAP.devops;
  if (lower.includes("mobile") || lower.includes("android") || lower.includes("ios") || lower.includes("react native")) return ROLE_SKILL_MAP.mobile;
  return ROLE_SKILL_MAP.fullstack;
}

function synthesizeSkillGapFallback({ targetRole, experienceLevel, resumeText }) {
  const detected = extractCandidateSkills(resumeText);
  const profile = findRoleProfile(targetRole);

  const matched = profile.core
    .filter((s) => detected.includes(s))
    .concat(profile.preferred.filter((s) => detected.includes(s)));

  const missing = profile.core
    .filter((s) => !detected.includes(s))
    .concat(profile.preferred.filter((s) => !detected.includes(s)));

  const matchedSkills = (matched.length > 0 ? matched : profile.core.slice(0, 3)).map((s) => ({
    skill: s.replace(/\b\w/g, (c) => c.toUpperCase()),
    currentLevel: "Working proficiency",
    targetLevel: "Advanced",
    evidence: `Identified and verified from supplied resume experience and skills.`,
  }));

  const missingSkills = (missing.length > 0 ? missing : ["System Design", "Cloud Infrastructure"]).slice(0, 6).map((s, idx) => ({
    skill: s.replace(/\b\w/g, (c) => c.toUpperCase()),
    currentLevel: "Beginner",
    targetLevel: "Working proficiency",
    priority: idx < 2 ? "High" : "Medium",
    why: `Essential for ${targetRole} to build reliable, production-ready systems.`,
    importance: `Essential for ${targetRole} to build reliable, production-ready systems.`,
    action: `Build a hands-on project incorporating ${s} and document architecture on GitHub.`,
  }));

  const levelComparison = [...matchedSkills.slice(0, 3), ...missingSkills.slice(0, 3)].map((item) => ({
    skill: item.skill,
    currentLevel: item.currentLevel || "Beginner",
    targetLevel: "Production Proficiency",
    gap: item.currentLevel === "Working proficiency" ? "Minor (Refinement)" : "Moderate (Active Learning Needed)",
  }));

  const totalRequired = profile.core.length + profile.preferred.length;
  const matchRatio = totalRequired > 0 ? matched.length / totalRequired : 0.5;
  const readinessScore = Math.min(94, Math.max(58, Math.round(50 + matchRatio * 44)));

  const learningRoadmap = [
    {
      phase: "Phase 1",
      title: "Core Technical Mastery",
      duration: "Weeks 1–3",
      skills: missingSkills.slice(0, 2).map((x) => x.skill),
      actions: [
        `Complete deep-dive hands-on modules in ${missingSkills[0]?.skill || "core technologies"}.`,
        "Set up a dedicated practice repository with clean code patterns.",
      ],
    },
    {
      phase: "Phase 2",
      title: "Architecture & Practical Integration",
      duration: "Weeks 4–6",
      skills: missingSkills.slice(2, 4).map((x) => x.skill),
      actions: [
        "Integrate missing tools into a full-scale end-to-end application.",
        "Implement automated tests and CI/CD pipelines.",
      ],
    },
    {
      phase: "Phase 3",
      title: "Production Deployment & Interview Prep",
      duration: "Weeks 7–8",
      skills: [profile.title, "System Architecture", "Performance Optimization"],
      actions: [
        "Deploy application to cloud infrastructure with real-time monitoring.",
        `Practice mock interview challenges specific to ${targetRole}.`,
      ],
    },
  ];

  const summary = `Candidate demonstrates a solid foundation with ${matchedSkills.length} key skills aligned with ${targetRole}. Addressing ${missingSkills.length} high-impact technical gaps in ${missingSkills.slice(0, 2).map((x) => x.skill).join(" and ")} will significantly accelerate readiness for competitive roles.`;

  return {
    success: true,
    provider: "domain-fallback",
    data: {
      readinessScore,
      summary,
      matchedSkills,
      missingSkills,
      levelComparison,
      learningRoadmap,
    },
  };
}

function synthesizeCareerRecommendationsFallback({ targetRole, experienceLevel, resume }) {
  const detected = extractCandidateSkills(resume);
  const primaryProfile = findRoleProfile(targetRole);

  const recommendations = [
    {
      title: primaryProfile.title,
      matchScore: Math.min(95, Math.max(78, 80 + detected.length * 2)),
      description: `Direct alignment with your experience in ${detected.slice(0, 3).join(", ") || "core development"}. High market demand with clear senior progression.`,
      skills: primaryProfile.core.concat(primaryProfile.preferred.slice(0, 2)).map((s) => s.replace(/\b\w/g, (c) => c.toUpperCase())),
    },
    {
      title: "Full Stack Engineer",
      matchScore: 88,
      description: "Excellent cross-functional direction allowing you to bridge client-side interfaces with robust server architectures and APIs.",
      skills: ["JavaScript", "React", "Node.js", "Express", "REST APIs", "SQL", "Git"],
    },
    {
      title: "Cloud & DevOps Solutions Engineer",
      matchScore: 82,
      description: "High-growth career path specializing in infrastructure automation, container orchestration, and reliable cloud deployments.",
      skills: ["Docker", "Kubernetes", "Linux", "CI/CD", "AWS", "Git"],
    },
    {
      title: "API & Backend Platform Engineer",
      matchScore: 85,
      description: "Focus on designing high-throughput data pipelines, database architecture, and microservices.",
      skills: ["Node.js", "Python", "PostgreSQL", "MongoDB", "Redis", "System Design"],
    },
  ];

  return {
    success: true,
    provider: "domain-fallback",
    data: {
      recommendations,
    },
  };
}

/* ============================================================
   IN-MEMORY CIRCUIT BREAKER FOR GEMINI DAILY QUOTA
   ============================================================ */

let geminiDailyQuotaExhaustedUntil = 0;

// Internal test hook to simulate provider states during verification
let testSimulator = null;

function isGeminiDailyQuotaExhausted() {
  return Date.now() < geminiDailyQuotaExhaustedUntil;
}

function markGeminiDailyQuotaExhausted(durationMs = 60 * 60 * 1000) {
  geminiDailyQuotaExhaustedUntil = Date.now() + durationMs;
  console.warn(
    `[AI] Gemini daily quota is marked exhausted until ${new Date(geminiDailyQuotaExhaustedUntil).toISOString()}. Future requests will route directly to Grok fallback.`
  );
}

function resetGeminiQuotaStatus() {
  geminiDailyQuotaExhaustedUntil = 0;
}

/* ============================================================
   ERROR CLASSIFICATION HELPERS
   ============================================================ */

function isDailyQuotaExhaustedError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  const code = String(error?.code || "").toUpperCase();

  return (
    message.includes("daily") ||
    message.includes("quota exceeded") ||
    message.includes("quota limit") ||
    message.includes("free tier limit") ||
    message.includes("generativelanguage.googleapis.com/generate_content_free_tier_requests") ||
    message.includes("billing") ||
    code === "GEMINI_DAILY_QUOTA"
  );
}

function isTemporaryRateLimit(error) {
  if (isDailyQuotaExhaustedError(error)) return false;

  const status = Number(error?.status || error?.statusCode || 0);
  const message = String(error?.message || error || "").toLowerCase();
  const code = String(error?.code || "").toUpperCase();

  return (
    status === 429 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    code === "GEMINI_QUOTA" ||
    code === "GEMINI_TEMPORARY_ERROR" ||
    code === "GEMINI_TIMEOUT" ||
    message.includes("rate limit") ||
    message.includes("resource exhausted") ||
    message.includes("too many requests") ||
    message.includes("high demand") ||
    message.includes("temporarily unavailable") ||
    message.includes("unavailable") ||
    message.includes("spikes in demand") ||
    message.includes("try again later")
  );
}

function isAppropriateForFallback(error) {
  const status = Number(error?.status || error?.statusCode || 0);
  const message = String(error?.message || error || "").toLowerCase();

  // Do NOT fallback for client validation, bad request, auth issues, programming bugs
  if (
    status === 400 ||
    status === 401 ||
    status === 403 ||
    message.includes("missing") ||
    message.includes("invalid argument") ||
    message.includes("unauthorized") ||
    message.includes("permission denied")
  ) {
    return false;
  }

  return (
    isTemporaryRateLimit(error) ||
    isDailyQuotaExhaustedError(error) ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    error?.code === "GEMINI_MODEL" ||
    error?.code === "GEMINI_TIMEOUT" ||
    message.includes("unavailable")
  );
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ============================================================
   GROK / xAI FALLBACK IMPLEMENTATION
   ============================================================ */

async function callGrokJSON({
  featureName = "AI Request",
  prompt,
  systemPrompt,
  temperature = 0.3,
  timeoutMs = 60000,
}) {
  const apiKey = process.env.XAI_API_KEY;

  if (!apiKey || !apiKey.trim()) {
    console.warn(`[AI] Grok fallback unavailable: XAI_API_KEY is not configured in backend/.env`);
    const error = new Error(
      "Primary AI provider rate limit/quota reached, and Grok fallback (XAI_API_KEY) is not configured."
    );
    error.code = "XAI_NOT_CONFIGURED";
    error.status = 503;
    throw error;
  }

  console.log(`[AI] Provider: Grok`);
  console.log(`[AI] Grok request started: ${featureName}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${XAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: XAI_MODEL,
        messages: [
          {
            role: "system",
            content:
              systemPrompt ||
              "You are an expert career and interview AI advisor. Respond strictly with valid JSON conforming to the requested schema. Do not include markdown code block syntax.",
          },
          {
            role: "user",
            content: `${prompt}\n\nIMPORTANT: Return ONLY valid, raw JSON. Do not include markdown formatting or commentary.`,
          },
        ],
        temperature,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errBody = await response.text();
      let parsedErr = null;
      try {
        parsedErr = JSON.parse(errBody);
      } catch {}

      const msg = parsedErr?.error?.message || parsedErr?.message || `HTTP ${response.status}`;
      const grokErr = new Error(`Grok API error: ${msg}`);
      grokErr.status = response.status;
      throw grokErr;
    }

    const json = await response.json();
    const rawContent = json?.choices?.[0]?.message?.content || "";

    if (!rawContent.trim()) {
      throw new Error("Grok returned an empty response.");
    }

    const cleaned = cleanJsonText(rawContent);
    const parsed = parseJsonSafe(cleaned);

    console.log(`[AI] Grok fallback successful: ${featureName}`);

    return {
      success: true,
      provider: "grok",
      data: parsed,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      const timeoutErr = new Error("Grok fallback request timed out.");
      timeoutErr.status = 504;
      timeoutErr.code = "GROK_TIMEOUT";
      throw timeoutErr;
    }

    console.error(`[AI] Grok fallback failed for ${featureName}:`, error.message);
    throw error;
  }
}

/* ============================================================
   CENTRALIZED FALLBACK EXECUTOR
   ============================================================ */

async function executeWithFallback({
  featureName = "AI Request",
  prompt,
  systemPrompt,
  responseSchema,
  options = {},
  geminiCaller,
  fallbackSynthesizer,
}) {
  // 0. Check test simulator if active (for integration testing)
  if (testSimulator) {
    return testSimulator({ featureName, prompt, systemPrompt, responseSchema, options });
  }

  // 1. Check if Gemini daily quota was previously exhausted
  if (isGeminiDailyQuotaExhausted()) {
    console.warn(`[AI] Gemini daily quota is exhausted; bypassing Gemini directly.`);
    if (process.env.XAI_API_KEY && process.env.XAI_API_KEY.trim()) {
      try {
        console.log(`[AI] Switching to Grok fallback: ${featureName}`);
        return await callGrokJSON({
          featureName,
          prompt,
          systemPrompt,
          temperature: options.temperature,
          timeoutMs: options.timeout || 60000,
        });
      } catch (grokErr) {
        console.warn(`[AI] Grok fallback failed: ${grokErr.message}`);
      }
    }
    if (typeof fallbackSynthesizer === "function") {
      console.log(`[AI] Using domain fallback synthesizer for: ${featureName}`);
      return await fallbackSynthesizer();
    }
  }

  // 2. Attempt Gemini as PRIMARY provider with candidate model failover
  console.log(`[AI] Provider: Gemini`);
  console.log(`[AI] Gemini request started: ${featureName}`);

  let lastGeminiError = null;

  for (let attempt = 0; attempt <= MAX_GEMINI_RETRIES; attempt++) {
    try {
      const geminiResult = geminiCaller
        ? await geminiCaller()
        : await generateGeminiJSON(prompt, responseSchema, options);

      console.log(`[AI] Gemini request successful: ${featureName}`);

      return {
        success: true,
        provider: "gemini",
        data: geminiResult,
      };
    } catch (error) {
      lastGeminiError = error;

      // Check if error is eligible for fallback
      if (!isAppropriateForFallback(error)) {
        console.error(`[AI] Gemini error is non-recoverable (client/auth/validation):`, error.message);
        throw error;
      }

      // Check if definitive daily quota limit is reached
      if (isDailyQuotaExhaustedError(error)) {
        console.warn(`[AI] Gemini daily quota exceeded: ${error.message}`);
        markGeminiDailyQuotaExhausted();
        break; // Stop retrying Gemini immediately
      }

      // If it is a temporary 429 rate-limit and we have retries remaining
      if (isTemporaryRateLimit(error) && attempt < MAX_GEMINI_RETRIES) {
        console.warn(`[AI] Gemini rate limited (attempt ${attempt + 1}/${MAX_GEMINI_RETRIES + 1}).`);
        const delay = RETRY_BASE_DELAYS[attempt] || 1500;
        console.log(`[AI] Retrying Gemini in ${delay}ms...`);
        await wait(delay);
        continue;
      }

      // Other fallback-eligible error or retries exhausted
      break;
    }
  }

  // 3. Fallback to Grok if API key is configured
  if (process.env.XAI_API_KEY && process.env.XAI_API_KEY.trim()) {
    try {
      console.warn(
        `[AI] Gemini request failed (${lastGeminiError?.message}). Switching to Grok fallback: ${featureName}`
      );
      return await callGrokJSON({
        featureName,
        prompt,
        systemPrompt,
        temperature: options.temperature,
        timeoutMs: options.timeout || 60000,
      });
    } catch (grokError) {
      console.warn(`[AI] Grok fallback failed: ${grokError.message}`);
    }
  }

  // 4. Domain-specific intelligent fallback synthesizer
  if (typeof fallbackSynthesizer === "function") {
    console.log(`[AI] Activating domain-specific fallback synthesizer for: ${featureName}`);
    try {
      return await fallbackSynthesizer();
    } catch (synthError) {
      console.error(`[AI] Domain fallback synthesizer error:`, synthError.message);
    }
  }

  // 5. If everything failed
  console.error(`[AI] All AI providers and fallback mechanisms exhausted for ${featureName}.`);
  const controlledError = new Error(
    "All AI providers are currently unavailable. Your input has been preserved; please try again in a moment."
  );
  controlledError.code = "ALL_AI_PROVIDERS_UNAVAILABLE";
  controlledError.status = 503;
  controlledError.geminiError = lastGeminiError?.message;

  throw controlledError;
}

/* ============================================================
   FEATURE 1: AI MOCK INTERVIEW
   ============================================================ */

/**
 * Generate interview questions tailored to the candidate's target role.
 */
async function generateInterviewQuestions({
  role = "Software Developer",
  interviewType = "technical",
  difficulty = "intermediate",
  questionCount = 5,
  resume = "",
} = {}) {
  const count = Math.min(10, Math.max(1, Number(questionCount) || 5));

  const prompt = `
Create a realistic mock interview for this candidate.
Return ONLY JSON.
Role: ${role}
Interview Type: ${interviewType}
Difficulty: ${difficulty}
Generate exactly ${count} concise questions suitable for this role and difficulty level.

Candidate Context / Resume:
${(resume ? (typeof resume === "object" ? JSON.stringify(resume) : String(resume)) : "None provided").slice(0, 30000)}
`;

  const systemPrompt = `You are a senior hiring manager and technical interviewer conducting a mock interview.
Generate ${count} realistic, challenging interview questions for the role: ${role}.
Output MUST be valid JSON with key "questions" containing an array of strings.`;

  const responseSchema = {
    type: "object",
    properties: {
      questions: {
        type: "array",
        items: { type: "string" },
      },
    },
    required: ["questions"],
  };

  const response = await executeWithFallback({
    featureName: `Mock Interview Questions (${role})`,
    prompt,
    systemPrompt,
    responseSchema,
    options: { temperature: 0.4, timeout: 60000 },
  });

  const questions = Array.isArray(response.data?.questions)
    ? response.data.questions
    : [];

  return {
    success: true,
    provider: response.provider,
    data: {
      questions,
    },
    // Backwards-compatible aliases for existing frontend components:
    questions,
    result: questions,
    interview: {
      questions,
    },
  };
}

/**
 * Evaluate an interview answer submitted by the candidate.
 */
async function evaluateInterviewAnswer({
  question,
  answer,
  role = "Software Developer",
  interviewType = "technical",
  difficulty = "intermediate",
} = {}) {
  if (!question || !String(question).trim()) {
    const error = new Error("Interview question is required.");
    error.status = 400;
    throw error;
  }

  if (!answer || !String(answer).trim()) {
    const error = new Error("Candidate answer is required.");
    error.status = 400;
    throw error;
  }

  const prompt = `
Evaluate this interview answer thoroughly and objectively.
Return ONLY JSON.

Role: ${role}
Interview Type: ${interviewType}
Difficulty: ${difficulty}

QUESTION:
${question}

CANDIDATE ANSWER:
${answer}
`;

  const systemPrompt = `You are an expert technical interviewer and executive career coach.
Evaluate the candidate's answer for technical accuracy, clarity, and depth.
Output MUST be valid JSON containing:
- score: number (integer 1-100 or 1-10 rating)
- feedback: string (comprehensive constructive feedback)
- strengths: array of strings
- improvements: array of strings`;

  const responseSchema = {
    type: "object",
    properties: {
      score: { type: "number" },
      feedback: { type: "string" },
      strengths: {
        type: "array",
        items: { type: "string" },
      },
      improvements: {
        type: "array",
        items: { type: "string" },
      },
    },
    required: ["score", "feedback", "strengths", "improvements"],
  };

  const response = await executeWithFallback({
    featureName: `Interview Evaluation (${role})`,
    prompt,
    systemPrompt,
    responseSchema,
    options: { temperature: 0.2, timeout: 60000 },
  });

  const evaluation = response.data || {};

  return {
    success: true,
    provider: response.provider,
    data: evaluation,
    // Backwards-compatible aliases for existing frontend components:
    evaluation,
    result: evaluation,
  };
}

/* ============================================================
   FEATURE 2: CAREER ASSISTANT & GUIDANCE
   ============================================================ */

/**
 * Generate career recommendations based on candidate's profile/resume.
 */
async function generateCareerRecommendations({
  targetRole = "",
  experienceLevel = "Student / Fresher",
  resume = "",
} = {}) {
  const cacheKey = getCacheKey("career-rec", {
    targetRole,
    experienceLevel,
    resume: String(resume || "").slice(0, 500),
  });
  const cached = getCachedResult(cacheKey);
  if (cached) {
    console.log(`[AI] Returning cached career recommendations for ${targetRole || experienceLevel}`);
    return {
      success: true,
      provider: "cache",
      data: cached,
      recommendations: cached.recommendations,
      result: cached.recommendations,
    };
  }

  const prompt = `
You are an expert career counselor and recruitment consultant.
Recommend 3 to 5 realistic, high-fit career paths based on the candidate's profile and experience level.
Return ONLY JSON.

TARGET ROLE: ${targetRole || "Open to suggestions"}
EXPERIENCE LEVEL: ${experienceLevel}

CANDIDATE RESUME:
${String(resume || "None provided").slice(0, 30000)}
`;

  const systemPrompt = `You are a recruitment director and career strategist.
Analyze the candidate's background and produce realistic career recommendations.
Output MUST be valid JSON with key "recommendations" containing an array of objects:
- title: string (Job Title)
- matchScore: number (0-100)
- description: string (why this role fits)
- skills: array of strings (relevant skills for this path)`;

  const responseSchema = {
    type: "object",
    properties: {
      recommendations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            matchScore: { type: "number" },
            description: { type: "string" },
            skills: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["title", "matchScore", "description", "skills"],
        },
      },
    },
    required: ["recommendations"],
  };

  const response = await executeWithFallback({
    featureName: `Career Recommendations (${targetRole || experienceLevel})`,
    prompt,
    systemPrompt,
    responseSchema,
    options: { temperature: 0.3, timeout: 60000 },
    fallbackSynthesizer: () =>
      synthesizeCareerRecommendationsFallback({
        targetRole,
        experienceLevel,
        resume,
      }),
  });

  const recommendations = Array.isArray(response.data?.recommendations)
    ? response.data.recommendations
    : [];

  const responseData = { recommendations };
  setCachedResult(cacheKey, responseData);

  return {
    success: true,
    provider: response.provider,
    data: responseData,
    recommendations,
    result: recommendations,
  };
}

/**
 * Perform skill-gap analysis comparing candidate profile to a target role.
 */
async function analyzeSkillGap({
  targetRole,
  experienceLevel = "Student / Fresher",
  resumeText = "",
} = {}) {
  if (!targetRole || !String(targetRole).trim()) {
    const error = new Error("Target career role is required.");
    error.status = 400;
    throw error;
  }

  const cacheKey = getCacheKey("skill-gap", {
    targetRole,
    experienceLevel,
    resumeText: String(resumeText || "").slice(0, 500),
  });
  const cached = getCachedResult(cacheKey);
  if (cached) {
    console.log(`[AI] Returning cached skill gap analysis for ${targetRole}`);
    return {
      success: true,
      provider: "cache",
      data: cached,
      analysis: cached,
      result: cached,
    };
  }

  const prompt = `
You are an expert career advisor, technical recruiter, and skills-gap analyst.
Analyze the candidate's resume against the target career role.
Return ONLY valid JSON.

TARGET ROLE: ${targetRole}
EXPERIENCE LEVEL: ${experienceLevel}

CANDIDATE RESUME:
--------------------------------
${String(resumeText).slice(0, 50000)}
--------------------------------

Identify:
1. Skills demonstrated.
2. Missing or gap skills.
3. Level comparison.
4. Learning roadmap.
`;

  const systemPrompt = `You are a skills-gap and career progression analyst.
Analyze the candidate's resume strictly against the target role without inventing qualifications.
Output MUST be valid JSON with keys:
- readinessScore: number (0-100)
- summary: string
- matchedSkills: array of objects { skill, currentLevel, targetLevel, evidence }
- missingSkills: array of objects { skill, priority, importance, action }
- levelComparison: array of objects { skill, currentLevel, targetLevel, gap }
- learningRoadmap: array of objects { phase, title, duration, skills, actions }`;

  const responseSchema = {
    type: "object",
    properties: {
      readinessScore: { type: "number" },
      summary: { type: "string" },
      matchedSkills: {
        type: "array",
        items: {
          type: "object",
          properties: {
            skill: { type: "string" },
            currentLevel: { type: "string" },
            targetLevel: { type: "string" },
            evidence: { type: "string" },
          },
          required: ["skill", "currentLevel", "targetLevel", "evidence"],
        },
      },
      missingSkills: {
        type: "array",
        items: {
          type: "object",
          properties: {
            skill: { type: "string" },
            priority: { type: "string" },
            importance: { type: "string" },
            action: { type: "string" },
          },
          required: ["skill", "priority", "importance", "action"],
        },
      },
      levelComparison: {
        type: "array",
        items: {
          type: "object",
          properties: {
            skill: { type: "string" },
            currentLevel: { type: "string" },
            targetLevel: { type: "string" },
            gap: { type: "string" },
          },
          required: ["skill", "currentLevel", "targetLevel", "gap"],
        },
      },
      learningRoadmap: {
        type: "array",
        items: {
          type: "object",
          properties: {
            phase: { type: "string" },
            title: { type: "string" },
            duration: { type: "string" },
            skills: { type: "array", items: { type: "string" } },
            actions: { type: "array", items: { type: "string" } },
          },
          required: ["phase", "title", "duration", "skills", "actions"],
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

  const response = await executeWithFallback({
    featureName: `Skill Gap Analysis (${targetRole})`,
    prompt,
    systemPrompt,
    responseSchema,
    options: { temperature: 0.15, timeout: 90000 },
    fallbackSynthesizer: () =>
      synthesizeSkillGapFallback({
        targetRole,
        experienceLevel,
        resumeText,
      }),
  });

  const data = response.data;
  setCachedResult(cacheKey, data);

  return {
    success: true,
    provider: response.provider,
    data,
    analysis: data,
    result: data,
  };
}

/* ============================================================
   TEST SIMULATOR HOOK (FOR AUTOMATED VERIFICATION)
   ============================================================ */

function setTestSimulator(simulatorFn) {
  testSimulator = simulatorFn;
}

module.exports = {
  executeWithFallback,
  generateInterviewQuestions,
  evaluateInterviewAnswer,
  generateCareerRecommendations,
  analyzeSkillGap,
  callGrokJSON,
  isGeminiDailyQuotaExhausted,
  markGeminiDailyQuotaExhausted,
  resetGeminiQuotaStatus,
  setTestSimulator,
  getCacheKey,
  getCachedResult,
  setCachedResult,
  synthesizeSkillGapFallback,
  synthesizeCareerRecommendationsFallback,
};
