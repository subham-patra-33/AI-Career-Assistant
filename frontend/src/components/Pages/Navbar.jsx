import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FileText,
  Bell,
  Plus,
  ChevronDown,
  User,
} from "lucide-react";

import ThemeToggle from "../ui/ThemeToggle";
import { isAuthed, getToken, logout } from "../../lib/auth";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [authed, setAuthed] = useState(isAuthed());
  const [showProfile, setShowProfile] = useState(false);

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Load logged-in user
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    setAuthed(isAuthed());
    setShowProfile(false);

    if (!isAuthed()) {
      setUser(null);
      return;
    }

    loadUser();
  }, [location.pathname]);

  async function loadUser() {
    try {
      setLoadingUser(true);

      const token = getToken();

      if (!token) {
        setUser(null);
        return;
      }

      const response = await fetch(
        `${API_URL}/api/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Unable to load user");
      }

      const data = await response.json();

      setUser(data);

    } catch (error) {
      console.error(
        "Failed to load navbar user:",
        error
      );
    } finally {
      setLoadingUser(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Logout
  |--------------------------------------------------------------------------
  */

  function handleLogout() {
    logout();

    setUser(null);
    setAuthed(false);
    setShowProfile(false);

    navigate("/");
  }

  /*
  |--------------------------------------------------------------------------
  | User display
  |--------------------------------------------------------------------------
  */

  const displayName =
    user?.name?.trim() ||
    user?.username ||
    "User";

  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "U";


  return (
    <header
      className="
        fixed
        top-0
        right-0
        left-0
        md:left-64

        z-40

        h-[76px]

        border-b
        border-border/60

        bg-background/90
        backdrop-blur-xl

        shadow-[0_4px_24px_rgba(0,0,0,0.025)]
        dark:shadow-[0_4px_24px_rgba(0,0,0,0.12)]
      "
    >

      <div
        className="
          flex
          h-full
          w-full

          items-center
          justify-between

          gap-4

          px-4
          sm:px-6
          lg:px-8
        "
      >

        {/* =====================================================
            BRAND
        ===================================================== */}

        <Link
          to={authed ? "/db" : "/home"}
          className="
            group
            flex
            min-w-0
            items-center
            gap-3
          "
        >

          <div
            className="
              relative

              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center

              rounded-xl

              bg-gradient-to-br
              from-indigo-500
              via-violet-500
              to-purple-600

              shadow-lg
              shadow-indigo-500/20

              transition-all
              duration-300

              group-hover:scale-105
              group-hover:shadow-indigo-500/30
            "
          >

            <FileText
              className="h-5 w-5 text-white"
              strokeWidth={2.2}
            />

            <span
              className="
                absolute
                -right-1
                -top-1

                h-3
                w-3

                rounded-full

                bg-white
                dark:bg-gray-950

                shadow-sm
              "
            >
              <span
                className="
                  absolute
                  inset-[3px]

                  rounded-full

                  bg-violet-500
                "
              />
            </span>

          </div>


          <div className="hidden sm:block min-w-0">

            <div
              className="
                whitespace-nowrap

                text-[17px]
                font-bold
                tracking-tight

                text-foreground
              "
            >
              AI Resume{" "}

              <span
                className="
                  bg-gradient-to-r
                  from-indigo-500
                  to-violet-500

                  bg-clip-text
                  text-transparent
                "
              >
                Builder
              </span>
            </div>

            <div
              className="
                mt-1

                text-[9px]
                font-semibold
                tracking-[0.14em]

                text-muted-foreground
              "
            >
              CREATE • OPTIMIZE • GET HIRED
            </div>

          </div>

        </Link>


        {/* =====================================================
            RIGHT SIDE
        ===================================================== */}

        <div className="flex items-center gap-2 sm:gap-3">

          {/* Theme */}

          <div
            className="
              rounded-xl

              border
              border-border/60

              bg-background/70

              p-1

              transition

              hover:bg-secondary/70
            "
          >
            <ThemeToggle />
          </div>


          {authed ? (
            <>

              {/* =================================================
                  CREATE RESUME
              ================================================= */}

              <button
                onClick={() => navigate("/resume")}
                className="
                  hidden
                  sm:flex

                  items-center
                  gap-2

                  rounded-xl

                  bg-gradient-to-r
                  from-indigo-500
                  to-violet-600

                  px-4
                  py-2.5

                  text-sm
                  font-semibold
                  text-white

                  shadow-lg
                  shadow-indigo-500/20

                  transition-all
                  duration-200

                  hover:-translate-y-[1px]
                  hover:shadow-indigo-500/30
                "
              >

                <Plus className="h-4 w-4" />

                Create Resume

              </button>


              {/* =================================================
                  NOTIFICATIONS
              ================================================= */}

              <button
                className="
                  relative

                  hidden
                  sm:flex

                  h-10
                  w-10

                  items-center
                  justify-center

                  rounded-xl

                  border
                  border-border/60

                  bg-background/70

                  text-muted-foreground

                  transition

                  hover:bg-secondary
                  hover:text-foreground
                "
                aria-label="Notifications"
              >

                <Bell className="h-[18px] w-[18px]" />

                <span
                  className="
                    absolute
                    right-2
                    top-2

                    h-2
                    w-2

                    rounded-full

                    bg-red-500

                    ring-2
                    ring-background
                  "
                />

              </button>


              {/* =================================================
                  USER PROFILE
              ================================================= */}

              <div className="relative">

                <button
                  onClick={() =>
                    setShowProfile(
                      (previous) => !previous
                    )
                  }
                  className="
                    flex
                    items-center
                    gap-2.5

                    rounded-xl

                    border
                    border-border/60

                    bg-background/70

                    px-2
                    py-1.5

                    transition

                    hover:bg-secondary
                  "
                >

                  {/* Avatar */}

                  <div
                    className="
                      flex
                      h-8
                      w-8
                      shrink-0

                      items-center
                      justify-center

                      rounded-lg

                      bg-gradient-to-br
                      from-slate-700
                      to-slate-950

                      text-[11px]
                      font-bold

                      text-white
                    "
                  >
                    {loadingUser ? (
                      <div
                        className="
                          h-3
                          w-3

                          animate-spin

                          rounded-full

                          border-2
                          border-white/30
                          border-t-white
                        "
                      />
                    ) : (
                      initials
                    )}
                  </div>


                  {/* Name */}

                  <div className="hidden lg:block min-w-0 text-left">

                    <div
                      className="
                        max-w-[120px]

                        truncate

                        text-xs
                        font-semibold

                        text-foreground
                      "
                    >
                      {loadingUser
                        ? "Loading..."
                        : displayName}
                    </div>

                    <div
                      className="
                        text-[10px]

                        text-muted-foreground
                      "
                    >
                      Career workspace
                    </div>

                  </div>


                  <ChevronDown
                    className={`
                      hidden
                      sm:block

                      h-4
                      w-4

                      text-muted-foreground

                      transition-transform

                      ${
                        showProfile
                          ? "rotate-180"
                          : ""
                      }
                    `}
                  />

                </button>


                {/* =================================================
                    PROFILE DROPDOWN
                ================================================= */}

                {showProfile && (
                  <div
                    className="
                      absolute
                      right-0
                      top-[calc(100%+10px)]

                      w-60

                      overflow-hidden

                      rounded-2xl

                      border
                      border-border/70

                      bg-background/95

                      p-2

                      shadow-2xl
                      shadow-black/10

                      backdrop-blur-xl
                    "
                  >

                    {/* User info */}

                    <div
                      className="
                        mb-2

                        flex
                        items-center
                        gap-3

                        rounded-xl

                        bg-secondary/50

                        px-3
                        py-3
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

                          rounded-lg

                          bg-gradient-to-br
                          from-indigo-500
                          to-violet-600

                          text-xs
                          font-bold
                          text-white
                        "
                      >
                        {initials}
                      </div>

                      <div className="min-w-0">

                        <p
                          className="
                            truncate

                            text-sm
                            font-semibold

                            text-foreground
                          "
                        >
                          {displayName}
                        </p>

                        <p
                          className="
                            truncate

                            text-[11px]

                            text-muted-foreground
                          "
                        >
                          {user?.username
                            ? `@${user.username}`
                            : "Career workspace"}
                        </p>

                      </div>

                    </div>


                    <button
                      onClick={() => {
                        setShowProfile(false);
                        navigate("/setting");
                      }}
                      className="
                        flex
                        w-full
                        items-center
                        gap-2

                        rounded-xl

                        px-3
                        py-2.5

                        text-left
                        text-sm

                        text-foreground

                        transition

                        hover:bg-secondary
                      "
                    >
                      <User className="h-4 w-4" />
                      Settings
                    </button>


                    <div
                      className="
                        my-1
                        h-px
                        bg-border/60
                      "
                    />


                    <button
                      onClick={handleLogout}
                      className="
                        w-full

                        rounded-xl

                        px-3
                        py-2.5

                        text-left
                        text-sm

                        text-red-500

                        transition

                        hover:bg-red-500/10
                      "
                    >
                      Log out
                    </button>

                  </div>
                )}

              </div>

            </>
          ) : (
            <>
              <Link
                to="/"
                className="
                  hidden
                  sm:flex

                  rounded-xl

                  border
                  border-border

                  px-4
                  py-2.5

                  text-sm
                  font-medium

                  transition

                  hover:bg-secondary
                "
              >
                Log in
              </Link>

              <Link
                to="/register"
                className="
                  rounded-xl

                  bg-gradient-to-r
                  from-indigo-500
                  to-violet-600

                  px-4
                  py-2.5

                  text-sm
                  font-semibold
                  text-white

                  shadow-lg
                  shadow-indigo-500/20

                  transition

                  hover:-translate-y-[1px]
                "
              >
                Sign up
              </Link>
            </>
          )}

        </div>

      </div>

    </header>
  );
}

export default Navbar;