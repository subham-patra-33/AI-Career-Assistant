// backend/src/utils/gemini.js

<<<<<<< HEAD
<<<<<<< HEAD
const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
=======
const MODEL =
  process.env.GEMINI_MODEL || "gemini-3.6-flash";
=======
function getModelName() {
  return process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
}
>>>>>>> 1c15bfd (Update GauravGo gaming website)

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY;
>>>>>>> 93f05e4 (Fix Gemini AI skill gap analysis)

if (!GEMINI_API_KEY) {
  console.warn(
    "⚠️ GEMINI_API_KEY is not configured. Gemini features will not work."
  );
}

let genaiClient = null;

async function getGeminiClient() {
  if (genaiClient) return genaiClient;

  if (!GEMINI_API_KEY) {
    const error = new Error(
      "GEMINI_API_KEY is missing in backend/.env"
    );

    error.code = "GEMINI_AUTH";
    error.status = 401;

    throw error;
  }

  const { GoogleGenAI } =
    await import("@google/genai");

  genaiClient = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
  });

  return genaiClient;
}

<<<<<<< HEAD
=======
/*
|--------------------------------------------------------------------------
| Clean JSON
|--------------------------------------------------------------------------
*/

>>>>>>> 93f05e4 (Fix Gemini AI skill gap analysis)
function cleanJsonText(text) {
  if (!text) return "";

  let cleaned = String(text).trim();

<<<<<<< HEAD
  cleaned = cleaned.replace(/^```json\s*/i, "");
  cleaned = cleaned.replace(/^```\s*/i, "");
  cleaned = cleaned.replace(/\s*```$/i, "");
=======
  cleaned = cleaned.replace(
    /^```json\s*/i,
    ""
  );

  cleaned = cleaned.replace(
    /^```\s*/i,
    ""
  );

  cleaned = cleaned.replace(
    /\s*```$/i,
    ""
  );
>>>>>>> 93f05e4 (Fix Gemini AI skill gap analysis)

  return cleaned.trim();
}

<<<<<<< HEAD
=======
/*
|--------------------------------------------------------------------------
| Parse Gemini JSON
|--------------------------------------------------------------------------
*/

>>>>>>> 93f05e4 (Fix Gemini AI skill gap analysis)
function parseGeminiJson(text) {
  const cleaned =
    cleanJsonText(text);

  try {
    return JSON.parse(cleaned);
<<<<<<< HEAD
  } catch (_) {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(
          cleaned.slice(firstBrace, lastBrace + 1)
=======
  } catch (firstError) {
    const firstBrace =
      cleaned.indexOf("{");

    const lastBrace =
      cleaned.lastIndexOf("}");

    if (
      firstBrace !== -1 &&
      lastBrace !== -1 &&
      lastBrace > firstBrace
    ) {
      const possibleJson =
        cleaned.slice(
          firstBrace,
          lastBrace + 1
        );

      try {
        return JSON.parse(
          possibleJson
        );
      } catch (secondError) {
        throw new Error(
          "Gemini returned invalid JSON."
>>>>>>> 93f05e4 (Fix Gemini AI skill gap analysis)
        );
      } catch (_) {
        // Continue to final error.
      }
    }

    throw new Error("Gemini returned invalid JSON.");
  }
}

<<<<<<< HEAD
function withTimeout(promise, timeoutMs = 90000) {
  let timer;

  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(
        new Error(
          "Gemini request timed out. Please try again."
        )
      );
    }, timeoutMs);
  });

  return Promise.race([
    promise,
    timeoutPromise
  ]).finally(() => {
    clearTimeout(timer);
  });
}

=======
/*
|--------------------------------------------------------------------------
| Promise Timeout
|--------------------------------------------------------------------------
*/

function withTimeout(
  promise,
  timeoutMs = 60000
) {
  let timeoutId;

  const timeoutPromise =
    new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        const error = new Error(
          "Gemini request timed out. Please try again."
        );

        error.code =
          "GEMINI_TIMEOUT";

        error.status = 504;

        reject(error);
      }, timeoutMs);
    });

  return Promise.race([
    promise.finally(() =>
      clearTimeout(timeoutId)
    ),
    timeoutPromise,
  ]);
}

