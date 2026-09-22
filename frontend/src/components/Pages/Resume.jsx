import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useLocation,
  useNavigate, useParams 
} from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import AuthGate from "../AuthGate";
import API from "../../lib/api";
import { getToken, isAuthed } from "../../lib/auth";

// ============================================================
// API
// ============================================================

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000";

// ============================================================
// EMPTY RESUME
// ============================================================

const emptyResume = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  github: "",

  targetRole: "",
  summary: "",

  skills: [],
  experience: [],
  projects: [],
  education: [],
  certifications: [],
  achievements: [],

  atsKeywords: [],
  recommendedSkills: [],
  skillGaps: [],
};

// ============================================================
// HELPERS
// ============================================================

function splitList(value) {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => {
        if (typeof item === "string") {
          return item.split(/[,;\n]/);
        }

        if (item && typeof item === "object") {
          const text =
            item.text ||
            item.name ||
            item.title ||
            item.skill ||
            item.description ||
            "";

          return String(text).split(/[,;\n]/);
        }

        return [];
      })
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (!value) return [];

  return String(value)
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toText(value) {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => toText(item))
      .filter(Boolean)
      .join("\n");
  }

  if (typeof value === "object") {
    return (
      value.text ||
      value.description ||
      value.detail ||
      value.content ||
      value.value ||
      ""
    );
  }

  return String(value);
}

function normalizeBullets(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") {
          return item
            .replace(/^[-•*]\s*/, "")
            .trim();
        }

        if (item && typeof item === "object") {
          return (
            item.text ||
            item.description ||
            item.detail ||
            item.content ||
            ""
          )
            .replace(/^[-•*]\s*/, "")
            .trim();
        }

        return "";
      })
      .filter(Boolean);
  }

  return String(value)
    .split(/\n/)
    .map((item) =>
      item
        .replace(/^[-•*]\s*/, "")
        .trim()
    )
    .filter(Boolean);
}

function normalizeExperience(items) {
  if (!items) return [];

  if (!Array.isArray(items)) {
    return [
      {
        title: "Professional Experience",
        company: "",
        description: toText(items),
        bullets: normalizeBullets(items),
      },
    ];
  }

  return items
    .map((item) => {
      if (typeof item === "string") {
        return {
          title: "Professional Experience",
          company: "",
          description: item,
          bullets: normalizeBullets(item),
        };
      }

      return {
        ...item,

        title:
          item.title ||
          item.role ||
          item.position ||
          item.jobTitle ||
          "Professional Experience",

        company:
          item.company ||
          item.organization ||
          item.employer ||
          "",

        location:
          item.location ||
          "",

        date:
          item.date ||
          item.dates ||
          item.duration ||
          "",

        description:
          item.description ||
          item.details ||
          item.content ||
          "",

        bullets: normalizeBullets(
          item.bullets ||
          item.responsibilities ||
          item.achievements ||
          item.description ||
          item.details
        ),
      };
    })
    .filter(Boolean);
}

function normalizeProjects(items) {
  if (!items) return [];

  if (!Array.isArray(items)) {
    return [
      {
        title: "Project",
        description: toText(items),
        bullets: normalizeBullets(items),
      },
    ];
  }

  return items
    .map((item) => {
      if (typeof item === "string") {
        return {
          title: "Project",
          description: item,
          bullets: normalizeBullets(item),
        };
      }

      return {
        ...item,

        title:
          item.title ||
          item.name ||
          "Project",

        description:
          item.description ||
          item.details ||
          item.content ||
          "",

        bullets: normalizeBullets(
          item.bullets ||
          item.highlights ||
          item.description ||
          item.details
        ),

        technologies:
          item.technologies ||
          item.techStack ||
          "",
      };
    })
    .filter(Boolean);
}

function normalizeEducation(items) {
  if (!items) return [];

  if (!Array.isArray(items)) {
    return [
      {
        degree: toText(items),
        institution: "",
        date: "",
      },
    ];
  }

  return items
    .map((item) => {
      if (typeof item === "string") {
        return {
          degree: item,
          institution: "",
          date: "",
        };
      }

      return {
        ...item,

        degree:
          item.degree ||
          item.title ||
          item.course ||
          item.program ||
          "Education",

        institution:
          item.institution ||
          item.school ||
          item.university ||
          "",

        date:
          item.date ||
          item.dates ||
          item.duration ||
          item.year ||
          "",

        description:
          item.description ||
          "",
      };
    })
    .filter(Boolean);
}

function normalizeSimpleItems(items) {
  if (!items) return [];

  if (Array.isArray(items)) {
    return items
      .map((item) => {
        if (typeof item === "string") {
          return item.trim();
        }

        if (item && typeof item === "object") {
          return (
            item.name ||
            item.title ||
            item.text ||
            item.description ||
            item.detail ||
            ""
          ).trim();
        }

        return "";
      })
      .filter(Boolean);
  }

  return String(items)
    .split(/\n/)
    .map((item) =>
      item
        .replace(/^[-•*]\s*/, "")
        .trim()
    )
    .filter(Boolean);
}

function normalizeGeneratedResume(raw = {}) {
  const resume =
    raw?.resume ||
    raw?.data ||
    raw ||
    {};

<<<<<<< HEAD
  const contact =
    resume?.contact ||
    resume?.contactInfo ||
    resume?.contactInformation ||
    {};

=======
>>>>>>> 93f05e4 (Fix Gemini AI skill gap analysis)
  return {
    ...emptyResume,

    // IMPORTANT: preserve saved resume metadata
    _id: resume._id || resume.id || "",
    id: resume.id || resume._id || "",
    templateId:
      resume.templateId ||
      resume.template ||
      "simple-ats",
    template:
      resume.template ||
      resume.templateId ||
      "simple-ats",

    fullName:
      resume.fullName ||
      resume.name ||
      "",

    email:
      resume.email ||
      "",

    phone:
      resume.phone ||
      "",

    location:
      resume.location ||
      resume.address ||
      "",

    linkedin:
      resume.linkedin ||
      resume.linkedIn ||
      "",

    github:
      resume.github ||
      resume.gitHub ||
      "",

    targetRole:
      resume.targetRole ||
      resume.role ||
      resume.title ||
      "",

    summary:
      resume.summary ||
      resume.professionalSummary ||
      resume.profile ||
      "",

    skills: splitList(
      resume.skills ||
      resume.coreSkills ||
      resume.technicalSkills
    ),

    experience: normalizeExperience(
      resume.experience ||
      resume.workExperience
    ),

    projects: normalizeProjects(
      resume.projects
    ),

    education: normalizeEducation(
      resume.education
    ),

    certifications:
      normalizeSimpleItems(
        resume.certifications
      ),

    achievements:
      normalizeSimpleItems(
        resume.achievements ||
        resume.awards
      ),

    atsKeywords: splitList(
      resume.atsKeywords ||
      resume.keywords
    ),

    recommendedSkills: splitList(
      resume.recommendedSkills
    ),

    skillGaps: splitList(
      resume.skillGaps
    ),
  };
}

// ============================================================
// TEMPLATE CONFIGURATION
// ============================================================

