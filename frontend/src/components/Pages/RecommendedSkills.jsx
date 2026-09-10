import React, { useMemo, useState } from "react";
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
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
  X,
  Zap,
} from "lucide-react";
import BackButton from "../BackButton";
const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

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

const levelOptions = ["All", "Beginner", "Intermediate", "Advanced"];

const fallbackRecommendations = [
  {
    id: 1,
    skill: "Generative AI",
    category: "AI & ML",
    level: "Intermediate",
    priority: "High",
    score: 96,
    learningTime: "3–5 weeks",
    careerValue: "Very High",
    description:
      "Learn how modern generative AI systems work and how to use them to build practical career-focused applications.",
    whyRecommended:
      "Generative AI is increasingly useful across software, data, product, and business roles. It can strengthen your profile beyond your existing technical foundation.",
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
    ],
  },
  {
    id: 2,
    skill: "Cloud Computing",
    category: "Cloud",
    level: "Intermediate",
    priority: "High",
    score: 93,
    learningTime: "4–6 weeks",
    careerValue: "Very High",
    description:
      "Build practical knowledge of cloud platforms, deployment, storage, networking, and scalable applications.",
    whyRecommended:
      "Cloud knowledge can make your existing development skills more valuable and helps you move from local projects toward production-ready systems.",
    outcomes: [
      "Understand cloud architecture",
      "Deploy applications",
      "Use cloud storage",
      "Understand basic networking",
    ],
    resources: [
      "AWS/Azure fundamentals",
      "Cloud deployment",
      "Docker basics",
    ],
  },
  {
    id: 3,
    skill: "Advanced SQL",
    category: "Data",
    level: "Intermediate",
    priority: "High",
    score: 91,
    learningTime: "2–4 weeks",
    careerValue: "High",
    description:
      "Improve your ability to work with real-world databases using advanced querying and data manipulation techniques.",
    whyRecommended:
      "Strong SQL is valuable across software engineering, data analytics, business intelligence, and data science roles.",
    outcomes: [
      "Write complex queries",
      "Use window functions",
      "Optimize queries",
      "Work confidently with relational databases",
    ],
    resources: [
      "Joins and subqueries",
      "Window functions",
      "Query optimization",
    ],
  },
  {
    id: 4,
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
      "Docker complements development and cloud skills and is commonly used in modern software development workflows.",
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
    ],
  },
  {
    id: 5,
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
      "The ability to turn data into understandable insights is useful for technical and business-facing roles.",
    outcomes: [
      "Build effective charts",
      "Create dashboards",
      "Communicate insights",
      "Choose appropriate visualizations",
    ],
    resources: [
      "Power BI/Tableau",
      "Dashboard design",
      "Data storytelling",
    ],
  },
  {
    id: 6,
    skill: "System Design",
    category: "Technical",
    level: "Advanced",
    priority: "Medium",
    score: 79,
    learningTime: "4–8 weeks",
    careerValue: "Very High",
    description:
      "Develop the ability to design scalable, reliable, and maintainable software systems.",
    whyRecommended:
      "System design becomes increasingly valuable as you target stronger software engineering roles and technical interviews.",
    outcomes: [
      "Design scalable systems",
      "Understand APIs",
      "Work with caching",
      "Understand databases and queues",
    ],
    resources: [
      "System design fundamentals",
      "Distributed systems",
      "Scalability patterns",
    ],
  },
];

function normalizeRecommendations(data) {
  const source =
    data?.result ||
    data?.recommendations ||
    data?.recommendedSkills ||
    data?.skills ||
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

  return [];
}

function normalizeSkill(item, index) {
  return {
    id: item.id || item._id || index + 1,
    skill:
      item.skill ||
      item.name ||
      item.title ||
      `Recommended Skill ${index + 1}`,
    category: item.category || "Technical",
    level: item.level || item.difficulty || "Intermediate",
    priority: item.priority || "Medium",
    score: Number(
      item.score ||
        item.matchScore ||
        item.recommendationScore ||
        item.relevanceScore ||
        75
    ),
    learningTime:
      item.learningTime ||
      item.duration ||
      item.timeToLearn ||
      "2–4 weeks",
    careerValue:
      item.careerValue ||
      item.marketValue ||
      item.careerImpact ||
      "High",
    description:
      item.description ||
      item.summary ||
      "A skill recommended by AI based on your career direction and profile.",
    whyRecommended:
      item.whyRecommended ||
      item.reason ||
      item.why ||
      "This skill can strengthen your profile and improve your career opportunities.",
    outcomes: Array.isArray(item.outcomes)
      ? item.outcomes
      : Array.isArray(item.benefits)
        ? item.benefits
        : [],
    resources: Array.isArray(item.resources)
      ? item.resources
      : Array.isArray(item.learningResources)
        ? item.learningResources
        : [],
  };
}

