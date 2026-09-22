import React, { useEffect, useState } from "react";

import {
  FileText,
  Settings,
  CheckCircle,
  Sparkles,
  BriefcaseBusiness,
  ChevronDown,
  Target,
  BarChart3,
  Lightbulb,
  GraduationCap,
  Bookmark,
  Mic,
  TrendingUp,
  FileStack,
  LayoutTemplate,
  Search,
  X,
} from "lucide-react";

import { MdDashboard } from "react-icons/md";

import {
  useNavigate,
  useLocation,
} from "react-router-dom";


// ============================================================
// NAVIGATION
// ============================================================

const NAVIGATION = [

  {
    type: "single",
    label: "Dashboard",
    path: "/db",
    icon: MdDashboard,
  },

  {
    type: "group",
    label: "Resume",
    icon: FileText,

    children: [
      {
        label: "Resume Builder",
        path: "/resume",
        icon: FileText,
      },

      {
        label: "My Resumes",
        path: "/resumes",
        icon: FileStack,
      },

      {
        label: "Resume Templates",
        path: "/templates",
        icon: LayoutTemplate,
      },
    ],
  },

  {
    type: "group",
    label: "Career Analysis",
    icon: Target,

    children: [
      {
        label: "AI Job Match",
        path: "/job-match",
        icon: BriefcaseBusiness,
        ai: true,
      },

      {
        label: "Skill Gap Analysis",
        path: "/skill-gap",
        icon: Search,
        ai: true,
      },

      {
        label: "Career Recommendations",
        path: "/career-recommendations",
        icon: Lightbulb,
        ai: true,
      },
    ],
  },

  {
    type: "group",
    label: "Resume & Job Tools",
    icon: BarChart3,

    children: [
      {
        label: "ATS Checker",
        path: "/ats",
        icon: CheckCircle,
      },

      {
        label: "Resume Suggestions",
        path: "/ai-suggestions",
        icon: Sparkles,
        ai: true,
      },

      {
        label: "Recommended Skills",
        path: "/recommended-skills",
        icon: GraduationCap,
        ai: true,
      },
    ],
  },

  {
    type: "group",
    label: "Jobs",
    icon: BriefcaseBusiness,

    children: [
      {
        label: "Job Recommendations",
        path: "/jobs",
        icon: Search,
        ai: true,
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

    children: [
      {
        label: "AI Mock Interview",
        path: "/mock-interview",
        icon: Mic,
        ai: true,
      },
    ],
  },

  {
    type: "single",
    label: "Career Progress",
    path: "/career-progress",
    icon: TrendingUp,
  },

  {
    type: "single",
    label: "Settings",
    path: "/setting",
    icon: Settings,
  },
];


// ============================================================
// ACTIVE PATH
// ============================================================

const isPathActive = (
  location,
  path
) => {

  if (
    location.pathname === path
  ) {
    return true;
  }

  if (
    path === "/resume" &&
    location.pathname === "/create-resume"
  ) {
    return true;
  }

  return false;
};


// ============================================================
// SIDEBAR
// ============================================================

export default function Sidebar({
  mobileOpen = false,
  setMobileOpen = () => {},
}) {

  const navigate = useNavigate();
  const location = useLocation();

  // ==========================================================
  // ALL GROUPS CLOSED BY DEFAULT
  // ==========================================================

  const [
    openGroups,
    setOpenGroups,
  ] = useState({
    Resume: false,
    "Career Analysis": false,
    "Resume & Job Tools": false,
    Jobs: false,
    Interview: false,
  });


  // ==========================================================
  // CLOSE MOBILE SIDEBAR AFTER NAVIGATION
  // ==========================================================

  useEffect(() => {
    setMobileOpen(false);
  }, [
    location.pathname,
  ]);


  // ==========================================================
  // LOCK BODY SCROLL WHEN MOBILE SIDEBAR IS OPEN
  // ==========================================================

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


  // ==========================================================
  // TOGGLE GROUP
  // ==========================================================

  const toggleGroup = (
    groupName
  ) => {

    setOpenGroups(
      (previous) => ({
        ...previous,

        [groupName]:
          !previous[groupName],
      })
    );
  };


  // ==========================================================
  // GROUP ACTIVE
  // ==========================================================

  const groupHasActivePage = (
    children
  ) => {

    return children.some(
      (child) =>
        isPathActive(
          location,
          child.path
        )
    );
  };


  // ==========================================================
  // NAVIGATE
  // ==========================================================

  const handleNavigate = (
    path
  ) => {

    navigate(path);

    setMobileOpen(false);
  };


  // ==========================================================
  // SIDEBAR CONTENT
  // ==========================================================

  const SidebarContent = () => (
    <div
      className="
        flex
        h-full
        min-h-0
        w-full
        flex-col

        bg-sidebar
        text-sidebar-foreground
      "
    >

      {/* ====================================================
          BRAND
      ==================================================== */}

      <div
        className="
          flex
          h-[76px]
          shrink-0

          items-center
          justify-between

          border-b
          border-sidebar-border

          px-5
        "
      >

        <button
          type="button"
          onClick={() =>
            handleNavigate("/db")
          }
          className="
            flex
            items-center
            gap-3
          "
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

            <div
              className="
                text-sm
                font-semibold
                tracking-tight
              "
            >
              AI Resume
            </div>

            <div
              className="
                text-xs
                text-muted-foreground
              "
            >
              Career workspace
            </div>

          </div>

        </button>


        {/* MOBILE CLOSE */}

        <button
          type="button"
          onClick={() =>
            setMobileOpen(false)
          }
          className="
            flex
            h-9
            w-9

            items-center
            justify-center

            rounded-xl

            border
            border-sidebar-border

            text-muted-foreground

            hover:bg-secondary
            hover:text-foreground

            md:hidden
          "
          aria-label="Close sidebar"
        >
          <X className="h-4 w-4" />
        </button>

      </div>


      {/* ====================================================
          NAVIGATION
      ==================================================== */}

      <div
        className="
          flex-1
          min-h-0

          overflow-y-auto

          px-3
          py-5

          [scrollbar-width:none]
          [-ms-overflow-style:none]

          [&::-webkit-scrollbar]:hidden
        "
      >

        <div
          className="
            mb-3
            px-2

            text-[11px]
            font-semibold
            uppercase
            tracking-wider

            text-muted-foreground
          "
        >
          Workspace
        </div>


        <div className="flex flex-col gap-1">

          {NAVIGATION.map(
            (item) => {

              {/* ============================================
                  SINGLE
              ============================================ */}

              if (
                item.type === "single"
              ) {

                const Icon =
                  item.icon;

                const isActive =
                  isPathActive(
                    location,
                    item.path
                  );

                return (
                  <button
                    key={
                      item.path
                    }
                    type="button"
                    onClick={() =>
                      handleNavigate(
                        item.path
                      )
                    }
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

                      transition

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

                        ${
                          isActive
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }
                      `}
                    />

                    <span className="truncate">
                      {item.label}
                    </span>

                  </button>
                );
              }


              {/* ============================================
                  GROUP
              ============================================ */}

              const GroupIcon =
                item.icon;

              const isOpen =
                Boolean(
                  openGroups[
                    item.label
                  ]
                );

              const hasActivePage =
                groupHasActivePage(
                  item.children
                );

              return (
                <div
                  key={
                    item.label
                  }
                  className="mt-1"
                >

                  {/* GROUP HEADER */}

                  <button
                    type="button"
                    onClick={() =>
                      toggleGroup(
                        item.label
                      )
                    }
                    className={`
                      flex
                      w-full
                      items-center
                      justify-between

                      rounded-xl

                      px-3
                      py-2.5

                      text-left
                      text-sm
                      font-medium

                      transition

                      ${
                        hasActivePage
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }

                      hover:bg-secondary/70
                      hover:text-foreground
                    `}
                  >

                    <span
                      className="
                        flex
                        min-w-0
                        items-center
                        gap-3
                      "
                    >

                      <GroupIcon
                        className="
                          h-[18px]
                          w-[18px]
                          shrink-0
                        "
                      />

                      <span className="truncate">
                        {item.label}
                      </span>

                    </span>


                    <ChevronDown
                      className={`
                        h-4
                        w-4
                        shrink-0

                        transition-transform

                        ${
                          isOpen
                            ? "rotate-0"
                            : "-rotate-90"
                        }
                      `}
                    />

                  </button>


                  {/* CHILDREN */}

                  {isOpen && (
                    <div
                      className="
                        ml-3
                        mt-1

                        border-l
                        border-sidebar-border

                        pl-2
                      "
                    >

                      {item.children.map(
                        (child) => {

                          const Icon =
                            child.icon;

                          const isActive =
                            isPathActive(
                              location,
                              child.path
                            );

                          return (
                            <button
                              key={
                                child.path
                              }
                              type="button"
                              onClick={() =>
                                handleNavigate(
                                  child.path
                                )
                              }
                              className={`
                                group
                                flex
                                w-full
                                items-center
                                gap-3

                                rounded-lg

                                px-3
                                py-2

                                text-left
                                text-[13px]
                                font-medium

                                transition

                                ${
                                  isActive
                                    ? "bg-secondary text-foreground shadow-sm"
                                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                                }
                              `}
                            >

                              <Icon
                                className={`
                                  h-4
                                  w-4
                                  shrink-0

                                  ${
                                    child.ai
                                      ? "text-plum"
                                      : isActive
                                      ? "text-foreground"
                                      : "text-muted-foreground"
                                  }
                                `}
                              />

                              <span
                                className="
                                  min-w-0
                                  flex-1
                                  truncate
                                "
                              >
                                {child.label}
                              </span>


                              {child.ai && (
                                <span
                                  className="
                                    shrink-0

                                    rounded-full

                                    border
                                    border-plum/20

                                    bg-plum/10

                                    px-1.5
                                    py-0.5

                                    text-[8px]
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
                        }
                      )}

                    </div>
                  )}

                </div>
              );
            }
          )}

        </div>

      </div>


      {/* ====================================================
          AI CAREER ASSISTANT
      ==================================================== */}

      <div
        className="
          shrink-0
          px-3
          pb-3
        "
      >

        <button
          type="button"
          onClick={() =>
            handleNavigate(
              "/ai-suggestions"
            )
          }
          className="
            w-full

            rounded-2xl

            border
            border-sidebar-border

            bg-background

            p-4

            text-left

            transition

            hover:-translate-y-0.5
            hover:shadow-md
          "
        >

          <div
            className="
              flex
              items-start
              gap-3
            "
          >

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
              <Sparkles
                className="h-4 w-4"
              />
            </div>

            <div
              className="
                min-w-0
                flex-1
              "
            >

              <div
                className="
                  text-sm
                  font-semibold
                "
              >
                AI Career Assistant
              </div>

              <div
                className="
                  mt-1
                  text-xs
                  leading-relaxed
                  text-muted-foreground
                "
              >
                Improve your resume and
                discover your next career move.
              </div>

            </div>

          </div>

        </button>

      </div>


      {/* ====================================================
          FOOTER
      ==================================================== */}

      <div
        className="
          shrink-0

          border-t
          border-sidebar-border

          px-5
          py-4
        "
      >

        <div
          className="
            text-xs
            font-medium
            text-muted-foreground
          "
        >
          AI Career Assistant
        </div>

        <div
          className="
            mt-0.5
            text-[11px]
            text-muted-foreground/70
          "
        >
          Build smarter. Apply better.
        </div>

      </div>

    </div>
  );


  return (
    <>
      {/* ======================================================
          DESKTOP SIDEBAR
      ====================================================== */}

      <aside
        className="
          fixed
          left-0
          top-0
          z-[60]

          hidden

          h-screen
          w-64

          border-r
          border-sidebar-border

          md:flex
        "
      >
        <SidebarContent />
      </aside>


      {/* ======================================================
          MOBILE OVERLAY
      ====================================================== */}

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() =>
            setMobileOpen(false)
          }
          className="
            fixed
            inset-0
            z-[80]

            bg-black/30

            backdrop-blur-[1px]

            md:hidden
          "
        />
      )}


      {/* ======================================================
          MOBILE DRAWER
      ====================================================== */}

      <aside
        className={`
          fixed
          left-0
          top-0
          z-[90]

          h-[100dvh]
          w-[min(82vw,320px)]

          overflow-hidden

          border-r
          border-sidebar-border

          shadow-2xl

          transition-transform
          duration-300
          ease-out

          md:hidden

          ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        <SidebarContent />
      </aside>
    </>
  );
}