const TEMPLATE_CONFIG = {
  modern: {
    name: "Modern",
    type: "modern",
    accent: "#6366f1",
  },

  "modern-minimal": {
    name: "Modern Minimal",
    type: "modern",
    accent: "#6366f1",
  },

  classic: {
    name: "Classic",
    type: "classic",
    accent: "#1e293b",
  },

  "classic-professional": {
    name: "Classic Professional",
    type: "classic",
    accent: "#1e293b",
  },

  minimal: {
    name: "Minimal",
    type: "minimal",
    accent: "#64748b",
  },

  "minimalist-clean": {
    name: "Minimalist Clean",
    type: "minimal",
    accent: "#64748b",
  },

  "simple-ats": {
    name: "Simple ATS",
    type: "ats",
    accent: "#111827",
  },

  executive: {
    name: "Executive",
    type: "executive",
    accent: "#0f172a",
  },

  "creative-bold": {
    name: "Creative Bold",
    type: "creative",
    accent: "#7c3aed",
  },

  "two-column": {
    name: "Two Column",
    type: "two-column",
    accent: "#2563eb",
  },

  "tech-developer": {
    name: "Tech Developer",
    type: "tech",
    accent: "#22c55e",
  },

  academic: {
    name: "Academic",
    type: "academic",
    accent: "#7c3aed",
  },

  elegant: {
    name: "Elegant",
    type: "elegant",
    accent: "#be123c",
  },

  "gradient-modern": {
    name: "Gradient Modern",
    type: "gradient",
    accent: "#7c3aed",
  },

  "colorful-vibrant": {
    name: "Colorful Vibrant",
    type: "colorful",
    accent: "#ec4899",
  },

  compact: {
    name: "Compact",
    type: "compact",
    accent: "#475569",
  },

  timeline: {
    name: "Timeline",
    type: "timeline",
    accent: "#4f46e5",
  },

  portfolio: {
    name: "Portfolio",
    type: "portfolio",
    accent: "#0891b2",
  },

  infographic: {
    name: "Infographic",
    type: "infographic",
    accent: "#f97316",
  },

  "photo-professional": {
    name: "Photo Professional",
    type: "photo",
    accent: "#2563eb",
  },

  "fresh-graduate": {
    name: "Fresh Graduate",
    type: "graduate",
    accent: "#2563eb",
  },

  "marketing-creative": {
    name: "Marketing Creative",
    type: "marketing",
    accent: "#db2777",
  },

  "international-cv": {
    name: "International CV",
    type: "international",
    accent: "#0369a1",
  },

  "animated-modern": {
    name: "Animated Modern",
    type: "animated",
    accent: "#8b5cf6",
  },
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function Resume() {
    const location = useLocation();

  const navigate = useNavigate();
    const { id } = useParams();

  const fileInputRef = useRef(null);

  // ==========================================================
  // FLOW
  // ==========================================================

  const [step, setStep] = useState(1);

  const [experienceLevel, setExperienceLevel] =
    useState("");

  const [student, setStudent] =
    useState("");

  const [resumeSource, setResumeSource] =
    useState("");

  const [preferences, setPreferences] =
    useState({
      photo: "no",
      layout: "modern",
      style: "professional",
    });

  const [selectedTemplate, setSelectedTemplate] =
    useState("simple-ats");

  // ==========================================================
  // READ TEMPLATE FROM TEMPLATES PAGE
  // ==========================================================

  useEffect(() => {
    const routeTemplate =
      location.state?.template?.id ||
      location.state?.templateId;

    const savedTemplate =
      localStorage.getItem(
        "selectedResumeTemplate"
      );

    const template =
      routeTemplate ||
      savedTemplate;

    if (template) {
      setSelectedTemplate(
        template
      );
    }
  }, [location.state]);

  // ==========================================================
  // FORM
  // ==========================================================

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",

    targetRole: "",
    careerLevel: "Student / New Graduate",
    jobDescription: "",

    summary: "",
    skills: "",

    experience: "",
    projects: "",
    education: "",
    certifications: "",
    achievements: "",
  });

  // ==========================================================
  // UPLOAD
  // ==========================================================

  const [uploadedFile, setUploadedFile] =
    useState(null);

  const [atsResult, setAtsResult] =
    useState(null);

  // ==========================================================
  // GENERATED RESUME
  // ==========================================================

  const [generatedResume, setGeneratedResume] =
    useState(null);

  // MongoDB id of the current saved resume.
  const [resumeId, setResumeId] =
    useState(null);

  const [showEditor, setShowEditor] =
    useState(false);

  // ==========================================================
  // LOAD SAVED RESUME FROM MONGODB
  // ==========================================================

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get("id");

    if (!id) return;

    let cancelled = false;

    async function loadSavedResume() {
      try {
        const token = getToken();
        if (!token) return;

        const response = await fetch(
          `${API_URL}/api/resumes/${id}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            payload?.message ||
              "Unable to load the saved resume."
          );
        }

        if (cancelled) return;

        const savedResume = payload?.resume || payload;
        const savedData = savedResume?.data || savedResume;
        const normalized = normalizeGeneratedResume({
          resume: savedData,
        });

        setResumeId(savedResume?._id || id);
        setGeneratedResume(normalized);

        const savedTemplate =
          savedResume?.templateId ||
          savedData?.templateId ||
          savedData?.template ||
          "simple-ats";

        setSelectedTemplate(savedTemplate);
        localStorage.setItem(
          "selectedResumeTemplate",
          savedTemplate
        );

        const experienceText = Array.isArray(normalized.experience)
          ? normalized.experience
              .map((item) =>
                [
                  item.role || item.title || "",
                  item.company || "",
                  item.duration || item.date || "",
                  ...(item.bullets || []),
                ]
                  .filter(Boolean)
                  .join(" | ")
              )
              .join("\n")
          : String(normalized.experience || "");

        const projectsText = Array.isArray(normalized.projects)
          ? normalized.projects
              .map((item) =>
                [
                  item.name || item.title || "",
                  item.description || "",
                  Array.isArray(item.technologies)
                    ? item.technologies.join(", ")
                    : item.technologies || "",
                ]
                  .filter(Boolean)
                  .join(" — ")
              )
              .join("\n")
          : String(normalized.projects || "");

        const educationText = Array.isArray(normalized.education)
          ? normalized.education
              .map((item) =>
                [
                  item.degree || item.title || "",
                  item.institution || "",
                  item.date || item.duration || "",
                ]
                  .filter(Boolean)
                  .join(" — ")
              )
              .join("\n")
          : String(normalized.education || "");

        setForm((previous) => ({
          ...previous,
          fullName: normalized.fullName || previous.fullName,
          email: normalized.email || previous.email,
          phone: normalized.phone || previous.phone,
          location: normalized.location || previous.location,
          linkedin: normalized.linkedin || previous.linkedin,
          github: normalized.github || previous.github,
          targetRole: normalized.targetRole || previous.targetRole,
          summary: normalized.summary || previous.summary,
          skills: Array.isArray(normalized.skills)
            ? normalized.skills.join(", ")
            : previous.skills,
          experience: experienceText || previous.experience,
          projects: projectsText || previous.projects,
          education: educationText || previous.education,
          certifications: Array.isArray(normalized.certifications)
            ? normalized.certifications.join("\n")
            : previous.certifications,
          achievements: Array.isArray(normalized.achievements)
            ? normalized.achievements.join("\n")
            : previous.achievements,
        }));

        setShowEditor(true);
        setSuccess(
          params.get("edit") === "true"
            ? "Resume loaded. You can edit and regenerate it."
            : "Saved resume loaded successfully."
        );
      } catch (loadError) {
        console.error(
          "❌ Load saved resume error:",
          loadError
        );

        if (!cancelled) {
          setError(
            loadError?.message ||
              "Unable to load this resume."
          );
        }
      }
    }

    loadSavedResume();

    return () => {
      cancelled = true;
    };
  }, [location.search]);

  // ==========================================================
  // GENERATION
  // ==========================================================

  const [isGenerating, setIsGenerating] =
    useState(false);

  const [generationProgress, setGenerationProgress] =
    useState(0);

  const [generationMessage, setGenerationMessage] =
    useState(
      "Preparing your resume..."
    );

  const [generationAttempt, setGenerationAttempt] =
    useState(1);

  // ==========================================================
  // ERRORS
  // ==========================================================

 const [error, setError] =
  useState("");

const [success, setSuccess] =
  useState("");

const [showErrorModal, setShowErrorModal] =
  useState(false);

const [errorModalTitle, setErrorModalTitle] =
  useState("");

const [errorModalMessage, setErrorModalMessage] =
  useState("");

const [errorModalRetry, setErrorModalRetry] =
  useState(true);


// ==========================================================
// LOAD SAVED RESUME
// ==========================================================

// ==========================================================
// LOAD SAVED RESUME
// ==========================================================

useEffect(() => {
  if (!id) return;

  async function loadSavedResume() {
    try {
      setIsGenerating(false);
      setError("");
      setSuccess("");

      const token = getToken();

      if (!token) {
        navigate("/");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/resumes/${id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      console.log("📥 Saved resume API response:", result);

      if (!response.ok) {
        throw new Error(
          result?.message ||
          result?.error ||
          "Failed to load saved resume"
        );
      }

      /*
       * Support all common backend response shapes:
       *
       * { data: resume }
       * { resume: resume }
       * resume
       */
      const rawResume =
        result?.data ||
        result?.resume ||
        result;

      if (!rawResume || typeof rawResume !== "object") {
        throw new Error(
          "Invalid resume data received from server."
        );
      }

      const savedResume =
        normalizeGeneratedResume(rawResume);

      console.log(
        "✅ Normalized saved resume:",
        savedResume
      );

      /*
       * Restore the saved template.
       */
      const savedTemplate =
        rawResume?.templateId ||
        rawResume?.template ||
        savedResume?.templateId ||
        "simple-ats";

      setSelectedTemplate(
        TEMPLATE_CONFIG[savedTemplate]
          ? savedTemplate
          : "simple-ats"
      );

      /*
       * Put the saved resume into state.
       */
      setGeneratedResume(savedResume);

      /*
       * IMPORTANT:
       * This tells the component that this is
       * a saved resume and not a new resume builder.
       */
      setShowEditor(true);

      /*
       * Restore form data.
       */
      setForm((previous) => ({
        ...previous,

        fullName:
          savedResume.fullName ||
          previous.fullName,

        email:
          savedResume.email ||
          previous.email,

        phone:
          savedResume.phone ||
          previous.phone,

        location:
          savedResume.location ||
          previous.location,

        linkedin:
          savedResume.linkedin ||
          previous.linkedin,

        github:
          savedResume.github ||
          previous.github,

        targetRole:
          savedResume.targetRole ||
          previous.targetRole,

        summary:
          savedResume.summary ||
          previous.summary,

        skills:
          Array.isArray(savedResume.skills)
            ? savedResume.skills.join(", ")
            : previous.skills,

experience:
  Array.isArray(savedResume.experience)
    ? savedResume.experience
        .map((item) =>
          [
            item.title || item.role || item.position || "",
            item.company || item.organization || "",
            item.date || item.dates || item.duration || "",
            ...(item.bullets || []),
            item.description || "",
          ]
            .filter(Boolean)
            .join(" ")
        )
        .filter(Boolean)
        .join("\n")
    : String(savedResume.experience || previous.experience),

projects:
  Array.isArray(savedResume.projects)
    ? savedResume.projects
        .map((item) =>
          [
            item.title || item.name || "",
            item.description || item.details || "",
            Array.isArray(item.technologies)
              ? item.technologies.join(", ")
              : item.technologies || "",
          ]
            .filter(Boolean)
            .join(" — ")
        )
        .filter(Boolean)
        .join("\n")
    : String(savedResume.projects || previous.projects),

education:
  Array.isArray(savedResume.education)
    ? savedResume.education
        .map((item) =>
          [
            item.degree || item.title || "",
            item.institution || item.school || item.university || "",
            item.date || item.dates || item.year || "",
          ]
            .filter(Boolean)
            .join(" — ")
        )
        .filter(Boolean)
        .join("\n")
    : String(savedResume.education || previous.education),
        certifications:
          Array.isArray(
            savedResume.certifications
          )
            ? savedResume.certifications.join("\n")
            : previous.certifications,

        achievements:
          Array.isArray(
            savedResume.achievements
          )
            ? savedResume.achievements.join("\n")
            : previous.achievements,
      }));

      /*
       * Keep local copy as well.
       */
      localStorage.setItem(
        "generatedResume",
        JSON.stringify(savedResume)
      );

      localStorage.setItem(
        "generatedResumeId",
        savedResume._id || id
      );

      console.log(
        "✅ Saved resume displayed successfully."
      );

      setSuccess(
        "Resume loaded successfully."
      );

    } catch (loadError) {
      console.error(
        "❌ Failed to load saved resume:",
        loadError
      );

      setGeneratedResume(null);
      setShowEditor(false);

      setError(
        loadError?.message ||
        "Failed to load saved resume."
      );
    }
  }

  loadSavedResume();
}, [id, navigate]);


  // ==========================================================
  // FORM UPDATE
  // ==========================================================

  const updateField = (
    field,
    value
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setError("");
    setSuccess("");
  };

  // ==========================================================
  // SOURCE DATA
  // ==========================================================

  const sourceData = useMemo(
    () => ({
      fullName:
        form.fullName.trim(),

      email:
        form.email.trim(),

      phone:
        form.phone.trim(),

      location:
        form.location.trim(),

      linkedin:
        form.linkedin.trim(),

      github:
        form.github.trim(),

      targetRole:
        form.targetRole.trim(),

      jobDescription:
        form.jobDescription.trim(),

      summary:
        form.summary.trim(),

      skills:
        splitList(form.skills),

      experience:
<<<<<<< HEAD
  uploaded?.experience?.length
    ? uploaded.experience
    : String(form.experience || "").trim(),

projects:
  uploaded?.projects?.length
    ? uploaded.projects
    : String(form.projects || "").trim(),

education:
  uploaded?.education?.length
    ? uploaded.education
    : String(form.education || "").trim(),

=======
        form.experience.trim(),

      projects:
        form.projects.trim(),

      education:
        form.education.trim(),
>>>>>>> 93f05e4 (Fix Gemini AI skill gap analysis)

      certifications:
        form.certifications.trim(),

      achievements:
        form.achievements.trim(),

      experienceLevel,

      student,

      preferences,

      template:
        selectedTemplate,

      templateId:
        selectedTemplate,
    }),
    [
      form,
      experienceLevel,
      student,
      preferences,
      selectedTemplate,
    ]
  );

  // ==========================================================
  // PREVIEW DATA
  // ==========================================================

  const livePreviewData = useMemo(() => {
    const base =
      generatedResume ||
      emptyResume;

    return {
      ...base,

      fullName:
        form.fullName.trim() ||
        base.fullName ||
        "Your Name",

      email:
        form.email.trim() ||
        base.email ||
        "email@example.com",

      phone:
        form.phone.trim() ||
        base.phone ||
        "",

      location:
        form.location.trim() ||
        base.location ||
        "",

      linkedin:
        form.linkedin.trim() ||
        base.linkedin ||
        "",

      github:
        form.github.trim() ||
        base.github ||
        "",

      targetRole:
        form.targetRole.trim() ||
        base.targetRole ||
        "Software Developer",

      summary:
        generatedResume?.summary ||
        form.summary.trim() ||
        "Your professional summary will appear here.",

      skills:
        generatedResume?.skills?.length
          ? generatedResume.skills
          : splitList(form.skills),

      experience:
        generatedResume?.experience ||
        [],

      projects:
        generatedResume?.projects ||
        [],

      education:
        generatedResume?.education ||
        [],

      certifications:
        generatedResume?.certifications ||
        [],

      achievements:
        generatedResume?.achievements ||
        [],
    };
  }, [
    generatedResume,
    form,
  ]);

  // ==========================================================
  // GENERATION PROGRESS
  // ==========================================================

  useEffect(() => {
    if (!isGenerating) {
      return;
    }

    const stages = [
      {
        progress: 8,
        message:
          "Preparing your information...",
      },
      {
        progress: 20,
        message:
          "Analyzing your experience...",
      },
      {
        progress: 34,
        message:
          "Understanding your target role...",
      },
      {
        progress: 48,
        message:
          "Creating your professional summary...",
      },
      {
        progress: 62,
        message:
          "Optimizing your skills...",
      },
      {
        progress: 75,
        message:
          "Improving your experience...",
      },
      {
        progress: 87,
        message:
          "Making your resume ATS-friendly...",
      },
      {
        progress: 94,
        message:
          "Polishing your final resume...",
      },
    ];

    const timers =
      stages.map(
        (stage, index) =>
          setTimeout(() => {
            setGenerationProgress(
              stage.progress
            );

            setGenerationMessage(
              stage.message
            );
          }, 700 + index * 1000)
      );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [isGenerating]);

  // ==========================================================
  // FRIENDLY ERROR
  // ==========================================================

  const showUserError = (
    title,
    message,
    allowRetry = true
  ) => {
    setErrorModalTitle(title);
    setErrorModalMessage(message);
    setErrorModalRetry(
      allowRetry
    );
    setShowErrorModal(true);
  };

  // ==========================================================
  // VALIDATION
  // ==========================================================

  const validateCurrentStep = () => {
    setError("");

    if (step === 1) {
      if (!experienceLevel) {
        setError(
          "Please select your experience level."
        );

        return false;
      }

      return true;
    }

    if (step === 2) {
      if (!student) {
        setError(
          "Please select an option."
        );

        return false;
      }

      return true;
    }

    if (step === 3) {
      if (
        student === "yes" &&
        !form.education.trim()
      ) {
        setError(
          "Please enter your education."
        );

        return false;
      }

      return true;
    }

    if (step === 4) {
      if (!resumeSource) {
        setError(
          "Please choose an option."
        );

        return false;
      }

      return true;
    }

    if (step === 5) {
      if (
        resumeSource === "existing" &&
        !uploadedFile
      ) {
        setError(
          "Please upload your existing resume."
        );

        return false;
      }

      return true;
    }

    if (step === 6) {
      if (!preferences.photo) {
        setError(
          "Please select a photo option."
        );

        return false;
      }

      return true;
    }

    if (step === 7) {
      if (!preferences.layout) {
        setError(
          "Please select a layout."
        );

        return false;
      }

      return true;
    }

    if (step === 8) {
      if (!preferences.style) {
        setError(
          "Please select a style."
        );

        return false;
      }

      return true;
    }

    if (step === 9) {
      if (!selectedTemplate) {
        setError(
          "Please select a template."
        );

        return false;
      }

      return true;
    }

    return true;
  };

  // ==========================================================
  // CONTINUE
  // ==========================================================

  const handleContinue = () => {
    if (!validateCurrentStep()) {
      return;
    }

    setError("");
    setSuccess("");

    if (step < 9) {
      setStep(
        (previous) =>
          previous + 1
      );
    } else {
      setShowEditor(true);
    }
  };

  // ==========================================================
  // BACK
  // ==========================================================

  const handleBack = () => {
    setError("");
    setSuccess("");

    if (showEditor) {
      setShowEditor(false);
      return;
    }

    if (step > 1) {
      setStep(
        (previous) =>
          previous - 1
      );
    } else {
      navigate("/home");
    }
  };

  // ==========================================================
  // UPLOAD
  // ==========================================================

  const handleUploadChange =
    async (event) => {
      const file =
        event.target.files?.[0];

      if (!file) return;

      setUploadedFile(file);
      setError("");
      setSuccess("");

      if (!isAuthed()) {
        showUserError(
          "Login Required",
          "Please log in before uploading your resume.",
          false
        );

        return;
      }

      try {
        const result =
          await API.uploadAts(file);

        setAtsResult(result);

        setSuccess(
          "Your resume was uploaded successfully."
        );
      } catch (err) {
        console.error(
          "Resume upload error:",
          err
        );

        showUserError(
          "Upload Failed",
          "We couldn't process this resume. Please check the file and try again.",
          true
        );
      }
    };

  // ==========================================================
  // GENERATE RESUME
  // ==========================================================

  const handleGenerate =
    async () => {
      setShowErrorModal(false);
      setError("");
      setSuccess("");

      if (!isAuthed()) {
        showUserError(
          "Login Required",
          "Please log in to your account before generating your resume.",
          false
        );

        return;
      }

      if (!form.fullName.trim()) {
        showUserError(
          "Full Name Required",
          "Please enter your full name before generating your resume."
        );

        return;
      }

      if (!form.email.trim()) {
        showUserError(
          "Email Required",
          "Please enter your email address before generating your resume."
        );

        return;
      }

      if (!form.targetRole.trim()) {
        showUserError(
          "Target Role Required",
          "Please enter the job role you are applying for. Gemini will use this role to tailor your resume."
        );

        return;
      }

      setIsGenerating(true);

      setGenerationProgress(5);

      setGenerationAttempt(1);

      setGenerationMessage(
        "Preparing your resume..."
      );

      const MAX_ATTEMPTS = 3;

      let lastError = null;

      try {
        for (
          let attempt = 1;
          attempt <= MAX_ATTEMPTS;
          attempt++
        ) {
          setGenerationAttempt(
            attempt
          );

          try {
            if (attempt > 1) {
              setGenerationProgress(
                15
              );

              setGenerationMessage(
                "AI is temporarily busy. Retrying automatically..."
              );

              await new Promise(
                (resolve) =>
                  setTimeout(
                    resolve,
                    1800
                  )
              );
            }

            const controller =
              new AbortController();

            const timeout =
              setTimeout(() => {
                controller.abort();
              }, 60000);

            let response;

            try {
              response =
                await fetch(
                  `${API_URL}/api/ai/generate`,
                  {
                    method: "POST",

                    headers: {
                      "Content-Type":
                        "application/json",

                      Authorization:
                        `Bearer ${getToken()}`,
                    },

                    body: JSON.stringify({
                      data: sourceData,
                      resumeId,
                    }),

                    signal:
                      controller.signal,
                  }
                );
            } finally {
              clearTimeout(
                timeout
              );
            }

            let result = {};

            try {
              result =
                await response.json();
            } catch {
              result = {};
            }

            if (
              response.status === 503
            ) {
              lastError =
                new Error(
                  "AI_SERVICE_BUSY"
                );

              console.error(
                "Gemini service unavailable:",
                result
              );

              if (
                attempt <
                MAX_ATTEMPTS
              ) {
                setGenerationProgress(
                  18
                );

                setGenerationMessage(
                  "AI is receiving many requests. Retrying..."
                );

                continue;
              }

              throw lastError;
            }

            if (!response.ok) {
              console.error(
                "AI generation response:",
                result
              );

              const backendError = new Error(
                result?.message ||
                  result?.error ||
                  `AI generation failed with status ${response.status}.`
              );

              backendError.status = response.status;
              backendError.code = result?.code;
              throw backendError;
            }

            if (!result?.resume) {
              throw new Error(
                "INVALID_AI_RESPONSE"
              );
            }

            if (result?.resumeId) {
              setResumeId(result.resumeId);
            }

            setGenerationProgress(
              97
            );

            setGenerationMessage(
              "Finalizing your resume..."
            );

            const normalized =
              normalizeGeneratedResume(
                result
              );

            const finalResume = {
              ...normalized,

              fullName:
                form.fullName.trim() ||
                normalized.fullName,

              email:
                form.email.trim() ||
                normalized.email,

              phone:
                form.phone.trim() ||
                normalized.phone,

              location:
                form.location.trim() ||
                normalized.location,

              linkedin:
                form.linkedin.trim() ||
                normalized.linkedin,

              github:
                form.github.trim() ||
                normalized.github,

              targetRole:
                form.targetRole.trim() ||
                normalized.targetRole,

              skills:
                normalized.skills || [],

              experience:
                normalizeExperience(
                  normalized.experience
                ),

              projects:
                normalizeProjects(
                  normalized.projects
                ),

              education:
                normalizeEducation(
                  normalized.education
                ),

              certifications:
                normalizeSimpleItems(
                  normalized.certifications
                ),

              achievements:
                normalizeSimpleItems(
                  normalized.achievements
                ),

              template:
                selectedTemplate,

              templateId:
                selectedTemplate,

              templateName:
                TEMPLATE_CONFIG[
                  selectedTemplate
                ]?.name ||
                selectedTemplate,
            };

            localStorage.setItem(
              "generatedResume",
              JSON.stringify(
                finalResume
              )
            );

            localStorage.setItem(
              "selectedResumeTemplate",
              selectedTemplate
            );

            setGenerationProgress(
              100
            );

            setGenerationMessage(
              "Your resume is ready!"
            );

            await new Promise(
              (resolve) =>
                setTimeout(
                  resolve,
                  1000
                )
            );

            setGeneratedResume(
              finalResume
            );

<<<<<<< HEAD
            // --------------------------------------------------------
            // SAVE GENERATED RESUME TO THE LOGGED-IN USER'S ACCOUNT
            // --------------------------------------------------------
            // Keep the existing generation/preview flow intact, but
            // persist the generated resume in MongoDB as well.
            try {
              const saveResponse = await fetch(
                `${API_URL}/api/resumes`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getToken()}`,
                  },
                  body: JSON.stringify({
                    title:
                      `${finalResume.fullName || "My"}'s Resume`,
                    templateId:
                      finalResume.templateId ||
                      selectedTemplate ||
                      "simple-ats",
                    data: finalResume,
                  }),
                }
              );

              const saveResult =
                await saveResponse.json().catch(() => ({}));

              if (!saveResponse.ok) {
                console.warn(
                  "Resume generated successfully, but could not be saved to the account:",
                  saveResult
                );
                setSuccess(
                  "Your resume has been generated successfully. It was not saved to My Resumes."
                );
              } else {
                // Keep the database id available locally without
                // changing the existing generated-resume structure.
              if (saveResult?._id) {
  localStorage.setItem("generatedResumeId", saveResult._id);
}

// Refresh "My Resumes" page/list immediately
window.dispatchEvent(new CustomEvent("resumes:changed"));

setSuccess("Your resume has been generated and saved to My Resumes.");
              
              }
            } catch (saveError) {
              // Saving must never make an otherwise successful AI
              // generation fail.
              console.warn(
                "Resume save error:",
                saveError
              );
              setSuccess(
                "Your resume has been generated successfully. It could not be saved to My Resumes right now."
              );
            }
=======
            try {
              window.dispatchEvent(
                new CustomEvent("resumes:changed")
              );
            } catch {
              // Ignore browser event errors.
            }

            setSuccess(
              "Your resume has been generated successfully."
            );
>>>>>>> 93f05e4 (Fix Gemini AI skill gap analysis)

            setIsGenerating(false);

            return;
          } catch (requestError) {
            lastError =
              requestError;

            console.error(
              `Generation attempt ${attempt}:`,
              requestError
            );

            if (
              requestError?.message ===
                "AI_SERVICE_BUSY" &&
              attempt <
                MAX_ATTEMPTS
            ) {
              continue;
            }

            throw requestError;
          }
        }

        throw (
          lastError ||
          new Error(
            "AI_GENERATION_FAILED"
          )
        );
      } catch (err) {
        console.error(
          "Final resume generation error:",
          err
        );

        setIsGenerating(false);

        setGenerationProgress(
          0
        );

        if (
          err?.name ===
          "AbortError"
        ) {
          showUserError(
            "Generation Took Too Long",
            "The AI is taking longer than expected. Your information is safe. Please try generating your resume again.",
            true
          );

          return;
        }

        if (
          err?.code === "GEMINI_QUOTA" ||
          err?.status === 429
        ) {
          showUserError(
            "AI Quota Reached",
            err?.message ||
              "Gemini API quota has been reached. Please try again after the quota resets.",
            false
          );
          return;
        }

        if (
          err?.code === "GEMINI_AUTH" ||
          err?.status === 401
        ) {
          showUserError(
            "AI Authentication Error",
            err?.message ||
              "Gemini API authentication failed. Please check the backend API configuration.",
            false
          );
          return;
        }

        if (
          err?.message ===
          "AI_SERVICE_BUSY"
        ) {
          showUserError(
            "AI Is Temporarily Busy",
            "Our AI service is currently receiving a high number of requests. Please wait a moment and try again.",
            true
          );

          return;
        }

        if (
          err?.message ===
          "INVALID_AI_RESPONSE"
        ) {
          showUserError(
            "Resume Could Not Be Created",
            "The AI didn't return a complete resume. Please try generating it again.",
            true
          );

          return;
        }

        showUserError(
          "Unable to Generate Resume",
          "We couldn't create your resume right now. Please try again in a moment.",
          true
        );
      }
    };

  // ==========================================================
  // PDF GENERATION
  // ==========================================================

