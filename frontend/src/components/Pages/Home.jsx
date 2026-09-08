import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";


// =====================================================
// SCROLL REVEAL
// =====================================================

function Reveal({ children, className = "", delay = 0 }) {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add("is-visible");
          observer.unobserve(element);
        }
      },
      {
        threshold: 0.12,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`scroll-reveal ${className}`}
      style={{ "--delay": `${delay}s` }}
    >
      {children}
    </div>
  );
}


// =====================================================
// RESUME PREVIEW
// =====================================================

function ResumePreview() {
  return (
    <div className="hero-resume-wrapper">

      <div className="hero-glow"></div>

      {/* AI floating card */}
      <div className="floating-card floating-ai">
        <span className="floating-icon">✦</span>

        <div>
          <strong>AI Enhanced</strong>
          <small>Content improved</small>
        </div>
      </div>


      {/* ATS floating card */}
      <div className="floating-card floating-ats">
        <span className="ats-check">✓</span>

        <div>
          <strong>ATS Ready</strong>
          <small>87% match</small>
        </div>
      </div>


      {/* Resume */}
      <div className="hero-resume">

        <div className="resume-top">

          <div className="resume-profile">

            <div className="resume-avatar">
              SM
            </div>

            <div>

              <div className="resume-name">
                YOUR NAME
              </div>

              <div className="resume-role">
                SOFTWARE DEVELOPER
              </div>

            </div>

          </div>

        </div>


        <div className="resume-content">

          <div className="resume-sidebar">

            <div className="resume-section-title">
              CONTACT
            </div>

            <div className="resume-small-line"></div>
            <div className="resume-small-line short"></div>
            <div className="resume-small-line"></div>

            <div className="resume-section-title">
              SKILLS
            </div>

            <div className="skill-pill">
              React
            </div>

            <div className="skill-pill">
              JavaScript
            </div>

            <div className="skill-pill">
              Python
            </div>

            <div className="skill-pill">
              MongoDB
            </div>

          </div>


          <div className="resume-main">

            <div className="resume-main-title">
              PROFILE
            </div>

            <div className="resume-line"></div>
            <div className="resume-line"></div>
            <div className="resume-line medium"></div>


            <div className="resume-main-title">
              EXPERIENCE
            </div>

            <div className="resume-job-title">
              Software Developer
            </div>

            <div className="resume-line"></div>
            <div className="resume-line"></div>
            <div className="resume-line medium"></div>


            <div className="resume-job-title">
              Frontend Developer
            </div>

            <div className="resume-line"></div>
            <div className="resume-line medium"></div>


            <div className="resume-main-title">
              EDUCATION
            </div>

            <div className="resume-line"></div>
            <div className="resume-line short"></div>

          </div>

        </div>

      </div>

    </div>
  );
}


// =====================================================
// TEMPLATE
// =====================================================

function TemplatePreview({ accent }) {
  return (
    <div className="template-paper">

      <div
        className="template-top"
        style={{ backgroundColor: accent }}
      >

        <div className="template-avatar"></div>

        <div>

          <div className="template-name"></div>
          <div className="template-title"></div>

        </div>

      </div>


      <div className="template-layout">

        <div
          className="template-side"
          style={{ borderTopColor: accent }}
        >

          <div className="template-heading">
            CONTACT
          </div>

          <div className="template-line"></div>
          <div className="template-line short"></div>
          <div className="template-line"></div>


          <div className="template-heading">
            SKILLS
          </div>

          <div className="template-line"></div>
          <div className="template-line short"></div>
          <div className="template-line"></div>

        </div>


        <div className="template-main">

          <div
            className="template-section"
            style={{ color: accent }}
          >
            EXPERIENCE
          </div>

          <div className="template-text"></div>
          <div className="template-text"></div>
          <div className="template-text short"></div>


          <div
            className="template-section"
            style={{ color: accent }}
          >
            EDUCATION
          </div>

          <div className="template-text"></div>
          <div className="template-text short"></div>


          <div
            className="template-section"
            style={{ color: accent }}
          >
            PROJECTS
          </div>

          <div className="template-text"></div>
          <div className="template-text"></div>

        </div>

      </div>

    </div>
  );
}


// =====================================================
// HOME
// =====================================================

