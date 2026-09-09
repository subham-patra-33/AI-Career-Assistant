import React, { useEffect, useState } from "react";
import {
  FileText,
  Sparkles,
  LogOut,
  ArrowRight,
  Plus,
  BarChart3,
  WandSparkles,
  Zap,
  CheckCircle2,
  Clock3,
  Target,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import BackButton from "../BackButton";
import API from "../../lib/api";


function Dashboard() {
  const [counts, setCounts] = useState({
    resumes: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();


  // ==========================================================
  // CHECK LOGIN
  // ==========================================================

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/");
    }
  }, [navigate]);


  // ==========================================================
  // LOAD DASHBOARD DATA
  // ==========================================================

  async function load() {
    const token = localStorage.getItem("token");

    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const resp = await API.listResumes();

      if (resp && resp.error) {
        setError(
          resp.message ||
            "Failed to load your resumes."
        );
      } else {
        setCounts({
          resumes: (resp || []).length,
        });
      }
    } catch (err) {
      console.error(err);

      setError(
        "Something went wrong while loading your workspace."
      );
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    load();
  }, []);


  // ==========================================================
  // LOGOUT
  // ==========================================================

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/");
  }


  // ==========================================================
  // DASHBOARD
  // ==========================================================

  return (
    <div
      className="
        w-full
        min-w-0
        min-h-full
        bg-[#f7f8fc]
        text-slate-900
      "
    >

      {/* ======================================================
          FULL-WIDTH DASHBOARD CONTENT
          ====================================================== */}

      <div
        className="
          w-full
          min-w-0
          px-5
          py-7
          sm:px-7
          sm:py-8
          lg:px-10
          lg:py-9
          xl:px-12
        "
      >

        {/* ====================================================
            HEADER
            ==================================================== */}

        <div
          className="
            flex
            w-full
            min-w-0
            flex-col
            gap-5
            pb-8
            animate-fade
            sm:flex-row
            sm:items-end
            sm:justify-between
          "
        >

          <div className="min-w-0">

            <div className="mb-4 flex items-center gap-3">

              {/* Existing back button.
                  Do NOT add another one in App.jsx. */}

              <BackButton fallbackRoute="/home" />

              <div className="ai-badge">
                <Sparkles size={13} />
                AI RESUME WORKSPACE
              </div>

            </div>


            <h1
              className="
                text-3xl
                font-display
                font-bold
                tracking-tight
                md:text-4xl
                lg:text-5xl
              "
            >
              Build your{" "}
              <span className="gradient-text">
                career story.
              </span>
            </h1>


            <p
              className="
                muted
                mt-3
                max-w-3xl
                text-sm
                leading-relaxed
                md:text-base
              "
            >
              Create polished, ATS-friendly resumes
              with AI-powered suggestions designed
              around your target role.
            </p>

          </div>


          {/* ==================================================
              LOGOUT
              ================================================== */}

          <button
            type="button"
            onClick={handleLogout}
            className="
              btn
              btn-secondary
              shrink-0
              self-start
              sm:self-auto
            "
          >
            <LogOut size={16} />
            Log out
          </button>

        </div>


        {/* ====================================================
            MAIN AI HERO
            ==================================================== */}

        <section
          className="
            card
            ai-glow
            tech-grid
            relative
            mb-7
            w-full
            min-w-0
            overflow-hidden
            p-6
            animate-slide-up
            sm:p-7
            lg:p-10
          "
        >

          <div
            className="
              relative
              z-10
              w-full
              max-w-4xl
            "
          >

            {/* AI STATUS */}

            <div
              className="
                mb-6
                flex
                items-center
                gap-3
              "
            >

              <div
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-indigo-500/10
                  bg-indigo-500/10
                "
              >
                <WandSparkles
                  size={21}
                  className="text-indigo-500"
                />
              </div>


              <div className="min-w-0">

                <p className="text-sm font-semibold">
                  AI Professional Resume Maker
                </p>

                <div
                  className="
                    muted
                    mt-1
                    flex
                    items-center
                    gap-2
                    text-xs
                  "
                >
                  <span
                    className="
                      h-1.5
                      w-1.5
                      rounded-full
                      bg-green-500
                      animate-pulse
                    "
                  />

                  AI engine ready
                </div>

              </div>

            </div>


            {/* HERO HEADING */}

            <h2
              className="
                text-3xl
                font-display
                font-bold
                leading-[1.05]
                tracking-tight
                md:text-5xl
                lg:text-6xl
              "
            >
              Turn your experience
              <br />

              into{" "}
              <span className="gradient-text">
                opportunity.
              </span>
            </h2>


            <p
              className="
                muted
                mt-5
                max-w-2xl
                text-sm
                leading-7
                md:text-base
              "
            >
              Answer a few questions about yourself
              and let AI transform your experience
              into professional, recruiter-ready
              resume content.
            </p>


            {/* HERO BUTTONS */}

            <div
              className="
                mt-7
                flex
                flex-wrap
                gap-3
              "
            >

              <button
                type="button"
                onClick={() => navigate("/resume")}
                className="btn btn-primary"
              >
                <Plus size={17} />
                Create resume
                <ArrowRight size={16} />
              </button>


              <button
                type="button"
                onClick={() =>
                  navigate("/total-resumes")
                }
                className="btn btn-secondary"
              >
                View my resumes
              </button>

            </div>


            {/* FEATURE LIST */}

            <div
              className="
                mt-8
                flex
                flex-wrap
                gap-x-7
                gap-y-3
                text-xs
                muted
              "
            >

              <div className="flex items-center gap-2">
                <CheckCircle2
                  size={14}
                  className="text-green-500"
                />
                ATS optimized
              </div>


              <div className="flex items-center gap-2">
                <Sparkles
                  size={14}
                  className="text-indigo-500"
                />
                AI powered
              </div>


              <div className="flex items-center gap-2">
                <Zap
                  size={14}
                  className="text-gold"
                />
                Fast generation
              </div>


              <div className="flex items-center gap-2">
                <Target
                  size={14}
                  className="text-teal"
                />
                Role focused
              </div>

            </div>

          </div>


          {/* ==================================================
              DECORATIVE AI ORB
              ================================================== */}

          <div
            className="
              absolute
              bottom-8
              right-10
              hidden
              h-44
              w-44
              items-center
              justify-center
              rounded-full
              border
              border-indigo-500/10
              opacity-60
              lg:flex
              xl:right-20
            "
          >

            <div
              className="
                flex
                h-32
                w-32
                items-center
                justify-center
                rounded-full
                border
                border-purple-500/15
              "
            >

              <div
                className="
                  flex
                  h-20
                  w-20
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-indigo-500/20
                  bg-indigo-500/5
                  animate-glow
                "
              >

                <Sparkles
                  size={25}
                  className="text-indigo-400"
                />

              </div>

            </div>

          </div>

        </section>


        {/* ====================================================
            QUICK STATS
            ==================================================== */}

        <section
          className="
            mb-9
            grid
            w-full
            min-w-0
            grid-cols-1
            gap-4
            sm:grid-cols-3
          "
        >

          {/* RESUMES */}

          <div className="card min-w-0 p-5">

            <div className="flex items-start justify-between gap-4">

              <div className="min-w-0">

                <p
                  className="
                    muted
                    text-[11px]
                    font-semibold
                    uppercase
                    tracking-[0.12em]
                  "
                >
                  Resumes
                </p>

                <p
                  className="
                    mt-2
                    text-3xl
                    font-display
                    font-bold
                  "
                >
                  {loading
                    ? "—"
                    : counts.resumes}
                </p>

              </div>


              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-teal/10
                "
              >
                <FileText
                  size={19}
                  className="text-teal"
                />
              </div>

            </div>

            <p className="muted mt-3 text-xs">
              {counts.resumes === 0
                ? "Your first resume starts here."
                : "Saved in your workspace."}
            </p>

          </div>


          {/* ATS */}

          <div className="card min-w-0 p-5">

            <div className="flex items-start justify-between gap-4">

              <div className="min-w-0">

                <p
                  className="
                    muted
                    text-[11px]
                    font-semibold
                    uppercase
                    tracking-[0.12em]
                  "
                >
                  Optimization
                </p>

                <p
                  className="
                    mt-2
                    text-3xl
                    font-display
                    font-bold
                  "
                >
                  ATS
                </p>

              </div>


              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-green-500/10
                "
              >
                <BarChart3
                  size={19}
                  className="text-green-500"
                />
              </div>

            </div>

            <p className="muted mt-3 text-xs">
              Structured for applicant tracking systems.
            </p>

          </div>


          {/* AI ENGINE */}

          <div className="card min-w-0 p-5">

            <div className="flex items-start justify-between gap-4">

              <div className="min-w-0">

                <p
                  className="
                    muted
                    text-[11px]
                    font-semibold
                    uppercase
                    tracking-[0.12em]
                  "
                >
                  AI engine
                </p>

                <p
                  className="
                    mt-2
                    text-3xl
                    font-display
                    font-bold
                  "
                >
                  Ready
                </p>

              </div>


              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-purple-500/10
                "
              >
                <Sparkles
                  size={19}
                  className="text-purple-500"
                />
              </div>

            </div>

            <p className="muted mt-3 text-xs">
              Generate stronger resume content.
            </p>

          </div>

        </section>


        {/* ====================================================
            WORKSPACE HEADER
            ==================================================== */}

        <section className="w-full min-w-0">

          <div className="mb-5">

            <h2
              className="
                text-xl
                font-display
                font-semibold
              "
            >
              Your workspace
            </h2>

            <p className="muted mt-1 text-sm">
              Everything you need to build and improve
              your resume.
            </p>

          </div>


          {/* ==================================================
              WORKSPACE CARDS
              ================================================== */}

          <div
            className="
              grid
              w-full
              min-w-0
              grid-cols-1
              gap-5
              md:grid-cols-2
            "
          >

            {/* MY RESUMES */}

            <button
              type="button"
              onClick={() =>
                navigate("/total-resumes")
              }
              className="
                card
                group
                min-w-0
                cursor-pointer
                p-6
                text-left
                transition-transform
                hover:-translate-y-1
              "
            >

              <div className="flex items-start justify-between">

                <div
                  className="
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-xl
                    bg-teal/10
                  "
                >
                  <FileText
                    size={21}
                    className="text-teal"
                  />
                </div>


                <ArrowRight
                  size={18}
                  className="
                    muted
                    transition-transform
                    duration-200
                    group-hover:translate-x-1
                  "
                />

              </div>


              <h3
                className="
                  mt-5
                  text-lg
                  font-display
                  font-semibold
                "
              >
                My resumes
              </h3>


              <p
                className="
                  muted
                  mt-1
                  max-w-md
                  text-sm
                  leading-relaxed
                "
              >
                View, manage and continue editing
                your saved resumes.
              </p>


              <div
                className="
                  mt-5
                  flex
                  items-center
                  gap-2
                  text-xs
                  font-medium
                  text-teal
                "
              >
                <Clock3 size={13} />

                {loading
                  ? "Loading..."
                  : counts.resumes === 0
                    ? "No resumes created yet"
                    : `${counts.resumes} resume${
                        counts.resumes === 1
                          ? ""
                          : "s"
                      } created`}
              </div>

            </button>


            {/* AI SUGGESTIONS */}

            <button
              type="button"
              onClick={() =>
                navigate("/ai-suggestions")
              }
              className="
                card
                group
                min-w-0
                cursor-pointer
                p-6
                text-left
                transition-transform
                hover:-translate-y-1
              "
            >

              <div className="flex items-start justify-between">

                <div
                  className="
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-xl
                    bg-purple-500/10
                  "
                >
                  <Sparkles
                    size={21}
                    className="text-purple-500"
                  />
                </div>


                <ArrowRight
                  size={18}
                  className="
                    muted
                    transition-transform
                    duration-200
                    group-hover:translate-x-1
                  "
                />

              </div>


              <h3
                className="
                  mt-5
                  text-lg
                  font-display
                  font-semibold
                "
              >
                AI suggestions
              </h3>


              <p
                className="
                  muted
                  mt-1
                  max-w-md
                  text-sm
                  leading-relaxed
                "
              >
                Improve your resume wording,
                achievements and impact using AI.
              </p>


              <div
                className="
                  mt-5
                  flex
                  items-center
                  gap-2
                  text-xs
                  font-medium
                  text-purple-500
                "
              >
                <Sparkles size={13} />
                Explore AI tools
              </div>

            </button>

          </div>

        </section>


        {/* ====================================================
            QUICK ACTIONS
            ==================================================== */}

        <section className="w-full min-w-0 pb-14 pt-9">

          <div className="mb-5">

            <h2
              className="
                text-xl
                font-display
                font-semibold
              "
            >
              Quick actions
            </h2>

            <p className="muted mt-1 text-sm">
              Jump directly into your career tools.
            </p>

          </div>


          <div
            className="
              grid
              w-full
              min-w-0
              grid-cols-1
              gap-4
              sm:grid-cols-2
              lg:grid-cols-4
            "
          >

            {/* CREATE RESUME */}

            <button
              type="button"
              onClick={() => navigate("/resume")}
              className="
                card
                min-w-0
                cursor-pointer
                p-5
                text-left
                transition
                hover:-translate-y-1
              "
            >

              <Plus
                size={21}
                className="text-indigo-600"
              />

              <h3 className="mt-4 text-sm font-bold">
                Create Resume
              </h3>

              <p className="muted mt-1 text-xs leading-5">
                Start a new AI-powered resume.
              </p>

            </button>


            {/* ATS CHECKER */}

            <button
              type="button"
              onClick={() => navigate("/ats")}
              className="
                card
                min-w-0
                cursor-pointer
                p-5
                text-left
                transition
                hover:-translate-y-1
              "
            >

              <CheckCircle2
                size={21}
                className="text-emerald-600"
              />

              <h3 className="mt-4 text-sm font-bold">
                ATS Checker
              </h3>

              <p className="muted mt-1 text-xs leading-5">
                Analyze your resume for ATS compatibility.
              </p>

            </button>


            {/* JOB MATCH */}

            <button
              type="button"
              onClick={() => navigate("/job-match")}
              className="
                card
                min-w-0
                cursor-pointer
                p-5
                text-left
                transition
                hover:-translate-y-1
              "
            >

              <Target
                size={21}
                className="text-amber-500"
              />

              <h3 className="mt-4 text-sm font-bold">
                Job Match
              </h3>

              <p className="muted mt-1 text-xs leading-5">
                Compare your resume with a target job.
              </p>

            </button>


            {/* TEMPLATES */}

            <button
              type="button"
              onClick={() => navigate("/templates")}
              className="
                card
                min-w-0
                cursor-pointer
                p-5
                text-left
                transition
                hover:-translate-y-1
              "
            >

              <FileText
                size={21}
                className="text-purple-600"
              />

              <h3 className="mt-4 text-sm font-bold">
                Templates
              </h3>

              <p className="muted mt-1 text-xs leading-5">
                Choose a professional resume design.
              </p>

            </button>

          </div>

        </section>


        {/* ====================================================
            ERROR
            ==================================================== */}

        {error && (
          <div
            className="
              mb-10
              flex
              items-start
              gap-3
              rounded-xl
              border
              border-brick/20
              bg-brick/5
              p-4
            "
          >

            <div
              className="
                flex
                h-7
                w-7
                shrink-0
                items-center
                justify-center
                rounded-lg
                bg-brick/10
              "
            >
              <FileText
                size={14}
                className="text-brick"
              />
            </div>


            <div className="min-w-0">

              <p
                className="
                  text-sm
                  font-semibold
                  text-brick
                "
              >
                Unable to load workspace
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  text-brick/80
                "
              >
                {error}
              </p>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}


export default Dashboard;