<<<<<<< HEAD
const downloadPDF = async () => {
  try {
    const resumeElement = document.getElementById(
      "generated-resume-document"
    );
=======
  const downloadPDF = async () => {
    let pdfContainer = null;

    try {
      const resumeElement =
        document.getElementById(
          "generated-resume-document"
        );
>>>>>>> 93f05e4 (Fix Gemini AI skill gap analysis)

    if (!resumeElement) {
      showUserError(
        "PDF Could Not Be Created",
        "Resume preview was not found. Please generate your resume again.",
        true
      );
      return;
    }

    setSuccess("Creating your PDF...");

    await new Promise((resolve) =>
      setTimeout(resolve, 500)
    );

<<<<<<< HEAD
 const canvas = await html2canvas(resumeElement, {
  scale: 2,
  useCORS: true,
  allowTaint: false,
  backgroundColor: "#ffffff",
  logging: false,
  imageTimeout: 30000,
  scrollX: 0,
  scrollY: 0,
  width: resumeElement.scrollWidth,
  height: resumeElement.scrollHeight,
  windowWidth: resumeElement.scrollWidth,
  windowHeight: resumeElement.scrollHeight,
});

    if (
      !canvas.width ||
      !canvas.height
    ) {
      throw new Error(
        "Resume could not be rendered."
      );
    }

    const imgData =
      canvas.toDataURL(
        "image/jpeg",
        0.95
      );

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pageWidth = 210;
    const pageHeight = 297;

    const imgWidth = pageWidth;
=======
      // ----------------------------------------------------------
      // Wait for the latest React render to finish.
      // ----------------------------------------------------------

      await new Promise((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(resolve)
        )
      );

      // ----------------------------------------------------------
      // OKLCH -> sRGB conversion.
      //
      // html2canvas may fail when it encounters modern CSS colors
      // such as oklch(...). We convert those colors ONLY inside the
      // temporary PDF clone. The normal application UI is untouched.
      // ----------------------------------------------------------

      const clamp = (value, min = 0, max = 1) =>
        Math.min(max, Math.max(min, value));

      const parseCssNumber = (value, scale = 1) => {
        const text = String(value).trim();

        if (text.endsWith("%")) {
          return (
            (parseFloat(text) / 100) *
            scale
          );
        }

        return parseFloat(text);
      };

      const parseAngle = (value) => {
        const text = String(value)
          .trim()
          .toLowerCase();

        const number = parseFloat(text);

        if (text.endsWith("turn")) {
          return number * 360;
        }

        if (text.endsWith("rad")) {
          return number * (180 / Math.PI);
        }

        if (text.endsWith("grad")) {
          return number * 0.9;
        }

        return number;
      };

      const parseColorAlpha = (value) => {
        if (value == null) {
          return 1;
        }

        const text = String(value).trim();

        if (!text) {
          return 1;
        }

        if (text.endsWith("%")) {
          return clamp(
            parseFloat(text) / 100
          );
        }

        return clamp(parseFloat(text));
      };

      const oklabToLinearSrgb = (
        L,
        a,
        b
      ) => {
        const l_ =
          L +
          0.3963377774 * a +
          0.2158037573 * b;

        const m_ =
          L -
          0.1055613458 * a -
          0.0638541728 * b;

        const s_ =
          L -
          0.0894841775 * a -
          1.291485548 * b;

        const l = l_ * l_ * l_;
        const m = m_ * m_ * m_;
        const s = s_ * s_ * s_;

        return {
          r:
            4.0767416621 * l -
            3.3077115913 * m +
            0.2309699292 * s,
          g:
            -1.2684380046 * l +
            2.6097574011 * m -
            0.3413193965 * s,
          b:
            -0.0041960863 * l -
            0.7034186147 * m +
            1.707614701 * s,
        };
      };

      const linearToSrgb = (value) => {
        const v = clamp(value);

        if (v <= 0.0031308) {
          return 12.92 * v;
        }

        return (
          1.055 *
            Math.pow(v, 1 / 2.4) -
          0.055
        );
      };

      const oklchToRgb = (
        lightness,
        chroma,
        hue,
        alpha = 1
      ) => {
        const L = clamp(
          lightness
        );

        const C = Math.max(
          0,
          chroma
        );

        const radians =
          (hue * Math.PI) / 180;

        const a =
          C * Math.cos(radians);

        const b =
          C * Math.sin(radians);

        const linear =
          oklabToLinearSrgb(
            L,
            a,
            b
          );

        const r = Math.round(
          clamp(
            linearToSrgb(
              linear.r
            )
          ) * 255
        );

        const g = Math.round(
          clamp(
            linearToSrgb(
              linear.g
            )
          ) * 255
        );

        const blue = Math.round(
          clamp(
            linearToSrgb(
              linear.b
            )
          ) * 255
        );

        if (alpha >= 0.999) {
          return `rgb(${r}, ${g}, ${blue})`;
        }

        return `rgba(${r}, ${g}, ${blue}, ${clamp(alpha)})`;
      };

      const convertSingleOklch = (
        value
      ) => {
        const text = String(value).trim();

        const match = text.match(
          /^oklch\(\s*([^\s]+)\s+([^\s]+)\s+([^\s]+)(?:\s*\/\s*([^\s]+))?\s*\)$/i
        );

        if (!match) {
          return null;
        }

        let L = parseCssNumber(
          match[1],
          1
        );

        let C = parseCssNumber(
          match[2],
          0.4
        );

        const H = parseAngle(
          match[3]
        );

        const A =
          match[4] == null
            ? 1
            : parseColorAlpha(
                match[4]
              );

        // CSS OKLCH lightness is normally 0..1.
        // Clamp out-of-range values for PDF rendering.
        L = clamp(L);

        // Chroma is commonly expressed as a raw value.
        // Percentage chroma is mapped to the CSS 0.4 range.
        if (
          String(match[2])
            .trim()
            .endsWith("%")
        ) {
          C = clamp(C, 0, 0.4);
        }

        return oklchToRgb(
          L,
          C,
          H,
          A
        );
      };

      const convertOklchFunctions = (
        value
      ) => {
        if (
          typeof value !== "string" ||
          !/oklch\(/i.test(value)
        ) {
          return value;
        }

        return value.replace(
          /oklch\(\s*[^)]*\)/gi,
          (match) => {
            try {
              return (
                convertSingleOklch(
                  match
                ) || "rgb(0, 0, 0)"
              );
            } catch (error) {
              console.warn(
                "Could not convert OKLCH color:",
                match,
                error
              );

              return "rgb(0, 0, 0)";
            }
          }
        );
      };

      // ----------------------------------------------------------
      // Clone the resume into an isolated fixed-width container.
      // ----------------------------------------------------------

      pdfContainer =
        document.createElement("div");

      pdfContainer.style.position =
        "fixed";
      pdfContainer.style.left =
        "-100000px";
      pdfContainer.style.top = "0";
      pdfContainer.style.width =
        "794px";
      pdfContainer.style.minWidth =
        "794px";
      pdfContainer.style.background =
        "#ffffff";
      pdfContainer.style.zIndex =
        "-999999";
      pdfContainer.style.overflow =
        "visible";
      pdfContainer.style.pointerEvents =
        "none";

      const clonedResume =
        resumeElement.cloneNode(true);

      clonedResume.style.width =
        "794px";
      clonedResume.style.minWidth =
        "794px";
      clonedResume.style.maxWidth =
        "794px";
      clonedResume.style.background =
        "#ffffff";
      clonedResume.style.margin = "0";
      clonedResume.style.padding = "0";
      clonedResume.style.overflow =
        "visible";

      pdfContainer.appendChild(
        clonedResume
      );

      document.body.appendChild(
        pdfContainer
      );

      // ----------------------------------------------------------
      // Replace OKLCH in cloned inline styles.
      // ----------------------------------------------------------

      const clonedInlineElements =
        clonedResume.querySelectorAll(
          "*"
        );

      clonedInlineElements.forEach(
        (element) => {
          try {
            if (
              element.hasAttribute(
                "style"
              )
            ) {
              const styleText =
                element.getAttribute(
                  "style"
                );

              const converted =
                convertOklchFunctions(
                  styleText
                );

              if (
                converted !==
                styleText
              ) {
                element.setAttribute(
                  "style",
                  converted
                );
              }
            }
          } catch (error) {
            console.warn(
              "Could not process cloned inline style:",
              error
            );
          }
        }
      );

      // ----------------------------------------------------------
      // Wait for fonts and images.
      // ----------------------------------------------------------

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      const images =
        clonedResume.querySelectorAll(
          "img"
        );

      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete) {
                resolve();
                return;
              }

              img.onload = resolve;
              img.onerror = resolve;

              setTimeout(
                resolve,
                5000
              );
            })
        )
      );

      await new Promise((resolve) =>
        setTimeout(resolve, 400)
      );

      // ----------------------------------------------------------
      // Generate the canvas.
      //
      // The important part is onclone(): html2canvas gets its own
      // cloned document, so we remove modern color functions there
      // before html2canvas parses the CSS.
      // ----------------------------------------------------------

      const canvas =
        await html2canvas(
          clonedResume,
          {
            scale: 2,
            useCORS: true,
            allowTaint: false,
            backgroundColor:
              "#ffffff",
            logging: false,
            imageTimeout: 15000,
            scrollX: 0,
            scrollY: 0,
            width: Math.max(
              clonedResume.scrollWidth,
              794
            ),
            height: Math.max(
              clonedResume.scrollHeight,
              1123
            ),
            windowWidth: 794,
            windowHeight: Math.max(
              clonedResume.scrollHeight,
              1123
            ),
            onclone: (
              clonedDocument
            ) => {
              try {
                // ------------------------------------------------
                // Convert all <style> blocks.
                // ------------------------------------------------

                const styleTags =
                  clonedDocument.querySelectorAll(
                    "style"
                  );

                styleTags.forEach(
                  (styleTag) => {
                    try {
                      styleTag.textContent =
                        convertOklchFunctions(
                          styleTag.textContent ||
                            ""
                        );
                    } catch (error) {
                      console.warn(
                        "Could not process cloned style tag:",
                        error
                      );
                    }
                  }
                );

                // ------------------------------------------------
                // Convert inline styles in html2canvas's clone.
                // ------------------------------------------------

                const allElements =
                  clonedDocument.querySelectorAll(
                    "*"
                  );

                allElements.forEach(
                  (element) => {
                    try {
                      if (
                        element.hasAttribute(
                          "style"
                        )
                      ) {
                        const original =
                          element.getAttribute(
                            "style"
                          );

                        const converted =
                          convertOklchFunctions(
                            original
                          );

                        if (
                          converted !==
                          original
                        ) {
                          element.setAttribute(
                            "style",
                            converted
                          );
                        }
                      }
                    } catch (error) {
                      console.warn(
                        "Could not process html2canvas element:",
                        error
                      );
                    }
                  }
                );

                // ------------------------------------------------
                // Replace CSS variables containing OKLCH.
                // ------------------------------------------------

                const root =
                  clonedDocument.documentElement;

                if (root) {
                  const rootStyle =
                    clonedDocument.defaultView?.getComputedStyle(
                      root
                    );

                  if (rootStyle) {
                    for (
                      let i = 0;
                      i < rootStyle.length;
                      i++
                    ) {
                      const property =
                        rootStyle[i];

                      if (
                        !property.startsWith(
                          "--"
                        )
                      ) {
                        continue;
                      }

                      const value =
                        rootStyle.getPropertyValue(
                          property
                        );

                      if (
                        /oklch\(/i.test(
                          value
                        )
                      ) {
                        root.style.setProperty(
                          property,
                          convertOklchFunctions(
                            value
                          )
                        );
                      }
                    }
                  }
                }

                // ------------------------------------------------
                // Force a stable A4-width capture.
                // ------------------------------------------------

                const clonedResumeElement =
                  clonedDocument.getElementById(
                    "generated-resume-document"
                  );

                if (
                  clonedResumeElement
                ) {
                  clonedResumeElement.style.width =
                    "794px";
                  clonedResumeElement.style.minWidth =
                    "794px";
                  clonedResumeElement.style.maxWidth =
                    "794px";
                  clonedResumeElement.style.background =
                    "#ffffff";
                }

                // ------------------------------------------------
                // Disable animations/transitions and make the PDF
                // capture independent of the current UI theme.
                // ------------------------------------------------

                const pdfStyle =
                  clonedDocument.createElement(
                    "style"
                  );

                pdfStyle.textContent = `
                  *,
                  *::before,
                  *::after {
                    animation: none !important;
                    transition: none !important;
                    caret-color: transparent !important;
                  }

                  html,
                  body {
                    margin: 0 !important;
                    padding: 0 !important;
                    background: #ffffff !important;
                  }

                  #generated-resume-document {
                    width: 794px !important;
                    min-width: 794px !important;
                    max-width: 794px !important;
                    background: #ffffff !important;
                  }
                `;

                clonedDocument.head.appendChild(
                  pdfStyle
                );
              } catch (error) {
                console.warn(
                  "html2canvas clone processing warning:",
                  error
                );
              }
            },
          }
        );

      if (
        !canvas ||
        !canvas.width ||
        !canvas.height
      ) {
        throw new Error(
          "The resume could not be rendered for PDF creation."
        );
      }

      // ----------------------------------------------------------
      // Convert canvas to JPEG.
      // ----------------------------------------------------------

      const imgData =
        canvas.toDataURL(
          "image/jpeg",
          0.95
        );

      if (
        !imgData ||
        imgData === "data:,"
      ) {
        throw new Error(
          "The generated PDF image was empty."
        );
      }

      // ----------------------------------------------------------
      // Create A4 PDF.
      // ----------------------------------------------------------

      const pdf =
        new jsPDF({
          orientation:
            "portrait",
          unit: "mm",
          format: "a4",
          compress: true,
        });
>>>>>>> 93f05e4 (Fix Gemini AI skill gap analysis)

    const imgHeight =
      (canvas.height * imgWidth) /
      canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(
      imgData,
      "JPEG",
      0,
      position,
      imgWidth,
      imgHeight,
      undefined,
      "FAST"
    );

    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position =
        heightLeft - imgHeight;

      pdf.addPage();

<<<<<<< HEAD
=======
      // ----------------------------------------------------------
      // First page.
      // ----------------------------------------------------------

>>>>>>> 93f05e4 (Fix Gemini AI skill gap analysis)
      pdf.addImage(
        imgData,
        "JPEG",
        0,
        position,
        imgWidth,
        imgHeight,
        undefined,
        "FAST"
      );

<<<<<<< HEAD
      heightLeft -= pageHeight;
=======
      heightLeft -=
        pageHeight;

      // ----------------------------------------------------------
      // Additional pages.
      // ----------------------------------------------------------

      while (
        heightLeft > 0
      ) {
        position =
          heightLeft -
          imgHeight;

        pdf.addPage();

        pdf.addImage(
          imgData,
          "JPEG",
          0,
          position,
          imgWidth,
          imgHeight,
          undefined,
          "FAST"
        );

        heightLeft -=
          pageHeight;
      }

      // ----------------------------------------------------------
      // Safe filename.
      // ----------------------------------------------------------

      const safeName =
        (
          livePreviewData?.fullName ||
          form?.fullName ||
          "resume"
        )
          .replace(
            /[^a-z0-9]+/gi,
            "_"
          )
          .replace(
            /^_+|_+$/g,
            "");

      pdf.save(
        `${
          safeName ||
          "resume"
        }_resume.pdf`
      );

      // ----------------------------------------------------------
      // Cleanup.
      // ----------------------------------------------------------

      if (pdfContainer) {
        pdfContainer.remove();
        pdfContainer = null;
      }
    } catch (err) {
      console.error(
        "=========================================="
      );
      console.error(
        "❌ PDF GENERATION ERROR"
      );
      console.error(
        "=========================================="
      );
      console.error(
        "Error:",
        err
      );
      console.error(
        "Message:",
        err?.message
      );
      console.error(
        "Stack:",
        err?.stack
      );

      if (pdfContainer) {
        try {
          pdfContainer.remove();
        } catch {
          // Ignore cleanup errors.
        }
      }

      showUserError(
        "PDF Could Not Be Created",
        err?.message
          ? `PDF generation failed: ${err.message}`
          : "We couldn't create the PDF right now. Please try again.",
        true
      );
>>>>>>> 93f05e4 (Fix Gemini AI skill gap analysis)
    }

    const safeName = (
      livePreviewData?.fullName ||
      form?.fullName ||
      "resume"
    )
      .replace(
        /[^a-z0-9]+/gi,
        "_"
      )
      .replace(
        /^_+|_+$/g,
        "");

    const fileName =
      `${safeName || "resume"}_resume.pdf`;

    const pdfBlob =
      pdf.output("blob");

    const blobUrl =
      URL.createObjectURL(
        pdfBlob
      );

    const link =
      document.createElement("a");

    link.href = blobUrl;
    link.download = fileName;
    link.style.display = "none";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    setTimeout(() => {
      URL.revokeObjectURL(
        blobUrl
      );
    }, 1000);

    setSuccess(
      "✓ Resume PDF downloaded successfully."
    );
  } catch (err) {
    console.error(
      "PDF generation error:",
      err
    );

    showUserError(
      "PDF Could Not Be Created",
      err?.message ||
        "We couldn't create the PDF right now. Please try again.",
      true
    );
  }
};

  // ==========================================================
  // BROWSER PREVIEW
  // ==========================================================

  const openResumePreview =
    (data) => {
      const escapeHtml =
        (value) =>
          String(value || "")
            .replace(
              /&/g,
              "&amp;"
            )
            .replace(
              /</g,
              "&lt;"
            )
            .replace(
              />/g,
              "&gt;"
            )
            .replace(
              /"/g,
              "&quot;"
            )
            .replace(
              /'/g,
              "&#039;"
            );

      const config =
        TEMPLATE_CONFIG[
          selectedTemplate
        ] ||
        TEMPLATE_CONFIG[
          "simple-ats"
        ];

      const darkTemplate =
        [
          "creative-bold",
          "gradient-modern",
          "marketing-creative",
          "animated-modern",
          "tech-developer",
        ].includes(
          selectedTemplate
        );

      const bulletHtml =
        (items) => {
          const bullets =
            normalizeBullets(
              items
            );

          if (
            !bullets.length
          ) {
            return "";
          }

          return `
            <ul>
              ${bullets
                .map(
                  (bullet) =>
                    `<li>${escapeHtml(
                      bullet
                    )}</li>`
                )
                .join("")}
            </ul>
          `;
        };

      const experienceHtml =
        Array.isArray(
          data.experience
        )
          ? data.experience
              .map(
                (item) => `
                  <div class="item">

                    <h3>
                      ${escapeHtml(
                        item.title ||
                          item.role ||
                          item.position ||
                          "Professional Experience"
                      )}
                    </h3>

                    <div class="meta">
                      ${escapeHtml(
                        [
                          item.company ||
                            item.organization ||
                            "",
                          item.location ||
                            "",
                          item.date ||
                            "",
                        ]
                          .filter(Boolean)
                          .join(" | ")
                      )}
                    </div>

                    ${
                      bulletHtml(
                        item.bullets
                      ) ||
                      `<p>
                        ${escapeHtml(
                          toText(
                            item.description ||
                              item.details ||
                              item.content ||
                              ""
                          )
                        )}
                      </p>`
                    }

                  </div>
                `
              )
              .join("")
          : "";

      const projectsHtml =
        Array.isArray(
          data.projects
        )
          ? data.projects
              .map(
                (item) => `
                  <div class="item">

                    <h3>
                      ${escapeHtml(
                        item.title ||
                          item.name ||
                          "Project"
                      )}
                    </h3>

                    ${
                      item.technologies
                        ? `
                          <div class="meta">
                            Technologies: ${escapeHtml(
                              toText(
                                item.technologies
                              )
                            )}
                          </div>
                        `
                        : ""
                    }

                    ${
                      bulletHtml(
                        item.bullets
                      ) ||
                      `<p>
                        ${escapeHtml(
                          toText(
                            item.description ||
                              item.details ||
                              item.content ||
                              ""
                          )
                        )}
                      </p>`
                    }

                  </div>
                `
              )
              .join("")
          : "";

      const educationHtml =
        Array.isArray(
          data.education
        )
          ? data.education
              .map(
                (item) => `
                  <div class="item">

                    <h3>
                      ${escapeHtml(
                        item.degree ||
                          item.title ||
                          item.course ||
                          "Education"
                      )}
                    </h3>

                    <div class="meta">
                      ${escapeHtml(
                        [
                          item.institution ||
                            item.school ||
                            item.university ||
                            "",
                          item.date ||
                            "",
                        ]
                          .filter(Boolean)
                          .join(" | ")
                      )}
                    </div>

                    ${
                      item.description
                        ? `
                          <p>
                            ${escapeHtml(
                              item.description
                            )}
                          </p>
                        `
                        : ""
                    }

                  </div>
                `
              )
              .join("")
          : "";

      const skillsHtml =
        Array.isArray(
          data.skills
        )
          ? data.skills
              .map(
                (skill) =>
                  `<span>${escapeHtml(
                    skill
                  )}</span>`
              )
              .join("")
          : "";

      const listHtml =
        (items) =>
          Array.isArray(
            items
          )
            ? items
                .map(
                  (item) =>
                    `<li>${escapeHtml(
                      toText(item)
                    )}</li>`
                )
                .join("")
            : "";

      const type =
        config.type;

      let pageClass =
        `page template-${type}`;

      if (
        selectedTemplate ===
        "two-column"
      ) {
        pageClass +=
          " actual-two-column";
      }

      const win =
        window.open(
          "",
          "_blank"
        );

      if (!win) {
        showUserError(
          "Preview Blocked",
          "Your browser blocked the preview window. Please allow pop-ups for this website.",
          false
        );

        return;
      }

      win.document.write(`
        <!DOCTYPE html>

        <html>
          <head>

            <title>
              ${escapeHtml(
                data.fullName ||
                  "Resume"
              )}
            </title>

            <meta
              name="viewport"
              content="width=device-width, initial-scale=1"
            />

            <style>

              * {
                box-sizing: border-box;
              }

              body {
                margin: 0;
                background: #eef0f5;
                color: #172033;
                font-family:
                  Arial,
                  Helvetica,
                  sans-serif;
              }

              .page {
                width: 210mm;
                min-height: 297mm;
                margin: 30px auto;
                padding: 18mm;
                background: white;
                box-shadow:
                  0 15px 50px
                  rgba(0,0,0,.15);
                position: relative;
                overflow: hidden;
              }

              h1 {
                margin: 0;
                font-size: 30px;
                line-height: 1.15;
              }

              .role {
                margin-top: 7px;
                color: ${config.accent};
                font-size: 14px;
                font-weight: 700;
              }

              .contact {
                margin-top: 12px;
                color: #667085;
                font-size: 11px;
                line-height: 1.7;
              }

              .section {
                margin-top: 24px;
              }

              .section-title {
                margin-bottom: 10px;
                padding-bottom: 6px;
                border-bottom:
                  2px solid ${config.accent};
                color: ${config.accent};
                font-size: 12px;
                font-weight: 800;
                letter-spacing: .12em;
              }

              p {
                margin: 0;
                line-height: 1.65;
                font-size: 12px;
              }

              .item {
                margin-bottom: 16px;
              }

              .item h3 {
                margin: 0 0 4px;
                font-size: 13px;
                line-height: 1.4;
              }

              .meta {
                color: #667085;
                font-size: 11px;
                margin-bottom: 6px;
              }

              ul {
                margin:
                  5px 0 0 0;
                padding-left: 18px;
                line-height: 1.65;
                font-size: 12px;
              }

              li {
                margin-bottom: 3px;
              }

              .skills {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
              }

              .skills span {
                padding:
                  5px 9px;
                border-radius: 6px;
                background:
                  ${config.accent}18;
                color:
                  ${config.accent};
                font-size: 10px;
                font-weight: 700;
              }

              /* ==========================================
                 MODERN
                 ========================================== */

              .template-modern .page {
                border-top:
                  7px solid ${config.accent};
              }

              .template-modern h1 {
                letter-spacing: -0.04em;
              }

              /* ==========================================
                 CLASSIC
                 ========================================== */

              .template-classic .page {
                border-top:
                  12px solid #1e293b;
              }

              .template-classic .section-title {
                color: #1e293b;
                border-bottom:
                  1px solid #1e293b;
              }

              .template-classic h1 {
                font-family:
                  Georgia,
                  "Times New Roman",
                  serif;
              }

              /* ==========================================
                 MINIMAL
                 ========================================== */

              .template-minimal .page {
                border-top:
                  2px solid #94a3b8;
              }

              .template-minimal .section-title {
                border-bottom:
                  1px solid #cbd5e1;
                color: #475569;
              }

              .template-minimal .skills span {
                background:
                  #f1f5f9;
                color:
                  #475569;
                border-radius: 3px;
              }

              /* ==========================================
                 ATS
                 ========================================== */

              .template-ats .page {
                box-shadow: none;
                border:
                  1px solid #e5e7eb;
              }

              .template-ats .section-title {
                color: #111827;
                border-bottom:
                  1px solid #111827;
              }

              .template-ats .skills span {
                background: white;
                border:
                  1px solid #d1d5db;
                color: #111827;
              }

              /* ==========================================
                 EXECUTIVE
                 ========================================== */

              .template-executive .page {
                border-left:
                  14px solid #0f172a;
              }

              .template-executive h1 {
                font-family:
                  Georgia,
                  "Times New Roman",
                  serif;
              }

              .template-executive .section-title {
                color: #0f172a;
                border-bottom:
                  1px solid #0f172a;
              }

              /* ==========================================
                 CREATIVE
                 ========================================== */

              .template-creative .page,
              .template-gradient .page,
              .template-marketing .page,
              .template-animated .page {
                color: white;
                background:
                  linear-gradient(
                    135deg,
                    ${config.accent},
                    #4f46e5,
                    #9333ea
                  );
              }

              .template-creative .role,
              .template-gradient .role,
              .template-marketing .role,
              .template-animated .role {
                color: white;
                opacity: .85;
              }

              .template-creative .contact,
              .template-gradient .contact,
              .template-marketing .contact,
              .template-animated .contact,
              .template-creative .meta,
              .template-gradient .meta,
              .template-marketing .meta,
              .template-animated .meta {
                color: rgba(255,255,255,.65);
              }

              .template-creative .section-title,
              .template-gradient .section-title,
              .template-marketing .section-title,
              .template-animated .section-title {
                color: white;
                border-bottom:
                  1px solid rgba(255,255,255,.45);
              }

              .template-creative .skills span,
              .template-gradient .skills span,
              .template-marketing .skills span,
              .template-animated .skills span {
                color: white;
                background:
                  rgba(255,255,255,.15);
                border:
                  1px solid rgba(255,255,255,.25);
              }

              /* ==========================================
                 TECH
                 ========================================== */

              .template-tech .page {
                background:
                  #0f172a;
                color:
                  #e2e8f0;
                border-left:
                  8px solid #22c55e;
              }

              .template-tech .role {
                color:
                  #22c55e;
              }

              .template-tech .contact,
              .template-tech .meta {
                color:
                  #94a3b8;
              }

              .template-tech .section-title {
                color:
                  #22c55e;
                border-bottom:
                  1px solid #22c55e;
              }

              .template-tech .skills span {
                color:
                  #22c55e;
                background:
                  rgba(34,197,94,.08);
                border:
                  1px solid rgba(34,197,94,.3);
              }

              /* ==========================================
                 ACADEMIC
                 ========================================== */

              .template-academic .page {
                font-family:
                  Georgia,
                  "Times New Roman",
                  serif;
              }

              .template-academic .section-title {
                color:
                  #6d28d9;
                border-bottom:
                  1px solid #6d28d9;
              }

              /* ==========================================
                 ELEGANT
                 ========================================== */

              .template-elegant .page {
                background:
                  #fffaf7;
                border-left:
                  9px solid #be123c;
              }

              .template-elegant h1 {
                font-family:
                  Georgia,
                  "Times New Roman",
                  serif;
                font-weight: 500;
              }

              .template-elegant .role,
              .template-elegant .section-title {
                color:
                  #be123c;
              }

              .template-elegant .section-title {
                border-bottom:
                  1px solid #be123c;
              }

              /* ==========================================
                 COLORFUL
                 ========================================== */

              .template-colorful .page {
                border-top:
                  10px solid #ec4899;
              }

              .template-colorful .section-title {
                color:
                  #ec4899;
                border-bottom:
                  3px solid #f59e0b;
              }

              /* ==========================================
                 COMPACT
                 ========================================== */

              .template-compact .page {
                padding: 13mm;
              }

              .template-compact .section {
                margin-top: 15px;
              }

              .template-compact .item {
                margin-bottom: 9px;
              }

              .template-compact .section-title {
                margin-bottom: 6px;
                padding-bottom: 3px;
              }

              /* ==========================================
                 TIMELINE
                 ========================================== */

              .template-timeline .item {
                border-left:
                  3px solid ${config.accent};
                padding-left: 14px;
                position: relative;
              }

              .template-timeline .item::before {
                content: "";
                position: absolute;
                left: -8px;
                top: 4px;
                width: 11px;
                height: 11px;
                border-radius: 50%;
                background:
                  ${config.accent};
              }

              /* ==========================================
                 PORTFOLIO
                 ========================================== */

              .template-portfolio .page {
                border-top:
                  8px solid #0891b2;
              }

              .template-portfolio h1 {
                font-size: 34px;
              }

              .template-portfolio .section-title {
                border-bottom: none;
                background:
                  #ecfeff;
                padding:
                  8px 10px;
                color:
                  #0e7490;
              }

              /* ==========================================
                 INFOGRAPHIC
                 ========================================== */

              .template-infographic .skills span {
                border-radius: 999px;
                background:
                  #fff7ed;
                color:
                  #ea580c;
                border:
                  1px solid #fed7aa;
              }

              .template-infographic .section-title {
                border-left:
                  5px solid #f97316;
                border-bottom:
                  none;
                padding-left:
                  8px;
                color:
                  #ea580c;
              }

              /* ==========================================
                 PHOTO PROFESSIONAL
                 ========================================== */

              .template-photo .page {
                border-top:
                  8px solid #2563eb;
              }

              .template-photo h1 {
                color:
                  #1e3a8a;
              }

              /* ==========================================
                 GRADUATE
                 ========================================== */

              .template-graduate .page {
                border-top:
                  8px solid #2563eb;
              }

              .template-graduate .section-title {
                color:
                  #2563eb;
                border-bottom:
                  2px solid #bfdbfe;
              }

              /* ==========================================
                 INTERNATIONAL
                 ========================================== */

              .template-international .page {
                border-top:
                  7px solid #0369a1;
              }

              .template-international .section-title {
                color:
                  #0369a1;
                border-bottom:
                  1px solid #0369a1;
              }

              /* ==========================================
                 TWO COLUMN
                 ========================================== */

              .actual-two-column {
                display: grid;
                grid-template-columns:
                  31% 69%;
                padding: 0;
              }

              .actual-two-column
              .two-column-sidebar {
                background:
                  #eff6ff;
                padding:
                  18mm 9mm;
              }

              .actual-two-column
              .two-column-main {
                padding:
                  18mm 12mm;
              }

              .actual-two-column
              .two-column-sidebar
              .section-title {
                color:
                  #2563eb;
                border-bottom:
                  1px solid #93c5fd;
              }

              @media print {

                body {
                  background: white;
                }

                .page {
                  margin: 0;
                  box-shadow: none;
                }

              }

            </style>

          </head>

          <body>

            <div class="${pageClass}">

              ${
                selectedTemplate ===
                  "two-column" ||
                selectedTemplate ===
                  "executive" ||
                selectedTemplate ===
                  "portfolio" ||
                selectedTemplate ===
                  "international-cv"
                  ? `
                    <aside class="two-column-sidebar">

                      <h1>
                        ${escapeHtml(
                          data.fullName ||
                            "Your Name"
                        )}
                      </h1>

                      <div class="role">
                        ${escapeHtml(
                          data.targetRole ||
                            "Software Developer"
                        )}
                      </div>

                      <div class="section">

                        <div class="section-title">
                          CONTACT
                        </div>

                        <div class="contact">
                          ${escapeHtml(
                            [
                              data.email,
                              data.phone,
                              data.location,
                            ]
                              .filter(Boolean)
                              .join(" • ")
                          )}
                        </div>

                      </div>

                      ${
                        skillsHtml
                          ? `
                            <div class="section">

                              <div class="section-title">
                                SKILLS
                              </div>

                              <div class="skills">
                                ${skillsHtml}
                              </div>

                            </div>
                          `
                          : ""
                      }

                      ${
                        educationHtml
                          ? `
                            <div class="section">

                              <div class="section-title">
                                EDUCATION
                              </div>

                              ${educationHtml}

                            </div>
                          `
                          : ""
                      }

                    </aside>

                    <main class="two-column-main">

                      ${
                        data.summary &&
                        data.summary !==
                          "Your professional summary will appear here."
                          ? `
                            <div class="section">

                              <div class="section-title">
                                PROFILE
                              </div>

                              <p>
                                ${escapeHtml(
                                  data.summary
                                )}
                              </p>

                            </div>
                          `
                          : ""
                      }

                      ${
                        experienceHtml
                          ? `
                            <div class="section">

                              <div class="section-title">
                                EXPERIENCE
                              </div>

                              ${experienceHtml}

                            </div>
                          `
                          : ""
                      }

                      ${
                        projectsHtml
                          ? `
                            <div class="section">

                              <div class="section-title">
                                PROJECTS
                              </div>

                              ${projectsHtml}

                            </div>
                          `
                          : ""
                      }

                      ${
                        data.certifications?.length
                          ? `
                            <div class="section">

                              <div class="section-title">
                                CERTIFICATIONS
                              </div>

                              <ul>
                                ${listHtml(
                                  data.certifications
                                )}
                              </ul>

                            </div>
                          `
                          : ""
                      }

                      ${
                        data.achievements?.length
                          ? `
                            <div class="section">

                              <div class="section-title">
                                ACHIEVEMENTS
                              </div>

                              <ul>
                                ${listHtml(
                                  data.achievements
                                )}
                              </ul>

                            </div>
                          `
                          : ""
                      }

                    </main>
                  `
                  : `

                    <h1>
                      ${escapeHtml(
                        data.fullName ||
                          "Your Name"
                      )}
                    </h1>

                    <div class="role">
                      ${escapeHtml(
                        data.targetRole ||
                          "Software Developer"
                      )}
                    </div>

                    <div class="contact">

                      ${escapeHtml(
                        [
                          data.email,
                          data.phone,
                          data.location,
                        ]
                          .filter(Boolean)
                          .join(" • ")
                      )}

                      ${
                        data.linkedin ||
                        data.github
                          ? `
                            <br />

                            ${escapeHtml(
                              [
                                data.linkedin,
                                data.github,
                              ]
                                .filter(Boolean)
                                .join(" • ")
                            )}
                          `
                          : ""
                      }

                    </div>

                    ${
                      data.summary &&
                      data.summary !==
                        "Your professional summary will appear here."
                        ? `
                          <div class="section">

                            <div class="section-title">
                              PROFILE
                            </div>

                            <p>
                              ${escapeHtml(
                                data.summary
                              )}
                            </p>

                          </div>
                        `
                        : ""
                    }

                    ${
                      skillsHtml
                        ? `
                          <div class="section">

                            <div class="section-title">
                              SKILLS
                            </div>

                            <div class="skills">
                              ${skillsHtml}
                            </div>

                          </div>
                        `
                        : ""
                    }

                    ${
                      experienceHtml
                        ? `
                          <div class="section">

                            <div class="section-title">
                              EXPERIENCE
                            </div>

                            ${experienceHtml}

                          </div>
                        `
                        : ""
                    }

                    ${
                      projectsHtml
                        ? `
                          <div class="section">

                            <div class="section-title">
                              PROJECTS
                            </div>

                            ${projectsHtml}

                          </div>
                        `
                        : ""
                    }

                    ${
                      educationHtml
                        ? `
                          <div class="section">

                            <div class="section-title">
                              EDUCATION
                            </div>

                            ${educationHtml}

                          </div>
                        `
                        : ""
                    }

                    ${
                      data.certifications?.length
                        ? `
                          <div class="section">

                            <div class="section-title">
                              CERTIFICATIONS
                            </div>

                            <ul>
                              ${listHtml(
                                data.certifications
                              )}
                            </ul>

                          </div>
                        `
                        : ""
                    }

                    ${
                      data.achievements?.length
                        ? `
                          <div class="section">

                            <div class="section-title">
                              ACHIEVEMENTS
                            </div>

                            <ul>
                              ${listHtml(
                                data.achievements
                              )}
                            </ul>

                          </div>
                        `
                        : ""
                    }

                  `
              }

            </div>

          </body>

        </html>
      `);

      win.document.close();
    };

  // ==========================================================
  // STEP INFO
  // ==========================================================

  const steps = [
    "Experience",
    "Student",
    "Education",
    "Resume",
    "Upload",
    "Photo",
    "Layout",
    "Style",
    "Templates",
  ];

  const progress =
    (step / steps.length) *
    100;

  // ==========================================================
  // EDITOR
  // ==========================================================

  // ==========================================================
