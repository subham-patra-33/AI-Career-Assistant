import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Filter,
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

const demoGaps = [
  {
    id: 1,
    skill: "System Design",
    category: "Technical",
    priority: "High",
    currentLevel: "Beginner",
    targetLevel: "Advanced",
    reason:
      "Strong system design knowledge is important for building scalable applications and performing well in technical interviews.",
    action:
      "Study scalability, caching, databases, APIs, queues, load balancing and distributed systems.",
    resources: ["System design fundamentals", "Scalability", "Distributed systems"],
  },
  {
    id: 2,
    skill: "Docker",
    category: "Tools",
    priority: "Medium",
    currentLevel: "Beginner",
    targetLevel: "Intermediate",
    reason:
      "Containerization can improve your development and deployment workflow.",
    action:
      "Containerize one of your existing projects and learn Docker Compose.",
    resources: ["Docker fundamentals", "Dockerfiles", "Docker Compose"],
  },
  {
    id: 3,
    skill: "Cloud Computing",
    category: "Cloud",
    priority: "Medium",
    currentLevel: "Beginner",
    targetLevel: "Intermediate",
    reason:
      "Cloud deployment knowledge increases the practical value of your development skills.",
    action:
      "Learn cloud fundamentals and deploy a real project.",
    resources: ["AWS fundamentals", "Cloud deployment", "Networking"],
  },
];