/*
|--------------------------------------------------------------------------
| Extract Gemini Error Information
|--------------------------------------------------------------------------
*/

function getGeminiErrorInfo(error) {
  const message =
    String(
      error?.message ||
        error?.error?.message ||
        error ||
        ""
    );

  const status =
    Number(
      error?.status ||
        error?.statusCode ||
        error?.response?.status ||
        error?.error?.code ||
        0
    ) || 0;

  const lower =
    message.toLowerCase();

  return {
    message,
    status,
    lower,
  };
}

/*
|--------------------------------------------------------------------------
| Normalize Gemini Error
|--------------------------------------------------------------------------
*/

function normalizeGeminiError(error) {
  const {
    message,
    status,
    lower,
  } = getGeminiErrorInfo(error);

  /*
  |--------------------------------------------------------------------------
  | Authentication
  |--------------------------------------------------------------------------
  */

  if (
    status === 401 ||
    status === 403 ||
    lower.includes("api key") ||
    lower.includes("unauthorized") ||
    lower.includes("permission denied") ||
    lower.includes("authentication")
  ) {
    const normalized =
      new Error(
        "Gemini API authentication failed. Check GEMINI_API_KEY."
      );

    normalized.code =
      "GEMINI_AUTH";

    normalized.status = 401;

    return normalized;
  }

  /*
  |--------------------------------------------------------------------------
  | Quota / Rate Limit
  |--------------------------------------------------------------------------
  */

  if (
    status === 429 ||
    lower.includes("quota") ||
    lower.includes("rate limit") ||
    lower.includes("resource exhausted")
  ) {
    const normalized =
      new Error(
        "Gemini API quota or rate limit reached. Please try again later."
      );

    normalized.code =
      "GEMINI_QUOTA";

    normalized.status = 429;

    return normalized;
  }

  /*
  |--------------------------------------------------------------------------
  | Model Not Found
  /*
  |--------------------------------------------------------------------------
  | Temporary Server Errors / High Demand (503 / 502 / 504)
  |--------------------------------------------------------------------------
  */

  if (
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    lower.includes("high demand") ||
    lower.includes("temporarily unavailable") ||
    lower.includes("service unavailable") ||
    lower.includes("internal server error") ||
    lower.includes("spikes in demand") ||
    (lower.includes("model") && lower.includes("unavailable"))
  ) {
    const normalized =
      new Error(
        "Gemini is temporarily experiencing high demand. Retrying..."
      );

    normalized.code =
      "GEMINI_TEMPORARY_ERROR";

    normalized.status = 503;

    return normalized;
  }

  /*
  |--------------------------------------------------------------------------
  | Model Not Found
  |--------------------------------------------------------------------------
  */

  if (
    status === 404 ||
    lower.includes("model not found") ||
    (lower.includes("model") && lower.includes("not found"))
  ) {
    const normalized =
      new Error(
        `Gemini model "${getModelName()}" was not found. Check GEMINI_MODEL in backend/.env.`
      );

    normalized.code =
      "GEMINI_MODEL";

    normalized.status = 502;

    return normalized;
  }

  /*
  |--------------------------------------------------------------------------
  | Timeout
  |--------------------------------------------------------------------------
  */

  if (
    error?.code ===
      "GEMINI_TIMEOUT" ||
    lower.includes("timeout") ||
    lower.includes("timed out")
  ) {
    const normalized =
      new Error(
        "Gemini request timed out. Please try again."
      );

    normalized.code =
      "GEMINI_TIMEOUT";

    normalized.status = 504;

    return normalized;
  }

  /*
  |--------------------------------------------------------------------------
  | Generic
  |--------------------------------------------------------------------------
  */

  const normalized =
    new Error(
      message ||
        "Gemini request failed."
    );

  normalized.code =
    "GEMINI_ERROR";

  normalized.status =
    status || 500;

  return normalized;
}

/*
|--------------------------------------------------------------------------
| Core Gemini JSON Generator
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| There is intentionally NO gemini-2.5-flash fallback here.
|
| Your previous version was falling back to:
|
| gemini-2.5-flash
|
| which is exactly what caused the 404 shown in your screenshot.
|
|--------------------------------------------------------------------------
*/

