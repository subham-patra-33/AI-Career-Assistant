const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// --------------------------------------------------
// ROLE PROFILES
// --------------------------------------------------

const ROLE_PROFILES = {
  frontend: {
    match: [
      "frontend developer",
      "front end developer",
      "frontend engineer",
      "ui developer",
    ],

    core: [
      "javascript",
      "react",
      "html",
      "css",
      "git",
      "responsive design",
    ],

    preferred: [
      "typescript",
      "redux",
      "next.js",
      "tailwind css",
      "rest api",
      "jest",
      "testing library",
      "accessibility",
      "performance",
      "npm",
    ],
  },

  backend: {
    match: [
      "backend developer",
      "back end developer",
      "backend engineer",
    ],

    core: [
      "node.js",
      "express.js",
      "rest api",
      "sql",
      "git",
      "api",
    ],

    preferred: [
      "python",
      "java",
      "spring boot",
      "django",
      "fastapi",
      "postgresql",
      "mongodb",
      "docker",
      "aws",
      "redis",
      "microservices",
    ],
  },

  fullstack: {
    match: [
      "full stack developer",
      "full-stack developer",
      "full stack engineer",
      "mern developer",
    ],

    core: [
      "javascript",
      "react",
      "html",
      "css",
      "node.js",
      "express.js",
      "api",
      "git",
    ],

    preferred: [
      "typescript",
      "mongodb",
      "sql",
      "postgresql",
      "rest api",
      "docker",
      "aws",
      "redux",
      "next.js",
      "tailwind css",
    ],
  },

  python: {
    match: [
      "python developer",
      "python engineer",
    ],

    core: [
      "python",
      "sql",
      "git",
      "rest api",
    ],

    preferred: [
      "django",
      "flask",
      "fastapi",
      "postgresql",
      "mongodb",
      "docker",
      "pandas",
      "numpy",
      "pytest",
      "aws",
    ],
  },

  java: {
    match: [
      "java developer",
      "java engineer",
      "spring boot developer",
    ],

    core: [
      "java",
      "sql",
      "git",
      "rest api",
    ],

    preferred: [
      "spring boot",
      "spring",
      "hibernate",
      "maven",
      "gradle",
      "junit",
      "postgresql",
      "mysql",
      "docker",
      "aws",
    ],
  },

  dataanalyst: {
    match: [
      "data analyst",
      "business analyst",
      "data analytics",
    ],

    core: [
      "sql",
      "excel",
      "python",
      "data analysis",
      "statistics",
    ],

    preferred: [
      "power bi",
      "tableau",
      "pandas",
      "numpy",
      "data visualization",
      "dashboard",
      "postgresql",
      "mysql",
    ],
  },

  datascience: {
    match: [
      "data scientist",
      "machine learning engineer",
      "ml engineer",
    ],

    core: [
      "python",
      "sql",
      "machine learning",
      "statistics",
      "pandas",
      "numpy",
    ],

    preferred: [
      "scikit-learn",
      "tensorflow",
      "pytorch",
      "jupyter",
      "data visualization",
      "deep learning",
      "postgresql",
      "aws",
      "docker",
    ],
  },

  devops: {
    match: [
      "devops engineer",
      "devops",
      "site reliability engineer",
      "sre",
      "cloud engineer",
    ],

    core: [
      "linux",
      "git",
      "docker",
      "ci/cd",
      "aws",
    ],

    preferred: [
      "kubernetes",
      "terraform",
      "jenkins",
      "github actions",
      "azure",
      "gcp",
      "ansible",
      "bash",
      "monitoring",
      "prometheus",
    ],
  },

  uiux: {
    match: [
      "ui ux designer",
      "ui/ux designer",
      "ux designer",
      "ui designer",
      "product designer",
    ],

    core: [
      "figma",
      "wireframing",
      "prototyping",
      "user research",
      "usability",
      "design systems",
    ],

    preferred: [
      "accessibility",
      "interaction design",
      "visual design",
      "adobe xd",
      "user testing",
      "responsive design",
    ],
  },
};

