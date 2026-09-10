import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../BackButton";
import { getToken } from "../../lib/auth";

export default function JobMatch() {
  const navigate = useNavigate();

  // ============================================================
  // API
  // ============================================================

  const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:4000";

  // ============================================================
  // STATE
  // ============================================================

  const [targetRole, setTargetRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const [resumeFile, setResumeFile] = useState(null);
  const [resumeContent, setResumeContent] = useState("");
  const [resumeLoaded, setResumeLoaded] = useState(false);

  const [uploadingResume, setUploadingResume] =
    useState(false);

  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [progress, setProgress] = useState(0);

  const [analysisStage, setAnalysisStage] =
    useState("");

  // ============================================================
  // ANALYSIS PROGRESS ANIMATION
  // ============================================================

  useEffect(() => {
    if (!loading) return;

    const interval = setInterval(() => {
      setProgress((current) => {
        if (current >= 90) {
          return current;
        }

        if (current < 30) {
          return current + 2;
        }

        if (current < 60) {
          return current + 1;
        }

        return current + 0.5;
      });
    }, 700);

    return () => clearInterval(interval);
  }, [loading]);

  // ============================================================
  // CONVERT STRUCTURED RESUME INTO TEXT
  // ============================================================

  const convertResumeToText = (resume) => {
    if (!resume) return "";

    if (typeof resume === "string") {
      return resume;
    }

    const sections = [];

    // ----------------------------------------------------------
    // NAME
    // ----------------------------------------------------------

    if (resume.name) {
      sections.push(`NAME\n${resume.name}`);
    }

    // ----------------------------------------------------------
    // CONTACT
    // ----------------------------------------------------------

    const contact =
      resume.contact ||
      resume.contactInfo ||
      resume.contactInformation ||
      {};

    const contactLines = [];

    if (contact.email) {
      contactLines.push(`Email: ${contact.email}`);
    }

    if (contact.phone) {
      contactLines.push(`Phone: ${contact.phone}`);
    }

    if (contact.location) {
      contactLines.push(
        `Location: ${contact.location}`
      );
    }

    if (contact.linkedin) {
      contactLines.push(
        `LinkedIn: ${contact.linkedin}`
      );
    }

    if (contact.github) {
      contactLines.push(
        `GitHub: ${contact.github}`
      );
    }

    if (contactLines.length > 0) {
      sections.push(
        `CONTACT\n${contactLines.join("\n")}`
      );
    }

    // ----------------------------------------------------------
    // TARGET ROLE
    // ----------------------------------------------------------

    if (resume.targetRole) {
      sections.push(
        `TARGET ROLE\n${resume.targetRole}`
      );
    }

    // ----------------------------------------------------------
    // SUMMARY
    // ----------------------------------------------------------

    if (resume.summary) {
      sections.push(
        `SUMMARY\n${resume.summary}`
      );
    }

    // ----------------------------------------------------------
    // SKILLS
    // ----------------------------------------------------------

    if (
      Array.isArray(resume.skills) &&
      resume.skills.length > 0
    ) {
      sections.push(
        `SKILLS\n${resume.skills.join(", ")}`
      );
    }

    // ----------------------------------------------------------
    // EXPERIENCE
    // ----------------------------------------------------------

    if (
      Array.isArray(resume.experience) &&
      resume.experience.length > 0
    ) {
      const experienceText =
        resume.experience
          .map((experience) => {
            const lines = [];

            if (experience.company) {
              lines.push(
                `Company: ${experience.company}`
              );
            }

            if (experience.role) {
              lines.push(
                `Role: ${experience.role}`
              );
            }

            if (experience.duration) {
              lines.push(
                `Duration: ${experience.duration}`
              );
            }

            if (
              Array.isArray(experience.bullets) &&
              experience.bullets.length > 0
            ) {
              lines.push(
                experience.bullets
                  .map(
                    (bullet) => `- ${bullet}`
                  )
                  .join("\n")
              );
            }

            return lines.join("\n");
          })
          .join("\n\n");

      sections.push(
        `EXPERIENCE\n${experienceText}`
      );
    }

    // ----------------------------------------------------------
    // PROJECTS
    // ----------------------------------------------------------

    if (
      Array.isArray(resume.projects) &&
      resume.projects.length > 0
    ) {
      const projectsText =
        resume.projects
          .map((project) => {
            const lines = [];

            if (project.name) {
              lines.push(
                `Project: ${project.name}`
              );
            }

            if (project.description) {
              lines.push(
                `Description: ${project.description}`
              );
            }

            if (
              Array.isArray(
                project.technologies
              ) &&
              project.technologies.length > 0
            ) {
              lines.push(
                `Technologies: ${project.technologies.join(
                  ", "
                )}`
              );
            }

            return lines.join("\n");
          })
          .join("\n\n");

      sections.push(
        `PROJECTS\n${projectsText}`
      );
    }

    // ----------------------------------------------------------
    // EDUCATION
    // ----------------------------------------------------------

    if (
      Array.isArray(resume.education) &&
      resume.education.length > 0
    ) {
      const educationText =
        resume.education
          .map((education) => {
            const lines = [];

            if (education.institution) {
              lines.push(
                `Institution: ${education.institution}`
              );
            }

            if (education.degree) {
              lines.push(
                `Degree: ${education.degree}`
              );
            }

            if (education.duration) {
              lines.push(
                `Duration: ${education.duration}`
              );
            }

            return lines.join("\n");
          })
          .join("\n\n");

      sections.push(
        `EDUCATION\n${educationText}`
      );
    }

    // ----------------------------------------------------------
    // CERTIFICATIONS
    // ----------------------------------------------------------

    if (
      Array.isArray(
        resume.certifications
      ) &&
      resume.certifications.length > 0
    ) {
      sections.push(
        `CERTIFICATIONS\n${resume.certifications
          .map((item) => `- ${item}`)
          .join("\n")}`
      );
    }

    // ----------------------------------------------------------
    // ACHIEVEMENTS
    // ----------------------------------------------------------

    if (
      Array.isArray(resume.achievements) &&
      resume.achievements.length > 0
    ) {
      sections.push(
        `ACHIEVEMENTS\n${resume.achievements
          .map((item) => `- ${item}`)
          .join("\n")}`
      );
    }

    return sections.join("\n\n").trim();
  };

  // ============================================================
  // UPLOAD RESUME
  // ============================================================

  const handleResumeUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setResult(null);

    setResumeFile(null);
    setResumeContent("");
    setResumeLoaded(false);

    const extension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase();

    const allowedExtensions = [
      "pdf",
      "doc",
      "docx",
      "txt",
    ];

    // ----------------------------------------------------------
    // FILE TYPE VALIDATION
    // ----------------------------------------------------------

    if (
      !allowedExtensions.includes(
        extension
      )
    ) {
      setError(
        "Please upload a PDF, DOC, DOCX or TXT resume."
      );

      event.target.value = "";
      return;
    }

    // ----------------------------------------------------------
    // FILE SIZE VALIDATION
    // ----------------------------------------------------------

    if (file.size > 10 * 1024 * 1024) {
      setError(
        "File is too large. Maximum resume size is 10 MB."
      );

      event.target.value = "";
      return;
    }

    setUploadingResume(true);

    try {
      const token = getToken();

      const formData = new FormData();

      formData.append(
        "file",
        file
      );

      // --------------------------------------------------------
      // SEND FILE TO BACKEND
      // --------------------------------------------------------

      const response = await fetch(
        `${API_URL}/api/ai/parse-resume-file`,
        {
          method: "POST",

          headers: {
            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },

          body: formData,
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "Invalid response received from the server."
        );
      }

      // --------------------------------------------------------
      // BACKEND ERROR
      // --------------------------------------------------------

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Unable to read the uploaded resume."
        );
      }

      // --------------------------------------------------------
      // SUPPORT BOTH:
      //
      // 1. { text: "..." }
      //
      // 2. { resume: {...} }
      // --------------------------------------------------------

      let extractedText = "";

      if (
        typeof data?.text === "string"
      ) {
        extractedText =
          data.text.trim();
      }

      if (
        !extractedText &&
        data?.resume
      ) {
        extractedText =
          convertResumeToText(
            data.resume
          );
      }

      if (
        !extractedText &&
        data?.data?.text
      ) {
        extractedText =
          String(
            data.data.text
          ).trim();
      }

      if (
        !extractedText &&
        data?.data?.resume
      ) {
        extractedText =
          convertResumeToText(
            data.data.resume
          );
      }

      // --------------------------------------------------------
      // VALIDATE EXTRACTED CONTENT
      // --------------------------------------------------------

      if (
        !extractedText ||
        extractedText.length < 50
      ) {
        throw new Error(
          "We could not extract enough readable information from this resume."
        );
      }

      // --------------------------------------------------------
      // SUCCESS
      // --------------------------------------------------------

      setResumeFile(file);

      setResumeContent(
        extractedText
      );

      setResumeLoaded(true);

      setError("");

    } catch (err) {
      console.error(
        "Resume upload error:",
        err
      );

      setResumeFile(null);
      setResumeContent("");
      setResumeLoaded(false);

      setError(
        err?.message ||
          "Unable to read your resume. Please try another file."
      );

    } finally {
      setUploadingResume(false);

      event.target.value = "";
    }
  };

  // ============================================================
  // REMOVE RESUME
  // ============================================================

  const removeResume = () => {
    setResumeFile(null);
    setResumeContent("");
    setResumeLoaded(false);
    setResult(null);
    setError("");
  };

  // ============================================================
  // ANALYZE JOB MATCH
  // ============================================================

  const handleJobMatch = async () => {
    setError("");
    setResult(null);

    // ----------------------------------------------------------
    // VALIDATION
    // ----------------------------------------------------------

    if (!targetRole.trim()) {
      setError(
        "Please enter the target job title."
      );
      return;
    }

    if (!jobDescription.trim()) {
      setError(
        "Please paste the job description."
      );
      return;
    }

    if (
      jobDescription.trim().length < 100
    ) {
      setError(
        "Please paste the complete job description for a more accurate analysis."
      );
      return;
    }

    if (!resumeFile) {
      setError(
        "Please upload your resume before analyzing the job match."
      );
      return;
    }

    if (!resumeContent.trim()) {
      setError(
        "Your resume could not be read. Please upload it again."
      );
      return;
    }

    // ----------------------------------------------------------
    // START ANALYSIS
    // ----------------------------------------------------------

    setLoading(true);

    setProgress(5);

    setAnalysisStage(
      "Preparing your resume..."
    );

    try {
      const token = getToken();

      // --------------------------------------------------------
      // STAGE 1
      // --------------------------------------------------------

      setProgress(15);

      setAnalysisStage(
        "Reading the job requirements..."
      );

      await new Promise(
        (resolve) =>
          setTimeout(resolve, 400)
      );

      // --------------------------------------------------------
      // STAGE 2
      // --------------------------------------------------------

      setProgress(25);

      setAnalysisStage(
        "Understanding your skills and experience..."
      );

      await new Promise(
        (resolve) =>
          setTimeout(resolve, 400)
      );

      // --------------------------------------------------------
      // API REQUEST
      // --------------------------------------------------------

      const controller =
        new AbortController();

      const timeout =
        setTimeout(() => {
          controller.abort();
        }, 90000);

      let response;

      try {
        response = await fetch(
          `${API_URL}/api/ai/job-match`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              ...(token
                ? {
                    Authorization: `Bearer ${token}`,
                  }
                : {}),
            },

            body: JSON.stringify({
              targetRole:
                targetRole.trim(),

              jobDescription:
                jobDescription.trim(),

              resume:
                resumeContent.trim(),
            }),

            signal:
              controller.signal,
          }
        );
      } finally {
        clearTimeout(timeout);
      }

      // --------------------------------------------------------
      // STAGE 3
      // --------------------------------------------------------

      setProgress(55);

      setAnalysisStage(
        "Comparing your skills with the job..."
      );

      let data = {};

      try {
        data =
          await response.json();
      } catch {
        throw new Error(
          "Invalid response received from the server."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Failed to analyze the job match."
        );
      }

      // --------------------------------------------------------
      // STAGE 4
      // --------------------------------------------------------

      setProgress(75);

      setAnalysisStage(
        "Checking ATS keywords and requirements..."
      );

      await new Promise(
        (resolve) =>
          setTimeout(resolve, 500)
      );

      // --------------------------------------------------------
      // STAGE 5
      // --------------------------------------------------------

      setProgress(90);

      setAnalysisStage(
        "Preparing your personalized recommendations..."
      );

      await new Promise(
        (resolve) =>
          setTimeout(resolve, 600)
      );

      // --------------------------------------------------------
      // COMPLETE
      // --------------------------------------------------------

      setProgress(100);

      setAnalysisStage(
        "Analysis complete!"
      );

      await new Promise(
        (resolve) =>
          setTimeout(resolve, 700)
      );

      setResult(data);

    } catch (err) {
      console.error(
        "Job match error:",
        err
      );

      if (
        err?.name ===
        "AbortError"
      ) {
        setError(
          "The AI analysis took too long. Please try again."
        );
      } else {
        setError(
          err?.message ||
            "Failed to analyze the job match. Please try again."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // NORMALIZE ARRAYS
  // ============================================================

  const normalizeArray = (
    value
  ) => {
    if (
      Array.isArray(value)
    ) {
      return value;
    }

    if (
      typeof value ===
      "string"
    ) {
      return value
        .split("\n")
        .map((item) =>
          item
            .replace(
              /^[-•*]\s*/,
              ""
            )
            .replace(
              /^\d+\.\s*/,
              ""
            )
            .trim()
        )
        .filter(Boolean);
    }

    return [];
  };

  // ============================================================
  // RESULT DATA
  // ============================================================

  const score =
    result?.score ??
    result?.matchScore ??
    result?.atsScore ??
    result?.data?.score ??
    null;

  const scoreNumber =
    score !== null &&
    !Number.isNaN(
      Number(score)
    )
      ? Math.max(
          0,
          Math.min(
            100,
            Number(score)
          )
        )
      : null;

  const matches =
    normalizeArray(
      result?.matchedSkills ||
        result?.matches ||
        result?.matchingSkills ||
        result?.data?.matchedSkills ||
        []
    );

  const missing =
    normalizeArray(
      result?.missingSkills ||
        result?.missing ||
        result?.gaps ||
        result?.data?.missingSkills ||
        []
    );

  const improvements =
    normalizeArray(
      result?.improvements ||
        result?.recommendations ||
        result?.suggestions ||
        result?.data?.improvements ||
        []
    );

  const requiredKeywords =
    normalizeArray(
      result?.requiredKeywords ||
        result?.data?.requiredKeywords ||
        []
    );

  const preferredKeywords =
    normalizeArray(
      result?.preferredKeywords ||
        result?.data?.preferredKeywords ||
        []
    );

  const experienceGaps =
    normalizeArray(
      result?.experienceGaps ||
        result?.data?.experienceGaps ||
        []
    );

  const interviewTopics =
    normalizeArray(
      result?.interviewTopics ||
        result?.data?.interviewTopics ||
        []
    );

  const summary =
    result?.summary ||
    result?.analysis ||
    result?.message ||
    result?.data?.summary ||
    "";

  const breakdown =
    result?.breakdown ||
    result?.data?.breakdown ||
    {};

  // ============================================================
  // SCORE LABEL
  // ============================================================

  const getScoreLabel = () => {
    if (
      scoreNumber === null
    ) {
      return "Not Available";
    }

    if (
      scoreNumber >= 85
    ) {
      return "Excellent Match";
    }

    if (
      scoreNumber >= 70
    ) {
      return "Strong Match";
    }

    if (
      scoreNumber >= 55
    ) {
      return "Good Potential";
    }

    if (
      scoreNumber >= 40
    ) {
      return "Moderate Match";
    }

    return "Needs Improvement";
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="relative w-full min-h-full p-[22px]">

      {/* ======================================================
          FULL SCREEN AI ANALYSIS OVERLAY
      ====================================================== */}

      {loading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">

          {/* BLURRED BACKGROUND */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />

          {/* WHITE CENTER MODAL */}
          <div
            className="
              relative
              z-10
              w-[330px]
              max-w-[90vw]
              rounded-2xl
              bg-white
              border
              border-gray-200
              shadow-[0_25px_70px_rgba(0,0,0,0.28)]
              p-[30px]
              text-center
            "
          >

            {/* ==================================================
                PROGRESS CIRCLE
            ================================================== */}

            <div className="relative w-[150px] h-[150px] mx-auto mb-5">

              <svg
                viewBox="0 0 100 100"
                className="w-full h-full -rotate-90"
              >

                {/* BACKGROUND CIRCLE */}

                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="7"
                  className="text-gray-200"
                />

                {/* PROGRESS */}

                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="7"
                  strokeLinecap="round"
                  className="
                    text-primary
                    transition-all
                    duration-500
                    ease-out
                  "
                  strokeDasharray="264"
                  strokeDashoffset={
                    264 -
                    (264 * progress) /
                      100
                  }
                />

              </svg>

              {/* PERCENTAGE */}

              <div className="absolute inset-0 flex items-center justify-center">

                <div>

                  <div className="text-3xl font-bold text-gray-900">
                    {Math.round(
                      progress
                    )}
                    %
                  </div>

                  <div className="text-[10px] text-gray-500 tracking-wider mt-1">
                    AI ANALYSIS
                  </div>

                </div>

              </div>

            </div>

            {/* TITLE */}

            <h2 className="text-lg font-display font-bold text-gray-900">
              Analyzing Your Resume
            </h2>

            {/* STAGE */}

            <p className="text-gray-500 text-sm mt-2">
              {analysisStage}
            </p>

            {/* DOTS */}

            <div className="flex justify-center gap-1.5 mt-5">

              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />

              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse [animation-delay:150ms]" />

              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse [animation-delay:300ms]" />

            </div>

            <p className="text-[11px] text-gray-500 mt-4">
              Comparing your resume with the job requirements
            </p>

          </div>

        </div>
      )}

      {/* ======================================================
          PAGE
      ====================================================== */}

      <div className="w-full min-h-full overflow-y-auto overflow-x-hidden">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="mb-[20px]">

          <div className="flex items-start gap-3">

            <BackButton fallbackRoute="/db" />

            <div>

              <div className="text-xs font-semibold tracking-wider text-plum uppercase mb-1">
                💼 AI Career Assistant
              </div>

              <h1 className="text-3xl font-display font-bold">
                Job Match
              </h1>

              <p className="muted text-sm mt-1 max-w-2xl leading-relaxed">
                Upload your resume and compare it with any job
                description to discover your match score, skills,
                gaps, ATS keywords and personalized improvements.
              </p>

            </div>

          </div>

        </div>

        {/* ======================================================
            ERROR
        ====================================================== */}

        {error && (
          <div className="mb-[16px] rounded-xl border border-brick/30 bg-brick/10 px-4 py-3 text-sm text-brick flex items-center justify-between gap-4">

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="font-bold text-lg shrink-0"
            >
              ×
            </button>

          </div>
        )}

        {/* ======================================================
            TOP CARDS
        ====================================================== */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[18px]">

          {/* ==================================================
              TARGET ROLE
          ================================================== */}

          <div className="card overflow-hidden">

            <div className="px-[16px] py-[13px] border-b border-border flex items-center gap-3">

              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                🎯
              </div>

              <div>

                <h3 className="font-semibold text-sm">
                  Target role
                </h3>

                <p className="text-xs muted mt-[2px]">
                  Tell us which position you're applying for.
                </p>

              </div>

            </div>

            <div className="p-[16px]">

              <label className="block label mb-[7px]">
                Job title
              </label>

              <input
                type="text"
                value={targetRole}
                onChange={(e) =>
                  setTargetRole(
                    e.target.value
                  )
                }
                disabled={loading}
                className="input w-full text-sm"
                placeholder="e.g. Python Developer"
              />

              <div className="mt-[14px] rounded-xl border border-plum/20 bg-plum/5 px-[13px] py-[11px]">

                <div className="flex items-start gap-3">

                  <span className="text-lg">
                    ✨
                  </span>

                  <div>

                    <p className="text-sm font-semibold text-plum">
                      AI role analysis
                    </p>

                    <p className="text-xs muted mt-[3px] leading-relaxed">
                      AI will compare your real skills,
                      experience and education against this role.
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>

          {/* ==================================================
              JOB DESCRIPTION
          ================================================== */}

          <div className="card overflow-hidden">

            <div className="px-[16px] py-[13px] border-b border-border flex items-center gap-3">

              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                🔍
              </div>

              <div>

                <h3 className="font-semibold text-sm">
                  Job description
                </h3>

                <p className="text-xs muted mt-[2px]">
                  Paste the job posting here.
                </p>

              </div>

            </div>

            <div className="p-[16px]">

              <textarea
                value={
                  jobDescription
                }
                onChange={(e) =>
                  setJobDescription(
                    e.target.value
                  )
                }
                disabled={loading}
                className="input w-full min-h-[190px] resize-y text-sm leading-relaxed"
                placeholder={`Paste the complete job description here.

Example:

We are looking for a Python Developer with experience in Django, REST APIs, SQL, Git and AWS...

Responsibilities:
- Build and maintain web applications
- Develop REST APIs
- Work with databases
- Collaborate with the engineering team`}
              />

              <div className="flex justify-between mt-2">

                <span className="text-xs muted">
                  {jobDescription.length} characters
                </span>

                {jobDescription.length >=
                  100 && (
                  <span className="text-xs text-teal font-medium">
                    ✓ Ready for analysis
                  </span>
                )}

              </div>

            </div>

          </div>

        </div>

        {/* ======================================================
            RESUME UPLOAD CARD
        ====================================================== */}

        <div className="card mt-[18px] overflow-hidden">

          {/* HEADER */}

          <div className="px-[16px] py-[13px] border-b border-border flex items-center gap-3">

            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              📄
            </div>

            <div>

              <h3 className="font-semibold text-sm">
                Your resume
              </h3>

              <p className="text-xs muted mt-[2px]">
                Upload the resume you want to compare with this job.
              </p>

            </div>

          </div>

          <div className="p-[16px]">

            {/* ==================================================
                NO RESUME
            ================================================== */}

            {!resumeFile && (
              <label
                className={`
                  block
                  rounded-2xl
                  border-2
                  border-dashed
                  border-border
                  p-[40px]
                  text-center
                  cursor-pointer
                  transition-all
                  ${
                    uploadingResume
                      ? "opacity-60 pointer-events-none"
                      : "hover:border-plum hover:bg-plum/5"
                  }
                `}
              >

                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  className="hidden"
                  onChange={
                    handleResumeUpload
                  }
                  disabled={
                    uploadingResume ||
                    loading
                  }
                />

                {uploadingResume ? (
                  <>

                    <div className="w-12 h-12 mx-auto mb-4 border-4 border-muted border-t-primary rounded-full animate-spin" />

                    <h3 className="font-semibold text-sm">
                      Reading your resume...
                    </h3>

                    <p className="text-xs muted mt-2">
                      Extracting information from your file
                    </p>

                    <p className="text-[11px] muted mt-2">
                      This may take a few seconds.
                    </p>

                  </>
                ) : (
                  <>

                    <div className="w-14 h-14 mx-auto rounded-full bg-muted flex items-center justify-center text-2xl mb-4">
                      📄
                    </div>

                    <h3 className="font-semibold text-base">
                      Upload your resume
                    </h3>

                    <p className="text-sm muted mt-2">
                      Click here to browse your computer
                    </p>

                    <p className="text-xs muted mt-2">
                      PDF • DOC • DOCX • TXT
                    </p>

                    <p className="text-[11px] muted mt-1">
                      Maximum file size: 10 MB
                    </p>

                    <div className="mt-5 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium bg-primary text-white">
                      Choose Resume File
                    </div>

                  </>
                )}

              </label>
            )}

            {/* ==================================================
                RESUME UPLOADED
            ================================================== */}

            {resumeFile && (
              <div className="rounded-2xl border border-teal/30 bg-teal/5 p-[18px]">

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                  <div className="flex items-center gap-3 min-w-0">

                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-xl shrink-0">
                      📄
                    </div>

                    <div className="min-w-0">

                      <p className="font-semibold text-sm truncate">
                        {resumeFile.name}
                      </p>

                      {resumeLoaded ? (
                        <p className="text-xs text-teal mt-1">
                          ✓ Resume uploaded and read successfully
                        </p>
                      ) : (
                        <p className="text-xs muted mt-1">
                          Resume processing...
                        </p>
                      )}

                      <p className="text-[11px] muted mt-1">
                        {(
                          resumeFile.size /
                          1024
                        ).toFixed(1)}{" "}
                        KB
                      </p>

                    </div>

                  </div>

                  <div className="flex gap-2 shrink-0">

                    {/* CHANGE FILE */}

                    <label
                      className={`
                        btn
                        btn-secondary
                        text-xs
                        cursor-pointer
                        ${
                          loading
                            ? "opacity-50 pointer-events-none"
                            : ""
                        }
                      `}
                    >

                      Change File

                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        className="hidden"
                        onChange={
                          handleResumeUpload
                        }
                        disabled={
                          loading
                        }
                      />

                    </label>

                    {/* REMOVE */}

                    <button
                      type="button"
                      onClick={
                        removeResume
                      }
                      disabled={
                        loading
                      }
                      className="btn btn-secondary text-xs"
                    >
                      Remove
                    </button>

                  </div>

                </div>

                {/* SUCCESS */}

                <div className="mt-4 pt-4 border-t border-teal/20">

                  <div className="flex items-center gap-2">

                    <span className="text-teal">
                      ✓
                    </span>

                    <span className="text-sm font-medium">
                      Resume is ready for Job Match analysis
                    </span>

                  </div>

                  <p className="text-xs muted mt-1">
                    Your resume information will be compared
                    against the job description using AI.
                  </p>

                </div>

              </div>
            )}

          </div>

        </div>

        {/* ======================================================
            ANALYZE BUTTON
        ====================================================== */}

        <div className="flex justify-end mt-[16px]">

          <button
            type="button"
            onClick={
              handleJobMatch
            }
            disabled={
              loading ||
              uploadingResume ||
              !resumeFile ||
              !resumeLoaded
            }
            className="btn btn-primary min-w-[210px]"
          >

            {loading ? (
              <span className="flex items-center justify-center gap-2">

                <span className="spinner" />

                Analyzing...

              </span>
            ) : (
              "✨ Analyze Job Match"
            )}

          </button>

        </div>

        {/* ======================================================
            RESULTS
        ====================================================== */}

        {result &&
          !loading && (
            <div className="mt-[22px] pb-[30px]">

              {/* ==================================================
                  RESULT HEADER
              ================================================== */}

              <div className="card p-[20px] mb-[16px]">

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

                  <div>

                    <p className="text-xs font-semibold uppercase tracking-wider text-plum mb-1">
                      AI Analysis
                    </p>

                    <h2 className="text-xl font-display font-bold">
                      Job Match Results
                    </h2>

                    {summary && (
                      <p className="muted text-sm mt-2 max-w-3xl leading-relaxed">
                        {typeof summary ===
                        "string"
                          ? summary
                          : JSON.stringify(
                              summary
                            )}
                      </p>
                    )}

                    <div className="inline-flex mt-4 rounded-full bg-muted px-3 py-1.5 text-xs font-medium">
                      🎯 {targetRole}
                    </div>

                  </div>

                  {/* SCORE */}

                  {scoreNumber !==
                    null && (
                    <div className="flex items-center gap-4">

                      <div className="relative w-[100px] h-[100px]">

                        <svg
                          viewBox="0 0 100 100"
                          className="w-full h-full -rotate-90"
                        >

                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            className="text-muted"
                          />

                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            strokeLinecap="round"
                            className="text-primary"
                            strokeDasharray="264"
                            strokeDashoffset={
                              264 -
                              (264 *
                                scoreNumber) /
                                100
                            }
                          />

                        </svg>

                        <div className="absolute inset-0 flex items-center justify-center">

                          <span className="text-xl font-bold">
                            {Math.round(
                              scoreNumber
                            )}
                            %
                          </span>

                        </div>

                      </div>

                      <div>

                        <p className="font-semibold text-sm">
                          {getScoreLabel()}
                        </p>

                        <p className="text-xs muted mt-1">
                          Overall compatibility
                        </p>

                      </div>

                    </div>
                  )}

                </div>

              </div>

              {/* ==================================================
                  SCORE BREAKDOWN
              ================================================== */}

              <div className="card p-[18px] mb-[16px]">

                <h3 className="font-semibold text-sm mb-4">
                  📊 Match Breakdown
                </h3>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

                  {[
                    [
                      "Skills",
                      breakdown.skills,
                    ],
                    [
                      "Experience",
                      breakdown.experience,
                    ],
                    [
                      "Education",
                      breakdown.education,
                    ],
                    [
                      "Keywords",
                      breakdown.keywords,
                    ],
                  ].map(
                    ([
                      label,
                      value,
                    ]) => {

                      const number =
                        Math.max(
                          0,
                          Math.min(
                            100,
                            Number(
                              value
                            ) || 0
                          )
                        );

                      return (
                        <div
                          key={
                            label
                          }
                        >

                          <div className="flex justify-between mb-2">

                            <span className="text-xs muted">
                              {label}
                            </span>

                            <span className="text-xs font-semibold">
                              {Math.round(
                                number
                              )}
                              %
                            </span>

                          </div>

                          <div className="h-2 rounded-full bg-muted overflow-hidden">

                            <div
                              className="h-full bg-primary rounded-full transition-all duration-700"
                              style={{
                                width: `${number}%`,
                              }}
                            />

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>

              </div>

              {/* ==================================================
                  THREE MAIN RESULT CARDS
              ================================================== */}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px]">

                {/* MATCHED */}

                <div className="card p-[16px]">

                  <div className="flex justify-between mb-3">

                    <h3 className="font-semibold text-sm">
                      ✅ What Matches
                    </h3>

                    <span className="text-xs font-semibold text-teal">
                      {
                        matches.length
                      }
                    </span>

                  </div>

                  {matches.length >
                  0 ? (
                    <ul className="space-y-2">

                      {matches.map(
                        (
                          item,
                          index
                        ) => (
                          <li
                            key={
                              index
                            }
                            className="text-sm flex gap-2 leading-relaxed"
                          >

                            <span className="text-teal shrink-0">
                              ✓
                            </span>

                            <span>
                              {typeof item ===
                              "string"
                                ? item
                                : JSON.stringify(
                                    item
                                  )}
                            </span>

                          </li>
                        )
                      )}

                    </ul>
                  ) : (
                    <p className="muted text-sm">
                      No strong matches found.
                    </p>
                  )}

                </div>

                {/* MISSING */}

                <div className="card p-[16px]">

                  <div className="flex justify-between mb-3">

                    <h3 className="font-semibold text-sm">
                      ⚠️ What's Missing
                    </h3>

                    <span className="text-xs font-semibold text-brick">
                      {
                        missing.length
                      }
                    </span>

                  </div>

                  {missing.length >
                  0 ? (
                    <ul className="space-y-2">

                      {missing.map(
                        (
                          item,
                          index
                        ) => (
                          <li
                            key={
                              index
                            }
                            className="text-sm flex gap-2 leading-relaxed"
                          >

                            <span className="text-brick shrink-0">
                              •
                            </span>

                            <span>
                              {typeof item ===
                              "string"
                                ? item
                                : JSON.stringify(
                                    item
                                  )}
                            </span>

                          </li>
                        )
                      )}

                    </ul>
                  ) : (
                    <p className="muted text-sm">
                      No major missing requirements found.
                    </p>
                  )}

                </div>

                {/* IMPROVEMENTS */}

                <div className="card p-[16px]">

                  <div className="flex justify-between mb-3">

                    <h3 className="font-semibold text-sm">
                      🎯 Improve Before Applying
                    </h3>

                    <span className="text-xs font-semibold text-plum">
                      {
                        improvements.length
                      }
                    </span>

                  </div>

                  {improvements.length >
                  0 ? (
                    <ul className="space-y-2">

                      {improvements.map(
                        (
                          item,
                          index
                        ) => (
                          <li
                            key={
                              index
                            }
                            className="text-sm flex gap-2 leading-relaxed"
                          >

                            <span className="text-plum shrink-0">
                              →
                            </span>

                            <span>
                              {typeof item ===
                              "string"
                                ? item
                                : JSON.stringify(
                                    item
                                  )}
                            </span>

                          </li>
                        )
                      )}

                    </ul>
                  ) : (
                    <p className="muted text-sm">
                      No additional improvements returned.
                    </p>
                  )}

                </div>

              </div>

              {/* ==================================================
                  KEYWORDS
              ================================================== */}

              {(requiredKeywords.length >
                0 ||
                preferredKeywords.length >
                  0) && (
                <div className="card p-[18px] mt-[14px]">

                  <h3 className="font-semibold text-sm mb-4">
                    🔑 Important Job Keywords
                  </h3>

                  {requiredKeywords.length >
                    0 && (
                    <div className="mb-4">

                      <p className="text-xs font-semibold muted mb-2">
                        Required
                      </p>

                      <div className="flex flex-wrap gap-2">

                        {requiredKeywords.map(
                          (
                            item,
                            index
                          ) => (
                            <span
                              key={
                                index
                              }
                              className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium"
                            >
                              {item}
                            </span>
                          )
                        )}

                      </div>

                    </div>
                  )}

                  {preferredKeywords.length >
                    0 && (
                    <div>

                      <p className="text-xs font-semibold muted mb-2">
                        Preferred
                      </p>

                      <div className="flex flex-wrap gap-2">

                        {preferredKeywords.map(
                          (
                            item,
                            index
                          ) => (
                            <span
                              key={
                                index
                              }
                              className="rounded-full border border-border px-3 py-1.5 text-xs font-medium"
                            >
                              {item}
                            </span>
                          )
                        )}

                      </div>

                    </div>
                  )}

                </div>
              )}

              {/* ==================================================
                  EXPERIENCE GAPS
              ================================================== */}

              {experienceGaps.length >
                0 && (
                <div className="card p-[18px] mt-[14px]">

                  <h3 className="font-semibold text-sm mb-3">
                    💼 Experience Gaps
                  </h3>

                  <ul className="space-y-2">

                    {experienceGaps.map(
                      (
                        item,
                        index
                      ) => (
                        <li
                          key={
                            index
                          }
                          className="text-sm flex gap-2 leading-relaxed"
                        >

                          <span className="text-brick">
                            •
                          </span>

                          <span>
                            {item}
                          </span>

                        </li>
                      )
                    )}

                  </ul>

                </div>
              )}

              {/* ==================================================
                  INTERVIEW PREPARATION
              ================================================== */}

              {interviewTopics.length >
                0 && (
                <div className="card p-[18px] mt-[14px]">

                  <h3 className="font-semibold text-sm mb-2">
                    🎤 Interview Preparation
                  </h3>

                  <p className="muted text-xs mb-4">
                    Topics you should prepare based on this job description.
                  </p>

                  <div className="flex flex-wrap gap-2">

                    {interviewTopics.map(
                      (
                        item,
                        index
                      ) => (
                        <span
                          key={
                            index
                          }
                          className="rounded-xl bg-muted px-3 py-2 text-sm"
                        >
                          {item}
                        </span>
                      )
                    )}

                  </div>

                </div>
              )}

              {/* ==================================================
                  NEXT ACTION
              ================================================== */}

              <div className="card p-[18px] mt-[14px]">

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                  <div>

                    <h3 className="font-semibold text-sm">
                      🚀 Ready to improve?
                    </h3>

                    <p className="muted text-xs mt-1">
                      Use the AI recommendations to improve your resume before applying.
                    </p>

                  </div>

                  <div className="flex flex-wrap gap-2">

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          "/resume"
                        )
                      }
                      className="btn btn-primary text-sm"
                    >
                      ✨ Improve Resume
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          "/ats"
                        )
                      }
                      className="btn btn-secondary text-sm"
                    >
                      📊 Check ATS
                    </button>

                  </div>

                </div>

              </div>

            </div>
          )}

      </div>
    </div>
  );
}