>>>>>>> 93f05e4 (Fix Gemini AI skill gap analysis)
async function generateGeminiJSON(
  prompt,
  responseSchema,
  options = {}
) {
  const client =
    await getGeminiClient();

<<<<<<< HEAD
  const timeoutMs = options.timeout || 90000;

  const models = [
    MODEL,
    "gemini-3.7-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-2.5-flash"
  ].filter(
    (model, index, arr) =>
      arr.indexOf(model) === index
  );

  let lastError;

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(
          `🤖 Gemini: ${model} | Attempt ${attempt}/2`
        );

        const response = await withTimeout(
          client.models.generateContent({
            model,
            contents: prompt,

            config: {
              responseFormat: {
                text: {
                  mimeType: "application/json",
                  schema: responseSchema
                }
              },

              ...(options.temperature !== undefined
                ? {
                    temperature: options.temperature
                  }
                : {})
            }
          }),

          timeoutMs
        );

        const text = response?.text;

        if (!text) {
          throw new Error(
            "Gemini returned an empty response."
          );
        }

        const result = parseGeminiJson(text);

        console.log(
          `✅ Gemini response received using ${model}`
        );

        return result;

      } catch (error) {
        lastError = error;

        const message =
          error?.message || String(error);

        console.error(
          `❌ Gemini ${model} attempt ${attempt}:`,
          message
        );

        const lower = message.toLowerCase();

        const isTemporary =
          message.includes("429") ||
          message.includes("503") ||
          message.includes("UNAVAILABLE") ||
          lower.includes("high demand") ||
          lower.includes("timeout") ||
          lower.includes("timed out") ||
          lower.includes(
            "temporarily unavailable"
          ) ||
          lower.includes("overloaded");

        if (!isTemporary) {
          break;
        }

        if (attempt < 2) {
          const delay = attempt * 3000;

          console.log(
            `⏳ Retrying in ${delay / 1000} seconds...`
          );

          await new Promise(resolve =>
            setTimeout(resolve, delay)
          );
        }
      }
    }

    console.log(
      "🔄 Trying next Gemini model..."
=======
  const timeoutMs =
    options.timeout || 60000;

  const temperature =
    options.temperature !==
    undefined
      ? options.temperature
      : 0.2;

  const model = getModelName();

  console.log(
    `🤖 Gemini model: ${model}`
  );

  try {
    const response =
      await withTimeout(
        client.models.generateContent({
          model,

          contents: prompt,

          config: {
            temperature,

            responseMimeType:
              "application/json",

            responseSchema,
          },
        }),

        timeoutMs
      );

    const text =
      response?.text;

    if (!text) {
      const error =
        new Error(
          "Gemini returned an empty response."
        );

      error.code =
        "GEMINI_EMPTY_RESPONSE";

      error.status = 502;

      throw error;
    }

    return parseGeminiJson(text);
  } catch (error) {
    const normalized =
      normalizeGeminiError(error);

    console.error(
      "❌ Gemini Error:",
      normalized.message
    );

    console.error(
      "Model:",
<<<<<<< HEAD
      MODEL
>>>>>>> 93f05e4 (Fix Gemini AI skill gap analysis)
=======
      model
>>>>>>> 1c15bfd (Update GauravGo gaming website)
    );

    console.error(
      "Status:",
      normalized.status
    );

    console.error(
      "Code:",
      normalized.code
    );

    throw normalized;
  }

  throw new Error(
    lastError?.message ||
      "Gemini request failed after multiple attempts."
  );
}

/*
|--------------------------------------------------------------------------
| Resume Generation
|--------------------------------------------------------------------------
<<<<<<< HEAD
*/

