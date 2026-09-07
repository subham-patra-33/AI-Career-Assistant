// backend/src/utils/gemini.js

const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn(
    "⚠️ GEMINI_API_KEY is not configured. Gemini features will not work."
  );
}

/*
|--------------------------------------------------------------------------
| Gemini Client
|--------------------------------------------------------------------------
|
| @google/genai is an ESM package, while this project uses CommonJS.
| Therefore we load it dynamically.
|
|--------------------------------------------------------------------------
*/

let genaiClient = null;

async function getGeminiClient() {
  if (genaiClient) {
    return genaiClient;
  }

  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing in backend/.env");
  }

  const { GoogleGenAI } = await import("@google/genai");

  genaiClient = new GoogleGenAI({
    apiKey: GEMINI_API_KEY
  });

  return genaiClient;
}


/*
|--------------------------------------------------------------------------
| Utility: Remove Markdown JSON
|--------------------------------------------------------------------------
*/

function cleanJsonText(text) {
  if (!text) {
    return "";
  }

  let cleaned = String(text).trim();

  // Remove ```json ... ```
  cleaned = cleaned.replace(/^```json\s*/i, "");
  cleaned = cleaned.replace(/^```\s*/i, "");
  cleaned = cleaned.replace(/\s*```$/i, "");

  return cleaned.trim();
}


/*
|--------------------------------------------------------------------------
| Utility: Safe JSON Parse
|--------------------------------------------------------------------------
*/

function parseGeminiJson(text) {
  const cleaned = cleanJsonText(text);

  try {
    return JSON.parse(cleaned);
  } catch (firstError) {
    /*
     * Sometimes models may put a little extra text around JSON.
     * Try extracting the first JSON object.
     */

    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1) {
      const possibleJson = cleaned.slice(
        firstBrace,
        lastBrace + 1
      );

      try {
        return JSON.parse(possibleJson);
      } catch (secondError) {
        throw new Error(
          "Gemini returned invalid JSON."
        );
      }
    }

    throw new Error(
      "Gemini returned invalid JSON."
    );
  }
}


/*
|--------------------------------------------------------------------------
| Utility: Promise Timeout
|--------------------------------------------------------------------------
*/

function withTimeout(promise, timeoutMs = 60000) {
  return Promise.race([
    promise,

    new Promise((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            "Gemini request timed out. Please try again."
          )
        );
      }, timeoutMs);
    })
  ]);
}


/*
|--------------------------------------------------------------------------
| Core Gemini JSON Generator
|--------------------------------------------------------------------------
*/

async function generateGeminiJSON(
  prompt,
  responseSchema,
  options = {}
) {
  const client = await getGeminiClient();

  const timeoutMs = options.timeout || 60000;

  try {
    const response = await withTimeout(
      client.models.generateContent({
        model: MODEL,

        contents: prompt,

        config: {
          temperature:
            options.temperature !== undefined
              ? options.temperature
              : 0.2,

          responseMimeType: "application/json",

          responseSchema
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

    return parseGeminiJson(text);

  } catch (error) {
    console.error(
      "❌ Gemini Error:",
      error?.message || error
    );

    /*
     * Give the frontend a useful error rather than exposing
     * an enormous SDK error object.
     */

    if (
      error?.message?.includes("404") ||
      error?.message?.includes("NOT_FOUND")
    ) {
      throw new Error(
        `Gemini model "${MODEL}" is unavailable. ` +
        `Check GEMINI_MODEL in backend/.env.`
      );
    }

    if (
      error?.message?.includes("401") ||
      error?.message?.includes("403") ||
      error?.message?.toLowerCase()?.includes("api key")
    ) {
      throw new Error(
        "Gemini API authentication failed. Check GEMINI_API_KEY."
      );
    }

    if (
      error?.message?.includes("429") ||
      error?.message?.toLowerCase()?.includes("quota")
    ) {
      throw new Error(
        "Gemini API quota or rate limit reached. Please try again later."
      );
    }

    throw new Error(
      error?.message ||
      "Gemini request failed."
    );
  }
}


/*
|--------------------------------------------------------------------------
| Resume Generation
|--------------------------------------------------------------------------
|
| Used by:
|
| POST /api/ai/generate
|
| Generates a complete professional resume.
|
|--------------------------------------------------------------------------
*/

async function callGemini(inputData = {}) {
  const {
    targetRole = "",
    jobDescription = "",
    name = "",
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
    achievements = []
  } = inputData;

  const prompt = `
You are an expert professional resume writer, ATS specialist,
technical recruiter, and career advisor.

Create a professional, ATS-friendly resume from the candidate
information below.

TARGET ROLE:
${targetRole || "Not specified"}

JOB DESCRIPTION:
${jobDescription || "Not provided"}

CANDIDATE INFORMATION:

Name:
${name}

Email:
${email}

Phone:
${phone}

Location:
${location}

LinkedIn:
${linkedin}

GitHub:
${github}

Existing Summary:
${summary}

Skills:
${JSON.stringify(skills)}

Experience:
${JSON.stringify(experience)}

Education:
${JSON.stringify(education)}

Projects:
${JSON.stringify(projects)}

Certifications:
${JSON.stringify(certifications)}

Achievements:
${JSON.stringify(achievements)}


IMPORTANT RULES:

1. Never invent employment, education, projects, certifications,
   achievements, technologies, dates, companies, job titles,
   responsibilities, or measurable results.

2. Only use information supported by the candidate data.

3. You may improve wording, grammar, clarity, and professional
   presentation.

4. Do not create fake metrics such as "increased performance by 40%"
   unless the candidate explicitly provided that information.

5. Do not add a technology to the candidate's actual Skills section
   simply because it appears in the job description.

6. If a target role is provided, identify relevant skills separately.

7. Distinguish between:
   - skills supported by the candidate
   - recommended skills for the target role
   - missing skills

8. If a job description is provided, prioritize its important
   requirements and ATS terminology.

9. Keep the resume concise and professional.

10. Write strong achievement-oriented bullets only when supported
    by the candidate's actual information.

11. The resume should work well with ATS systems.

12. Return ONLY valid JSON matching the supplied schema.

13. Do not return Markdown.

14. Do not include explanations outside the JSON object.
`;

  return generateGeminiJSON(
    prompt,

    {
      type: "object",

      properties: {
        name: {
          type: "string"
        },

        contact: {
          type: "object",

          properties: {
            email: {
              type: "string"
            },

            phone: {
              type: "string"
            },

            location: {
              type: "string"
            },

            linkedin: {
              type: "string"
            },

            github: {
              type: "string"
            }
          }
        },

        targetRole: {
          type: "string"
        },

        summary: {
          type: "string"
        },

        skills: {
          type: "array",
          items: {
            type: "string"
          }
        },

        recommendedSkills: {
          type: "array",
          items: {
            type: "string"
          }
        },

        skillGaps: {
          type: "array",
          items: {
            type: "string"
          }
        },

        experience: {
          type: "array",

          items: {
            type: "object",

            properties: {
              company: {
                type: "string"
              },

              role: {
                type: "string"
              },

              duration: {
                type: "string"
              },

              bullets: {
                type: "array",

                items: {
                  type: "string"
                }
              }
            }
          }
        },

        projects: {
          type: "array",

          items: {
            type: "object",

            properties: {
              name: {
                type: "string"
              },

              description: {
                type: "string"
              },

              technologies: {
                type: "array",

                items: {
                  type: "string"
                }
              }
            }
          }
        },

        education: {
          type: "array",

          items: {
            type: "object",

            properties: {
              institution: {
                type: "string"
              },

              degree: {
                type: "string"
              },

              duration: {
                type: "string"
              }
            }
          }
        },

        certifications: {
          type: "array",

          items: {
            type: "string"
          }
        },

        achievements: {
          type: "array",

          items: {
            type: "string"
          }
        }
      },

      required: [
        "name",
        "contact",
        "targetRole",
        "summary",
        "skills",
        "recommendedSkills",
        "skillGaps",
        "experience",
        "projects",
        "education",
        "certifications",
        "achievements"
      ]
    },

    {
      timeout: 60000,
      temperature: 0.2
    }
  );
}


/*
|--------------------------------------------------------------------------
| Job Description → Resume Matching
|--------------------------------------------------------------------------
|
| Used by:
|
| POST /api/ai/job-match
|
|--------------------------------------------------------------------------
*/

async function analyzeJobDescription(
  jobDescription,
  resumeData = {}
) {
  if (!jobDescription || !jobDescription.trim()) {
    throw new Error(
      "Job description is required."
    );
  }

  const prompt = `
You are an expert ATS analyst, technical recruiter,
and career coach.

Analyze the job description and compare it against
the candidate's resume.

========================
JOB DESCRIPTION
========================

${jobDescription}


========================
CANDIDATE RESUME
========================

${JSON.stringify(
  resumeData,
  null,
  2
)}


========================
YOUR TASK
========================

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
14. Overall resume-to-job match score


========================
VERY IMPORTANT
========================

Never assume the candidate knows something simply because
the job description requires it.

Only classify something as a MATCHED SKILL when the candidate
resume clearly supports it.

If a skill is required by the job but is not supported by the
resume, put it in missingSkills.

Do NOT invent:

- work experience
- projects
- certifications
- technologies
- achievements
- metrics
- responsibilities

Do not recommend adding a skill to the resume as if the candidate
already knows it.

Recommendations should instead explain how the candidate can
improve the resume or prepare for the role.

The match score should reflect the actual overlap between the
resume and job requirements.

Return ONLY valid JSON.
No Markdown.
No explanations outside JSON.
`;

  return generateGeminiJSON(
    prompt,

    {
      type: "object",

      properties: {
        jobTitle: {
          type: "string"
        },

        matchScore: {
          type: "number"
        },

        requiredSkills: {
          type: "array",

          items: {
            type: "string"
          }
        },

        softSkills: {
          type: "array",

          items: {
            type: "string"
          }
        },

        toolsAndTechnologies: {
          type: "array",

          items: {
            type: "string"
          }
        },

        atsKeywords: {
          type: "array",

          items: {
            type: "string"
          }
        },

        responsibilities: {
          type: "array",

          items: {
            type: "string"
          }
        },

        matchedSkills: {
          type: "array",

          items: {
            type: "string"
          }
        },

        missingSkills: {
          type: "array",

          items: {
            type: "string"
          }
        },

        missingKeywords: {
          type: "array",

          items: {
            type: "string"
          }
        },

        recommendations: {
          type: "array",

          items: {
            type: "string"
          }
        }
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
        "recommendations"
      ]
    },

    {
      timeout: 60000,
      temperature: 0.2
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
  generateGeminiJSON
};