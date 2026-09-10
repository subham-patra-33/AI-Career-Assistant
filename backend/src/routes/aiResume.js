const express = require("express");
const router = express.Router();

const multer = require("multer");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

const {
  callGemini,
  generateSuggestions,
  generateMockInterview,
  evaluateInterviewAnswer,
  generateGeminiJSON,
} = require("../utils/gemini");

const auth = require("../middleware/auth");

// ============================================================
// AUTHENTICATION
// ============================================================

router.use(auth);

// ============================================================
// FILE UPLOAD CONFIGURATION
// ============================================================

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },

  fileFilter: (req, file, cb) => {
    const fileName =
      file.originalname || "";

    const mimeType =
      file.mimetype || "";

    if (
      mimeType === "application/pdf" ||
      fileName.toLowerCase().endsWith(".pdf")
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only PDF resume files are supported."
        )
      );
    }
  },
});

// ============================================================
// ATS FILE UPLOAD CONFIGURATION
// Supports PDF + DOCX
// ============================================================

const atsUpload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================

const safeNumber = (value, fallback = 0) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.max(
    0,
    Math.min(100, number)
  );
};

const safeArray = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (
        typeof item === "string"
      ) {
        return item.trim();
      }

      if (
        item === null ||
        item === undefined
      ) {
        return "";
      }

      return String(item).trim();
    })
    .filter(Boolean);
};

const safeString = (
  value,
  fallback = ""
) => {
  if (
    typeof value !== "string"
  ) {
    return fallback;
  }

  return value.trim();
};

// ============================================================
// IMPORT EXISTING RESUME PDF
// ============================================================

router.post(
  "/parse-resume-file",
  upload.single("file"),
  async (req, res) => {
    try {
      // --------------------------------------------------------
      // CHECK FILE
      // --------------------------------------------------------

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error:
            "No resume file was uploaded.",
        });
      }

      const fileName =
        req.file.originalname || "";

      const mimeType =
        req.file.mimetype || "";

      if (
        mimeType !==
          "application/pdf" &&
        !fileName
          .toLowerCase()
          .endsWith(".pdf")
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Please upload a PDF resume.",
        });
      }

      console.log(
        `📄 Reading resume PDF: ${fileName}`
      );

      // --------------------------------------------------------
      // READ PDF TEXT
      // --------------------------------------------------------

      const pdf = await pdfParse(
        req.file.buffer
      );

      const resumeText =
        String(
          pdf.text || ""
        ).trim();

      if (!resumeText) {
        return res.status(422).json({
          success: false,
          error:
            "The PDF does not contain readable text. Please upload a text-based PDF.",
        });
      }

      if (
        resumeText.length < 50
      ) {
        return res.status(422).json({
          success: false,
          error:
            "The PDF contains too little readable text to analyze. Please upload your complete resume.",
        });
      }

      console.log(
        `✅ Resume PDF read successfully: ${resumeText.length} characters`
      );

      // --------------------------------------------------------
      // ASK GEMINI TO STRUCTURE THE RESUME
      // --------------------------------------------------------

      const prompt = `
You are a professional resume parser.

Read the following resume text and extract the candidate's REAL
information into the supplied JSON structure.

IMPORTANT RULES:

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
15. Do not infer personal information that is not present.
16. Return ONLY valid JSON.
17. Do not return Markdown.
18. Do not explain anything.

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

        text: resumeText,

        fileName,
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

// ============================================================
// AI RESUME GENERATION
// ============================================================

router.post(
  "/generate",
  async (req, res) => {
    try {
      const { data } = req.body;

      if (!data) {
        return res.status(400).json({
          success: false,
          error:
            "Missing resume data",
        });
      }

      const resume =
        await callGemini(data);

      return res.json({
        success: true,
        resume,
      });

    } catch (error) {
      console.error(
        "❌ AI Resume Error:",
        error.message
      );

      return res.status(500).json({
        success: false,

        error:
          error.message ||
          "AI resume generation failed",
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
      const suggestions =
        await generateSuggestions(
          req.body || {}
        );

      return res.json({
        success: true,
        suggestions,
      });

    } catch (error) {
      console.error(
        "❌ AI Suggestions Error:",
        error.message
      );

      return res.status(500).json({
        success: false,

        error:
          error.message ||
          "AI suggestions failed",
      });
    }
  }
);

// ============================================================
// MOCK INTERVIEW START
// ============================================================

router.post(
  "/mock-interview/start",
  async (req, res) => {
    try {
      const interview =
        await generateMockInterview(
          req.body || {}
        );

      return res.json({
        success: true,
        interview,
      });

    } catch (error) {
      console.error(
        "❌ Mock Interview Error:",
        error.message
      );

      return res.status(500).json({
        success: false,

        error:
          error.message ||
          "Mock interview generation failed",
      });
    }
  }
);

// ============================================================
// MOCK INTERVIEW EVALUATION
// ============================================================

router.post(
  "/mock-interview/evaluate",
  async (req, res) => {
    try {
      const {
        question,
        answer,
      } = req.body;

      if (!question) {
        return res.status(400).json({
          success: false,
          error:
            "Missing interview question",
        });
      }

      if (!answer) {
        return res.status(400).json({
          success: false,
          error:
            "Missing candidate answer",
        });
      }

      const evaluation =
        await evaluateInterviewAnswer(
          req.body
        );

      return res.json({
        success: true,
        evaluation,
      });

    } catch (error) {
      console.error(
        "❌ Interview Evaluation Error:",
        error.message
      );

      return res.status(500).json({
        success: false,

        error:
          error.message ||
          "Interview evaluation failed",
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
      } = req.body;

      // --------------------------------------------------------
      // VALIDATION
      // --------------------------------------------------------

      if (!targetRole?.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Target job title is required.",
        });
      }

      if (!jobDescription?.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Job description is required.",
        });
      }

      if (!resume?.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Resume content is required.",
        });
      }

      if (
        jobDescription.trim()
          .length < 100
      ) {
        return res.status(400).json({
          success: false,
          message:
            "The job description is too short. Please provide the complete job description.",
        });
      }

      if (
        resume.trim().length <
        100
      ) {
        return res.status(400).json({
          success: false,
          message:
            "The resume content is too short. Please provide the complete resume.",
        });
      }

      console.log(
        `🔎 Job Match started for: ${targetRole}`
      );

      // --------------------------------------------------------
      // GEMINI PROMPT
      // --------------------------------------------------------

      const prompt = `
