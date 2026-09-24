import React, { useEffect, useState, useRef } from "react";
import {
  Bell,
  ChevronDown,
  User,
  Menu,
  X,
  Sparkles,
  Search,
  CheckCircle2,
  FileText,
  Target,
  Mic,
  TrendingUp,
  Settings,
  BookOpen,
  Briefcase,
  Layers,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ThemeToggle from "../ui/ThemeToggle";
import { isAuthed, getToken, logout } from "../../lib/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Page metadata resolver for dynamic top header title & breadcrumbs
function getPageMeta(pathname, search = "") {
  const isQuestionBank =
    search.includes("mode=question-bank") || search.includes("mode=bank");

  if (pathname === "/db" || pathname === "/dashboard") {
    return {
      title: "Dashboard",
      category: null,
      subtitle: "Career overview and preparation",
    };
  }

  if (pathname === "/resume" || pathname === "/create-resume") {
    return {
      title: "Builder",
      category: "Resume",
      subtitle: "Create and manage your professional resume",
    };
  }

  if (
    pathname === "/total-resumes" ||
    pathname === "/resumes" ||
    pathname === "/my-resumes"
  ) {
    return {
      title: "My Resumes",
      category: "Resume",
      subtitle: "View, manage, and export your resumes",
    };
  }

  if (
    pathname === "/templates" ||
    pathname === "/resume-templates" ||
    pathname === "/template" ||
    pathname === "/template-builder"
  ) {
    return {
      title: "Templates",
      category: "Resume",
      subtitle: "Browse modern recruiter-approved designs",
    };
  }

  if (pathname === "/ats" || pathname === "/ats-checker") {
    return {
      title: "ATS Scanner",
      category: "Job Tools",
      subtitle: "Check keyword match and ATS compliance",
    };
  }

  if (pathname === "/job-match" || pathname === "/ai-job-match") {
    return {
      title: "Job Match",
      category: "Job Tools",
      subtitle: "Match your profile with target job descriptions",
    };
  }

  if (pathname === "/skill-gap" || pathname === "/skill-gap-analysis") {
    return {
      title: "Skill Gap",
      category: "Career Analysis",
      subtitle: "Identify and bridge missing competencies",
    };
  }

  if (
    pathname === "/career-recommendations" ||
    pathname === "/career-recommendation"
  ) {
    return {
      title: "Career Assistant",
      category: "Career Analysis",
      subtitle: "Personalized career guidance and roadmaps",
    };
  }

  if (
    pathname === "/mock-interview" ||
    pathname === "/ai-mock-interview" ||
    pathname === "/interview"
  ) {
    if (isQuestionBank) {
      return {
        title: "Question Bank",
        category: "Interview",
        subtitle: "Practice curated role-based questions offline",
      };
    }
    return {
      title: "AI Mock Interview",
      category: "Interview",
      subtitle: "Practice technical and behavioral interviews with AI",
    };
  }

  if (
    pathname === "/jobs" ||
    pathname === "/job-recommendations" ||
    pathname === "/job-recommendation"
  ) {
    return {
      title: "Recommendations",
      category: "Jobs",
      subtitle: "Discover roles tailored to your profile",
    };
  }

  if (pathname === "/saved-jobs" || pathname === "/saved-job") {
    return {
      title: "Saved Jobs",
      category: "Jobs",
      subtitle: "Manage your active job pipeline",
    };
  }

  if (pathname === "/career-progress" || pathname === "/progress") {
    return {
      title: "Career Progress",
      category: null,
      subtitle: "Track your real-time preparation metrics",
    };
  }

  if (pathname === "/setting" || pathname === "/settings") {
    return {
      title: "Settings",
      category: null,
      subtitle: "Workspace preferences and account settings",
    };
  }

  if (pathname === "/admin") {
    return {
      title: "Admin Analytics",
      category: null,
      subtitle: "Platform usage and student metrics",
    };
  }

  if (pathname === "/home") {
    return {
      title: "Home",
      category: null,
      subtitle: "AI Career Assistant overview",
    };
  }

  return {
    title: "AI Career Assistant",
    category: null,
    subtitle: "Intelligent career preparation platform",
  };
}

export default function Navbar({
  mobileOpen = false,
  setMobileOpen = () => {},
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const [authed, setAuthed] = useState(isAuthed());
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  const pageMeta = getPageMeta(location.pathname, location.search);

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Listen for Ctrl+K / Cmd+K to open search modal
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowSearchModal((prev) => !prev);
      }
      if (e.key === "Escape") {
        setShowSearchModal(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Sync auth state and load user profile
  useEffect(() => {
    setAuthed(isAuthed());
    setShowProfile(false);
    setShowNotifications(false);

    if (isAuthed()) {
      loadUser();
    } else {
      setUser(null);
    }
  }, [location.pathname]);

  async function loadUser() {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (err) {
      console.error("Navbar user load error:", err);
    }
  }

  function handleLogout() {
    logout();
    setUser(null);
    setAuthed(false);
    setShowProfile(false);
    setShowNotifications(false);
    navigate("/");
  }

  const displayName = user?.name?.trim() || user?.username || "Student";
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "S";

  // Search items for command palette
  const searchableTools = [
    { name: "Dashboard", path: "/db", icon: Sparkles, desc: "Command center overview" },
    { name: "Resume Builder", path: "/resume", icon: FileText, desc: "Create an ATS-tailored resume" },
    { name: "My Resumes", path: "/total-resumes", icon: FileText, desc: "Manage saved resumes" },
    { name: "ATS Scanner", path: "/ats", icon: CheckCircle2, desc: "Check keyword match score" },
    { name: "Job Match", path: "/job-match", icon: Target, desc: "Compare skills with job descriptions" },
    { name: "AI Mock Interview", path: "/mock-interview", icon: Mic, desc: "Practice with AI interviewer" },
    { name: "Question Bank", path: "/mock-interview?mode=question-bank", icon: BookOpen, desc: "Offline curated questions" },
    { name: "Skill Gap Analysis", path: "/skill-gap", icon: Target, desc: "Bridge missing skills" },
    { name: "Career Assistant", path: "/career-recommendations", icon: Sparkles, desc: "Role roadmaps & guidance" },
    { name: "Career Progress", path: "/career-progress", icon: TrendingUp, desc: "Track readiness milestones" },
    { name: "Job Search", path: "/jobs", icon: Briefcase, desc: "Discover recommendations" },
    { name: "Settings", path: "/setting", icon: Settings, desc: "Preferences & profile" },
  ];

  const filteredTools = searchableTools.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* ======================================================
          TOP HEADER
          ====================================================== */}
      <header
        className="fixed top-0 right-0 left-0 z-40 h-16 border-b border-border/60 bg-background/80 backdrop-blur-md transition-[left] duration-200 md:left-[var(--sidebar-width,256px)] select-none"
      >
        <div className="flex h-full w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          {/* ==================================================
              LEFT: COMPACT PAGE TITLE & BREADCRUMB
              ================================================== */}
          <div className="flex items-center gap-3 min-w-0">
            {/* MOBILE MENU TOGGLE */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background text-foreground hover:bg-secondary md:hidden transition"
              aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>

            {/* DYNAMIC BREADCRUMB & TITLE */}
            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-foreground tracking-tight truncate">
                {pageMeta.category && (
                  <>
                    <span className="text-muted-foreground font-medium text-xs">
                      {pageMeta.category}
                    </span>
                    <span className="text-muted-foreground/40 text-xs font-normal">/</span>
                  </>
                )}
                <span className="truncate">{pageMeta.title}</span>
              </div>

              <span className="hidden sm:block text-[11px] text-muted-foreground truncate">
                {pageMeta.subtitle}
              </span>
            </div>
          </div>

          {/* ==================================================
              CENTER: QUICK SEARCH COMMAND TRIGGER
              ================================================== */}
          <div className="hidden md:flex items-center justify-center flex-1 max-w-sm px-4">
            <button
              type="button"
              onClick={() => setShowSearchModal(true)}
              className="flex w-full items-center justify-between rounded-xl border border-border/70 bg-secondary/35 px-3 py-1.5 text-xs text-muted-foreground hover:border-border hover:bg-secondary/60 transition"
              aria-label="Search tools"
            >
              <div className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-muted-foreground/80" />
                <span>Search tools or features...</span>
              </div>
              <kbd className="pointer-events-none rounded border border-border/80 bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                Ctrl K
              </kbd>
            </button>
          </div>

          {/* ==================================================
              RIGHT: SEARCH / THEME / NOTIFICATIONS / PROFILE
              ================================================== */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
            {/* MOBILE SEARCH ICON BUTTON */}
            <button
              type="button"
              onClick={() => setShowSearchModal(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden transition"
              aria-label="Search tools"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* THEME TOGGLE (COMPACT ICON BUTTON) */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background transition hover:bg-secondary">
              <ThemeToggle />
            </div>

            {/* NOTIFICATIONS */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => {
                  setShowNotifications((prev) => !prev);
                  setShowProfile(false);
                }}
                className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background text-muted-foreground hover:bg-secondary hover:text-foreground transition"
                aria-label="Notifications"
                aria-expanded={showNotifications}
              >
                <Bell className="h-4 w-4" />
                {/* Subtle indicator dot */}
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-indigo-500" />
              </button>

              {/* NOTIFICATIONS DROPDOWN */}
              {showNotifications && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-72 sm:w-80 rounded-2xl border border-border/80 bg-card p-3 shadow-xl backdrop-blur-md">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2.5 px-1">
                    <span className="text-xs font-bold text-foreground">Notifications</span>
                    <span className="text-[10px] font-semibold text-indigo-500">Live Updates</span>
                  </div>

                  <div className="mt-2 space-y-2">
                    <div className="rounded-xl bg-secondary/50 p-2.5 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-foreground">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                        <span>AI Career Assistant</span>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                        Ready to prepare for your next opportunity. Run an ATS scan or mock interview.
                      </p>
                    </div>

                    <div className="rounded-xl bg-secondary/50 p-2.5 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Offline Question Bank</span>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                        Zero-latency practice mode is active with curated technical questions.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="mt-2.5 w-full rounded-lg py-1.5 text-center text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>

            {/* USER PROFILE */}
            {authed ? (
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfile((prev) => !prev);
                    setShowNotifications(false);
                  }}
                  className="flex h-9 items-center gap-2 rounded-xl border border-border/60 bg-background px-2 hover:bg-secondary transition"
                  aria-label="User profile menu"
                  aria-expanded={showProfile}
                >
                  {/* AVATAR BADGE */}
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-800 text-[10px] font-bold text-white shadow-xs">
                    {initials}
                  </div>

                  {/* USER NAME */}
                  <div className="hidden sm:block text-left min-w-0 max-w-[110px]">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {displayName}
                    </p>
                  </div>

                  <ChevronDown
                    className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${
                      showProfile ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* PROFILE DROPDOWN */}
                {showProfile && (
                  <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-60 rounded-2xl border border-border/80 bg-card p-1.5 shadow-xl backdrop-blur-md">
                    {/* USER CARD HEADER */}
                    <div className="rounded-xl bg-secondary/50 p-3 mb-1">
                      <p className="text-xs font-bold text-foreground truncate">
                        {displayName}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {user?.username ? `@${user.username}` : "Career Workspace"}
                      </p>
                    </div>

                    {/* LINKS */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfile(false);
                        navigate("/db");
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                      <span>Dashboard</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowProfile(false);
                        navigate("/career-progress");
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition"
                    >
                      <TrendingUp className="h-3.5 w-3.5 text-teal" />
                      <span>Career Progress</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowProfile(false);
                        navigate("/setting");
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition"
                    >
                      <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Settings</span>
                    </button>

                    <div className="my-1 h-px bg-border/60" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/10 transition"
                    >
                      <span>Log out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  to="/"
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition shadow-sm"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ======================================================
          SEARCH MODAL / COMMAND PALETTE (CTRL+K)
          ====================================================== */}
      {showSearchModal && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-xs">
          <div
            className="w-full max-w-lg rounded-2xl border border-border/80 bg-card p-3 shadow-2xl backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* SEARCH INPUT */}
            <div className="flex items-center gap-2.5 border-b border-border/60 pb-2.5 px-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                autoFocus
                placeholder="Jump to tool or feature..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-foreground outline-hidden placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={() => setShowSearchModal(false)}
                className="rounded p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* RESULTS LIST */}
            <div className="mt-2 max-h-72 overflow-y-auto space-y-1">
              {filteredTools.length > 0 ? (
                filteredTools.map((tool) => {
                  const ToolIcon = tool.icon;
                  return (
                    <button
                      key={tool.name}
                      type="button"
                      onClick={() => {
                        navigate(tool.path);
                        setShowSearchModal(false);
                        setSearchQuery("");
                      }}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-secondary/70 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                          <ToolIcon className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">{tool.name}</p>
                          <p className="text-[10px] text-muted-foreground">{tool.desc}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground">Jump →</span>
                    </button>
                  );
                })
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  No matching tools found.
                </div>
              )}
            </div>

            <div className="mt-2 border-t border-border/60 pt-2 px-2 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Navigate with arrow keys or click</span>
              <span>ESC to close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}