// SAVED RESUME VIEW / EDIT
// ==========================================================

// ==========================================================
// SAVED RESUME VIEW
// ==========================================================

if (
  id &&
  generatedResume &&
  !location.pathname.startsWith("/resume/edit/")
) {
  return (
    <AuthGate>
      <div className="min-h-screen w-full bg-slate-100 dark:bg-slate-950 px-4 py-6">

        <div className="mx-auto w-full max-w-6xl">

          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="mb-5 flex items-center justify-between gap-3">

            {/* BACK */}

            <button
              type="button"
              onClick={() => navigate("/db")}
              className="
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                py-2
                text-sm
                font-semibold
                text-slate-700
                hover:bg-slate-50
                dark:border-slate-700
                dark:bg-slate-900
                dark:text-slate-200
                dark:hover:bg-slate-800
              "
            >
              ← Back
            </button>

            <div className="flex gap-2">

              {/* EDIT */}

              <button
                type="button"
                onClick={() =>
                  navigate(`/resume/edit/${id}`)
                }
                className="
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  text-slate-700
                  hover:bg-slate-50
                  dark:border-slate-700
                  dark:bg-slate-900
                  dark:text-slate-200
                  dark:hover:bg-slate-800
                "
              >
                Edit
              </button>

              {/* DOWNLOAD */}

              <button
                type="button"
                onClick={() =>
                  downloadPDF(livePreviewData)
                }
                className="
                  rounded-xl
                  bg-slate-900
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  text-white
                  hover:bg-slate-800
                "
              >
                Download PDF
              </button>

            </div>
          </div>

          {/* ==================================================
              RESUME PREVIEW
          ================================================== */}

          <div className="flex justify-center">

            <div
              id="generated-resume-document"
              className="w-full"
            >

              <TemplateResumePreview
                data={livePreviewData}
                template={selectedTemplate}
              />

            </div>

          </div>

        </div>
      </div>
    </AuthGate>
  );
}
  if (showEditor) {
    return (
      <AuthGate>

        <ErrorModal
          open={
            showErrorModal
          }
          title={
            errorModalTitle
          }
          message={
            errorModalMessage
          }
          allowRetry={
            errorModalRetry
          }
          onClose={() =>
            setShowErrorModal(
              false
            )
          }
          onRetry={() => {
            setShowErrorModal(
              false
            );

            handleGenerate();
          }}
        />

        {isGenerating && (
          <GenerationOverlay
            progress={
              generationProgress
            }
            message={
              generationMessage
            }
            attempt={
              generationAttempt
            }
          />
        )}

        <div
          className="
            min-h-screen
            w-full
            bg-slate-50
            text-slate-900
            dark:bg-slate-950
            dark:text-white
          "
        >

          <div
            className="
              mb-6
              flex
              flex-wrap
              items-center
              justify-between
              gap-4
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-4
              shadow-sm
              dark:border-slate-800
              dark:bg-slate-900
            "
          >

            <div
              className="
                flex
                items-center
                gap-3
              "
            >

              <button
  type="button"
  onClick={downloadPDF}
  className="
    rounded-xl
    border
    border-slate-200
    bg-white
    px-5
    py-3
    text-sm
    font-bold
    text-slate-700
    hover:bg-slate-50
    dark:border-slate-700
    dark:bg-slate-900
    dark:text-slate-200
    dark:hover:bg-slate-800
  "
>
  Download PDF
</button>

              <div>

                <h1
                  className="
                    font-bold
                    text-slate-900
                    dark:text-white
                  "
                >
                  AI Resume Builder
                </h1>

                <p
                  className="
                    text-xs
                    text-slate-400
                  "
                >
                  {TEMPLATE_CONFIG[
                    selectedTemplate
                  ]?.name ||
                    "Simple ATS"}{" "}
                  template
                </p>

              </div>

            </div>

            <div
              className="
                flex
                flex-wrap
                gap-2
              "
            >

              <button
                type="button"
                onClick={
                  handleGenerate
                }
                disabled={
                  isGenerating
                }
                className="
                  rounded-xl
                  bg-gradient-to-r
                  from-indigo-600
                  to-violet-600
                  px-5
                  py-3
                  text-sm
                  font-bold
                  text-white
                  shadow-lg
                  transition
                  hover:-translate-y-0.5
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                ✨ Generate with AI
              </button>

              <button
                type="button"
                onClick={() =>
                  downloadPDF(
                    livePreviewData
                  )
                }
                className="
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-5
                  py-3
                  text-sm
                  font-bold
                  text-slate-700
                  hover:bg-slate-50
                  dark:border-slate-700
                  dark:bg-slate-900
                  dark:text-slate-200
                  dark:hover:bg-slate-800
                "
              >
                Download PDF
              </button>

              <button
                type="button"
                onClick={() =>
                  openResumePreview(
                    livePreviewData
                  )
                }
                className="
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-5
                  py-3
                  text-sm
                  font-bold
                  text-slate-700
                  hover:bg-slate-50
                  dark:border-slate-700
                  dark:bg-slate-900
                  dark:text-slate-200
                  dark:hover:bg-slate-800
                "
              >
                Preview
              </button>

            </div>

          </div>

          {success && (
            <div
              className="
                mb-5
                rounded-xl
                border
                border-emerald-200
                bg-emerald-50
                px-5
                py-3
                text-sm
                text-emerald-700
                dark:border-emerald-900
                dark:bg-emerald-950/40
                dark:text-emerald-300
              "
            >
              {success}
            </div>
          )}

          <div
            className="
              grid
              gap-6
              xl:grid-cols-[minmax(0,0.9fr)_minmax(400px,1.1fr)]
            "
          >

            {/* ==================================================
                FORM
                ================================================== */}

            <div
              className="
                rounded-2xl
                border
                border-slate-200
                bg-white
                p-5
                shadow-sm
                sm:p-7
                dark:border-slate-800
                dark:bg-slate-900
              "
            >

              <div className="mb-7">

                <p
                  className="
                    text-xs
                    font-bold
                    uppercase
                    tracking-[0.15em]
                    text-indigo-600
                  "
                >
                  Resume information
                </p>

                <h2
                  className="
                    mt-2
                    text-2xl
                    font-bold
                    text-slate-900
                    dark:text-white
                  "
                >
                  Tell us about yourself
                </h2>

                <p
                  className="
                    mt-2
                    text-sm
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  Enter your information and Gemini
                  will professionally optimize your
                  resume.
                </p>

              </div>

              <div className="space-y-5">

                <Input
                  label="Full Name"
                  value={
                    form.fullName
                  }
                  onChange={(value) =>
                    updateField(
                      "fullName",
                      value
                    )
                  }
                  placeholder="Your full name"
                />

                <div
                  className="
                    grid
                    gap-4
                    sm:grid-cols-2
                  "
                >

                  <Input
                    label="Email"
                    value={
                      form.email
                    }
                    onChange={(value) =>
                      updateField(
                        "email",
                        value
                      )
                    }
                    placeholder="you@example.com"
                  />

                  <Input
                    label="Phone"
                    value={
                      form.phone
                    }
                    onChange={(value) =>
                      updateField(
                        "phone",
                        value
                      )
                    }
                    placeholder="+91 9876543210"
                  />

                </div>

                <div
                  className="
                    grid
                    gap-4
                    sm:grid-cols-2
                  "
                >

                  <Input
                    label="Location"
                    value={
                      form.location
                    }
                    onChange={(value) =>
                      updateField(
                        "location",
                        value
                      )
                    }
                    placeholder="Bhubaneswar, Odisha"
                  />

                  <Input
                    label="Target Role"
                    value={
                      form.targetRole
                    }
                    onChange={(value) =>
                      updateField(
                        "targetRole",
                        value
                      )
                    }
                    placeholder="Backend Developer"
                  />

                </div>

                <Input
                  label="LinkedIn"
                  value={
                    form.linkedin
                  }
                  onChange={(value) =>
                    updateField(
                      "linkedin",
                      value
                    )
                  }
                  placeholder="linkedin.com/in/username"
                />

                <Input
                  label="GitHub"
                  value={
                    form.github
                  }
                  onChange={(value) =>
                    updateField(
                      "github",
                      value
                    )
                  }
                  placeholder="github.com/username"
                />

                <TextArea
                  label="Job Description"
                  value={
                    form.jobDescription
                  }
                  onChange={(value) =>
                    updateField(
                      "jobDescription",
                      value
                    )
                  }
                  placeholder="Paste the job description here. Gemini will tailor your resume to this job."
                />

                <TextArea
                  label="Professional Summary"
                  value={
                    form.summary
                  }
                  onChange={(value) =>
                    updateField(
                      "summary",
                      value
                    )
                  }
                  placeholder="Write a short professional summary..."
                />

                <TextArea
                  label="Skills"
                  value={
                    form.skills
                  }
                  onChange={(value) =>
                    updateField(
                      "skills",
                      value
                    )
                  }
                  placeholder="React, JavaScript, Python, SQL, MongoDB..."
                />

                <TextArea
                  label="Experience"
                  value={
                    form.experience
                  }
                  onChange={(value) =>
                    updateField(
                      "experience",
                      value
                    )
                  }
                  placeholder="Describe your work experience, company, role and responsibilities..."
                />

                <TextArea
                  label="Projects"
                  value={
                    form.projects
                  }
                  onChange={(value) =>
                    updateField(
                      "projects",
                      value
                    )
                  }
                  placeholder="Describe your projects..."
                />

                <TextArea
                  label="Education"
                  value={
                    form.education
                  }
                  onChange={(value) =>
                    updateField(
                      "education",
                      value
                    )
                  }
                  placeholder="B.Tech in Computer Science, Trident Academy of Technology, 2023-Present..."
                />

                <TextArea
                  label="Certifications"
                  value={
                    form.certifications
                  }
                  onChange={(value) =>
                    updateField(
                      "certifications",
                      value
                    )
                  }
                  placeholder="Certification name..."
                />

                <TextArea
                  label="Achievements"
                  value={
                    form.achievements
                  }
                  onChange={(value) =>
                    updateField(
                      "achievements",
                      value
                    )
                  }
                  placeholder="Awards, achievements..."
                />

              </div>

            </div>

            {/* ==================================================
                TEMPLATE-AWARE PREVIEW
                ================================================== */}

            <div
              className="
                rounded-2xl
                border
                border-slate-200
                bg-slate-100
                p-4
                sm:p-6
                dark:border-slate-800
                dark:bg-slate-800
              "
            >

              <div className="mb-4 flex items-center justify-between">

                <div>

                  <p
                    className="
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-[0.15em]
                      text-slate-400
                    "
                  >
                    Selected template
                  </p>

                  <p
                    className="
                      mt-1
                      text-sm
                      font-bold
                      text-slate-800
                      dark:text-white
                    "
                  >
                    {
                      TEMPLATE_CONFIG[
                        selectedTemplate
                      ]?.name ||
                      "Simple ATS"
                    }
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowEditor(
                      false
                    );

                    setStep(9);
                  }}
                  className="
                    rounded-lg
                    border
                    border-slate-200
                    bg-white
                    px-3
                    py-2
                    text-xs
                    font-bold
                    text-slate-600
                    hover:bg-slate-50
                    dark:border-slate-700
                    dark:bg-slate-900
                    dark:text-slate-300
                  "
                >
                  Change Template
                </button>

              </div>

              <div
                id="generated-resume-document"
                className="w-full"
              >
                <TemplateResumePreview
                  data={
                    livePreviewData
                  }
                  template={
                    selectedTemplate
                  }
                />
              </div>

            </div>

          </div>

        </div>

      </AuthGate>
    );
  }

  // ==========================================================
  // BUILDER FLOW
  // ==========================================================

  return (
    <AuthGate>

      <ErrorModal
        open={
          showErrorModal
        }
        title={
          errorModalTitle
        }
        message={
          errorModalMessage
        }
        allowRetry={
          errorModalRetry
        }
        onClose={() =>
          setShowErrorModal(
            false
          )
        }
        onRetry={() => {
          setShowErrorModal(
            false
          );

          handleGenerate();
        }}
      />

      {isGenerating && (
        <GenerationOverlay
          progress={
            generationProgress
          }
          message={
            generationMessage
          }
          attempt={
            generationAttempt
          }
        />
      )}

      <div
        className="
          min-h-screen
          w-full
          min-w-0
          bg-slate-50
          text-slate-900
          dark:bg-slate-950
          dark:text-white
        "
      >

        <div
          className="
            mb-6
            rounded-2xl
            border
            border-slate-200
            bg-white
            px-4
            py-4
            shadow-sm
            sm:px-6
            dark:border-slate-800
            dark:bg-slate-900
          "
        >

          <div
            className="
              flex
              items-center
              justify-between
              gap-4
            "
          >

            <div
              className="
                flex
                items-center
                gap-3
              "
            >

              <button
                type="button"
                onClick={
                  handleBack
                }
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-slate-200
                  bg-white
                  text-lg
                  hover:bg-slate-50
                  dark:border-slate-700
                  dark:bg-slate-900
                  dark:hover:bg-slate-800
                "
              >
                ←
              </button>

              <div>

                <h1
                  className="
                    text-sm
                    font-bold
                    text-slate-900
                    dark:text-white
                  "
                >
                  AI Resume Builder
                </h1>

                <p
                  className="
                    text-xs
                    text-slate-400
                  "
                >
                  {
                    steps[
                      step - 1
                    ]
                  }
                </p>

              </div>

            </div>

            <div className="text-right">

              <p
                className="
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-[0.15em]
                  text-slate-400
                "
              >
                Step
              </p>

              <p
                className="
                  text-sm
                  font-bold
                  text-slate-800
                  dark:text-white
                "
              >
                {step} /{" "}
                {steps.length}
              </p>

            </div>

          </div>

          <div
            className="
              mt-4
              h-1
              w-full
              bg-slate-100
              dark:bg-slate-800
            "
          >

            <div
              className="
                h-full
                bg-gradient-to-r
                from-indigo-600
                to-violet-600
                transition-all
                duration-500
              "
              style={{
                width:
                  `${progress}%`,
              }}
            />

          </div>

        </div>

        {error && (
          <div
            className="
              mb-5
              rounded-xl
              border
              border-red-200
              bg-red-50
              px-5
              py-3
              text-sm
              text-red-600
              dark:border-red-900
              dark:bg-red-950/40
              dark:text-red-300
            "
          >
            {error}
          </div>
        )}

        <div
          className="
            mx-auto
            w-full
            max-w-5xl
          "
        >

          {/* ==================================================
              STEP 1
              ================================================== */}

          {step === 1 && (
            <StepContainer
              eyebrow="STEP 1 OF 9"
              title="What is your experience level?"
              subtitle="Choose the option that best describes you."
            >

              <div
                className="
                  grid
                  gap-4
                  md:grid-cols-3
                "
              >

                <ChoiceCard
                  selected={
                    experienceLevel ===
                    "student"
                  }
                  icon="🎓"
                  title="Student"
                  description="I'm currently studying."
                  onClick={() => {
                    setExperienceLevel(
                      "student"
                    );

                    setError("");
                  }}
                />

                <ChoiceCard
                  selected={
                    experienceLevel ===
                    "entry"
                  }
                  icon="🌱"
                  title="Entry Level"
                  description="I have little or no professional experience."
                  onClick={() => {
                    setExperienceLevel(
                      "entry"
                    );

                    setError("");
                  }}
                />

                <ChoiceCard
                  selected={
                    experienceLevel ===
                    "experienced"
                  }
                  icon="💼"
                  title="Experienced"
                  description="I already have professional experience."
                  onClick={() => {
                    setExperienceLevel(
                      "experienced"
                    );

                    setError("");
                  }}
                />

              </div>

              <NavigationButtons
                onBack={
                  handleBack
                }
                onContinue={
                  handleContinue
                }
              />

            </StepContainer>
          )}

          {/* ==================================================
              STEP 2
              ================================================== */}

          {step === 2 && (
            <StepContainer
              eyebrow="STEP 2 OF 9"
              title="Are you a student?"
              subtitle="This helps us tailor the resume builder to you."
            >

              <div
                className="
                  mx-auto
                  grid
                  max-w-2xl
                  gap-4
                  md:grid-cols-2
                "
              >

                <ChoiceCard
                  selected={
                    student ===
                    "yes"
                  }
                  icon="🎓"
                  title="Yes, I'm a student"
                  description="Show my education prominently."
                  onClick={() => {
                    setStudent(
                      "yes"
                    );

                    setError("");
                  }}
                />

                <ChoiceCard
                  selected={
                    student ===
                    "no"
                  }
                  icon="💼"
                  title="No"
                  description="Focus more on my professional experience."
                  onClick={() => {
                    setStudent(
                      "no"
                    );

                    setError("");
                  }}
                />

              </div>

              <NavigationButtons
                onBack={
                  handleBack
                }
                onContinue={
                  handleContinue
                }
              />

            </StepContainer>
          )}

          {/* ==================================================
              STEP 3
              ================================================== */}

          {step === 3 && (
            <StepContainer
              eyebrow="STEP 3 OF 9"
              title="Tell us about your education"
              subtitle="You can add more education later in the editor."
            >

              <div
                className="
                  mx-auto
                  max-w-2xl
                "
              >

                <TextArea
                  label="Education"
                  value={
                    form.education
                  }
                  onChange={(value) =>
                    updateField(
                      "education",
                      value
                    )
                  }
                  placeholder={
                    "Example:\nB.Tech in Computer Science Engineering\nTrident Academy of Technology\n2023 - Present"
                  }
                />

              </div>

              <NavigationButtons
                onBack={
                  handleBack
                }
                onContinue={
                  handleContinue
                }
              />

            </StepContainer>
          )}

          {/* ==================================================
              STEP 4
              ================================================== */}

          {step === 4 && (
            <StepContainer
              eyebrow="STEP 4 OF 9"
              title="Do you already have a resume?"
              subtitle="Choose whether you want to upload an existing resume or start fresh."
            >

              <div
                className="
                  mx-auto
                  grid
                  max-w-3xl
                  gap-4
                  md:grid-cols-2
                "
              >

                <ChoiceCard
                  selected={
                    resumeSource ===
                    "existing"
                  }
                  icon="📄"
                  title="Yes, I have a resume"
                  description="Upload your existing resume and continue."
                  onClick={() => {
                    setResumeSource(
                      "existing"
                    );

                    setError("");
                  }}
                />

                <ChoiceCard
                  selected={
                    resumeSource ===
                    "scratch"
                  }
                  icon="✨"
                  title="Start from scratch"
                  description="Build a new resume from the beginning."
                  onClick={() => {
                    setResumeSource(
                      "scratch"
                    );

                    setError("");
                  }}
                />

              </div>

              <NavigationButtons
                onBack={
                  handleBack
                }
                onContinue={
                  handleContinue
                }
              />

            </StepContainer>
          )}

          {/* ==================================================
              STEP 5
              ================================================== */}

          {step === 5 && (
            <StepContainer
              eyebrow="STEP 5 OF 9"
              title={
                resumeSource ===
                "existing"
                  ? "Upload your existing resume"
                  : "Resume information"
              }
              subtitle={
                resumeSource ===
                "existing"
                  ? "Upload your PDF or document to continue."
                  : "You chose to start from scratch. Continue to customize your resume."
              }
            >

              {resumeSource ===
              "existing" ? (
                <div
                  className="
                    mx-auto
                    max-w-2xl
                  "
                >

                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    className="
                      flex
                      w-full
                      flex-col
                      items-center
                      justify-center
                      rounded-3xl
                      border-2
                      border-dashed
                      border-slate-300
                      bg-white
                      px-6
                      py-14
                      text-center
                      hover:border-indigo-400
                      hover:bg-indigo-50/30
                      dark:border-slate-700
                      dark:bg-slate-900
                    "
                  >

                    <div
                      className="
                        flex
                        h-16
                        w-16
                        items-center
                        justify-center
                        rounded-2xl
                        bg-indigo-50
                        text-2xl
                        dark:bg-indigo-950
                      "
                    >
                      📄
                    </div>

                    <h3
                      className="
                        mt-5
                        font-bold
                        text-slate-900
                        dark:text-white
                      "
                    >
                      {uploadedFile
                        ? uploadedFile.name
                        : "Choose your resume"}
                    </h3>

                    <p
                      className="
                        mt-2
                        text-sm
                        text-slate-400
                      "
                    >
                      PDF, DOC or DOCX
                    </p>

                  </button>

                  <input
                    ref={
                      fileInputRef
                    }
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={
                      handleUploadChange
                    }
                  />

                  {atsResult && (
                    <div
                      className="
                        mt-5
                        rounded-2xl
                        border
                        border-emerald-100
                        bg-emerald-50
                        p-5
                        dark:border-emerald-900
                        dark:bg-emerald-950/40
                      "
                    >

                      <p
                        className="
                          text-sm
                          font-bold
                          text-emerald-700
                          dark:text-emerald-300
                        "
                      >
                        Resume uploaded successfully
                      </p>

                      {atsResult.score !==
                        undefined && (
                        <p
                          className="
                            mt-1
                            text-sm
                            text-emerald-600
                            dark:text-emerald-400
                          "
                        >
                          ATS Score:{" "}
                          <strong>
                            {
                              atsResult.score
                            }
                            %
                          </strong>
                        </p>
                      )}

                    </div>
                  )}

                </div>
              ) : (
                <div
                  className="
                    mx-auto
                    max-w-2xl
                    rounded-3xl
                    border
                    border-indigo-100
                    bg-indigo-50/50
                    p-8
                    text-center
                    dark:border-indigo-900
                    dark:bg-indigo-950/30
                  "
                >

                  <div className="text-4xl">
                    ✨
                  </div>

                  <h3
                    className="
                      mt-4
                      text-xl
                      font-bold
                      text-slate-900
                      dark:text-white
                    "
                  >
                    Starting from scratch
                  </h3>

                  <p
                    className="
                      mx-auto
                      mt-2
                      max-w-md
                      text-sm
                      leading-6
                      text-slate-500
                      dark:text-slate-400
                    "
                  >
                    Great. We'll collect your
                    information in the editor.
                  </p>

                </div>
              )}

              <NavigationButtons
                onBack={
                  handleBack
                }
                onContinue={
                  handleContinue
                }
              />

            </StepContainer>
          )}

          {/* ==================================================
              STEP 6
              ================================================== */}

          {step === 6 && (
            <StepContainer
              eyebrow="STEP 1 OF PREFERENCES"
              title="Do you want to add a photo?"
              subtitle="You can always change this later."
            >

              <div
                className="
                  mx-auto
                  grid
                  max-w-3xl
                  gap-4
                  md:grid-cols-2
                "
              >

                <ChoiceCard
                  selected={
                    preferences.photo ===
                    "yes"
                  }
                  icon="📷"
                  title="Yes, add a photo"
                  description="Include a professional profile photo."
                  darkSelected
                  onClick={() => {
                    setPreferences(
                      (prev) => ({
                        ...prev,
                        photo: "yes",
                      })
                    );

                    setError("");
                  }}
                />

                <ChoiceCard
                  selected={
                    preferences.photo ===
                    "no"
                  }
                  icon="🚫"
                  title="No photo"
                  description="Keep the resume focused entirely on your professional information."
                  darkSelected
                  onClick={() => {
                    setPreferences(
                      (prev) => ({
                        ...prev,
                        photo: "no",
                      })
                    );

                    setError("");
                  }}
                />

              </div>

              <NavigationButtons
                onBack={
                  handleBack
                }
                onContinue={
                  handleContinue
                }
              />

            </StepContainer>
          )}

          {/* ==================================================
              STEP 7
              ================================================== */}

          {step === 7 && (
            <StepContainer
              eyebrow="STEP 2 OF PREFERENCES"
              title="Choose your layout"
              subtitle="Select the structure that works best for your resume."
            >

              <div
                className="
                  mx-auto
                  grid
                  max-w-4xl
                  gap-5
                  md:grid-cols-3
                "
              >

                <LayoutCard
                  selected={
                    preferences.layout ===
                    "classic"
                  }
                  title="Classic"
                  description="Clean and traditional."
                  onClick={() => {
                    setPreferences(
                      (prev) => ({
                        ...prev,
                        layout:
                          "classic",
                      })
                    );

                    setError("");
                  }}
                />

                <LayoutCard
                  selected={
                    preferences.layout ===
                    "modern"
                  }
                  title="Modern"
                  description="Modern and visually balanced."
                  onClick={() => {
                    setPreferences(
                      (prev) => ({
                        ...prev,
                        layout:
                          "modern",
                      })
                    );

                    setError("");
                  }}
                />

                <LayoutCard
                  selected={
                    preferences.layout ===
                    "minimal"
                  }
                  title="Minimal"
                  description="Simple and ATS-friendly."
                  onClick={() => {
                    setPreferences(
                      (prev) => ({
                        ...prev,
                        layout:
                          "minimal",
                      })
                    );

                    setError("");
                  }}
                />

              </div>

              <NavigationButtons
                onBack={
                  handleBack
                }
                onContinue={
                  handleContinue
                }
              />

            </StepContainer>
          )}

          {/* ==================================================
              STEP 8
              ================================================== */}

          {step === 8 && (
            <StepContainer
              eyebrow="STEP 3 OF PREFERENCES"
              title="Choose your style"
              subtitle="Pick the visual personality of your resume."
            >

              <div
                className="
                  mx-auto
                  grid
                  max-w-3xl
                  gap-4
                  md:grid-cols-3
                "
              >

                <StyleCard
                  selected={
                    preferences.style ===
                    "professional"
                  }
                  title="Professional"
                  description="Polished and corporate."
                  onClick={() => {
                    setPreferences(
                      (prev) => ({
                        ...prev,
                        style:
                          "professional",
                      })
                    );

                    setError("");
                  }}
                />

                <StyleCard
                  selected={
                    preferences.style ===
                    "creative"
                  }
                  title="Creative"
                  description="Modern and expressive."
                  onClick={() => {
                    setPreferences(
                      (prev) => ({
                        ...prev,
                        style:
                          "creative",
                      })
                    );

                    setError("");
                  }}
                />

                <StyleCard
                  selected={
                    preferences.style ===
                    "simple"
                  }
                  title="Simple"
                  description="Minimal and ATS-focused."
                  onClick={() => {
                    setPreferences(
                      (prev) => ({
                        ...prev,
                        style:
                          "simple",
                      })
                    );

                    setError("");
                  }}
                />

              </div>

              <NavigationButtons
                onBack={
                  handleBack
                }
                onContinue={
                  handleContinue
                }
              />

            </StepContainer>
          )}

          {/* ==================================================
              STEP 9
              ================================================== */}

          {step === 9 && (
            <StepContainer
              eyebrow="STEP 9 OF 9"
              title="Choose a template"
              subtitle="You can change your template later."
            >

              <div
                className="
                  mx-auto
                  grid
                  max-w-4xl
                  gap-5
                  sm:grid-cols-2
                  lg:grid-cols-3
                "
              >

                <TemplateCard
                  selected={
                    selectedTemplate ===
                    "modern-minimal"
                  }
                  title="Modern"
                  accent="purple"
                  onClick={() => {
                    setSelectedTemplate(
                      "modern-minimal"
                    );

                    localStorage.setItem(
                      "selectedResumeTemplate",
                      "modern-minimal"
                    );

                    setError("");
                  }}
                />

                <TemplateCard
                  selected={
                    selectedTemplate ===
                    "classic-professional"
                  }
                  title="Classic"
                  accent="blue"
                  onClick={() => {
                    setSelectedTemplate(
                      "classic-professional"
                    );

                    localStorage.setItem(
                      "selectedResumeTemplate",
                      "classic-professional"
                    );

                    setError("");
                  }}
                />

                <TemplateCard
                  selected={
                    selectedTemplate ===
                    "simple-ats"
                  }
                  title="Minimal"
                  accent="gray"
                  onClick={() => {
                    setSelectedTemplate(
                      "simple-ats"
                    );

                    localStorage.setItem(
                      "selectedResumeTemplate",
                      "simple-ats"
                    );

                    setError("");
                  }}
                />

              </div>

              <div
                className="
                  mx-auto
                  mt-8
                  max-w-2xl
                  rounded-2xl
                  border
                  border-indigo-100
                  bg-indigo-50
                  p-5
                  dark:border-indigo-900
                  dark:bg-indigo-950/30
                "
              >

                <p
                  className="
                    text-sm
                    font-bold
                    text-indigo-700
                    dark:text-indigo-300
                  "
                >
                  Almost done!
                </p>

                <p
                  className="
                    mt-1
                    text-sm
                    leading-6
                    text-indigo-600
                    dark:text-indigo-400
                  "
                >
                  Continue to the editor where you
                  can enter your details and generate
                  your final AI-powered resume.
                </p>

              </div>

              <NavigationButtons
                onBack={
                  handleBack
                }
                onContinue={
                  handleContinue
                }
                continueText="Open Editor →"
              />

            </StepContainer>
          )}

        </div>

      </div>

    </AuthGate>
  );
}

