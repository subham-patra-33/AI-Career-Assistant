import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";


// ============================================================
// BACK BUTTON
// ============================================================

function BackButton() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      className="
        inline-flex
        items-center
        gap-2
        rounded-xl
        border
        border-slate-200
        bg-white
        px-4
        py-2
        text-sm
        font-semibold
        text-slate-700
        shadow-sm
        transition
        duration-300
        hover:-translate-y-0.5
        hover:border-indigo-200
        hover:text-indigo-600
        dark:border-white/10
        dark:bg-[#151821]
        dark:text-slate-200
        dark:hover:border-indigo-500/40
        dark:hover:text-indigo-300
      "
    >
      <span>←</span>
      Back
    </button>
  );
}


// ============================================================
// TOGGLE
// ============================================================

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`
        relative
        inline-flex
        h-7
        w-12
        shrink-0
        cursor-pointer
        items-center
        rounded-full
        transition-all
        duration-300
        ${
          checked
            ? "bg-indigo-600"
            : "bg-slate-300 dark:bg-slate-700"
        }
      `}
    >
      <span
        className={`
          inline-block
          h-5
          w-5
          transform
          rounded-full
          bg-white
          shadow-md
          transition-transform
          duration-300
          ${
            checked
              ? "translate-x-6"
              : "translate-x-1"
          }
        `}
      />
    </button>
  );
}


// ============================================================
// SETTING ROW
// ============================================================

function SettingRow({
  title,
  description,
  control,
}) {
  return (
    <div
      className="
        flex
        items-center
        justify-between
        gap-6
        rounded-2xl
        border
        border-slate-100
        bg-slate-50/60
        p-4
        transition
        duration-300
        hover:border-indigo-100
        dark:border-white/5
        dark:bg-white/[0.03]
        dark:hover:border-indigo-500/20
      "
    >
      <div className="min-w-0">
        <h4
          className="
            text-sm
            font-bold
            text-slate-800
            dark:text-slate-100
          "
        >
          {title}
        </h4>

        <p
          className="
            mt-1
            max-w-2xl
            text-xs
            leading-5
            text-slate-500
            dark:text-slate-400
          "
        >
          {description}
        </p>
      </div>

      <div className="shrink-0">
        {control}
      </div>
    </div>
  );
}


// ============================================================
// SETTINGS
// ============================================================

