// backend/src/utils/gemini.js

const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn(
    "⚠️ GEMINI_API_KEY is not configured. Gemini features will not work."
  );
}

let genaiClient = null;

async function getGeminiClient() {
  if (genaiClient) return genaiClient;

  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing in backend/.env");
  }

  const { GoogleGenAI } = await import("@google/genai");

  genaiClient = new GoogleGenAI({
    apiKey: GEMINI_API_KEY
  });

  return genaiClient;
}

function cleanJsonText(text) {
  if (!text) return "";

  let cleaned = String(text).trim();

  cleaned = cleaned.replace(/^```json\s*/i, "");
  cleaned = cleaned.replace(/^```\s*/i, "");
  cleaned = cleaned.replace(/\s*```$/i, "");

  return cleaned.trim();
}

function parseGeminiJson(text) {
  const cleaned = cleanJsonText(text);

  try {
    return JSON.parse(cleaned);
  } catch (_) {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(
          cleaned.slice(firstBrace, lastBrace + 1)
        );
      } catch (_) {
        // Continue to final error.
      }
    }

    throw new Error("Gemini returned invalid JSON.");
  }
}

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

async function generateGeminiJSON(
  prompt,
  responseSchema,
  options = {}
) {
  const client = await getGeminiClient();

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
    );
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
*/

async function callGemini(inputData = {}) {

  const {
    targetRole = "",
    careerLevel = "Student / New Graduate",
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

  const jd = String(
    jobDescription || ""
  ).slice(0, 14000);

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
${name}

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


==================================================
STRICT TRUTH RULES
==================================================

1. Never invent jobs, employers, degrees, projects,
   certifications, dates, technologies,
   responsibilities, awards, metrics, or achievements.

2. Only use facts supported by the candidate's
   supplied information.

3. You may improve grammar, clarity, structure,
   and professional wording.

4. Never fabricate percentages, numbers,
   performance improvements, team sizes,
   users, revenue, rankings, or other metrics.

5. Preserve the candidate's contact information
   exactly.

6. Never turn a job-description requirement
   into a claimed candidate skill.

7. ATS keywords can be identified separately
   in atsKeywords.

8. Unsupported keywords must NOT be added
   to the candidate's actual skills.

9. Do not create experience or projects
   merely to fill space.


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
          type: "string"
        },

        contact: {
          type: "object",

          additionalProperties: false,

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

          },

          required: [
            "email",
            "phone",
            "location",
            "linkedin",
            "github"
          ]
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
                type: "string"
              },

              role: {
                type: "string"
              },

              start: {
                type: "string"
              },

              end: {
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

            },

            required: [
              "company",
              "role",
              "start",
              "end",
              "duration",
              "bullets"
            ]
          }
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
                type: "string"
              },

              description: {
                type: "string"
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
        },

        education: {

          type: "array",

          items: {

            type: "object",

            additionalProperties: false,

            properties: {

              institution: {
                type: "string"
              },

              school: {
                type: "string"
              },

              degree: {
                type: "string"
              },

              year: {
                type: "string"
              },

              grade: {
                type: "string"
              },

              duration: {
                type: "string"
              }

            },

            required: [
              "institution",
              "degree",
              "year",
              "grade"
            ]
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
        "atsKeywords",
        "experience",
        "projects",
        "education",
        "certifications",
        "achievements"
      ]
    },

    {
      timeout: 90000,
      temperature: 0.25
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


==================================================
CANDIDATE RESUME
==================================================

${JSON.stringify(
  resumeData,
  null,
  2
)}


==================================================
TASK
==================================================

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


==================================================
IMPORTANT
==================================================

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

Recommendations must not falsely claim
the candidate already knows a missing skill.

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