// ============================================================
// TEMPLATE RESUME PREVIEW
// ============================================================

function TemplateResumePreview({
  data,
  template,
}) {
  const config =
    TEMPLATE_CONFIG[
      template
    ] ||
    TEMPLATE_CONFIG[
      "simple-ats"
    ];

  const type =
    config.type;

  const dark =
    [
      "creative",
      "gradient",
      "marketing",
      "animated",
      "tech",
    ].includes(type);

  const renderBullets =
    (items) => {
      const bullets =
        normalizeBullets(
          items
        );

      if (!bullets.length) {
        return null;
      }

      return (
        <ul
          className="
            mt-2
            space-y-1.5
            pl-5
            text-[11px]
            leading-5
          "
        >
          {bullets.map(
            (
              bullet,
              index
            ) => (
              <li
                key={
                  index
                }
              >
                {bullet}
              </li>
            )
          )}
        </ul>
      );
    };

  const Section = ({
    title,
    children,
  }) => (
    <section className="mt-6">

      <h2
        className={`
          mb-3
          border-b-2
          pb-1.5
          text-[10px]
          font-extrabold
          uppercase
          tracking-[0.16em]

          ${
            dark
              ? "border-white/30 text-white"
              : "border-current"
          }
        `}
        style={
          dark
            ? undefined
            : {
                color:
                  config.accent,
              }
        }
      >
        {title}
      </h2>

      {children}

    </section>
  );

  const commonText =
    dark
      ? "text-white/85"
      : "text-slate-600";

  const metaText =
    dark
      ? "text-white/50"
      : "text-slate-400";

  // ==========================================================
  // TWO COLUMN
  // ==========================================================

  if (
    [
      "two-column",
      "executive",
      "portfolio",
      "international",
    ].includes(type)
  ) {
    return (
      <div
        className="
          mx-auto
          flex
          w-full
          max-w-[800px]
          overflow-hidden
          bg-white
          shadow-xl
        "
      >

        <aside
          className="
            w-[31%]
            shrink-0
            bg-blue-50
            p-5
            sm:p-7
          "
          style={{
            borderTop:
              `7px solid ${config.accent}`,
          }}
        >

          <h1
            className="
              break-words
              text-2xl
              font-extrabold
              text-slate-900
            "
          >
            {data.fullName}
          </h1>

          <p
            className="mt-2 text-xs font-bold"
            style={{
              color:
                config.accent,
            }}
          >
            {data.targetRole}
          </p>

          <div className="mt-5 space-y-1.5 text-[10px] leading-5 text-slate-500">
            {[
              data.email,
              data.phone,
              data.location,
              data.linkedin,
              data.github,
            ]
              .filter(Boolean)
              .map(
                (
                  item,
                  index
                ) => (
                  <div
                    key={
                      index
                    }
                  >
                    {item}
                  </div>
                )
              )}
          </div>

          {data.skills?.length >
            0 && (
            <div className="mt-7">

              <h2
                className="
                  border-b
                  border-blue-200
                  pb-2
                  text-[10px]
                  font-extrabold
                  uppercase
                  tracking-widest
                  text-blue-700
                "
              >
                Skills
              </h2>

              <div className="mt-3 flex flex-wrap gap-1.5">

                {data.skills.map(
                  (
                    skill,
                    index
                  ) => (
                    <span
                      key={
                        index
                      }
                      className="
                        rounded
                        bg-white
                        px-2
                        py-1
                        text-[9px]
                        font-semibold
                        text-slate-600
                        shadow-sm
                      "
                    >
                      {skill}
                    </span>
                  )
                )}

              </div>

            </div>
          )}

          {data.education?.length >
            0 && (
            <div className="mt-7">

              <h2
                className="
                  border-b
                  border-blue-200
                  pb-2
                  text-[10px]
                  font-extrabold
                  uppercase
                  tracking-widest
                  text-blue-700
                "
              >
                Education
              </h2>

              <div className="mt-3 space-y-4">

                {data.education.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      key={
                        index
                      }
                    >

                      <p className="text-[10px] font-bold text-slate-800">
                        {item.degree}
                      </p>

                      <p className="mt-1 text-[9px] text-slate-500">
                        {[
                          item.institution,
                          item.date,
                        ]
                          .filter(
                            Boolean
                          )
                          .join(
                            " | "
                          )}
                      </p>

                    </div>
                  )
                )}

              </div>

            </div>
          )}

        </aside>

        <main className="min-w-0 flex-1 bg-white p-6 sm:p-9">

          {data.summary &&
            data.summary !==
              "Your professional summary will appear here." && (
              <Section title="Profile">

                <p
                  className="
                    text-[11px]
                    leading-5
                    text-slate-600
                  "
                >
                  {data.summary}
                </p>

              </Section>
            )}

          {data.experience?.length >
            0 && (
            <Section title="Experience">

              {data.experience.map(
                (
                  item,
                  index
                ) => (
                  <div
                    key={
                      index
                    }
                    className="mb-5"
                  >

                    <h3 className="text-xs font-bold text-slate-900">
                      {item.title}
                    </h3>

                    <p className="mt-1 text-[9px] text-slate-400">
                      {[
                        item.company,
                        item.location,
                        item.date,
                      ]
                        .filter(
                          Boolean
                        )
                        .join(
                          " | "
                        )}
                    </p>

                    {renderBullets(
                      item.bullets
                    )}

                  </div>
                )
              )}

            </Section>
          )}

          {data.projects?.length >
            0 && (
            <Section title="Projects">

              {data.projects.map(
                (
                  item,
                  index
                ) => (
                  <div
                    key={
                      index
                    }
                    className="mb-5"
                  >

                    <h3 className="text-xs font-bold text-slate-900">
                      {item.title}
                    </h3>

                    {item.technologies && (
                      <p className="mt-1 text-[9px] text-slate-400">
                        {toText(
                          item.technologies
                        )}
                      </p>
                    )}

                    {renderBullets(
                      item.bullets
                    )}

                  </div>
                )
              )}

            </Section>
          )}

          {data.certifications?.length >
            0 && (
            <Section title="Certifications">

              <ul className="space-y-1 text-[11px] text-slate-600">

                {data.certifications.map(
                  (
                    item,
                    index
                  ) => (
                    <li
                      key={
                        index
                      }
                    >
                      •{" "}
                      {toText(
                        item
                      )}
                    </li>
                  )
                )}

              </ul>

            </Section>
          )}

          {data.achievements?.length >
            0 && (
            <Section title="Achievements">

              <ul className="space-y-1 text-[11px] text-slate-600">

                {data.achievements.map(
                  (
                    item,
                    index
                  ) => (
                    <li
                      key={
                        index
                      }
                    >
                      •{" "}
                      {toText(
                        item
                      )}
                    </li>
                  )
                )}

              </ul>

            </Section>
          )}

        </main>

      </div>
    );
  }

  // ==========================================================
  // TECH TEMPLATE
  // ==========================================================

  if (
    type === "tech"
  ) {
    return (
      <div
        className="
          mx-auto
          w-full
          max-w-[800px]
          overflow-hidden
          bg-[#0f172a]
          p-6
          text-white
          shadow-xl
          sm:p-10
        "
        style={{
          borderLeft:
            `8px solid ${config.accent}`,
        }}
      >

        <div className="border-b border-slate-700 pb-5">

          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-green-400">
            SOFTWARE ENGINEER
          </p>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
            {data.fullName}
          </h1>

          <p className="mt-1 text-sm font-semibold text-green-400">
            {data.targetRole}
          </p>

          <p className="mt-3 text-[10px] leading-5 text-slate-400">
            {[
              data.email,
              data.phone,
              data.location,
              data.github,
            ]
              .filter(Boolean)
              .join("  •  ")}
          </p>

        </div>

        {data.summary &&
          data.summary !==
            "Your professional summary will appear here." && (
            <Section title="About">

              <p
                className="
                  text-[11px]
                  leading-5
                  text-slate-300
                "
              >
                {data.summary}
              </p>

            </Section>
          )}

        {data.skills?.length >
          0 && (
          <Section title="Tech Stack">

            <div className="flex flex-wrap gap-2">

              {data.skills.map(
                (
                  skill,
                  index
                ) => (
                  <span
                    key={
                      index
                    }
                    className="
                      rounded-md
                      border
                      border-green-500/30
                      bg-green-500/10
                      px-2
                      py-1
                      text-[9px]
                      font-bold
                      text-green-400
                    "
                  >
                    {skill}
                  </span>
                )
              )}

            </div>

          </Section>
        )}

        {data.experience?.length >
          0 && (
          <Section title="Experience">

            {data.experience.map(
              (
                item,
                index
              ) => (
                <div
                  key={
                    index
                  }
                  className="mb-5"
                >

                  <h3 className="text-xs font-bold text-white">
                    {item.title}
                  </h3>

                  <p className="mt-1 text-[9px] text-green-400">
                    {[
                      item.company,
                      item.location,
                      item.date,
                    ]
                      .filter(
                        Boolean
                      )
                      .join(
                        " | "
                      )}
                  </p>

                  {renderBullets(
                    item.bullets
                  )}

                </div>
              )
            )}

          </Section>
        )}

        {data.projects?.length >
          0 && (
          <Section title="Projects">

            {data.projects.map(
              (
                item,
                index
              ) => (
                <div
                  key={
                    index
                  }
                  className="mb-5"
                >

                  <h3 className="text-xs font-bold text-white">
                    {item.title}
                  </h3>

                  {item.technologies && (
                    <p className="mt-1 text-[9px] text-slate-500">
                      {toText(
                        item.technologies
                      )}
                    </p>
                  )}

                  {renderBullets(
                    item.bullets
                  )}

                </div>
              )
            )}

          </Section>
        )}

      </div>
    );
  }

  // ==========================================================
  // CREATIVE / GRADIENT
  // ==========================================================

  if (
    [
      "creative",
      "gradient",
      "marketing",
      "animated",
    ].includes(type)
  ) {
    return (
      <div
        className="
          mx-auto
          w-full
          max-w-[800px]
          overflow-hidden
          rounded-xl
          p-7
          text-white
          shadow-2xl
          sm:p-10
        "
        style={{
          background:
            `linear-gradient(135deg, ${config.accent}, #4f46e5, #9333ea)`,
        }}
      >

        <div className="border-b border-white/20 pb-6">

          <div className="flex items-start justify-between gap-5">

            <div>

              <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/60">
                {type === "marketing"
                  ? "CREATIVE MARKETING"
                  : "CREATIVE PROFESSIONAL"}
              </p>

              <h1 className="mt-2 text-4xl font-extrabold tracking-tight">
                {data.fullName}
              </h1>

              <p className="mt-2 text-sm font-bold text-white/80">
                {data.targetRole}
              </p>

            </div>

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-2xl">
              ✦
            </div>

          </div>

          <p className="mt-5 text-[10px] leading-5 text-white/60">
            {[
              data.email,
              data.phone,
              data.location,
              data.linkedin,
            ]
              .filter(Boolean)
              .join("  •  ")}
          </p>

        </div>

        {data.summary &&
          data.summary !==
            "Your professional summary will appear here." && (
            <Section title="Profile">

              <p className="text-[11px] leading-5 text-white/80">
                {data.summary}
              </p>

            </Section>
          )}

        {data.skills?.length >
          0 && (
          <Section title="Skills">

            <div className="flex flex-wrap gap-2">

              {data.skills.map(
                (
                  skill,
                  index
                ) => (
                  <span
                    key={
                      index
                    }
                    className="
                      rounded-full
                      border
                      border-white/20
                      bg-white/10
                      px-3
                      py-1.5
                      text-[9px]
                      font-bold
                    "
                  >
                    {skill}
                  </span>
                )
              )}

            </div>

          </Section>
        )}

        {data.experience?.length >
          0 && (
          <Section title="Experience">

            {data.experience.map(
              (
                item,
                index
              ) => (
                <div
                  key={
                    index
                  }
                  className="
                    mb-5
                    rounded-xl
                    border
                    border-white/10
                    bg-white/5
                    p-4
                  "
                >

                  <h3 className="text-xs font-bold">
                    {item.title}
                  </h3>

                  <p className="mt-1 text-[9px] text-white/50">
                    {[
                      item.company,
                      item.location,
                      item.date,
                    ]
                      .filter(
                        Boolean
                      )
                      .join(
                        " | "
                      )}
                  </p>

                  {renderBullets(
                    item.bullets
                  )}

                </div>
              )
            )}

          </Section>
        )}

        {data.projects?.length >
          0 && (
          <Section title="Projects">

            {data.projects.map(
              (
                item,
                index
              ) => (
                <div
                  key={
                    index
                  }
                  className="
                    mb-4
                    rounded-xl
                    border
                    border-white/10
                    bg-white/5
                    p-4
                  "
                >

                  <h3 className="text-xs font-bold">
                    {item.title}
                  </h3>

                  {item.technologies && (
                    <p className="mt-1 text-[9px] text-white/50">
                      {toText(
                        item.technologies
                      )}
                    </p>
                  )}

                  {renderBullets(
                    item.bullets
                  )}

                </div>
              )
            )}

          </Section>
        )}

      </div>
    );
  }

  // ==========================================================
  // TIMELINE
  // ==========================================================

  if (
    type === "timeline"
  ) {
    return (
      <div
        className="
          mx-auto
          w-full
          max-w-[800px]
          bg-white
          p-7
          shadow-xl
          sm:p-10
        "
        style={{
          borderTop:
            `6px solid ${config.accent}`,
        }}
      >

        <h1 className="text-3xl font-extrabold text-slate-900">
          {data.fullName}
        </h1>

        <p
          className="mt-1 text-sm font-bold"
          style={{
            color:
              config.accent,
          }}
        >
          {data.targetRole}
        </p>

        <p className="mt-3 text-[10px] text-slate-400">
          {[
            data.email,
            data.phone,
            data.location,
          ]
            .filter(Boolean)
            .join(" • ")}
        </p>

        {data.summary &&
          data.summary !==
            "Your professional summary will appear here." && (
            <Section title="Profile">

              <p className="text-[11px] leading-5 text-slate-600">
                {data.summary}
              </p>

            </Section>
          )}

        {data.skills?.length >
          0 && (
          <Section title="Skills">

            <div className="flex flex-wrap gap-2">

              {data.skills.map(
                (
                  skill,
                  index
                ) => (
                  <span
                    key={
                      index
                    }
                    className="rounded-full bg-slate-100 px-3 py-1 text-[9px] font-bold text-slate-600"
                  >
                    {skill}
                  </span>
                )
              )}

            </div>

          </Section>
        )}

        {data.experience?.length >
          0 && (
          <Section title="Career Timeline">

            <div
              className="
                relative
                ml-2
                border-l-2
                pl-6
              "
              style={{
                borderColor:
                  config.accent,
              }}
            >

              {data.experience.map(
                (
                  item,
                  index
                ) => (
                  <div
                    key={
                      index
                    }
                    className="relative mb-7"
                  >

                    <div
                      className="
                        absolute
                        -left-[31px]
                        top-1
                        h-3
                        w-3
                        rounded-full
                      "
                      style={{
                        background:
                          config.accent,
                      }}
                    />

                    <h3 className="text-xs font-bold text-slate-900">
                      {item.title}
                    </h3>

                    <p className="mt-1 text-[9px] text-slate-400">
                      {[
                        item.company,
                        item.location,
                        item.date,
                      ]
                        .filter(
                          Boolean
                        )
                        .join(
                          " | "
                        )}
                    </p>

                    {renderBullets(
                      item.bullets
                    )}

                  </div>
                )
              )}

            </div>

          </Section>
        )}

        {data.projects?.length >
          0 && (
          <Section title="Projects">

            {data.projects.map(
              (
                item,
                index
              ) => (
                <div
                  key={
                    index
                  }
                  className="mb-5"
                >

                  <h3 className="text-xs font-bold text-slate-900">
                    {item.title}
                  </h3>

                  {renderBullets(
                    item.bullets
                  )}

                </div>
              )
            )}

          </Section>
        )}

      </div>
    );
  }

  // ==========================================================
  // DEFAULT ONE COLUMN
  // ==========================================================

  return (
    <div
      className="
        mx-auto
        w-full
        max-w-[800px]
        bg-white
        p-7
        shadow-xl
        sm:p-10
      "
      style={{
        borderTop:
          `6px solid ${config.accent}`,
      }}
    >

      <div className="border-b border-slate-200 pb-5">

        <h1
          className={`
            text-3xl
            font-extrabold
            tracking-tight

            ${
              type ===
              "elegant"
                ? "font-serif"
                : ""
            }
          `}
        >
          {data.fullName}
        </h1>

        <p
          className="mt-1 text-sm font-bold"
          style={{
            color:
              config.accent,
          }}
        >
          {data.targetRole}
        </p>

        <p className="mt-3 text-[10px] leading-5 text-slate-400">
          {[
            data.email,
            data.phone,
            data.location,
          ]
            .filter(Boolean)
            .join(" • ")}
        </p>

        {(data.linkedin ||
          data.github) && (
          <p className="mt-1 text-[10px] text-slate-400">
            {[
              data.linkedin,
              data.github,
            ]
              .filter(Boolean)
              .join(" • ")}
          </p>
        )}

      </div>

      {data.summary &&
        data.summary !==
          "Your professional summary will appear here." && (
          <Section title="Profile">

            <p
              className={`
                text-[11px]
                leading-5
                ${commonText}
              `}
            >
              {data.summary}
            </p>

          </Section>
        )}

      {data.skills?.length >
        0 && (
        <Section title="Skills">

          <div className="flex flex-wrap gap-2">

            {data.skills.map(
              (
                skill,
                index
              ) => (
                <span
                  key={
                    index
                  }
                  className="
                    rounded-md
                    px-2
                    py-1
                    text-[9px]
                    font-bold
                  "
                  style={{
                    background:
                      `${config.accent}12`,
                    color:
                      config.accent,
                  }}
                >
                  {skill}
                </span>
              )
            )}

          </div>

        </Section>
      )}

      {data.experience?.length >
        0 && (
        <Section title="Experience">

          {data.experience.map(
            (
              item,
              index
            ) => (
              <div
                key={
                  index
                }
                className="mb-5"
              >

                <h3 className="text-xs font-bold text-slate-900">
                  {item.title}
                </h3>

                <p
                  className={`
                    mt-1
                    text-[9px]
                    ${metaText}
                  `}
                >
                  {[
                    item.company,
                    item.location,
                    item.date,
                  ]
                    .filter(
                      Boolean
                    )
                    .join(
                      " | "
                    )}
                </p>

                {renderBullets(
                  item.bullets
                )}

                {!normalizeBullets(
                  item.bullets
                ).length &&
                  item.description && (
                    <p
                      className={`
                        mt-2
                        text-[11px]
                        leading-5
                        ${commonText}
                      `}
                    >
                      {toText(
                        item.description
                      )}
                    </p>
                  )}

              </div>
            )
          )}

        </Section>
      )}

      {data.projects?.length >
        0 && (
        <Section title="Projects">

          {data.projects.map(
            (
              item,
              index
            ) => (
              <div
                key={
                  index
                }
                className="mb-5"
              >

                <h3 className="text-xs font-bold text-slate-900">
                  {item.title}
                </h3>

                {item.technologies && (
                  <p className="mt-1 text-[9px] text-slate-400">
                    Technologies:{" "}
                    {toText(
                      item.technologies
                    )}
                  </p>
                )}

                {renderBullets(
                  item.bullets
                )}

                {!normalizeBullets(
                  item.bullets
                ).length &&
                  item.description && (
                    <p className="mt-2 text-[11px] leading-5 text-slate-600">
                      {toText(
                        item.description
                      )}
                    </p>
                  )}

              </div>
            )
          )}

        </Section>
      )}

      {data.education?.length >
        0 && (
        <Section title="Education">

          {data.education.map(
            (
              item,
              index
            ) => (
              <div
                key={
                  index
                }
                className="mb-4"
              >

                <h3 className="text-xs font-bold text-slate-900">
                  {item.degree}
                </h3>

                <p className="mt-1 text-[9px] text-slate-500">
                  {[
                    item.institution,
                    item.date,
                  ]
                    .filter(
                      Boolean
                    )
                    .join(
                      " | "
                    )}
                </p>

                {item.description && (
                  <p className="mt-1 text-[10px] leading-5 text-slate-600">
                    {item.description}
                  </p>
                )}

              </div>
            )
          )}

        </Section>
      )}

      {data.certifications?.length >
        0 && (
        <Section title="Certifications">

          <ul className="space-y-1 text-[11px] text-slate-600">

            {data.certifications.map(
              (
                item,
                index
              ) => (
                <li
                  key={
                    index
                  }
                >
                  •{" "}
                  {toText(
                    item
                  )}
                </li>
              )
            )}

          </ul>

        </Section>
      )}

      {data.achievements?.length >
        0 && (
        <Section title="Achievements">

          <ul className="space-y-1 text-[11px] text-slate-600">

            {data.achievements.map(
              (
                item,
                index
              ) => (
                <li
                  key={
                    index
                  }
                >
                  •{" "}
                  {toText(
                    item
                  )}
                </li>
              )
            )}

          </ul>

        </Section>
      )}

    </div>
  );
}