const GENERIC_PROFILE = {
  core: [
    "communication",
    "problem solving",
    "teamwork",
    "project management",
  ],

  preferred: [
    "git",
    "api",
    "sql",
    "python",
    "javascript",
    "cloud",
    "docker",
  ],
};

const ALIASES = {
  "react.js": "react",
  "react js": "react",
  "node": "node.js",
  "node js": "node.js",
  "express": "express.js",
  "express js": "express.js",
  "rest": "rest api",
  "restful api": "rest api",
  "tailwind": "tailwind css",
  "postgres": "postgresql",
  "powerbi": "power bi",
  "ci cd": "ci/cd",
};

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

function cleanTerm(value) {
  let term = String(value || "")
    .toLowerCase()
    .trim();

  term = term
    .replace(/[•·]/g, " ")
    .replace(/\s+/g, " ");

  return ALIASES[term] || term;
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^a-z0-9+#./&\- ]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function termRegex(term) {
  const escaped = cleanTerm(term)
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\s+/g, "\\s+");

  return new RegExp(
    `(^|[^a-z0-9])${escaped}($|[^a-z0-9])`,
    "i"
  );
}

function hasTerm(text, term) {
  const normalized = normalizeText(text);
  const cleaned = cleanTerm(term);

  if (termRegex(cleaned).test(normalized)) {
    return true;
  }

  if (cleaned === "ci/cd") {
    return /\bci\s*[/\-]?\s*cd\b/i.test(normalized);
  }

  return false;
}

function uniqueTerms(items) {
  return [
    ...new Set(
      (items || [])
        .map(cleanTerm)
        .filter(Boolean)
    ),
  ];
}

// --------------------------------------------------
// ROLE DETECTION
// --------------------------------------------------

function detectRoleProfile(targetRole) {
  const role = normalizeText(targetRole);

  for (const [key, profile] of Object.entries(
    ROLE_PROFILES
  )) {
    if (
      profile.match?.some((name) =>
        hasTerm(role, name)
      )
    ) {
      return {
        key,
        profile,
      };
    }
  }

  if (
    role.includes("frontend") ||
    role.includes("front end")
  ) {
    return {
      key: "frontend",
      profile: ROLE_PROFILES.frontend,
    };
  }

  if (
    role.includes("backend") ||
    role.includes("back end")
  ) {
    return {
      key: "backend",
      profile: ROLE_PROFILES.backend,
    };
  }

  if (
    role.includes("full stack") ||
    role.includes("full-stack")
  ) {
    return {
      key: "fullstack",
      profile: ROLE_PROFILES.fullstack,
    };
  }

  if (role.includes("python")) {
    return {
      key: "python",
      profile: ROLE_PROFILES.python,
    };
  }

  if (role.includes("java")) {
    return {
      key: "java",
      profile: ROLE_PROFILES.java,
    };
  }

  if (
    role.includes("data analyst") ||
    role.includes("analytics")
  ) {
    return {
      key: "dataanalyst",
      profile: ROLE_PROFILES.dataanalyst,
    };
  }

  if (
    role.includes("data scientist") ||
    role.includes("machine learning")
  ) {
    return {
      key: "datascience",
      profile: ROLE_PROFILES.datascience,
    };
  }

  if (
    role.includes("devops") ||
    role.includes("sre") ||
    role.includes("cloud engineer")
  ) {
    return {
      key: "devops",
      profile: ROLE_PROFILES.devops,
    };
  }

  if (
    role.includes("designer") ||
    role.includes("ui") ||
    role.includes("ux")
  ) {
    return {
      key: "uiux",
      profile: ROLE_PROFILES.uiux,
    };
  }

  return {
    key: "generic",
    profile: GENERIC_PROFILE,
  };
}

// --------------------------------------------------
// PDF EXTRACTION
// --------------------------------------------------

