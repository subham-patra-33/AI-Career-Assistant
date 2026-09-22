import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  FileText,
  Loader2,
  RotateCcw,
  Sparkles,
  Target,
  Upload,
  X,
} from "lucide-react";
import { getToken, isAuthed } from "../../lib/auth";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt"];

const EMPTY_RESULT = {
  readinessScore: 0,
  summary: "",
  matchedSkills: [],
  missingSkills: [],
  levelComparison: [],
  learningRoadmap: [],
};

function safeString(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : fallback;
}

function normalizeResult(raw) {
  const result = raw?.analysis || raw?.result || raw?.data || raw || {};

  return {
    readinessScore: safeNumber(
      result.readinessScore ?? result.score,
      0
    ),
    summary: safeString(result.summary),
    matchedSkills: safeArray(result.matchedSkills).map((item) => ({
      skill: safeString(item?.skill || item?.name, "Skill"),
      currentLevel: safeString(item?.currentLevel, "Known"),
      targetLevel: safeString(item?.targetLevel, "Required"),
      evidence: safeString(item?.evidence),
    })),
    missingSkills: safeArray(result.missingSkills).map((item) => ({
      skill: safeString(item?.skill || item?.name, "Skill"),
      currentLevel: safeString(item?.currentLevel, "Beginner"),
      targetLevel: safeString(item?.targetLevel, "Working proficiency"),
      priority: safeString(item?.priority, "Medium"),
      why: safeString(item?.why || item?.reason),
      action: safeString(item?.action || item?.nextStep),
    })),
    levelComparison: safeArray(result.levelComparison).map((item) => ({
      skill: safeString(item?.skill || item?.name, "Skill"),
      currentLevel: safeString(item?.currentLevel, "Unknown"),
      targetLevel: safeString(item?.targetLevel, "Required"),
      gap: safeString(item?.gap),
    })),
    learningRoadmap: safeArray(result.learningRoadmap || result.roadmap).map(
      (item, index) => ({
        phase: safeString(item?.phase, `Phase ${index + 1}`),
        title: safeString(item?.title || item?.name, "Learning phase"),
        duration: safeString(item?.duration, "1–2 weeks"),
        skills: safeArray(item?.skills).map((x) => String(x)),
        actions: safeArray(item?.actions || item?.steps).map((x) => String(x)),
      })
    ),
  };
}

function getScoreLabel(score) {
  if (score >= 80) return "Strong match";
  if (score >= 60) return "Good foundation";
  if (score >= 40) return "Needs development";
  return "Significant gaps";
}

function priorityClasses(priority) {
  const value = String(priority).toLowerCase();

  if (value === "high") {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300";
  }

  if (value === "low") {
    return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-300";
  }

  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300";
}

