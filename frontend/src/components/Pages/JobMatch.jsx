import React, { useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Loader2,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  XCircle,
  AlertCircle,
  RotateCcw,
} from "lucide-react";

import { getToken } from "../../lib/auth";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000";

/* ============================================================
   HELPERS
============================================================ */

function safeArray(value) {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    return value
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function safeText(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function normalizeResult(raw) {
  const data =
    raw?.result ||
    raw?.analysis ||
    raw?.jobMatch ||
    raw?.match ||
    raw ||
    {};

  return {
    score: Number(
      data.score ??
        data.matchScore ??
        data.match_percentage ??
        data.matchPercentage ??
        0
    ),

    verdict:
      data.verdict ||
      data.overallVerdict ||
      data.summary ||
      data.overallAssessment ||
      "",

    matchedSkills: safeArray(
      data.matchedSkills ||
        data.matched_skills ||
        data.skillsMatched ||
        data.matchingSkills
    ),

    missingSkills: safeArray(
      data.missingSkills ||
        data.missing_skills ||
        data.skillsMissing ||
        data.skillGaps
    ),

    requiredSkills: safeArray(
      data.requiredSkills ||
        data.required_skills ||
        data.skillsRequired
    ),

    keywords: safeArray(
      data.missingKeywords ||
        data.missing_keywords ||
        data.atsKeywords ||
        data.keywords
    ),

    tools: safeArray(
      data.tools ||
        data.technologies ||
        data.toolsAndTechnologies ||
        data.technologiesUsed
    ),

    responsibilities: safeArray(
      data.responsibilities ||
        data.jobResponsibilities ||
        data.keyResponsibilities
    ),

    strengths: safeArray(
      data.strengths ||
        data.resumeStrengths ||
        data.matchingStrengths
    ),

    recommendations: safeArray(
      data.recommendations ||
        data.actionPlan ||
        data.improvements ||
        data.nextSteps
    ),

    explanation:
      data.explanation ||
      data.reason ||
      data.overallExplanation ||
      "",

    role:
      data.targetRole ||
      data.role ||
      "",
  };
}

function getResumeData() {
  try {
    const saved = localStorage.getItem("generatedResume");

    if (!saved) return null;

    return JSON.parse(saved);
  } catch (error) {
    console.error("Could not read generated resume:", error);
    return null;
  }
}

function extractResumeText(resume) {
  if (!resume) return "";

  if (typeof resume === "string") {
    return resume;
  }

  const parts = [];

  if (resume.name) {
    parts.push(`Name: ${resume.name}`);
  }

  if (resume.title) {
    parts.push(`Title: ${resume.title}`);
  }

  if (resume.summary) {
    parts.push(`Professional Summary:\n${resume.summary}`);
  }

  if (resume.professionalSummary) {
    parts.push(
      `Professional Summary:\n${resume.professionalSummary}`
    );
  }

  if (resume.skills) {
    parts.push(
      `Skills:\n${safeArray(resume.skills).join(", ")}`
    );
  }

  if (resume.experience) {
    parts.push(
      `Professional Experience:\n${JSON.stringify(
        resume.experience,
        null,
        2
      )}`
    );
  }

  if (resume.professionalExperience) {
    parts.push(
      `Professional Experience:\n${JSON.stringify(
        resume.professionalExperience,
        null,
        2
      )}`
    );
  }

  if (resume.projects) {
    parts.push(
      `Projects:\n${JSON.stringify(
        resume.projects,
        null,
        2
      )}`
    );
  }

  if (resume.education) {
    parts.push(
      `Education:\n${JSON.stringify(
        resume.education,
        null,
        2
      )}`
    );
  }

  if (resume.certifications) {
    parts.push(
      `Certifications:\n${safeArray(
        resume.certifications
      ).join(", ")}`
    );
  }

  return parts.join("\n\n");
}

/* ============================================================
   SMALL UI COMPONENTS
============================================================ */

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary">
            <Icon className="h-4 w-4 text-foreground" />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {title}
            </h2>

            {description && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-5">{children}</div>
    </div>
  );
}

function Tag({ children, variant = "normal" }) {
  const classes =
    variant === "success"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : variant === "danger"
      ? "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400"
      : variant === "ai"
      ? "border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-400"
      : "border-border bg-secondary text-foreground";

  return (
    <span
      className={`
        inline-flex
        items-center
        rounded-lg
        border
        px-2.5
        py-1
        text-xs
        font-medium
        ${classes}
      `}
    >
      {children}
    </span>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-5 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function BulletList({ items, emptyText }) {
  if (!items.length) {
    return <EmptyState text={emptyText} />;
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div
          key={`${item}-${index}`}
          className="flex items-start gap-3 rounded-xl border border-border bg-background/50 px-3 py-2.5"
        >
          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

          <span className="text-sm leading-relaxed text-foreground">
            {safeText(item)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   SCORE
============================================================ */

function ScoreCircle({ score }) {
  const safeScore = Math.max(
    0,
    Math.min(100, Number(score) || 0)
  );

  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const progress =
    circumference - (safeScore / 100) * circumference;

  let label = "Needs work";

  if (safeScore >= 80) {
    label = "Excellent match";
  } else if (safeScore >= 65) {
    label = "Good match";
  } else if (safeScore >= 50) {
    label = "Moderate match";
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative h-36 w-36">
        <svg
          className="h-full w-full -rotate-90"
          viewBox="0 0 120 120"
        >
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-secondary"
          />

          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={progress}
            className="text-violet-500 transition-all duration-700"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tracking-tight text-foreground">
            {safeScore}%
          </span>

          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            match
          </span>
        </div>
      </div>

      <div className="mt-2 text-sm font-semibold text-foreground">
        {label}
      </div>
    </div>
  );
}

/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function JobMatch() {
  const savedResume = useMemo(
    () => getResumeData(),
    []
  );

  const [targetRole, setTargetRole] = useState("");

  const [jobDescription, setJobDescription] =
    useState("");

  const [resumeText, setResumeText] = useState(
    () => extractResumeText(savedResume)
  );

  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  /* ==========================================================
     ANALYZE JOB
  ========================================================== */

  async function analyzeJob() {
    setError("");
    setResult(null);

    if (!targetRole.trim()) {
      setError("Please enter the target job role.");
      return;
    }

    if (!jobDescription.trim()) {
      setError("Please paste the job description.");
      return;
    }

    if (!resumeText.trim()) {
      setError(
        "Please provide your resume content before analyzing the job."
      );
      return;
    }

    setLoading(true);

    try {
      const token = getToken();

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
            targetRole: targetRole.trim(),

            jobDescription:
              jobDescription.trim(),

            resumeData: savedResume || null,

            resumeText: resumeText.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Unable to analyze this job."
        );
      }

      const normalized = normalizeResult(data);

      setResult(normalized);
    } catch (err) {
      console.error("Job Match Error:", err);

      setError(
        err?.message ||
          "Something went wrong while analyzing the job."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ==========================================================
     RESET
  ========================================================== */

  function resetAnalysis() {
    setResult(null);
    setError("");
  }

  /* ==========================================================
     LOAD GENERATED RESUME
  ========================================================== */

  function loadGeneratedResume() {
    const resume = getResumeData();

    if (!resume) {
      setError(
        "No generated resume was found in this browser."
      );
      return;
    }

    const text = extractResumeText(resume);

    if (!text.trim()) {
      setError(
        "The saved resume does not contain readable content."
      );
      return;
    }

    setResumeText(text);
    setError("");
  }

  return (
    <div className="mx-auto w-full max-w-7xl pb-10">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="mb-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10">
                <BriefcaseBusiness className="h-5 w-5 text-violet-500" />
              </div>

              <span className="text-xs font-semibold uppercase tracking-widest text-violet-500">
                AI Career Assistant
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Job Match
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Compare your resume with a job description
              and discover what matches, what is missing,
              and what you should improve before applying.
            </p>
          </div>

          {result && (
            <button
              type="button"
              onClick={resetAnalysis}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-border
                bg-card
                px-4
                py-2.5
                text-sm
                font-medium
                text-foreground
                shadow-sm
                transition
                hover:bg-secondary
              "
            >
              <RotateCcw className="h-4 w-4" />
              New analysis
            </button>
          )}
        </div>
      </div>

      {/* ======================================================
          INPUT AREA
      ====================================================== */}

      {!result && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* --------------------------------------------------
              TARGET ROLE
          -------------------------------------------------- */}

          <SectionCard
            icon={Target}
            title="Target role"
            description="Tell the AI which position you want to target."
          >
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="targetRole"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Job title
                </label>

                <div className="relative">
                  <BriefcaseBusiness className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <input
                    id="targetRole"
                    type="text"
                    value={targetRole}
                    onChange={(e) =>
                      setTargetRole(e.target.value)
                    }
                    placeholder="e.g. Python Developer"
                    className="
                      h-11
                      w-full
                      rounded-xl
                      border
                      border-border
                      bg-background
                      pl-10
                      pr-3
                      text-sm
                      text-foreground
                      outline-none
                      transition
                      placeholder:text-muted-foreground
                      focus:border-violet-500
                      focus:ring-2
                      focus:ring-violet-500/10
                    "
                  />
                </div>
              </div>

              <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
                <div className="flex gap-3">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />

                  <div>
                    <p className="text-sm font-medium text-foreground">
                      AI role analysis
                    </p>

                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Gemini will analyze the role requirements
                      against the skills and experience in
                      your resume.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* --------------------------------------------------
              JOB DESCRIPTION
          -------------------------------------------------- */}

          <SectionCard
            icon={Search}
            title="Job description"
            description="Paste the job posting you want to match against."
          >
            <textarea
              value={jobDescription}
              onChange={(e) =>
                setJobDescription(e.target.value)
              }
              placeholder={`Paste the complete job description here...

Example:
We are looking for a Python Developer with experience in Django, REST APIs, SQL, Git and AWS...`}
              className="
                min-h-[230px]
                w-full
                resize-y
                rounded-xl
                border
                border-border
                bg-background
                p-4
                text-sm
                leading-relaxed
                text-foreground
                outline-none
                transition
                placeholder:text-muted-foreground
                focus:border-violet-500
                focus:ring-2
                focus:ring-violet-500/10
              "
            />
          </SectionCard>

          {/* --------------------------------------------------
              RESUME
          -------------------------------------------------- */}

          <div className="lg:col-span-2">
            <SectionCard
              icon={FileText}
              title="Your resume"
              description="Use your generated resume or paste your resume content."
            >
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {savedResume && (
                  <button
                    type="button"
                    onClick={loadGeneratedResume}
                    className="
                      inline-flex
                      items-center
                      gap-2
                      rounded-xl
                      border
                      border-border
                      bg-secondary
                      px-3
                      py-2
                      text-xs
                      font-medium
                      text-foreground
                      transition
                      hover:bg-secondary/70
                    "
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Load generated resume
                  </button>
                )}

                {resumeText.trim() && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">
                    Resume content loaded
                  </span>
                )}
              </div>

              <textarea
                value={resumeText}
                onChange={(e) =>
                  setResumeText(e.target.value)
                }
                placeholder="Paste your resume content here, or click 'Load generated resume' if you already created a resume with the AI Resume Builder."
                className="
                  min-h-[260px]
                  w-full
                  resize-y
                  rounded-xl
                  border
                  border-border
                  bg-background
                  p-4
                  text-sm
                  leading-relaxed
                  text-foreground
                  outline-none
                  transition
                  placeholder:text-muted-foreground
                  focus:border-violet-500
                  focus:ring-2
                  focus:ring-violet-500/10
                "
              />

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  The AI will identify matches and gaps.
                  It will not automatically claim skills you
                  do not have.
                </p>

                <button
                  type="button"
                  onClick={analyzeJob}
                  disabled={loading}
                  className="
                    inline-flex
                    min-h-11
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-foreground
                    px-5
                    text-sm
                    font-semibold
                    text-background
                    shadow-sm
                    transition
                    hover:opacity-90
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Analyze with AI
                    </>
                  )}
                </button>
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

            <div>
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                Analysis failed
              </p>

              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          LOADING
      ====================================================== */}

      {loading && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10">
            <Sparkles className="h-6 w-6 animate-pulse text-violet-500" />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-foreground">
            Gemini is analyzing the job
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Comparing your experience, skills and resume
            keywords with the target role.
          </p>
        </div>
      )}

      {/* ======================================================
          RESULTS
      ====================================================== */}

      {result && !loading && (
        <div className="space-y-6">
          {/* --------------------------------------------------
              SCORE HEADER
          -------------------------------------------------- */}

          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <ScoreCircle score={result.score} />

              {result.role && (
                <div className="mt-5 text-center">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Target role
                  </p>

                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {result.role}
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
                  <TrendingUp className="h-5 w-5 text-violet-500" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Match overview
                  </h2>

                  <p className="text-xs text-muted-foreground">
                    AI assessment of your resume against the role
                  </p>
                </div>
              </div>

              <div className="mt-5">
                {result.verdict ? (
                  <p className="text-sm leading-7 text-foreground">
                    {result.verdict}
                  </p>
                ) : result.explanation ? (
                  <p className="text-sm leading-7 text-foreground">
                    {result.explanation}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Your resume has been analyzed against the
                    supplied job description.
                  </p>
                )}
              </div>

              {result.strengths.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Your strengths
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {result.strengths.map(
                      (item, index) => (
                        <Tag
                          key={`${item}-${index}`}
                          variant="success"
                        >
                          {item}
                        </Tag>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* --------------------------------------------------
              SKILLS
          -------------------------------------------------- */}

          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard
              icon={CheckCircle2}
              title="Matched skills"
              description="Skills found in both the role and your resume."
            >
              <div className="flex flex-wrap gap-2">
                {result.matchedSkills.length > 0 ? (
                  result.matchedSkills.map(
                    (skill, index) => (
                      <Tag
                        key={`${skill}-${index}`}
                        variant="success"
                      >
                        {skill}
                      </Tag>
                    )
                  )
                ) : (
                  <EmptyState text="No matching skills were identified." />
                )}
              </div>
            </SectionCard>

            <SectionCard
              icon={XCircle}
              title="Missing skills"
              description="Important requirements not clearly demonstrated by your resume."
            >
              <div className="flex flex-wrap gap-2">
                {result.missingSkills.length > 0 ? (
                  result.missingSkills.map(
                    (skill, index) => (
                      <Tag
                        key={`${skill}-${index}`}
                        variant="danger"
                      >
                        {skill}
                      </Tag>
                    )
                  )
                ) : (
                  <EmptyState text="No major skill gaps were identified." />
                )}
              </div>
            </SectionCard>
          </div>

          {/* --------------------------------------------------
              REQUIRED SKILLS + TOOLS
          -------------------------------------------------- */}

          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard
              icon={ClipboardCheck}
              title="Required skills"
              description="Skills and capabilities emphasized by the job description."
            >
              <div className="flex flex-wrap gap-2">
                {result.requiredSkills.length > 0 ? (
                  result.requiredSkills.map(
                    (skill, index) => (
                      <Tag key={`${skill}-${index}`}>
                        {skill}
                      </Tag>
                    )
                  )
                ) : (
                  <EmptyState text="No specific skill list was returned." />
                )}
              </div>
            </SectionCard>

            <SectionCard
              icon={BriefcaseBusiness}
              title="Tools & technologies"
              description="Technology terms identified in the job description."
            >
              <div className="flex flex-wrap gap-2">
                {result.tools.length > 0 ? (
                  result.tools.map(
                    (tool, index) => (
                      <Tag
                        key={`${tool}-${index}`}
                        variant="ai"
                      >
                        {tool}
                      </Tag>
                    )
                  )
                ) : (
                  <EmptyState text="No tools or technologies were identified." />
                )}
              </div>
            </SectionCard>
          </div>

          {/* --------------------------------------------------
              ATS KEYWORDS
          -------------------------------------------------- */}

          <SectionCard
            icon={Search}
            title="Missing ATS keywords"
            description="Important terms from the job description that your resume may not currently contain."
          >
            <div className="flex flex-wrap gap-2">
              {result.keywords.length > 0 ? (
                result.keywords.map(
                  (keyword, index) => (
                    <Tag
                      key={`${keyword}-${index}`}
                      variant="danger"
                    >
                      {keyword}
                    </Tag>
                  )
                )
              ) : (
                <EmptyState text="No significant missing ATS keywords were identified." />
              )}
            </div>
          </SectionCard>

          {/* --------------------------------------------------
              RESPONSIBILITIES
          -------------------------------------------------- */}

          {result.responsibilities.length > 0 && (
            <SectionCard
              icon={FileText}
              title="Role responsibilities"
              description="Key responsibilities extracted from the job description."
            >
              <BulletList
                items={result.responsibilities}
                emptyText="No responsibilities were identified."
              />
            </SectionCard>
          )}

          {/* --------------------------------------------------
              ACTION PLAN
          -------------------------------------------------- */}

          <SectionCard
            icon={Sparkles}
            title="AI action plan"
            description="Practical improvements to increase your fit for this role."
          >
            <BulletList
              items={result.recommendations}
              emptyText="No additional recommendations were returned."
            />

            <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />

                <div>
                  <p className="text-xs font-semibold text-foreground">
                    Important
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Only add a missing skill, technology or
                    keyword to your resume if you genuinely
                    have that knowledge or experience. Do not
                    claim skills solely to increase an ATS
                    score.
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* --------------------------------------------------
              FOOTER
          -------------------------------------------------- */}

          <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-violet-500" />
            Analysis generated with AI
          </div>
        </div>
      )}
    </div>
  );
}