export default function SkillGapAnalysis() {
  const [targetRole, setTargetRole] = useState("");
  const [experienceLevel, setExperienceLevel] =
    useState("Student / Fresher");
  const [resumeText, setResumeText] = useState("");
  const [resumeFile, setResumeFile] = useState(null);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);

  const gaps = result?.skillGaps || demoGaps;

  const filteredGaps = useMemo(() => {
    return gaps.filter((gap) => {
      const matchesFilter =
        filter === "All" ||
        String(gap.priority).toLowerCase() ===
          filter.toLowerCase();

      const q = search.trim().toLowerCase();

      const matchesSearch =
        !q ||
        gap.skill?.toLowerCase().includes(q) ||
        gap.category?.toLowerCase().includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [gaps, filter, search]);

  const handleUpload = async (file) => {
    if (!file) return;

    setResumeFile(file);
    setUploading(true);
    setError("");

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
          data?.message || "Unable to read your resume."
        );
      }

      const text =
        data?.text ||
        data?.resume?.text ||
        data?.resumeText ||
        "";

      setResumeText(
        typeof text === "string"
          ? text
          : JSON.stringify(text)
      );
    } catch (err) {
      setError(err.message || "Resume upload failed.");
      setResumeFile(null);
    } finally {
      setUploading(false);
    }
  };

  const analyze = async () => {
    setError("");

    if (!targetRole.trim()) {
      setError("Enter your target career role first.");
      return;
    }

    if (!resumeText.trim()) {
      setError("Upload or paste your resume first.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/ai/skill-gap`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            targetRole,
            experienceLevel,
            resume: resumeText,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || data?.success === false) {
        throw new Error(
          data?.message || "Skill gap analysis failed."
        );
      }

      setResult(data.result || data);
      localStorage.setItem("skillGapCompleted", "true");
    } catch (err) {
      setError(err.message || "Unable to analyze your skills.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-background px-5 py-5 text-foreground sm:px-6 sm:py-6 lg:px-7 lg:py-7">
      <div className="w-full">
        <BackButton />

        <section className="card mt-5">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="ai-badge mb-3 inline-flex items-center gap-2">
                <Brain size={14} />
                AI SKILL ANALYSIS
              </div>

              <h1 className="text-3xl font-black sm:text-4xl">
                Skill Gap Analysis
              </h1>

              <p className="muted mt-3 max-w-3xl leading-7">
                Compare your current capabilities with the skills
                required for your target career and discover exactly
                where you need to improve.
              </p>
            </div>

            <div className="ai-glow flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border border-border bg-muted/30">
              <Target size={42} className="text-primary" />
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="card">
            <h2 className="text-xl font-bold">
              Analyze your current skill profile
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label className="label">Target role</label>
                <input
                  className="input"
                  value={targetRole}
                  onChange={(e) =>
                    setTargetRole(e.target.value)
                  }
                  placeholder="e.g. Software Engineer"
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

            <div className="mt-5">
              <label className="label">Resume</label>

              {!resumeFile ? (
                <label className="flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed border-border bg-muted/20 p-6 transition hover:border-primary/40">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={(e) =>
                      handleUpload(e.target.files?.[0])
                    }
                  />

                  <Upload className="text-primary" />

                  <div>
                    <p className="font-bold">
                      {uploading
                        ? "Reading resume..."
                        : "Upload resume"}
                    </p>
                    <p className="muted text-sm">
                      PDF, DOC, DOCX or TXT
                    </p>
                  </div>
                </label>
              ) : (
                <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/20 p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="text-primary" />
                    <span className="font-semibold">
                      {resumeFile.name}
                    </span>
                  </div>

                  <button
                    className="nav-btn"
                    onClick={() => {
                      setResumeFile(null);
                      setResumeText("");
                    }}
                  >
                    <X size={17} />
                  </button>
                </div>
              )}
            </div>

            <div className="mt-5">
              <label className="label">
                Or paste resume text
              </label>

              <textarea
                className="textarea min-h-[150px]"
                value={resumeText}
                onChange={(e) =>
                  setResumeText(e.target.value)
                }
                placeholder="Paste your resume here..."
              />
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              className="btn btn-primary mt-5"
              onClick={analyze}
              disabled={loading || uploading}
            >
              {loading ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles size={17} />
                  Analyze Skill Gap
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-teal" />
              <h2 className="text-xl font-bold">
                What this analysis gives you
              </h2>
            </div>

            <div className="mt-5 space-y-3">
              {[
                "Readiness score",
                "Matched skills",
                "Missing skills",
                "Priority of every gap",
                "Current vs target level",
                "Personalized learning roadmap",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3"
                >
                  <CheckCircle2
                    size={17}
                    className="text-teal"
                  />
                  <span className="text-sm font-medium">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="card">
              <p className="muted text-sm">Readiness</p>
              <p className="mt-2 text-4xl font-black text-primary">
                {result?.readinessScore ?? "—"}%
              </p>
            </div>

            <div className="card">
              <p className="muted text-sm">Skill gaps</p>
              <p className="mt-2 text-4xl font-black">
                {gaps.length}
              </p>
            </div>

            <div className="card">
              <p className="muted text-sm">High priority</p>
              <p className="mt-2 text-4xl font-black text-destructive">
                {
                  gaps.filter(
                    (g) =>
                      String(g.priority).toLowerCase() ===
                      "high"
                  ).length
                }
              </p>
            </div>
          </div>
        </section>

        <section className="card mt-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-2xl font-black">
                Your skill gaps
              </h2>
              <p className="muted mt-1">
                Focus on high-priority gaps first.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="relative">
                <Search
                  size={16}
                  className="muted absolute left-3 top-1/2 -translate-y-1/2"
                />
                <input
                  className="input pl-9"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search"
                />
              </div>

              <select
                className="input"
                value={filter}
                onChange={(e) =>
                  setFilter(e.target.value)
                }
              >
                <option>All</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>

              <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/20 px-4 text-sm">
                <Filter size={15} />
                {filteredGaps.length} gaps
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {filteredGaps.map((gap) => {
              const open = expanded === gap.id;

              return (
                <div
                  key={gap.id}
                  className="rounded-2xl border border-border bg-muted/20 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold">
                        {gap.skill}
                      </h3>

                      <p className="muted mt-1 text-sm">
                        {gap.category}
                      </p>
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-bold ${
                        String(gap.priority).toLowerCase() ===
                        "high"
                          ? "border-destructive/30 bg-destructive/5 text-destructive"
                          : "border-gold/30 bg-gold/5 text-gold"
                      }`}
                    >
                      {gap.priority}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-background p-3">
                      <p className="muted text-xs">
                        Current
                      </p>
                      <p className="mt-1 font-bold">
                        {gap.currentLevel}
                      </p>
                    </div>

                    <div className="rounded-xl bg-background p-3">
                      <p className="muted text-xs">
                        Target
                      </p>
                      <p className="mt-1 font-bold">
                        {gap.targetLevel}
                      </p>
                    </div>
                  </div>

                  <button
                    className="mt-4 flex w-full items-center justify-between text-left text-sm font-bold text-primary"
                    onClick={() =>
                      setExpanded(open ? null : gap.id)
                    }
                  >
                    View improvement plan
                    <ChevronDown
                      size={17}
                      className={
                        open ? "rotate-180" : ""
                      }
                    />
                  </button>

                  {open && (
                    <div className="mt-4 border-t border-border pt-4">
                      <p className="text-sm leading-6">
                        <strong>Why:</strong> {gap.reason}
                      </p>

                      <p className="muted mt-3 text-sm leading-6">
                        <strong>Action:</strong> {gap.action}
                      </p>

                      {gap.resources?.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {gap.resources.map((resource) => (
                            <span
                              key={resource}
                              className="chip"
                            >
                              <BookOpen size={13} />
                              {resource}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {result?.roadmap?.length > 0 && (
          <section className="card mt-5">
            <div className="flex items-center gap-3">
              <Clock3 className="text-primary" />
              <div>
                <h2 className="text-2xl font-black">
                  Learning roadmap
                </h2>
                <p className="muted text-sm">
                  A practical sequence for closing your gaps.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {result.roadmap.map((item, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-border bg-muted/20 p-5"
                >
                  <span className="text-sm font-black text-primary">
                    0{index + 1}
                  </span>

                  <h3 className="mt-3 font-bold">
                    {item.title}
                  </h3>

                  <p className="muted mt-2 text-sm leading-6">
                    {item.description}
                  </p>

                  <p className="mt-3 text-xs font-semibold text-teal">
                    {item.duration}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}