You are an expert recruitment, ATS and career-analysis assistant.

Your task is to compare a candidate's resume against a specific
job description and provide a realistic, useful and evidence-based
job-match analysis.

TARGET ROLE:
${targetRole}

JOB DESCRIPTION:
------------------------
${jobDescription.slice(0, 50000)}
------------------------

CANDIDATE RESUME:
------------------------
${resume.slice(0, 50000)}
------------------------

IMPORTANT RULES:

1. Analyze ONLY information actually present in the resume.

2. NEVER invent:
   - skills
   - experience
   - projects
   - certifications
   - education
   - achievements
   - companies
   - job titles
   - qualifications

3. Never recommend lying on a resume.

4. Never recommend claiming a skill that the candidate does not
   demonstrate.

5. Distinguish between:
   - required qualifications
   - preferred qualifications
   - nice-to-have qualifications

6. Consider semantic matches, not only exact keyword matches.

7. A related skill can count as a partial match when it is genuinely
   relevant.

8. Do not mark something as missing if the resume demonstrates an
   equivalent or closely related capability.

9. Do not give an artificially high score.

10. Do not give an artificially low score.

11. Consider:
    - technical skills
    - programming languages
    - frameworks
    - tools
    - databases
    - cloud technologies
    - soft skills
    - experience
    - responsibilities
    - projects
    - education
    - certifications
    - achievements
    - seniority
    - job keywords

12. Compare the candidate's experience level with the job's required
    seniority.

13. If the candidate lacks required experience, clearly explain it.

14. If a requirement is missing, do not tell the candidate to falsely
    add it to their resume.

15. Instead, recommend:
    - learning the skill
    - gaining practical experience
    - building a relevant project
    - obtaining a certification when appropriate
    - highlighting existing related experience

16. Recommendations must be practical and prioritized.

17. Only recommend adding something to the resume when it is supported
    by the candidate's real experience.

18. Identify important ATS keywords from the job description.

19. Separate required keywords from preferred keywords.

20. Interview topics must be based on the actual job description.

21. The final summary should clearly tell the candidate whether they
    appear to be a strong, moderate or weak candidate for the role.

