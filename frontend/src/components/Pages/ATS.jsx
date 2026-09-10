import React, { useRef, useState } from "react";
import BackButton from "../BackButton";
import API from "../../lib/api";

export default function ATS() {
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [targetRole, setTargetRole] = useState("");

  // --------------------------------------------------
  // FILE HELPERS
  // --------------------------------------------------

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 KB";

    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isValidFile = (selectedFile) => {
    if (!selectedFile) return false;

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];

    const extension = selectedFile.name
      .split(".")
      .pop()
      ?.toLowerCase();

    return (
      allowedTypes.includes(selectedFile.type) ||
      ["pdf", "doc", "docx"].includes(extension)
    );
  };

  // --------------------------------------------------
  // NORMALIZE API RESPONSE
  // --------------------------------------------------

  const normalizeResult = (data) => {
    const source = data?.result || data?.data || data || {};

    const rawScore =
      source.score ??
      source.atsScore ??
      source.matchScore ??
      source.ats_score ??
      source.overallScore ??
      0;

    const score = Math.max(
      0,
      Math.min(100, Number(rawScore) || 0)
    );

    const keywords =
      source.keywords ||
      source.detectedKeywords ||
      source.matchedKeywords ||
      source.keywordMatches ||
      [];

    const missingKeywords =
      source.missingKeywords ||
      source.missing_keywords ||
      source.keywordGaps ||
      source.missing ||
      [];

    const suggestions =
      source.suggestions ||
      source.recommendations ||
      source.improvements ||
      source.feedback ||
      [];

    const sections =
      source.sections ||
      source.sectionAnalysis ||
      source.sectionScores ||
      {};

    const formatting =
      source.formatting ||
      source.formattingScore ||
      source.formatScore ||
      0;

    const keywordScore =
      source.keywordScore ||
      source.keyword_score ||
      source.keywordsScore ||
      0;

    const contentScore =
      source.contentScore ||
      source.content_score ||
      source.experienceScore ||
      0;

    const contactScore =
      source.contactScore ||
      source.contact_score ||
      0;

    return {
      score,
      keywords: Array.isArray(keywords)
        ? keywords
        : typeof keywords === "string"
        ? keywords
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean)
        : [],

      missingKeywords: Array.isArray(missingKeywords)
        ? missingKeywords
        : typeof missingKeywords === "string"
        ? missingKeywords
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean)
        : [],

      suggestions: Array.isArray(suggestions)
        ? suggestions
        : typeof suggestions === "string"
        ? suggestions
            .split("\n")
            .map((x) =>
              x
                .replace(/^[-•*]\s*/, "")
                .replace(/^\d+\.\s*/, "")
                .trim()
            )
            .filter(Boolean)
        : [],

      sections,
      formatting: Number(formatting) || 0,
      keywordScore: Number(keywordScore) || 0,
      contentScore: Number(contentScore) || 0,
      contactScore: Number(contactScore) || 0,

      raw: source,
    };
  };

  // --------------------------------------------------
  // SCORE STATUS
  // --------------------------------------------------

  const getScoreStatus = (score) => {
    if (score >= 85) {
      return {
        title: "Excellent ATS Score",
        description:
          "Your resume is highly optimized for Applicant Tracking Systems.",
        className: "text-teal",
        bg: "bg-teal/10",
        border: "border-teal/30",
      };
    }

    if (score >= 70) {
      return {
        title: "Good ATS Score",
        description:
          "Your resume is ATS-friendly, but there are still some areas to improve.",
        className: "text-teal",
        bg: "bg-teal/10",
        border: "border-teal/30",
      };
    }

    if (score >= 50) {
      return {
        title: "Needs Improvement",
        description:
          "Your resume has several areas that could reduce ATS compatibility.",
        className: "text-gold",
        bg: "bg-gold/10",
        border: "border-gold/30",
      };
    }

    return {
      title: "Low ATS Compatibility",
      description:
        "Your resume needs optimization before applying to ATS-heavy jobs.",
      className: "text-brick",
      bg: "bg-brick/10",
      border: "border-brick/30",
    };
  };

  // --------------------------------------------------
  // ANALYZE RESUME
  // --------------------------------------------------

  const analyzeResume = async (selectedFile = file) => {
    if (!selectedFile) {
      setError("Please select a PDF or DOCX resume first.");
      return;
    }

    if (!isValidFile(selectedFile)) {
      setError(
        "Please upload a valid PDF, DOC, or DOCX resume."
      );
      return;
    }
    if (!targetRole.trim()) {
  setError(
    "Please enter the target job role, for example Frontend Developer."
  );
  return;
}

    setLoading(true);
    setError("");

    try {
const response = await API.uploadAts(
  selectedFile,
  targetRole.trim()
);

if (!response) {
  throw new Error("No response received from ATS analyzer.");
}

if (response.error) {
  throw new Error(
    response.message ||
      "The ATS analyzer could not process this resume."
  );
}

const normalized = normalizeResult(response);

      setResult(normalized);
    } catch (err) {
      console.error("ATS analysis error:", err);

      setError(
        err?.message ||
          "Unable to analyze your resume. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // FILE SELECTION
  // --------------------------------------------------

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;

    if (!isValidFile(selectedFile)) {
      setError(
        "Only PDF, DOC, and DOCX files are supported."
      );
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10 MB.");
      return;
    }

    setFile(selectedFile);
    setResult(null);
    setError("");
  };

  const handleInputChange = (event) => {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      handleFile(selectedFile);
    }
  };

  // --------------------------------------------------
  // DRAG AND DROP
  // --------------------------------------------------

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(false);

    const droppedFile = event.dataTransfer.files?.[0];

    if (droppedFile) {
      handleFile(droppedFile);
    }
  };

  // --------------------------------------------------
  // CLEAR FILE
  // --------------------------------------------------

  const clearFile = () => {
    setFile(null);
    setResult(null);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // --------------------------------------------------
  // SCORE CIRCLE
  // --------------------------------------------------

  const ScoreCircle = ({ score }) => {
    const radius = 58;
    const circumference = 2 * Math.PI * radius;

    const offset =
      circumference -
      (circumference * score) / 100;

    return (
      <div className="relative w-[150px] h-[150px] shrink-0">
        <svg
          viewBox="0 0 150 150"
          className="w-full h-full -rotate-90"
        >
          <circle
            cx="75"
            cy="75"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-muted"
          />

          <circle
            cx="75"
            cy="75"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            className="text-primary transition-all duration-1000"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold">
            {score}
          </span>

          <span className="text-xs muted">
            / 100
          </span>
        </div>
      </div>
    );
  };

  // --------------------------------------------------
  // PROGRESS BAR
  // --------------------------------------------------

  const ProgressBar = ({ label, value }) => {
    const safeValue = Math.max(
      0,
      Math.min(100, Number(value) || 0)
    );

    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium">
            {label}
          </span>

          <span className="text-xs font-semibold muted">
            {safeValue}%
          </span>
        </div>

        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${safeValue}%` }}
          />
        </div>
      </div>
    );
  };

  // --------------------------------------------------
  // SECTION STATUS
  // --------------------------------------------------

  const getSectionStatus = (name) => {
    const sectionData =
      result?.sections?.[name] ||
      result?.sections?.[
        name.toLowerCase()
      ];

    if (typeof sectionData === "number") {
      return sectionData >= 70;
    }

    if (typeof sectionData === "boolean") {
      return sectionData;
    }

    if (sectionData?.score !== undefined) {
      return Number(sectionData.score) >= 70;
    }

    if (sectionData?.present !== undefined) {
      return Boolean(sectionData.present);
    }

    return null;
  };

  // --------------------------------------------------
  // MAIN RENDER
  // --------------------------------------------------

  return (
    <div className="w-full min-h-full p-[22px] overflow-hidden">

      <div className="w-full min-h-full flex flex-col overflow-y-auto overflow-x-hidden pr-[2px] pb-[24px]">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="shrink-0 mb-[20px]">

          <div className="flex items-start gap-3">

            <BackButton fallbackRoute="/db" />

            <div>

              <div className="text-xs font-semibold tracking-wider text-plum uppercase mb-1">
                📊 Resume Analysis
              </div>

              <h1 className="text-3xl font-display font-bold">
                ATS Checker
              </h1>

              <p className="muted text-sm mt-1 max-w-2xl leading-relaxed">
                Analyze your resume for ATS compatibility,
                discover missing keywords, and get actionable
                recommendations before applying.
              </p>

            </div>

          </div>

        </div>

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div className="shrink-0 mb-[16px] rounded-xl border border-brick/30 bg-brick/10 px-4 py-3 text-sm text-brick flex items-center justify-between gap-4">

            <span>{error}</span>

            <button
              onClick={() => setError("")}
              className="text-lg font-bold"
            >
              ×
            </button>

          </div>
        )}

        {/* =====================================================
            UPLOAD + QUICK INFO
        ===================================================== */}

        <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.65fr] gap-[18px] shrink-0">

          {/* UPLOAD CARD */}

    <div className="card p-[18px]">

  <div className="flex items-center justify-between mb-[14px]">
    <div>
      <h2 className="font-semibold text-lg">
        Upload your resume
      </h2>

      <p className="text-xs muted mt-1">
        PDF, DOC, or DOCX · Maximum 10 MB
      </p>
    </div>

    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg">
      📄
    </div>
  </div>

  {/* TARGET JOB ROLE */}

  <div className="mb-[16px]">
    <label className="block text-sm font-semibold mb-2">
      Target Job Role
    </label>

    <input
      type="text"
      value={targetRole}
      onChange={(e) => {
        setTargetRole(e.target.value);
        setError("");
      }}
      placeholder="e.g. Frontend Developer"
      className="input w-full"
    />

    <p className="text-xs muted mt-2">
      Enter the role you are applying for. Your ATS score will be
      calculated based on the skills and requirements of this role.
    </p>
  </div>


            {/* DROP ZONE */}

            {!file ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className={`min-h-[210px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  dragActive
                    ? "border-primary bg-primary/10 scale-[1.01]"
                    : "border-border bg-muted/30 hover:border-primary/50 hover:bg-primary/5"
                }`}
              >

                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl mb-3">
                  ☁️
                </div>

                <p className="font-semibold text-sm">
                  Drag & drop your resume here
                </p>

                <p className="text-xs muted mt-1 mb-4">
                  or choose a file from your computer
                </p>

                <button
                  type="button"
                  className="btn btn-primary text-sm"
                  onClick={(event) => {
                    event.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Choose Resume
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleInputChange}
                  className="hidden"
                />

              </div>
            ) : (
              <div className="rounded-xl border border-border bg-muted/30 p-[16px]">

                <div className="flex items-center gap-4">

                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-xl shrink-0">
                    📄
                  </div>

                  <div className="min-w-0 flex-1">

                    <p className="font-semibold text-sm truncate">
                      {file.name}
                    </p>

                    <p className="text-xs muted mt-1">
                      {formatFileSize(file.size)}
                    </p>

                  </div>

                  <button
                    onClick={clearFile}
                    className="text-muted-foreground hover:text-brick text-xl"
                    title="Remove file"
                  >
                    ×
                  </button>

                </div>

                <div className="flex gap-2 mt-[14px]">

                  <button
                    onClick={() => analyzeResume(file)}
                    disabled={loading}
                    className="btn btn-primary flex-1 text-sm"
                  >
                    {loading
                      ? "Analyzing..."
                      : result
                      ? "🔄 Analyze Again"
                      : "✨ Analyze Resume"}
                  </button>

                  <button
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    className="btn btn-secondary text-sm"
                  >
                    Change
                  </button>

                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleInputChange}
                  className="hidden"
                />

              </div>
            )}

          </div>

          {/* HOW IT WORKS */}

          <div className="card p-[18px]">

            <h2 className="font-semibold text-lg mb-[14px]">
              How ATS analysis works
            </h2>

            <div className="space-y-[13px]">

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm">
                  1
                </div>

                <div>
                  <p className="text-sm font-semibold">
                    Upload your resume
                  </p>

                  <p className="text-xs muted mt-1">
                    We analyze the content and structure.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm">
                  2
                </div>

                <div>
                  <p className="text-sm font-semibold">
                    Check ATS compatibility
                  </p>

                  <p className="text-xs muted mt-1">
                    Keywords, formatting and important sections
                    are evaluated.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm">
                  3
                </div>

                <div>
                  <p className="text-sm font-semibold">
                    Improve your resume
                  </p>

                  <p className="text-xs muted mt-1">
                    Get specific suggestions before applying.
                  </p>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* =====================================================
            EMPTY STATE
        ===================================================== */}

        {!result && !loading && (
          <div className="card mt-[18px] p-[24px]">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px]">

              <div className="rounded-xl bg-primary/5 border border-primary/10 p-[16px]">
                <div className="text-xl mb-2">🔑</div>

                <h3 className="font-semibold text-sm">
                  Keyword Detection
                </h3>

                <p className="text-xs muted mt-1 leading-relaxed">
                  Find important keywords that recruiters and
                  ATS systems look for.
                </p>
              </div>

              <div className="rounded-xl bg-teal/5 border border-teal/10 p-[16px]">
                <div className="text-xl mb-2">📋</div>

                <h3 className="font-semibold text-sm">
                  Resume Structure
                </h3>

                <p className="text-xs muted mt-1 leading-relaxed">
                  Check whether your resume contains the
                  sections ATS systems expect.
                </p>
              </div>

              <div className="rounded-xl bg-plum/5 border border-plum/10 p-[16px]">
                <div className="text-xl mb-2">💡</div>

                <h3 className="font-semibold text-sm">
                  Smart Recommendations
                </h3>

                <p className="text-xs muted mt-1 leading-relaxed">
                  Receive actionable recommendations to make
                  your resume stronger.
                </p>
              </div>

            </div>

          </div>
        )}

        {/* =====================================================
            LOADING
        ===================================================== */}

        {loading && (
          <div className="card mt-[18px] p-[35px] flex flex-col items-center justify-center">

            <div className="w-16 h-16 rounded-full border-4 border-muted border-t-primary animate-spin mb-4"></div>

            <h3 className="font-semibold text-lg">
              Analyzing your resume...
            </h3>

            <p className="muted text-sm mt-1">
              Checking keywords, formatting and ATS compatibility.
            </p>

          </div>
        )}

        {/* =====================================================
            RESULTS
        ===================================================== */}

        {result && !loading && (
          <div className="mt-[18px]">

            {/* SCORE OVERVIEW */}

            <div className="card p-[20px] mb-[16px]">

              <div className="flex flex-col lg:flex-row gap-[24px] items-center">

                <ScoreCircle score={result.score} />

                <div className="flex-1 w-full">

                  {(() => {
                    const status =
                      getScoreStatus(result.score);

                    return (
                      <>
                        <div
                          className={`inline-flex items-center px-3 py-1.5 rounded-full border text-xs font-semibold ${status.bg} ${status.border} ${status.className}`}
                        >
                          {result.score >= 70
                            ? "✓"
                            : "!"}{" "}
                          {status.title}
                        </div>

                        <h2 className="text-xl font-display font-bold mt-3">
                          Your resume scored{" "}
                          {result.score}/100
                        </h2>

                        <p className="muted text-sm mt-1 max-w-2xl">
                          {status.description}
                        </p>
                      </>
                    );
                  })()}

                </div>

                <button
                  onClick={() => analyzeResume(file)}
                  className="btn btn-primary shrink-0"
                >
                  🔄 Re-analyze
                </button>

              </div>

            </div>

            {/* SCORE BREAKDOWN */}

            <div className="card p-[18px] mb-[16px]">

              <div className="flex items-center justify-between mb-[16px]">

                <div>
                  <h2 className="font-semibold text-lg">
                    Score breakdown
                  </h2>

                  <p className="text-xs muted mt-1">
                    See where your resume performs well and
                    where it needs improvement.
                  </p>
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[30px]">

                <ProgressBar
                  label="Keywords"
                  value={
                    result.keywordScore ||
                    result.score
                  }
                />

                <ProgressBar
                  label="Formatting"
                  value={
                    result.formatting ||
                    result.score
                  }
                />

                <ProgressBar
                  label="Content"
                  value={
                    result.contentScore ||
                    result.score
                  }
                />

                <ProgressBar
                  label="Contact Information"
                  value={
                    result.contactScore ||
                    result.score
                  }
                />

              </div>

            </div>

            {/* KEYWORDS */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-[16px] mb-[16px]">

              {/* DETECTED */}

              <div className="card p-[18px]">

                <div className="flex items-center justify-between mb-[14px]">

                  <div>
                    <h2 className="font-semibold">
                      🔑 Detected Keywords
                    </h2>

                    <p className="text-xs muted mt-1">
                      Keywords already found in your resume.
                    </p>
                  </div>

                  <span className="text-xs font-semibold text-teal">
                    {result.keywords.length} found
                  </span>

                </div>

                {result.keywords.length > 0 ? (
                  <div className="flex flex-wrap gap-2">

                    {result.keywords.map(
                      (keyword, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 rounded-full bg-teal/10 border border-teal/20 text-teal text-xs font-medium"
                        >
                          ✓ {keyword}
                        </span>
                      )
                    )}

                  </div>
                ) : (
                  <p className="muted text-sm">
                    No keyword information was returned.
                  </p>
                )}

              </div>

              {/* MISSING */}

              <div className="card p-[18px]">

                <div className="flex items-center justify-between mb-[14px]">

                  <div>
                    <h2 className="font-semibold">
                      ⚠️ Missing Keywords
                    </h2>

                    <p className="text-xs muted mt-1">
                      Keywords you may want to add where relevant.
                    </p>
                  </div>

                  <span className="text-xs font-semibold text-brick">
                    {result.missingKeywords.length} missing
                  </span>

                </div>

                {result.missingKeywords.length > 0 ? (
                  <div className="flex flex-wrap gap-2">

                    {result.missingKeywords.map(
                      (keyword, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 rounded-full bg-brick/10 border border-brick/20 text-brick text-xs font-medium"
                        >
                          + {keyword}
                        </span>
                      )
                    )}

                  </div>
                ) : (
                  <div className="rounded-lg bg-teal/10 border border-teal/20 p-3">
                    <p className="text-sm text-teal font-medium">
                      ✓ No major missing keywords detected.
                    </p>
                  </div>
                )}

              </div>

            </div>

            {/* SECTION CHECKLIST */}

            <div className="card p-[18px] mb-[16px]">

              <div className="mb-[16px]">

                <h2 className="font-semibold text-lg">
                  📋 Resume section checklist
                </h2>

                <p className="text-xs muted mt-1">
                  Important sections ATS systems expect to find.
                </p>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[10px]">

                {[
                  ["contact", "Contact Information", "👤"],
                  ["summary", "Professional Summary", "📝"],
                  ["skills", "Skills", "🛠️"],
                  ["experience", "Work Experience", "💼"],
                  ["education", "Education", "🎓"],
                  ["projects", "Projects", "🚀"],
                ].map(
                  ([key, label, icon]) => {
                    const status =
                      getSectionStatus(key);

                    return (
                      <div
                        key={key}
                        className={`rounded-xl border p-[13px] flex items-center gap-3 ${
                          status === false
                            ? "border-brick/20 bg-brick/5"
                            : status === true
                            ? "border-teal/20 bg-teal/5"
                            : "border-border bg-muted/20"
                        }`}
                      >

                        <div className="text-lg">
                          {icon}
                        </div>

                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {label}
                          </p>

                          <p className="text-xs muted mt-0.5">
                            {status === true
                              ? "Detected"
                              : status === false
                              ? "Needs attention"
                              : "Analyzed"}
                          </p>
                        </div>

                        <div>
                          {status === true
                            ? "✅"
                            : status === false
                            ? "⚠️"
                            : "✓"}
                        </div>

                      </div>
                    );
                  }
                )}

              </div>

            </div>

            {/* IMPROVEMENTS */}

            <div className="card p-[18px] mb-[16px]">

              <div className="mb-[16px]">

                <h2 className="font-semibold text-lg">
                  💡 How to improve your resume
                </h2>

                <p className="text-xs muted mt-1">
                  Follow these recommendations to increase your
                  ATS compatibility.
                </p>

              </div>

              {result.suggestions.length > 0 ? (
                <div className="space-y-[10px]">

                  {result.suggestions.map(
                    (suggestion, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 p-[13px]"
                      >

                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold shrink-0">
                          {index + 1}
                        </div>

                        <p className="text-sm leading-relaxed">
                          {typeof suggestion === "string"
                            ? suggestion
                            : suggestion?.text ||
                              suggestion?.message ||
                              JSON.stringify(
                                suggestion
                              )}
                        </p>

                      </div>
                    )
                  )}

                </div>
              ) : (
                <div className="rounded-xl bg-muted/30 border border-border p-[16px]">
                  <p className="text-sm muted">
                    Your ATS analyzer did not return specific
                    recommendations.
                  </p>
                </div>
              )}

            </div>

            {/* FINAL CTA */}

            <div className="card p-[20px] bg-linear-to-r from-primary/10 via-plum/5 to-teal/10">

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                <div>

                  <h3 className="font-display font-bold text-lg">
                    Ready to improve your resume?
                  </h3>

                  <p className="text-sm muted mt-1">
                    Apply these recommendations in the resume
                    builder and analyze your updated version again.
                  </p>

                </div>

                <button
                  onClick={() =>
                    window.location.href = "/create-resume"
                  }
                  className="btn btn-primary shrink-0"
                >
                  ✨ Improve My Resume
                </button>

              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}