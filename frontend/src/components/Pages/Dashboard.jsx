import React, { useEffect, useState } from "react";
import {
  FileText,
  Sparkles,
  LogOut,
  ArrowRight,
  Plus,
  BarChart3,
  CheckCircle2,
  Clock3,
  Target,
  Mic,
  Brain,
  Search,
  BookOpen,
  Briefcase,
  TrendingUp,
  Lightbulb,
  AlertCircle,
  FolderOpen,
  Compass,
  Award,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import BackButton from "../BackButton";
import { getToken, logout } from "../../lib/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function Dashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  // Career Progress data from MongoDB
  const [stats, setStats] = useState({
    resumesCreated: 0,
    jobsSaved: 0,
    applications: 0,
    interviews: 0,
    overallProgress: 0,
    interviewScore: 0,
    skillGapStatus: "Pending",
    recentActivities: [],
  });

  // ==========================================================
  // AUTH CHECK & DATA LOADING
  // ==========================================================

  useEffect(() => {
    const token = getToken() || localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    loadDashboardData();

    // Listen for storage events (e.g. interview completed in another tab)
    const handleStorageChange = (e) => {
      if (
        e.key === "lastInterviewScore" ||
        e.key === "careerProgress" ||
        e.key === "token"
      ) {
        loadDashboardData();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [navigate]);

  async function loadDashboardData() {
    const token = getToken() || localStorage.getItem("token");
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Load user profile
      const userPromise = fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null);

      // 2. Load dynamic MongoDB-backed career progress
      const progressPromise = fetch(`${API_URL}/api/career-progress`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null);

      const [userData, progressData] = await Promise.all([
        userPromise,
        progressPromise,
      ]);

      if (userData) {
        setUser(userData);
      }

      if (progressData && progressData.success && progressData.data) {
        const d = progressData.data;
        const localScore = Number(localStorage.getItem("lastInterviewScore")) || 0;
        const finalScore = Math.max(Number(d.interviewScore) || 0, localScore);

        setStats({
          resumesCreated: Number(d.resumesCreated) || 0,
          jobsSaved: Number(d.jobsSaved) || 0,
          applications: Number(d.applications) || 0,
          interviews: Number(d.interviews) || 0,
          overallProgress: Number(d.overallProgress) || 0,
          interviewScore: finalScore,
          skillGapStatus: d.skillGapStatus || "Pending",
          recentActivities: Array.isArray(d.recentActivities)
            ? d.recentActivities
            : [],
        });
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
      setError("Unable to load real-time career data. Please check connection.");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  const displayName =
    user?.name?.trim() ||
    user?.username ||
    "Student";

  // Derive intelligent recommendations based on actual progress
  const recommendations = [];
  if (stats.resumesCreated === 0) {
    recommendations.push({
      title: "Build Your Primary Resume",
      desc: "Create an ATS-tailored resume to establish your career foundation.",
      action: "Create Resume",
      path: "/resume",
      icon: Plus,
      color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    });
  } else {
    recommendations.push({
      title: "Run ATS Resume Analysis",
      desc: "Scan your resume against a target job description to eliminate keyword gaps.",
      action: "Run ATS Scan",
      path: "/ats",
      icon: CheckCircle2,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    });
  }

  if (stats.skillGapStatus !== "Completed") {
    recommendations.push({
      title: "Analyze Skill Gaps",
      desc: "Identify critical competencies required by employers for your dream role.",
      action: "Start Analysis",
      path: "/skill-gap",
      icon: Target,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    });
  }

  if (stats.interviews === 0) {
    recommendations.push({
      title: "Take a Mock Interview",
      desc: "Practice with AI or Question Bank modes to sharpen your responses.",
      action: "Start Interview",
      path: "/mock-interview",
      icon: Mic,
      color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    });
  } else {
    recommendations.push({
      title: "Explore Recommended Jobs",
      desc: "Browse positions matching your skills and track them in your Saved Jobs.",
      action: "Discover Jobs",
      path: "/jobs",
      icon: Briefcase,
      color: "text-teal bg-teal/10 border-teal/20",
    });
  }

  // Format activity type string into human-friendly text
  function formatActivityText(type, feature) {
    switch (type) {
      case "RESUME_CREATED":
        return "Created a new ATS-formatted resume";
      case "RESUME_UPDATED":
        return "Updated resume details";
      case "ATS_ANALYSIS":
        return "Executed an ATS resume analysis scan";
      case "MOCK_INTERVIEW":
        return "Completed an interview practice session";
      case "QUESTION_BANK_INTERVIEW":
        return "Practiced with Question Bank interview mode";
      case "SKILL_GAP_ANALYSIS":
        return "Completed target role skill gap analysis";
      case "JOB_MATCH":
        return "Analyzed resume match against a job description";
      case "JOB_SAVED":
        return "Saved a job opportunity to tracker";
      case "JOB_APPLIED":
        return "Submitted job application";
      case "CAREER_RECOMMENDATIONS":
        return "Generated career guidance roadmap";
      case "STUDENT_LOGIN":
        return "Logged into career workspace";
      default:
        return feature || type?.replace(/_/g, " ").toLowerCase() || "Workspace activity";
    }
  }

  return (
    <div className="w-full min-h-screen bg-background text-foreground selection:bg-indigo-500 selection:text-white">
      <div className="w-full min-w-0 px-4 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10 max-w-7xl mx-auto">
        {/* ====================================================
            HEADER
            ==================================================== */}
        <div className="flex flex-col gap-4 pb-8 sm:flex-row sm:items-center sm:justify-between border-b border-border/60">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <BackButton fallbackRoute="/home" />
              <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-500">
                <Sparkles className="h-3.5 w-3.5" />
                <span>CAREER COMMAND CENTER</span>
              </div>
            </div>

            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Welcome back, <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-600 bg-clip-text text-transparent">{displayName}</span> 👋
            </h1>

            <p className="mt-1.5 text-sm text-muted-foreground">
              Here is your real-time career readiness, verified activity, and recommended next steps.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => navigate("/career-progress")}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-semibold text-foreground transition hover:bg-secondary"
            >
              <TrendingUp className="h-4 w-4 text-indigo-500" />
              <span>Full Progress</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-semibold text-muted-foreground transition hover:bg-red-500/10 hover:text-red-500"
            >
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </button>
          </div>
        </div>

        {/* ERROR BANNER */}
        {error && (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-semibold text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ====================================================
            CORE METRIC STAT CARDS (REAL-TIME DB)
            ==================================================== */}
        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* STAT 1: CAREER READINESS */}
          <div
            onClick={() => navigate("/career-progress")}
            className="group cursor-pointer rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-500/40 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Career Readiness
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-foreground">
                {loading ? "..." : `${stats.overallProgress}%`}
              </span>
              <span className="text-xs font-bold text-indigo-500">
                {stats.overallProgress === 100 ? "Ready to Apply" : "In Progress"}
              </span>
            </div>
            {/* Visual Mini Progress Bar */}
            <div className="mt-3 h-1.5 w-full rounded-full bg-border/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-700"
                style={{ width: `${stats.overallProgress}%` }}
              />
            </div>
          </div>

          {/* STAT 2: RESUMES CREATED */}
          <div
            onClick={() => navigate("/total-resumes")}
            className="group cursor-pointer rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-teal/40 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Resumes Created
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal/10 text-teal">
                <FileText className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-foreground">
                {loading ? "..." : stats.resumesCreated}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                ATS format
              </span>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground truncate">
              {stats.resumesCreated === 0 ? "Click to create your first resume" : "Manage & export in My Resumes"}
            </p>
          </div>

          {/* STAT 3: INTERVIEWS */}
          <div
            onClick={() => navigate("/mock-interview")}
            className="group cursor-pointer rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-purple-500/40 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Interviews Practiced
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                <Mic className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-foreground">
                {loading ? "..." : stats.interviews}
              </span>
              {stats.interviewScore > 0 && (
                <span className="text-xs font-bold text-purple-500">
                  {stats.interviewScore}% Score
                </span>
              )}
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground truncate">
              AI Mock + Question Bank sessions
            </p>
          </div>

          {/* STAT 4: APPLICATIONS & SAVED JOBS */}
          <div
            onClick={() => navigate("/saved-jobs")}
            className="group cursor-pointer rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Jobs & Applications
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                <Briefcase className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-foreground">
                {loading ? "..." : stats.applications}
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Applied ({stats.jobsSaved} saved)
              </span>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground truncate">
              Track job pipeline & deadlines
            </p>
          </div>
        </section>

        {/* ====================================================
            CAREER READINESS PILLARS BREAKDOWN
            ==================================================== */}
        <section className="mt-8 rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-6 border-b border-border/60">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Career Readiness Breakdown
              </h2>
              <p className="text-xs text-muted-foreground">
                Dynamic milestones tracked from your actions across the platform.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-secondary text-foreground self-start sm:self-auto">
              {stats.overallProgress}% Complete (4 Pillars)
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* PILLAR 1 */}
            <div className="rounded-2xl border border-border/70 bg-secondary/30 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground">Pillar 1</span>
                {stats.resumesCreated > 0 ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> 25%
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-muted-foreground">0%</span>
                )}
              </div>
              <h3 className="mt-2 text-sm font-bold text-foreground">Resume Foundation</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {stats.resumesCreated > 0
                  ? `${stats.resumesCreated} resume${stats.resumesCreated === 1 ? "" : "s"} created`
                  : "No resume created yet"}
              </p>
              <button
                type="button"
                onClick={() => navigate("/resume")}
                className="mt-4 text-xs font-bold text-indigo-500 hover:underline"
              >
                {stats.resumesCreated > 0 ? "Edit Resume →" : "Create Resume →"}
              </button>
            </div>

            {/* PILLAR 2 */}
            <div className="rounded-2xl border border-border/70 bg-secondary/30 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground">Pillar 2</span>
                {stats.skillGapStatus === "Completed" ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> 25%
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-muted-foreground">0%</span>
                )}
              </div>
              <h3 className="mt-2 text-sm font-bold text-foreground">Skill Gap Analysis</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {stats.skillGapStatus === "Completed"
                  ? "Target skills mapped"
                  : "Pending analysis"}
              </p>
              <button
                type="button"
                onClick={() => navigate("/skill-gap")}
                className="mt-4 text-xs font-bold text-indigo-500 hover:underline"
              >
                {stats.skillGapStatus === "Completed" ? "Review Gaps →" : "Analyze Skills →"}
              </button>
            </div>

            {/* PILLAR 3 */}
            <div className="rounded-2xl border border-border/70 bg-secondary/30 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground">Pillar 3</span>
                {stats.interviews > 0 || stats.interviewScore > 0 ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> 25%
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-muted-foreground">0%</span>
                )}
              </div>
              <h3 className="mt-2 text-sm font-bold text-foreground">Interview Mastery</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {stats.interviews > 0
                  ? `${stats.interviews} interview session${stats.interviews === 1 ? "" : "s"}`
                  : "No interviews taken"}
              </p>
              <button
                type="button"
                onClick={() => navigate("/mock-interview")}
                className="mt-4 text-xs font-bold text-indigo-500 hover:underline"
              >
                {stats.interviews > 0 ? "Practice Again →" : "Start Interview →"}
              </button>
            </div>

            {/* PILLAR 4 */}
            <div className="rounded-2xl border border-border/70 bg-secondary/30 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground">Pillar 4</span>
                {stats.applications > 0 || stats.jobsSaved > 0 ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> 25%
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-muted-foreground">0%</span>
                )}
              </div>
              <h3 className="mt-2 text-sm font-bold text-foreground">Job Applications</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {stats.applications > 0
                  ? `${stats.applications} application${stats.applications === 1 ? "" : "s"} submitted`
                  : stats.jobsSaved > 0
                  ? `${stats.jobsSaved} job${stats.jobsSaved === 1 ? "" : "s"} saved`
                  : "No jobs saved yet"}
              </p>
              <button
                type="button"
                onClick={() => navigate("/jobs")}
                className="mt-4 text-xs font-bold text-indigo-500 hover:underline"
              >
                Browse Jobs →
              </button>
            </div>
          </div>
        </section>

        {/* ====================================================
            RECOMMENDED NEXT STEPS & AI INSIGHT
            ==================================================== */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* RECOMMENDED NEXT STEPS (LEFT) */}
          <div className="lg:col-span-8">
            <h2 className="text-lg font-bold text-foreground">
              Recommended Next Steps
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Prioritized actions calculated from your active career milestones.
            </p>

            <div className="mt-4 space-y-3">
              {recommendations.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    onClick={() => navigate(item.path)}
                    className="group flex cursor-pointer items-center justify-between rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-500/40 hover:shadow-md sm:p-5"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${item.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-foreground group-hover:text-indigo-500 transition">
                          {item.title}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.desc}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="ml-3 shrink-0 rounded-xl bg-secondary px-3.5 py-2 text-xs font-bold text-foreground transition group-hover:bg-indigo-500 group-hover:text-white"
                    >
                      {item.action} →
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI CAREER INSIGHT CARD (RIGHT) */}
          <div className="lg:col-span-4">
            <div className="h-full rounded-3xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/10 via-card to-purple-500/10 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-500 uppercase tracking-wider">
                  <Brain className="h-4 w-4" />
                  <span>AI Career Insight</span>
                </div>

                <h3 className="mt-4 text-base font-bold text-foreground">
                  {stats.overallProgress >= 75
                    ? "You're Near Interview Readiness"
                    : stats.resumesCreated > 0
                    ? "Time to Optimize for ATS"
                    : "Lay Your Career Foundation"}
                </h3>

                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {stats.overallProgress >= 75
                    ? "Your resume and skill alignment are in great shape. Rehearse technical STAR responses using the offline Question Bank to polish your live interview presence."
                    : stats.resumesCreated > 0
                    ? "Recruiters filter over 75% of resumes using automated ATS systems. Run an ATS check to ensure keyword match before sending out applications."
                    : "Begin by drafting your primary resume with role-specific bullet points. Each section completed brings you closer to verified career readiness."}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => navigate(stats.resumesCreated === 0 ? "/resume" : "/mock-interview")}
                  className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/25 transition hover:bg-indigo-500"
                >
                  {stats.resumesCreated === 0 ? "Build First Resume" : "Practice Mock Interview"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================
            QUICK AI TOOLS DIRECTORY
            ==================================================== */}
        <section className="mt-12">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Quick AI Career Tools
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Direct access to all 8 intelligent tools in your workspace.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
            {/* TOOL 1 */}
            <div
              onClick={() => navigate("/resume")}
              className="group cursor-pointer rounded-2xl border border-border/80 bg-card p-4 transition hover:-translate-y-0.5 hover:border-indigo-500/40 hover:shadow-md"
            >
              <FileText className="h-5 w-5 text-indigo-500 group-hover:scale-110 transition-transform" />
              <h3 className="mt-3 text-xs font-bold text-foreground group-hover:text-indigo-500 transition">
                Resume Builder
              </h3>
              <p className="mt-1 text-[11px] text-muted-foreground">Create & edit ATS resumes</p>
            </div>

            {/* TOOL 2 */}
            <div
              onClick={() => navigate("/ats")}
              className="group cursor-pointer rounded-2xl border border-border/80 bg-card p-4 transition hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-md"
            >
              <CheckCircle2 className="h-5 w-5 text-emerald-500 group-hover:scale-110 transition-transform" />
              <h3 className="mt-3 text-xs font-bold text-foreground group-hover:text-emerald-500 transition">
                ATS Checker
              </h3>
              <p className="mt-1 text-[11px] text-muted-foreground">Audit keyword match score</p>
            </div>

            {/* TOOL 3 */}
            <div
              onClick={() => navigate("/job-match")}
              className="group cursor-pointer rounded-2xl border border-border/80 bg-card p-4 transition hover:-translate-y-0.5 hover:border-amber-500/40 hover:shadow-md"
            >
              <Search className="h-5 w-5 text-amber-500 group-hover:scale-110 transition-transform" />
              <h3 className="mt-3 text-xs font-bold text-foreground group-hover:text-amber-500 transition">
                AI Job Match
              </h3>
              <p className="mt-1 text-[11px] text-muted-foreground">Compare skills vs role criteria</p>
            </div>

            {/* TOOL 4 */}
            <div
              onClick={() => navigate("/mock-interview")}
              className="group cursor-pointer rounded-2xl border border-border/80 bg-card p-4 transition hover:-translate-y-0.5 hover:border-purple-500/40 hover:shadow-md"
            >
              <Mic className="h-5 w-5 text-purple-500 group-hover:scale-110 transition-transform" />
              <h3 className="mt-3 text-xs font-bold text-foreground group-hover:text-purple-500 transition">
                Mock Interview
              </h3>
              <p className="mt-1 text-[11px] text-muted-foreground">AI + Question Bank modes</p>
            </div>

            {/* TOOL 5 */}
            <div
              onClick={() => navigate("/skill-gap")}
              className="group cursor-pointer rounded-2xl border border-border/80 bg-card p-4 transition hover:-translate-y-0.5 hover:border-teal/40 hover:shadow-md"
            >
              <Target className="h-5 w-5 text-teal group-hover:scale-110 transition-transform" />
              <h3 className="mt-3 text-xs font-bold text-foreground group-hover:text-teal transition">
                Skill Gap Analysis
              </h3>
              <p className="mt-1 text-[11px] text-muted-foreground">Identify missing credentials</p>
            </div>

            {/* TOOL 6 */}
            <div
              onClick={() => navigate("/career-recommendations")}
              className="group cursor-pointer rounded-2xl border border-border/80 bg-card p-4 transition hover:-translate-y-0.5 hover:border-rose-500/40 hover:shadow-md"
            >
              <Lightbulb className="h-5 w-5 text-rose-500 group-hover:scale-110 transition-transform" />
              <h3 className="mt-3 text-xs font-bold text-foreground group-hover:text-rose-500 transition">
                Career Assistant
              </h3>
              <p className="mt-1 text-[11px] text-muted-foreground">Personalized career trajectory</p>
            </div>

            {/* TOOL 7 */}
            <div
              onClick={() => navigate("/jobs")}
              className="group cursor-pointer rounded-2xl border border-border/80 bg-card p-4 transition hover:-translate-y-0.5 hover:border-blue-500/40 hover:shadow-md"
            >
              <Briefcase className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" />
              <h3 className="mt-3 text-xs font-bold text-foreground group-hover:text-blue-500 transition">
                Job Search
              </h3>
              <p className="mt-1 text-[11px] text-muted-foreground">Discover roles & save jobs</p>
            </div>

            {/* TOOL 8 */}
            <div
              onClick={() => navigate("/templates")}
              className="group cursor-pointer rounded-2xl border border-border/80 bg-card p-4 transition hover:-translate-y-0.5 hover:border-indigo-600/40 hover:shadow-md"
            >
              <FolderOpen className="h-5 w-5 text-indigo-600 group-hover:scale-110 transition-transform" />
              <h3 className="mt-3 text-xs font-bold text-foreground group-hover:text-indigo-600 transition">
                Resume Templates
              </h3>
              <p className="mt-1 text-[11px] text-muted-foreground">Modern & Executive styles</p>
            </div>
          </div>
        </section>

        {/* ====================================================
            RECENT ACTIVITY TIMELINE (VERIFIED DATA)
            ==================================================== */}
        <section className="mt-12 pb-16">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Recent Career Activity
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Real-time activity logs recorded from your account.
              </p>
            </div>
            <button
              type="button"
              onClick={loadDashboardData}
              className="text-xs font-semibold text-indigo-500 hover:underline"
            >
              Refresh ↻
            </button>
          </div>

          <div className="mt-5 rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
            {stats.recentActivities.length > 0 ? (
              <div className="divide-y divide-border/60">
                {stats.recentActivities.map((act, index) => {
                  const dateStr = act.createdAt
                    ? new Date(act.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Recently";

                  return (
                    <div
                      key={act._id || index}
                      className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                          <Clock3 className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">
                            {formatActivityText(act.activityType, act.feature)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {act.activityType}
                          </p>
                        </div>
                      </div>

                      <span className="text-[11px] font-medium text-muted-foreground">
                        {dateStr}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                  <Clock3 className="h-5 w-5" />
                </div>
                <p className="mt-3 text-xs font-bold text-foreground">
                  No recent activity recorded yet
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground max-w-sm mx-auto">
                  As you create resumes, practice mock interviews, and save jobs, your activity timeline will update here automatically.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}