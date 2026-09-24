// backend/src/utils/gemini.js

function getModelName() {
  return process.env.GEMINI_MODEL || "gemini-2.5-flash";
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn(
    "[WARN] GEMINI_API_KEY is not configured. Gemini features will not work."
  );
}

let genaiClient = null;

async function getGeminiClient() {
  if (genaiClient) return genaiClient;

  if (!GEMINI_API_KEY) {
    const error = new Error("GEMINI_API_KEY is missing in backend/.env");
    error.code = "GEMINI_AUTH";
    error.status = 401;
    throw error;
  }

  const { GoogleGenAI } = await import("@google/genai");

  genaiClient = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
  });

  return genaiClient;
}

/*
|--------------------------------------------------------------------------
| Clean JSON
|--------------------------------------------------------------------------
*/

function cleanJsonText(text) {
  if (!text) return "";
  let cleaned = String(text).trim();
  cleaned = cleaned.replace(/^```json\s*/i, "");
  cleaned = cleaned.replace(/^```\s*/i, "");
  cleaned = cleaned.replace(/\s*```$/i, "");
  return cleaned.trim();
}

/*
|--------------------------------------------------------------------------
| Parse Gemini JSON
|--------------------------------------------------------------------------
*/

function parseGeminiJson(text) {
  const cleaned = cleanJsonText(text);

  try {
    return JSON.parse(cleaned);
  } catch (firstError) {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
      } catch (_) {}
    }

    const firstBracket = cleaned.indexOf("[");
    const lastBracket = cleaned.lastIndexOf("]");

    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      try {
        return JSON.parse(cleaned.slice(firstBracket, lastBracket + 1));
      } catch (_) {}
    }

    throw new Error("Gemini returned invalid JSON.");
  }
}

/*
|--------------------------------------------------------------------------
| Promise Timeout
|--------------------------------------------------------------------------
*/

function withTimeout(promise, timeoutMs = 60000) {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const error = new Error(`Request timed out after ${timeoutMs}ms.`);
      error.code = "GEMINI_TIMEOUT";
      error.status = 504;
      reject(error);
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}

/*
|--------------------------------------------------------------------------
| Normalize Gemini Error
|--------------------------------------------------------------------------
*/

function normalizeGeminiError(error) {
  const rawMessage = error?.message || String(error || "");
  const lower = rawMessage.toLowerCase();
  const status = error?.status || error?.statusCode;

  if (
    status === 401 ||
    lower.includes("api key") ||
    lower.includes("unauthorized") ||
    lower.includes("authentication")
  ) {
    const normalized = new Error(
      "Invalid or missing Gemini API key. Please check GEMINI_API_KEY in backend/.env."
    );
    normalized.code = "GEMINI_AUTH";
    normalized.status = 401;
    return normalized;
  }

  if (
    status === 429 ||
    lower.includes("quota") ||
    lower.includes("rate limit") ||
    lower.includes("resource_exhausted")
  ) {
    const normalized = new Error(
      "Gemini API rate limit or quota exceeded. Please try again shortly."
    );
    normalized.code = "GEMINI_QUOTA";
    normalized.status = 429;
    return normalized;
  }

  if (
    status === 404 ||
    lower.includes("model not found") ||
    (lower.includes("model") && lower.includes("not found"))
  ) {
    const normalized = new Error(
      `Gemini model "${getModelName()}" was not found. Check GEMINI_MODEL in backend/.env.`
    );
    normalized.code = "GEMINI_MODEL";
    normalized.status = 502;
    return normalized;
  }

  if (
    status === 503 ||
    lower.includes("high demand") ||
    lower.includes("temporarily unavailable") ||
    lower.includes("overloaded")
  ) {
    const normalized = new Error(
      "Gemini is temporarily experiencing high demand. Please try again."
    );
    normalized.code = "GEMINI_HIGH_DEMAND";
    normalized.status = 503;
    return normalized;
  }

  if (error?.code === "GEMINI_TIMEOUT") {
    return error;
  }

  const normalized = new Error(rawMessage || "Gemini request failed.");
  normalized.code = "GEMINI_ERROR";
  normalized.status = status || 500;
  return normalized;
}

/*
|--------------------------------------------------------------------------
| Generate Gemini JSON
|--------------------------------------------------------------------------
*/

async function generateGeminiJSON(prompt, responseSchema, options = {}) {
  const client = await getGeminiClient();

  const timeoutMs = options.timeout || 60000;
  const temperature =
    options.temperature !== undefined ? options.temperature : 0.2;
  const primaryModel = getModelName();

  const candidateModels = [
    primaryModel,
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
  ].filter((m, i, a) => m && a.indexOf(m) === i);

  let lastError = null;

  for (const model of candidateModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[Gemini] model: ${model} | Attempt ${attempt}/2`);

        const response = await withTimeout(
          client.models.generateContent({
            model,
            contents: prompt,
            config: {
              temperature,
              responseMimeType: "application/json",
              responseSchema,
            },
          }),
          timeoutMs
        );

        const text = response?.text;

        if (!text) {
          const error = new Error("Gemini returned an empty response.");
          error.code = "GEMINI_EMPTY_RESPONSE";
          error.status = 502;
          throw error;
        }

        return parseGeminiJson(text);
      } catch (error) {
        lastError = error;
        const normalized = normalizeGeminiError(error);
        console.error(`[Gemini] Error (${model} attempt ${attempt}):`, normalized.message);

        const isTemporary =
          normalized.status === 429 ||
          normalized.status === 503 ||
          normalized.code === "GEMINI_TIMEOUT" ||
          normalized.code === "GEMINI_HIGH_DEMAND";

        if (!isTemporary) {
          // If model is not found or authentication error, try next candidate model
          break;
        }

        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, attempt * 1500));
        }
      }
    }
  }

  const finalNormalized = normalizeGeminiError(lastError);
  console.error("[Gemini] Final Error:", finalNormalized.message);
  throw finalNormalized;
}

