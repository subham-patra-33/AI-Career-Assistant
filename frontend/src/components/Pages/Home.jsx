import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";


// ============================================================
// MOBILE RESPONSIVE FIX
// ============================================================

function MobileHomeStyles() {
  return (
    <style>{`
      /*
       * ========================================================
       * HOME RESPONSIVE LAYOUT
       * ========================================================
       *
       * IMPORTANT:
       * Home no longer needs a negative margin on mobile.
       *
       * The old version used:
       *
       *   margin-left: -16rem;
       *
       * because the old App layout reserved sidebar space.
       *
       * The new App layout does NOT reserve sidebar space on
       * mobile, so that negative margin was pushing the entire
       * Home page 256px to the left.
       */

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

        /*
         * HERO
         */

        .home-page section,
        .home-page > div {
          min-width: 0;
          max-width: 100%;
        }

        /*
         * MOBILE RESUME MOCKUP
         */

        .home-page .mobile-resume-mockup {
          width: 100%;
          max-width: 360px;
          min-width: 0;

          margin-left: auto;
          margin-right: auto;
        }

        /*
         * FEATURE CARDS
         */

        .home-page .mobile-feature-card {
          width: 100%;
          min-width: 0;
        }

        /*
         * PROCESS CARDS
         */

        .home-page .mobile-step-card {
          width: 100%;
          min-width: 0;
        }

        /*
         * FINAL CTA
         */

        .home-page .mobile-cta {
          width: 100%;
          min-width: 0;
        }

        /*
         * Prevent long text from creating horizontal overflow.
         */

        .home-page h1,
        .home-page h2,
        .home-page h3,
        .home-page p,
        .home-page span {
          max-width: 100%;
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
        threshold: options.threshold ?? 0.15,
        rootMargin:
          options.rootMargin ?? "0px 0px -60px 0px",
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
  duration = 700,
}) {
  const [ref, visible] = useScrollReveal();

  const directionClasses = {
    up: visible
      ? "translate-y-0 opacity-100"
      : "translate-y-10 opacity-0",

    down: visible
      ? "translate-y-0 opacity-100"
      : "-translate-y-10 opacity-0",

    left: visible
      ? "translate-x-0 opacity-100"
      : "-translate-x-12 opacity-0",

    right: visible
      ? "translate-x-0 opacity-100"
      : "translate-x-12 opacity-0",

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
        transitionTimingFunction:
          "cubic-bezier(0.22, 1, 0.36, 1)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}


// ============================================================
// RESUME MOCKUP
// ============================================================

function ResumeMockup() {
  return (
    <div
      className="
        mobile-resume-mockup
        relative
        mx-auto
        w-full
        max-w-[500px]
        px-0
        sm:px-1
        lg:mx-0
      "
    >

      {/* ATS BADGE */}

      <div
        className="
          absolute
          -bottom-5
          left-2
          z-20
          hidden
          items-center
          gap-3
          rounded-2xl
          border
          border-emerald-100
          bg-white
          px-4
          py-3
          shadow-xl
          sm:flex
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
            rounded-full
            bg-emerald-50
            text-emerald-600
          "
        >
          ✓
        </div>

        <div>
          <p className="text-xs font-bold text-slate-800">
            ATS Ready
          </p>

          <p className="text-[11px] text-slate-400">
            87% match
          </p>
        </div>
      </div>


      {/* AI BADGE */}

      <div
        className="
          absolute
          right-2
          top-8
          z-20
          hidden
          items-center
          gap-3
          rounded-2xl
          border
          border-purple-100
          bg-white
          px-4
          py-3
          shadow-xl
          sm:flex
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
            rounded-full
            bg-purple-50
            text-purple-600
          "
        >
          ✦
        </div>

        <div>
          <p className="text-xs font-bold text-slate-800">
            AI Enhanced
          </p>

          <p className="text-[11px] text-slate-400">
            Content improved
          </p>
        </div>
      </div>


      {/* RESUME CARD */}

      <div
        className="
          w-full
          max-w-full
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-2xl
          transition
          duration-500
          hover:-translate-y-2
          hover:shadow-[0_25px_70px_rgba(79,70,229,0.18)]
        "
      >

        {/* HEADER */}

        <div
          className="
            flex
            min-h-[96px]
            items-center
            gap-3
            bg-gradient-to-r
            from-indigo-600
            via-violet-600
            to-purple-600
            px-4
            py-5
            sm:min-h-[105px]
            sm:gap-4
            sm:px-7
            sm:py-6
          "
        >

          <div
            className="
              flex
              h-12
              w-12
              shrink-0
              items-center
              justify-center
              rounded-full
              border-2
              border-white/50
              bg-white/10
              text-sm
              font-bold
              text-white
              sm:h-14
              sm:w-14
            "
          >
            SM
          </div>


          <div className="min-w-0">

            <div
              className="
                truncate
                text-base
                font-bold
                text-white
                sm:text-xl
              "
            >
              YOUR NAME
            </div>

            <div
              className="
                mt-1
                text-[7px]
                font-semibold
                uppercase
                tracking-[0.15em]
                text-white/70
                sm:text-[9px]
                sm:tracking-[0.2em]
              "
            >
              SOFTWARE DEVELOPER
            </div>

          </div>

        </div>


        {/* BODY */}

        <div
          className="
            grid
            grid-cols-[74px_minmax(0,1fr)]
            gap-3
            p-3
            sm:grid-cols-[100px_minmax(0,1fr)]
            sm:gap-7
            sm:p-7
          "
        >

          {/* LEFT COLUMN */}

          <div className="min-w-0">

            {/* CONTACT */}

            <div className="mb-6 sm:mb-7">

              <h4
                className="
                  mb-3
                  text-[7px]
                  font-extrabold
                  uppercase
                  tracking-[0.14em]
                  text-indigo-600
                  sm:text-[8px]
                  sm:tracking-[0.18em]
                "
              >
                CONTACT
              </h4>

              <div className="space-y-2">

                <div className="h-1.5 w-full rounded bg-slate-200" />

                <div className="h-1.5 w-4/5 rounded bg-slate-200" />

                <div className="h-1.5 w-full rounded bg-slate-200" />

                <div className="h-1.5 w-3/5 rounded bg-slate-200" />

              </div>

            </div>


            {/* SKILLS */}

            <div>

              <h4
                className="
                  mb-3
                  text-[7px]
                  font-extrabold
                  uppercase
                  tracking-[0.14em]
                  text-indigo-600
                  sm:text-[8px]
                  sm:tracking-[0.18em]
                "
              >
                SKILLS
              </h4>

              <div className="space-y-2">

                {[
                  "React",
                  "JavaScript",
                  "Python",
                  "MongoDB",
                ].map((skill) => (
                  <span
                    key={skill}
                    className="
                      mr-1
                      inline-block
                      rounded
                      bg-indigo-50
                      px-1.5
                      py-1
                      text-[6px]
                      font-semibold
                      text-indigo-600
                      sm:px-2
                      sm:text-[7px]
                    "
                  >
                    {skill}
                  </span>
                ))}

              </div>

            </div>

          </div>


          {/* RIGHT COLUMN */}

          <div className="min-w-0">

            <ResumeSection
              title="PROFILE"
              lines={[100, 92, 78]}
            />

            <ResumeSection
              title="EXPERIENCE"
              heading="Software Developer"
              lines={[100, 96, 84, 72]}
            />

            <ResumeSection
              title=""
              heading="Frontend Developer"
              lines={[98, 88, 68]}
            />

            <ResumeSection
              title="EDUCATION"
              lines={[100, 90, 74]}
            />

          </div>

        </div>

      </div>

    </div>
  );
}


// ============================================================
// RESUME SECTION
// ============================================================

function ResumeSection({
  title,
  heading,
  lines = [],
}) {
  return (
    <div className="mb-5 min-w-0 sm:mb-7">

      {title && (
        <h4
          className="
            mb-3
            text-[7px]
            font-extrabold
            uppercase
            tracking-[0.14em]
            text-indigo-600
            sm:text-[8px]
            sm:tracking-[0.18em]
          "
        >
          {title}
        </h4>
      )}


      {heading && (
        <div
          className="
            mb-2
            truncate
            text-[8px]
            font-bold
            text-slate-700
            sm:text-[9px]
          "
        >
          {heading}
        </div>
      )}


      <div className="space-y-2">

        {lines.map((width, index) => (
          <div
            key={index}
            className="
              h-1.5
              max-w-full
              rounded
              bg-slate-200
            "
            style={{
              width: `${width}%`,
            }}
          />
        ))}

      </div>

    </div>
  );
}


// ============================================================
// FEATURE CARD
// ============================================================

function FeatureCard({
  icon,
  title,
  description,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        mobile-feature-card
        group
        w-full
        min-w-0
        rounded-3xl
        border
        border-slate-200
        bg-white
        p-5
        text-left
        shadow-sm
        transition
        duration-500
        hover:-translate-y-2
        hover:border-indigo-200
        hover:shadow-xl
        sm:p-6
      "
    >

      <div
        className="
          mb-5
          flex
          h-12
          w-12
          items-center
          justify-center
          rounded-2xl
          bg-indigo-50
          text-xl
          text-indigo-600
          transition
          duration-300
          group-hover:rotate-6
          group-hover:bg-indigo-600
          group-hover:text-white
        "
      >
        {icon}
      </div>


      <h3 className="text-lg font-bold text-slate-900">
        {title}
      </h3>


      <p
        className="
          mt-2
          text-sm
          leading-6
          text-slate-500
        "
      >
        {description}
      </p>


      <div
        className="
          mt-5
          text-sm
          font-semibold
          text-indigo-600
          transition
          duration-300
          group-hover:translate-x-1
        "
      >
        Explore →
      </div>

    </button>
  );
}


// ============================================================
// STEP CARD
// ============================================================

function StepCard({
  number,
  title,
  text,
}) {
  return (
    <div
      className="
        mobile-step-card
        rounded-2xl
        border
        border-white/10
        bg-white/5
        p-5
        transition
        duration-500
        hover:-translate-y-2
        hover:bg-white/10
      "
    >

      <div
        className="
          text-xs
          font-bold
          text-indigo-300
        "
      >
        {number}
      </div>


      <h3
        className="
          mt-4
          text-lg
          font-bold
        "
      >
        {title}
      </h3>


      <p
        className="
          mt-2
          text-sm
          leading-6
          text-slate-400
        "
      >
        {text}
      </p>

    </div>
  );
}


// ============================================================
// HOME
// ============================================================

export default function Home() {

  const navigate = useNavigate();


  // ==========================================================
  // HERO SCROLL ANIMATIONS
  // ==========================================================

  const [heroRef, heroVisible] = useScrollReveal({
    threshold: 0.05,
    rootMargin: "0px",
  });


  const [mockupRef, mockupVisible] = useScrollReveal({
    threshold: 0.05,
    rootMargin: "0px",
  });


  return (
    <>
      <MobileHomeStyles />

      <div
        className="
          home-page
          w-full
          min-w-0
          max-w-full
          overflow-x-hidden
          bg-[#f8f9fd]
          text-slate-900
        "
      >

        {/* ======================================================
            HERO
        ====================================================== */}

        <section
          className="
            w-full
            min-w-0
            pb-12
            pt-0
            sm:pb-20
            sm:pt-0
            lg:pb-24
          "
        >

          <div
            className="
              relative
              w-full
              min-w-0
              overflow-hidden
              border-b
              border-slate-100
              bg-white
              px-4
              py-7
              shadow-sm
              sm:px-8
              sm:py-12
              lg:px-12
              lg:py-16
              xl:px-16
            "
          >

            {/* BACKGROUND DECORATION */}

            <div
              className="
                pointer-events-none
                absolute
                right-0
                top-0
                h-48
                w-48
                rounded-full
                bg-indigo-100/40
                blur-3xl
                animate-pulse
                sm:h-64
                sm:w-64
              "
            />


            <div
              className="
                pointer-events-none
                absolute
                bottom-0
                left-1/3
                h-44
                w-44
                rounded-full
                bg-purple-100/30
                blur-3xl
                sm:h-56
                sm:w-56
              "
            />


            {/* HERO GRID */}

            <div
              className="
                relative
                z-10
                grid
                w-full
                min-w-0
                grid-cols-1
                items-center
                gap-10
                lg:grid-cols-[minmax(0,1fr)_minmax(350px,500px)]
                lg:gap-8
                xl:gap-12
              "
            >

              {/* LEFT */}

              <div
                ref={heroRef}
                className={`
                  min-w-0
                  w-full
                  max-w-2xl
                  transform
                  transition-all
                  duration-1000
                  ease-[cubic-bezier(0.22,1,0.36,1)]
                  ${
                    heroVisible
                      ? "translate-y-0 opacity-100"
                      : "translate-y-10 opacity-0"
                  }
                `}
              >

                {/* BADGE */}

                <div
                  className="
                    mb-5
                    inline-flex
                    max-w-full
                    items-center
                    gap-2
                    rounded-full
                    border
                    border-indigo-100
                    bg-indigo-50
                    px-3
                    py-2
                    text-[8px]
                    font-extrabold
                    uppercase
                    tracking-[0.12em]
                    text-indigo-600
                    sm:mb-6
                    sm:px-4
                    sm:text-[9px]
                    sm:tracking-[0.16em]
                  "
                >
                  <span>✦</span>
                  AI-Powered Resume Builder
                </div>


                {/* HEADING */}

                <h1
                  className="
                    max-w-full
                    text-[38px]
                    font-medium
                    leading-[1.03]
                    tracking-[-0.045em]
                    text-slate-900
                    sm:text-5xl
                    md:text-6xl
                    lg:text-[58px]
                    xl:text-[68px]
                  "
                >
                  Build a resume

                  <br />

                  <span
                    className="
                      bg-gradient-to-r
                      from-indigo-600
                      via-violet-600
                      to-purple-600
                      bg-clip-text
                      text-transparent
                    "
                  >
                    that gets
                  </span>

                  <br />

                  <span
                    className="
                      bg-gradient-to-r
                      from-indigo-600
                      via-violet-600
                      to-purple-600
                      bg-clip-text
                      text-transparent
                    "
                  >
                    noticed.
                  </span>
                </h1>


                {/* DESCRIPTION */}

                <p
                  className="
                    mt-5
                    max-w-xl
                    text-sm
                    leading-7
                    text-slate-500
                    sm:mt-6
                    sm:text-base
                    sm:leading-8
                  "
                >
                  Create a professional, ATS-friendly resume in minutes.
                  Let AI improve your content, highlight your strengths
                  and tailor your resume to the job you want.
                </p>


                {/* BUTTONS */}

                <div
                  className="
                    mt-7
                    flex
                    w-full
                    flex-col
                    gap-3
                    sm:mt-8
                    sm:flex-row
                  "
                >

                  <button
                    type="button"
                    onClick={() => navigate("/resume")}
                    className="
                      flex
                      w-full
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      bg-gradient-to-r
                      from-indigo-600
                      to-violet-600
                      px-7
                      py-4
                      text-sm
                      font-bold
                      text-white
                      shadow-lg
                      shadow-indigo-200
                      transition
                      duration-300
                      hover:-translate-y-1
                      hover:shadow-xl
                      sm:w-auto
                    "
                  >
                    Create My Resume
                    <span>→</span>
                  </button>


                  <button
                    type="button"
                    onClick={() => navigate("/templates")}
                    className="
                      flex
                      w-full
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      px-7
                      py-4
                      text-sm
                      font-bold
                      text-slate-700
                      shadow-sm
                      transition
                      duration-300
                      hover:-translate-y-1
                      hover:border-indigo-200
                      hover:text-indigo-600
                      sm:w-auto
                    "
                  >
                    Explore Templates
                  </button>

                </div>


                {/* TRUST POINTS */}

                <div
                  className="
                    mt-6
                    flex
                    w-full
                    flex-wrap
                    gap-x-5
                    gap-y-3
                    text-xs
                    font-medium
                    text-slate-500
                    sm:mt-7
                    sm:gap-x-6
                  "
                >

                  <span className="flex items-center gap-2">
                    <span className="text-emerald-500">
                      ✓
                    </span>
                    ATS Optimized
                  </span>


                  <span className="flex items-center gap-2">
                    <span className="text-emerald-500">
                      ✓
                    </span>
                    AI Powered
                  </span>


                  <span className="flex items-center gap-2">
                    <span className="text-emerald-500">
                      ✓
                    </span>
                    Professional Templates
                  </span>

                </div>

              </div>


              {/* RIGHT / RESUME */}

              <div
                ref={mockupRef}
                className={`
                  flex
                  min-w-0
                  w-full
                  items-center
                  justify-center
                  lg:justify-end
                  transform
                  transition-all
                  duration-[1100ms]
                  ease-[cubic-bezier(0.22,1,0.36,1)]
                  ${
                    mockupVisible
                      ? "translate-x-0 opacity-100"
                      : "translate-x-16 opacity-0"
                  }
                `}
              >
                <ResumeMockup />
              </div>

            </div>

          </div>

        </section>


        {/* ======================================================
            FEATURE BAR
        ====================================================== */}

        <Reveal direction="up">

          <section
            className="
              w-full
              border-y
              border-slate-200
              bg-white
              py-5
            "
          >

            <div
              className="
                flex
                w-full
                flex-wrap
                items-center
                justify-center
                gap-x-5
                gap-y-3
                px-4
                text-[9px]
                font-bold
                uppercase
                tracking-[0.12em]
                text-slate-400
                sm:justify-between
                sm:px-8
                sm:text-[10px]
                sm:tracking-[0.18em]
                lg:px-12
              "
            >

              <span>
                ✦ AI Writing
              </span>

              <span>
                ✓ ATS Check
              </span>

              <span>
                ◆ Job Match
              </span>

              <span>
                ◇ Professional Templates
              </span>

            </div>

          </section>

        </Reveal>


        {/* ======================================================
            FEATURES
        ====================================================== */}

        <section
          className="
            w-full
            px-4
            py-12
            sm:px-8
            sm:py-20
            lg:px-12
            lg:py-24
            xl:px-16
          "
        >

          <Reveal direction="up">

            <div className="mb-8 sm:mb-10">

              <p
                className="
                  text-xs
                  font-extrabold
                  uppercase
                  tracking-[0.2em]
                  text-indigo-600
                "
              >
                Build a better resume
              </p>


              <h2
                className="
                  mt-3
                  max-w-2xl
                  text-3xl
                  font-bold
                  tracking-tight
                  text-slate-900
                  sm:text-4xl
                "
              >
                Everything you need to{" "}

                <span className="text-indigo-600">
                  stand out.
                </span>
              </h2>


              <p
                className="
                  mt-4
                  max-w-2xl
                  text-sm
                  leading-7
                  text-slate-500
                  sm:text-base
                "
              >
                Create, optimize and analyze your resume using the
                tools built into your AI Career Assistant.
              </p>

            </div>

          </Reveal>


          {/* FEATURE GRID */}

          <div
            className="
              grid
              w-full
              grid-cols-1
              gap-4
              md:grid-cols-2
              xl:grid-cols-4
              sm:gap-5
            "
          >

            <Reveal
              delay={0}
              direction="up"
            >
              <FeatureCard
                icon="✦"
                title="AI Resume Builder"
                description="Generate polished, professional resume content with AI."
                onClick={() => navigate("/resume")}
              />
            </Reveal>


            <Reveal
              delay={100}
              direction="up"
            >
              <FeatureCard
                icon="✓"
                title="ATS Checker"
                description="Check how well your resume matches a target job description."
                onClick={() => navigate("/ats")}
              />
            </Reveal>


            <Reveal
              delay={200}
              direction="up"
            >
              <FeatureCard
                icon="◆"
                title="Job Match"
                description="Compare your resume with a job and identify missing skills."
                onClick={() => navigate("/job-match")}
              />
            </Reveal>


            <Reveal
              delay={300}
              direction="up"
            >
              <FeatureCard
                icon="▣"
                title="Templates"
                description="Choose from professional layouts designed for modern hiring."
                onClick={() => navigate("/templates")}
              />
            </Reveal>

          </div>

        </section>


        {/* ======================================================
            HOW IT WORKS
        ====================================================== */}

        <section
          className="
            w-full
            bg-slate-900
            px-4
            py-12
            text-white
            sm:px-8
            sm:py-16
            lg:px-12
            xl:px-16
          "
        >

          <div
            className="
              grid
              gap-8
              lg:grid-cols-[0.8fr_1.2fr]
              lg:items-center
              lg:gap-10
            "
          >

            {/* LEFT */}

            <Reveal direction="left">

              <div>

                <p
                  className="
                    text-xs
                    font-extrabold
                    uppercase
                    tracking-[0.2em]
                    text-indigo-300
                  "
                >
                  Simple process
                </p>


                <h2
                  className="
                    mt-4
                    text-3xl
                    font-bold
                    tracking-tight
                    sm:text-4xl
                  "
                >
                  Build your resume

                  <br />

                  in three steps.
                </h2>


                <p
                  className="
                    mt-5
                    max-w-md
                    text-sm
                    leading-7
                    text-slate-400
                  "
                >
                  No complicated setup. Enter your information,
                  improve your content and export a professional
                  resume.
                </p>

              </div>

            </Reveal>


            {/* STEPS */}

            <div
              className="
                grid
                grid-cols-1
                gap-4
                sm:grid-cols-3
              "
            >

              <Reveal
                delay={0}
                direction="up"
              >
                <StepCard
                  number="01"
                  title="Enter"
                  text="Add your experience, education and skills."
                />
              </Reveal>


              <Reveal
                delay={120}
                direction="up"
              >
                <StepCard
                  number="02"
                  title="Improve"
                  text="Use AI and ATS tools to strengthen your resume."
                />
              </Reveal>


              <Reveal
                delay={240}
                direction="up"
              >
                <StepCard
                  number="03"
                  title="Apply"
                  text="Download your resume and apply with confidence."
                />
              </Reveal>

            </div>

          </div>

        </section>


        {/* ======================================================
            FINAL CTA
        ====================================================== */}

        <section
          className="
            w-full
            px-4
            py-14
            sm:px-8
            sm:py-24
            lg:px-12
            lg:py-28
            xl:px-16
          "
        >

          <Reveal
            direction="scale"
            duration={850}
          >

            <div
              className="
                mobile-cta
                w-full
                rounded-[28px]
                border
                border-indigo-900/40
                bg-gradient-to-br
                from-[#17152b]
                via-[#111827]
                to-[#1b1230]
                px-4
                py-10
                text-center
                shadow-2xl
                shadow-black/20
                transition
                duration-500
                hover:-translate-y-1
                hover:shadow-[0_30px_80px_rgba(79,70,229,0.18)]
                sm:px-10
                sm:py-20
              "
            >

              {/* ICON */}

              <div
                className="
                  mx-auto
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-2xl
                  bg-indigo-600
                  text-2xl
                  text-white
                  shadow-lg
                  shadow-indigo-200
                  transition
                  duration-500
                  hover:rotate-12
                "
              >
                ✦
              </div>


              {/* TITLE */}

              <h2
                className="
                  mx-auto
                  mt-6
                  max-w-2xl
                  text-3xl
                  font-bold
                  tracking-tight
                  text-white
                  sm:text-4xl
                "
              >
                Ready to build a resume
                that gets noticed?
              </h2>


              {/* DESCRIPTION */}

              <p
                className="
                  mx-auto
                  mt-4
                  max-w-xl
                  text-sm
                  leading-7
                  text-slate-300
                  sm:text-base
                "
              >
                Start building your professional resume today and
                take the next step toward your career.
              </p>


              {/* CTA */}

              <button
                type="button"
                onClick={() => navigate("/resume")}
                className="
                  mt-8
                  inline-flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-gradient-to-r
                  from-indigo-600
                  to-violet-600
                  px-8
                  py-4
                  text-sm
                  font-bold
                  text-white
                  shadow-lg
                  shadow-indigo-200
                  transition
                  duration-300
                  hover:-translate-y-1
                  hover:scale-[1.02]
                  hover:shadow-xl
                  sm:w-auto
                "
              >
                Create My Resume

                <span>
                  →
                </span>

              </button>

            </div>

          </Reveal>

        </section>


        {/* BOTTOM SPACE */}

        <div className="h-8 w-full sm:h-10" />

      </div>
    </>
  );
}