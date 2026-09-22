import React, { useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Award,
  BookOpen,
  Brain,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Code2,
  ExternalLink,
  FileText,
  Filter,
  GraduationCap,
  Lightbulb,
  Loader2,
  Map,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
  X,
  Zap,
  Database,
  Globe,
  ShieldCheck,
  GitBranch,
  BarChart3,
  Server,
} from "lucide-react";
import BackButton from "../BackButton";
import { getToken } from "../../lib/auth";

/* ============================================================
   API
   ============================================================ */

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:4000";

/* ============================================================
   OPTIONS
   ============================================================ */

const categoryOptions = [
  "All",
  "Technical",
  "Tools",
  "Data",
  "AI & ML",
  "Cloud",
  "Soft Skills",
  "Career",
];

const levelOptions = [
  "All",
  "Beginner",
  "Intermediate",
  "Advanced",
];

const priorityOptions = [
  "All",
  "High",
  "Medium",
  "Low",
];

/* ============================================================
   FALLBACK RECOMMENDATIONS

   These are used when the backend AI endpoint is unavailable.
   The page therefore remains usable instead of becoming blank.
   ============================================================ */

const fallbackRecommendations = [
  {
    id: "generative-ai",
    skill: "Generative AI",
    category: "AI & ML",
    level: "Intermediate",
    priority: "High",
    score: 96,
    learningTime: "3–5 weeks",
    careerValue: "Very High",
    description:
      "Learn how modern generative AI systems work and how to build practical applications using large language models and AI APIs.",
    whyRecommended:
      "Generative AI can complement your existing software development knowledge and help you build modern AI-powered applications.",
    outcomes: [
      "Understand LLM fundamentals",
      "Work with AI APIs",
      "Build AI-powered applications",
      "Learn prompt engineering",
    ],
    resources: [
      "LLM fundamentals",
      "Prompt engineering",
      "AI API integration",
      "RAG fundamentals",
    ],
  },
  {
    id: "cloud-computing",
    skill: "Cloud Computing",
    category: "Cloud",
    level: "Intermediate",
    priority: "High",
    score: 93,
    learningTime: "4–6 weeks",
    careerValue: "Very High",
    description:
      "Build practical knowledge of cloud platforms, deployment, storage, networking, security, and scalable applications.",
    whyRecommended:
      "Cloud knowledge helps turn local development projects into deployable, production-oriented applications.",
    outcomes: [
      "Understand cloud architecture",
      "Deploy applications",
      "Use cloud storage",
      "Understand basic networking",
    ],
    resources: [
      "AWS fundamentals",
      "Azure fundamentals",
      "Cloud deployment",
      "Docker basics",
    ],
  },
  {
    id: "advanced-sql",
    skill: "Advanced SQL",
    category: "Data",
    level: "Intermediate",
    priority: "High",
    score: 91,
    learningTime: "2–4 weeks",
    careerValue: "High",
    description:
      "Improve your ability to work with real-world databases using advanced queries, joins, window functions, indexes, and optimization.",
    whyRecommended:
      "Strong SQL is useful across software engineering, analytics, business intelligence, backend development, and data roles.",
    outcomes: [
      "Write complex queries",
      "Use window functions",
      "Optimize queries",
      "Work confidently with relational databases",
    ],
    resources: [
      "Joins and subqueries",
      "Window functions",
      "Indexes",
      "Query optimization",
    ],
  },
  {
    id: "docker",
    skill: "Docker",
    category: "Tools",
    level: "Intermediate",
    priority: "Medium",
    score: 87,
    learningTime: "1–2 weeks",
    careerValue: "High",
    description:
      "Learn how to package applications into containers and create consistent development and deployment environments.",
    whyRecommended:
      "Docker complements backend and cloud skills and is widely useful when moving projects from development to deployment.",
    outcomes: [
      "Create Docker images",
      "Run containers",
      "Use Docker Compose",
      "Containerize projects",
    ],
    resources: [
      "Docker fundamentals",
      "Dockerfiles",
      "Docker Compose",
      "Container networking",
    ],
  },
  {
    id: "data-visualization",
    skill: "Data Visualization",
    category: "Data",
    level: "Beginner",
    priority: "Medium",
    score: 82,
    learningTime: "2–3 weeks",
    careerValue: "High",
    description:
      "Learn how to communicate insights effectively through dashboards, charts, and interactive visualizations.",
    whyRecommended:
      "The ability to transform raw data into understandable insights is valuable for technical and business-facing roles.",
    outcomes: [
      "Build effective charts",
      "Create dashboards",
      "Communicate insights",
      "Choose appropriate visualizations",
    ],
    resources: [
      "Power BI",
      "Tableau",
      "Dashboard design",
      "Data storytelling",
    ],
  },
  {
    id: "system-design",
    skill: "System Design",
    category: "Technical",
    level: "Advanced",
    priority: "Medium",
    score: 79,
    learningTime: "4–8 weeks",
    careerValue: "Very High",
    description:
      "Develop the ability to design scalable, reliable, maintainable software systems.",
    whyRecommended:
      "System design becomes increasingly useful when targeting stronger software engineering roles and technical interviews.",
    outcomes: [
      "Design scalable systems",
      "Understand APIs",
      "Work with caching",
      "Understand databases and queues",
    ],
    resources: [
      "System design fundamentals",
      "Distributed systems",
      "Caching",
      "Message queues",
    ],
  },
  {
    id: "git-github",
    skill: "Git & GitHub",
    category: "Tools",
    level: "Beginner",
    priority: "Medium",
    score: 77,
    learningTime: "1 week",
    careerValue: "High",
    description:
      "Master version control, branching, pull requests, collaboration workflows, and project history.",
    whyRecommended:
      "Version control is fundamental to professional software development and helps demonstrate real project workflow.",
    outcomes: [
      "Use Git confidently",
      "Create branches",
      "Resolve merge conflicts",
      "Work with GitHub",
    ],
    resources: [
      "Git fundamentals",
      "Branching",
      "Pull requests",
      "GitHub workflows",
    ],
  },
  {
    id: "rest-api",
    skill: "REST API Development",
    category: "Technical",
    level: "Intermediate",
    priority: "High",
    score: 86,
    learningTime: "2–3 weeks",
    careerValue: "Very High",
    description:
      "Learn how to design, build, test, secure, and consume REST APIs for modern web applications.",
    whyRecommended:
      "API development connects frontend applications with backend services and is central to full-stack engineering.",
    outcomes: [
      "Design REST endpoints",
      "Handle HTTP methods",
      "Implement authentication",
      "Validate API requests",
    ],
    resources: [
      "REST fundamentals",
      "Express.js",
      "JWT authentication",
      "API testing",
    ],
  },
];