/*
|--------------------------------------------------------------------------
| Resume Generation
| Used by: POST /api/ai/generate
|--------------------------------------------------------------------------
*/

async function callGemini(inputData = {}) {
  const {
    targetRole = "",
    careerLevel = "Student / New Graduate",
    jobDescription = "",
    name = "",
    fullName = "",
    email = "",
    phone = "",
    location = "",
    linkedin = "",
    github = "",
    summary = "",
    skills = [],
    experience = [],
    projects = [],
    education = [],
    certifications = [],
    achievements = [],
  } = inputData;

  const candidateName = name || fullName;

  const prompt = `
You are the resume-generation engine for a professional resume builder similar to Zety.
You are an expert ATS resume writer, technical recruiter, and career advisor.
Create ONE professional, concise, ATS-friendly resume for the candidate below.
The final resume will be rendered as a single-page document.

==================================================
CANDIDATE INFORMATION
==================================================

Target Role: ${targetRole || "Not specified"}
Career Level: ${careerLevel}
Full Name: ${candidateName || "Not provided"}
Email: ${email || "Not provided"}
Phone: ${phone || "Not provided"}
Location: ${location || "Not provided"}
LinkedIn: ${linkedin || "Not provided"}
GitHub: ${github || "Not provided"}

Job Description:
${jobDescription || "Not provided"}

Summary / Career Objective:
${summary || "Not provided"}

Skills:
${JSON.stringify(skills)}

Experience:
${JSON.stringify(experience)}

Projects:
${JSON.stringify(projects)}

Education:
${JSON.stringify(education)}

Certifications:
${JSON.stringify(certifications)}

Achievements:
${JSON.stringify(achievements)}

==================================================
IMPORTANT RULES:
1. Never invent employment, education, projects, certifications, achievements, technologies, dates, companies, job titles, responsibilities, or measurable results.
2. Only use facts supported by the candidate's supplied information.
3. You may improve grammar, clarity, structure, and professional wording.
4. Do not create fake metrics such as "increased performance by 40%" unless the candidate explicitly provided that information.
5. Do not add a technology to the candidate's actual Skills section simply because it appears in the job description.
6. If a target role is provided, identify relevant skills separately in recommendedSkills.
7. ATS keywords can be identified separately in atsKeywords.
8. Unsupported keywords must NOT be added to the candidate's actual skills.
9. Do not create experience or projects merely to fill space.
10. Write strong achievement-oriented bullets only when supported by the candidate's actual information.

==================================================
ONE-PAGE RULES
==================================================
Summary: 35-55 words when enough information exists.
Skills: Prioritize 10-20 relevant skills that are actually supported.
Experience: Maximum 3 roles. Maximum 4 bullets per role.
Projects: Maximum 3 projects. Maximum 3 bullets per project.
Education: Maximum 2 entries.
Certifications: Maximum 4.
Achievements: Maximum 4.

Remove repetition, filler, and generic statements.
Use strong action verbs when truthful.
Prioritize information relevant to the target role.
If a job description is supplied, naturally use matching terminology only when the candidate's information supports it.

Return ONLY valid JSON matching the supplied schema.
`;

  return generateGeminiJSON(
    prompt,
    {
      type: "object",
      properties: {
        fullName: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        location: { type: "string" },
        linkedin: { type: "string" },
        github: { type: "string" },
        targetRole: { type: "string" },
        summary: { type: "string" },
        skills: {
          type: "array",
          items: { type: "string" },
        },
        recommendedSkills: {
          type: "array",
          items: { type: "string" },
        },
        skillGaps: {
          type: "array",
          items: { type: "string" },
        },
        atsKeywords: {
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
            required: ["company", "role", "duration", "bullets"],
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
              bullets: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["name", "description", "technologies", "bullets"],
          },
        },
        education: {
          type: "array",
          items: {
            type: "object",
            properties: {
              institution: { type: "string" },
              degree: { type: "string" },
              field: { type: "string" },
              graduationDate: { type: "string" },
            },
            required: ["institution", "degree", "field", "graduationDate"],
          },
        },
        certifications: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              issuer: { type: "string" },
            },
            required: ["name", "issuer"],
          },
        },
        achievements: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: [
        "fullName",
        "email",
        "phone",
        "location",
        "linkedin",
        "github",
        "targetRole",
        "summary",
        "skills",
        "recommendedSkills",
        "skillGaps",
        "atsKeywords",
        "experience",
        "projects",
        "education",
        "certifications",
        "achievements",
      ],
    },
    {
      timeout: 60000,
      temperature: 0.2,
    }
  );
}