22. Keep the response concise, useful and actionable.

SCORING GUIDELINES:

Overall score:

0-39:
Poor match

40-54:
Weak / limited match

55-69:
Moderate match / good potential

70-84:
Strong match

85-100:
Excellent match

BREAKDOWN:

skills:
How well the candidate's actual skills satisfy the role.

experience:
How well the candidate's actual experience and responsibilities
match the role.

education:
How well education and certifications satisfy requirements.

keywords:
How well important job-description terminology is represented
naturally in the resume.

IMPORTANT:

Do NOT simply count keywords.

Evaluate the meaning and relevance of the resume.

Return ONLY valid JSON.
`;

      // --------------------------------------------------------
      // RESPONSE SCHEMA
      // --------------------------------------------------------

      const responseSchema = {
        type: "object",

        properties: {
          score: {
            type: "number",
            description:
              "Overall compatibility score from 0 to 100.",
          },

          summary: {
            type: "string",
            description:
              "Short explanation of the candidate's overall fit.",
          },

          breakdown: {
            type: "object",

            properties: {
              skills: {
                type: "number",
              },

              experience: {
                type: "number",
              },

              education: {
                type: "number",
              },

              keywords: {
                type: "number",
              },
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

          requiredKeywords: {
            type: "array",
            items: {
              type: "string",
            },
          },

          preferredKeywords: {
            type: "array",
            items: {
              type: "string",
            },
          },

          experienceGaps: {
            type: "array",
            items: {
              type: "string",
            },
          },

          improvements: {
            type: "array",
            items: {
              type: "string",
            },
          },

          interviewTopics: {
            type: "array",
            items: {
              type: "string",
            },
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
      };

      // --------------------------------------------------------
      // CALL GEMINI
      // --------------------------------------------------------

      const result =
        await generateGeminiJSON(
          prompt,
          responseSchema,
          {
            temperature: 0.2,
            timeout: 90000,
          }
        );

      // --------------------------------------------------------
      // NORMALIZE RESULT
      // --------------------------------------------------------

      const response = {
        success: true,

        score: safeNumber(
          result?.score
        ),

        summary: safeString(
          result?.summary
        ),

        breakdown: {
          skills: safeNumber(
            result?.breakdown?.skills
          ),

          experience: safeNumber(
            result?.breakdown?.experience
          ),

          education: safeNumber(
            result?.breakdown?.education
          ),

          keywords: safeNumber(
            result?.breakdown?.keywords
          ),
        },

        matchedSkills:
          safeArray(
            result?.matchedSkills
          ),

        missingSkills:
          safeArray(
            result?.missingSkills
          ),

        requiredKeywords:
          safeArray(
            result?.requiredKeywords
          ),

        preferredKeywords:
          safeArray(
            result?.preferredKeywords
          ),

        experienceGaps:
          safeArray(
            result?.experienceGaps
          ),

        improvements:
          safeArray(
            result?.improvements
          ),

        interviewTopics:
          safeArray(
            result?.interviewTopics
          ),
      };

      console.log(
        `✅ Job Match completed: ${response.score}%`
      );

      return res.json(
        response
      );

    } catch (error) {
      console.error(
        "❌ Job Match Error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to analyze the job match right now.",

        error:
          process.env.NODE_ENV ===
          "development"
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
  atsUpload.single("file"),
  async (req, res) => {
    try {
      // --------------------------------------------------------
      // CHECK FILE
      // --------------------------------------------------------

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "Please upload a resume file.",
        });
      }

      const fileName =
        req.file.originalname || "";

      const lowerFileName =
        fileName.toLowerCase();

      const mimeType =
        req.file.mimetype || "";

      console.log(
        `📊 ATS analysis started for: ${fileName}`
      );

      // --------------------------------------------------------
      // VALIDATE FILE TYPE
      // --------------------------------------------------------

      const isPDF =
        mimeType ===
          "application/pdf" ||
        lowerFileName.endsWith(".pdf");

      const isDOCX =
        mimeType ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        lowerFileName.endsWith(".docx");

      const isDOC =
        lowerFileName.endsWith(".doc");

      if (!isPDF && !isDOCX && !isDOC) {
        return res.status(400).json({
          success: false,
          message:
            "Unsupported file type. Please upload a PDF or DOCX resume.",
        });
      }

      // --------------------------------------------------------
      // LEGACY DOC
      // --------------------------------------------------------

      if (isDOC) {
        return res.status(400).json({
          success: false,
          message:
            "Legacy .doc files are not supported yet. Please save the resume as PDF or DOCX and upload it again.",
        });
      }

      // --------------------------------------------------------
      // EXTRACT RESUME TEXT
      // --------------------------------------------------------

      let resumeText = "";

      // --------------------------------------------------------
      // PDF
      // --------------------------------------------------------

      if (isPDF) {
        console.log(
          "📄 Extracting text from PDF..."
        );

        const pdf =
          await pdfParse(
            req.file.buffer
          );

        resumeText =
          String(
            pdf.text || ""
          ).trim();
      }

      // --------------------------------------------------------
      // DOCX
      // --------------------------------------------------------

      if (isDOCX) {
        console.log(
          "📝 Extracting text from DOCX..."
        );

        const result =
          await mammoth.extractRawText({
            buffer:
              req.file.buffer,
          });

        resumeText =
          String(
            result.value || ""
          ).trim();
      }

      // --------------------------------------------------------
      // VALIDATE EXTRACTED TEXT
      // --------------------------------------------------------

      if (!resumeText) {
        return res.status(422).json({
          success: false,
          message:
            "Could not extract readable text from this resume. Please upload a text-based PDF or DOCX file.",
        });
      }

      if (
        resumeText.length < 50
      ) {
        return res.status(422).json({
          success: false,
          message:
            "The resume contains too little readable text to analyze.",
        });
      }

      // Limit prompt size
      resumeText =
        resumeText.slice(
          0,
          50000
        );

      console.log(
        `✅ Resume text extracted: ${resumeText.length} characters`
      );

      // --------------------------------------------------------
      // ATS PROMPT
      // --------------------------------------------------------

      const prompt = `