// ============================================================
// GENERATION OVERLAY
// ============================================================

function GenerationOverlay({
  progress,
  message,
  attempt,
}) {
  const radius = 68;

  const circumference =
    2 * Math.PI * radius;

  const offset =
    circumference *
    (1 - progress / 100);

  return (
    <div
      className="
        fixed
        inset-0
        z-[99999]
        flex
        items-center
        justify-center
        bg-slate-950/65
        px-5
        backdrop-blur-xl
      "
    >

      <div
        className="
          pointer-events-none
          absolute
          left-1/2
          top-1/2
          h-[500px]
          w-[500px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-indigo-600/20
          blur-[120px]
        "
      />

      <div
        className="
          relative
          z-10
          w-full
          max-w-md
          rounded-[32px]
          border
          border-white/10
          bg-[#11131b]
          px-8
          py-10
          text-center
          shadow-2xl
        "
      >

        <div
          className="
            relative
            mx-auto
            h-40
            w-40
          "
        >

          <div
            className="
              absolute
              inset-0
              animate-spin
              rounded-full
              border-4
              border-transparent
              border-t-indigo-500
              border-r-purple-500
            "
            style={{
              animationDuration:
                "2s",
            }}
          />

          <svg
            className="
              absolute
              inset-0
              h-full
              w-full
              -rotate-90
            "
            viewBox="0 0 160 160"
          >

            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="8"
            />

            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="url(#resumeProgressGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={
                circumference
              }
              strokeDashoffset={
                offset
              }
              className="
                transition-all
                duration-700
                ease-out
              "
            />

            <defs>

              <linearGradient
                id="resumeProgressGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >

                <stop
                  offset="0%"
                  stopColor="#6366f1"
                />

                <stop
                  offset="100%"
                  stopColor="#a855f7"
                />

              </linearGradient>

            </defs>

          </svg>

          <div
            className="
              absolute
              inset-0
              flex
              flex-col
              items-center
              justify-center
            "
          >

            <div
              className="
                text-4xl
                font-extrabold
                text-white
              "
            >
              {progress}%
            </div>

            <div
              className="
                mt-1
                text-[10px]
                font-bold
                uppercase
                tracking-[0.18em]
                text-white/40
              "
            >
              Complete
            </div>

          </div>

        </div>

        <h2
          className="
            mt-8
            text-2xl
            font-bold
            text-white
          "
        >
          Creating your resume
        </h2>

        <p
          className="
            mx-auto
            mt-3
            max-w-sm
            text-sm
            leading-6
            text-white/50
          "
        >
          Gemini is analyzing your information,
          improving your content and creating an
          ATS-friendly resume.
        </p>

        <div
          className="
            mt-7
            rounded-2xl
            border
            border-white/10
            bg-white/5
            px-5
            py-4
          "
        >

          <p
            className="
              text-sm
              font-medium
              text-white/80
            "
          >
            {message}
          </p>

          {attempt > 1 && (
            <p
              className="
                mt-2
                text-xs
                font-medium
                text-amber-300
              "
            >
              Retrying automatically · Attempt{" "}
              {attempt} of 3
            </p>
          )}

        </div>

        <div
          className="
            mt-6
            flex
            justify-center
            gap-2
          "
        >

          <span
            className="
              h-2
              w-2
              animate-bounce
              rounded-full
              bg-indigo-400
            "
          />

          <span
            className="
              h-2
              w-2
              animate-bounce
              rounded-full
              bg-violet-400
              [animation-delay:150ms]
            "
          />

          <span
            className="
              h-2
              w-2
              animate-bounce
              rounded-full
              bg-purple-400
              [animation-delay:300ms]
            "
          />

        </div>

      </div>

    </div>
  );
}

// ============================================================
// ERROR MODAL
// ============================================================

function ErrorModal({
  open,
  title,
  message,
  allowRetry,
  onClose,
  onRetry,
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-[100000]
        flex
        items-center
        justify-center
        bg-black/50
        px-5
        backdrop-blur-sm
      "
    >

      <div
        className="
          w-full
          max-w-md
          overflow-hidden
          rounded-[28px]
          border
          border-slate-200
          bg-white
          shadow-2xl
          dark:border-slate-700
          dark:bg-slate-900
        "
      >

        <div
          className="
            flex
            justify-center
            pt-8
          "
        >

          <div
            className="
              flex
              h-16
              w-16
              items-center
              justify-center
              rounded-full
              bg-amber-50
              text-3xl
              dark:bg-amber-950/40
            "
          >
            ⚠️
          </div>

        </div>

        <div
          className="
            px-7
            pb-8
            pt-5
            text-center
          "
        >

          <h2
            className="
              text-xl
              font-bold
              text-slate-900
              dark:text-white
            "
          >
            {title}
          </h2>

          <p
            className="
              mx-auto
              mt-3
              max-w-sm
              text-sm
              leading-6
              text-slate-500
              dark:text-slate-400
            "
          >
            {message}
          </p>

          <div
            className="
              mt-7
              flex
              flex-col
              gap-3
              sm:flex-row
              sm:justify-center
            "
          >

            {allowRetry && (
              <button
                type="button"
                onClick={
                  onRetry
                }
                className="
                  rounded-xl
                  bg-gradient-to-r
                  from-indigo-600
                  to-violet-600
                  px-7
                  py-3
                  text-sm
                  font-bold
                  text-white
                  shadow-lg
                  transition
                  hover:-translate-y-0.5
                "
              >
                Try Again
              </button>
            )}

            <button
              type="button"
              onClick={
                onClose
              }
              className="
                rounded-xl
                border
                border-slate-200
                bg-white
                px-7
                py-3
                text-sm
                font-bold
                text-slate-700
                hover:bg-slate-50
                dark:border-slate-700
                dark:bg-slate-900
                dark:text-slate-200
                dark:hover:bg-slate-800
              "
            >
              Close
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

// ============================================================
// STEP CONTAINER
// ============================================================

function StepContainer({
  eyebrow,
  title,
  subtitle,
  children,
}) {
  return (
    <div
      className="
        rounded-3xl
        border
        border-slate-200
        bg-white
        px-5
        py-10
        shadow-sm
        sm:px-8
        sm:py-12
        lg:px-12
        lg:py-14
        dark:border-slate-800
        dark:bg-slate-900
      "
    >

      <div className="text-center">

        <p
          className="
            text-[10px]
            font-extrabold
            uppercase
            tracking-[0.2em]
            text-slate-400
          "
        >
          {eyebrow}
        </p>

        <h2
          className="
            mx-auto
            mt-4
            max-w-3xl
            text-3xl
            font-bold
            tracking-tight
            text-slate-900
            sm:text-4xl
            dark:text-white
          "
        >
          {title}
        </h2>

        <p
          className="
            mx-auto
            mt-3
            max-w-2xl
            text-sm
            leading-6
            text-slate-500
            sm:text-base
            dark:text-slate-400
          "
        >
          {subtitle}
        </p>

      </div>

      <div className="mt-10">
        {children}
      </div>

    </div>
  );
}

// ============================================================
// CHOICE CARD
// ============================================================

function ChoiceCard({
  selected,
  icon,
  title,
  description,
  onClick,
  darkSelected = false,
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`
        flex
        w-full
        min-w-0
        items-center
        justify-between
        gap-4
        rounded-2xl
        border
        p-5
        text-left
        transition
        duration-200

        ${
          selected &&
          darkSelected
            ? "border-black bg-black text-white shadow-lg dark:border-white dark:bg-black"
            : selected
              ? "border-indigo-500 bg-indigo-50 shadow-md dark:bg-indigo-950/30"
              : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900"
        }
      `}
    >

      <div
        className="
          flex
          min-w-0
          items-center
          gap-4
        "
      >

        <div
          className={`
            flex
            h-12
            w-12
            shrink-0
            items-center
            justify-center
            rounded-xl
            text-xl

            ${
              selected &&
              darkSelected
                ? "bg-white/10"
                : "bg-slate-100 dark:bg-slate-800"
            }
          `}
        >
          {icon}
        </div>

        <div className="min-w-0">

          <div
            className={`
              font-bold

              ${
                selected &&
                darkSelected
                  ? "text-white"
                  : "text-slate-900 dark:text-white"
              }
            `}
          >
            {title}
          </div>

          <div
            className={`
              mt-1
              text-sm
              leading-5

              ${
                selected &&
                darkSelected
                  ? "text-white/60"
                  : "text-slate-400"
              }
            `}
          >
            {description}
          </div>

        </div>

      </div>

      <div
        className={`
          flex
          h-5
          w-5
          shrink-0
          items-center
          justify-center
          rounded-full
          border-2

          ${
            selected
              ? "border-indigo-500 bg-indigo-500"
              : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900"
          }
        `}
      >

        {selected && (
          <div
            className="
              h-2
              w-2
              rounded-full
              bg-white
            "
          />
        )}

      </div>

    </button>
  );
}

// ============================================================
// LAYOUT CARD
// ============================================================

function LayoutCard({
  selected,
  title,
  description,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`
        rounded-2xl
        border
        p-4
        text-left
        transition

        ${
          selected
            ? "border-indigo-500 bg-indigo-50 shadow-lg dark:bg-indigo-950/30"
            : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900"
        }
      `}
    >

      <div
        className="
          mb-4
          aspect-[3/4]
          rounded-xl
          bg-slate-100
          p-3
          dark:bg-slate-800
        "
      >

        <div
          className="
            h-full
            rounded-lg
            bg-white
            p-3
            shadow-sm
          "
        >

          <div
            className="
              mb-3
              h-3
              w-2/3
              rounded
              bg-slate-800
            "
          />

          <div
            className="
              mb-4
              h-1.5
              w-1/2
              rounded
              bg-indigo-200
            "
          />

          <div
            className="
              grid
              grid-cols-[30%_1fr]
              gap-3
            "
          >

            <div className="space-y-2">
              <div className="h-1.5 w-full rounded bg-slate-200" />
              <div className="h-1.5 w-4/5 rounded bg-slate-200" />
              <div className="h-1.5 w-full rounded bg-slate-200" />
              <div className="h-1.5 w-3/5 rounded bg-slate-200" />
            </div>

            <div className="space-y-2">
              <div className="h-1.5 w-full rounded bg-slate-300" />
              <div className="h-1.5 w-11/12 rounded bg-slate-200" />
              <div className="h-1.5 w-4/5 rounded bg-slate-200" />
              <div className="mt-4 h-1.5 w-full rounded bg-slate-300" />
              <div className="h-1.5 w-10/12 rounded bg-slate-200" />
            </div>

          </div>

        </div>

      </div>

      <div
        className="
          flex
          items-center
          justify-between
        "
      >

        <div>

          <h3
            className="
              font-bold
              text-slate-900
              dark:text-white
            "
          >
            {title}
          </h3>

          <p
            className="
              mt-1
              text-xs
              text-slate-400
            "
          >
            {description}
          </p>

        </div>

        {selected && (
          <div className="text-indigo-600">
            ✓
          </div>
        )}

      </div>

    </button>
  );
}

// ============================================================
// STYLE CARD
// ============================================================

function StyleCard({
  selected,
  title,
  description,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`
        rounded-2xl
        border
        p-6
        text-center
        transition

        ${
          selected
            ? "border-indigo-500 bg-indigo-50 shadow-md dark:bg-indigo-950/30"
            : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900"
        }
      `}
    >

      <div
        className={`
          mx-auto
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-2xl
          text-xl

          ${
            selected
              ? "bg-indigo-600 text-white"
              : "bg-slate-100 text-slate-500 dark:bg-slate-800"
          }
        `}
      >
        ✦
      </div>

      <h3
        className="
          mt-4
          font-bold
          text-slate-900
          dark:text-white
        "
      >
        {title}
      </h3>

      <p
        className="
          mt-1
          text-xs
          leading-5
          text-slate-400
        "
      >
        {description}
      </p>

    </button>
  );
}