async function callGemini(inputData = {}) {

=======
|
| Used by:
|
| POST /api/ai/generate
|
|--------------------------------------------------------------------------
*/

async function callGemini(
  inputData = {}
) {
>>>>>>> 93f05e4 (Fix Gemini AI skill gap analysis)
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
    education = [],
    projects = [],
    certifications = [],
    achievements = [],
  } = inputData;

<<<<<<< HEAD
  const jd = String(
    jobDescription || ""
  ).slice(0, 14000);
=======
  const candidateName =
    name || fullName;
>>>>>>> 93f05e4 (Fix Gemini AI skill gap analysis)

  const prompt = `
You are the resume-generation engine for a professional
resume builder similar to Zety.

You are an expert ATS resume writer,
technical recruiter, and career advisor.

Create ONE professional, concise,
ATS-friendly resume for the candidate below.

The final resume will be rendered as a
SINGLE A4 PAGE.

Use standard ATS section names and plain text.

Do NOT use:
- tables
- columns
- icons
- graphics
- emojis
- decorative symbols
- unusual formatting

==================================================
CANDIDATE
==================================================

Name:
${candidateName}

Career level:
${careerLevel}

Target role:
${targetRole || "Not specified"}

Email:
${email}

Phone:
${phone}

Location:
${location}

LinkedIn:
${linkedin}

GitHub/Portfolio:
${github}


==================================================
JOB DESCRIPTION
==================================================

${jd || "Not provided"}


==================================================
EXISTING CANDIDATE CONTENT
==================================================

Summary:
${summary}

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

<<<<<<< HEAD

==================================================
STRICT TRUTH RULES
==================================================

1. Never invent jobs, employers, degrees, projects,
   certifications, dates, technologies,
   responsibilities, awards, metrics, or achievements.
=======
IMPORTANT RULES:

1. Never invent employment, education, projects,
   certifications, achievements, technologies, dates,
   companies, job titles, responsibilities, or measurable
   results.
>>>>>>> 93f05e4 (Fix Gemini AI skill gap analysis)

2. Only use facts supported by the candidate's
   supplied information.

3. You may improve grammar, clarity, structure,
   and professional wording.

<<<<<<< HEAD
4. Never fabricate percentages, numbers,
   performance improvements, team sizes,
   users, revenue, rankings, or other metrics.

5. Preserve the candidate's contact information
   exactly.

6. Never turn a job-description requirement
   into a claimed candidate skill.
=======
4. Do not create fake metrics such as "increased performance
   by 40%" unless the candidate explicitly provided that
   information.

5. Do not add a technology to the candidate's actual Skills
   section simply because it appears in the job description.

6. If a target role is provided, identify relevant skills
   separately.
>>>>>>> 93f05e4 (Fix Gemini AI skill gap analysis)

7. ATS keywords can be identified separately
   in atsKeywords.

8. Unsupported keywords must NOT be added
   to the candidate's actual skills.

9. Do not create experience or projects
   merely to fill space.

<<<<<<< HEAD
=======
10. Write strong achievement-oriented bullets only when
    supported by the candidate's actual information.
>>>>>>> 93f05e4 (Fix Gemini AI skill gap analysis)

==================================================
ONE-PAGE RULES
==================================================

Summary:
35-55 words when enough information exists.

Skills:
Prioritize 10-20 relevant skills that are
actually supported.

Experience:
Maximum 3 roles.
Maximum 4 bullets per role.

Projects:
Maximum 3 projects.
Maximum 3 bullets per project.

Education:
Maximum 2 entries.

Certifications:
Maximum 4.

Achievements:
Maximum 4.

Remove:
- repetition
- filler
- generic statements

Use strong action verbs when truthful.

Prioritize information relevant to
the target role.

If a job description is supplied,
naturally use matching terminology only
when the candidate's information supports it.


==================================================
CAREER LEVEL GUIDANCE
==================================================

Student / New Graduate:
Prioritize education, projects, skills,
internships, certifications, and achievements.

Internship:
Prioritize projects, practical experience,
and relevant skills.

Entry Level:
Prioritize practical experience,
projects, and job-relevant skills.

Experienced Professional:
Prioritize recent professional experience
and measurable achievements only when supplied.


==================================================
OUTPUT
==================================================

Return ONLY valid JSON matching the
supplied schema.

No Markdown.

No explanation outside JSON.
`;

  return generateGeminiJSON(

    prompt,
    {
      type: "object",

      additionalProperties: false,

      properties: {

        name: {
          type: "string",
        },

        contact: {
          type: "object",

          additionalProperties: false,

          properties: {

            email: {
              type: "string",
            },

            phone: {
              type: "string",
            },

            location: {
              type: "string",
            },

            linkedin: {
              type: "string",
            },

            github: {
<<<<<<< HEAD
              type: "string"
            }

=======
              type: "string",
            },
>>>>>>> 93f05e4 (Fix Gemini AI skill gap analysis)
          },

          required: [
            "email",
            "phone",
            "location",
            "linkedin",
<<<<<<< HEAD
            "github"
          ]
=======
            "github",
          ],
>>>>>>> 93f05e4 (Fix Gemini AI skill gap analysis)
        },

        targetRole: {
          type: "string",
        },

        summary: {
          type: "string",
        },

        skills: {
          type: "array",

          items: {
            type: "string",
          },
        },

        recommendedSkills: {
          type: "array",

          items: {
            type: "string",
          },
        },

        skillGaps: {
          type: "array",

          items: {
            type: "string",
          },
        },

        atsKeywords: {
          type: "array",
          items: {
            type: "string"
          }
        },

        experience: {

          type: "array",

          items: {

            type: "object",

            additionalProperties: false,

            properties: {

              company: {
                type: "string",
              },

              role: {
                type: "string",
              },

              start: {
                type: "string"
              },

              end: {
                type: "string"
              },

              duration: {
                type: "string",
              },

              bullets: {
                type: "array",
                items: {
<<<<<<< HEAD
                  type: "string"
                }
              }

=======
                  type: "string",
                },
              },
>>>>>>> 93f05e4 (Fix Gemini AI skill gap analysis)
            },

            required: [
              "company",
              "role",
<<<<<<< HEAD
              "start",
              "end",
              "duration",
              "bullets"
            ]
          }
=======
              "duration",
              "bullets",
            ],
          },