/*
|--------------------------------------------------------------------------
| Job Description -> Resume Matching
|--------------------------------------------------------------------------
*/

async function analyzeJobDescription(jobDescription, resumeData = {}) {
  if (!jobDescription || !jobDescription.trim()) {
    throw new Error("Job description is required.");
  }

  const prompt = `
You are an expert ATS analyst, technical recruiter, and career coach.
Analyze the job description and compare it against the candidate's resume.

==================================================
JOB DESCRIPTION
==================================================
${String(jobDescription).slice(0, 16000)}

==================================================
CANDIDATE RESUME
==================================================
${JSON.stringify(resumeData, null, 2)}

==================================================
YOUR TASK
==================================================
Analyze:
1. Target job title
2. Required technical skills
3. Soft skills
4. Tools, Frameworks, Libraries, Technologies
5. ATS keywords
6. Main responsibilities
7. Candidate's matching skills
8. Candidate's missing skills
9. Missing ATS keywords
10. Practical recommendations
11. Overall resume-to-job match score from 0 to 100

Only classify a skill as matched when the candidate resume clearly supports it.
If a required skill is not supported, put it in missingSkills.

Return ONLY valid JSON.
`;

  return generateGeminiJSON(
    prompt,
    {
      type: "object",
      properties: {
        jobTitle: { type: "string" },
        matchScore: { type: "number" },
        requiredSkills: {
          type: "array",
          items: { type: "string" },
        },
        softSkills: {
          type: "array",
          items: { type: "string" },
        },
        toolsAndTechnologies: {
          type: "array",
          items: { type: "string" },
        },
        atsKeywords: {
          type: "array",
          items: { type: "string" },
        },
        responsibilities: {
          type: "array",
          items: { type: "string" },
        },
        matchedSkills: {
          type: "array",
          items: { type: "string" },
        },
        missingSkills: {
          type: "array",
          items: { type: "string" },
        },
        missingKeywords: {
          type: "array",
          items: { type: "string" },
        },
        recommendations: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: [
        "jobTitle",
        "matchScore",
        "requiredSkills",
        "softSkills",
        "toolsAndTechnologies",
        "atsKeywords",
        "responsibilities",
        "matchedSkills",
        "missingSkills",
        "missingKeywords",
        "recommendations",
      ],
    },
    {
      timeout: 60000,
      temperature: 0.2,
    }
  );
}

/*
|--------------------------------------------------------------------------
| AI Suggestions
|--------------------------------------------------------------------------
*/

async function generateSuggestions(resumeData = {}) {
  const prompt = `
You are an expert resume reviewer and career advisor.
Review the candidate's resume information and provide useful, realistic suggestions for improvement.
Do not invent experience or skills.

Return ONLY valid JSON.

RESUME DATA:
${JSON.stringify(resumeData, null, 2)}
`;

  return generateGeminiJSON(
    prompt,
    {
      type: "object",
      properties: {
        suggestions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              category: { type: "string" },
              suggestion: { type: "string" },
              priority: { type: "string" },
            },
            required: ["category", "suggestion", "priority"],
          },
        },
      },
      required: ["suggestions"],
    },
    {
      timeout: 60000,
      temperature: 0.3,
    }
  );
}

/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

module.exports = {
  callGemini,
  analyzeJobDescription,
  generateGeminiJSON,
  generateSuggestions,
};