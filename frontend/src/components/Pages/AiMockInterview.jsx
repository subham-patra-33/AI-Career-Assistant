import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Bot,
  Brain,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Loader2,
  Mic,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
  Zap,
} from "lucide-react";
import BackButton from "../BackButton";
import { getToken } from "../../lib/auth";

/*
 * IMPORTANT:
 * Your backend server.js uses port 4000 by default.
 *
 * If you have VITE_API_URL in frontend/.env, that value will be used.
 */
const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000";

const getAuthHeaders = (includeJson = false) => {
  const token = getToken();

  const headers = {};

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const readResponse = async (response) => {
  const contentType =
    response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  return {
    success: false,
    message:
      text ||
      `Server returned HTTP ${response.status}`,
  };
};

const getErrorMessage = (error, fallback) => {
  if (!error) return fallback;

  if (
    error instanceof TypeError &&
    error.message === "Failed to fetch"
  ) {
    return (
      "Cannot connect to the backend server. " +
      "Make sure the backend is running on http://localhost:4000."
    );
  }

  return error.message || fallback;
};

export default function AiMockInterview() {
  const [role, setRole] = useState("Full Stack Developer");
  const [type, setType] = useState("Technical");
  const [difficulty, setDifficulty] = useState("Medium");
  const [questionCount, setQuestionCount] = useState(5);

  // SECTION 1: Dual Interview Modes ("ai" | "question-bank")
  const location = useLocation();
  const [interviewMode, setInterviewMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("mode") === "question-bank" || params.get("mode") === "bank"
      ? "question-bank"
      : "ai";
  });
  const [useAiEvaluation, setUseAiEvaluation] = useState(false);
  const modeRef = useRef(interviewMode);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("mode") === "question-bank" || params.get("mode") === "bank") {
      setInterviewMode("question-bank");
      modeRef.current = "question-bank";
    } else if (params.get("mode") === "ai") {
      setInterviewMode("ai");
      modeRef.current = "ai";
    }
  }, [location.search]);

  const [resume, setResume] = useState("");
  const [resumeFile, setResumeFile] = useState(null);

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState("");

  const [evaluation, setEvaluation] = useState(null);
  const [scores, setScores] = useState([]);
  const [sessionAnswers, setSessionAnswers] = useState([]);

  const [phase, setPhase] = useState("setup");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ============================================================
  // RESUME UPLOAD
  // ============================================================

  const uploadResume = async (file) => {
    if (!file) return;

    setError("");

    // Maximum 10 MB
    if (file.size > 10 * 1024 * 1024) {
      setResumeFile(null);
      setResume("");

      setError(
        "The resume file must be smaller than 10 MB."
      );

      return;
    }

    const fileName =
      file.name?.toLowerCase() || "";

    const allowed =
      fileName.endsWith(".pdf") ||
      fileName.endsWith(".docx") ||
      fileName.endsWith(".txt");

    if (!allowed) {
      setResumeFile(null);
      setResume("");

      setError(
        "Please upload a PDF, DOCX, or TXT resume."
      );

      return;
    }

    const token = getToken();

    if (!token) {
      setError(
        "Your session has expired. Please log in again."
      );

      return;
    }

    setResumeFile(file);
    setLoading(true);

    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch(
        `${API_URL}/api/ai/parse-resume-file`,
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${token}`,
          },

          body: formData,
        }
      );

      const data = await readResponse(response);

      if (response.status === 401) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      if (!response.ok || data?.success === false) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Unable to read the uploaded resume."
        );
      }

      const resumeText =
        data?.text ||
        data?.resumeText ||
        data?.resume?.text ||
        "";

      let finalResumeText = resumeText;

      if (
        !finalResumeText &&
        data?.resume &&
        typeof data.resume === "object"
      ) {
        finalResumeText = JSON.stringify(
          data.resume,
          null,
          2
        );
      }

      if (!finalResumeText) {
        throw new Error(
          "The resume was uploaded, but no readable resume content was returned."
        );
      }

      setResume(finalResumeText);

      setError("");
    } catch (err) {
      console.error(
        "Resume upload error:",
        err
      );

      setResumeFile(null);
      setResume("");

      setError(
        getErrorMessage(
          err,
          "Resume upload failed."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // START INTERVIEW
  // ============================================================

  const startInterview = async () => {
    if (loading) return;

    if (!role.trim()) {
      setError(
        "Enter the role you want to practice for."
      );

      return;
    }

    const token = getToken();

    if (!token) {
      setError(
        "Your session has expired. Please log in again."
      );

      return;
    }

    const activeMode = modeRef.current || interviewMode || "ai";

    setLoading(true);
    setError("");

    try {
      let response;

      if (activeMode === "question-bank") {
        // Section 1 & 4: QUESTION BANK MODE
        // Does NOT call Gemini or Grok
        response = await fetch(
          `${API_URL}/api/interview/start`,
          {
            method: "POST",

            headers: getAuthHeaders(true),

            body: JSON.stringify({
              mode: "question-bank",
              role: role.trim(),
              interviewType: type,
              difficulty,
              questionCount: Number(questionCount),
              excludeQuestionIds: [],
            }),
          }
        );

        if (response.status === 404) {
          response = await fetch(
            `${API_URL}/api/ai/mock-interview`,
            {
              method: "POST",

              headers: getAuthHeaders(true),

              body: JSON.stringify({
                mode: "question-bank",
                role: role.trim(),
                interviewType: type,
                difficulty,
                questionCount: Number(questionCount),
              }),
            }
          );
        }
      } else {
        // Section 1: AI INTERVIEW MODE
        // Dynamic AI-generated questions
        response = await fetch(
          `${API_URL}/api/ai/mock-interview`,
          {
            method: "POST",

            headers: getAuthHeaders(true),

            body: JSON.stringify({
              mode: "ai",
              role: role.trim(),
              interviewType: type,
              difficulty,
              questionCount: Number(questionCount),
              resume: resume || "",
            }),
          }
        );

        if (response.status === 404) {
          response = await fetch(
            `${API_URL}/api/ai/mock-interview/start`,
            {
              method: "POST",

              headers: getAuthHeaders(true),

              body: JSON.stringify({
                mode: "ai",
                role: role.trim(),
                interviewType: type,
                difficulty,
                questionCount: Number(questionCount),
                resume: resume || "",
              }),
            }
          );
        }
      }

      const data = await readResponse(response);

      if (response.status === 401) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      if (!response.ok || data?.success === false) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Unable to generate the interview."
        );
      }

      /*
       * Support all expected backend response shapes.
       */
      let generated =
        data?.questions ||
        data?.result ||
        data?.interview?.questions ||
        data?.interview ||
        [];

      if (
        generated &&
        !Array.isArray(generated) &&
        Array.isArray(generated.questions)
      ) {
        generated = generated.questions;
      }

      if (!Array.isArray(generated)) {
        generated = [];
      }

      /*
       * Normalize question objects.
       */
      const normalized = generated
        .map((item) => {
          if (typeof item === "string") {
            return {
              question: item,
              category: "General",
              difficulty,
              interviewType: type,
            };
          }

          return {
            ...item,
            question:
              item?.question ||
              item?.text ||
              item?.prompt ||
              "",
          };
        })
        .filter(
          (item) =>
            item.question &&
            item.question.trim()
        );

      if (!normalized.length) {
        throw new Error(
          "The interview did not return any questions for this role."
        );
      }

      setQuestions(normalized);
      setCurrent(0);
      setScores([]);
      setSessionAnswers([]);
      setEvaluation(null);
      setAnswer("");
      setPhase("questions");
      setError("");
    } catch (err) {
      console.error(
        "Start interview error:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Interview generation failed."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // EVALUATE ANSWER
  // ============================================================

  const evaluateAnswer = async () => {
    if (loading) return;

    if (!answer.trim()) {
      setError(
        "Write your answer before submitting."
      );

      return;
    }

    const token = getToken();

    if (!token) {
      setError(
        "Your session has expired. Please log in again."
      );

      return;
    }

    const currentQuestion =
      questions[current];

    const question =
      currentQuestion?.question ||
      currentQuestion?.text ||
      currentQuestion?.prompt ||
      currentQuestion;

    if (!question) {
      setError(
        "The current interview question could not be found."
      );

      return;
    }

    setLoading(true);
    setError("");

    try {
      const activeMode = modeRef.current || interviewMode || "ai";
      let response;

      if (activeMode === "question-bank") {
        // Section 6 & 7: Question Bank Evaluation
        response = await fetch(
          `${API_URL}/api/interview/evaluate`,
          {
            method: "POST",

            headers: getAuthHeaders(true),

            body: JSON.stringify({
              mode: "question-bank",
              questionId: currentQuestion?._id || currentQuestion?.id || null,
              question,
              answer: answer.trim(),
              role,
              difficulty,
              interviewType: type,
              useAI: Boolean(useAiEvaluation),
              resume: resume || "",
            }),
          }
        );

        if (response.status === 404) {
          response = await fetch(
            `${API_URL}/api/ai/evaluate-interview`,
            {
              method: "POST",

              headers: getAuthHeaders(true),

              body: JSON.stringify({
                mode: "question-bank",
                questionId: currentQuestion?._id || currentQuestion?.id || null,
                question,
                answer: answer.trim(),
                role,
                difficulty,
                interviewType: type,
                useAI: Boolean(useAiEvaluation),
              }),
            }
          );
        }
      } else {
        // AI Interview Evaluation
        response = await fetch(
          `${API_URL}/api/ai/evaluate-interview`,
          {
            method: "POST",

            headers: getAuthHeaders(true),

            body: JSON.stringify({
              mode: "ai",
              role,
              interviewType: type,
              difficulty,
              question,
              answer: answer.trim(),
              resume: resume || "",
            }),
          }
        );

        if (response.status === 404) {
          response = await fetch(
            `${API_URL}/api/ai/mock-interview/evaluate`,
            {
              method: "POST",

              headers: getAuthHeaders(true),

              body: JSON.stringify({
                mode: "ai",
                role,
                interviewType: type,
                difficulty,
                question,
                answer: answer.trim(),
                resume: resume || "",
              }),
            }
          );
        }
      }

      const data = await readResponse(response);

      if (response.status === 401) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      if (!response.ok || data?.success === false) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Unable to evaluate your answer."
        );
      }

      const result =
        data?.data ||
        data?.result ||
        data?.evaluation ||
        data;

      setEvaluation(result);

      const rawScore =
        result?.scoreOutOf100 ??
        result?.overallScore ??
        (typeof result?.score === "number" && result.score <= 10
          ? Math.round(result.score * 10)
          : result?.score) ??
        result?.rating ??
        0;

      const score = Math.max(
        0,
        Math.min(100, Number(rawScore) || 0)
      );

      setScores((previous) => [
        ...previous,
        score,
      ]);

      setSessionAnswers((previous) => [
        ...previous,
        {
          questionId: currentQuestion?._id || currentQuestion?.id || null,
          question,
          category: currentQuestion?.category || "General",
          difficulty: currentQuestion?.difficulty || difficulty,
          answer: answer.trim(),
          score,
          feedback: result?.summary || result?.feedback || "",
          strengths: result?.strengths || [],
          improvements: result?.improvements || [],
          evaluationProvider: result?.evaluationProvider || (activeMode === "ai" ? "gemini" : "local"),
        },
      ]);

      setError("");
    } catch (err) {
      console.error(
        "Answer evaluation error:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Evaluation failed."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // NEXT QUESTION & RESULT SAVING
  // ============================================================

  const nextQuestion = () => {
    if (current < questions.length - 1) {
      setCurrent((value) => value + 1);
      setAnswer("");
      setEvaluation(null);
      setError("");

      return;
    }

    const average = scores.length
      ? Math.round(
          scores.reduce(
            (total, score) =>
              total + Number(score || 0),
            0
          ) / scores.length
        )
      : 0;

    localStorage.setItem(
      "lastInterviewScore",
      String(average)
    );

    try {
      window.dispatchEvent(new Event("storage"));
    } catch {}

    // Section 8 & 9: Save uniform result to database and update Career Progress
    const activeMode = modeRef.current || interviewMode || "ai";
    fetch(`${API_URL}/api/interview/save`, {
      method: "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify({
        mode: activeMode,
        role: role.trim(),
        interviewType: type,
        difficulty,
        questionCount: questions.length,
        score: average,
        questions: sessionAnswers,
      }),
    }).catch(() => {
      fetch(`${API_URL}/api/ai/save-interview`, {
        method: "POST",
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          mode: activeMode,
          role: role.trim(),
          interviewType: type,
          difficulty,
          questionCount: questions.length,
          score: average,
          questions: sessionAnswers,
        }),
      }).catch(() => {});
    });

    setPhase("finished");
  };

  // ============================================================
  // RESET
  // ============================================================

  const resetInterview = () => {
    setPhase("setup");
    setQuestions([]);
    setCurrent(0);
    setScores([]);
    setSessionAnswers([]);
    setEvaluation(null);
    setAnswer("");
    setError("");
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <main className="min-h-screen w-full bg-background px-5 py-5 text-foreground sm:px-6 sm:py-6 lg:px-7 lg:py-7">
      <div className="w-full">
        <BackButton />

        {/* ======================================================
            SETUP
        ====================================================== */}

        {phase === "setup" && (
          <>
            <section className="card mt-5">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="ai-badge mb-3 inline-flex items-center gap-2">
                    <Brain size={14} />
                    MOCK INTERVIEW COACH
                  </div>

                  <h1 className="text-3xl font-black sm:text-4xl">
                    Mock Interview
                  </h1>

                  <p className="muted mt-3 max-w-4xl leading-7">
                    Practice realistic interview questions, receive actionable feedback,
                    strengthen your communication, and boost your hiring confidence.
                  </p>
                </div>

                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border border-border bg-muted/30 text-primary ai-glow">
                  <Mic size={42} />
                </div>
              </div>
            </section>

            <section className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="card">
                <h2 className="text-xl font-bold">
                  Configure your interview
                </h2>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="label">
                      Job Role
                    </label>

                    <input
                      className="input"
                      list="role-suggestions"
                      value={role}
                      onChange={(e) =>
                        setRole(e.target.value)
                      }
                      placeholder="Full Stack Developer"
                    />
                    <datalist id="role-suggestions">
                      <option value="Full Stack Developer" />
                      <option value="Frontend Developer" />
                      <option value="Backend Developer" />
                      <option value="Java Developer" />
                      <option value="Python Developer" />
                      <option value="Software Engineer" />
                      <option value="UI/UX Designer" />
                    </datalist>
                  </div>

                  <div>
                    <label className="label">
                      Interview type
                    </label>

                    <select
                      className="input"
                      value={type}
                      onChange={(e) =>
                        setType(e.target.value)
                      }
                    >
                      <option value="Technical">
                        Technical
                      </option>
                      <option value="Behavioral">
                        Behavioral
                      </option>
                      <option value="Mixed">
                        Mixed (Technical + Behavioral)
                      </option>
                      <option value="HR">
                        HR
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="label">
                      Difficulty
                    </label>

                    <select
                      className="input"
                      value={difficulty}
                      onChange={(e) =>
                        setDifficulty(
                          e.target.value
                        )
                      }
                    >
                      <option value="Easy">
                        Easy (Beginner)
                      </option>
                      <option value="Medium">
                        Medium (Intermediate)
                      </option>
                      <option value="Hard">
                        Hard (Advanced)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="label">
                      Question count
                    </label>

                    <select
                      className="input"
                      value={questionCount}
                      onChange={(e) =>
                        setQuestionCount(
                          Number(e.target.value)
                        )
                      }
                    >
                      <option value={5}>
                        5 Questions
                      </option>
                      <option value={10}>
                        10 Questions
                      </option>
                      <option value={15}>
                        15 Questions
                      </option>
                    </select>
                  </div>
                </div>

                {/* ==================================================
                    SECTION 1 & 12: TWO EXPLICIT INTERVIEW MODES
                ================================================== */}
                <div className="mt-6">
                  <label className="label mb-2 block font-bold text-foreground">
                    Choose Interview Mode
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* 1. 🤖 AI INTERVIEW MODE */}
                    <div
                      onClick={() => {
                        setInterviewMode("ai");
                        modeRef.current = "ai";
                      }}
                      className={`relative flex flex-col justify-between cursor-pointer rounded-2xl border-2 p-5 transition-all ${
                        interviewMode === "ai"
                          ? "border-primary bg-primary/5 shadow-md shadow-primary/10 ring-1 ring-primary/30"
                          : "border-border bg-card hover:border-border/80 hover:bg-muted/20"
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Bot size={24} />
                          </div>
                          {interviewMode === "ai" && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              <CheckCircle2 size={15} />
                            </span>
                          )}
                        </div>

                        <h3 className="mt-3.5 text-base font-bold">
                          🤖 Use AI Interview
                        </h3>

                        <p className="muted mt-1 text-xs leading-relaxed">
                          Dynamic AI-generated interview questions personalized for your role and resume. AI feedback via Gemini & Grok.
                        </p>
                      </div>

                      <button
                        type="button"
                        className={`btn mt-4 w-full justify-center text-sm ${
                          interviewMode === "ai" ? "btn-primary" : "btn-outline"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setInterviewMode("ai");
                          modeRef.current = "ai";
                          startInterview();
                        }}
                        disabled={loading}
                      >
                        {loading && interviewMode === "ai" ? (
                          <>
                            <Loader2 size={15} className="animate-spin" />
                            Preparing AI...
                          </>
                        ) : (
                          <>
                            <Sparkles size={15} />
                            Start AI Interview
                            <ArrowRight size={15} />
                          </>
                        )}
                      </button>
                    </div>

                    {/* 2. 📚 QUESTION BANK MODE */}
                    <div
                      onClick={() => {
                        setInterviewMode("question-bank");
                        modeRef.current = "question-bank";
                      }}
                      className={`relative flex flex-col justify-between cursor-pointer rounded-2xl border-2 p-5 transition-all ${
                        interviewMode === "question-bank"
                          ? "border-teal bg-teal/5 shadow-md shadow-teal/10 ring-1 ring-teal/30"
                          : "border-border bg-card hover:border-border/80 hover:bg-muted/20"
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal/10 text-teal">
                            <BookOpen size={24} />
                          </div>
                          {interviewMode === "question-bank" && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal text-white">
                              <CheckCircle2 size={15} />
                            </span>
                          )}
                        </div>

                        <h3 className="mt-3.5 text-base font-bold">
                          📚 Question Bank
                        </h3>

                        <p className="muted mt-1 text-xs leading-relaxed">
                          Curated role-based interview questions. Works offline without AI rate-limit dependency or quota exhaustion.
                        </p>
                      </div>

                      <button
                        type="button"
                        className={`btn mt-4 w-full justify-center text-sm ${
                          interviewMode === "question-bank"
                            ? "bg-teal hover:bg-teal/90 text-white font-semibold"
                            : "btn-outline"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setInterviewMode("question-bank");
                          modeRef.current = "question-bank";
                          startInterview();
                        }}
                        disabled={loading}
                      >
                        {loading && interviewMode === "question-bank" ? (
                          <>
                            <Loader2 size={15} className="animate-spin" />
                            Loading Questions...
                          </>
                        ) : (
                          <>
                            <BookOpen size={15} />
                            Start Question Bank
                            <ArrowRight size={15} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* SECTION 7: OPTIONAL AI EVALUATION */}
                  <div className="mt-4 rounded-xl border border-border bg-muted/20 p-3.5">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={useAiEvaluation}
                        onChange={(e) => setUseAiEvaluation(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <div>
                        <p className="text-sm font-semibold">
                          AI-powered answer evaluation (Optional)
                        </p>
                        <p className="muted text-xs leading-relaxed">
                          When checked, Gemini/Grok is used for answer evaluation if available. When unchecked, answers are evaluated instantly and locally using deterministic topic heuristics.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* ==================================================
                    RESUME UPLOAD (OPTIONAL)
                ================================================== */}

                <div className="mt-5">
                  <label className="label">
                    Optional resume (for AI personalization)
                  </label>

                  {!resumeFile ? (
                    <label className="flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed border-border bg-muted/20 p-4 transition hover:bg-muted/40">
                      <input
                        type="file"
                        accept=".pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.txt,text/plain"
                        className="hidden"
                        onChange={(e) => {
                          const file =
                            e.target.files?.[0];

                          uploadResume(file);

                          e.target.value = "";
                        }}
                      />

                      <Upload
                        className="text-primary"
                        size={22}
                      />

                      <div>
                        <p className="text-sm font-semibold">
                          Upload resume for personalized questions
                        </p>

                        <p className="muted text-xs">
                          PDF, DOCX or TXT · Maximum 10 MB · Optional
                        </p>
                      </div>
                    </label>
                  ) : (
                    <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/20 p-3.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {resumeFile.name}
                        </p>

                        <p className="muted mt-0.5 text-xs">
                          Resume uploaded successfully
                        </p>
                      </div>

                      <button
                        type="button"
                        className="nav-btn"
                        onClick={() => {
                          setResumeFile(null);
                          setResume("");
                          setError("");
                        }}
                      >
                        <X size={17} />
                      </button>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3.5 text-sm text-destructive">
                    {error}
                  </div>
                )}
              </div>

              <div className="card">
                <h2 className="text-xl font-bold">
                  What you'll practice
                </h2>

                <div className="mt-5 space-y-3">
                  {[
                    "Role-specific technical depth",
                    "STAR behavioral communication",
                    "Clear problem-solving structure",
                    "Keyword and concept mastery",
                    "Handling edge cases & architecture",
                    "Realistic interview readiness",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3"
                    >
                      <CheckCircle2
                        size={17}
                        className="text-teal shrink-0"
                      />

                      <span className="text-sm font-medium">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-border/80 bg-muted/10 p-4">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <ShieldCheck size={14} className="text-teal" />
                    Offline Reliability Guarantee
                  </h4>
                  <p className="muted mt-1.5 text-xs leading-relaxed">
                    Question Bank mode runs independently of cloud AI APIs. Even if rate limits are reached or the internet is restricted, your practice continues uninterrupted.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ======================================================
            QUESTIONS
        ====================================================== */}

        {phase === "questions" &&
          questions[current] && (
            <section className="mt-5 grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
              <div className="card">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="ai-badge inline-flex">
                    QUESTION {current + 1} / {questions.length}
                  </div>

                  {questions[current]?.category && (
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {questions[current].category}
                    </span>
                  )}

                  {questions[current]?.difficulty && (
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {questions[current].difficulty}
                    </span>
                  )}

                  <span className="rounded-full bg-muted/60 px-2.5 py-0.5 text-xs text-muted-foreground">
                    {interviewMode === "question-bank" ? "📚 Question Bank" : "🤖 AI Mode"}
                  </span>
                </div>

                <h1 className="mt-5 text-2xl font-black leading-snug">
                  {questions[current]?.question ||
                    questions[current]?.text ||
                    questions[current]}
                </h1>

                <div className="progress mt-6">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${
                        ((current + 1) /
                          questions.length) *
                        100
                      }%`,
                    }}
                  />
                </div>

                <p className="muted mt-5 text-xs leading-relaxed">
                  Take your time and structure your answer clearly.
                  {questions[current]?.interviewType === "Behavioral" && (
                    <span className="block mt-1 font-medium text-foreground">
                      Tip: Use Situation, Task, Action, and Result (STAR).
                    </span>
                  )}
                </p>

                {questions[current]?.expectedTopics?.length > 0 && (
                  <div className="mt-5 rounded-xl border border-border/60 bg-muted/20 p-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Key Concepts To Address:
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {questions[current].expectedTopics.map((topic) => (
                        <span
                          key={topic}
                          className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="card">
                {!evaluation ? (
                  <>
                    <label className="label">
                      Your answer
                    </label>

                    <textarea
                      className="textarea min-h-[300px]"
                      value={answer}
                      onChange={(e) =>
                        setAnswer(e.target.value)
                      }
                      placeholder="Write your answer thoroughly as you would in a real interview..."
                    />

                    {error && (
                      <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                        {error}
                      </div>
                    )}

                    <button
                      type="button"
                      className="btn btn-primary mt-5"
                      onClick={evaluateAnswer}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2
                            size={17}
                            className="animate-spin"
                          />
                          Evaluating Answer...
                        </>
                      ) : (
                        <>
                          Evaluate Answer
                          <ArrowRight size={17} />
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold">
                          {evaluation.evaluationProvider === "local"
                            ? "Interview Feedback"
                            : "AI Feedback"}
                        </h2>
                        <span className="text-xs text-muted-foreground">
                          {evaluation.evaluationProvider === "local"
                            ? "Evaluated via Question Bank Engine"
                            : `Evaluated via ${evaluation.evaluationProvider || "AI"}`}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-3xl font-black text-primary">
                          {evaluation.scoreOutOf100 ??
                            evaluation.overallScore ??
                            (typeof evaluation.score === "number" && evaluation.score <= 10
                              ? Math.round(evaluation.score * 10)
                              : evaluation.score) ??
                            0}
                          %
                        </span>
                        {typeof evaluation.score === "number" && evaluation.score <= 10 && (
                          <p className="text-xs text-muted-foreground">
                            {evaluation.score} / 10
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 space-y-4">
                      <div className="rounded-2xl bg-muted/30 p-4">
                        <p className="font-bold text-sm">
                          Summary
                        </p>

                        <p className="muted mt-2 text-sm leading-6">
                          {evaluation.summary ||
                            evaluation.feedback ||
                            "Your answer has been evaluated."}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-muted/30 p-4">
                        <p className="font-bold text-sm text-teal">
                          Strengths
                        </p>

                        <p className="muted mt-2 text-sm leading-6">
                          {Array.isArray(evaluation.strengths)
                            ? evaluation.strengths.join(", ")
                            : evaluation.strengths ||
                              "Good effort and relevant response."}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-muted/30 p-4">
                        <p className="font-bold text-sm text-amber-500">
                          Areas for Improvement
                        </p>

                        <p className="muted mt-2 text-sm leading-6">
                          {Array.isArray(evaluation.improvements)
                            ? evaluation.improvements.join(", ")
                            : evaluation.improvements ||
                              "Try to make your answer more structured and specific."}
                        </p>
                      </div>

                      {(evaluation.betterAnswer ||
                        evaluation.idealAnswer) && (
                        <div className="rounded-2xl bg-muted/30 p-4">
                          <p className="font-bold text-sm">
                            Answer Guidance & Key Takeaways
                          </p>

                          <p className="muted mt-2 text-sm leading-6">
                            {evaluation.betterAnswer ||
                              evaluation.idealAnswer}
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary mt-5"
                      onClick={nextQuestion}
                    >
                      {current ===
                      questions.length - 1
                        ? "Finish Interview"
                        : "Next Question"}

                      <ChevronRight size={17} />
                    </button>
                  </>
                )}
              </div>
            </section>
          )}

        {/* ======================================================
            FINISHED
        ====================================================== */}

        {phase === "finished" && (
          <section className="card mt-5 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal/10 text-teal">
              <CheckCircle2 size={34} />
            </div>

            <h1 className="mt-5 text-3xl font-black">
              Interview complete
            </h1>

            <p className="muted mx-auto mt-3 max-w-xl">
              Great work! Your interview result and performance have been recorded and your Career Progress has been updated.
            </p>

            <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-border bg-muted/20 p-6">
              <p className="muted text-sm">
                Average score ({interviewMode === "question-bank" ? "Question Bank" : "AI Mode"})
              </p>

              <p className="mt-2 text-5xl font-black text-primary">
                {scores.length
                  ? Math.round(
                      scores.reduce(
                        (total, score) =>
                          total +
                          Number(score || 0),
                        0
                      ) / scores.length
                    )
                  : 0}
                %
              </p>
            </div>

            <button
              type="button"
              className="btn btn-primary mt-6"
              onClick={resetInterview}
            >
              Practice Again
            </button>
          </section>
        )}
      </div>
    </main>
  );
}