>>>>>>> 93f05e4 (Fix Gemini AI skill gap analysis)
        },

        projects: {

          type: "array",

          items: {

            type: "object",

            additionalProperties: false,

            properties: {

              title: {
                type: "string"
              },

              name: {
                type: "string",
              },

              description: {
                type: "string",
              },

              bullets: {
                type: "array",
                items: {
                  type: "string"
                }
              },

              technologies: {
                type: "array",
                items: {
<<<<<<< HEAD
                  type: "string"
                }
              }

            },

            required: [
              "title",
              "description",
              "bullets",
              "technologies"
            ]
          }
=======
                  type: "string",
                },
              },
            },

            required: [
              "name",
              "description",
              "technologies",
            ],
          },
>>>>>>> 93f05e4 (Fix Gemini AI skill gap analysis)
        },

        education: {

          type: "array",

          items: {

            type: "object",

            additionalProperties: false,

            properties: {

              institution: {
                type: "string",
              },

              school: {
                type: "string"
              },

              degree: {
                type: "string",
              },

              year: {
                type: "string"
              },

              grade: {
                type: "string"
              },

              duration: {
<<<<<<< HEAD
                type: "string"
              }

=======
                type: "string",
              },
>>>>>>> 93f05e4 (Fix Gemini AI skill gap analysis)
            },

            required: [
              "institution",
              "degree",
<<<<<<< HEAD
              "year",
              "grade"
            ]
          }
=======
              "duration",
            ],
          },
>>>>>>> 93f05e4 (Fix Gemini AI skill gap analysis)
        },

        certifications: {
          type: "array",
          items: {
            type: "string",
          },
        },

        achievements: {
          type: "array",
          items: {
<<<<<<< HEAD
            type: "string"
          }
        }

=======
            type: "string",
          },
        },
>>>>>>> 93f05e4 (Fix Gemini AI skill gap analysis)
      },

      required: [
        "name",
        "contact",
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
<<<<<<< HEAD
      timeout: 90000,
      temperature: 0.25
=======
      timeout: 60000,
      temperature: 0.2,
>>>>>>> 93f05e4 (Fix Gemini AI skill gap analysis)
    }
  );
}