export default function SkillGapAnalysis() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef(null);

  const [targetRole, setTargetRole] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("Student / Fresher");
  const [resumeText, setResumeText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysis, setAnalysis] = useState(EMPTY_RESULT);
  const [analysisId, setAnalysisId] = useState(null);
  const [resumeId, setResumeId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const currentResumeId =
    searchParams.get("resumeId") || searchParams.get("id") || "";

  const characterCount = resumeText.length;
  const canAnalyze =
    targetRole.trim().length >= 2 &&
    (resumeText.trim().length >= 50 || !!selectedFile) &&
    !loading;

  const hasAnalysis =
    analysis.summary ||
    analysis.matchedSkills.length ||
    analysis.missingSkills.length ||
    analysis.learningRoadmap.length;

  useEffect(() => {
    if (!isAuthed()) return;

    const controller = new AbortController();

    async function loadSavedAnalysis() {
      if (!currentResumeId) return;

      setLoadingSaved(true);
      setError("");

      try {
        const response = await fetch(
          `${API_URL}/api/resumes/${encodeURIComponent(currentResumeId)}`,
          {
            headers: {
              Authorization: `Bearer ${getToken()}`,
            },
            signal: controller.signal,
          }
        );

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            payload?.message || "Unable to load the saved resume."
          );
        }

        const savedResume = payload?.resume || payload;
        const data = savedResume?.data || savedResume || {};
        const savedAnalysis = data?.skillGapAnalysis;

        setResumeId(savedResume?._id || currentResumeId);
        setTargetRole(
          safeString(
            savedAnalysis?.targetRole ||
              data?.targetRole ||
              savedResume?.title?.replace(/'s .* Resume$/i, "")
          )
        );

        if (savedAnalysis) {
          setAnalysis(normalizeResult(savedAnalysis));
          setAnalysisId(savedAnalysis.analysisId || null);
        }
      } catch (err) {
        if (err?.name !== "AbortError") {
          console.warn("Skill-gap saved analysis load failed:", err);
        }
      } finally {
        if (!controller.signal.aborted) setLoadingSaved(false);
      }
    }

    loadSavedAnalysis();

    return () => controller.abort();
  }, [currentResumeId]);

  function clearFile() {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setSuccess("");

    if (file.size > MAX_FILE_SIZE) {
      clearFile();
      setError("File is too large. Please upload a file up to 10 MB.");
      return;
    }

    const lowerName = file.name.toLowerCase();
    const valid = ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));

    if (!valid) {
      clearFile();
      setError("Unsupported file type. Please upload PDF, DOC, DOCX, or TXT.");
      return;
    }

    setSelectedFile(file);
    setResumeText("");
  }

  async function analyzeSkillGap() {
    if (!isAuthed()) {
      setError("Please log in before using Skill Gap Analysis.");
      return;
    }

    if (!targetRole.trim()) {
      setError("Please enter your target role.");
      return;
    }

    if (!selectedFile && resumeText.trim().length < 50) {
      setError("Please upload a resume or paste at least 50 characters of resume text.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setAnalysis(EMPTY_RESULT);

    try {
      const formData = new FormData();
      formData.append("targetRole", targetRole.trim());
      formData.append("experienceLevel", experienceLevel);
      formData.append("resumeText", resumeText.trim());

      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      if (resumeId) {
        formData.append("resumeId", resumeId);
      }

      const response = await fetch(`${API_URL}/api/ai/skill-gap`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        body: formData,
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          payload?.message ||
          payload?.error ||
          "Unable to analyze your skill gap right now.";
        throw new Error(message);
      }

      const normalized = normalizeResult(payload);
      setAnalysis(normalized);
      setAnalysisId(payload?.analysisId || normalized?.analysisId || null);

      if (payload?.resumeId) setResumeId(payload.resumeId);

      setSuccess(
        "Skill gap analysis completed and saved to your account."
      );
    } catch (err) {
      console.error("Skill Gap Analysis Error:", err);
      setError(
        err?.name === "AbortError"
          ? "The analysis timed out. Please try again."
          : err?.message || "Unable to analyze your skill gap right now."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setTargetRole("");
    setExperienceLevel("Student / Fresher");
    setResumeText("");
    clearFile();
    setAnalysis(EMPTY_RESULT);
    setAnalysisId(null);
    setError("");
    setSuccess("");
  }

  const scoreLabel = useMemo(
    () => getScoreLabel(analysis.readinessScore),
    [analysis.readinessScore]
  );

  return (
    <div className="min-h-screen w-full bg-background px-5 py-5 text-foreground sm:px-6 sm:py-6 lg:px-7 lg:py-7">
      <div className="mx-auto w-full max-w-[1500px]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition hover:bg-muted"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <section className="mb-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                AI Skill Analysis
              </div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Skill Gap Analysis
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Compare your current capabilities with the skills required for your target career and discover exactly where you need to improve.
              </p>
            </div>

            <div className="hidden h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:flex">
              <Target className="h-10 w-10" />
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              className="ml-auto shrink-0 rounded-md p-1 hover:bg-black/5"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,1fr)]">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold">Analyze your current skill profile</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your career goal and provide your resume. AI will compare both.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Target role
                </span>
                <input
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Full Stack Developer"
                  maxLength={120}
                  className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Experience level
                </span>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                >
                  <option>Student / Fresher</option>
                  <option>Entry Level</option>
                  <option>1–3 Years</option>
                  <option>3–5 Years</option>
                  <option>5+ Years</option>
                </select>
              </label>
            </div>

            <div className="mt-5">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Resume
              </span>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="flex min-h-24 w-full items-center gap-4 rounded-2xl border border-dashed border-border bg-background px-5 text-left transition hover:border-primary/50 hover:bg-primary/[0.02] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Upload className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {selectedFile ? selectedFile.name : "Upload resume"}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    PDF, DOC, DOCX or TXT · Max 10 MB
                  </span>
                </span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={handleFileChange}
              />

              {selectedFile && (
                <div className="mt-3 flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate">{selectedFile.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={clearFile}
                    className="ml-3 rounded-lg p-1.5 text-muted-foreground hover:bg-background hover:text-foreground"
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              Or paste resume text
              <span className="h-px flex-1 bg-border" />
            </div>

            <textarea
              value={resumeText}
              onChange={(e) => {
                setResumeText(e.target.value);
                if (e.target.value) clearFile();
              }}
              disabled={!!selectedFile || loading}
              placeholder="Paste your complete resume here..."
              maxLength={50000}
              className="min-h-44 w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-muted/30"
            />
            <div className="mt-2 text-xs text-muted-foreground">
              {characterCount.toLocaleString()} / 50,000 characters
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={analyzeSkillGap}
                disabled={!canAnalyze}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {loading ? "Analyzing..." : "Analyze Skill Gap"}
                {!loading && <ChevronRight className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={resetForm}
                disabled={loading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Target className="h-5 w-5 text-primary" />
              What this analysis gives you
            </h2>

            <div className="mt-5 space-y-2.5">
              {[
                "Readiness score",
                "Matched skills",
                "Missing skills",
                "Priority of every gap",
                "Current vs target level",
                "Personalized learning roadmap",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-xl border border-border bg-background px-3.5 py-3 text-sm"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl bg-primary/5 p-4 text-sm leading-6 text-muted-foreground">
              <Sparkles className="mb-1 inline h-4 w-4 text-primary" />{" "}
              The analysis is based on the resume information you provide and the target role you select.
            </div>
          </section>
        </div>

        {loadingSaved && (
          <div className="mt-5 rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground shadow-sm">
            <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-primary" />
            Loading your saved analysis...
          </div>
        )}

        {hasAnalysis && !loading && (
          <section className="mt-5 space-y-5">
            <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
              <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Readiness score
                </div>
                <div className="mx-auto mt-5 flex h-40 w-40 items-center justify-center rounded-full border-[14px] border-primary/15">
                  <div>
                    <div className="text-4xl font-bold text-primary">
                      {Math.round(analysis.readinessScore)}%
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {scoreLabel}
                    </div>
                  </div>
                </div>
                {analysis.summary && (
                  <p className="mt-5 text-sm leading-6 text-muted-foreground">
                    {analysis.summary}
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Your skill breakdown</h2>
                    <p className="text-sm text-muted-foreground">
                      Target: {targetRole || "Selected career role"}
                    </p>
                  </div>
                  {analysisId && (
                    <span className="text-xs text-muted-foreground">
                      Analysis saved
                    </span>
                  )}
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/10">
                    <div className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="h-5 w-5" />
                      Matched skills
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {analysis.matchedSkills.length ? (
                        analysis.matchedSkills.map((item, index) => (
                          <span
                            key={`${item.skill}-${index}`}
                            className="rounded-full border border-emerald-200 bg-background px-3 py-1.5 text-xs font-medium dark:border-emerald-900/40"
                            title={item.evidence}
                          >
                            {item.skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          No matched skills were identified yet.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 dark:border-amber-900/40 dark:bg-amber-950/10">
                    <div className="flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-300">
                      <AlertCircle className="h-5 w-5" />
                      Missing skills
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {analysis.missingSkills.length ? (
                        analysis.missingSkills.map((item, index) => (
                          <span
                            key={`${item.skill}-${index}`}
                            className="rounded-full border border-amber-200 bg-background px-3 py-1.5 text-xs font-medium dark:border-amber-900/40"
                          >
                            {item.skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          No major gaps were identified.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {analysis.levelComparison.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h2 className="text-xl font-semibold">Current vs target level</h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[650px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="px-3 py-3">Skill</th>
                        <th className="px-3 py-3">Current</th>
                        <th className="px-3 py-3">Target</th>
                        <th className="px-3 py-3">Gap</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.levelComparison.map((item, index) => (
                        <tr key={`${item.skill}-${index}`} className="border-b border-border last:border-0">
                          <td className="px-3 py-3 font-medium">{item.skill}</td>
                          <td className="px-3 py-3 text-muted-foreground">{item.currentLevel}</td>
                          <td className="px-3 py-3 text-muted-foreground">{item.targetLevel}</td>
                          <td className="px-3 py-3">{item.gap || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {analysis.missingSkills.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h2 className="text-xl font-semibold">Prioritized skill gaps</h2>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {analysis.missingSkills.map((item, index) => (
                    <article key={`${item.skill}-${index}`} className="rounded-2xl border border-border bg-background p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold">{item.skill}</h3>
                        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${priorityClasses(item.priority)}`}>
                          {item.priority}
                        </span>
                      </div>
                      {item.why && (
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                          {item.why}
                        </p>
                      )}
                      {item.action && (
                        <div className="mt-4 rounded-xl bg-muted/50 p-3 text-sm leading-6">
                          <span className="font-semibold">Next step:</span> {item.action}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            )}

            {analysis.learningRoadmap.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Personalized learning roadmap</h2>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {analysis.learningRoadmap.map((item, index) => (
                    <article key={`${item.phase}-${index}`} className="rounded-2xl border border-border bg-background p-5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary">
                          {item.phase}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.duration}
                        </span>
                      </div>
                      <h3 className="mt-2 font-semibold">{item.title}</h3>

                      {item.skills.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {item.skills.map((skill, skillIndex) => (
                            <span key={`${skill}-${skillIndex}`} className="rounded-full bg-primary/5 px-2.5 py-1 text-xs text-primary">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      {item.actions.length > 0 && (
                        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                          {item.actions.map((action, actionIndex) => (
                            <li key={`${action}-${actionIndex}`} className="flex gap-2 leading-6">
                              <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