You are an expert Applicant Tracking System (ATS), professional
recruiter and resume evaluator.

Analyze the candidate's resume below and produce a realistic ATS
compatibility report.

RESUME:
--------------------------------
${resumeText}
--------------------------------

IMPORTANT RULES:

1. Analyze ONLY information present in the resume.

2. NEVER invent:
   - skills
   - experience
   - companies
   - job titles
   - education
   - certifications
   - projects
   - achievements
   - contact information

3. Do not assume that the candidate has a skill simply because it is
   common for their job.

4. Evaluate the resume as an ATS would, while also considering human
   recruiter quality.

5. Score the resume from 0 to 100.

6. Consider:

   - Contact information
   - Professional summary
   - Skills
   - Work experience
   - Internship experience
   - Projects
   - Education
   - Certifications
   - Achievements
   - Keywords
   - Readability
   - Resume structure
   - ATS-friendly formatting
   - Quantifiable achievements
   - Action verbs
   - Relevance
   - Consistency

7. Do not punish a candidate simply because they are a student or
   fresher.

8. Do not assume missing experience is a formatting problem.

9. Separate genuine weaknesses from things that are simply not
   applicable.

10. Identify important keywords that actually appear in the resume.

11. Identify important keywords that appear to be missing from the
    resume based on the resume's apparent target role.

12. Missing keywords should be reasonable and relevant.

13. Do not recommend adding a skill unless there is evidence that the
    candidate may genuinely possess or be developing it.

14. Never recommend lying.

15. Suggestions must be practical and actionable.

16. Evaluate formatting from the extracted text. Since you cannot see
    the original visual document, do not make claims about exact font,
    colors, spacing or visual design.

17. A resume can score well even if the candidate has limited work
    experience when their education, projects and skills are strong.

18. Contact score should consider whether useful contact information
    is present.

19. Content score should consider the strength and completeness of
    the actual resume content.

20. Keyword score should consider relevance and presence of useful
    job-related terminology.

21. Formatting score should focus only on ATS-friendly text structure
    that can be inferred from the extracted document.

22. Return ONLY valid JSON.

23. Do not return Markdown.

24. Do not explain anything outside the JSON.

SCORING GUIDELINES:

90-100:
Excellent ATS readiness.

80-89:
Very strong ATS readiness.

70-79:
Good ATS readiness with some improvements needed.

60-69:
Average ATS readiness.

40-59:
Weak ATS readiness.