async function extractPdfText(buffer) {
  try {
    const parsed = await pdfParse(buffer);

    const text = String(
      parsed?.text || ""
    )
      .replace(/\s+/g, " ")
      .trim();

    return {
      text,
      pages:
        Number(parsed?.numpages) || 1,
    };
  } catch (error) {
    console.error(
      "PDF text extraction failed:",
      error
    );

    return {
      text: "",
      pages: 0,
    };
  }
}

// --------------------------------------------------
// SECTION DETECTION
// --------------------------------------------------

function detectSections(text) {
  return {
    contact:
      /\b(email|e-mail|phone|mobile|linkedin|github|portfolio)\b/i.test(
        text
      ),

    summary:
      /\b(summary|professional summary|profile|objective|career objective|about me)\b/i.test(
        text
      ),

    experience:
      /\b(experience|work experience|employment|professional experience|internship|internships)\b/i.test(
        text
      ),

    education:
      /\b(education|academic|qualification|degree|b\.tech|bachelor|master|m\.tech|bsc|msc)\b/i.test(
        text
      ),

    skills:
      /\b(skills|technical skills|core skills|technologies|tech stack|competencies)\b/i.test(
        text
      ),

    projects:
      /\b(projects|personal projects|academic projects|key projects|project experience)\b/i.test(
        text
      ),

    certifications:
      /\b(certifications|certificates|licenses)\b/i.test(
        text
      ),
  };
}

function getSectionText(text, sectionName) {
  const labels = {
    summary:
      "summary|professional summary|profile|objective|career objective|about me",

    experience:
      "experience|work experience|employment|professional experience|internship|internships",

    education:
      "education|academic|qualification|degree",

    skills:
      "skills|technical skills|core skills|technologies|tech stack|competencies",

    projects:
      "projects|personal projects|academic projects|key projects|project experience",
  };

  const nextSections =
    "summary|professional summary|profile|objective|experience|work experience|employment|education|skills|technical skills|projects|certifications|achievements|awards";

  const pattern = new RegExp(
    `(?:^|\\s)(?:${labels[sectionName]})(?:\\s|:|-)([\\s\\S]*?)(?=\\s(?:${nextSections})(?:\\s|:|-)|$)`,
    "i"
  );

  const match = String(text || "").match(
    pattern
  );

  return match ? match[1] : "";
}

// --------------------------------------------------
// SCORE CALCULATION
// --------------------------------------------------

