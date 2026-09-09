const express = require("express");
const router = express.Router();
const multer = require("multer");
const pdfParse = require("pdf-parse");

const {
  callGemini,
  generateSuggestions,
  generateMockInterview,
  evaluateInterviewAnswer,
  generateGeminiJSON,
} = require("../utils/gemini");

const auth = require("../middleware/auth");

router.use(auth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

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

      const fileName =
        req.file.originalname || "";

      const mimeType =
        req.file.mimetype || "";

      if (
        mimeType !== "application/pdf" &&
        !fileName.toLowerCase().endsWith(".pdf")
      ) {
        return res.status(400).json({
          success: false,
          error: "Please upload a PDF resume.",
        });
      }

      // --------------------------------------------------------
      // READ PDF TEXT
      // --------------------------------------------------------

      const pdf = await pdfParse(req.file.buffer);

      const resumeText =
        String(pdf.text || "").trim();

      if (!resumeText) {
        return res.status(422).json({
          success: false,
          error:
            "The PDF does not contain readable text. Please upload a text-based PDF.",
        });
      }

      console.log(
        `📄 Resume PDF read successfully: ${resumeText.length} characters`
      );

      // --------------------------------------------------------
      // ASK GEMINI TO STRUCTURE THE RESUME
      // --------------------------------------------------------

      const prompt = `
You are a professional resume parser.

Read the following resume text and extract the candidate's
REAL information into the supplied JSON structure.

IMPORTANT:

1. Extract information ONLY from the resume.
2. NEVER invent information.
3. Do not create fake companies.
4. Do not create fake colleges.
5. Do not create fake job titles.
6. Do not create fake dates.
7. Do not create fake skills.
8. Preserve the candidate's actual education.
9. Preserve the candidate's actual employment/internship experience.
10. Preserve actual projects.
11. Preserve actual certifications.
12. Preserve actual achievements.
13. Extract contact information exactly when available.
14. If a field is not present, return an empty string or empty array.
15. Return ONLY JSON.
16. Do not return Markdown.
17. Do not explain anything.

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
              name: {
                type: "string",
              },

              contact: {
                type: "object",

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
                    type: "string",
                  },
                },

                required: [
                  "email",
                  "phone",
                  "location",
                  "linkedin",
                  "github",
                ],
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

              experience: {
                type: "array",

                items: {
                  type: "object",

                  properties: {
                    company: {
                      type: "string",
                    },

                    role: {
                      type: "string",
                    },

                    duration: {
                      type: "string",
                    },

                    bullets: {
                      type: "array",
                      items: {
                        type: "string",
                      },
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
                    name: {
                      type: "string",
                    },

                    description: {
                      type: "string",
                    },

                    technologies: {
                      type: "array",
                      items: {
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
              },

              education: {
                type: "array",

                items: {
                  type: "object",

                  properties: {
                    institution: {
                      type: "string",
                    },

                    degree: {
                      type: "string",
                    },

                    duration: {
                      type: "string",
                    },
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

                items: {
                  type: "string",
                },
              },

              achievements: {
                type: "array",

                items: {
                  type: "string",
                },
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

      // --------------------------------------------------------
      // RETURN STRUCTURED RESUME
      // --------------------------------------------------------

      return res.json({
        success: true,
        resume: parsedResume,
      });

    } catch (error) {
      console.error(
        "❌ Resume PDF Import Error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          error?.message ||
          "Failed to read and import resume.",
      });
    }
  }
);

router.post("/generate", async (req, res) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({
        error: "Missing resume data",
      });
    }

    const resume = await callGemini(data);

    res.json({
      success: true,
      resume,
    });
  } catch (error) {
    console.error("❌ AI Resume Error:", error.message);

    res.status(500).json({
      success: false,
      error: error.message || "AI resume generation failed",
    });
  }
});

router.post("/suggestions", async (req, res) => {
  try {
    const suggestions = await generateSuggestions(req.body || {});

    res.json({
      success: true,
      suggestions,
    });
  } catch (error) {
    console.error("❌ AI Suggestions Error:", error.message);

    res.status(500).json({
      success: false,
      error: error.message || "AI suggestions failed",
    });
  }
});

router.post("/mock-interview/start", async (req, res) => {
  try {
    const interview = await generateMockInterview(req.body || {});

    res.json({
      success: true,
      interview,
    });
  } catch (error) {
    console.error("❌ Mock Interview Error:", error.message);

    res.status(500).json({
      success: false,
      error: error.message || "Mock interview generation failed",
    });
  }
});

router.post("/mock-interview/evaluate", async (req, res) => {
  try {
    const { question, answer } = req.body;

    if (!question) {
      return res.status(400).json({
        error: "Missing interview question",
      });
    }

    if (!answer) {
      return res.status(400).json({
        error: "Missing candidate answer",
      });
    }

    const evaluation = await evaluateInterviewAnswer(req.body);

    res.json({
      success: true,
      evaluation,
    });
  } catch (error) {
    console.error("❌ Interview Evaluation Error:", error.message);

    res.status(500).json({
      success: false,
      error: error.message || "Interview evaluation failed",
    });
  }
});

module.exports = router;