/*
|--------------------------------------------------------------------------
| Job Description → Resume Matching
|--------------------------------------------------------------------------
*/

async function analyzeJobDescription(
  jobDescription,
  resumeData = {}
) {
<<<<<<< HEAD

=======
>>>>>>> 93f05e4 (Fix Gemini AI skill gap analysis)
  if (
    !jobDescription ||
    !jobDescription.trim()
  ) {
    throw new Error(
      "Job description is required."
    );
  }

  const prompt = `
You are an expert ATS analyst,
technical recruiter, and career coach.

Analyze the job description and compare it
against the candidate's resume.


==================================================
JOB DESCRIPTION
==================================================

${String(jobDescription).slice(0, 16000)}

<<<<<<< HEAD

==================================================
=======
========================
>>>>>>> 93f05e4 (Fix Gemini AI skill gap analysis)
CANDIDATE RESUME
==================================================

${JSON.stringify(
  resumeData,
  null,
  2
)}

<<<<<<< HEAD

==================================================
TASK
==================================================
=======
========================
YOUR TASK
========================
>>>>>>> 93f05e4 (Fix Gemini AI skill gap analysis)

Analyze:

1. Target job title
2. Required technical skills
3. Soft skills
4. Tools
5. Frameworks
6. Libraries
7. Technologies
8. ATS keywords
9. Main responsibilities
10. Candidate's matching skills
11. Candidate's missing skills
12. Missing ATS keywords
13. Practical recommendations
14. Overall resume-to-job match score from 0 to 100

<<<<<<< HEAD

==================================================
IMPORTANT
==================================================
=======
========================
VERY IMPORTANT
========================
>>>>>>> 93f05e4 (Fix Gemini AI skill gap analysis)

Only classify a skill as matched when
the candidate resume clearly supports it.

If a required skill is not supported,
put it in missingSkills.

Never invent:

- experience
- projects
- certifications
- technologies
- achievements
- metrics
- responsibilities

<<<<<<< HEAD
Recommendations must not falsely claim
the candidate already knows a missing skill.
=======
Do not recommend adding a skill to the resume as if the
candidate already knows it.
>>>>>>> 93f05e4 (Fix Gemini AI skill gap analysis)

The score must reflect actual overlap between
the supplied resume and job requirements.

Return ONLY valid JSON.

No Markdown.

No explanation outside JSON.
`;

  return generateGeminiJSON(

    prompt,

    {
      type: "object",

      additionalProperties: false,

      properties: {

        jobTitle: {
          type: "string",
        },

        matchScore: {
          type: "number",
        },

        requiredSkills: {
          type: "array",
          items: {
            type: "string",
          },
        },

        softSkills: {
          type: "array",
          items: {
            type: "string",
          },
        },

        toolsAndTechnologies: {
          type: "array",
          items: {
            type: "string",
          },
        },

        atsKeywords: {
          type: "array",
          items: {
            type: "string",
          },
        },

        responsibilities: {
          type: "array",
          items: {
            type: "string",
          },
        },

        matchedSkills: {
          type: "array",
          items: {
            type: "string",
          },
        },

        missingSkills: {
          type: "array",
          items: {
            type: "string",
          },
        },

        missingKeywords: {
          type: "array",
          items: {
            type: "string",
          },
        },

        recommendations: {
          type: "array",
          items: {
<<<<<<< HEAD
            type: "string"
          }
        }

=======
            type: "string",
          },
        },
>>>>>>> 93f05e4 (Fix Gemini AI skill gap analysis)
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

async function generateSuggestions(
  resumeData = {}
) {
  const prompt = `
You are an expert resume reviewer and career advisor.

Review the candidate's resume information and provide useful,
realistic suggestions for improvement.

Do not invent experience or skills.

Return ONLY valid JSON.

RESUME DATA:
${JSON.stringify(
  resumeData,
  null,
  2
)}
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
              category: {
                type: "string",
              },

              suggestion: {
                type: "string",
              },

              priority: {
                type: "string",
              },
            },

            required: [
              "category",
              "suggestion",
              "priority",
            ],
          },
        },
      },

      required: [
        "suggestions",
      ],
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