/* ============================================================
   NORMALIZATION
   ============================================================ */

function normalizeRecommendations(data) {
  const source =
    data?.result ??
    data?.recommendations ??
    data?.recommendedSkills ??
    data?.skills ??
    data;

  if (Array.isArray(source)) {
    return source;
  }

  if (Array.isArray(source?.recommendations)) {
    return source.recommendations;
  }

  if (Array.isArray(source?.recommendedSkills)) {
    return source.recommendedSkills;
  }

  if (Array.isArray(source?.skills)) {
    return source.skills;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

function normalizeSkill(item, index) {
  const rawScore =
    item?.score ??
    item?.matchScore ??
    item?.recommendationScore ??
    item?.relevanceScore ??
    75;

  const numericScore = Number(rawScore);

  return {
    id:
      item?.id ??
      item?._id ??
      `recommended-skill-${index + 1}`,

    skill:
      item?.skill ??
      item?.name ??
      item?.title ??
      `Recommended Skill ${index + 1}`,

    category:
      item?.category ??
      "Technical",

    level:
      item?.level ??
      item?.difficulty ??
      "Intermediate",

    priority:
      item?.priority ??
      "Medium",

    score: Number.isFinite(numericScore)
      ? Math.max(
          0,
          Math.min(100, Math.round(numericScore))
        )
      : 75,

    learningTime:
      item?.learningTime ??
      item?.duration ??
      item?.timeToLearn ??
      "2–4 weeks",

    careerValue:
      item?.careerValue ??
      item?.marketValue ??
      item?.careerImpact ??
      "High",

    description:
      item?.description ??
      item?.summary ??
      "A skill recommended based on your career direction and profile.",

    whyRecommended:
      item?.whyRecommended ??
      item?.reason ??
      item?.why ??
      "This skill can strengthen your profile and improve your career opportunities.",

    outcomes:
      Array.isArray(item?.outcomes)
        ? item.outcomes
        : Array.isArray(item?.benefits)
          ? item.benefits
          : [],

    resources:
      Array.isArray(item?.resources)
        ? item.resources
        : Array.isArray(item?.learningResources)
          ? item.learningResources
          : [],
  };
}

/* ============================================================
   ROLE-BASED FALLBACK
   ============================================================ */

function getRoleRecommendations(role) {
  const value = String(role || "").toLowerCase();

  let selected = [...fallbackRecommendations];

  if (
    value.includes("data") ||
    value.includes("analyst") ||
    value.includes("analytics")
  ) {
    selected = [
      {
        ...fallbackRecommendations[2],
        score: 97,
        priority: "High",
      },
      {
        ...fallbackRecommendations[4],
        score: 94,
        priority: "High",
      },
      {
        id: "python-data",
        skill: "Python for Data Analysis",
        category: "Data",
        level: "Intermediate",
        priority: "High",
        score: 92,
        learningTime: "3–4 weeks",
        careerValue: "Very High",
        description:
          "Use Python libraries to clean, analyze, transform, and explore real-world datasets.",
        whyRecommended:
          "Python is widely used in analytics and data-focused roles and works well with SQL and visualization.",
        outcomes: [
          "Use pandas",
          "Clean datasets",
          "Perform exploratory analysis",
          "Automate data workflows",
        ],
        resources: [
          "Python",
          "Pandas",
          "NumPy",
          "Jupyter",
        ],
      },
      ...fallbackRecommendations,
    ];
  } else if (
    value.includes("frontend") ||
    value.includes("front end") ||
    value.includes("react")
  ) {
    selected = [
      {
        id: "advanced-react",
        skill: "Advanced React",
        category: "Technical",
        level: "Intermediate",
        priority: "High",
        score: 97,
        learningTime: "3–5 weeks",
        careerValue: "Very High",
        description:
          "Deepen your React knowledge with reusable architecture, state management, performance, and production patterns.",
        whyRecommended:
          "Advanced React skills can strengthen a frontend profile and help you build production-quality interfaces.",
        outcomes: [
          "Build reusable components",
          "Manage complex state",
          "Optimize rendering",
          "Structure scalable React applications",
        ],
        resources: [
          "React patterns",
          "State management",
          "React performance",
          "Component architecture",
        ],
      },
      ...fallbackRecommendations,
    ];
  } else if (
    value.includes("backend") ||
    value.includes("node") ||
    value.includes("java developer") ||
    value.includes("software engineer") ||
    value.includes("full stack") ||
    value.includes("fullstack")
  ) {
    selected = [
      fallbackRecommendations.find(
        (item) =>
          item.id === "rest-api"
      ),
      fallbackRecommendations.find(
        (item) =>
          item.id === "docker"
      ),
      fallbackRecommendations.find(
        (item) =>
          item.id === "system-design"
      ),
      fallbackRecommendations.find(
        (item) =>
          item.id === "advanced-sql"
      ),
      ...fallbackRecommendations,
    ];
  } else if (
    value.includes("machine learning") ||
    value.includes("ml engineer") ||
    value.includes("ai engineer") ||
    value.includes("artificial intelligence")
  ) {
    selected = [
      fallbackRecommendations[0],
      {
        id: "machine-learning",
        skill: "Machine Learning",
        category: "AI & ML",
        level: "Intermediate",
        priority: "High",
        score: 98,
        learningTime: "5–8 weeks",
        careerValue: "Very High",
        description:
          "Learn supervised and unsupervised machine learning techniques and apply them to real datasets.",
        whyRecommended:
          "Machine learning fundamentals provide the foundation for building and evaluating practical AI systems.",
        outcomes: [
          "Train ML models",
          "Evaluate models",
          "Feature engineering",
          "Build prediction systems",
        ],
        resources: [
          "Scikit-learn",
          "Supervised learning",
          "Model evaluation",
          "Feature engineering",
        ],
      },
      {
        id: "python-ml",
        skill: "Python for Machine Learning",
        category: "AI & ML",
        level: "Intermediate",
        priority: "High",
        score: 95,
        learningTime: "3–5 weeks",
        careerValue: "Very High",
        description:
          "Develop practical Python skills for machine learning workflows and experimentation.",
        whyRecommended:
          "Python is one of the primary languages used throughout the machine learning ecosystem.",
        outcomes: [
          "Use NumPy",
          "Use pandas",
          "Train models",
          "Prepare datasets",
        ],
        resources: [
          "NumPy",
          "Pandas",
          "Scikit-learn",
          "Jupyter",
        ],
      },
      ...fallbackRecommendations,
    ];
  }

  const seen = new Set();

  return selected
    .filter(Boolean)
    .filter((item) => {
      const key = String(item.id);

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .map(normalizeSkill);
}

/* ============================================================
   ICONS
   ============================================================ */

function getCategoryIcon(category) {
  const value = String(category || "").toLowerCase();

  if (
    value.includes("ai") ||
    value.includes("machine")
  ) {
    return Brain;
  }

  if (value.includes("data")) {
    return BarChart3;
  }

  if (value.includes("cloud")) {
    return Globe;
  }

  if (value.includes("tool")) {
    return Code2;
  }

  if (value.includes("soft")) {
    return Award;
  }

  if (value.includes("career")) {
    return TrendingUp;
  }

  if (
    value.includes("technical") ||
    value.includes("backend")
  ) {
    return Server;
  }

  return GraduationCap;
}

function getPriorityClass(priority) {
  const value =
    String(priority || "").toLowerCase();

  if (
    value === "high" ||
    value === "critical"
  ) {
    return "border-destructive/30 bg-destructive/5 text-destructive";
  }

  if (value === "low") {
    return "border-border bg-muted/40 text-muted-foreground";
  }

  return "border-primary/30 bg-primary/5 text-primary";
}

function getLevelClass(level) {
  const value =
    String(level || "").toLowerCase();

  if (value === "beginner") {
    return "border-teal/30 bg-teal/5 text-teal";
  }

  if (value === "advanced") {
    return "border-primary/30 bg-primary/5 text-primary";
  }

  return "border-primary/30 bg-primary/5 text-primary";
}

/* ============================================================
   COMPONENT
   ============================================================ */

export default function RecommendedSkills() {
  const fileInputRef = useRef(null);

  const [targetRole, setTargetRole] =
    useState("");

  const [experienceLevel, setExperienceLevel] =
    useState("Student / Fresher");

  const [resumeFile, setResumeFile] =
    useState(null);

  const [resumeText, setResumeText] =
    useState("");

  const [recommendations, setRecommendations] =
    useState([]);

  const [selectedSkill, setSelectedSkill] =
    useState(null);

  const [category, setCategory] =
    useState("All");

  const [level, setLevel] =
    useState("All");

  const [priority, setPriority] =
    useState("All");

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [usingFallback, setUsingFallback] =
    useState(false);

  /* ==========================================================
     DATA
     ========================================================== */

  const hasResults =
    recommendations.length > 0;

  const displayRecommendations =
    hasResults
      ? recommendations
      : getRoleRecommendations(targetRole);

  const filteredRecommendations =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return displayRecommendations
        .filter((item) => {
          const matchesCategory =
            category === "All" ||
            String(item.category)
              .toLowerCase() ===
              category.toLowerCase();

          const matchesLevel =
            level === "All" ||
            String(item.level)
              .toLowerCase() ===
              level.toLowerCase();

          const matchesPriority =
            priority === "All" ||
            String(item.priority)
              .toLowerCase() ===
              priority.toLowerCase();

          const matchesSearch =
            !query ||
            String(item.skill)
              .toLowerCase()
              .includes(query) ||
            String(item.category)
              .toLowerCase()
              .includes(query) ||
            String(item.description)
              .toLowerCase()
              .includes(query);

          return (
            matchesCategory &&
            matchesLevel &&
            matchesPriority &&
            matchesSearch
          );
        })
        .sort(
          (a, b) =>
            Number(b.score || 0) -
            Number(a.score || 0)
        );
    }, [
      displayRecommendations,
      category,
      level,
      priority,
      search,
    ]);

  const topSkills =
    displayRecommendations.slice(0, 3);

  const averageScore =
    displayRecommendations.length > 0
      ? Math.round(
          displayRecommendations.reduce(
            (sum, item) =>
              sum +
              Number(item.score || 0),
            0
          ) /
            displayRecommendations.length
        )
      : 0;

  const highPriorityCount =
    displayRecommendations.filter(
      (item) => {
        const value =
          String(
            item.priority || ""
          ).toLowerCase();

        return (
          value === "high" ||
          value === "critical"
        );
      }
    ).length;

  /* ==========================================================
     AUTH HEADERS
     ========================================================== */

  const getAuthHeaders = () => {
    const token = getToken();

    return token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {};
  };

  /* ==========================================================
     RESUME UPLOAD
     ========================================================== */

  const handleResumeUpload = async (
    file
  ) => {
    if (!file) {
      return;
    }

    setError("");

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    const extension = file.name
      .split(".")
      .pop()
      ?.toLowerCase();

    const allowedExtensions = [
      "pdf",
      "doc",
      "docx",
      "txt",
    ];

    if (
      !allowedTypes.includes(file.type) &&
      !allowedExtensions.includes(
        extension
      )
    ) {
      setError(
        "Please upload a PDF, DOC, DOCX, or TXT resume."
      );

      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError(
        "Resume file must be smaller than 10 MB."
      );

      return;
    }

    setResumeFile(file);
    setUploading(true);

    try {
      const formData = new FormData();

      /*
       * The backend accepts the upload field as "file".
       */
      formData.append("file", file);

      const response = await fetch(
        `${API_URL}/api/ai/parse-resume-file`,
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
          },
          body: formData,
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Resume parsing failed (${response.status}).`
        );
      }

      const parsedText =
        data?.text ||
        data?.resumeText ||
        data?.resume?.text ||
        data?.data?.text ||
        "";

      if (
        typeof parsedText ===
          "string" &&
        parsedText.trim()
      ) {
        setResumeText(
          parsedText.trim()
        );
      } else {
        /*
         * Some backend versions return structured
         * resume information instead of plain text.
         */
        const structuredResume =
          data?.resume ||
          data?.data ||
          data;

        const structuredText =
          typeof structuredResume ===
          "string"
            ? structuredResume
            : JSON.stringify(
                structuredResume,
                null,
                2
              );

        setResumeText(
          structuredText
        );
      }
    } catch (err) {
      console.error(
        "Resume upload error:",
        err
      );

      /*
       * Keep the file selected even if parsing
       * fails. The user can retry when generating.
       */
      setError(
        err?.message ||
          "Unable to process your resume. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  /* ==========================================================
     GENERATE RECOMMENDATIONS
     ========================================================== */

  const generateRecommendations =
    async () => {
      setError("");
      setSelectedSkill(null);

      const role =
        targetRole.trim();

      if (!role) {
        setError(
          "Please enter the career role you want to target."
        );

        return;
      }

      if (
        !resumeText.trim() &&
        !resumeFile
      ) {
        setError(
          "Please upload your resume or paste your resume details first."
        );

        return;
      }

      setLoading(true);
      setUsingFallback(false);

      try {
        let finalResume =
          resumeText.trim();

        /*
         * If the file exists but text hasn't been
         * extracted yet, parse it here.
         */
        if (
          resumeFile &&
          !finalResume
        ) {
          const formData =
            new FormData();

          formData.append(
            "file",
            resumeFile
          );

          const parseResponse =
            await fetch(
              `${API_URL}/api/ai/parse-resume-file`,
              {
                method: "POST",
                headers: {
                  ...getAuthHeaders(),
                },
                body: formData,
              }
            );

          let parseData = {};

          try {
            parseData =
              await parseResponse.json();
          } catch {
            parseData = {};
          }

          if (!parseResponse.ok) {
            throw new Error(
              parseData?.message ||
                "Unable to parse your resume."
            );
          }

          finalResume =
            parseData?.text ||
            parseData?.resumeText ||
            parseData?.resume?.text ||
            "";

          if (
            typeof finalResume !==
            "string"
          ) {
            finalResume =
              JSON.stringify(
                finalResume
              );
          }
        }

        if (!finalResume.trim()) {
          throw new Error(
            "No readable resume content was found."
          );
        }

        /*
         * Main AI endpoint.
         */
        const response =
          await fetch(
            `${API_URL}/api/ai/recommended-skills`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                ...getAuthHeaders(),
              },
              body: JSON.stringify({
                targetRole: role,
                experienceLevel,
                resume: finalResume,
                resumeText: finalResume,
              }),
            }
          );

        let data = {};

        try {
          data =
            await response.json();
        } catch {
          data = {};
        }

        if (!response.ok) {
          throw new Error(
            data?.message ||
              `AI recommendation request failed (${response.status}).`
          );
        }

        if (
          data?.success === false
        ) {
          throw new Error(
            data?.message ||
              "The AI could not generate recommendations."
          );
        }

        const generated =
          normalizeRecommendations(
            data
          );

        if (
          !generated.length
        ) {
          throw new Error(
            "The AI did not return any recommendations."
          );
        }

        const normalized =
          generated
            .map(normalizeSkill)
            .filter(
              (item) =>
                item.skill &&
                item.skill.trim()
            );

        if (
          !normalized.length
        ) {
          throw new Error(
            "The AI returned an invalid recommendation format."
          );
        }

        setRecommendations(
          normalized
        );

        setCategory("All");
        setLevel("All");
        setPriority("All");
        setSearch("");
        setUsingFallback(false);
      } catch (err) {
        console.error(
          "AI recommendation error:",
          err
        );

        /*
         * The page remains functional even if the AI
         * endpoint is unavailable.
         */
        const localRecommendations =
          getRoleRecommendations(
            role
          );

        setRecommendations(
          localRecommendations
        );

        setCategory("All");
        setLevel("All");
        setPriority("All");
        setSearch("");
        setUsingFallback(true);

        setError(
          "AI recommendations are temporarily unavailable. Showing role-based recommendations instead."
        );
      } finally {
        setLoading(false);
      }
    };

  /* ==========================================================
     CLEAR RESUME
     ========================================================== */

  const clearResume = () => {
    setResumeFile(null);
    setResumeText("");
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /* ==========================================================
     RESET EVERYTHING
     ========================================================== */

  const resetPage = () => {
    setTargetRole("");
    setExperienceLevel(
      "Student / Fresher"
    );
    setResumeFile(null);
    setResumeText("");
    setRecommendations([]);
    setSelectedSkill(null);
    setCategory("All");
    setLevel("All");
    setPriority("All");
    setSearch("");
    setError("");
    setUsingFallback(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <>
      {/* ======================================================
          PAGE-SPECIFIC CSS

          This prevents global .input rules from breaking
          the search icon / placeholder alignment.
      ====================================================== */}

      <style>{`
        .recommended-skills-page {
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100% !important;
          overflow-x: hidden !important;
        }

        .recommended-skills-page
        .skill-search-wrapper {
          position: relative !important;
          width: 100% !important;
          min-width: 0 !important;
        }

        .recommended-skills-page
        .skill-search-input {
          display: block !important;
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100% !important;
          box-sizing: border-box !important;

          padding-left: 48px !important;
          padding-right: 16px !important;

          text-indent: 0 !important;

          white-space: nowrap !important;
        }

        .recommended-skills-page
        .skill-search-input::placeholder {
          padding-left: 0 !important;
          text-indent: 0 !important;
          white-space: nowrap !important;
        }

        .recommended-skills-page
        .skill-search-icon {
          position: absolute !important;
          left: 16px !important;
          right: auto !important;
          top: 50% !important;

          width: 17px !important;
          height: 17px !important;

          transform: translateY(-50%) !important;

          z-index: 20 !important;
          pointer-events: none !important;
        }

        .recommended-skills-page
        .skill-card {
          min-width: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          overflow: hidden !important;
        }

        .recommended-skills-page
        .skill-title {
          min-width: 0 !important;
          max-width: 100% !important;

          word-break: normal !important;
          overflow-wrap: anywhere !important;
          white-space: normal !important;

          writing-mode: horizontal-tb !important;
          direction: ltr !important;
        }

        .recommended-skills-page
        .skill-description {
          word-break: normal !important;
          overflow-wrap: anywhere !important;
          white-space: normal !important;

          writing-mode: horizontal-tb !important;
          direction: ltr !important;
        }

        .recommended-skills-page
        .upload-zone {
          width: 100% !important;
          min-width: 0 !important;
        }

        @media (max-width: 640px) {
          .recommended-skills-page
          .skill-search-input {
            padding-left: 46px !important;
          }

          .recommended-skills-page
          .skill-search-icon {
            left: 15px !important;
          }
        }
      `}</style>

      <main className="recommended-skills-page min-h-screen w-full bg-background px-5 py-5 text-foreground sm:px-6 sm:py-6 lg:px-7 lg:py-7">
        <div className="mx-auto w-full max-w-[1500px] min-w-0">

          {/* ==================================================
              BACK
          ================================================== */}

          <BackButton />

          {/* ==================================================
              HERO
          ================================================== */}

          <section className="mt-5 overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8 lg:p-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">

              <div className="min-w-0 max-w-4xl">

                <div className="ai-badge mb-4 inline-flex items-center gap-2">
                  <Sparkles size={14} />
                  AI-POWERED CAREER GROWTH
                </div>

                <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                  Recommended{" "}
                  <span className="gradient-text">
                    Skills
                  </span>
                </h1>

                <p className="muted mt-4 max-w-3xl text-base leading-7 sm:text-lg">
                  Discover the skills that can strengthen
                  your career. AI analyzes your resume,
                  target role, and experience level to
                  recommend what you should learn next.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">

                  <div className="chip">
                    <Brain size={15} />
                    Personalized AI recommendations
                  </div>

                  <div className="chip">
                    <TrendingUp size={15} />
                    Career-focused
                  </div>

                  <div className="chip">
                    <Zap size={15} />
                    Actionable learning paths
                  </div>

                </div>

              </div>

              <div className="ai-glow flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl border border-border bg-muted/40 lg:h-36 lg:w-36">
                <Lightbulb
                  size={62}
                  strokeWidth={1.5}
                  className="text-primary"
                />
              </div>

            </div>
          </section>

          {/* ==================================================
              INPUT AREA
          ================================================== */}

          <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">

            {/* LEFT */}

            <div className="card">

              <div className="mb-6 flex items-start gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Target size={22} />
                </div>

                <div className="min-w-0">
                  <h2 className="text-xl font-bold">
                    Tell AI where you want to go
                  </h2>

                  <p className="muted mt-1 text-sm">
                    Your recommendations will be
                    tailored to this career direction.
                  </p>
                </div>

              </div>

              {/* ROLE */}

              <div className="grid gap-5 sm:grid-cols-2">

                <div className="min-w-0">
                  <label className="label">
                    Target career / role
                  </label>

                  <input
                    type="text"
                    className="input"
                    value={targetRole}
                    onChange={(e) =>
                      setTargetRole(
                        e.target.value
                      )
                    }
                    placeholder="e.g. Software Engineer"
                  />
                </div>

                {/* EXPERIENCE */}

                <div className="min-w-0">
                  <label className="label">
                    Experience level
                  </label>

                  <select
                    className="input"
                    value={experienceLevel}
                    onChange={(e) =>
                      setExperienceLevel(
                        e.target.value
                      )
                    }
                  >
                    <option>
                      Student / Fresher
                    </option>

                    <option>
                      0–2 years
                    </option>

                    <option>
                      2–5 years
                    </option>

                    <option>
                      5+ years
                    </option>
                  </select>
                </div>

              </div>

              {/* RESUME */}

              <div className="mt-6">

                <label className="label">
                  Resume
                </label>

                {!resumeFile ? (

                  <label className="upload-zone flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/20 px-6 py-9 text-center transition hover:border-primary/50 hover:bg-muted/40">

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      className="hidden"
                      onChange={(e) =>
                        handleResumeUpload(
                          e.target.files?.[0]
                        )
                      }
                    />

                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">

                      {uploading ? (
                        <Loader2
                          size={22}
                          className="animate-spin"
                        />
                      ) : (
                        <Upload size={22} />
                      )}

                    </div>

                    <p className="font-semibold">
                      {uploading
                        ? "Reading your resume..."
                        : "Upload your resume"}
                    </p>

                    <p className="muted mt-1 text-sm">
                      PDF, DOC, DOCX or TXT •
                      Maximum 10 MB
                    </p>

                  </label>

                ) : (

                  <div className="rounded-2xl border border-border bg-muted/20 p-4">

                    <div className="flex items-center justify-between gap-3">

                      <div className="flex min-w-0 items-center gap-3">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <FileText size={19} />
                        </div>

                        <div className="min-w-0">

                          <p className="truncate font-semibold">
                            {resumeFile.name}
                          </p>

                          <p className="muted mt-0.5 text-xs">
                            {resumeText
                              ? "Resume text extracted successfully"
                              : uploading
                                ? "Processing resume..."
                                : "Resume uploaded"}
                          </p>

                        </div>

                      </div>

                      <button
                        type="button"
                        className="nav-btn shrink-0"
                        onClick={
                          clearResume
                        }
                        aria-label="Remove resume"
                        title="Remove resume"
                      >
                        <X size={17} />
                      </button>

                    </div>

                    {resumeText && (
                      <div className="mt-4 rounded-xl border border-border bg-background p-3">

                        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-primary">
                          <CheckCircle2
                            size={14}
                          />
                          Resume ready for AI analysis
                        </div>

                        <p className="muted line-clamp-3 whitespace-pre-line text-xs leading-5">
                          {resumeText}
                        </p>

                      </div>
                    )}

                  </div>

                )}

              </div>

              {/* PASTE */}

              <div className="mt-5">

                <label className="label">
                  Or paste your resume details
                </label>

                <textarea
                  className="textarea min-h-[150px]"
                  value={resumeText}
                  onChange={(e) =>
                    setResumeText(
                      e.target.value
                    )
                  }
                  placeholder="Paste your resume text here..."
                />

                <p className="muted mt-2 text-xs">
                  The more complete your resume
                  information is, the more relevant
                  the recommendations will be.
                </p>

              </div>

              {/* ERROR / INFO */}

              {error && (
                <div
                  className={`mt-5 rounded-2xl border p-4 text-sm ${
                    usingFallback
                      ? "border-primary/30 bg-primary/5 text-foreground"
                      : "border-destructive/30 bg-destructive/5 text-destructive"
                  }`}
                >
                  <div className="flex items-start gap-2">

                    {usingFallback ? (
                      <Lightbulb
                        size={17}
                        className="mt-0.5 shrink-0 text-primary"
                      />
                    ) : (
                      <X
                        size={17}
                        className="mt-0.5 shrink-0"
                      />
                    )}

                    <span>
                      {error}
                    </span>

                  </div>
                </div>
              )}

              {/* BUTTONS */}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">

                <button
                  type="button"
                  onClick={
                    generateRecommendations
                  }
                  disabled={
                    loading ||
                    uploading
                  }
                  className="btn btn-primary flex-1 sm:flex-none"
                >

                  {loading ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />

                      AI is analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles size={17} />

                      Recommend Skills

                      <ArrowRight
                        size={17}
                      />
                    </>
                  )}

                </button>

                {(recommendations.length >
                  0 ||
                  targetRole ||
                  resumeFile ||
                  resumeText) && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={resetPage}
                  >
                    Reset
                  </button>
                )}

              </div>

            </div>

            {/* RIGHT */}

            <div className="card">

              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Brain size={22} />
              </div>

              <h2 className="text-xl font-bold">
                What will AI recommend?
              </h2>

              <p className="muted mt-2 leading-7">
                The system looks at your target
                career, experience level, and resume
                information to identify useful skills
                to learn next.
              </p>

              <div className="mt-6 space-y-3">

                {[
                  [
                    TrendingUp,
                    "High-value skills",
                    "Skills with strong career relevance",
                  ],
                  [
                    GraduationCap,
                    "Learning difficulty",
                    "Know what level you should target",
                  ],
                  [
                    Clock3,
                    "Learning estimate",
                    "Get a realistic time expectation",
                  ],
                  [
                    Briefcase,
                    "Career impact",
                    "Understand why the skill matters",
                  ],
                ].map(
                  ([
                    Icon,
                    title,
                    description,
                  ]) => (
                    <div
                      key={title}
                      className="flex gap-3 rounded-2xl border border-border bg-muted/20 p-3"
                    >

                      <Icon
                        size={19}
                        className="mt-0.5 shrink-0 text-primary"
                      />

                      <div className="min-w-0">

                        <p className="text-sm font-semibold">
                          {title}
                        </p>

                        <p className="muted mt-0.5 text-xs">
                          {description}
                        </p>

                      </div>

                    </div>
                  )
                )}

              </div>

            </div>

          </section>

          {/* ==================================================
              RESULTS HEADER
          ================================================== */}

          <section className="mt-7">

            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

              <div className="min-w-0">

                <div className="ai-badge mb-2 inline-flex items-center gap-2">
                  <Sparkles size={13} />
                  AI INSIGHTS
                </div>

                <h2 className="text-2xl font-black sm:text-3xl">
                  Skills worth learning next
                </h2>

                <p className="muted mt-1">
                  {hasResults
                    ? `Personalized recommendations for ${
                        targetRole ||
                        "your target career"
                      }.`
                    : "Explore recommended skills while you build your profile."}
                </p>

              </div>

              <div className="flex flex-wrap gap-2">

                {hasResults && (
                  <span className="chip">
                    <CheckCircle2 size={14} />
                    Personalized
                  </span>
                )}

                {!hasResults && (
                  <span className="chip">
                    Example recommendations
                  </span>
                )}

              </div>

            </div>

            {/* ==================================================
                STATS
            ================================================== */}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <div className="card">

                <div className="flex items-center justify-between">

                  <p className="muted text-sm">
                    Recommended Skills
                  </p>

                  <Lightbulb
                    size={19}
                    className="text-primary"
                  />

                </div>

                <p className="mt-3 text-3xl font-black">
                  {
                    displayRecommendations.length
                  }
                </p>

                <p className="muted mt-1 text-xs">
                  Learning opportunities
                </p>

              </div>

              <div className="card">

                <div className="flex items-center justify-between">

                  <p className="muted text-sm">
                    Average Relevance
                  </p>

                  <TrendingUp
                    size={19}
                    className="text-primary"
                  />

                </div>

                <p className="mt-3 text-3xl font-black">
                  {averageScore}%
                </p>

                <p className="muted mt-1 text-xs">
                  AI relevance score
                </p>

              </div>

              <div className="card">

                <div className="flex items-center justify-between">

                  <p className="muted text-sm">
                    High Priority
                  </p>

                  <Zap
                    size={19}
                    className="text-destructive"
                  />

                </div>

                <p className="mt-3 text-3xl font-black">
                  {highPriorityCount}
                </p>

                <p className="muted mt-1 text-xs">
                  Skills worth prioritizing
                </p>

              </div>

              <div className="card min-w-0">

                <div className="flex items-center justify-between">

                  <p className="muted text-sm">
                    Top Recommendation
                  </p>

                  <Award
                    size={19}
                    className="text-primary"
                  />

                </div>

                <p className="mt-3 truncate text-xl font-black">
                  {topSkills[0]?.skill ||
                    "—"}
                </p>

                <p className="muted mt-1 text-xs">
                  Highest relevance
                </p>

              </div>

            </div>

          </section>

          {/* ==================================================
              TOP THREE
          ================================================== */}

          <section className="mt-6">

            <div className="card">

              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <h2 className="text-xl font-bold">
                    Top skills to prioritize
                  </h2>

                  <p className="muted mt-1 text-sm">
                    Start with these before moving
                    down the list.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-sm text-primary">
                  <Sparkles size={16} />
                  AI ranked
                </div>

              </div>

              <div className="grid gap-4 lg:grid-cols-3">

                {topSkills.map(
                  (item, index) => {
                    const Icon =
                      getCategoryIcon(
                        item.category
                      );

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          setSelectedSkill(
                            item
                          )
                        }
                        className="group min-w-0 rounded-2xl border border-border bg-muted/20 p-5 text-left transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
                      >

                        <div className="flex items-start justify-between gap-3">

                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Icon size={21} />
                          </div>

                          <span className="rounded-full bg-background px-3 py-1 text-xs font-bold">
                            #{index + 1}
                          </span>

                        </div>

                        <h3 className="skill-title mt-4 text-lg font-bold">
                          {item.skill}
                        </h3>

                        <p className="muted mt-1 text-sm">
                          {item.category}
                        </p>

                        <div className="mt-5 flex items-center justify-between gap-3">

                          <span className="text-sm font-bold text-primary">
                            {item.score}%
                            relevance
                          </span>

                          <ArrowRight
                            size={17}
                            className="transition group-hover:translate-x-1"
                          />

                        </div>

                        <div className="progress mt-3">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(
                                  0,
                                  item.score
                                )
                              )}%`,
                            }}
                          />
                        </div>

                      </button>
                    );
                  }
                )}

              </div>

            </div>

          </section>

          {/* ==================================================
              FILTERS
          ================================================== */}

          <section className="mt-6">

            <div className="card">

              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

                <div>
                  <h2 className="text-xl font-bold">
                    Explore recommended skills
                  </h2>

                  <p className="muted mt-1 text-sm">
                    Filter recommendations based
                    on what you want to learn.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Filter
                    size={17}
                    className="text-primary"
                  />

                  <span className="muted text-sm">
                    {
                      filteredRecommendations.length
                    }{" "}
                    results
                  </span>
                </div>

              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">

                {/* SEARCH */}

                <div className="skill-search-wrapper md:col-span-2 xl:col-span-1">

                  <Search
                    size={17}
                    className="skill-search-icon text-muted-foreground"
                    aria-hidden="true"
                  />

                  <input
                    type="text"
                    className="skill-search-input input"
                    value={search}
                    onChange={(e) =>
                      setSearch(
                        e.target.value
                      )
                    }
                    placeholder="Search skills..."
                  />

                </div>

                {/* CATEGORY */}

                <select
                  className="input"
                  value={category}
                  onChange={(e) =>
                    setCategory(
                      e.target.value
                    )
                  }
                >
                  {categoryOptions.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    )
                  )}
                </select>

                {/* LEVEL */}

                <select
                  className="input"
                  value={level}
                  onChange={(e) =>
                    setLevel(
                      e.target.value
                    )
                  }
                >
                  {levelOptions.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    )
                  )}
                </select>

                {/* PRIORITY */}

                <select
                  className="input"
                  value={priority}
                  onChange={(e) =>
                    setPriority(
                      e.target.value
                    )
                  }
                >
                  {priorityOptions.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item === "All"
                          ? "All priorities"
                          : `${item} priority`}
                      </option>
                    )
                  )}
                </select>

              </div>

            </div>

          </section>

          {/* ==================================================
              SKILL LIST
          ================================================== */}

          <section className="mt-5">

            <div className="grid gap-5 lg:grid-cols-2">

              {filteredRecommendations.map(
                (item) => {
                  const Icon =
                    getCategoryIcon(
                      item.category
                    );

                  return (
                    <article
                      key={item.id}
                      className="skill-card card group transition hover:-translate-y-1 hover:shadow-lg"
                    >

                      {/* HEADER */}

                      <div className="flex items-start justify-between gap-4">

                        <div className="flex min-w-0 gap-4">

                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Icon size={22} />
                          </div>

                          <div className="min-w-0">

                            <h3 className="skill-title text-xl font-bold">
                              {item.skill}
                            </h3>

                            <p className="muted mt-1 text-sm">
                              {item.category}
                            </p>

                          </div>

                        </div>

                        <div className="shrink-0 text-right">

                          <p className="text-2xl font-black text-primary">
                            {item.score}%
                          </p>

                          <p className="muted text-[11px]">
                            relevance
                          </p>

                        </div>

                      </div>

                      {/* DESCRIPTION */}

                      <p className="skill-description muted mt-5 line-clamp-3 text-sm leading-6">
                        {item.description}
                      </p>

                      {/* BADGES */}

                      <div className="mt-5 flex flex-wrap gap-2">

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${getPriorityClass(
                            item.priority
                          )}`}
                        >
                          {item.priority}{" "}
                          priority
                        </span>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${getLevelClass(
                            item.level
                          )}`}
                        >
                          {item.level}
                        </span>

                        <span className="inline-flex items-center rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold">
                          <Clock3
                            size={12}
                            className="mr-1"
                          />

                          {
                            item.learningTime
                          }
                        </span>

                      </div>

                      {/* CAREER VALUE */}

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">

                        <div className="rounded-2xl bg-muted/30 p-3">

                          <p className="muted text-xs">
                            Career value
                          </p>

                          <p className="mt-1 font-bold">
                            {
                              item.careerValue
                            }
                          </p>

                        </div>

                        <div className="rounded-2xl bg-muted/30 p-3">

                          <p className="muted text-xs">
                            AI priority
                          </p>

                          <p className="mt-1 font-bold">
                            {item.priority}
                          </p>

                        </div>

                      </div>

                      {/* PROGRESS */}

                      <div className="mt-5">

                        <div className="mb-2 flex justify-between text-xs">

                          <span className="muted">
                            Recommendation
                            strength
                          </span>

                          <span className="font-bold">
                            {item.score}%
                          </span>

                        </div>

                        <div className="progress">

                          <div
                            className="progress-fill"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(
                                  0,
                                  item.score
                                )
                              )}%`,
                            }}
                          />

                        </div>

                      </div>

                      {/* BUTTON */}

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedSkill(
                            item
                          )
                        }
                        className="btn btn-secondary mt-5 w-full"
                      >
                        Explore this skill
                        <ArrowRight
                          size={16}
                        />
                      </button>

                    </article>
                  );
                }
              )}

            </div>

            {/* NO RESULTS */}

            {filteredRecommendations.length ===
              0 && (
              <div className="card mt-5 py-14 text-center">

                <Search
                  size={35}
                  className="mx-auto text-muted-foreground"
                />

                <h3 className="mt-4 text-lg font-bold">
                  No skills found
                </h3>

                <p className="muted mt-1 text-sm">
                  Try changing your filters
                  or search term.
                </p>

                <button
                  type="button"
                  className="btn btn-secondary mx-auto mt-5"
                  onClick={() => {
                    setSearch("");
                    setCategory("All");
                    setLevel("All");
                    setPriority("All");
                  }}
                >
                  Reset Filters
                </button>

              </div>
            )}

          </section>

          {/* ==================================================
              LEARNING STRATEGY
          ================================================== */}

          <section className="mt-6">

            <div className="card">

              <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">

                <div>

                  <div className="ai-badge mb-3 inline-flex items-center gap-2">
                    <GraduationCap
                      size={13}
                    />
                    LEARNING STRATEGY
                  </div>

                  <h2 className="text-2xl font-black">
                    Don't learn everything at once.
                  </h2>

                  <p className="muted mt-3 leading-7">
                    Focus on a small number of
                    high-value skills, build projects
                    around them, and gradually
                    increase your difficulty.
                  </p>

                </div>

                <div className="grid gap-3 sm:grid-cols-3">

                  {[
                    [
                      "01",
                      "Prioritize",
                      "Start with the highest-value recommendation.",
                    ],
                    [
                      "02",
                      "Practice",
                      "Build a real project using the skill.",
                    ],
                    [
                      "03",
                      "Prove it",
                      "Add the skill and project to your resume.",
                    ],
                  ].map(
                    ([
                      number,
                      title,
                      description,
                    ]) => (
                      <div
                        key={number}
                        className="rounded-2xl border border-border bg-muted/20 p-5"
                      >

                        <span className="text-sm font-black text-primary">
                          {number}
                        </span>

                        <h3 className="mt-3 font-bold">
                          {title}
                        </h3>

                        <p className="muted mt-2 text-sm leading-6">
                          {description}
                        </p>

                      </div>
                    )
                  )}

                </div>

              </div>

            </div>

          </section>

        </div>
      </main>

      {/* ========================================================
          SKILL DETAILS MODAL
      ======================================================== */}

      {selectedSkill && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedSkill(null);
            }
          }}
        >

          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-border bg-background shadow-2xl">

            {/* MODAL HEADER */}

            <div className="border-b border-border p-6">

              <div className="flex items-start justify-between gap-4">

                <div className="flex min-w-0 gap-4">

                  <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">

                    {React.createElement(
                      getCategoryIcon(
                        selectedSkill.category
                      ),
                      {
                        size: 25,
                      }
                    )}

                  </div>

                  <div className="min-w-0">

                    <div className="ai-badge mb-2 inline-flex items-center gap-2">
                      <Sparkles size={12} />
                      AI RECOMMENDATION
                    </div>

                    <h2 className="skill-title text-2xl font-black">
                      {
                        selectedSkill.skill
                      }
                    </h2>

                    <p className="muted mt-1">
                      {
                        selectedSkill.category
                      }
                    </p>

                  </div>

                </div>

                <button
                  type="button"
                  className="nav-btn shrink-0"
                  onClick={() =>
                    setSelectedSkill(
                      null
                    )
                  }
                  aria-label="Close"
                >
                  <X size={19} />
                </button>

              </div>

            </div>

            {/* MODAL BODY */}

            <div className="space-y-6 p-6">

              {/* STATS */}

              <div className="grid gap-3 sm:grid-cols-3">

                <div className="rounded-2xl bg-muted/30 p-4">

                  <p className="muted text-xs">
                    Relevance
                  </p>

                  <p className="mt-1 text-xl font-black text-primary">
                    {
                      selectedSkill.score
                    }
                    %
                  </p>

                </div>

                <div className="rounded-2xl bg-muted/30 p-4">

                  <p className="muted text-xs">
                    Learning time
                  </p>

                  <p className="mt-1 font-black">
                    {
                      selectedSkill.learningTime
                    }
                  </p>

                </div>

                <div className="rounded-2xl bg-muted/30 p-4">

                  <p className="muted text-xs">
                    Career value
                  </p>

                  <p className="mt-1 font-black">
                    {
                      selectedSkill.careerValue
                    }
                  </p>

                </div>

              </div>

              {/* DESCRIPTION */}

              <div>

                <h3 className="font-bold">
                  About this skill
                </h3>

                <p className="skill-description muted mt-2 leading-7">
                  {
                    selectedSkill.description
                  }
                </p>

              </div>

              {/* WHY */}

              <div>

                <h3 className="font-bold">
                  Why AI recommends this
                </h3>

                <p className="skill-description muted mt-2 leading-7">
                  {
                    selectedSkill.whyRecommended
                  }
                </p>

              </div>

              {/* OUTCOMES */}

              {selectedSkill.outcomes
                ?.length > 0 && (
                <div>

                  <h3 className="font-bold">
                    What you will gain
                  </h3>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">

                    {selectedSkill.outcomes.map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          key={`${item}-${index}`}
                          className="flex items-start gap-2 rounded-xl border border-border bg-muted/20 p-3 text-sm"
                        >

                          <CheckCircle2
                            size={16}
                            className="mt-0.5 shrink-0 text-primary"
                          />

                          <span>
                            {String(item)}
                          </span>

                        </div>
                      )
                    )}

                  </div>

                </div>
              )}

              {/* RESOURCES */}

              {selectedSkill.resources
                ?.length > 0 && (
                <div>

                  <h3 className="font-bold">
                    Suggested learning areas
                  </h3>

                  <div className="mt-3 space-y-2">

                    {selectedSkill.resources.map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          key={`${item}-${index}`}
                          className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3"
                        >

                          <BookOpen
                            size={16}
                            className="shrink-0 text-primary"
                          />

                          <span className="text-sm">
                            {String(item)}
                          </span>

                        </div>
                      )
                    )}

                  </div>

                </div>
              )}

              {/* ACTIONS */}

              <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row">

                <button
                  type="button"
                  className="btn btn-primary flex-1"
                  onClick={() =>
                    setSelectedSkill(
                      null
                    )
                  }
                >
                  <GraduationCap
                    size={17}
                  />

                  Start Learning
                </button>

                <button
                  type="button"
                  className="btn btn-secondary flex-1"
                  onClick={() =>
                    setSelectedSkill(
                      null
                    )
                  }
                >
                  <Map size={17} />

                  Build Learning Plan
                </button>

              </div>

            </div>

          </div>

        </div>
      )}
    </>
  );
}