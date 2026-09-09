const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const WordExtractor = require("word-extractor");

const auth = require("../middleware/auth");
const { generateGeminiJSON } = require("../utils/gemini");

const router = express.Router();

router.use(auth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
});

async function extractText(file) {
  const name = String(
    file.originalname || ""
  ).toLowerCase();

  const mime = String(
    file.mimetype || ""
  ).toLowerCase();

  if (
    mime === "application/pdf" ||
    name.endsWith(".pdf")
  ) {
    const parsed = await pdfParse(
      file.buffer
    );

    return parsed.text || "";
  }

  if (
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mime === "application/msword" ||
    name.endsWith(".docx") ||
    name.endsWith(".doc")
  ) {
    const extractor =
      new WordExtractor();

    const document =
      await extractor.extract(
        file.buffer
      );

    return (
      document?.getBody?.() ||
      ""
    );
  }

  throw new Error(
    "Unsupported resume file type."
  );
}

const resumeSchema = {
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
};

router.post(
  "/parse-resume-file",
  upload.single("file"),

  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error:
            "Resume file is required.",
        });
      }

      const text =
        (
          await extractText(
            req.file
          )
        )
          .replace(
            /\u0000/g,
            " "
          )
          .replace(
            /[ \t]+/g,
            " "
          )
          .replace(
            /\n{3,}/g,
            "\n\n"
          )
          .trim();

      if (
        !text ||
        text.length < 40
      ) {
        return res.status(422).json({
          success: false,

          error:
            "No readable text was found in this resume. Please upload a text-based PDF, DOC, or DOCX file.",
        });
      }

      // Keep the prompt bounded so a very large resume
      // does not exceed the model context unnecessarily.
      const resumeText =
        text.slice(
          0,
          30000
        );

      const prompt = `
You are a resume parsing specialist.

Read the existing resume text below and extract ONLY information that is
actually present in the resume. Do not invent anything.

Your job is to convert the existing resume into structured JSON so another
resume generator can use the exact candidate information.

Rules:
- Preserve names, contact information, companies, roles, dates, education,
  projects, skills, certifications and achievements from the source.
- Do not invent missing values.
- If a field is not present, return an empty string or empty array.
- Keep experience bullets faithful to the source.
- Identify the most likely target role from the candidate's actual title,
  headline, summary, or experience when one is present.
- Do not add skills merely because they are common for the role.

EXISTING RESUME:
----------------
${resumeText}
----------------

Return ONLY valid JSON matching the supplied schema.
`;

      const resume =
        await generateGeminiJSON(
          prompt,
          resumeSchema,
          {
            timeout: 60000,
            temperature: 0.1,
          }
        );

      return res.json({
        success: true,
        resume,
      });
    } catch (error) {
      console.error(
        "Resume import error:",
        error?.message ||
          error
      );

      return res.status(500).json({
        success: false,

        error:
          error?.message ||
          "Unable to read the uploaded resume.",
      });
    }
  }
);

module.exports = router;