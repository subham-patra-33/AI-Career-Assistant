import React, { useRef, useState } from "react";
import BackButton from "../BackButton";
import { getToken } from "../../lib/auth";

export default function ATS() {
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:4000";

  // ============================================================
  // FILE SIZE
  // ============================================================

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 KB";

    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }

    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  };

  // ============================================================
  // FILE VALIDATION
  // ============================================================

  const isValidFile = (selectedFile) => {
    if (!selectedFile) return false;

    const extension =
      selectedFile.name
        .split(".")
        .pop()
        ?.toLowerCase();

    return [
      "pdf",
      "doc",
      "docx",
    ].includes(extension);
  };

  // ============================================================
  // ARRAY NORMALIZER
  // ============================================================

  const normalizeArray = (value) => {
    if (Array.isArray(value)) {
      return value;
    }

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

  // ============================================================
  // NORMALIZE ATS RESPONSE
  // ============================================================

  const normalizeResult = (data) => {
    const source =
      data?.result ||
      data?.analysis ||
      data?.data ||
      data ||
      {};

    const rawScore =
      source.score ??
      source.atsScore ??
      source.ats_score ??
      source.overallScore ??
      source.overall_score ??
      source.compatibilityScore ??
      0;

    const score = Math.max(
      0,
      Math.min(
        100,
        Number(rawScore) || 0
      )
    );

    const keywords = normalizeArray(
      source.keywords ||
        source.detectedKeywords ||
        source.detected_keywords ||
        source.matchedKeywords ||
        source.matched_keywords ||
        []
    );

    const missingKeywords =
      normalizeArray(
        source.missingKeywords ||
          source.missing_keywords ||
          source.keywordGaps ||
          source.keyword_gaps ||
          []
      );

    const suggestions =
      normalizeArray(
        source.suggestions ||
          source.recommendations ||
          source.improvements ||
          source.feedback ||
          []
      );

    const breakdown =
      source.breakdown ||
      source.scoreBreakdown ||
      source.score_breakdown ||
      {};

    const formatting =
      source.formatting ??
      source.formattingScore ??
      source.format_score ??
      breakdown.formatting ??
      0;

    const keywordScore =
      source.keywordScore ??
      source.keyword_score ??
      source.keywordsScore ??
      breakdown.keywords ??
      0;

    const contentScore =
      source.contentScore ??
      source.content_score ??
      breakdown.content ??
      0;

    const contactScore =
      source.contactScore ??
      source.contact_score ??
      breakdown.contactInformation ??
      breakdown.contact ??
      0;

    const sections =
      source.sections ||
      source.sectionAnalysis ||
      source.section_analysis ||
      {};

    return {
      score,

      keywords,

      missingKeywords,

      suggestions,

      sections,

      formatting:
        Number(formatting) || 0,

      keywordScore:
        Number(keywordScore) || 0,

      contentScore:
        Number(contentScore) || 0,

      contactScore:
        Number(contactScore) || 0,

      summary:
        source.summary ||
        source.analysisSummary ||
        "",

      raw: source,
    };
  };

  // ============================================================
  // SCORE STATUS
  // ============================================================

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

  // ============================================================
  // ANALYZE RESUME
  // ============================================================

  const analyzeResume = async (
    selectedFile = file
  ) => {
    if (!selectedFile) {
      setError(
        "Please select a resume first."
      );
      return;
    }

    if (!isValidFile(selectedFile)) {
      setError(
        "Please upload a valid PDF, DOC, or DOCX resume."
      );
      return;
    }

    if (
      selectedFile.size >
      10 * 1024 * 1024
    ) {
      setError(
        "File size must be less than 10 MB."
      );
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const token = getToken();

      const formData =
        new FormData();

      formData.append(
        "file",
        selectedFile
      );

      const response =
        await fetch(
          `${API_URL}/api/ai/ats`,
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
        data =
          await response.json();
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      // IMPORTANT:
      // Do NOT convert backend errors into 0 score.

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            `ATS analysis failed (${response.status}).`
        );
      }

      if (
        data?.success === false
      ) {
        throw new Error(
          data?.error ||
            data?.message ||
            "ATS analysis failed."
        );
      }

      const normalized =
        normalizeResult(data);

      if (
        !normalized ||
        normalized.score === null ||
        normalized.score === undefined
      ) {
        throw new Error(
          "The ATS analyzer returned an invalid score."
        );
      }

      setResult(normalized);

    } catch (err) {
      console.error(
        "ATS analysis error:",
        err
      );

      setResult(null);

      setError(
        err?.message ||
          "Unable to analyze your resume. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // FILE SELECT
  // ============================================================

  const handleFile = (
    selectedFile
  ) => {
    if (!selectedFile) {
      return;
    }

    if (
      !isValidFile(selectedFile)
    ) {
      setError(
        "Only PDF, DOC, and DOCX files are supported."
      );
      return;
    }

    if (
      selectedFile.size >
      10 * 1024 * 1024
    ) {
      setError(
        "File size must be less than 10 MB."
      );
      return;
    }

    setFile(selectedFile);
    setResult(null);
    setError("");
  };

  const handleInputChange = (
    event
  ) => {
    const selectedFile =
      event.target.files?.[0];

    if (selectedFile) {
      handleFile(selectedFile);
    }
  };

  // ============================================================
  // DRAG & DROP
  // ============================================================

  const handleDragOver = (
    event
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(true);
  };

  const handleDragLeave = (
    event
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(false);
  };

  const handleDrop = (
    event
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(false);

    const droppedFile =
      event.dataTransfer.files?.[0];

    if (droppedFile) {
      handleFile(
        droppedFile
      );
    }
  };

  // ============================================================
  // CLEAR FILE
  // ============================================================

  const clearFile = () => {
    setFile(null);
    setResult(null);
    setError("");

    if (
      fileInputRef.current
    ) {
      fileInputRef.current.value =
        "";
    }
  };

  // ============================================================
  // SCORE CIRCLE
  // ============================================================

  const ScoreCircle = ({
    score,
  }) => {
    const radius = 58;

    const circumference =
      2 *
      Math.PI *
      radius;

    const offset =
      circumference -
      (circumference *
        score) /
        100;

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
            strokeDasharray={
              circumference
            }
            strokeDashoffset={
              offset
            }
          />

        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">

          <span className="text-3xl font-bold">
            {Math.round(score)}
          </span>

          <span className="text-xs muted">
            / 100
          </span>

        </div>

      </div>
    );
  };

  // ============================================================
  // PROGRESS BAR
  // ============================================================

  const ProgressBar = ({
    label,
    value,
  }) => {
    const safeValue =
      Math.max(
        0,
        Math.min(
          100,
          Number(value) || 0
        )
      );

    return (
      <div className="mb-4">

        <div className="flex items-center justify-between mb-1.5">

          <span className="text-sm font-medium">
            {label}
          </span>

          <span className="text-xs font-semibold muted">
            {Math.round(
              safeValue
            )}
            %
          </span>

        </div>

        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">

          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{
              width: `${safeValue}%`,
            }}
          />

        </div>

      </div>
    );
  };

  // ============================================================
  // SECTION STATUS
  // ============================================================

  const getSectionStatus = (
    name
  ) => {
    const sectionData =
      result?.sections?.[
        name
      ] ||
      result?.sections?.[
        name.toLowerCase()
      ];

    if (
      typeof sectionData ===
      "number"
    ) {
      return (
        sectionData >= 70
      );
    }

    if (
      typeof sectionData ===
      "boolean"
    ) {
      return sectionData;
    }

    if (
      sectionData?.score !==
      undefined
    ) {
      return (
        Number(
          sectionData.score
        ) >= 70
      );
    }

    if (
      sectionData?.present !==
      undefined
    ) {
      return Boolean(
        sectionData.present
      );
    }

    return null;
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="w-full min-h-full p-[22px]">

      <div className="w-full min-h-full flex flex-col overflow-y-auto overflow-x-hidden pr-[2px] pb-[24px]">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="mb-[20px]">

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
              className="font-bold text-lg"
            >
              ×
            </button>

          </div>
        )}

        {/* ======================================================
            UPLOAD + INFO
        ====================================================== */}

        <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.65fr] gap-[18px]">

          {/* ==================================================
              UPLOAD
          ================================================== */}

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

              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                📄
              </div>

            </div>

            {!file ? (
              <div
                onDragOver={
                  handleDragOver
                }
                onDragLeave={
                  handleDragLeave
                }
                onDrop={
                  handleDrop
                }
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className={`min-h-[210px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  dragActive
                    ? "border-primary bg-primary/10"
                    : "border-border bg-muted/30 hover:border-primary/50 hover:bg-primary/5"
                }`}
              >

                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl mb-3">
                  📄
                </div>

                <p className="font-semibold text-sm">
                  Upload your resume
                </p>

                <p className="text-xs muted mt-1">
                  Drag & drop or browse your computer
                </p>

                <p className="text-xs muted mt-2">
                  PDF • DOC • DOCX
                </p>

                <button
                  type="button"
                  className="btn btn-primary text-sm mt-4"
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
                  onChange={
                    handleInputChange
                  }
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
                      {formatFileSize(
                        file.size
                      )}
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={
                      clearFile
                    }
                    className="text-lg font-bold muted hover:text-brick"
                  >
                    ×
                  </button>

                </div>

                <div className="flex gap-2 mt-[14px]">

                  <button
                    type="button"
                    onClick={() =>
                      analyzeResume(
                        file
                      )
                    }
                    disabled={
                      loading
                    }
                    className="btn btn-primary flex-1 text-sm"
                  >
                    {loading
                      ? "Analyzing..."
                      : result
                      ? "🔄 Analyze Again"
                      : "✨ Analyze Resume"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    disabled={
                      loading
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
                  onChange={
                    handleInputChange
                  }
                  className="hidden"
                />

              </div>
            )}

          </div>

          {/* ==================================================
              HOW IT WORKS
          ================================================== */}

          <div className="card p-[18px]">

            <h2 className="font-semibold text-lg mb-[14px]">
              How ATS analysis works
            </h2>

            <div className="space-y-[13px]">

              {[
                [
                  "1",
                  "Upload your resume",
                  "We extract the content from your file.",
                ],
                [
                  "2",
                  "Analyze ATS compatibility",
                  "AI checks keywords, structure and content.",
                ],
                [
                  "3",
                  "Improve your resume",
                  "Get recommendations before applying.",
                ],
              ].map(
                (item) => (
                  <div
                    key={
                      item[0]
                    }
                    className="flex gap-3"
                  >

                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm">
                      {
                        item[0]
                      }
                    </div>

                    <div>

                      <p className="text-sm font-semibold">
                        {
                          item[1]
                        }
                      </p>

                      <p className="text-xs muted mt-1">
                        {
                          item[2]
                        }
                      </p>

                    </div>

                  </div>
                )
              )}

            </div>

          </div>

        </div>

        {/* ======================================================
            LOADING
        ====================================================== */}

        {loading && (
          <div className="card mt-[18px] p-[35px] flex flex-col items-center justify-center">

            <div className="w-16 h-16 rounded-full border-4 border-muted border-t-primary animate-spin mb-4" />

            <h3 className="font-semibold text-lg">
              Analyzing your resume...
            </h3>

            <p className="muted text-sm mt-1">
              AI is checking keywords, structure and ATS compatibility.
            </p>

          </div>
        )}

        {/* ======================================================
            RESULTS
        ====================================================== */}

        {result &&
          !loading && (
            <div className="mt-[18px]">

              {/* ==================================================
                  SCORE
              ================================================== */}

              <div className="card p-[20px] mb-[16px]">

                <div className="flex flex-col lg:flex-row gap-[24px] items-center">

                  <ScoreCircle
                    score={
                      result.score
                    }
                  />

                  <div className="flex-1">

                    {(() => {
                      const status =
                        getScoreStatus(
                          result.score
                        );

                      return (
                        <>
                          <div
                            className={`inline-flex items-center px-3 py-1.5 rounded-full border text-xs font-semibold ${status.bg} ${status.border} ${status.className}`}
                          >
                            {result.score >=
                            70
                              ? "✓"
                              : "!"}{" "}
                            {
                              status.title
                            }
                          </div>

                          <h2 className="text-xl font-display font-bold mt-3">
                            Your resume scored{" "}
                            {
                              Math.round(
                                result.score
                              )
                            }
                            /100
                          </h2>

                          <p className="muted text-sm mt-1 max-w-2xl">
                            {
                              status.description
                            }
                          </p>

                          {result.summary && (
                            <p className="text-sm mt-3 leading-relaxed">
                              {
                                result.summary
                              }
                            </p>
                          )}
                        </>
                      );
                    })()}

                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      analyzeResume(
                        file
                      )
                    }
                    className="btn btn-primary shrink-0"
                  >
                    🔄 Re-analyze
                  </button>

                </div>

              </div>

              {/* ==================================================
                  BREAKDOWN
              ================================================== */}

              <div className="card p-[18px] mb-[16px]">

                <h2 className="font-semibold text-lg">
                  Score breakdown
                </h2>

                <p className="text-xs muted mt-1 mb-[16px]">
                  See where your resume performs well and where
                  it needs improvement.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[30px]">

                  <ProgressBar
                    label="Keywords"
                    value={
                      result.keywordScore
                    }
                  />

                  <ProgressBar
                    label="Formatting"
                    value={
                      result.formatting
                    }
                  />

                  <ProgressBar
                    label="Content"
                    value={
                      result.contentScore
                    }
                  />

                  <ProgressBar
                    label="Contact Information"
                    value={
                      result.contactScore
                    }
                  />

                </div>

              </div>

              {/* ==================================================
                  KEYWORDS
              ================================================== */}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-[16px] mb-[16px]">

                <div className="card p-[18px]">

                  <div className="flex justify-between mb-[14px]">

                    <div>

                      <h2 className="font-semibold">
                        🔑 Detected Keywords
                      </h2>

                      <p className="text-xs muted mt-1">
                        Keywords found in your resume.
                      </p>

                    </div>

                    <span className="text-xs font-semibold text-teal">
                      {
                        result.keywords
                          .length
                      }{" "}
                      found
                    </span>

                  </div>

                  {result.keywords
                    .length >
                  0 ? (
                    <div className="flex flex-wrap gap-2">

                      {result.keywords.map(
                        (
                          keyword,
                          index
                        ) => (
                          <span
                            key={
                              index
                            }
                            className="px-3 py-1.5 rounded-full bg-teal/10 border border-teal/20 text-teal text-xs font-medium"
                          >
                            ✓{" "}
                            {
                              keyword
                            }
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

                <div className="card p-[18px]">

                  <div className="flex justify-between mb-[14px]">

                    <div>

                      <h2 className="font-semibold">
                        ⚠️ Missing Keywords
                      </h2>

                      <p className="text-xs muted mt-1">
                        Keywords you may want to add where relevant.
                      </p>

                    </div>

                    <span className="text-xs font-semibold text-brick">
                      {
                        result
                          .missingKeywords
                          .length
                      }{" "}
                      missing
                    </span>

                  </div>

                  {result
                    .missingKeywords
                    .length >
                  0 ? (
                    <div className="flex flex-wrap gap-2">

                      {result.missingKeywords.map(
                        (
                          keyword,
                          index
                        ) => (
                          <span
                            key={
                              index
                            }
                            className="px-3 py-1.5 rounded-full bg-brick/10 border border-brick/20 text-brick text-xs font-medium"
                          >
                            +{" "}
                            {
                              keyword
                            }
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

              {/* ==================================================
                  SECTIONS
              ================================================== */}

              <div className="card p-[18px] mb-[16px]">

                <h2 className="font-semibold text-lg">
                  📋 Resume section checklist
                </h2>

                <p className="text-xs muted mt-1 mb-[16px]">
                  Important sections ATS systems expect.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[10px]">

                  {[
                    [
                      "contact",
                      "Contact Information",
                      "👤",
                    ],
                    [
                      "summary",
                      "Professional Summary",
                      "📝",
                    ],
                    [
                      "skills",
                      "Skills",
                      "🛠️",
                    ],
                    [
                      "experience",
                      "Work Experience",
                      "💼",
                    ],
                    [
                      "education",
                      "Education",
                      "🎓",
                    ],
                    [
                      "projects",
                      "Projects",
                      "🚀",
                    ],
                  ].map(
                    ([
                      key,
                      label,
                      icon,
                    ]) => {
                      const status =
                        getSectionStatus(
                          key
                        );

                      return (
                        <div
                          key={
                            key
                          }
                          className={`rounded-xl border p-[13px] flex items-center gap-3 ${
                            status ===
                            false
                              ? "border-brick/20 bg-brick/5"
                              : status ===
                                true
                              ? "border-teal/20 bg-teal/5"
                              : "border-border bg-muted/20"
                          }`}
                        >

                          <div className="text-lg">
                            {
                              icon
                            }
                          </div>

                          <div className="flex-1">

                            <p className="text-sm font-medium">
                              {
                                label
                              }
                            </p>

                            <p className="text-xs muted mt-0.5">
                              {status ===
                              true
                                ? "Detected"
                                : status ===
                                  false
                                ? "Needs attention"
                                : "Analyzed"}
                            </p>

                          </div>

                          <div>
                            {status ===
                            true
                              ? "✅"
                              : status ===
                                false
                              ? "⚠️"
                              : "✓"}
                          </div>

                        </div>
                      );
                    }
                  )}

                </div>

              </div>

              {/* ==================================================
                  SUGGESTIONS
              ================================================== */}

              <div className="card p-[18px] mb-[16px]">

                <h2 className="font-semibold text-lg">
                  💡 How to improve your resume
                </h2>

                <p className="text-xs muted mt-1 mb-[16px]">
                  Follow these recommendations to increase your
                  ATS compatibility.
                </p>

                {result.suggestions
                  .length > 0 ? (
                  <div className="space-y-[10px]">

                    {result.suggestions.map(
                      (
                        suggestion,
                        index
                      ) => (
                        <div
                          key={
                            index
                          }
                          className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 p-[13px]"
                        >

                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold shrink-0">
                            {
                              index +
                              1
                            }
                          </div>

                          <p className="text-sm leading-relaxed">
                            {typeof suggestion ===
                            "string"
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
                  <p className="muted text-sm">
                    No specific recommendations were returned.
                  </p>
                )}

              </div>

              {/* ==================================================
                  FINAL CTA
              ================================================== */}

              <div className="card p-[20px]">

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                  <div>

                    <h3 className="font-display font-bold text-lg">
                      Ready to improve your resume?
                    </h3>

                    <p className="text-sm muted mt-1">
                      Apply the recommendations and analyze your
                      updated resume again.
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      window.location.href =
                        "/create-resume"
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