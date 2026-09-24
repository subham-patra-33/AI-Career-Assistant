import React, { useEffect, useState } from "react";
import {
  Sparkles,
  LayoutDashboard,
  FileText,
  FileStack,
  LayoutTemplate,
  Target,
  Search,
  Lightbulb,
  BarChart3,
  CheckCircle2,
  BriefcaseBusiness,
  Briefcase,
  Bookmark,
  Mic,
  BookOpen,
  TrendingUp,
  Settings,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

// ============================================================
// NAVIGATION STRUCTURE (SAAS SPEC)
// ============================================================

const WORKSPACE_NAV = [
  {
    type: "single",
    label: "Dashboard",
    path: "/db",
    icon: LayoutDashboard,
  },
  {
    type: "group",
    label: "Resume",
    icon: FileText,
    primaryPath: "/resume",
    children: [
      {
        label: "Builder",
        path: "/resume",
        icon: FileText,
      },
      {
        label: "My Resumes",
        path: "/total-resumes",
        icon: FileStack,
      },
      {
        label: "Templates",
        path: "/templates",
        icon: LayoutTemplate,
      },
    ],
  },
  {
    type: "group",
    label: "Career Analysis",
    icon: Target,
    primaryPath: "/skill-gap",
    children: [
      {
        label: "Skill Gap",
        path: "/skill-gap",
        icon: Search,
      },
      {
        label: "Career Assistant",
        path: "/career-recommendations",
        icon: Lightbulb,
      },
    ],
  },
  {
    type: "group",
    label: "Resume & Job Tools",
    icon: BarChart3,
    primaryPath: "/ats",
    children: [
      {
        label: "ATS Scanner",
        path: "/ats",
        icon: CheckCircle2,
      },
      {
        label: "Job Match",
        path: "/job-match",
        icon: BriefcaseBusiness,
      },
    ],
  },
  {
    type: "group",
    label: "Jobs",
    icon: Briefcase,
    primaryPath: "/jobs",
    children: [
      {
        label: "Recommendations",
        path: "/jobs",
        icon: Search,
      },
      {
        label: "Saved Jobs",
        path: "/saved-jobs",
        icon: Bookmark,
      },
    ],
  },
  {
    type: "group",
    label: "Interview",
    icon: Mic,
    primaryPath: "/mock-interview",
    children: [
      {
        label: "AI Mock Interview",
        path: "/mock-interview",
        icon: Mic,
      },
      {
        label: "Question Bank",
        path: "/mock-interview?mode=question-bank",
        icon: BookOpen,
      },
    ],
  },
  {
    type: "single",
    label: "Career Progress",
    path: "/career-progress",
    icon: TrendingUp,
  },
];

const SETTINGS_NAV = [
  {
    type: "single",
    label: "Settings",
    path: "/setting",
    icon: Settings,
  },
];

// Helper to determine active state
const isPathActive = (location, targetPath) => {
  if (!targetPath) return false;

  const currentPath = location.pathname;
  const currentSearch = location.search;

  // Question bank exact check
  if (targetPath.includes("mode=question-bank")) {
    return (
      (currentPath === "/mock-interview" || currentPath === "/ai-mock-interview") &&
      (currentSearch.includes("mode=question-bank") || currentSearch.includes("mode=bank"))
    );
  }

  // AI Mock Interview exact check (without bank param)
  if (targetPath === "/mock-interview") {
    if (
      currentSearch.includes("mode=question-bank") ||
      currentSearch.includes("mode=bank")
    ) {
      return false;
    }
    return (
      currentPath === "/mock-interview" ||
      currentPath === "/ai-mock-interview" ||
      currentPath === "/interview"
    );
  }

  // Exact path or aliases
  if (currentPath === targetPath) return true;

  if (targetPath === "/resume" && currentPath === "/create-resume") return true;
  if (
    targetPath === "/total-resumes" &&
    (currentPath === "/resumes" || currentPath === "/my-resumes")
  ) {
    return true;
  }
  if (
    targetPath === "/templates" &&
    (currentPath === "/resume-templates" ||
      currentPath === "/template" ||
      currentPath === "/template-builder")
  ) {
    return true;
  }
  if (targetPath === "/ats" && currentPath === "/ats-checker") return true;
  if (targetPath === "/job-match" && currentPath === "/ai-job-match") return true;
  if (targetPath === "/skill-gap" && currentPath === "/skill-gap-analysis") return true;
  if (
    targetPath === "/career-recommendations" &&
    currentPath === "/career-recommendation"
  ) {
    return true;
  }
  if (
    targetPath === "/jobs" &&
    (currentPath === "/job-recommendations" || currentPath === "/job-recommendation")
  ) {
    return true;
  }
  if (targetPath === "/saved-jobs" && currentPath === "/saved-job") return true;
  if (targetPath === "/career-progress" && currentPath === "/progress") return true;
  if (targetPath === "/setting" && currentPath === "/settings") return true;
  if (targetPath === "/db" && currentPath === "/dashboard") return true;

  return false;
};

export default function Sidebar({
  mobileOpen = false,
  setMobileOpen = () => {},
}) {
  const navigate = useNavigate();
  const location = useLocation();

  // Desktop Collapsed State
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  // Accordion open groups
  const [openGroups, setOpenGroups] = useState({
    Resume: false,
    "Career Analysis": false,
    "Resume & Job Tools": false,
    Jobs: false,
    Interview: false,
  });

  // Apply CSS custom property for dynamic layout syncing
  useEffect(() => {
    const width = collapsed ? "70px" : "256px";
    document.documentElement.style.setProperty("--sidebar-width", width);
    try {
      localStorage.setItem("sidebar_collapsed", String(collapsed));
    } catch {
      // ignore
    }
  }, [collapsed]);

  // Auto-expand group if a child route is active
  useEffect(() => {
    WORKSPACE_NAV.forEach((item) => {
      if (item.type === "group" && item.children) {
        const hasActive = item.children.some((c) => isPathActive(location, c.path));
        if (hasActive) {
          setOpenGroups((prev) => ({ ...prev, [item.label]: true }));
        }
      }
    });
  }, [location.pathname, location.search]);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search, setMobileOpen]);

  // Lock body scroll on mobile drawer
  useEffect(() => {
    if (!mobileOpen) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const toggleGroup = (groupLabel) => {
    if (collapsed) {
      setCollapsed(false);
      setOpenGroups((prev) => ({ ...prev, [groupLabel]: true }));
      return;
    }
    setOpenGroups((prev) => ({ ...prev, [groupLabel]: !prev[groupLabel] }));
  };

  const handleNavigate = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  // Render navigation item helper
  const renderNavItem = (item, isChild = false) => {
    const Icon = item.icon;
    const isActive = isPathActive(location, item.path);

    return (
      <button
        key={item.path}
        type="button"
        title={collapsed ? item.label : undefined}
        aria-label={item.label}
        onClick={() => handleNavigate(item.path)}
        className={`group relative flex w-full items-center transition-all duration-150 ${
          collapsed
            ? "justify-center px-0 py-2.5 rounded-xl"
            : isChild
            ? "gap-2.5 rounded-lg px-2.5 py-1.5 text-xs"
            : "gap-3 rounded-xl px-3 py-2 text-xs font-semibold"
        } ${
          isActive
            ? "bg-secondary text-foreground font-semibold shadow-xs before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r-full before:bg-indigo-500"
            : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
        }`}
      >
        <Icon
          className={`shrink-0 transition-colors ${
            collapsed ? "h-5 w-5" : isChild ? "h-4 w-4" : "h-[18px] w-[18px]"
          } ${isActive ? "text-indigo-500 font-bold" : "text-muted-foreground group-hover:text-foreground"}`}
        />

        {!collapsed && (
          <span className="truncate text-left flex-1">{item.label}</span>
        )}
      </button>
    );
  };

  const renderNavGroup = (group) => {
    const GroupIcon = group.icon;
    const isOpen = Boolean(openGroups[group.label]);
    const hasActiveChild = group.children?.some((c) =>
      isPathActive(location, c.path)
    );

    if (collapsed) {
      // In collapsed mode: clicking directly navigates to the primary route or opens
      return (
        <button
          key={group.label}
          type="button"
          title={`${group.label} (${group.children?.map((c) => c.label).join(", ")})`}
          aria-label={group.label}
          onClick={() => {
            if (group.primaryPath) {
              handleNavigate(group.primaryPath);
            } else {
              setCollapsed(false);
            }
          }}
          className={`relative group flex w-full items-center justify-center rounded-xl py-2.5 text-xs transition-all duration-150 ${
            hasActiveChild
              ? "bg-secondary text-foreground font-semibold before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r-full before:bg-indigo-500"
              : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
          }`}
        >
          <GroupIcon
            className={`h-5 w-5 shrink-0 ${
              hasActiveChild ? "text-indigo-500" : "text-muted-foreground group-hover:text-foreground"
            }`}
          />
        </button>
      );
    }

    return (
      <div key={group.label} className="flex flex-col">
        <button
          type="button"
          aria-expanded={isOpen}
          onClick={() => toggleGroup(group.label)}
          className={`group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150 ${
            hasActiveChild
              ? "text-foreground font-semibold"
              : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
          }`}
        >
          <span className="flex items-center gap-3 min-w-0">
            <GroupIcon
              className={`h-[18px] w-[18px] shrink-0 ${
                hasActiveChild ? "text-indigo-500" : "text-muted-foreground group-hover:text-foreground"
              }`}
            />
            <span className="truncate">{group.label}</span>
          </span>

          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ${
              isOpen ? "rotate-0" : "-rotate-90"
            }`}
          />
        </button>

        {isOpen && group.children && (
          <div className="ml-3 mt-1 flex flex-col gap-0.5 border-l border-border/60 pl-2.5">
            {group.children.map((child) => renderNavItem(child, true))}
          </div>
        )}
      </div>
    );
  };

  const SidebarContent = ({ isMobileDrawer = false }) => (
    <div className="flex h-full min-h-0 w-full flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border select-none">
      {/* ====================================================
          BRAND HEADER
          ==================================================== */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border px-3.5">
        <button
          type="button"
          onClick={() => handleNavigate("/db")}
          className="flex items-center gap-2.5 min-w-0 text-left"
          title="AI Career Assistant - Command Center"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="h-4 w-4" />
          </div>

          {(!collapsed || isMobileDrawer) && (
            <div className="min-w-0">
              <div className="text-xs font-bold tracking-tight text-foreground truncate">
                AI Career Assistant
              </div>
              <div className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground/80 truncate">
                Career Command Center
              </div>
            </div>
          )}
        </button>

        {/* COLLAPSE BUTTON (DESKTOP) */}
        {!isMobileDrawer && (
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden md:flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sidebar-border/60 text-muted-foreground hover:bg-secondary hover:text-foreground transition"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        )}

        {/* CLOSE BUTTON (MOBILE DRAWER) */}
        {isMobileDrawer && (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-sidebar-border text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ====================================================
          SCROLLABLE NAVIGATION BODY
          ==================================================== */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2.5 py-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {/* SECTION 1: WORKSPACE */}
        {(!collapsed || isMobileDrawer) ? (
          <div className="mb-2 px-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
            Workspace
          </div>
        ) : (
          <div className="my-2 h-px bg-border/40 mx-2" />
        )}

        <div className="flex flex-col gap-1">
          {WORKSPACE_NAV.map((item) =>
            item.type === "single" ? renderNavItem(item) : renderNavGroup(item)
          )}
        </div>

        {/* SECTION 2: SETTINGS */}
        <div className="mt-6">
          {(!collapsed || isMobileDrawer) ? (
            <div className="mb-2 px-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Settings
            </div>
          ) : (
            <div className="my-2 h-px bg-border/40 mx-2" />
          )}

          <div className="flex flex-col gap-1">
            {SETTINGS_NAV.map((item) => renderNavItem(item))}
          </div>
        </div>
      </div>

      {/* ====================================================
          FOOTER / USER QUICK BADGE
          ==================================================== */}
      <div className="shrink-0 border-t border-sidebar-border p-3">
        {(!collapsed || isMobileDrawer) ? (
          <div className="flex items-center justify-between text-[11px] text-muted-foreground/80 px-1">
            <span className="font-semibold text-foreground/90">Platform Ready</span>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
          </div>
        ) : (
          <div className="flex justify-center">
            <span className="h-2 w-2 rounded-full bg-emerald-500" title="Online" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* DESKTOP FIXED SIDEBAR */}
      <aside
        className={`fixed left-0 top-0 z-50 hidden h-screen transition-[width] duration-200 ease-in-out md:flex ${
          collapsed ? "w-[70px]" : "w-64"
        }`}
        style={{ width: "var(--sidebar-width, 256px)" }}
      >
        <SidebarContent />
      </aside>

      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* MOBILE DRAWER */}
      <aside
        className={`fixed left-0 top-0 z-[90] h-[100dvh] w-[min(82vw,300px)] overflow-hidden shadow-2xl transition-transform duration-300 ease-out md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent isMobileDrawer />
      </aside>
    </>
  );
}