function calculateScore({
  text,
  targetRole,
  jobDescription,
  pages,
}) {
  const lowerText = normalizeText(text);

  const {
    key,
    profile,
  } = detectRoleProfile(targetRole);

  const core = uniqueTerms(
    profile.core
  );

  const preferred = uniqueTerms(
    profile.preferred
  );

  const roleRequirements =
    uniqueTerms([
      ...core,
      ...preferred,
    ]);

  const detectedCore =
    core.filter((term) =>
      hasTerm(lowerText, term)
    );

  const detectedPreferred =
    preferred.filter((term) =>
      hasTerm(lowerText, term)
    );

  const matchedSet = new Set([
    ...detectedCore,
    ...detectedPreferred,
  ]);

  const missingKeywords =
    roleRequirements.filter(
      (term) => !matchedSet.has(term)
    );

  const detectedKeywords =
    [...matchedSet];

  // --------------------------------------------------
  // ROLE KEYWORD SCORE
  // --------------------------------------------------

  const coreScore = core.length
    ? (detectedCore.length /
        core.length) *
      100
    : 0;

  const preferredScore =
    preferred.length
      ? (detectedPreferred.length /
          preferred.length) *
        100
      : 0;

  let keywordScore =
    coreScore * 0.65 +
    preferredScore * 0.35;

  // Optional job description.
  // Only controlled vocabulary terms are used.
  if (jobDescription) {
    const jdMatches =
      roleRequirements.filter(
        (term) =>
          hasTerm(jobDescription, term)
      );

    if (jdMatches.length) {
      const resumeJdMatches =
        jdMatches.filter((term) =>
          hasTerm(lowerText, term)
        );

      const jdScore =
        (resumeJdMatches.length /
          jdMatches.length) *
        100;

      keywordScore =
        keywordScore * 0.75 +
        jdScore * 0.25;
    }
  }

  keywordScore = Math.round(
    Math.max(
      0,
      Math.min(100, keywordScore)
    )
  );

  // --------------------------------------------------
  // SECTIONS
  // --------------------------------------------------

  const sections =
    detectSections(text);

  const sectionScore = Math.round(
    Number(sections.contact) * 10 +
      Number(sections.summary) * 10 +
      Number(sections.skills) * 20 +
      Number(sections.education) * 15 +
      Number(
        sections.experience ||
          sections.projects
      ) *
        25 +
      Number(sections.certifications) *
        5 +
      Number(sections.projects) *
        15
  );

  // --------------------------------------------------
  // CONTACT
  // --------------------------------------------------

  const contactSignals = [
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(
      text
    ),

    /(?:\+?\d[\d\s().-]{8,}\d)/.test(
      text
    ),

    /linkedin\.com/i.test(text),

    /github\.com|portfolio/i.test(
      text
    ),
  ];

  const contactScore = Math.round(
    (contactSignals.filter(Boolean)
      .length /
      contactSignals.length) *
      100
  );

  // --------------------------------------------------
  // EDUCATION
  // --------------------------------------------------

  const educationText =
    getSectionText(
      text,
      "education"
    );

  const educationScore =
    !sections.education
      ? 0
      : /\b(b\.tech|btech|bachelor|master|m\.tech|msc|bsc|degree|university|college|institute)\b/i.test(
          educationText || text
        )
      ? 100
      : 70;

  // --------------------------------------------------
  // EXPERIENCE / PROJECT RELEVANCE
  // --------------------------------------------------

  const experienceText =
    getSectionText(
      text,
      "experience"
    );

  const projectText =
    getSectionText(
      text,
      "projects"
    );

  const relevantExperienceText =
    experienceText || projectText;

  const matchedInExperience =
    roleRequirements.filter(
      (term) =>
        hasTerm(
          relevantExperienceText,
          term
        )
    ).length;

  const experienceRelevance =
    relevantExperienceText
      ? Math.round(
          Math.min(
            100,
            45 +
              (matchedInExperience /
                Math.max(
                  1,
                  Math.min(
                    roleRequirements.length,
                    8
                  )
                )) *
                55
          )
        )
      : 0;

  // --------------------------------------------------
  // ATS PARSING / READABILITY
  // --------------------------------------------------

  const parseChecks = [
    text.length >= 500,
    text.length <= 12000,
    sections.contact,
    sections.skills,
    sections.education,
    sections.experience ||
      sections.projects,
    !/[�]{3,}/.test(text),
  ];

  const formattingScore =
    Math.round(
      (parseChecks.filter(Boolean)
        .length /
        parseChecks.length) *
        100
    );

  // --------------------------------------------------
  // CONTENT QUALITY
  // --------------------------------------------------

  const contentSignals = [
    sections.summary,

    sections.experience ||
      sections.projects,

    sections.skills,

    /\b(developed|built|created|implemented|designed|led|managed|optimized|improved|analyzed|deployed|tested|automated|delivered)\b/i.test(
      text
    ),

    /\b\d+(?:\.\d+)?\s*(%|percent|users|projects|months|years|x|k|m)\b/i.test(
      text
    ),
  ];

  const contentScore =
    Math.round(
      (contentSignals.filter(Boolean)
        .length /
        contentSignals.length) *
        100
    );

  // --------------------------------------------------
  // FINAL ATS SCORE
  // --------------------------------------------------

  const score = Math.round(
    keywordScore * 0.35 +
      contentScore * 0.15 +
      sectionScore * 0.15 +
      experienceRelevance * 0.10 +
      educationScore * 0.10 +
      contactScore * 0.05 +
      formattingScore * 0.10
  );

  // --------------------------------------------------
  // RECOMMENDATIONS
  // --------------------------------------------------

  const recommendations = [];

  if (missingKeywords.length) {
    recommendations.push(
      `Add relevant role keywords that you genuinely have experience with: ${missingKeywords
        .slice(0, 8)
        .join(", ")}.`
    );
  }

  if (keywordScore < 70) {
    recommendations.push(
      `Your resume has a weak match for ${targetRole}. Prioritize the most important skills from the role profile in your Skills, Projects and Experience sections when truthful.`
    );
  }

  if (!sections.summary) {
    recommendations.push(
      "Add a concise professional summary tailored to the target role."
    );
  }

  if (!sections.skills) {
    recommendations.push(
      "Add a dedicated Technical Skills section using standard ATS-readable text."
    );
  }

  if (
    !sections.experience &&
    !sections.projects
  ) {
    recommendations.push(
      "Add relevant experience, internships or projects that demonstrate the target-role skills."
    );
  }

  if (!sections.education) {
    recommendations.push(
      "Add your education and relevant qualification details."
    );
  }

  if (contactScore < 75) {
    recommendations.push(
      "Complete your contact information with email, phone and professional links where applicable."
    );
  }

  if (formattingScore < 75) {
    recommendations.push(
      "Use standard ATS-friendly section headings and make sure the uploaded document contains selectable text."
    );
  }

  if (contentScore < 60) {
    recommendations.push(
      "Strengthen experience/project bullets with clear action verbs and measurable results when you can support them with real facts."
    );
  }

  // --------------------------------------------------
  // RESPONSE
  // --------------------------------------------------

  return {
    score,
    atsScore: score,

    targetRole,

    roleProfile: key,

    keywordScore,
    roleMatchScore: keywordScore,

    technicalSkillScore:
      Math.round(coreScore),

    sectionScore,

    formattingScore,

    contentScore,

    contactScore,

    experienceScore:
      experienceRelevance,

    educationScore,

    pages,

    keywords: detectedKeywords,

    missingKeywords,

    sections,

    recommendations,

    message:
      "ATS role-match analysis completed successfully.",
  };
}

