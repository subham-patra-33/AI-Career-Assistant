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
    fullName: {
      type: "string",
    },

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
          title: {
            type: "string",
          },
          company: {
            type: "string",
          },
          location: {
            type: "string",
          },
          date: {
            type: "string",
          },
          description: {
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
          title: {
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
          url: {
            type: "string",
          },
          github: {
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

    education: {
      type: "array",
      items: {
        type: "object",
        properties: {
          degree: {
            type: "string",
          },
          institution: {
            type: "string",
          },
          date: {
            type: "string",
          },
          grade: {
            type: "string",
          },
          description: {
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
    "fullName",
    "email",
    "phone",
    "location",
    "linkedin",
    "github",
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

      let resume;
      try {
        resume = await generateGeminiJSON(
          prompt,
          resumeSchema,
          {
            timeout: 60000,
            temperature: 0.1,
          }
        );
      } catch (geminiError) {
        console.warn("[ResumeImport] Gemini parser error, using text extractor fallback:", geminiError?.message);
        resume = heuristicExtractResume(text);
      }

      // Normalize parsed resume to ensure all fields are present and correctly shaped
      const normalizedResume = {
        fullName: resume.fullName || resume.name || "",
        email: resume.email || resume.contact?.email || "",
        phone: resume.phone || resume.contact?.phone || "",
        location: resume.location || resume.contact?.location || "",
        linkedin: resume.linkedin || resume.contact?.linkedin || "",
        github: resume.github || resume.contact?.github || "",
        targetRole: resume.targetRole || "",
        summary: resume.summary || "",
        skills: Array.isArray(resume.skills) ? resume.skills : [],
        experience: Array.isArray(resume.experience)
          ? resume.experience.map((e) => ({
              title: e.title || e.role || "Professional Experience",
              company: e.company || "",
              location: e.location || "",
              date: e.date || e.duration || "",
              description: e.description || "",
              bullets: Array.isArray(e.bullets) ? e.bullets : [],
            }))
          : [],
        projects: Array.isArray(resume.projects)
          ? resume.projects.map((p) => ({
              title: p.title || p.name || "Project",
              description: p.description || "",
              technologies: Array.isArray(p.technologies)
                ? p.technologies
                : typeof p.technologies === "string"
                ? p.technologies.split(/[,;\n]/).map((t) => t.trim()).filter(Boolean)
                : [],
              url: p.url || "",
              github: p.github || "",
              bullets: Array.isArray(p.bullets) ? p.bullets : [],
            }))
          : [],
        education: Array.isArray(resume.education)
          ? resume.education.map((ed) => ({
              degree: ed.degree || "Degree",
              institution: ed.institution || "",
              date: ed.date || ed.duration || "",
              grade: ed.grade || "",
              description: ed.description || "",
            }))
          : [],
        certifications: Array.isArray(resume.certifications)
          ? resume.certifications.map((c) => (typeof c === "string" ? c : c?.name || c?.title || "")).filter(Boolean)
          : [],
        achievements: Array.isArray(resume.achievements)
          ? resume.achievements.map((a) => (typeof a === "string" ? a : a?.name || a?.title || "")).filter(Boolean)
          : [],
      };

      return res.json({
        success: true,
        resume: normalizedResume,
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

/* ============================================================
   HEURISTIC RESUME EXTRACTOR FALLBACK
   Extracts genuine candidate data directly from document text
   when the AI provider is unavailable or rate-limited.
   ============================================================ */
function heuristicExtractResume(rawText) {
  const text = String(rawText || "").trim();
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
  const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i);

  // Candidate name usually on the first non-trivial line
  let fullName = "";
  if (lines.length > 0) {
    const candidateName = lines[0].replace(/^(curriculum vitae|resume|cv)\s*[-:]?\s*/i, "").trim();
    if (candidateName && candidateName.length < 50 && !candidateName.includes("@")) {
      fullName = candidateName;
    }
  }

  // Detect sections by common headers
  const sectionHeaders = [
    { key: "summary", regex: /^(?:professional\s+)?(?:summary|profile|about\s+me|objective)/i },
    { key: "skills", regex: /^(?:technical\s+|core\s+)?skills(?:\s+&\s+competencies)?/i },
    { key: "experience", regex: /^(?:work\s+|professional\s+)?experience|employment\s+history/i },
    { key: "projects", regex: /^(?:key\s+|featured\s+)?projects/i },
    { key: "education", regex: /^education(?:al\s+background)?/i },
    { key: "certifications", regex: /^(?:licenses\s+&\s+)?certifications/i },
    { key: "achievements", regex: /^(?:key\s+|honors\s+&\s+)?achievements|awards/i },
  ];

  const sections = {};
  let currentSection = null;

  for (const line of lines) {
    const matchedHeader = sectionHeaders.find((h) => h.regex.test(line));
    if (matchedHeader) {
      currentSection = matchedHeader.key;
      if (!sections[currentSection]) sections[currentSection] = [];
    } else if (currentSection) {
      sections[currentSection].push(line);
    }
  }

  // Summary
  const summary = (sections.summary || []).join(" ").slice(0, 1000);

  // Skills
  const skillsLines = sections.skills || [];
  const skills = skillsLines
    .join(", ")
    .split(/[,•|·/]/)
    .map((s) => s.trim().replace(/^[-*•]\s*/, ""))
    .filter((s) => s.length > 1 && s.length < 40 && !/^(skills|proficient in|languages):?$/i.test(s));

  // Experience
  const expLines = sections.experience || [];
  const experience = [];
  let currentExp = null;

  for (const line of expLines) {
    const isBullet = /^[-*•·]/.test(line);
    if (!isBullet && line.length < 80 && (line.includes("|") || line.includes("-") || line.includes(" at ") || !currentExp)) {
      if (currentExp) experience.push(currentExp);
      const parts = line.split(/[|–—]/).map((p) => p.trim());
      currentExp = {
        title: parts[0] || "Role",
        company: parts[1] || "",
        location: parts[2] || "",
        date: "",
        description: "",
        bullets: [],
      };
    } else if (currentExp) {
      const cleanBullet = line.replace(/^[-*•·]\s*/, "").trim();
      if (cleanBullet) currentExp.bullets.push(cleanBullet);
    }
  }
  if (currentExp) experience.push(currentExp);

  // Projects
  const projLines = sections.projects || [];
  const projects = [];
  let currentProj = null;

  for (const line of projLines) {
    const isBullet = /^[-*•·]/.test(line);
    if (!isBullet && line.length < 80 && !currentProj) {
      currentProj = {
        title: line,
        description: "",
        technologies: [],
        bullets: [],
      };
    } else if (!isBullet && line.length < 80 && currentProj && currentProj.bullets.length > 0) {
      projects.push(currentProj);
      currentProj = {
        title: line,
        description: "",
        technologies: [],
        bullets: [],
      };
    } else if (currentProj) {
      const cleanBullet = line.replace(/^[-*•·]\s*/, "").trim();
      if (cleanBullet) currentProj.bullets.push(cleanBullet);
    }
  }
  if (currentProj) projects.push(currentProj);

  // Education
  const eduLines = sections.education || [];
  const education = [];
  for (const line of eduLines) {
    if (line.length > 3 && !/^education/i.test(line)) {
      education.push({
        degree: line.split(/[,|–—]/)[0]?.trim() || line,
        institution: line.split(/[,|–—]/)[1]?.trim() || "",
        date: "",
        grade: "",
        description: "",
      });
    }
  }

  // Target role from headline or second line
  let targetRole = "";
  if (lines.length > 1 && lines[1].length < 60 && !lines[1].includes("@")) {
    targetRole = lines[1];
  } else if (experience.length > 0) {
    targetRole = experience[0].title;
  }

  return {
    fullName,
    email: emailMatch ? emailMatch[0] : "",
    phone: phoneMatch ? phoneMatch[0] : "",
    location: "",
    linkedin: linkedinMatch ? linkedinMatch[0] : "",
    github: githubMatch ? githubMatch[0] : "",
    targetRole,
    summary,
    skills,
    experience,
    projects,
    education,
    certifications: (sections.certifications || []).map((c) => c.replace(/^[-*•·]\s*/, "")).filter(Boolean),
    achievements: (sections.achievements || []).map((a) => a.replace(/^[-*•·]\s*/, "")).filter(Boolean),
  };
}

/* ============================================================
   POST /api/ai/edit-section - AI Section Editing
   ============================================================ */
router.post("/edit-section", async (req, res) => {
  try {
    const { section, currentContent, instruction, targetRole, context } = req.body || {};

    if (!section) {
      return res.status(400).json({
        success: false,
        error: "Section name is required.",
      });
    }

    if (!instruction) {
      return res.status(400).json({
        success: false,
        error: "Instruction is required.",
      });
    }

    const validSections = [
      "summary",
      "skills",
      "experience",
      "projects",
      "education",
      "certifications",
      "achievements",
      "project",
      "experience_item",
      "education_item",
    ];

    if (!validSections.includes(section)) {
      return res.status(400).json({
        success: false,
        error: `Invalid section: ${section}. Valid sections are: ${validSections.join(", ")}`,
      });
    }

    const systemPrompt = `You are a resume editing specialist.
Your task is to update or rewrite ONLY the "${section}" section of a candidate's resume according to the user's instructions.

CRITICAL RULES:
1. Update ONLY the "${section}" section.
2. DO NOT fabricate qualifications, employment history, degrees, certifications, achievements, or technical skills not present in the current content or user instruction.
3. Improve wording, impact, grammar, structure, and professional tone without inventing facts.
4. If target role is provided (${targetRole || "general professional"}), tailor the phrasing to highlight relevant strengths.
5. Return ONLY valid JSON matching the requested section format.

User Instruction: "${instruction}"
Target Role: "${targetRole || ""}"
`;

    let sectionSchema;
    let contentPrompt;

    if (section === "summary") {
      sectionSchema = {
        type: "object",
        properties: {
          summary: { type: "string" },
        },
        required: ["summary"],
      };
      contentPrompt = `${systemPrompt}\nCurrent Summary:\n"${typeof currentContent === "string" ? currentContent : JSON.stringify(currentContent)}"\n\nReturn JSON: { "summary": "improved summary text" }`;
    } else if (section === "skills") {
      sectionSchema = {
        type: "object",
        properties: {
          skills: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["skills"],
      };
      contentPrompt = `${systemPrompt}\nCurrent Skills:\n${JSON.stringify(currentContent)}\n\nReturn JSON: { "skills": ["skill1", "skill2", ...] }`;
    } else if (section === "experience") {
      sectionSchema = {
        type: "object",
        properties: {
          experience: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                company: { type: "string" },
                location: { type: "string" },
                date: { type: "string" },
                description: { type: "string" },
                bullets: {
                  type: "array",
                  items: { type: "string" },
                },
              },
              required: ["title", "company", "bullets"],
            },
          },
        },
        required: ["experience"],
      };
      contentPrompt = `${systemPrompt}\nCurrent Experience:\n${JSON.stringify(currentContent)}\n\nReturn JSON with updated experience array.`;
    } else if (section === "experience_item") {
      sectionSchema = {
        type: "object",
        properties: {
          title: { type: "string" },
          company: { type: "string" },
          location: { type: "string" },
          date: { type: "string" },
          description: { type: "string" },
          bullets: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["title", "company"],
      };
      contentPrompt = `${systemPrompt}\nCurrent Experience Entry:\n${JSON.stringify(currentContent)}\n\nReturn JSON: { "title": "...", "company": "...", "date": "...", "description": "...", "bullets": [...] }`;
    } else if (section === "projects") {
      sectionSchema = {
        type: "object",
        properties: {
          projects: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                technologies: {
                  type: "array",
                  items: { type: "string" },
                },
                url: { type: "string" },
                github: { type: "string" },
                bullets: {
                  type: "array",
                  items: { type: "string" },
                },
              },
              required: ["title", "description"],
            },
          },
        },
        required: ["projects"],
      };
      contentPrompt = `${systemPrompt}\nCurrent Projects:\n${JSON.stringify(currentContent)}\n\nReturn JSON with updated projects array.`;
    } else if (section === "project") {
      sectionSchema = {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          technologies: {
            type: "array",
            items: { type: "string" },
          },
          url: { type: "string" },
          github: { type: "string" },
          bullets: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["title", "description"],
      };
      contentPrompt = `${systemPrompt}\nCurrent Project:\n${JSON.stringify(currentContent)}\n\nReturn JSON: { "title": "...", "description": "...", "technologies": [...], "bullets": [...] }`;
    } else if (section === "education") {
      sectionSchema = {
        type: "object",
        properties: {
          education: {
            type: "array",
            items: {
              type: "object",
              properties: {
                degree: { type: "string" },
                institution: { type: "string" },
                date: { type: "string" },
                grade: { type: "string" },
                description: { type: "string" },
              },
              required: ["degree", "institution"],
            },
          },
        },
        required: ["education"],
      };
      contentPrompt = `${systemPrompt}\nCurrent Education:\n${JSON.stringify(currentContent)}\n\nReturn JSON with updated education array.`;
    } else if (section === "education_item") {
      sectionSchema = {
        type: "object",
        properties: {
          degree: { type: "string" },
          institution: { type: "string" },
          date: { type: "string" },
          grade: { type: "string" },
          description: { type: "string" },
        },
        required: ["degree", "institution"],
      };
      contentPrompt = `${systemPrompt}\nCurrent Education Entry:\n${JSON.stringify(currentContent)}\n\nReturn JSON: { "degree": "...", "institution": "...", "date": "...", "description": "..." }`;
    } else if (section === "certifications") {
      sectionSchema = {
        type: "object",
        properties: {
          certifications: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["certifications"],
      };
      contentPrompt = `${systemPrompt}\nCurrent Certifications:\n${JSON.stringify(currentContent)}\n\nReturn JSON: { "certifications": ["cert1", "cert2", ...] }`;
    } else if (section === "achievements") {
      sectionSchema = {
        type: "object",
        properties: {
          achievements: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["achievements"],
      };
      contentPrompt = `${systemPrompt}\nCurrent Achievements:\n${JSON.stringify(currentContent)}\n\nReturn JSON: { "achievements": ["achievement1", "achievement2", ...] }`;
    }

    const result = await generateGeminiJSON(contentPrompt, sectionSchema, {
      timeout: 45000,
      temperature: 0.2,
    });

    return res.json({
      success: true,
      section,
      data: result[section] !== undefined ? result[section] : result,
    });
  } catch (error) {
    console.error("AI section edit error:", error?.message || error);
    return res.status(500).json({
      success: false,
      error: error?.message || "AI editing failed. Your existing content has been preserved.",
    });
  }
});

module.exports = router;