import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Brain,
  Compass,
  Briefcase,
  Target,
  Mic,
  BookOpen,
  TrendingUp,
  CheckCircle2,
  Award,
  ArrowRight,
  Search,
  Zap,
  BarChart3,
  ShieldCheck,
  FileText,
  Lightbulb,
  GraduationCap,
  Clock3,
  ChevronRight,
  Layers,
  Bot,
  Check,
} from "lucide-react";
import { isAuthed } from "../../lib/auth";

// ============================================================
// MOBILE RESPONSIVE STYLES
// ============================================================

function MobileHomeStyles() {
  return (
    <style>{`
      @media (max-width: 767px) {
        .home-page {
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100% !important;
          margin-left: 0 !important;
          margin-right: 0 !important;
          overflow-x: hidden !important;
        }

        .home-page *,
        .home-page *::before,
        .home-page *::after {
          box-sizing: border-box;
        }

        .home-page img,
        .home-page video,
        .home-page canvas,
        .home-page svg {
          max-width: 100%;
        }

        .home-page button {
          -webkit-tap-highlight-color: transparent;
        }

        .home-page section,
        .home-page > div {
          min-width: 0;
          max-width: 100%;
        }

        .home-page h1,
        .home-page h2,
        .home-page h3,
        .home-page p,
        .home-page span {
          max-width: 100%;
        }
      }

      @keyframes floatSlow {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-8px); }
      }

      @keyframes pulseGlow {
        0%, 100% { opacity: 0.4; transform: scale(1); }
        50% { opacity: 0.8; transform: scale(1.05); }
      }

      @media (prefers-reduced-motion: no-preference) {
        .animate-float-slow {
          animation: floatSlow 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: floatSlow 7s ease-in-out 2s infinite;
        }
        .animate-pulse-glow {
          animation: pulseGlow 4s ease-in-out infinite;
        }
      }
    `}</style>
  );
}

// ============================================================
// SCROLL REVEAL HOOK
// ============================================================

function useScrollReveal(options = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: options.threshold ?? 0.12,
        rootMargin: options.rootMargin ?? "0px 0px -40px 0px",
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options.threshold, options.rootMargin]);

  return [ref, visible];
}

// ============================================================
// REVEAL ANIMATION WRAPPER
// ============================================================

function Reveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  duration = 650,
}) {
  const [ref, visible] = useScrollReveal();

  const directionClasses = {
    up: visible
      ? "translate-y-0 opacity-100"
      : "translate-y-8 opacity-0",
    down: visible
      ? "translate-y-0 opacity-100"
      : "-translate-y-8 opacity-0",
    left: visible
      ? "translate-x-0 opacity-100"
      : "-translate-x-8 opacity-0",
    right: visible
      ? "translate-x-0 opacity-100"
      : "translate-x-8 opacity-0",
    scale: visible
      ? "scale-100 opacity-100"
      : "scale-95 opacity-0",
  };

  return (
    <div
      ref={ref}
      className={`
        ${className}
        transform
        ${directionClasses[direction] || directionClasses.up}
      `}
      style={{
        transitionProperty: "opacity, transform",
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ============================================================
// AI CAREER ASSISTANT HERO VISUAL
// ============================================================

function CareerAssistantVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[540px] px-2 sm:px-4 lg:mx-0">
      {/* GLOWING AMBIENT BACKGROUND */}
      <div className="animate-pulse-glow absolute -inset-4 rounded-full bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/10 blur-3xl pointer-events-none" />

      {/* MAIN CAREER HUB CONTAINER */}
      <div className="relative rounded-3xl border border-indigo-500/20 bg-background/80 p-5 shadow-2xl backdrop-blur-xl sm:p-7">
        {/* TOP STATUS BAR */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-3 w-3 items-center justify-center">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Career Neural Core Active
            </span>
          </div>

          <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[11px] font-bold text-indigo-500">
            AI Assistant 2.0
          </span>
        </div>

        {/* CENTRAL ASSISTANT INTELLIGENCE CARD */}
        <div className="mt-5 rounded-2xl border border-border/80 bg-secondary/50 p-4 sm:p-5">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25">
              <Brain className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-foreground">
                  AI Career Coach
                </h4>
                <span className="text-[10px] text-muted-foreground">Just now</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                "Profile analyzed. You're 3 steps away from 100% career readiness for Senior Full Stack Engineer roles."
              </p>
            </div>
          </div>

          {/* READINESS PROGRESS BAR */}
          <div className="mt-4 pt-3 border-t border-border/50">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-muted-foreground">Overall Career Readiness</span>
              <span className="text-indigo-500 font-bold">85% Complete</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-border/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 transition-all duration-1000"
                style={{ width: "85%" }}
              />
            </div>
          </div>
        </div>

        {/* CONNECTED CAREER NODES GRID */}
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
          {/* NODE 1: ATS SCORE */}
          <div className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-card p-3 shadow-sm transition hover:border-emerald-500/40">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 font-bold text-xs">
              ✓
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-foreground truncate">ATS Optimization</p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">92% Match Score</p>
            </div>
          </div>

          {/* NODE 2: MOCK INTERVIEW */}
          <div className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-card p-3 shadow-sm transition hover:border-indigo-500/40">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
              <Mic className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-foreground truncate">Mock Interview</p>
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">AI + Question Bank</p>
            </div>
          </div>

          {/* NODE 3: SKILL GAP */}
          <div className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-card p-3 shadow-sm transition hover:border-amber-500/40">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Target className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-foreground truncate">Skill Gap Analysis</p>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">2 Roadmaps Ready</p>
            </div>
          </div>

          {/* NODE 4: JOB MATCH */}
          <div className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-card p-3 shadow-sm transition hover:border-purple-500/40">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
              <Briefcase className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-foreground truncate">Job Matching</p>
              <p className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">14 Open Roles</p>
            </div>
          </div>
        </div>

        {/* FLOATING BADGE 1 (TOP RIGHT) */}
        <div className="animate-float-slow absolute -right-3 -top-4 hidden items-center gap-2 rounded-2xl border border-indigo-500/30 bg-background/95 px-3.5 py-2 shadow-xl backdrop-blur-md sm:flex">
          <Sparkles className="h-4 w-4 text-indigo-500" />
          <span className="text-xs font-bold text-foreground">Dual Interview Modes</span>
        </div>

        {/* FLOATING BADGE 2 (BOTTOM LEFT) */}
        <div className="animate-float-delayed absolute -bottom-3 -left-3 hidden items-center gap-2 rounded-2xl border border-emerald-500/30 bg-background/95 px-3.5 py-2 shadow-xl backdrop-blur-md sm:flex">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span className="text-xs font-bold text-foreground">Recruiter Ready</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CONVERSATIONAL PREVIEW TABS
// ============================================================

function InteractiveGuidanceShowcase() {
  const [activeTab, setActiveTab] = useState("interview");

  const tabs = [
    {
      id: "interview",
      label: "Mock Interview",
      icon: Mic,
      color: "text-indigo-500",
    },
    {
      id: "ats",
      label: "ATS Audit",
      icon: CheckCircle2,
      color: "text-emerald-500",
    },
    {
      id: "skillgap",
      label: "Skill Gap Plan",
      icon: Target,
      color: "text-amber-500",
    },
    {
      id: "career",
      label: "Career Roadmap",
      icon: Compass,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-3xl border border-border/80 bg-card shadow-xl backdrop-blur-sm">
      {/* TABS HEADER */}
      <div className="flex border-b border-border/60 bg-secondary/30 p-2 sm:gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition sm:text-sm ${
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              }`}
            >
              <Icon className={`h-4 w-4 ${tab.color}`} />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}
      <div className="p-5 sm:p-8">
        {activeTab === "interview" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 sm:p-5">
              <div className="flex items-center justify-between text-xs font-semibold text-indigo-500">
                <span className="flex items-center gap-1.5">
                  <Bot className="h-4 w-4" />
                  AI Technical Interviewer (Full Stack Engineer)
                </span>
                <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 font-bold">
                  Question 3 of 5
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-foreground">
                "Explain the difference between optimistic UI updates and pessimistic UI updates in web applications. When would you choose one over the other?"
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-secondary/30 p-4 text-xs leading-relaxed text-muted-foreground">
              <span className="font-bold text-foreground">Candidate Response: </span>
              "Optimistic updates update the client UI immediately assuming the server will succeed, rolling back if an error occurs. Pessimistic updates wait for confirmation before mutating UI state..."
            </div>

            <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 p-3 sm:p-4 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>AI Evaluation: <strong>94/100</strong> · Excellent architectural distinction and rollback awareness.</span>
              </div>
              <span className="hidden sm:inline font-bold">Verified</span>
            </div>
          </div>
        )}

        {activeTab === "ats" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  Target Role: Cloud Solutions Architect
                </h4>
                <p className="text-xs text-muted-foreground">
                  Resume scanned against 450+ industry benchmark keywords
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-emerald-500">92%</span>
                <p className="text-[10px] text-muted-foreground font-semibold">ATS Compatibility</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  ✓ High-Impact Keywords Matched (12)
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Kubernetes, Terraform, AWS Lambda, Docker, Microservices, CI/CD, Redis, Go
                </p>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5">
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  ⚠️ Recommended Keywords to Add (2)
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Prometheus Monitoring, Istio Service Mesh
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "skillgap" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  Skill Gap Analysis: Machine Learning Engineer
                </h4>
                <p className="text-xs text-muted-foreground">
                  Actionable learning roadmap created based on your uploaded experience
                </p>
              </div>
              <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                2 Core Gaps
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between rounded-xl border border-border p-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/10 text-xs font-bold text-indigo-500">1</span>
                  <div>
                    <p className="text-xs font-bold text-foreground">Model Optimization & ONNX</p>
                    <p className="text-[11px] text-muted-foreground">Priority: High · Est. 10 hours</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-indigo-500">Start Guide →</span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border p-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-500/10 text-xs font-bold text-purple-500">2</span>
                  <div>
                    <p className="text-xs font-bold text-foreground">Vector Databases (Pinecone / Chroma)</p>
                    <p className="text-[11px] text-muted-foreground">Priority: Medium · Est. 6 hours</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-purple-500">Start Guide →</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "career" && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-bold text-foreground">
                Personalized Career Growth Trajectory
              </h4>
              <p className="text-xs text-muted-foreground">
                AI recommendations based on hiring trends in high-growth tech sectors
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-border p-3.5">
                <p className="text-xs font-bold text-indigo-500">Immediate Role</p>
                <p className="mt-1 text-sm font-bold text-foreground">Junior Full Stack</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Avg. $75,000 - $90,000</p>
              </div>

              <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-3.5">
                <p className="text-xs font-bold text-purple-500">In 2 Years</p>
                <p className="mt-1 text-sm font-bold text-foreground">Senior Systems Engineer</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Avg. $115,000 - $140,000</p>
              </div>

              <div className="rounded-xl border border-border p-3.5">
                <p className="text-xs font-bold text-emerald-500">In 5 Years</p>
                <p className="mt-1 text-sm font-bold text-foreground">Lead Solutions Architect</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Avg. $160,000 - $195,000</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// MAIN HOME COMPONENT
// ============================================================

export default function Home() {
  const navigate = useNavigate();
  const authed = isAuthed();

  function handleStartJourney() {
    if (authed) {
      navigate("/db");
    } else {
      navigate("/register");
    }
  }

  function handleExploreTools() {
    const el = document.getElementById("features");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/templates");
    }
  }

  return (
    <>
      <MobileHomeStyles />

      <div className="home-page min-h-screen w-full bg-background text-foreground selection:bg-indigo-500 selection:text-white">
        {/* ====================================================
            1. HERO SECTION
            ==================================================== */}
        <section className="relative overflow-hidden pt-10 pb-16 sm:pt-14 sm:pb-24 lg:pt-16 lg:pb-28">
          {/* BACKGROUND DECORATIONS */}
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -z-10 h-[500px] w-full max-w-7xl">
            <div className="absolute left-1/4 top-10 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
            <div className="absolute right-1/4 top-20 h-72 w-72 rounded-full bg-purple-500/15 blur-3xl" />
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
              {/* LEFT COLUMN: HERO HEADLINE & CTA */}
              <div className="text-center lg:col-span-7 lg:text-left">
                <Reveal direction="down" duration={500}>
                  <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1.5 text-xs font-bold text-indigo-500 shadow-sm backdrop-blur-md">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>NEXT-GENERATION AI CAREER PLATFORM</span>
                  </div>
                </Reveal>

                <Reveal direction="up" delay={80} duration={650}>
                  <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                    Your Personal{" "}
                    <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-600 bg-clip-text text-transparent">
                      AI Career Assistant
                    </span>
                  </h1>
                </Reveal>

                <Reveal direction="up" delay={160} duration={650}>
                  <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0 mx-auto">
                    Resume generation is just the starting point. Practice with dynamic AI mock interviews, audit your ATS match score, bridge skill gaps, and track your complete journey to getting hired.
                  </p>
                </Reveal>

                {/* DUAL CTAS */}
                <Reveal direction="up" delay={240} duration={650}>
                  <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row lg:justify-start">
                    <button
                      type="button"
                      onClick={handleStartJourney}
                      className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-500/25 transition duration-200 hover:-translate-y-0.5 hover:shadow-indigo-500/35 sm:w-auto"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>{authed ? "Go to Command Center" : "Start Your Career Journey"}</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>

                    <button
                      type="button"
                      onClick={handleExploreTools}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 text-sm font-semibold text-foreground transition hover:bg-secondary sm:w-auto"
                    >
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      <span>Explore AI Tools</span>
                    </button>
                  </div>
                </Reveal>

                {/* TRUST PILL HIGHLIGHTS */}
                <Reveal direction="up" delay={320} duration={650}>
                  <div className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-xs text-muted-foreground lg:justify-start">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Check className="h-4 w-4 text-emerald-500 stroke-[2.5]" />
                      <span>AI Mock Interviews</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <Check className="h-4 w-4 text-emerald-500 stroke-[2.5]" />
                      <span>Offline Question Bank</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <Check className="h-4 w-4 text-emerald-500 stroke-[2.5]" />
                      <span>ATS Resume Scanner</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <Check className="h-4 w-4 text-emerald-500 stroke-[2.5]" />
                      <span>Real-Time Progress</span>
                    </div>
                  </div>
                </Reveal>
              </div>

              {/* RIGHT COLUMN: AI CAREER VISUAL */}
              <div className="lg:col-span-5">
                <Reveal direction="scale" delay={180} duration={750}>
                  <CareerAssistantVisual />
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================
            2. ALL-IN-ONE PLATFORM FEATURE MATRIX
            ==================================================== */}
        <section id="features" className="scroll-mt-24 border-t border-border/60 bg-secondary/20 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal direction="up">
              <div className="text-center">
                <span className="rounded-full bg-indigo-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-indigo-500">
                  Complete Career Ecosystem
                </span>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                  Everything You Need to Become Career Ready
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                  Resume generation is just one piece. Prepare, practice, and track every stage of your job hunt with purpose-built AI tools.
                </p>
              </div>
            </Reveal>

            {/* 8 FEATURE CARDS GRID */}
            <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* CARD 1: RESUME BUILDER */}
              <Reveal delay={0} direction="up">
                <div
                  onClick={() => navigate("/resume")}
                  className="group relative flex h-full cursor-pointer flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-xl"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 transition group-hover:scale-105 group-hover:bg-indigo-500 group-hover:text-white">
                        <FileText className="h-6 w-6" />
                      </div>
                      <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                        Builder
                      </span>
                    </div>

                    <h3 className="mt-5 text-lg font-bold text-foreground group-hover:text-indigo-500 transition">
                      AI Resume Builder
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      Generate recruiter-ready, ATS-compliant resumes tailored to your target industry in minutes with AI bullet suggestions.
                    </p>
                  </div>

                  <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-indigo-500">
                    <span>Create Resume</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Reveal>

              {/* CARD 2: ATS CHECKER */}
              <Reveal delay={80} direction="up">
                <div
                  onClick={() => navigate("/ats")}
                  className="group relative flex h-full cursor-pointer flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-xl"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 transition group-hover:scale-105 group-hover:bg-emerald-500 group-hover:text-white">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        Optimization
                      </span>
                    </div>

                    <h3 className="mt-5 text-lg font-bold text-foreground group-hover:text-emerald-500 transition">
                      ATS Resume Analyzer
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      Scan your resume against real job descriptions to identify missing keywords, fix formatting flaws, and boost recruiter callbacks.
                    </p>
                  </div>

                  <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <span>Scan Resume</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Reveal>

              {/* CARD 3: AI JOB MATCH */}
              <Reveal delay={160} direction="up">
                <div
                  onClick={() => navigate("/job-match")}
                  className="group relative flex h-full cursor-pointer flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-xl"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 transition group-hover:scale-105 group-hover:bg-amber-500 group-hover:text-white">
                        <Search className="h-6 w-6" />
                      </div>
                      <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                        AI Fit
                      </span>
                    </div>

                    <h3 className="mt-5 text-lg font-bold text-foreground group-hover:text-amber-500 transition">
                      AI Job Match
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      Compare your resume against specific job requirements with deep semantic matching to reveal your exact alignment score.
                    </p>
                  </div>

                  <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                    <span>Match Job</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Reveal>

              {/* CARD 4: AI MOCK INTERVIEW */}
              <Reveal delay={240} direction="up">
                <div
                  onClick={() => navigate("/mock-interview")}
                  className="group relative flex h-full cursor-pointer flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/40 hover:shadow-xl"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 transition group-hover:scale-105 group-hover:bg-purple-500 group-hover:text-white">
                        <Mic className="h-6 w-6" />
                      </div>
                      <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-400">
                        AI Simulation
                      </span>
                    </div>

                    <h3 className="mt-5 text-lg font-bold text-foreground group-hover:text-purple-500 transition">
                      AI Mock Interview
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      Experience realistic, role-tailored technical and behavioral mock interviews with dynamic feedback and objective scoring.
                    </p>
                  </div>

                  <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-purple-500">
                    <span>Start AI Interview</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Reveal>

              {/* CARD 5: QUESTION BANK INTERVIEW */}
              <Reveal delay={0} direction="up">
                <div
                  onClick={() => navigate("/mock-interview")}
                  className="group relative flex h-full cursor-pointer flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-xl"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 transition group-hover:scale-105 group-hover:bg-blue-500 group-hover:text-white">
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                        Zero Latency
                      </span>
                    </div>

                    <h3 className="mt-5 text-lg font-bold text-foreground group-hover:text-blue-500 transition">
                      Question Bank Interview
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      Permanent, offline-ready question bank organized by role and difficulty level. Works instantly with zero AI API limits.
                    </p>
                  </div>

                  <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-blue-500">
                    <span>Practice Questions</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Reveal>

              {/* CARD 6: CAREER GUIDANCE */}
              <Reveal delay={80} direction="up">
                <div
                  onClick={() => navigate("/career-recommendations")}
                  className="group relative flex h-full cursor-pointer flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-rose-500/40 hover:shadow-xl"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 transition group-hover:scale-105 group-hover:bg-rose-500 group-hover:text-white">
                        <Lightbulb className="h-6 w-6" />
                      </div>
                      <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                        Guidance
                      </span>
                    </div>

                    <h3 className="mt-5 text-lg font-bold text-foreground group-hover:text-rose-500 transition">
                      Career Assistant & Guidance
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      Receive personalized role suggestions, high-growth career trajectories, and salary insights tailored to your profile.
                    </p>
                  </div>

                  <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-rose-500">
                    <span>Get Guidance</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Reveal>

              {/* CARD 7: SKILL GAP ANALYSIS */}
              <Reveal delay={160} direction="up">
                <div
                  onClick={() => navigate("/skill-gap")}
                  className="group relative flex h-full cursor-pointer flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-teal/40 hover:shadow-xl"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal/10 text-teal transition group-hover:scale-105 group-hover:bg-teal group-hover:text-white">
                        <Target className="h-6 w-6" />
                      </div>
                      <span className="rounded-full bg-teal/10 px-2.5 py-0.5 text-[10px] font-bold text-teal">
                        Skills
                      </span>
                    </div>

                    <h3 className="mt-5 text-lg font-bold text-foreground group-hover:text-teal transition">
                      Skill Gap Analysis
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      Discover exactly what technical skills you are missing for your target roles and unlock clear learning roadmaps to close them.
                    </p>
                  </div>

                  <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-teal">
                    <span>Analyze Skills</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Reveal>

              {/* CARD 8: CAREER PROGRESS */}
              <Reveal delay={240} direction="up">
                <div
                  onClick={() => navigate("/career-progress")}
                  className="group relative flex h-full cursor-pointer flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-600/40 hover:shadow-xl"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-600 transition group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white">
                        <TrendingUp className="h-6 w-6" />
                      </div>
                      <span className="rounded-full bg-indigo-600/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-600">
                        Real-Time
                      </span>
                    </div>

                    <h3 className="mt-5 text-lg font-bold text-foreground group-hover:text-indigo-600 transition">
                      Career Progress Tracker
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      Live dashboard tracking your resumes created, jobs saved, applications submitted, and interview readiness score.
                    </p>
                  </div>

                  <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-indigo-600">
                    <span>View Progress</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ====================================================
            3. CAREER JOURNEY ROADMAP (6 STEPS)
            ==================================================== */}
        <section id="journey" className="scroll-mt-24 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal direction="up">
              <div className="text-center">
                <span className="rounded-full bg-indigo-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-indigo-500">
                  Step-by-Step Path
                </span>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                  Your Career Journey, Powered by AI
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                  Follow a structured roadmap designed by engineering leaders and recruiters to elevate you from student to hired professional.
                </p>
              </div>
            </Reveal>

            {/* 6 ROADMAP CARDS */}
            <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* STEP 1 */}
              <Reveal delay={0} direction="up">
                <div className="relative rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-indigo-500/40">01</span>
                    <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[11px] font-bold text-indigo-500">
                      Build
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-bold text-foreground">
                    Build ATS-Optimized Resume
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    Draft a comprehensive resume using structured templates and AI-powered accomplishment statements tailored to your role.
                  </p>
                </div>
              </Reveal>

              {/* STEP 2 */}
              <Reveal delay={80} direction="up">
                <div className="relative rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-emerald-500/40">02</span>
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-500">
                      Analyze
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-bold text-foreground">
                    Run ATS & Keyword Audit
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    Verify keyword density, structure, and readability against target industry job descriptions before sending applications.
                  </p>
                </div>
              </Reveal>

              {/* STEP 3 */}
              <Reveal delay={160} direction="up">
                <div className="relative rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-amber-500/40">03</span>
                    <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-500">
                      Discover
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-bold text-foreground">
                    Match & Save High-Fit Jobs
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    Discover jobs suited to your skill set and save them directly in your tracker to monitor application deadlines.
                  </p>
                </div>
              </Reveal>

              {/* STEP 4 */}
              <Reveal delay={240} direction="up">
                <div className="relative rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-purple-500/40">04</span>
                    <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[11px] font-bold text-purple-500">
                      Practice
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-bold text-foreground">
                    Simulate Mock Interviews
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    Take AI mock interviews or practice with curated offline question banks to build confidence and articulate complex concepts.
                  </p>
                </div>
              </Reveal>

              {/* STEP 5 */}
              <Reveal delay={320} direction="up">
                <div className="relative rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-rose-500/40">05</span>
                    <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-bold text-rose-500">
                      Improve
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-bold text-foreground">
                    Close Skill & Experience Gaps
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    Execute recommended skill roadmaps to acquire must-have industry tools and framework competencies before interviews.
                  </p>
                </div>
              </Reveal>

              {/* STEP 6 */}
              <Reveal delay={400} direction="up">
                <div className="relative rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-teal/40">06</span>
                    <span className="rounded-full bg-teal/10 px-2.5 py-0.5 text-[11px] font-bold text-teal">
                      Track
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-bold text-foreground">
                    Achieve 100% Career Readiness
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    Track your overall progress score across all 4 pillars until you are verified and recruiter-ready.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ====================================================
            4. MEET YOUR AI CAREER ASSISTANT (CONVERSATIONAL PREVIEW)
            ==================================================== */}
        <section className="border-t border-border/60 bg-secondary/30 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal direction="up">
              <div className="text-center">
                <span className="rounded-full bg-indigo-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-indigo-500">
                  Interactive Intelligence
                </span>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                  Meet Your AI Career Assistant
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                  See how the assistant analyzes your resume, evaluates mock interview responses, and charts your path forward.
                </p>
              </div>
            </Reveal>

            <div className="mt-14">
              <Reveal direction="scale" delay={120}>
                <InteractiveGuidanceShowcase />
              </Reveal>
            </div>
          </div>
        </section>

        {/* ====================================================
            5. CAREER READINESS 4-PILLAR GAUGE
            ==================================================== */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-card via-card to-indigo-500/5 p-8 sm:p-12 lg:p-16 shadow-xl">
              <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
                <div className="lg:col-span-7">
                  <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-500 uppercase tracking-wider">
                    Dynamic Career Metrics
                  </span>
                  <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                    Every Action Propels Your Career Readiness Score
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    Unlike standard resume builders that leave you guessing, AI Career Assistant calculates a real-time progress score across 4 objective preparation milestones.
                  </p>

                  {/* 4 PILLARS PROGRESS BREAKDOWN */}
                  <div className="mt-8 space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-foreground">Pillar 1: ATS Resume Created</span>
                        <span className="text-indigo-500">+25%</span>
                      </div>
                      <div className="mt-1.5 h-2 w-full rounded-full bg-border/60">
                        <div className="h-full rounded-full bg-indigo-500 w-full" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-foreground">Pillar 2: Skill Gap Analysis Completed</span>
                        <span className="text-purple-500">+25%</span>
                      </div>
                      <div className="mt-1.5 h-2 w-full rounded-full bg-border/60">
                        <div className="h-full rounded-full bg-purple-500 w-full" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-foreground">Pillar 3: Mock Interview Completed</span>
                        <span className="text-emerald-500">+25%</span>
                      </div>
                      <div className="mt-1.5 h-2 w-full rounded-full bg-border/60">
                        <div className="h-full rounded-full bg-emerald-500 w-full" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-foreground">Pillar 4: Jobs Saved or Applied</span>
                        <span className="text-teal">+25%</span>
                      </div>
                      <div className="mt-1.5 h-2 w-full rounded-full bg-border/60">
                        <div className="h-full rounded-full bg-teal w-full" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* GAUGE STAT CARD */}
                <div className="text-center lg:col-span-5">
                  <div className="mx-auto flex h-48 w-48 sm:h-56 sm:w-56 flex-col items-center justify-center rounded-full border-8 border-indigo-500/20 bg-card p-6 shadow-2xl">
                    <span className="text-4xl sm:text-5xl font-black text-indigo-500">100%</span>
                    <span className="mt-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Career Ready
                    </span>
                    <span className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      Recruiter Approved
                    </span>
                  </div>

                  <p className="mt-6 text-xs text-muted-foreground">
                    Saved in MongoDB. Fully isolated per student account.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================
            6. TRUST & VALUE (WHY CHOOSE)
            ==================================================== */}
        <section className="border-t border-border/60 bg-secondary/20 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal direction="up">
              <div className="text-center">
                <span className="rounded-full bg-indigo-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-indigo-500">
                  Engineered For Results
                </span>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Why Students Choose AI Career Assistant
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
                  A modern platform built with high reliability, privacy, and tangible career outcomes in mind.
                </p>
              </div>
            </Reveal>

            <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                  <Brain className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-sm font-bold text-foreground">Complete Ecosystem</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  No more switching across 5 different apps. Resume, ATS, matching, interviews, and tracking all under one roof.
                </p>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-sm font-bold text-foreground">Dual Interview Engine</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Use dynamic AI interviews when connected, or switch to the curated Question Bank for zero-latency offline practice.
                </p>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-sm font-bold text-foreground">Real-Time Data</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  No hardcoded or simulated statistics. Your dashboard is connected live to actual database actions and milestones.
                </p>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-sm font-bold text-foreground">Privacy & Security</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Your resumes, interview notes, and activity data remain strictly isolated and protected behind JWT authentication.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================
            7. FINAL CAREER CTA
            ==================================================== */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal direction="scale" duration={750}>
              <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 px-6 py-14 text-center text-white shadow-2xl sm:px-12 sm:py-20">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 backdrop-blur-md">
                  <Sparkles className="h-7 w-7" />
                </div>

                <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                  Ready to Build Your Career With AI?
                </h2>

                <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
                  Join students and job seekers using AI Career Assistant to build resumes, pass technical interviews, and land offers.
                </p>

                <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleStartJourney}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 sm:w-auto"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>{authed ? "Open Command Center" : "Get Started Free"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/career-progress")}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20 sm:w-auto"
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span>View Career Progress</span>
                  </button>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* BOTTOM SPACING */}
        <div className="h-10 w-full" />
      </div>
    </>
  );
}