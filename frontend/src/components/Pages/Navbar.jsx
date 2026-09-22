import React, { useEffect, useState } from "react";

import {
  FileText,
  Bell,
  Plus,
  ChevronDown,
  User,
  Menu,
  X,
  CheckCircle2,
  Sparkles,
  BriefcaseBusiness,
} from "lucide-react";

import { Link, useLocation, useNavigate } from "react-router-dom";

import ThemeToggle from "../ui/ThemeToggle";
import { isAuthed, getToken, logout } from "../../lib/auth";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000";

function Navbar({
  mobileOpen = false,
  setMobileOpen = () => {},
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const [authed, setAuthed] = useState(isAuthed());

  const [showProfile, setShowProfile] =
    useState(false);

  const [showNotifications, setShowNotifications] =
    useState(false);

  const [user, setUser] = useState(null);

  const [loadingUser, setLoadingUser] =
    useState(false);

  // ==========================================================
  // LOAD USER
  // ==========================================================

  useEffect(() => {
    setAuthed(isAuthed());

    setShowProfile(false);
    setShowNotifications(false);

    if (!isAuthed()) {
      setUser(null);
      return;
    }

    loadUser();
  }, [location.pathname]);

  // ==========================================================
  // LOAD LOGGED-IN USER
  // ==========================================================

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
        throw new Error(
          "Unable to load user"
        );
      }

      const data =
        await response.json();

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

  // ==========================================================
  // LOGOUT
  // ==========================================================

  function handleLogout() {
    logout();

    setUser(null);
    setAuthed(false);

    setShowProfile(false);
    setShowNotifications(false);

    navigate("/");
  }

  // ==========================================================
  // USER DISPLAY
  // ==========================================================

  const displayName =
    user?.name?.trim() ||
    user?.username ||
    "User";

  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (word) => word[0]
      )
      .join("")
      .toUpperCase() || "U";

  // ==========================================================
  // TOGGLE MOBILE SIDEBAR
  // ==========================================================

  function toggleMobileSidebar() {
    setMobileOpen(
      !mobileOpen
    );
  }

  // ==========================================================
  // CLOSE OTHER DROPDOWNS
  // ==========================================================

  function toggleNotifications() {
    setShowNotifications(
      (previous) => !previous
    );

    setShowProfile(false);
  }

  function toggleProfile() {
    setShowProfile(
      (previous) => !previous
    );

    setShowNotifications(false);
  }

  return (
    <>
      {/* ======================================================
          NAVBAR
      ====================================================== */}

      <header
        className="
          fixed
          left-0
          right-0
          top-0

          z-[70]

          h-[76px]

          border-b
          border-border/60

          bg-background/95
          backdrop-blur-xl

          shadow-[0_4px_24px_rgba(0,0,0,0.025)]

          md:left-64
        "
      >

        <div
          className="
            flex
            h-full
            w-full
            min-w-0

            items-center
            justify-between

            gap-2
            sm:gap-3

            px-3
            sm:px-6
            lg:px-8
          "
        >

          {/* ==================================================
              LEFT SIDE
          ================================================== */}

          <div
            className="
              flex
              min-w-0
              flex-1
              items-center
              gap-2
              sm:gap-3
            "
          >

            {/* =================================================
                MOBILE MENU BUTTON
            ================================================= */}

            <button
              type="button"
              onClick={
                toggleMobileSidebar
              }
              className="
                flex
                h-10
                w-10
                shrink-0

                items-center
                justify-center

                rounded-xl

                border
                border-border/60

                bg-background

                text-foreground

                shadow-sm

                transition-all
                duration-200

                hover:bg-secondary

                md:hidden
              "
              aria-label={
                mobileOpen
                  ? "Close navigation"
                  : "Open navigation"
              }
              aria-expanded={
                mobileOpen
              }
            >
              {mobileOpen ? (
                <X
                  className="h-5 w-5"
                />
              ) : (
                <Menu
                  className="h-5 w-5"
                />
              )}
            </button>


            {/* =================================================
                BRAND
            ================================================= */}

            <Link
              to={
                authed
                  ? "/db"
                  : "/home"
              }
              className="
                group
                flex
                min-w-0
                items-center
                gap-2.5
                sm:gap-3
              "
            >

              {/* LOGO */}

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
                "
              >
                <FileText
                  className="
                    h-5
                    w-5
                    text-white
                  "
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

                    bg-background

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


              {/* BRAND TEXT */}

              <div
                className="
                  hidden
                  min-w-0
                  sm:block
                "
              >

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

          </div>


          {/* ==================================================
              RIGHT SIDE
          ================================================== */}

          <div
            className="
              flex
              shrink-0
              items-center
              gap-1.5
              sm:gap-2
              lg:gap-3
            "
          >

            {/* =================================================
                THEME TOGGLE
            ================================================= */}

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
                border-border/60

                bg-background

                transition

                hover:bg-secondary
              "
            >
              <ThemeToggle />
            </div>


            {authed ? (
              <>

                {/* =============================================
                    CREATE RESUME
                ============================================= */}

                <button
                  type="button"
                  onClick={() =>
                    navigate("/resume")
                  }
                  className="
                    hidden
                    shrink-0

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

                    transition

                    hover:-translate-y-[1px]

                    sm:flex
                  "
                >
                  <Plus
                    className="h-4 w-4"
                  />

                  Create Resume
                </button>


                {/* =============================================
                    NOTIFICATIONS
                ============================================= */}

                <div
                  className="
                    relative
                  "
                >

                  <button
                    type="button"
                    onClick={
                      toggleNotifications
                    }
                    className="
                      relative

                      flex
                      h-10
                      w-10
                      shrink-0

                      items-center
                      justify-center

                      rounded-xl

                      border
                      border-border/60

                      bg-background

                      text-muted-foreground

                      transition

                      hover:bg-secondary
                      hover:text-foreground
                    "
                    aria-label="Notifications"
                    aria-expanded={
                      showNotifications
                    }
                  >

                    <Bell
                      className="
                        h-[18px]
                        w-[18px]
                      "
                    />

                    {/* NOTIFICATION DOT */}

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


                  {/* NOTIFICATION DROPDOWN */}

                  {showNotifications && (
                    <div
                      className="
                        absolute

                        right-0
                        top-[calc(100%+10px)]

                        z-[100]

                        w-[min(340px,calc(100vw-24px))]

                        overflow-hidden

                        rounded-2xl

                        border
                        border-border/70

                        bg-background

                        shadow-2xl
                        shadow-black/10
                      "
                    >

                      {/* HEADER */}

                      <div
                        className="
                          flex
                          items-center
                          justify-between

                          border-b
                          border-border/60

                          px-4
                          py-3
                        "
                      >

                        <div>
                          <p
                            className="
                              text-sm
                              font-semibold
                              text-foreground
                            "
                          >
                            Notifications
                          </p>

                          <p
                            className="
                              mt-0.5
                              text-[11px]
                              text-muted-foreground
                            "
                          >
                            Your latest career updates
                          </p>
                        </div>

                        <span
                          className="
                            rounded-full
                            bg-red-500/10
                            px-2
                            py-1

                            text-[10px]
                            font-semibold
                            text-red-500
                          "
                        >
                          New
                        </span>

                      </div>


                      {/* NOTIFICATION */}

                      <div
                        className="
                          flex
                          gap-3

                          px-4
                          py-4

                          transition

                          hover:bg-secondary/50
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
                          <p
                            className="
                              text-sm
                              font-medium
                              text-foreground
                            "
                          >
                            AI Career Assistant
                          </p>

                          <p
                            className="
                              mt-1
                              text-xs
                              leading-5
                              text-muted-foreground
                            "
                          >
                            Improve your resume and
                            explore your next career move.
                          </p>
                        </div>

                      </div>


                      {/* ATS */}

                      <div
                        className="
                          flex
                          gap-3

                          border-t
                          border-border/50

                          px-4
                          py-4

                          transition

                          hover:bg-secondary/50
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

                            bg-emerald-500/10

                            text-emerald-600
                          "
                        >
                          <CheckCircle2
                            className="h-4 w-4"
                          />
                        </div>

                        <div
                          className="
                            min-w-0
                            flex-1
                          "
                        >
                          <p
                            className="
                              text-sm
                              font-medium
                              text-foreground
                            "
                          >
                            ATS Checker
                          </p>

                          <p
                            className="
                              mt-1
                              text-xs
                              leading-5
                              text-muted-foreground
                            "
                          >
                            Check your resume against
                            your target job.
                          </p>
                        </div>

                      </div>


                      {/* JOBS */}

                      <div
                        className="
                          flex
                          gap-3

                          border-t
                          border-border/50

                          px-4
                          py-4

                          transition

                          hover:bg-secondary/50
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

                            bg-indigo-500/10

                            text-indigo-600
                          "
                        >
                          <BriefcaseBusiness
                            className="h-4 w-4"
                          />
                        </div>

                        <div
                          className="
                            min-w-0
                            flex-1
                          "
                        >
                          <p
                            className="
                              text-sm
                              font-medium
                              text-foreground
                            "
                          >
                            Job Recommendations
                          </p>

                          <p
                            className="
                              mt-1
                              text-xs
                              leading-5
                              text-muted-foreground
                            "
                          >
                            Discover jobs matching
                            your profile.
                          </p>
                        </div>

                      </div>


                      {/* FOOTER */}

                      <button
                        type="button"
                        onClick={() =>
                          setShowNotifications(
                            false
                          )
                        }
                        className="
                          w-full

                          border-t
                          border-border/60

                          px-4
                          py-3

                          text-xs
                          font-semibold
                          text-primary

                          transition

                          hover:bg-secondary
                        "
                      >
                        Close notifications
                      </button>

                    </div>
                  )}

                </div>


                {/* =============================================
                    PROFILE
                ============================================= */}

                <div
                  className="
                    relative
                  "
                >

                  <button
                    type="button"
                    onClick={
                      toggleProfile
                    }
                    className="
                      flex
                      h-10
                      items-center
                      gap-2

                      rounded-xl

                      border
                      border-border/60

                      bg-background

                      px-1.5
                      sm:px-2

                      transition

                      hover:bg-secondary
                    "
                  >

                    {/* AVATAR */}

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


                    {/* USER NAME */}

                    <div
                      className="
                        hidden
                        min-w-0
                        text-left
                        lg:block
                      "
                    >
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
                        h-4
                        w-4

                        text-muted-foreground

                        transition-transform

                        sm:block

                        ${
                          showProfile
                            ? "rotate-180"
                            : ""
                        }
                      `}
                    />

                  </button>


                  {/* PROFILE DROPDOWN */}

                  {showProfile && (
                    <div
                      className="
                        absolute

                        right-0
                        top-[calc(100%+10px)]

                        z-[100]

                        w-[min(280px,calc(100vw-24px))]

                        overflow-hidden

                        rounded-2xl

                        border
                        border-border/70

                        bg-background

                        p-2

                        shadow-2xl
                        shadow-black/10
                      "
                    >

                      {/* USER */}

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
                            h-10
                            w-10
                            shrink-0

                            items-center
                            justify-center

                            rounded-xl

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

                        <div
                          className="
                            min-w-0
                            flex-1
                          "
                        >

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


                      {/* SETTINGS */}

                      <button
                        type="button"
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
                        <User
                          className="h-4 w-4"
                        />

                        Settings
                      </button>


                      {/* LOGOUT */}

                      <div
                        className="
                          my-1
                          h-px
                          bg-border/60
                        "
                      />

                      <button
                        type="button"
                        onClick={
                          handleLogout
                        }
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
                    rounded-xl
                    border
                    border-border
                    px-4
                    py-2.5
                    text-sm
                    font-medium
                    transition
                    hover:bg-secondary
                    sm:flex
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

                    px-3
                    py-2.5
                    sm:px-4

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
    </>
  );
}

export default Navbar;