export default function Settings() {
  const navigate = useNavigate();

  // ==========================================================
  // PROFILE
  // ==========================================================

  const [fullName, setFullName] = useState(
    localStorage.getItem("profile_fullName") || ""
  );

  const [email, setEmail] = useState(
    localStorage.getItem("profile_email") || ""
  );

  const [jobTitle, setJobTitle] = useState(
    localStorage.getItem("profile_jobTitle") || ""
  );


  // ==========================================================
  // PREFERENCES
  // ==========================================================

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark" ||
      localStorage.getItem("settings_darkMode") === "true"
  );

  const [aiSuggestions, setAiSuggestions] = useState(
    localStorage.getItem("aiSuggestions") !== "false"
  );

  const [emailNotifications, setEmailNotifications] =
    useState(
      localStorage.getItem("emailNotifications") !==
        "false"
    );

  const [autoSave, setAutoSave] = useState(
    localStorage.getItem("autoSave") !== "false"
  );


  // ==========================================================
  // AI PERSONALIZATION
  // ==========================================================

  const [aiWritingStyle, setAiWritingStyle] = useState(
    localStorage.getItem("aiWritingStyle") ||
      "Professional"
  );

  const [resumeTailoring, setResumeTailoring] = useState(
    localStorage.getItem("resumeTailoring") ||
      "Job-focused"
  );

  const [skillGapAnalysis, setSkillGapAnalysis] =
    useState(
      localStorage.getItem("skillGapAnalysis") !==
        "false"
    );

  const [atsOptimization, setAtsOptimization] =
    useState(
      localStorage.getItem("atsOptimization") !==
        "false"
    );


  // ==========================================================
  // RESUME PREFERENCES
  // ==========================================================

  const [defaultTemplate, setDefaultTemplate] =
    useState(
      localStorage.getItem("defaultTemplate") ||
        "Modern"
    );

  const [resumeLanguage, setResumeLanguage] =
    useState(
      localStorage.getItem("resumeLanguage") ||
        "English"
    );

  const [fontSize, setFontSize] = useState(
    localStorage.getItem("fontSize") || "Medium"
  );


  // ==========================================================
  // UI STATE
  // ==========================================================

  const [activeSection, setActiveSection] =
    useState("Profile");

  const [savedMessage, setSavedMessage] =
    useState("");


  // ==========================================================
  // APPLY GLOBAL THEME
  // ==========================================================

  const applyTheme = (theme) => {
    const root = document.documentElement;

    root.classList.remove("light", "dark");
    root.classList.add(theme);

    localStorage.setItem("theme", theme);

    localStorage.setItem(
      "settings_darkMode",
      theme === "dark" ? "true" : "false"
    );

    setDarkMode(theme === "dark");

    window.dispatchEvent(
      new CustomEvent("themeChanged", {
        detail: theme,
      })
    );
  };


  // ==========================================================
  // INITIALIZE SETTINGS
  // ==========================================================

  useEffect(() => {
    const savedTheme =
      localStorage.getItem("theme");

    const savedDarkMode =
      localStorage.getItem("settings_darkMode");

    const currentTheme =
      savedTheme ||
      (savedDarkMode === "true"
        ? "dark"
        : "light");

    document.documentElement.classList.remove(
      "light",
      "dark"
    );

    document.documentElement.classList.add(
      currentTheme
    );

    setDarkMode(currentTheme === "dark");

    localStorage.setItem(
      "theme",
      currentTheme
    );

    localStorage.setItem(
      "settings_darkMode",
      currentTheme === "dark"
        ? "true"
        : "false"
    );
  }, []);


  // ==========================================================
  // LISTEN FOR GLOBAL THEME CHANGES
  // ==========================================================

  useEffect(() => {
    const handleThemeChange = (event) => {
      const theme =
        event.detail ||
        localStorage.getItem("theme") ||
        "light";

      setDarkMode(theme === "dark");
    };

    window.addEventListener(
      "themeChanged",
      handleThemeChange
    );

    return () => {
      window.removeEventListener(
        "themeChanged",
        handleThemeChange
      );
    };
  }, []);


  // ==========================================================
  // DARK MODE
  // ==========================================================

  const handleDarkModeChange = (enabled) => {
    applyTheme(
      enabled ? "dark" : "light"
    );
  };


  // ==========================================================
  // SAVE SETTINGS
  // ==========================================================

  const saveSettings = () => {
    localStorage.setItem(
      "profile_fullName",
      fullName
    );

    localStorage.setItem(
      "profile_email",
      email
    );

    localStorage.setItem(
      "profile_jobTitle",
      jobTitle
    );

    localStorage.setItem(
      "aiSuggestions",
      aiSuggestions
        ? "true"
        : "false"
    );

    localStorage.setItem(
      "emailNotifications",
      emailNotifications
        ? "true"
        : "false"
    );

    localStorage.setItem(
      "autoSave",
      autoSave ? "true" : "false"
    );


    // AI Personalization
    localStorage.setItem(
      "aiWritingStyle",
      aiWritingStyle
    );

    localStorage.setItem(
      "resumeTailoring",
      resumeTailoring
    );

    localStorage.setItem(
      "skillGapAnalysis",
      skillGapAnalysis
        ? "true"
        : "false"
    );

    localStorage.setItem(
      "atsOptimization",
      atsOptimization
        ? "true"
        : "false"
    );


    localStorage.setItem(
      "defaultTemplate",
      defaultTemplate
    );

    localStorage.setItem(
      "resumeLanguage",
      resumeLanguage
    );

    localStorage.setItem(
      "fontSize",
      fontSize
    );


    // Keep theme synchronized
    const theme =
      darkMode ? "dark" : "light";

    localStorage.setItem(
      "theme",
      theme
    );

    localStorage.setItem(
      "settings_darkMode",
      darkMode ? "true" : "false"
    );

    document.documentElement.classList.toggle(
      "dark",
      darkMode
    );

    document.documentElement.classList.toggle(
      "light",
      !darkMode
    );


    window.dispatchEvent(
      new CustomEvent("themeChanged", {
        detail: theme,
      })
    );


    setSavedMessage(
      "Settings saved successfully."
    );

    setTimeout(() => {
      setSavedMessage("");
    }, 2500);
  };


  // ==========================================================
  // RESET SETTINGS
  // ==========================================================

  const resetSettings = () => {
    setFullName("");
    setEmail("");
    setJobTitle("");

    setAiSuggestions(true);
    setEmailNotifications(true);
    setAutoSave(true);

    setAiWritingStyle("Professional");
    setResumeTailoring("Job-focused");
    setSkillGapAnalysis(true);
    setAtsOptimization(true);

    setDefaultTemplate("Modern");
    setResumeLanguage("English");
    setFontSize("Medium");

    applyTheme("light");

    localStorage.removeItem(
      "profile_fullName"
    );

    localStorage.removeItem(
      "profile_email"
    );

    localStorage.removeItem(
      "profile_jobTitle"
    );

    localStorage.removeItem(
      "aiSuggestions"
    );

    localStorage.removeItem(
      "emailNotifications"
    );

    localStorage.removeItem(
      "autoSave"
    );

    localStorage.removeItem(
      "aiWritingStyle"
    );

    localStorage.removeItem(
      "resumeTailoring"
    );

    localStorage.removeItem(
      "skillGapAnalysis"
    );

    localStorage.removeItem(
      "atsOptimization"
    );

    localStorage.removeItem(
      "defaultTemplate"
    );

    localStorage.removeItem(
      "resumeLanguage"
    );

    localStorage.removeItem(
      "fontSize"
    );

    setSavedMessage(
      "Preferences reset successfully."
    );

    setTimeout(() => {
      setSavedMessage("");
    }, 2500);
  };


  // ==========================================================
  // DELETE ACCOUNT
  // ==========================================================

  const deleteAccount = () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );

    if (!confirmed) return;

    localStorage.clear();

    document.documentElement.classList.remove(
      "dark"
    );

    document.documentElement.classList.add(
      "light"
    );

    navigate("/");
  };


  // ==========================================================
  // SETTINGS NAVIGATION
  // ==========================================================

  const sections = [
    {
      name: "Profile",
      icon: "👤",
      description: "Personal information",
    },
    {
      name: "Appearance",
      icon: "🎨",
      description: "Theme and interface",
    },
    {
      name: "AI Preferences",
      icon: "✦",
      description: "AI behaviour",
    },
    {
      name: "Resume",
      icon: "📄",
      description: "Resume preferences",
    },
    {
      name: "Notifications",
      icon: "🔔",
      description: "Notification settings",
    },
    {
      name: "Privacy",
      icon: "🔒",
      description: "Privacy and security",
    },
    {
      name: "Account",
      icon: "⚙",
      description: "Account management",
    },
  ];


  // ==========================================================
  // PROFILE COMPLETENESS
  // ==========================================================

  const profileFields = [
    fullName,
    email,
    jobTitle,
  ];

  const completedFields =
    profileFields.filter(
      (field) =>
        field &&
        field.trim().length > 0
    ).length;

  const profileCompletion = Math.round(
    (completedFields /
      profileFields.length) *
      100
  );


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      className="
        min-h-full
        w-full
        bg-[#f8f9fd]
        px-4
        py-6
        text-slate-900
        sm:px-6
        lg:px-8
        dark:bg-[#0b0d12]
        dark:text-slate-100
      "
    >

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div
        className="
          mx-auto
          w-full
          max-w-[1500px]
        "
      >

        <div
          className="
            mb-6
            flex
            flex-wrap
            items-center
            justify-between
            gap-4
          "
        >

          <div className="flex items-center gap-4">

            <BackButton />

            <div>

              <p
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.2em]
                  text-indigo-600
                "
              >
                Workspace
              </p>

              <h1
                className="
                  mt-1
                  text-2xl
                  font-bold
                  tracking-tight
                  text-slate-900
                  dark:text-white
                "
              >
                Settings
              </h1>

            </div>

          </div>


          <div className="flex items-center gap-3">

            <div
              className="
                rounded-full
                border
                border-indigo-100
                bg-indigo-50
                px-3
                py-1.5
                text-[10px]
                font-extrabold
                uppercase
                tracking-[0.15em]
                text-indigo-600
                dark:border-indigo-500/20
                dark:bg-indigo-500/10
                dark:text-indigo-300
              "
            >
              SETTINGS
            </div>

            {savedMessage && (
              <div
                className="
                  rounded-full
                  border
                  border-emerald-100
                  bg-emerald-50
                  px-4
                  py-2
                  text-xs
                  font-semibold
                  text-emerald-600
                  dark:border-emerald-500/20
                  dark:bg-emerald-500/10
                  dark:text-emerald-400
                "
              >
                ✓ {savedMessage}
              </div>
            )}

          </div>

        </div>


        {/* ====================================================
            MAIN SETTINGS LAYOUT
        ==================================================== */}

        <div
          className="
            grid
            gap-6
            lg:grid-cols-[280px_minmax(0,1fr)]
          "
        >

          {/* ==================================================
              LEFT NAVIGATION
          ================================================== */}

          <aside>

            <div
              className="
                sticky
                top-6
                rounded-3xl
                border
                border-slate-200
                bg-white
                p-3
                shadow-sm
                dark:border-white/10
                dark:bg-[#11141b]
              "
            >

              {sections.map((section) => (
                <button
                  key={section.name}
                  type="button"
                  onClick={() =>
                    setActiveSection(
                      section.name
                    )
                  }
                  className={`
                    mb-1
                    flex
                    w-full
                    items-center
                    gap-3
                    rounded-2xl
                    p-3
                    text-left
                    transition-all
                    duration-300
                    last:mb-0
                    ${
                      activeSection ===
                      section.name
                        ? `
                          bg-indigo-50
                          text-indigo-700
                          dark:bg-indigo-500/10
                          dark:text-indigo-300
                        `
                        : `
                          text-slate-600
                          hover:bg-slate-50
                          hover:text-slate-900
                          dark:text-slate-400
                          dark:hover:bg-white/5
                          dark:hover:text-slate-100
                        `
                    }
                  `}
                >

                  <span
                    className="
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-slate-100
                      text-lg
                      dark:bg-white/5
                    "
                  >
                    {section.icon}
                  </span>

                  <span className="min-w-0">

                    <span
                      className="
                        block
                        text-sm
                        font-bold
                      "
                    >
                      {section.name}
                    </span>

                    <span
                      className="
                        mt-0.5
                        block
                        text-[10px]
                        text-slate-400
                      "
                    >
                      {section.description}
                    </span>

                  </span>

                </button>
              ))}

            </div>

          </aside>


          {/* ==================================================
              RIGHT CONTENT
          ================================================== */}

          <main className="min-w-0">

            {/* ==================================================
                PROFILE
            ================================================== */}

            {activeSection === "Profile" && (
              <div className="space-y-6">

                <section
                  className="
                    rounded-3xl
                    border
                    border-slate-200
                    bg-white
                    p-6
                    shadow-sm
                    sm:p-8
                    dark:border-white/10
                    dark:bg-[#11141b]
                  "
                >

                  <div className="mb-6">

                    <p
                      className="
                        text-xs
                        font-extrabold
                        uppercase
                        tracking-[0.18em]
                        text-indigo-600
                      "
                    >
                      Profile
                    </p>

                    <h2
                      className="
                        mt-2
                        text-xl
                        font-bold
                        text-slate-900
                        dark:text-white
                      "
                    >
                      Profile information
                    </h2>

                    <p
                      className="
                        mt-2
                        text-sm
                        text-slate-500
                        dark:text-slate-400
                      "
                    >
                      Keep your personal information
                      up to date.
                    </p>

                  </div>


                  <div
                    className="
                      grid
                      gap-5
                      md:grid-cols-2
                    "
                  >

                    <label className="block">

                      <span
                        className="
                          mb-2
                          block
                          text-xs
                          font-bold
                          text-slate-700
                          dark:text-slate-300
                        "
                      >
                        Full name
                      </span>

                      <input
                        value={fullName}
                        onChange={(e) =>
                          setFullName(
                            e.target.value
                          )
                        }
                        placeholder="Your full name"
                        className="
                          w-full
                          rounded-xl
                          border
                          border-slate-200
                          bg-white
                          px-4
                          py-3
                          text-sm
                          outline-none
                          transition
                          duration-300
                          focus:border-indigo-500
                          focus:ring-4
                          focus:ring-indigo-500/10
                          dark:border-white/10
                          dark:bg-[#0d1016]
                          dark:text-white
                          dark:placeholder:text-slate-600
                        "
                      />

                    </label>


                    <label className="block">

                      <span
                        className="
                          mb-2
                          block
                          text-xs
                          font-bold
                          text-slate-700
                          dark:text-slate-300
                        "
                      >
                        Email address
                      </span>

                      <input
                        type="email"
                        value={email}
                        onChange={(e) =>
                          setEmail(
                            e.target.value
                          )
                        }
                        placeholder="you@example.com"
                        className="
                          w-full
                          rounded-xl
                          border
                          border-slate-200
                          bg-white
                          px-4
                          py-3
                          text-sm
                          outline-none
                          transition
                          duration-300
                          focus:border-indigo-500
                          focus:ring-4
                          focus:ring-indigo-500/10
                          dark:border-white/10
                          dark:bg-[#0d1016]
                          dark:text-white
                          dark:placeholder:text-slate-600
                        "
                      />

                    </label>


                    <label className="block md:col-span-2">

                      <span
                        className="
                          mb-2
                          block
                          text-xs
                          font-bold
                          text-slate-700
                          dark:text-slate-300
                        "
                      >
                        Job title
                      </span>

                      <input
                        value={jobTitle}
                        onChange={(e) =>
                          setJobTitle(
                            e.target.value
                          )
                        }
                        placeholder="e.g. Software Developer"
                        className="
                          w-full
                          rounded-xl
                          border
                          border-slate-200
                          bg-white
                          px-4
                          py-3
                          text-sm
                          outline-none
                          transition
                          duration-300
                          focus:border-indigo-500
                          focus:ring-4
                          focus:ring-indigo-500/10
                          dark:border-white/10
                          dark:bg-[#0d1016]
                          dark:text-white
                          dark:placeholder:text-slate-600
                        "
                      />

                    </label>

                  </div>


                  <button
                    type="button"
                    onClick={saveSettings}
                    className="
                      mt-6
                      inline-flex
                      items-center
                      justify-center
                      rounded-xl
                      bg-gradient-to-r
                      from-indigo-600
                      to-violet-600
                      px-6
                      py-3
                      text-sm
                      font-bold
                      text-white
                      shadow-lg
                      shadow-indigo-200/40
                      transition
                      duration-300
                      hover:-translate-y-0.5
                      hover:shadow-xl
                    "
                  >
                    Save Profile
                  </button>

                </section>


                {/* PROFILE COMPLETENESS */}

                <section
                  className="
                    overflow-hidden
                    rounded-3xl
                    bg-gradient-to-br
                    from-indigo-600
                    via-violet-600
                    to-purple-600
                    p-6
                    text-white
                    shadow-xl
                    sm:p-8
                  "
                >

                  <div
                    className="
                      flex
                      flex-wrap
                      items-center
                      justify-between
                      gap-4
                    "
                  >

                    <div>

                      <p
                        className="
                          text-xs
                          font-bold
                          uppercase
                          tracking-[0.15em]
                          text-white/70
                        "
                      >
                        Profile completeness
                      </p>

                      <h3
                        className="
                          mt-2
                          text-2xl
                          font-bold
                        "
                      >
                        {profileCompletion}%
                        complete
                      </h3>

                    </div>

                    <div
                      className="
                        flex
                        h-14
                        w-14
                        items-center
                        justify-center
                        rounded-2xl
                        bg-white/10
                        text-xl
                      "
                    >
                      ✓
                    </div>

                  </div>


                  <div
                    className="
                      mt-6
                      h-2
                      overflow-hidden
                      rounded-full
                      bg-white/20
                    "
                  >
                    <div
                      className="
                        h-full
                        rounded-full
                        bg-white
                        transition-all
                        duration-700
                      "
                      style={{
                        width: `${profileCompletion}%`,
                      }}
                    />
                  </div>

                  <p
                    className="
                      mt-4
                      text-sm
                      text-white/70
                    "
                  >
                    Complete your profile to get
                    better AI recommendations.
                  </p>

                </section>

              </div>
            )}


            {/* ==================================================
                APPEARANCE
            ================================================== */}

            {activeSection === "Appearance" && (
              <section
                className="
                  rounded-3xl
                  border
                  border-slate-200
                  bg-white
                  p-6
                  shadow-sm
                  sm:p-8
                  dark:border-white/10
                  dark:bg-[#11141b]
                "
              >

                <div className="mb-6">

                  <p
                    className="
                      text-xs
                      font-extrabold
                      uppercase
                      tracking-[0.18em]
                      text-indigo-600
                    "
                  >
                    Appearance
                  </p>

                  <h2
                    className="
                      mt-2
                      text-xl
                      font-bold
                      text-slate-900
                      dark:text-white
                    "
                  >
                    Customize your interface
                  </h2>

                  <p
                    className="
                      mt-2
                      text-sm
                      text-slate-500
                      dark:text-slate-400
                    "
                  >
                    Choose how the application looks
                    and behaves.
                  </p>

                </div>


                <div className="space-y-4">

                  <SettingRow
                    title="Dark mode"
                    description="Use a dark interface throughout the application."
                    control={
                      <Toggle
                        checked={darkMode}
                        onChange={
                          handleDarkModeChange
                        }
                      />
                    }
                  />

                </div>

              </section>
            )}


            {/* ==================================================
                AI PREFERENCES
            ================================================== */}

            {activeSection === "AI Preferences" && (
              <div className="space-y-6">

                <section
                  className="
                    rounded-3xl
                    border
                    border-slate-200
                    bg-white
                    p-6
                    shadow-sm
                    sm:p-8
                    dark:border-white/10
                    dark:bg-[#11141b]
                  "
                >

                  <div className="mb-6">

                    <p
                      className="
                        text-xs
                        font-extrabold
                        uppercase
                        tracking-[0.18em]
                        text-indigo-600
                      "
                    >
                      AI Preferences
                    </p>

                    <h2
                      className="
                        mt-2
                        text-xl
                        font-bold
                        text-slate-900
                        dark:text-white
                      "
                    >
                      AI personalization
                    </h2>

                    <p
                      className="
                        mt-2
                        text-sm
                        text-slate-500
                        dark:text-slate-400
                      "
                    >
                      Customize how AI helps you create,
                      improve and tailor your resume.
                    </p>

                  </div>


                  <div className="space-y-4">

                    {/* AI SUGGESTIONS */}

                    <SettingRow
                      title="AI suggestions"
                      description="Receive AI-powered suggestions while creating and improving your resume."
                      control={
                        <Toggle
                          checked={aiSuggestions}
                          onChange={
                            setAiSuggestions
                          }
                        />
                      }
                    />


                    {/* WRITING STYLE */}

                    <div
                      className="
                        rounded-2xl
                        border
                        border-slate-100
                        bg-slate-50/60
                        p-4
                        dark:border-white/5
                        dark:bg-white/[0.03]
                      "
                    >

                      <div className="mb-4">

                        <h4
                          className="
                            text-sm
                            font-bold
                            text-slate-800
                            dark:text-slate-100
                          "
                        >
                          AI writing style
                        </h4>

                        <p
                          className="
                            mt-1
                            text-xs
                            leading-5
                            text-slate-500
                            dark:text-slate-400
                          "
                        >
                          Choose the tone AI should use
                          when generating resume content.
                        </p>

                      </div>


                      <div
                        className="
                          grid
                          gap-3
                          sm:grid-cols-3
                        "
                      >

                        {[
                          {
                            value: "Professional",
                            title: "Professional",
                            description:
                              "Polished and recruiter-friendly",
                          },
                          {
                            value: "Concise",
                            title: "Concise",
                            description:
                              "Short and impact-focused",
                          },
                          {
                            value: "Detailed",
                            title: "Detailed",
                            description:
                              "More context and explanation",
                          },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() =>
                              setAiWritingStyle(
                                option.value
                              )
                            }
                            className={`
                              rounded-xl
                              border
                              p-4
                              text-left
                              transition
                              duration-300
                              ${
                                aiWritingStyle ===
                                option.value
                                  ? `
                                    border-indigo-500
                                    bg-indigo-50
                                    dark:border-indigo-500
                                    dark:bg-indigo-500/10
                                  `
                                  : `
                                    border-slate-200
                                    bg-white
                                    hover:border-indigo-200
                                    dark:border-white/10
                                    dark:bg-[#0d1016]
                                    dark:hover:border-indigo-500/30
                                  `
                              }
                            `}
                          >

                            <div className="flex items-center gap-2">

                              <span
                                className={`
                                  h-2.5
                                  w-2.5
                                  rounded-full
                                  ${
                                    aiWritingStyle ===
                                    option.value
                                      ? "bg-indigo-600"
                                      : "bg-slate-300 dark:bg-slate-700"
                                  }
                                `}
                              />

                              <span
                                className="
                                  text-sm
                                  font-bold
                                  text-slate-900
                                  dark:text-white
                                "
                              >
                                {option.title}
                              </span>

                            </div>

                            <p
                              className="
                                mt-2
                                text-[11px]
                                leading-5
                                text-slate-500
                                dark:text-slate-400
                              "
                            >
                              {option.description}
                            </p>

                          </button>
                        ))}

                      </div>

                    </div>


                    {/* RESUME TAILORING */}

                    <div
                      className="
                        rounded-2xl
                        border
                        border-slate-100
                        bg-slate-50/60
                        p-4
                        dark:border-white/5
                        dark:bg-white/[0.03]
                      "
                    >

                      <div className="mb-3">

                        <h4
                          className="
                            text-sm
                            font-bold
                            text-slate-800
                            dark:text-slate-100
                          "
                        >
                          Resume tailoring level
                        </h4>

                        <p
                          className="
                            mt-1
                            text-xs
                            leading-5
                            text-slate-500
                            dark:text-slate-400
                          "
                        >
                          Choose how strongly AI should
                          customize your resume for a job.
                        </p>

                      </div>


                      <select
                        value={resumeTailoring}
                        onChange={(e) =>
                          setResumeTailoring(
                            e.target.value
                          )
                        }
                        className="
                          w-full
                          rounded-xl
                          border
                          border-slate-200
                          bg-white
                          px-4
                          py-3
                          text-sm
                          font-semibold
                          text-slate-700
                          outline-none
                          transition
                          focus:border-indigo-500
                          focus:ring-4
                          focus:ring-indigo-500/10
                          dark:border-white/10
                          dark:bg-[#0d1016]
                          dark:text-white
                        "
                      >
                        <option value="Standard">
                          Standard — Light improvements
                        </option>

                        <option value="Job-focused">
                          Job-focused — Match the job closely
                        </option>

                        <option value="Maximum">
                          Maximum — Strong ATS optimization
                        </option>
                      </select>

                    </div>


                    {/* SKILL GAP */}

                    <SettingRow
                      title="Skill gap analysis"
                      description="Let AI identify important skills you may be missing for your target role."
                      control={
                        <Toggle
                          checked={skillGapAnalysis}
                          onChange={
                            setSkillGapAnalysis
                          }
                        />
                      }
                    />


                    {/* ATS OPTIMIZATION */}

                    <SettingRow
                      title="ATS optimization"
                      description="Prioritize ATS-friendly keywords, structure and formatting recommendations."
                      control={
                        <Toggle
                          checked={atsOptimization}
                          onChange={
                            setAtsOptimization
                          }
                        />
                      }
                    />

                  </div>

                </section>


                {/* AI INFORMATION */}

                <section
                  className="
                    rounded-3xl
                    border
                    border-indigo-100
                    bg-indigo-50
                    p-6
                    dark:border-indigo-500/20
                    dark:bg-indigo-500/10
                  "
                >

                  <div className="flex gap-4">

                    <div
                      className="
                        flex
                        h-11
                        w-11
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        bg-indigo-600
                        text-white
                      "
                    >
                      ✦
                    </div>

                    <div>

                      <h3
                        className="
                          text-sm
                          font-bold
                          text-slate-900
                          dark:text-white
                        "
                      >
                        Personalize your AI experience
                      </h3>

                      <p
                        className="
                          mt-1
                          text-xs
                          leading-5
                          text-slate-500
                          dark:text-slate-400
                        "
                      >
                        These preferences help AI provide
                        more relevant suggestions for your
                        resume, job matching and ATS
                        optimization.
                      </p>

                    </div>

                  </div>

                </section>

              </div>
            )}


            {/* ==================================================
                RESUME
            ================================================== */}

            {activeSection === "Resume" && (
              <section
                className="
                  rounded-3xl
                  border
                  border-slate-200
                  bg-white
                  p-6
                  shadow-sm
                  sm:p-8
                  dark:border-white/10
                  dark:bg-[#11141b]
                "
              >

                <div className="mb-6">

                  <p
                    className="
                      text-xs
                      font-extrabold
                      uppercase
                      tracking-[0.18em]
                      text-indigo-600
                    "
                  >
                    Resume
                  </p>

                  <h2
                    className="
                      mt-2
                      text-xl
                      font-bold
                      text-slate-900
                      dark:text-white
                    "
                  >
                    Resume preferences
                  </h2>

                  <p
                    className="
                      mt-2
                      text-sm
                      text-slate-500
                      dark:text-slate-400
                    "
                  >
                    Set your default resume creation
                    preferences.
                  </p>

                </div>


                <div className="grid gap-5 md:grid-cols-2">

                  <label>

                    <span
                      className="
                        mb-2
                        block
                        text-xs
                        font-bold
                        text-slate-700
                        dark:text-slate-300
                      "
                    >
                      Default Template
                    </span>

                    <select
                      value={defaultTemplate}
                      onChange={(e) =>
                        setDefaultTemplate(
                          e.target.value
                        )
                      }
                      className="
                        w-full
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        px-4
                        py-3
                        text-sm
                        outline-none
                        transition
                        focus:border-indigo-500
                        dark:border-white/10
                        dark:bg-[#0d1016]
                        dark:text-white
                      "
                    >
                      <option>Modern</option>
                      <option>Professional</option>
                      <option>Minimal</option>
                      <option>Creative</option>
                      <option>Executive</option>
                    </select>

                  </label>


                  <label>

                    <span
                      className="
                        mb-2
                        block
                        text-xs
                        font-bold
                        text-slate-700
                        dark:text-slate-300
                      "
                    >
                      Resume Language
                    </span>

                    <select
                      value={resumeLanguage}
                      onChange={(e) =>
                        setResumeLanguage(
                          e.target.value
                        )
                      }
                      className="
                        w-full
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        px-4
                        py-3
                        text-sm
                        outline-none
                        transition
                        focus:border-indigo-500
                        dark:border-white/10
                        dark:bg-[#0d1016]
                        dark:text-white
                      "
                    >
                      <option>English</option>
                      <option>Hindi</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>German</option>
                    </select>

                  </label>


                  <label>

                    <span
                      className="
                        mb-2
                        block
                        text-xs
                        font-bold
                        text-slate-700
                        dark:text-slate-300
                      "
                    >
                      Default Font Size
                    </span>

                    <select
                      value={fontSize}
                      onChange={(e) =>
                        setFontSize(
                          e.target.value
                        )
                      }
                      className="
                        w-full
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        px-4
                        py-3
                        text-sm
                        outline-none
                        transition
                        focus:border-indigo-500
                        dark:border-white/10
                        dark:bg-[#0d1016]
                        dark:text-white
                      "
                    >
                      <option>Small</option>
                      <option>Medium</option>
                      <option>Large</option>
                    </select>

                  </label>

                </div>


                <button
                  type="button"
                  onClick={saveSettings}
                  className="
                    mt-6
                    rounded-xl
                    bg-gradient-to-r
                    from-indigo-600
                    to-violet-600
                    px-6
                    py-3
                    text-sm
                    font-bold
                    text-white
                    shadow-lg
                    transition
                    duration-300
                    hover:-translate-y-0.5
                    hover:shadow-xl
                  "
                >
                  Save Resume Preferences
                </button>

              </section>
            )}


            {/* ==================================================
                NOTIFICATIONS
            ================================================== */}

            {activeSection === "Notifications" && (
              <section
                className="
                  rounded-3xl
                  border
                  border-slate-200
                  bg-white
                  p-6
                  shadow-sm
                  sm:p-8
                  dark:border-white/10
                  dark:bg-[#11141b]
                "
              >

                <div className="mb-6">

                  <p
                    className="
                      text-xs
                      font-extrabold
                      uppercase
                      tracking-[0.18em]
                      text-indigo-600
                    "
                  >
                    Notifications
                  </p>

                  <h2
                    className="
                      mt-2
                      text-xl
                      font-bold
                      text-slate-900
                      dark:text-white
                    "
                  >
                    Notification settings
                  </h2>

                </div>


                <div className="space-y-4">

                  <SettingRow
                    title="Email notifications"
                    description="Receive important updates and account notifications by email."
                    control={
                      <Toggle
                        checked={
                          emailNotifications
                        }
                        onChange={
                          setEmailNotifications
                        }
                      />
                    }
                  />


                  <SettingRow
                    title="AI recommendations"
                    description="Receive recommendations and suggestions related to your resume."
                    control={
                      <Toggle
                        checked={
                          aiSuggestions
                        }
                        onChange={
                          setAiSuggestions
                        }
                      />
                    }
                  />

                </div>

              </section>
            )}


            {/* ==================================================
                PRIVACY
            ================================================== */}

            {activeSection === "Privacy" && (
              <section
                className="
                  rounded-3xl
                  border
                  border-slate-200
                  bg-white
                  p-6
                  shadow-sm
                  sm:p-8
                  dark:border-white/10
                  dark:bg-[#11141b]
                "
              >

                <div className="mb-6">

                  <p
                    className="
                      text-xs
                      font-extrabold
                      uppercase
                      tracking-[0.18em]
                      text-indigo-600
                    "
                  >
                    Privacy
                  </p>

                  <h2
                    className="
                      mt-2
                      text-xl
                      font-bold
                      text-slate-900
                      dark:text-white
                    "
                  >
                    Privacy & Data
                  </h2>

                  <p
                    className="
                      mt-2
                      text-sm
                      text-slate-500
                      dark:text-slate-400
                    "
                  >
                    Manage how your information is stored
                    and protected.
                  </p>

                </div>


                <div className="grid gap-5 md:grid-cols-2">

                  <div
                    className="
                      rounded-2xl
                      border
                      border-slate-100
                      bg-slate-50
                      p-5
                      dark:border-white/5
                      dark:bg-white/[0.03]
                    "
                  >

                    <div
                      className="
                        flex
                        h-11
                        w-11
                        items-center
                        justify-center
                        rounded-xl
                        bg-indigo-50
                        text-indigo-600
                        dark:bg-indigo-500/10
                        dark:text-indigo-300
                      "
                    >
                      📄
                    </div>

                    <h3
                      className="
                        mt-4
                        text-sm
                        font-bold
                        text-slate-900
                        dark:text-white
                      "
                    >
                      Resume data
                    </h3>

                    <p
                      className="
                        mt-2
                        text-xs
                        leading-5
                        text-slate-500
                        dark:text-slate-400
                      "
                    >
                      Your resume information is stored
                      locally in your browser settings.
                    </p>

                  </div>


                  <div
                    className="
                      rounded-2xl
                      border
                      border-slate-100
                      bg-slate-50
                      p-5
                      dark:border-white/5
                      dark:bg-white/[0.03]
                    "
                  >

                    <div
                      className="
                        flex
                        h-11
                        w-11
                        items-center
                        justify-center
                        rounded-xl
                        bg-emerald-50
                        text-emerald-600
                        dark:bg-emerald-500/10
                        dark:text-emerald-400
                      "
                    >
                      🔒
                    </div>

                    <h3
                      className="
                        mt-4
                        text-sm
                        font-bold
                        text-slate-900
                        dark:text-white
                      "
                    >
                      Account security
                    </h3>

                    <p
                      className="
                        mt-2
                        text-xs
                        leading-5
                        text-slate-500
                        dark:text-slate-400
                      "
                    >
                      Your account preferences and
                      settings are protected by the
                      application.
                    </p>

                  </div>

                </div>

              </section>
            )}


            {/* ==================================================
                ACCOUNT
            ================================================== */}

            {activeSection === "Account" && (
              <div className="space-y-6">

                <section
                  className="
                    rounded-3xl
                    border
                    border-slate-200
                    bg-white
                    p-6
                    shadow-sm
                    sm:p-8
                    dark:border-white/10
                    dark:bg-[#11141b]
                  "
                >

                  <p
                    className="
                      text-xs
                      font-extrabold
                      uppercase
                      tracking-[0.18em]
                      text-indigo-600
                    "
                  >
                    Account
                  </p>

                  <h2
                    className="
                      mt-2
                      text-xl
                      font-bold
                      text-slate-900
                      dark:text-white
                    "
                  >
                    Account management
                  </h2>


                  <button
                    type="button"
                    onClick={resetSettings}
                    className="
                      mt-6
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      px-5
                      py-3
                      text-sm
                      font-bold
                      text-slate-700
                      transition
                      duration-300
                      hover:-translate-y-0.5
                      hover:border-indigo-200
                      hover:text-indigo-600
                      dark:border-white/10
                      dark:bg-[#151821]
                      dark:text-slate-200
                    "
                  >
                    Reset preferences
                  </button>

                </section>


                {/* DANGER ZONE */}

                <section
                  className="
                    rounded-3xl
                    border
                    border-red-200
                    bg-red-50/60
                    p-6
                    sm:p-8
                    dark:border-red-500/20
                    dark:bg-red-500/5
                  "
                >

                  <p
                    className="
                      text-xs
                      font-extrabold
                      uppercase
                      tracking-[0.18em]
                      text-red-500
                    "
                  >
                    Danger Zone
                  </p>

                  <h2
                    className="
                      mt-2
                      text-xl
                      font-bold
                      text-red-700
                      dark:text-red-400
                    "
                  >
                    Delete account
                  </h2>

                  <p
                    className="
                      mt-2
                      max-w-xl
                      text-sm
                      leading-6
                      text-red-600/80
                      dark:text-red-400/70
                    "
                  >
                    Permanently remove your account
                    and locally stored preferences.
                    This action cannot be undone.
                  </p>


                  <button
                    type="button"
                    onClick={deleteAccount}
                    className="
                      mt-6
                      rounded-xl
                      bg-red-600
                      px-5
                      py-3
                      text-sm
                      font-bold
                      text-white
                      transition
                      duration-300
                      hover:-translate-y-0.5
                      hover:bg-red-700
                    "
                  >
                    Delete Account
                  </button>

                </section>

              </div>
            )}

          </main>

        </div>


        {/* ====================================================
            QUICK SAVE BAR
        ==================================================== */}

        <div
          className="
            mt-6
            flex
            flex-wrap
            items-center
            justify-between
            gap-4
            rounded-3xl
            border
            border-slate-200
            bg-white
            p-4
            shadow-sm
            dark:border-white/10
            dark:bg-[#11141b]
          "
        >

          <div>

            <p
              className="
                text-sm
                font-bold
                text-slate-900
                dark:text-white
              "
            >
              Quick Save
            </p>

            <p
              className="
                mt-1
                text-xs
                text-slate-500
                dark:text-slate-400
              "
            >
              Save your current preferences and
              profile information.
            </p>

          </div>


          <button
            type="button"
            onClick={saveSettings}
            className="
              rounded-xl
              bg-slate-900
              px-5
              py-3
              text-sm
              font-bold
              text-white
              transition
              duration-300
              hover:-translate-y-0.5
              hover:bg-slate-800
              dark:bg-white
              dark:text-slate-900
              dark:hover:bg-slate-200
            "
          >
            Save Changes
          </button>

        </div>


        <div className="h-10" />

      </div>

    </div>
  );
}