// --------------------------------------------------
// ATS ANALYZE
// --------------------------------------------------

router.post(
  "/analyze",
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: true,
          message:
            "Please upload a resume file.",
        });
      }

      const targetRole =
        String(
          req.body?.role || ""
        ).trim();

      if (!targetRole) {
        return res.status(400).json({
          error: true,
          message:
            "Please enter the target job role, for example Frontend Developer.",
        });
      }

      let text = "";
      let pages = 1;

      // PDF
      if (
        req.file.mimetype ===
        "application/pdf"
      ) {
        const parsed =
          await extractPdfText(
            req.file.buffer
          );

        text = parsed.text;
        pages = parsed.pages;
      }

      // DOCX
      else if (
        req.file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        const mammoth =
          require("mammoth");

        const result =
          await mammoth.extractRawText(
            {
              buffer: req.file.buffer,
            }
          );

        text =
          String(
            result?.value || ""
          );
      }

      // OLD DOC
      else if (
        req.file.mimetype ===
        "application/msword"
      ) {
        return res.status(400).json({
          error: true,
          message:
            "Old DOC files are not supported. Please upload PDF or DOCX.",
        });
      }

      else {
        return res.status(400).json({
          error: true,
          message:
            "Unsupported file type. Please upload PDF or DOCX.",
        });
      }

      text = text
        .replace(/\u0000/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      if (text.length < 50) {
        return res.status(400).json({
          error: true,
          message:
            "Could not extract enough text from this file. If it is a scanned/image PDF, please upload a text-based PDF or DOCX.",
        });
      }

      console.log(
        `ATS extracted ${text.length} characters from ${req.file.originalname} for role: ${targetRole}`
      );

      const result =
        calculateScore({
          text,
          targetRole,
          jobDescription:
            String(
              req.body?.jobDescription ||
                ""
            ),
          pages,
        });

      return res.json(result);
    } catch (error) {
      console.error(
        "ATS analysis error:",
        error
      );

      return res.status(500).json({
        error: true,
        message:
          error.message ||
          "ATS analysis failed.",
      });
    }
  }
);

module.exports = router;