// ============================================================
// TEMPLATE CARD
// ============================================================

function TemplateCard({
  selected,
  title,
  accent,
  onClick,
}) {
  const accentClass =
    accent ===
    "purple"
      ? "bg-indigo-600"
      : accent ===
          "blue"
        ? "bg-blue-600"
        : "bg-slate-700";

  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`
        rounded-2xl
        border
        p-4
        text-left
        transition

        ${
          selected
            ? "border-indigo-500 bg-indigo-50 shadow-lg dark:bg-indigo-950/30"
            : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900"
        }
      `}
    >

      <div
        className="
          aspect-[3/4]
          rounded-xl
          bg-slate-100
          p-3
          dark:bg-slate-800
        "
      >

        <div
          className="
            h-full
            overflow-hidden
            rounded-lg
            bg-white
            shadow-sm
          "
        >

          <div
            className={`
              h-16
              ${accentClass}
              p-3
            `}
          >

            <div
              className="
                h-2
                w-1/2
                rounded
                bg-white/80
              "
            />

            <div
              className="
                mt-2
                h-1.5
                w-1/3
                rounded
                bg-white/50
              "
            />

          </div>

          <div className="p-3">

            <div
              className="
                grid
                grid-cols-[28%_1fr]
                gap-3
              "
            >

              <div className="space-y-2">
                <div className="h-1.5 w-full rounded bg-slate-200" />
                <div className="h-1.5 w-4/5 rounded bg-slate-200" />
                <div className="h-1.5 w-full rounded bg-slate-200" />
              </div>

              <div className="space-y-2">
                <div className="h-1.5 w-full rounded bg-slate-300" />
                <div className="h-1.5 w-11/12 rounded bg-slate-200" />
                <div className="h-1.5 w-4/5 rounded bg-slate-200" />
                <div className="mt-4 h-1.5 w-full rounded bg-slate-300" />
                <div className="h-1.5 w-10/12 rounded bg-slate-200" />
              </div>

            </div>

          </div>

        </div>

      </div>

      <div
        className="
          mt-4
          flex
          items-center
          justify-between
        "
      >

        <span
          className="
            font-bold
            text-slate-900
            dark:text-white
          "
        >
          {title}
        </span>

        {selected && (
          <span
            className="
              font-bold
              text-indigo-600
            "
          >
            ✓
          </span>
        )}

      </div>

    </button>
  );
}

