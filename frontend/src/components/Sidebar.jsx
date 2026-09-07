import React from "react";
import {
  Home,
  FileText,
  Settings,
  CheckCircle,
  Sparkles,
  BriefcaseBusiness,
} from "lucide-react";
import { MdDashboard } from "react-icons/md";
import { useNavigate, useLocation } from "react-router-dom";

const LINKS = [
  {
    label: "Home",
    path: "/home",
    icon: Home,
  },
  {
    label: "Dashboard",
    path: "/db",
    icon: MdDashboard,
  },
  {
    label: "Create Resume",
    path: "/resume",
    icon: FileText,
  },
  {
    label: "AI Suggestions",
    path: "/ai-suggestions",
    icon: Sparkles,
    ai: true,
  },
  {
    label: "Job Match",
    path: "/job-match",
    icon: BriefcaseBusiness,
    ai: true,
  },
  {
    label: "ATS Checker",
    path: "/ats",
    icon: CheckCircle,
  },
  {
    label: "Settings",
    path: "/setting",
    icon: Settings,
  },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside
      className="
        fixed
        top-0
        left-0
        z-50

        hidden
        md:flex

        h-screen
        w-64

        flex-col

        border-r
        border-sidebar-border

        bg-sidebar
        text-sidebar-foreground
      "
    >
      {/* =====================================================
          BRAND
      ===================================================== */}

      <div className="flex h-[76px] shrink-0 items-center border-b border-sidebar-border px-5">
        <button
          onClick={() => navigate("/db")}
          className="flex items-center gap-3"
        >
          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-sidebar-border
              bg-background
              text-sm
              font-bold
            "
          >
            A/R
          </div>

          <div className="text-left">
            <div className="font-display text-sm font-semibold tracking-tight">
              AI Resume
            </div>

            <div className="text-xs text-muted-foreground">
              Career workspace
            </div>
          </div>
        </button>
      </div>

      {/* =====================================================
          WORKSPACE NAVIGATION
      ===================================================== */}

      <div className="flex-1 overflow-y-auto px-3 py-5">
        <div className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Workspace
        </div>

        <div className="flex flex-col gap-1">
          {LINKS.map((item) => {
            const Icon = item.icon;

            const isActive =
              location.pathname === item.path ||
              (item.path === "/resume" &&
                location.pathname === "/create-resume");

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                title={item.label}
                aria-current={isActive ? "page" : undefined}
                className={`
                  group
                  flex
                  w-full
                  items-center
                  gap-3
                  rounded-xl
                  px-3
                  py-2.5
                  text-left
                  text-sm
                  font-medium
                  transition-all
                  duration-200

                  ${
                    isActive
                      ? "bg-secondary text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                  }
                `}
              >
                <Icon
                  className={`
                    h-[18px]
                    w-[18px]
                    shrink-0
                    transition-transform
                    duration-200
                    group-hover:scale-105

                    ${
                      item.ai
                        ? "text-plum"
                        : isActive
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }
                  `}
                />

                <span className="truncate">
                  {item.label}
                </span>

                {item.ai && (
                  <span
                    className="
                      ml-auto
                      rounded-full
                      border
                      border-plum/20
                      bg-plum/10
                      px-1.5
                      py-0.5
                      text-[9px]
                      font-semibold
                      uppercase
                      tracking-wide
                      text-plum
                    "
                  >
                    AI
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* =====================================================
          AI CAREER ASSISTANT
      ===================================================== */}

      <div className="shrink-0 px-3 pb-3">
        <button
          type="button"
          onClick={() => navigate("/ai-suggestions")}
          className="
            group
            w-full
            rounded-2xl
            border
            border-sidebar-border
            bg-background
            p-4
            text-left
            transition-all
            duration-200
            hover:-translate-y-0.5
            hover:shadow-md
          "
        >
          <div className="flex items-start gap-3">
            <div
              className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-plum/10
                text-plum
              "
            >
              <Sparkles className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">
                AI Career Assistant
              </div>

              <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Improve your resume and discover your next career move.
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* =====================================================
          FOOTER / APP NAME
      ===================================================== */}

      <div
        className="
          shrink-0
          border-t
          border-sidebar-border
          px-5
          py-4
        "
      >
        <div className="text-xs font-medium text-muted-foreground">
          AI Resume Builder
        </div>

        <div className="mt-0.5 text-[11px] text-muted-foreground/70">
          Build smarter. Apply better.
        </div>
      </div>
    </aside>
  );
}