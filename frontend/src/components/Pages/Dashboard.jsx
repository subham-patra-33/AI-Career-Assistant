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
    <div className="w-full h-full overflow-y-auto">

      <div
        className="
          max-w-6xl
          mx-auto
          px-4
          sm:px-6
          lg:px-8
          py-7
          md:py-9
        "
      >


        {/* ====================================================
            HEADER
            ==================================================== */}

        <div
          className="
            flex
            flex-col
            sm:flex-row
            sm:items-end
            sm:justify-between
            gap-5
            mb-8
            animate-fade
          "
        >

          <div>

            <div className="flex items-center gap-3 mb-4">

              <BackButton fallbackRoute="/home" />

              <div className="ai-badge">
                <Sparkles size={13} />
                AI RESUME WORKSPACE
              </div>

            </div>


            <h1
              className="
                text-3xl
                md:text-4xl
                font-display
                font-bold
                tracking-tight
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
                mt-2
                max-w-2xl
                text-sm
                md:text-base
                leading-relaxed
              "
            >
              Create polished, ATS-friendly resumes
              with AI-powered suggestions designed
              around your target role.
            </p>

          </div>


          {/* Logout */}

          <button
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
            overflow-hidden
            p-6
            md:p-9
            mb-6
            animate-slide-up
          "
        >

          <div
            className="
              relative
              z-10
              max-w-3xl
            "
          >

            {/* AI status */}

            <div
              className="
                flex
                items-center
                gap-3
                mb-6
              "
            >

              <div
                className="
                  w-11
                  h-11
                  rounded-xl
                  bg-indigo-500/10
                  border
                  border-indigo-500/10
                  flex
                  items-center
                  justify-center
                "
              >
                <WandSparkles
                  size={21}
                  className="text-indigo-500"
                />
              </div>


              <div>

                <p
                  className="
                    text-sm
                    font-semibold
                  "
                >
                  AI Professional Resume Maker
                </p>

                <div
                  className="
                    flex
                    items-center
                    gap-2
                    mt-1
                    text-xs
                    muted
                  "
                >
                  <span
                    className="
                      w-1.5
                      h-1.5
                      rounded-full
                      bg-green-500
                      animate-pulse
                    "
                  />

                  AI engine ready

                </div>

              </div>

            </div>


            {/* Hero heading */}

            <h2
              className="
                text-3xl
                md:text-5xl
                font-display
                font-bold
                leading-[1.05]
                tracking-tight
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
                max-w-xl
                text-sm
                md:text-base
                leading-relaxed
              "
            >
              Answer a few questions about yourself
              and let AI transform your experience
              into professional, recruiter-ready
              resume content.
            </p>


            {/* Hero buttons */}

            <div
              className="
                flex
                flex-wrap
                gap-3
                mt-7
              "
            >

              <button
                onClick={() => navigate("/resume")}
                className="btn btn-primary"
              >
                <Plus size={17} />
                Create resume
                <ArrowRight size={16} />
              </button>


              <button
                onClick={() =>
                  navigate("/total-resumes")
                }
                className="btn btn-secondary"
              >
                View my resumes
              </button>

            </div>


            {/* Feature list */}

            <div
              className="
                flex
                flex-wrap
                gap-x-6
                gap-y-3
                mt-8
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
              hidden
              lg:flex
              absolute
              right-12
              bottom-8
              w-44
              h-44
              rounded-full
              border
              border-indigo-500/10
              items-center
              justify-center
              opacity-60
            "
          >

            <div
              className="
                w-32
                h-32
                rounded-full
                border
                border-purple-500/15
                flex
                items-center
                justify-center
              "
            >

              <div
                className="
                  w-20
                  h-20
                  rounded-full
                  bg-indigo-500/5
                  border
                  border-indigo-500/20
                  flex
                  items-center
                  justify-center
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

        <div
          className="
            grid
            grid-cols-1
            sm:grid-cols-3
            gap-4
            mb-8
          "
        >

          {/* RESUMES */}

          <div className="card p-5">

            <div
              className="
                flex
                items-start
                justify-between
              "
            >

              <div>

                <p
                  className="
                    text-[11px]
                    font-semibold
                    uppercase
                    tracking-[0.12em]
                    muted
                  "
                >
                  Resumes
                </p>


                <p
                  className="
                    text-3xl
                    font-display
                    font-bold
                    mt-2
                  "
                >
                  {loading
                    ? "—"
                    : counts.resumes}
                </p>

              </div>


              <div
                className="
                  w-10
                  h-10
                  rounded-xl
                  bg-teal/10
                  flex
                  items-center
                  justify-center
                "
              >

                <FileText
                  size={19}
                  className="text-teal"
                />

              </div>

            </div>


            <p className="text-xs muted mt-3">
              {counts.resumes === 0
                ? "Your first resume starts here."
                : "Saved in your workspace."}
            </p>

          </div>



          {/* ATS */}

          <div className="card p-5">

            <div
              className="
                flex
                items-start
                justify-between
              "
            >

              <div>

                <p
                  className="
                    text-[11px]
                    font-semibold
                    uppercase
                    tracking-[0.12em]
                    muted
                  "
                >
                  Optimization
                </p>


                <p
                  className="
                    text-3xl
                    font-display
                    font-bold
                    mt-2
                  "
                >
                  ATS
                </p>

              </div>


              <div
                className="
                  w-10
                  h-10
                  rounded-xl
                  bg-green-500/10
                  flex
                  items-center
                  justify-center
                "
              >

                <BarChart3
                  size={19}
                  className="text-green-500"
                />

              </div>

            </div>


            <p className="text-xs muted mt-3">
              Structured for applicant tracking systems.
            </p>

          </div>



          {/* AI ENGINE */}

          <div className="card p-5">

            <div
              className="
                flex
                items-start
                justify-between
              "
            >

              <div>

                <p
                  className="
                    text-[11px]
                    font-semibold
                    uppercase
                    tracking-[0.12em]
                    muted
                  "
                >
                  AI engine
                </p>


                <p
                  className="
                    text-3xl
                    font-display
                    font-bold
                    mt-2
                  "
                >
                  Ready
                </p>

              </div>


              <div
                className="
                  w-10
                  h-10
                  rounded-xl
                  bg-purple-500/10
                  flex
                  items-center
                  justify-center
                "
              >

                <Sparkles
                  size={19}
                  className="text-purple-500"
                />

              </div>

            </div>


            <p className="text-xs muted mt-3">
              Generate stronger resume content.
            </p>

          </div>

        </div>



        {/* ====================================================
            WORKSPACE HEADER
            ==================================================== */}

        <div className="mb-4">

          <h2
            className="
              text-xl
              font-display
              font-semibold
            "
          >
            Your workspace
          </h2>

          <p
            className="
              text-sm
              muted
              mt-1
            "
          >
            Everything you need to build and improve
            your resume.
          </p>

        </div>



        {/* ====================================================
            WORKSPACE CARDS
            ==================================================== */}

        <div
          className="
            grid
            grid-cols-1
            md:grid-cols-2
            gap-4
          "
        >

          {/* ==================================================
              MY RESUMES
              ================================================== */}

          <button
            type="button"
            onClick={() =>
              navigate("/total-resumes")
            }
            className="
              card
              p-6
              text-left
              group
              cursor-pointer
              hover:-translate-y-1
              transition-transform
            "
          >

            <div
              className="
                flex
                items-start
                justify-between
              "
            >

              <div
                className="
                  w-11
                  h-11
                  rounded-xl
                  bg-teal/10
                  flex
                  items-center
                  justify-center
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
                text-lg
                font-display
                font-semibold
                mt-5
              "
            >
              My resumes
            </h3>


            <p
              className="
                text-sm
                muted
                mt-1
                leading-relaxed
                max-w-md
              "
            >
              View, manage and continue editing
              your saved resumes.
            </p>


            <div
              className="
                flex
                items-center
                gap-2
                mt-5
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



          {/* ==================================================
              AI SUGGESTIONS
              ================================================== */}

          <button
            type="button"
            onClick={() =>
              navigate("/ai-suggestions")
            }
            className="
              card
              p-6
              text-left
              group
              cursor-pointer
              hover:-translate-y-1
              transition-transform
            "
          >

            <div
              className="
                flex
                items-start
                justify-between
              "
            >

              <div
                className="
                  w-11
                  h-11
                  rounded-xl
                  bg-purple-500/10
                  flex
                  items-center
                  justify-center
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
                text-lg
                font-display
                font-semibold
                mt-5
              "
            >
              AI suggestions
            </h3>


            <p
              className="
                text-sm
                muted
                mt-1
                leading-relaxed
                max-w-md
              "
            >
              Improve your resume wording,
              achievements and impact using AI.
            </p>


            <div
              className="
                flex
                items-center
                gap-2
                mt-5
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



        {/* ====================================================
            ERROR
            ==================================================== */}

        {error && (

          <div
            className="
              mt-5
              p-4
              rounded-xl
              border
              border-brick/20
              bg-brick/5
              flex
              items-start
              gap-3
            "
          >

            <div
              className="
                w-7
                h-7
                shrink-0
                rounded-lg
                bg-brick/10
                flex
                items-center
                justify-center
              "
            >

              <FileText
                size={14}
                className="text-brick"
              />

            </div>


            <div>

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
                  text-xs
                  text-brick/80
                  mt-1
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