// ============================================================
// NAVIGATION BUTTONS
// ============================================================

function NavigationButtons({
  onBack,
  onContinue,
  continueText = "Continue →",
}) {
  return (
    <div
      className="
        mx-auto
        mt-10
        flex
        w-full
        max-w-3xl
        flex-col-reverse
        gap-3
        sm:flex-row
        sm:items-center
        sm:justify-between
      "
    >

      <button
        type="button"
        onClick={
          onBack
        }
        className="
          rounded-xl
          border
          border-slate-200
          bg-white
          px-6
          py-3
          text-sm
          font-bold
          text-slate-700
          hover:bg-slate-50
          dark:border-slate-700
          dark:bg-slate-900
          dark:text-slate-200
          dark:hover:bg-slate-800
        "
      >
        ← Back
      </button>

      <button
        type="button"
        onClick={
          onContinue
        }
        className="
          rounded-xl
          bg-black
          px-7
          py-3
          text-sm
          font-bold
          text-white
          shadow-lg
          hover:bg-slate-800
        "
      >
        {continueText}
      </button>

    </div>
  );
}

// ============================================================
// INPUT
// ============================================================

function Input({
  label,
  value,
  onChange,
  placeholder,
}) {
  return (
    <label className="block">

      <span
        className="
          mb-2
          block
          text-sm
          font-semibold
          text-slate-700
          dark:text-slate-300
        "
      >
        {label}
      </span>

      <input
        type="text"
        value={
          value
        }
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={
          placeholder
        }
        className="
          w-full
          rounded-xl
          border
          border-slate-200
          bg-white
          px-4
          py-3
          text-sm
          text-slate-900
          outline-none
          transition
          placeholder:text-slate-300
          focus:border-indigo-400
          focus:ring-4
          focus:ring-indigo-50
          dark:border-slate-700
          dark:bg-slate-950
          dark:text-white
          dark:placeholder:text-slate-600
        "
      />

    </label>
  );
}

// ============================================================
// TEXTAREA
// ============================================================

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}) {
  return (
    <label className="block">

      <span
        className="
          mb-2
          block
          text-sm
          font-semibold
          text-slate-700
          dark:text-slate-300
        "
      >
        {label}
      </span>

      <textarea
        value={
          value
        }
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={
          placeholder
        }
        rows={5}
        className="
          w-full
          resize-y
          rounded-xl
          border
          border-slate-200
          bg-white
          px-4
          py-3
          text-sm
          leading-6
          text-slate-900
          outline-none
          transition
          placeholder:text-slate-300
          focus:border-indigo-400
          focus:ring-4
          focus:ring-indigo-50
          dark:border-slate-700
          dark:bg-slate-950
          dark:text-white
          dark:placeholder:text-slate-600
        "
      />

    </label>
  );
}