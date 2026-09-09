import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../BackButton";
import API from "../../lib/api";
import { getToken } from "../../lib/auth";

export default function JobMatch() {
  const navigate = useNavigate();

  const [targetRole, setTargetRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeContent, setResumeContent] = useState("");

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resumeLoaded, setResumeLoaded] = useState(false);

  // --------------------------------------------------
  // LOAD GENERATED RESUME
  // --------------------------------------------------
  const loadGeneratedResume = () => {
    try {
      const stored = localStorage.getItem("generatedResume");

      if (!stored) {
        setError(
          "No generated resume found. Please create a resume first."
        );
        return;
      }

      const parsed = JSON.parse(stored);

      let text = "";

      if (typeof parsed === "string") {
        text = parsed;
      } else if (parsed?.text) {
        text = parsed.text;
      } else if (parsed?.content) {
        text = parsed.content;
      } else if (parsed?.resume) {
        text =
          typeof parsed.resume === "string"
            ? parsed.resume
            : JSON.stringify(parsed.resume, null, 2);
      } else {
        text = JSON.stringify(parsed, null, 2);
      }

      setResumeContent(text);
      setResumeLoaded(true);
      setError("");
    } catch (err) {
      console.error("Resume loading error:", err);
      setError("Unable to load the generated resume.");
    }
  };

  // --------------------------------------------------
  // LOAD RESUME ON PAGE OPEN
  // --------------------------------------------------
  useEffect(() => {
    const stored = localStorage.getItem("generatedResume");

    if (stored) {
      loadGeneratedResume();
    }
  }, []);

  // --------------------------------------------------
  // RUN JOB MATCH
  // --------------------------------------------------
  const handleJobMatch = async () => {
    setError("");
    setResult(null);

    if (!targetRole.trim()) {
      setError("Please enter the target job title.");
      return;
    }

    if (!jobDescription.trim()) {
      setError("Please paste the job description.");
      return;
    }

    if (!resumeContent.trim()) {
      setError(
        "Please load your generated resume before running the job match."
      );
      return;
    }

    setLoading(true);

    try {
      const token = getToken();

      const API_URL =
        import.meta.env.VITE_API_URL ||
        "http://localhost:4000";

      const controller = new AbortController();

      const timeout = setTimeout(() => {
        controller.abort();
      }, 60000);

      const response = await fetch(
        `${API_URL}/api/ai/job-match`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },
          body: JSON.stringify({
            targetRole,
            jobDescription,
            resume: resumeContent,
            resumeContent,
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Failed to analyze the job match."
        );
      }

      setResult(data);
    } catch (err) {
      console.error("Job match error:", err);

      if (err.name === "AbortError") {
        setError(
          "The analysis took too long. Please try again."
        );
      } else {
        setError(
          err.message ||
            "Failed to analyze the job match. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // RESULT HELPERS
  // --------------------------------------------------
  const getScore = () => {
    if (!result) return null;

    return (
      result.score ??
      result.matchScore ??
      result.atsScore ??
      result.data?.score ??
      result.data?.matchScore ??
      null
    );
  };

  const score = getScore();

  const matches =
    result?.matches ||
    result?.matchedSkills ||
    result?.matchingSkills ||
    result?.data?.matches ||
    result?.data?.matchedSkills ||
    [];

  const missing =
    result?.missing ||
    result?.missingSkills ||
    result?.gaps ||
    result?.data?.missing ||
    result?.data?.missingSkills ||
    [];

  const improvements =
    result?.improvements ||
    result?.recommendations ||
    result?.suggestions ||
    result?.data?.improvements ||
    result?.data?.recommendations ||
    [];

  const analysis =
    result?.analysis ||
    result?.summary ||
    result?.message ||
    result?.data?.analysis ||
    result?.data?.summary ||
    "";

  const normalizeArray = (value) => {
    if (Array.isArray(value)) return value;

    if (typeof value === "string") {
      return value
        .split("\n")
        .map((item) =>
          item
            .replace(/^[-•*]\s*/, "")
            .replace(/^\d+\.\s*/, "")
            .trim()
        )
        .filter(Boolean);
    }

    return [];
  };

  const matchItems = normalizeArray(matches);
  const missingItems = normalizeArray(missing);
  const improvementItems = normalizeArray(improvements);

  const scoreNumber =
    score !== null && !Number.isNaN(Number(score))
      ? Math.max(0, Math.min(100, Number(score)))
      : null;

  // --------------------------------------------------
  // SCORE LABEL
  // --------------------------------------------------
  const getScoreLabel = () => {
    if (scoreNumber === null) return "Not available";
    if (scoreNumber >= 80) return "Excellent Match";
    if (scoreNumber >= 60) return "Good Match";
    if (scoreNumber >= 40) return "Moderate Match";
    return "Needs Improvement";
  };

  // --------------------------------------------------
  // MAIN UI
  // --------------------------------------------------
  return (
    <div className="w-full min-h-full p-[22px] overflow-hidden">
      <div className="w-full min-h-full h-full flex flex-col overflow-y-auto overflow-x-hidden pr-[2px]">

        {/* ==================================================
            HEADER
        ================================================== */}
        <div className="shrink-0 mb-[20px]">
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
                Compare your resume with a job description and discover
                what matches, what is missing, and what you should improve
                before applying.
              </p>
            </div>
          </div>
        </div>

        {/* ==================================================
            ERROR
        ================================================== */}
        {error && (
          <div className="shrink-0 mb-[16px] rounded-xl border border-brick/30 bg-brick/10 px-4 py-3 text-sm text-brick flex items-center justify-between gap-4">
            <span>{error}</span>

            <button
              onClick={() => setError("")}
              className="font-bold text-lg shrink-0"
            >
              ×
            </button>
          </div>
        )}

        {/* ==================================================
            TOP TWO CARDS
        ================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[18px] shrink-0">

          {/* TARGET ROLE */}
          <div className="card overflow-hidden">
            {/* Card Header */}
            <div className="px-[16px] py-[13px] border-b border-border flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                🎯
              </div>

              <div>
                <h3 className="font-semibold text-sm">
                  Target role
                </h3>

                <p className="text-xs muted mt-[2px]">
                  Tell the AI which position you want to target.
                </p>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-[16px]">
              <label className="block label mb-[7px]">
                Job title
              </label>

              <input
                type="text"
                value={targetRole}
                onChange={(e) =>
                  setTargetRole(e.target.value)
                }
                className="input w-full text-sm"
                placeholder="e.g. Python Developer"
              />

              {/* AI ROLE ANALYSIS */}
              <div className="mt-[14px] rounded-xl border border-plum/20 bg-plum/5 px-[13px] py-[11px]">
                <div className="flex items-start gap-3">
                  <div className="text-lg shrink-0">
                    ✨
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-plum">
                      AI role analysis
                    </p>

                    <p className="text-xs muted mt-[3px] leading-relaxed">
                      Gemini will analyze the role requirements
                      against the skills and experience in your resume.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* JOB DESCRIPTION */}
          <div className="card overflow-hidden">
            {/* Card Header */}
            <div className="px-[16px] py-[13px] border-b border-border flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                🔍
              </div>

              <div>
                <h3 className="font-semibold text-sm">
                  Job description
                </h3>

                <p className="text-xs muted mt-[2px]">
                  Paste the job posting you want to match against.
                </p>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-[16px]">
              <textarea
                value={jobDescription}
                onChange={(e) =>
                  setJobDescription(e.target.value)
                }
                className="input w-full text-sm min-h-[190px] resize-y leading-relaxed"
                placeholder={`Paste the complete job description here.

Example:

We are looking for a Python Developer with experience in Django, REST APIs, SQL, Git and AWS...`}
              />
            </div>
          </div>
        </div>

        {/* ==================================================
            RESUME CARD
        ================================================== */}
        <div className="card mt-[18px] shrink-0 overflow-hidden">

          {/* Header */}
          <div className="px-[16px] py-[13px] border-b border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              📄
            </div>

            <div>
              <h3 className="font-semibold text-sm">
                Your resume
              </h3>

              <p className="text-xs muted mt-[2px]">
                Use your generated resume or paste your resume content.
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="p-[16px]">

            {/* Load Button */}
            <div className="flex items-center gap-3 mb-[12px] flex-wrap">
              <button
                onClick={loadGeneratedResume}
                className="btn btn-secondary text-sm"
              >
                📄 Load generated resume
              </button>

              {resumeLoaded && (
                <span className="text-xs text-teal font-medium">
                  Resume content loaded
                </span>
              )}
            </div>

            {/* Resume Content */}
            <textarea
              value={resumeContent}
              onChange={(e) =>
                setResumeContent(e.target.value)
              }
              className="input w-full min-h-[210px] resize-y text-sm leading-relaxed"
              placeholder="Your generated resume content will appear here..."
            />

          </div>
        </div>

        {/* ==================================================
            ACTION AREA
        ================================================== */}
        <div className="flex justify-end mt-[16px] shrink-0">
          <button
            onClick={handleJobMatch}
            disabled={loading}
            className="btn btn-primary min-w-[180px]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="spinner"></span>
                Analyzing...
              </span>
            ) : (
              "✨ Analyze Job Match"
            )}
          </button>
        </div>

        {/* ==================================================
            RESULTS
        ================================================== */}
        {result && !loading && (
          <div className="mt-[20px] pb-[20px]">

            {/* RESULT HEADER */}
            <div className="card p-[18px] mb-[16px]">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-plum mb-1">
                    AI Analysis
                  </p>

                  <h2 className="text-xl font-display font-bold">
                    Job Match Results
                  </h2>

                  {analysis && (
                    <p className="muted text-sm mt-2 max-w-3xl leading-relaxed">
                      {typeof analysis === "string"
                        ? analysis
                        : JSON.stringify(analysis)}
                    </p>
                  )}
                </div>

                {/* SCORE */}
                {scoreNumber !== null && (
                  <div className="flex items-center gap-4 shrink-0">

                    <div className="relative w-[86px] h-[86px]">
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
                            (264 * scoreNumber) /
                              100
                          }
                        />
                      </svg>

                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold">
                          {scoreNumber}%
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="font-semibold text-sm">
                        {getScoreLabel()}
                      </p>

                      <p className="text-xs muted mt-1">
                        Resume compatibility
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* THREE RESULT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px]">

              {/* MATCHED */}
              <div className="card p-[16px]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">
                    ✅ What Matches
                  </h3>

                  <span className="text-xs font-semibold text-teal">
                    {matchItems.length}
                  </span>
                </div>

                {matchItems.length > 0 ? (
                  <ul className="space-y-2">
                    {matchItems.map((item, index) => (
                      <li
                        key={index}
                        className="text-sm leading-relaxed flex gap-2"
                      >
                        <span className="text-teal shrink-0">
                          •
                        </span>

                        <span>
                          {typeof item === "string"
                            ? item
                            : JSON.stringify(item)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted text-sm">
                    No matching skills were returned.
                  </p>
                )}
              </div>

              {/* MISSING */}
              <div className="card p-[16px]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">
                    ⚠️ What's Missing
                  </h3>

                  <span className="text-xs font-semibold text-brick">
                    {missingItems.length}
                  </span>
                </div>

                {missingItems.length > 0 ? (
                  <ul className="space-y-2">
                    {missingItems.map((item, index) => (
                      <li
                        key={index}
                        className="text-sm leading-relaxed flex gap-2"
                      >
                        <span className="text-brick shrink-0">
                          •
                        </span>

                        <span>
                          {typeof item === "string"
                            ? item
                            : JSON.stringify(item)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted text-sm">
                    No major missing requirements were returned.
                  </p>
                )}
              </div>

              {/* IMPROVEMENTS */}
              <div className="card p-[16px]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">
                    🎯 Improve Before Applying
                  </h3>

                  <span className="text-xs font-semibold text-plum">
                    {improvementItems.length}
                  </span>
                </div>

                {improvementItems.length > 0 ? (
                  <ul className="space-y-2">
                    {improvementItems.map((item, index) => (
                      <li
                        key={index}
                        className="text-sm leading-relaxed flex gap-2"
                      >
                        <span className="text-plum shrink-0">
                          •
                        </span>

                        <span>
                          {typeof item === "string"
                            ? item
                            : JSON.stringify(item)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted text-sm">
                    No additional improvements were returned.
                  </p>
                )}
              </div>
            </div>

            {/* RAW RESULT FALLBACK */}
            {!scoreNumber &&
              matchItems.length === 0 &&
              missingItems.length === 0 &&
              improvementItems.length === 0 &&
              !analysis && (
                <div className="card p-[16px] mt-[14px]">
                  <h3 className="font-semibold text-sm mb-3">
                    Analysis Response
                  </h3>

                  <pre className="text-xs whitespace-pre-wrap break-words muted">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              )}
          </div>
        )}

      </div>
    </div>
  );
}