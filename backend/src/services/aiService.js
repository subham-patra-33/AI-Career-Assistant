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

const MAX_GEMINI_RETRIES = 3;
const RETRY_BASE_DELAYS = [1000, 2000, 4000]; // ~1s, ~2s, ~4s
const RETRY_JITTERS = [300, 500, 800];

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
}) {
  // 0. Check test simulator if active (for integration testing)
  if (testSimulator) {
    return testSimulator({ featureName, prompt, systemPrompt, responseSchema, options });
  }

  // 1. Check if Gemini daily quota was previously exhausted
  if (isGeminiDailyQuotaExhausted()) {
    console.warn(`[AI] Gemini daily quota is exhausted; bypassing Gemini directly to Grok fallback.`);
    console.log(`[AI] Switching to Grok fallback: ${featureName}`);
    return await callGrokJSON({
      featureName,
      prompt,
      systemPrompt,
      temperature: options.temperature,
      timeoutMs: options.timeout || 60000,
    });
  }

  // 2. Attempt Gemini as PRIMARY provider with bounded retries for temporary 429
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
        const delay = RETRY_BASE_DELAYS[attempt] + Math.floor(Math.random() * RETRY_JITTERS[attempt]);
        console.log(`[AI] Retrying Gemini in ${delay}ms...`);
        await wait(delay);
        continue;
      }

      // Other fallback-eligible error or retries exhausted
      break;
    }
  }

  // 3. Fallback to Grok
  console.warn(
    `[AI] Gemini request failed or rate limit retries exhausted (${lastGeminiError?.message}). Switching to Grok fallback: ${featureName}`
  );

  try {
    return await callGrokJSON({
      featureName,
      prompt,
      systemPrompt,
      temperature: options.temperature,
      timeoutMs: options.timeout || 60000,
    });
  } catch (grokError) {
    console.error(`[AI] Both Gemini and Grok failed for ${featureName}.`);

    const controlledError = new Error(
      "All AI providers are currently unavailable. Your input has been preserved; please try again in a moment."
    );
    controlledError.code = "ALL_AI_PROVIDERS_UNAVAILABLE";
    controlledError.status = 503;
    controlledError.geminiError = lastGeminiError?.message;
    controlledError.grokError = grokError?.message;

    throw controlledError;
  }
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
  });

  const recommendations = Array.isArray(response.data?.recommendations)
    ? response.data.recommendations
    : [];

  return {
    success: true,
    provider: response.provider,
    data: {
      recommendations,
    },
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
  });

  return {
    success: true,
    provider: response.provider,
    data: response.data,
    analysis: response.data,
    result: response.data,
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
};
