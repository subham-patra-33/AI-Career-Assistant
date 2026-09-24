/**
 * Role and Category Configuration for Interview Question Bank
 * Section 3: Role-Based Question Selection
 */

const ROLE_DEFINITIONS = {
  "Full Stack Developer": {
    canonicalName: "Full Stack Developer",
    aliases: [
      "full stack",
      "fullstack",
      "full stack developer",
      "full stack engineer",
      "mern stack",
      "mean stack",
      "software engineer",
      "software developer",
      "web developer",
    ],
    technicalCategories: [
      "JavaScript",
      "React",
      "Node.js",
      "Express",
      "MongoDB",
      "SQL",
      "REST API",
      "HTML/CSS",
      "Git",
      "DSA",
    ],
    behavioralCategories: ["Behavioral"],
    defaultDistribution: {
      JavaScript: 2,
      React: 2,
      "Node.js": 1,
      Express: 1,
      MongoDB: 1,
      SQL: 1,
      "REST API": 1,
      Git: 1,
    },
  },

  "Frontend Developer": {
    canonicalName: "Frontend Developer",
    aliases: [
      "frontend",
      "front-end",
      "front end",
      "frontend developer",
      "frontend engineer",
      "ui developer",
      "react developer",
      "ui/ux designer",
      "web designer",
    ],
    technicalCategories: [
      "HTML",
      "CSS",
      "JavaScript",
      "React",
      "UI/UX",
      "Browser",
      "Performance",
      "Accessibility",
    ],
    behavioralCategories: ["Behavioral"],
    defaultDistribution: {
      JavaScript: 3,
      React: 3,
      HTML: 1,
      CSS: 1,
      Browser: 1,
      Performance: 1,
    },
  },

  "Backend Developer": {
    canonicalName: "Backend Developer",
    aliases: [
      "backend",
      "back-end",
      "back end",
      "backend developer",
      "backend engineer",
      "node developer",
      "api developer",
      "server engineer",
    ],
    technicalCategories: [
      "Node.js",
      "Express",
      "REST API",
      "Databases",
      "SQL",
      "MongoDB",
      "Authentication",
      "Security",
      "System design",
    ],
    behavioralCategories: ["Behavioral"],
    defaultDistribution: {
      "Node.js": 2,
      Express: 2,
      "REST API": 2,
      Databases: 1,
      SQL: 1,
      MongoDB: 1,
      Security: 1,
    },
  },

  "Java Developer": {
    canonicalName: "Java Developer",
    aliases: [
      "java",
      "java developer",
      "java engineer",
      "spring boot",
      "spring boot developer",
      "java software engineer",
      "core java",
    ],
    technicalCategories: [
      "Core Java",
      "OOP",
      "Collections",
      "Exception Handling",
      "Multithreading",
      "JDBC",
      "SQL",
      "Spring basics",
    ],
    behavioralCategories: ["Behavioral"],
    defaultDistribution: {
      "Core Java": 2,
      OOP: 2,
      Collections: 2,
      Multithreading: 1,
      "Spring basics": 2,
      SQL: 1,
    },
  },

  "Python Developer": {
    canonicalName: "Python Developer",
    aliases: [
      "python",
      "python developer",
      "python engineer",
      "django developer",
      "flask developer",
      "fastapi developer",
    ],
    technicalCategories: [
      "Python",
      "OOP",
      "Data structures",
      "SQL",
      "APIs",
      "Django/Flask",
      "Python libraries",
    ],
    behavioralCategories: ["Behavioral"],
    defaultDistribution: {
      Python: 3,
      OOP: 2,
      "Data structures": 2,
      "Django/Flask": 2,
      SQL: 1,
    },
  },
};

/**
 * Resolves user input role string to canonical role configuration
 */
function resolveRole(roleInput = "") {
  const normalized = String(roleInput || "").trim().toLowerCase();

  if (!normalized) {
    return ROLE_DEFINITIONS["Full Stack Developer"];
  }

  for (const [key, config] of Object.entries(ROLE_DEFINITIONS)) {
    if (key.toLowerCase() === normalized) {
      return config;
    }
    if (config.aliases.some((alias) => normalized.includes(alias) || alias.includes(normalized))) {
      return config;
    }
  }

  // Fallback: match generic keywords
  if (normalized.includes("front") || normalized.includes("react") || normalized.includes("ui")) {
    return ROLE_DEFINITIONS["Frontend Developer"];
  }
  if (normalized.includes("back") || normalized.includes("node") || normalized.includes("api")) {
    return ROLE_DEFINITIONS["Backend Developer"];
  }
  if (normalized.includes("java") && !normalized.includes("script")) {
    return ROLE_DEFINITIONS["Java Developer"];
  }
  if (normalized.includes("python") || normalized.includes("django") || normalized.includes("flask")) {
    return ROLE_DEFINITIONS["Python Developer"];
  }

  // Default to Full Stack Developer
  return ROLE_DEFINITIONS["Full Stack Developer"];
}

/**
 * Get all available categories for a role and interview type
 */
function getRoleCategories(roleInput, interviewType = "Technical") {
  const roleConfig = resolveRole(roleInput);
  const type = String(interviewType || "Technical").toLowerCase();

  if (type === "behavioral") {
    return roleConfig.behavioralCategories;
  }

  if (type === "mixed") {
    return [...roleConfig.technicalCategories, ...roleConfig.behavioralCategories];
  }

  return roleConfig.technicalCategories;
}

module.exports = {
  ROLE_DEFINITIONS,
  resolveRole,
  getRoleCategories,
};