0-39:
Poor ATS readiness.

SECTION STATUS:

For each major section, return:
- "good"
- "needs-improvement"
- "missing"

Evaluate:

- Contact
- Summary
- Skills
- Experience
- Projects
- Education
- Certifications

Provide concise suggestions for improvement.

Return the final result according to the supplied JSON schema.
`;

      // --------------------------------------------------------
      // ATS RESPONSE SCHEMA
      // --------------------------------------------------------

      const responseSchema = {
        type: "object",

        properties: {
          score: {
            type: "number",
            description:
              "Overall ATS score from 0 to 100.",
          },

          summary: {
            type: "string",
            description:
              "Short overall ATS assessment.",
          },

          keywordScore: {
            type: "number",
            description:
              "Keyword effectiveness score from 0 to 100.",
          },

          contentScore: {
            type: "number",
            description:
              "Resume content quality score from 0 to 100.",
          },

          formatting: {
            type: "number",
            description:
              "ATS-friendly text structure score from 0 to 100.",
          },

          contactScore: {
            type: "number",
            description:
              "Contact information completeness score from 0 to 100.",
          },

          keywords: {
            type: "array",

            items: {
              type: "string",
            },

            description:
              "Important keywords detected in the resume.",
          },

          missingKeywords: {
            type: "array",

            items: {
              type: "string",
            },

            description:
              "Relevant keywords that appear to be missing.",
          },

          suggestions: {
            type: "array",

            items: {
              type: "string",
            },

            description:
              "Practical resume improvement suggestions.",
          },

          sections: {
            type: "object",

            properties: {
              contact: {
                type: "string",
              },

              summary: {
                type: "string",
              },

              skills: {
                type: "string",
              },

              experience: {
                type: "string",
              },

              projects: {
                type: "string",
              },

              education: {
                type: "string",
              },

              certifications: {
                type: "string",
              },
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
      };

      // --------------------------------------------------------
      // CALL GEMINI
      // --------------------------------------------------------

      console.log(
        "🤖 Sending resume to Gemini for ATS analysis..."
      );

      const result =
        await generateGeminiJSON(
          prompt,
          responseSchema,
          {
            temperature: 0.15,
            timeout: 90000,
          }
        );

      // --------------------------------------------------------
      // NORMALIZE ATS RESULT
      // --------------------------------------------------------

      const atsResult = {
        score: safeNumber(
          result?.score
        ),

        summary: safeString(
          result?.summary
        ),

        keywordScore:
          safeNumber(
            result?.keywordScore
          ),

        contentScore:
          safeNumber(
            result?.contentScore
          ),

        formatting:
          safeNumber(
            result?.formatting
          ),

        contactScore:
          safeNumber(
            result?.contactScore
          ),

        keywords:
          safeArray(
            result?.keywords
          ),

        missingKeywords:
          safeArray(
            result?.missingKeywords
          ),

        suggestions:
          safeArray(
            result?.suggestions
          ),

        sections: {
          contact:
            safeString(
              result?.sections
                ?.contact
            ),

          summary:
            safeString(
              result?.sections
                ?.summary
            ),

          skills:
            safeString(
              result?.sections
                ?.skills
            ),

          experience:
            safeString(
              result?.sections
                ?.experience
            ),

          projects:
            safeString(
              result?.sections
                ?.projects
            ),

          education:
            safeString(
              result?.sections
                ?.education
            ),

          certifications:
            safeString(
              result?.sections
                ?.certifications
            ),
        },
      };

      // --------------------------------------------------------
      // FINAL VALIDATION
      // --------------------------------------------------------

      console.log(
        `✅ ATS analysis completed: ${atsResult.score}/100`
      );

      console.log(
        `🔑 Keywords detected: ${atsResult.keywords.length}`
      );

      console.log(
        `⚠️ Missing keywords: ${atsResult.missingKeywords.length}`
      );

      // --------------------------------------------------------
      // RETURN RESULT
      // --------------------------------------------------------

      return res.json({
        success: true,

        result: atsResult,

        fileName,

        fileType:
          isPDF
            ? "pdf"
            : "docx",
      });

    } catch (error) {
      console.error(
        "❌ ATS Analysis Error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error?.message ||
          "Unable to analyze the resume right now.",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error?.stack
            : undefined,
      });
    }
  }
);

// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;