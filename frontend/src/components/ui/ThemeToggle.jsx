import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";


function ThemeToggle() {

  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );


  // ==========================================================
  // SYNCHRONIZE WITH THE ACTUAL THEME
  // ==========================================================

  useEffect(() => {

    function syncTheme() {

      const isDark =
        document.documentElement.classList.contains("dark");

      setDark(isDark);
    }


    // Theme changed inside the app
    window.addEventListener(
      "themechange",
      syncTheme
    );


    // Theme changed from another browser tab
    window.addEventListener(
      "storage",
      syncTheme
    );


    // Initial synchronization
    syncTheme();


    return () => {

      window.removeEventListener(
        "themechange",
        syncTheme
      );

      window.removeEventListener(
        "storage",
        syncTheme
      );

    };

  }, []);


  // ==========================================================
  // TOGGLE THEME
  // ==========================================================

  function toggle() {

    const nextDark = !dark;


    // Apply theme to the entire application
    document.documentElement.classList.toggle(
      "dark",
      nextDark
    );


    // Persist preference
    localStorage.setItem(
      "theme",
      nextDark ? "dark" : "light"
    );


    // Immediately update this component
    setDark(nextDark);


    // Tell other components about the change
    window.dispatchEvent(
      new Event("themechange")
    );
  }


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <button
      type="button"
      onClick={toggle}
      aria-label={
        dark
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      title={
        dark
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      className="
        group
        relative
        h-10
        w-10
        shrink-0
        inline-flex
        items-center
        justify-center
        rounded-xl
        border
        border-border
        bg-background/80
        text-foreground
        backdrop-blur-sm
        transition-all
        duration-200
        hover:bg-secondary
        hover:border-indigo-500/20
        hover:scale-105
        active:scale-95
        focus:outline-none
        focus:ring-2
        focus:ring-indigo-500/20
      "
    >

      {/* ====================================================
          ACCESSIBILITY
          ==================================================== */}

      <span className="sr-only">
        {dark
          ? "Switch to light mode"
          : "Switch to dark mode"}
      </span>


      {/* ====================================================
          ICON CONTAINER
          ==================================================== */}

      <span
        className="
          relative
          flex
          items-center
          justify-center
          w-5
          h-5
        "
      >

        {/* ==================================================
            SUN
            ================================================== */}

        <Sun
          size={18}
          strokeWidth={1.9}
          aria-hidden="true"
          className={`
            absolute
            transition-all
            duration-300
            ${
              dark
                ? `
                  rotate-0
                  scale-100
                  opacity-100
                  text-amber-400
                `
                : `
                  -rotate-90
                  scale-0
                  opacity-0
                `
            }
          `}
        />


        {/* ==================================================
            MOON
            ================================================== */}

        <Moon
          size={18}
          strokeWidth={1.9}
          aria-hidden="true"
          className={`
            absolute
            transition-all
            duration-300
            ${
              dark
                ? `
                  rotate-90
                  scale-0
                  opacity-0
                `
                : `
                  rotate-0
                  scale-100
                  opacity-100
                  text-indigo-500
                `
            }
          `}
        />

      </span>


      {/* ====================================================
          SUBTLE HOVER GLOW
          ==================================================== */}

      <span
        className="
          pointer-events-none
          absolute
          inset-0
          rounded-xl
          opacity-0
          group-hover:opacity-100
          transition-opacity
          duration-200
          bg-indigo-500/5
        "
      />

    </button>
  );
}


export default ThemeToggle;