function Home() {

  const navigate = useNavigate();


  return (
    <div className="home-page">


      {/* =================================================
          HERO
      ================================================= */}

      <section className="hero-section">

        <div className="hero-container">


          {/* LEFT */}

          <Reveal className="hero-text">

            <div className="hero-badge">
              <span>✦</span>
              AI-POWERED RESUME BUILDER
            </div>


            <h1>
              Build a resume
              <br />

              <span>
                that gets noticed.
              </span>
            </h1>


            <p className="hero-description">
              Create a professional, ATS-friendly resume in
              minutes. Let AI improve your content, highlight
              your strengths and tailor your resume to the job
              you want.
            </p>


            <div className="hero-buttons">

              {/* ROUTES TO RESUME PAGE */}

              <button
                className="primary-button"
                onClick={() => navigate("/resume")}
              >
                Create My Resume
                <span>→</span>
              </button>


              {/* ROUTES TO RESUME PAGE */}

              <button
                className="secondary-button"
                onClick={() => navigate("/resume")}
              >
                Explore Templates
              </button>

            </div>


            <div className="hero-checks">

              <span>
                <b>✓</b>
                ATS Optimized
              </span>

              <span>
                <b>✓</b>
                AI Powered
              </span>

              <span>
                <b>✓</b>
                Professional Templates
              </span>

            </div>

          </Reveal>


          {/* RIGHT */}

          <Reveal
            className="hero-visual"
            delay={0.15}
          >

            <ResumePreview />

          </Reveal>

        </div>


        {/* STRIP */}

        <div className="trusted-strip">

          <span>
            BUILD A BETTER RESUME
          </span>

          <div className="trusted-items">

            <button
              onClick={() => navigate("/resume")}
            >
              ✦ AI WRITING
            </button>

            <button
              onClick={() => navigate("/jobmatch")}
            >
              ✓ ATS CHECK
            </button>

            <button
              onClick={() => navigate("/jobmatch")}
            >
              ◆ JOB MATCH
            </button>

            <button
              onClick={() => navigate("/resume")}
            >
              ◇ PROFESSIONAL DESIGN
            </button>

          </div>

        </div>

      </section>



      {/* =================================================
          TEMPLATES
      ================================================= */}

      <section className="templates-section">

        <Reveal>

          <div className="section-heading">

            <div className="section-label">
              PROFESSIONAL TEMPLATES
            </div>

            <h2>
              Choose a resume
              <br />

              <span>
                that fits your style.
              </span>
            </h2>

            <p>
              Start with a professionally designed template
              and customize it to make your resume stand out.
            </p>

          </div>

        </Reveal>


        <div className="templates-grid">


          {/* TEMPLATE 1 */}

          <Reveal delay={0.05}>

            <div
              className="template-card"
              onClick={() => navigate("/resume")}
            >

              <TemplatePreview
                accent="#174b73"
              />

              <div className="template-card-bottom">

                <div>

                  <h3>
                    Modern Blue
                  </h3>

                  <span>
                    Modern
                  </span>

                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/resume");
                  }}
                >
                  Use →
                </button>

              </div>

            </div>

          </Reveal>


          {/* TEMPLATE 2 */}

          <Reveal delay={0.15}>

            <div
              className="template-card"
              onClick={() => navigate("/resume")}
            >

              <TemplatePreview
                accent="#8f3030"
              />

              <div className="template-card-bottom">

                <div>

                  <h3>
                    Professional
                  </h3>

                  <span>
                    Professional
                  </span>

                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/resume");
                  }}
                >
                  Use →
                </button>

              </div>

            </div>

          </Reveal>


          {/* TEMPLATE 3 */}

          <Reveal delay={0.25}>

            <div
              className="template-card"
              onClick={() => navigate("/resume")}
            >

              <TemplatePreview
                accent="#b83ab8"
              />

              <div className="template-card-bottom">

                <div>

                  <h3>
                    Creative
                  </h3>

                  <span>
                    Creative
                  </span>

                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/resume");
                  }}
                >
                  Use →
                </button>

              </div>

            </div>

          </Reveal>


          {/* TEMPLATE 4 */}

          <Reveal delay={0.35}>

            <div
              className="template-card"
              onClick={() => navigate("/resume")}
            >

              <TemplatePreview
                accent="#243b6b"
              />

              <div className="template-card-bottom">

                <div>

                  <h3>
                    Classic
                  </h3>

                  <span>
                    Minimal
                  </span>

                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/resume");
                  }}
                >
                  Use →
                </button>

              </div>

            </div>

          </Reveal>

        </div>


        <Reveal>

          <button
            className="view-templates-button"
            onClick={() => navigate("/resume")}
          >
            View More Templates
            <span>→</span>
          </button>

        </Reveal>

      </section>



      {/* =================================================
          AI SECTION
      ================================================= */}

      <section className="ai-section">

        <div className="ai-container">


          {/* LEFT */}

          <Reveal className="ai-visual">

            <div className="ai-background-circle"></div>


            <div className="ai-document">

              <div className="ai-document-header">

                <div className="ai-mini-avatar">
                  SM
                </div>

                <div>

                  <div className="ai-name">
                    YOUR NAME
                  </div>

                  <div className="ai-role">
                    SOFTWARE DEVELOPER
                  </div>

                </div>

              </div>


              <div className="ai-document-section">

                <div className="ai-title">
                  EXPERIENCE
                </div>

                <div className="ai-line"></div>
                <div className="ai-line"></div>
                <div className="ai-line short"></div>

              </div>


              <div className="ai-document-section">

                <div className="ai-title">
                  PROJECTS
                </div>

                <div className="ai-line"></div>
                <div className="ai-line"></div>

              </div>


              <div className="ai-document-section">

                <div className="ai-title">
                  SKILLS
                </div>

                <div className="ai-skills">

                  <span>React</span>
                  <span>Python</span>
                  <span>Node.js</span>

                </div>

              </div>

            </div>


            <div className="ai-popup">

              <div className="ai-popup-icon">
                ✦
              </div>

              <div>

                <strong>
                  AI suggestion
                </strong>

                <p>
                  Improve your experience description
                </p>

              </div>

            </div>


            <div className="keyword-popup">

              <span>
                ✓
              </span>

              <div>

                <strong>
                  Keyword matched
                </strong>

                <small>
                  React • JavaScript
                </small>

              </div>

            </div>

          </Reveal>


          {/* RIGHT */}

          <Reveal
            className="ai-content"
            delay={0.15}
          >

            <div className="section-label">
              POWERED BY AI
            </div>

            <h2>
              Your experience,
              <br />

              <span>
                written better.
              </span>
            </h2>

            <p>
              Don't struggle with wording. Our AI helps
              transform your experience into clear,
              professional and impactful resume content.
            </p>


            <div className="ai-benefits">

              <div
                className="benefit clickable-benefit"
                onClick={() => navigate("/resume")}
              >

                <div className="benefit-icon">
                  ✦
                </div>

                <div>

                  <h3>
                    Smart Content Suggestions
                  </h3>

                  <p>
                    Improve weak descriptions and make your
                    achievements more impactful.
                  </p>

                </div>

              </div>


              <div
                className="benefit clickable-benefit"
                onClick={() => navigate("/jobmatch")}
              >

                <div className="benefit-icon green">
                  ✓
                </div>

                <div>

                  <h3>
                    ATS Keyword Optimization
                  </h3>

                  <p>
                    Find important keywords from the job
                    description and add them naturally.
                  </p>

                </div>

              </div>


              <div
                className="benefit clickable-benefit"
                onClick={() => navigate("/jobmatch")}
              >

                <div className="benefit-icon orange">
                  ↗
                </div>

                <div>

                  <h3>
                    Job-Specific Resume
                  </h3>

                  <p>
                    Tailor your resume according to the
                    position you're applying for.
                  </p>

                </div>

              </div>

            </div>


            <button
              className="primary-button"
              onClick={() => navigate("/resume")}
            >
              Try AI Resume Builder
              <span>→</span>
            </button>

          </Reveal>

        </div>

      </section>



      {/* =================================================
          HOW IT WORKS
      ================================================= */}

      <section className="steps-section">

        <Reveal>

          <div className="section-heading">

            <div className="section-label">
              SIMPLE & FAST
            </div>

            <h2>
              Create your resume
              <br />

              <span>
                in three easy steps.
              </span>
            </h2>

          </div>

        </Reveal>


        <div className="steps-container">


          <Reveal
            className="step-card clickable-card"
            delay={0.05}
          >

            <div
              onClick={() => navigate("/resume")}
            >

              <div className="step-number">
                01
              </div>

              <div className="step-icon">
                ▣
              </div>

              <h3>
                Choose a template
              </h3>

              <p>
                Pick a professionally designed template
                that matches your career and personality.
              </p>

            </div>

          </Reveal>


          <div className="step-arrow">
            →
          </div>


          <Reveal
            className="step-card clickable-card"
            delay={0.15}
          >

            <div
              onClick={() => navigate("/resume")}
            >

              <div className="step-number">
                02
              </div>

              <div className="step-icon">
                ✎
              </div>

              <h3>
                Fill in your details
              </h3>

              <p>
                Add your education, experience, skills,
                projects and achievements.
              </p>

            </div>

          </Reveal>


          <div className="step-arrow">
            →
          </div>


          <Reveal
            className="step-card clickable-card"
            delay={0.25}
          >

            <div
              onClick={() => navigate("/resume")}
            >

              <div className="step-number">
                03
              </div>

              <div className="step-icon">
                ✦
              </div>

              <h3>
                Let AI improve it
              </h3>

              <p>
                Get intelligent suggestions and optimize
                your resume for the job you're targeting.
              </p>

            </div>

          </Reveal>

        </div>

      </section>



      {/* =================================================
          ATS SECTION
      ================================================= */}

      <section className="ats-section">

        <div className="ats-container">


          <Reveal className="ats-content">

            <div className="section-label">
              ATS OPTIMIZATION
            </div>

            <h2>
              Know how your resume
              <br />

              <span>
                performs before you apply.
              </span>
            </h2>

            <p>
              Analyze your resume against job descriptions
              and identify missing keywords, skills and
              improvements.
            </p>


            <button
              className="primary-button"
              onClick={() => navigate("/jobmatch")}
            >
              Check My Resume
              <span>→</span>
            </button>

          </Reveal>


          <Reveal
            className="ats-score-card"
            delay={0.2}
          >

            <div className="score-top">

              <div>

                <span>
                  ATS SCORE
                </span>

                <h3>
                  Resume Analysis
                </h3>

              </div>

              <div className="score-circle">

                <strong>
                  87
                </strong>

                <small>
                  /100
                </small>

              </div>

            </div>


            <div className="score-progress">

              <div className="score-progress-fill"></div>

            </div>


            <div className="score-items">

              <div>
                <span className="score-check">
                  ✓
                </span>

                <span>
                  Keywords
                </span>

                <strong>
                  Excellent
                </strong>
              </div>


              <div>
                <span className="score-check">
                  ✓
                </span>

                <span>
                  Formatting
                </span>

                <strong>
                  Good
                </strong>
              </div>


              <div>
                <span className="score-check">
                  ✓
                </span>

                <span>
                  Skills
                </span>

                <strong>
                  Excellent
                </strong>
              </div>


              <div>
                <span className="score-warning">
                  !
                </span>

                <span>
                  Experience
                </span>

                <strong>
                  Improve
                </strong>
              </div>

            </div>

          </Reveal>

        </div>

      </section>



      {/* =================================================
          FEATURES
      ================================================= */}

      <section className="features-section">

        <Reveal>

          <div className="section-heading">

            <div className="section-label">
              EVERYTHING YOU NEED
            </div>

            <h2>
              One place to build
              <br />

              <span>
                your career.
              </span>
            </h2>

          </div>

        </Reveal>


        <div className="features-grid">


          <Reveal delay={0.05}>

            <div
              className="feature-card clickable-card"
              onClick={() => navigate("/resume")}
            >

              <div className="feature-icon purple">
                ✦
              </div>

              <h3>
                AI Resume Writing
              </h3>

              <p>
                Generate professional resume content and
                improve your existing descriptions using AI.
              </p>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/resume");
                }}
              >
                Explore →
              </button>

            </div>

          </Reveal>


          <Reveal delay={0.12}>

            <div
              className="feature-card clickable-card"
              onClick={() => navigate("/jobmatch")}
            >

              <div className="feature-icon green">
                ✓
              </div>

              <h3>
                ATS Optimization
              </h3>

              <p>
                Optimize your resume for Applicant Tracking
                Systems and improve keyword matching.
              </p>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/jobmatch");
                }}
              >
                Check ATS →
              </button>

            </div>

          </Reveal>


          <Reveal delay={0.19}>

            <div
              className="feature-card clickable-card"
              onClick={() => navigate("/jobmatch")}
            >

              <div className="feature-icon blue">
                ⌕
              </div>

              <h3>
                Job Matching
              </h3>

              <p>
                Compare your resume with job descriptions
                and discover missing skills.
              </p>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/jobmatch");
                }}
              >
                Match Jobs →
              </button>

            </div>

          </Reveal>


          <Reveal delay={0.26}>

            <div
              className="feature-card clickable-card"
              onClick={() => navigate("/resume")}
            >

              <div className="feature-icon orange">
                ◈
              </div>

              <h3>
                Professional Templates
              </h3>

              <p>
                Choose clean, professional layouts designed
                to look great and remain ATS-friendly.
              </p>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/resume");
                }}
              >
                View Templates →
              </button>

            </div>

          </Reveal>

        </div>

      </section>



      {/* =================================================
          FINAL CTA
      ================================================= */}

      <section className="final-cta">

        <Reveal>

          <div className="cta-icon">
            ✦
          </div>

          <h2>
            Your next opportunity
            <br />

            starts with your resume.
          </h2>

          <p>
            Build a professional, job-ready resume today.
          </p>

          <button
            onClick={() => navigate("/resume")}
          >
            Create My Resume
            <span>→</span>
          </button>

        </Reveal>

      </section>


    </div>
  );
}

export default Home;