function getCategoryIcon(category) {
  const value = String(category).toLowerCase();

  if (value.includes("ai") || value.includes("machine")) {
    return Brain;
  }

  if (value.includes("data")) {
    return TrendingUp;
  }

  if (value.includes("cloud")) {
    return Briefcase;
  }

  if (value.includes("tool")) {
    return Code2;
  }

  if (value.includes("career") || value.includes("soft")) {
    return Award;
  }

  return GraduationCap;
}

function getPriorityClass(priority) {
  const value = String(priority).toLowerCase();

  if (value === "high" || value === "critical") {
    return "border-destructive/30 bg-destructive/5 text-destructive";
  }

  if (value === "low") {
    return "border-border bg-muted/40 text-muted-foreground";
  }

  return "border-gold/30 bg-gold/5 text-gold";
}

function getLevelClass(level) {
  const value = String(level).toLowerCase();

  if (value === "beginner") {
    return "border-teal/30 bg-teal/5 text-teal";
  }

  if (value === "advanced") {
    return "border-plum/30 bg-plum/5 text-plum";
  }

  return "border-primary/30 bg-primary/5 text-primary";
}

export default function RecommendedSkills() {
  const [targetRole, setTargetRole] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("Student / Fresher");

  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState("");

  const [recommendations, setRecommendations] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState(null);

  const [category, setCategory] = useState("All");
  const [level, setLevel] = useState("All");
  const [priority, setPriority] = useState("All");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const hasResults = recommendations.length > 0;

  const displayRecommendations = hasResults
    ? recommendations
    : fallbackRecommendations.map(normalizeSkill);

  const filteredRecommendations = useMemo(() => {
    return displayRecommendations
      .filter((item) => {
        const matchesCategory =
          category === "All" ||
          String(item.category).toLowerCase() === category.toLowerCase();

        const matchesLevel =
          level === "All" ||
          String(item.level).toLowerCase() === level.toLowerCase();

        const matchesPriority =
          priority === "All" ||
          String(item.priority).toLowerCase() === priority.toLowerCase();

        const query = search.trim().toLowerCase();

        const matchesSearch =
          !query ||
          item.skill.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query);

        return (
          matchesCategory &&
          matchesLevel &&
          matchesPriority &&
          matchesSearch
        );
      })
      .sort((a, b) => b.score - a.score);
  }, [
    displayRecommendations,
    category,
    level,
    priority,
    search,
  ]);

  const topSkills = displayRecommendations.slice(0, 3);

  const averageScore =
    displayRecommendations.length > 0
      ? Math.round(
          displayRecommendations.reduce(
            (sum, item) => sum + Number(item.score || 0),
            0
          ) / displayRecommendations.length
        )
      : 0;

  const highPriorityCount = displayRecommendations.filter(
    (item) =>
      String(item.priority).toLowerCase() === "high" ||
      String(item.priority).toLowerCase() === "critical"
  ).length;

  const handleResumeUpload = async (file) => {
    if (!file) return;

    setResumeFile(file);
    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${API_URL}/api/ai/parse-resume-file`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to read the resume."
        );
      }

      const parsedText =
        data?.text ||
        data?.resume?.text ||
        data?.resumeText ||
        "";

      setResumeText(
        typeof parsedText === "string"
          ? parsedText
          : JSON.stringify(parsedText)
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to process the resume. Please try again."
      );
      setResumeFile(null);
    } finally {
      setUploading(false);
    }
  };

  const generateRecommendations = async () => {
    setError("");

    if (!targetRole.trim()) {
      setError("Please enter the career role you want to target.");
      return;
    }

    if (!resumeText.trim() && !resumeFile) {
      setError("Upload your resume or paste your resume details first.");
      return;
    }

    setLoading(true);
    setSelectedSkill(null);

    try {
      let finalResume = resumeText;

      if (resumeFile && !finalResume.trim()) {
        const formData = new FormData();
        formData.append("file", resumeFile);

        const parseResponse = await fetch(
          `${API_URL}/api/ai/parse-resume-file`,
          {
            method: "POST",
            body: formData,
          }
        );

        const parseData = await parseResponse.json();

        if (!parseResponse.ok) {
          throw new Error(
            parseData?.message || "Unable to parse your resume."
          );
        }

        finalResume =
          parseData?.text ||
          parseData?.resume?.text ||
          parseData?.resumeText ||
          JSON.stringify(parseData?.resume || "");
      }

      const response = await fetch(
        `${API_URL}/api/ai/recommended-skills`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            targetRole: targetRole.trim(),
            experienceLevel,
            resume: finalResume,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || data?.success === false) {
        throw new Error(
          data?.message ||
            "Unable to generate skill recommendations."
        );
      }

      const generated = normalizeRecommendations(data);

      if (!generated.length) {
        throw new Error(
          "The AI did not return any skill recommendations."
        );
      }

      const normalized = generated.map(normalizeSkill);

      setRecommendations(normalized);
      setCategory("All");
      setLevel("All");
      setPriority("All");
      setSearch("");
    } catch (err) {
      setError(
        err?.message ||
          "Something went wrong while generating recommendations."
      );
    } finally {
      setLoading(false);
    }
  };

  const clearResume = () => {
    setResumeFile(null);
    setResumeText("");
  };

  return (
    <main className="min-h-screen w-full bg-background px-5 py-5 text-foreground sm:px-6 lg:px-7">
      <div className="mx-auto max-w-[1500px]">
        <BackButton />

        {/* HERO */}
        <section className="mt-5 overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8 lg:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="ai-badge mb-4 inline-flex items-center gap-2">
                <Sparkles size={14} />
                AI-POWERED CAREER GROWTH
              </div>

              <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                Recommended{" "}
                <span className="gradient-text">Skills</span>
              </h1>

              <p className="muted mt-4 max-w-2xl text-base leading-7 sm:text-lg">
                Discover the skills that can give your career the biggest
                boost. AI analyzes your profile, career direction, and
                experience level to recommend what you should learn next.
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

        {/* INPUT SECTION */}
        <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="card">
            <div className="mb-6 flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Target size={22} />
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  Tell AI where you want to go
                </h2>
                <p className="muted mt-1 text-sm">
                  Your recommendations will be tailored to this career
                  direction.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="label">Target career / role</label>
                <input
                  className="input"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Data Scientist"
                />
              </div>

              <div>
                <label className="label">Experience level</label>
                <select
                  className="input"
                  value={experienceLevel}
                  onChange={(e) =>
                    setExperienceLevel(e.target.value)
                  }
                >
                  <option>Student / Fresher</option>
                  <option>0–2 years</option>
                  <option>2–5 years</option>
                  <option>5+ years</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="label">Resume</label>

              {!resumeFile ? (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/20 px-6 py-8 text-center transition hover:border-primary/50 hover:bg-muted/40">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={(e) =>
                      handleResumeUpload(e.target.files?.[0])
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
                    PDF, DOC, DOCX or TXT
                  </p>
                </label>
              ) : (
                <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/20 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <FileText size={19} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {resumeFile.name}
                      </p>
                      <p className="muted text-xs">
                        Resume processed successfully
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="nav-btn shrink-0"
                    onClick={clearResume}
                    aria-label="Remove resume"
                  >
                    <X size={17} />
                  </button>
                </div>
              )}
            </div>

            <div className="mt-5">
              <label className="label">
                Or paste your resume details
              </label>

              <textarea
                className="textarea min-h-[130px]"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume text here..."
              />
            </div>

            {error && (
              <div className="mt-5 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={generateRecommendations}
              disabled={loading || uploading}
              className="btn btn-primary mt-6 w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  AI is analyzing your profile...
                </>
              ) : (
                <>
                  <Sparkles size={17} />
                  Recommend Skills
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </div>

          {/* QUICK EXPLANATION */}
          <div className="card flex flex-col justify-between">
            <div>
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-ai/10 text-ai">
                <Brain size={22} />
              </div>

              <h2 className="text-xl font-bold">
                What will AI recommend?
              </h2>

              <p className="muted mt-2 leading-7">
                Instead of simply listing missing skills, AI looks at your
                career direction and recommends skills that can improve your
                employability, technical depth, and long-term career growth.
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
                ].map(([Icon, title, description]) => (
                  <div
                    key={title}
                    className="flex gap-3 rounded-2xl border border-border bg-muted/20 p-3"
                  >
                    <Icon
                      size={19}
                      className="mt-0.5 shrink-0 text-primary"
                    />
                    <div>
                      <p className="text-sm font-semibold">{title}</p>
                      <p className="muted mt-0.5 text-xs">
                        {description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* DASHBOARD RESULTS */}
        <section className="mt-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="ai-badge mb-2 inline-flex items-center gap-2">
                <Sparkles size={13} />
                AI INSIGHTS
              </div>

              <h2 className="text-2xl font-black sm:text-3xl">
                Skills worth learning next
              </h2>

              <p className="muted mt-1">
                {hasResults
                  ? `Personalized recommendations for ${targetRole || "your target career"}.`
                  : "Explore an example of how your personalized recommendations will look."}
              </p>
            </div>

            {!hasResults && (
              <span className="chip">
                Demo recommendations
              </span>
            )}
          </div>

          {/* STATS */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="card">
              <div className="flex items-center justify-between">
                <p className="muted text-sm">Recommended Skills</p>
                <Lightbulb
                  size={19}
                  className="text-gold"
                />
              </div>
              <p className="mt-3 text-3xl font-black">
                {displayRecommendations.length}
              </p>
              <p className="muted mt-1 text-xs">
                Personalized learning opportunities
              </p>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <p className="muted text-sm">Average Relevance</p>
                <TrendingUp
                  size={19}
                  className="text-teal"
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
                <p className="muted text-sm">High Priority</p>
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

            <div className="card">
              <div className="flex items-center justify-between">
                <p className="muted text-sm">Top Recommendation</p>
                <Award
                  size={19}
                  className="text-primary"
                />
              </div>
              <p className="mt-3 truncate text-xl font-black">
                {topSkills[0]?.skill || "—"}
              </p>
              <p className="muted mt-1 text-xs">
                Highest AI relevance
              </p>
            </div>
          </div>
        </section>

        {/* TOP 3 */}
        <section className="mt-6">
          <div className="card overflow-hidden">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  Top skills to prioritize
                </h2>
                <p className="muted mt-1 text-sm">
                  Start with these before moving down the list.
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-primary">
                <Sparkles size={16} />
                AI ranked
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {topSkills.map((item, index) => {
                const Icon = getCategoryIcon(item.category);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedSkill(item)}
                    className="group rounded-2xl border border-border bg-muted/20 p-5 text-left transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon size={21} />
                      </div>

                      <span className="rounded-full bg-background px-3 py-1 text-xs font-bold">
                        #{index + 1}
                      </span>
                    </div>

                    <h3 className="mt-4 text-lg font-bold">
                      {item.skill}
                    </h3>

                    <p className="muted mt-1 text-sm">
                      {item.category}
                    </p>

                    <div className="mt-5 flex items-center justify-between">
                      <span className="text-sm font-bold text-primary">
                        {item.score}% relevance
                      </span>

                      <ChevronDown
                        size={17}
                        className="-rotate-90 transition group-hover:translate-x-1"
                      />
                    </div>

                    <div className="progress mt-3">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(0, item.score)
                          )}%`,
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* FILTERS + LIST */}
        <section className="mt-6">
          <div className="card">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  Explore recommended skills
                </h2>
                <p className="muted mt-1 text-sm">
                  Filter recommendations according to what you want to learn.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Filter size={17} className="text-primary" />
                <span className="muted text-sm">
                  {filteredRecommendations.length} results
                </span>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="relative md:col-span-2 xl:col-span-1">
                <Search
                  size={17}
                  className="muted absolute left-3 top-1/2 -translate-y-1/2"
                />
                <input
                  className="input pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search skills..."
                />
              </div>

              <select
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categoryOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>

              <select
                className="input"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                {levelOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>

              <select
                className="input"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="All">All priorities</option>
                <option value="High">High priority</option>
                <option value="Medium">Medium priority</option>
                <option value="Low">Low priority</option>
              </select>
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {filteredRecommendations.map((item) => {
              const Icon = getCategoryIcon(item.category);

              return (
                <article
                  key={item.id}
                  className="card group transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon size={22} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-xl font-bold">
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

                  <p className="muted mt-5 line-clamp-3 text-sm leading-6">
                    {item.description}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${getPriorityClass(
                        item.priority
                      )}`}
                    >
                      {item.priority} priority
                    </span>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${getLevelClass(
                        item.level
                      )}`}
                    >
                      {item.level}
                    </span>

                    <span className="rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold">
                      <Clock3
                        size={12}
                        className="mr-1 inline"
                      />
                      {item.learningTime}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-muted/30 p-3">
                      <p className="muted text-xs">
                        Career value
                      </p>
                      <p className="mt-1 font-bold">
                        {item.careerValue}
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

                  <div className="mt-5">
                    <div className="mb-2 flex justify-between text-xs">
                      <span className="muted">
                        Recommendation strength
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
                            Math.max(0, item.score)
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedSkill(item)}
                    className="btn btn-secondary mt-5 w-full"
                  >
                    Explore this skill
                    <ArrowRight size={16} />
                  </button>
                </article>
              );
            })}
          </div>

          {filteredRecommendations.length === 0 && (
            <div className="card mt-5 py-14 text-center">
              <Search
                size={35}
                className="mx-auto text-muted-foreground"
              />

              <h3 className="mt-4 text-lg font-bold">
                No skills found
              </h3>

              <p className="muted mt-1 text-sm">
                Try changing your filters or search term.
              </p>
            </div>
          )}
        </section>

        {/* LEARNING STRATEGY */}
        <section className="mt-6">
          <div className="card">
            <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div>
                <div className="ai-badge mb-3 inline-flex items-center gap-2">
                  <GraduationCap size={13} />
                  LEARNING STRATEGY
                </div>

                <h2 className="text-2xl font-black">
                  Don't learn everything at once.
                </h2>

                <p className="muted mt-3 leading-7">
                  Focus on a small number of high-value skills, build
                  projects around them, and gradually increase your
                  difficulty.
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
                ].map(([number, title, description]) => (
                  <div
                    key={number}
                    className="rounded-2xl border border-border bg-muted/20 p-5"
                  >
                    <span className="text-sm font-black text-primary">
                      {number}
                    </span>

                    <h3 className="mt-3 font-bold">{title}</h3>

                    <p className="muted mt-2 text-sm leading-6">
                      {description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* DETAIL MODAL */}
      {selectedSkill && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-5 backdrop-blur-sm"
          onClick={() => setSelectedSkill(null)}
        >
          <div
            className="card max-h-[90vh] w-full max-w-3xl overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-4">
                <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  {React.createElement(
                    getCategoryIcon(selectedSkill.category),
                    { size: 25 }
                  )}
                </div>

                <div>
                  <div className="ai-badge mb-2 inline-flex">
                    AI RECOMMENDATION
                  </div>

                  <h2 className="text-2xl font-black">
                    {selectedSkill.skill}
                  </h2>

                  <p className="muted mt-1">
                    {selectedSkill.category}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="nav-btn"
                onClick={() => setSelectedSkill(null)}
              >
                <X size={19} />
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-muted/30 p-4">
                <p className="muted text-xs">Relevance</p>
                <p className="mt-1 text-xl font-black text-primary">
                  {selectedSkill.score}%
                </p>
              </div>

              <div className="rounded-2xl bg-muted/30 p-4">
                <p className="muted text-xs">Learning time</p>
                <p className="mt-1 font-black">
                  {selectedSkill.learningTime}
                </p>
              </div>

              <div className="rounded-2xl bg-muted/30 p-4">
                <p className="muted text-xs">Career value</p>
                <p className="mt-1 font-black">
                  {selectedSkill.careerValue}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-bold">Why AI recommends this</h3>

              <p className="muted mt-2 leading-7">
                {selectedSkill.whyRecommended}
              </p>
            </div>

            {selectedSkill.outcomes.length > 0 && (
              <div className="mt-6">
                <h3 className="font-bold">What you will gain</h3>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {selectedSkill.outcomes.map((item, index) => (
                    <div
                      key={`${item}-${index}`}
                      className="flex items-start gap-2 rounded-xl border border-border bg-muted/20 p-3 text-sm"
                    >
                      <CheckCircle2
                        size={16}
                        className="mt-0.5 shrink-0 text-teal"
                      />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedSkill.resources.length > 0 && (
              <div className="mt-6">
                <h3 className="font-bold">Suggested learning areas</h3>

                <div className="mt-3 space-y-2">
                  {selectedSkill.resources.map((item, index) => (
                    <div
                      key={`${item}-${index}`}
                      className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3"
                    >
                      <BookOpen
                        size={16}
                        className="shrink-0 text-primary"
                      />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="btn btn-primary flex-1"
                onClick={() => setSelectedSkill(null)}
              >
                <GraduationCap size={17} />
                Start Learning
              </button>

              <button
                type="button"
                className="btn btn-secondary flex-1"
                onClick={() => setSelectedSkill(null)}
              >
                <ExternalLink size={17} />
                Explore Resources
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}