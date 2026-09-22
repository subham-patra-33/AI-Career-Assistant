import React, { useState } from "react";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Mic,
  Sparkles,
  Upload,
  X,
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
  const [role, setRole] = useState("UI/UX Designer");
  const [type, setType] = useState("Technical");
  const [difficulty, setDifficulty] =
    useState("Beginner");
  const [questionCount, setQuestionCount] =
    useState(10);

  const [resume, setResume] = useState("");
  const [resumeFile, setResumeFile] = useState(null);

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState("");

  const [evaluation, setEvaluation] = useState(null);
  const [scores, setScores] = useState([]);

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

      /*
       * The backend may return:
       *
       * { text: "..." }
       *
       * or
       *
       * { resume: {...}, text: "..." }
       */
      const resumeText =
        data?.text ||
        data?.resumeText ||
        data?.resume?.text ||
        "";

      /*
       * If structured resume information is returned,
       * convert it into readable text so Gemini can
       * personalize interview questions.
       */
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

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/ai/mock-interview`,
        {
          method: "POST",

          headers: getAuthHeaders(true),

          body: JSON.stringify({
            role: role.trim(),
            interviewType: type,
            difficulty,
            questionCount: Number(questionCount),
            resume: resume || "",
          }),
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
          "The AI did not return any interview questions."
        );
      }

      setQuestions(normalized);
      setCurrent(0);
      setScores([]);
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
      const response = await fetch(
        `${API_URL}/api/ai/evaluate-interview`,
        {
          method: "POST",

          headers: getAuthHeaders(true),

          body: JSON.stringify({
            role,
            interviewType: type,
            difficulty,
            question,
            answer: answer.trim(),
            resume: resume || "",
          }),
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
            "Unable to evaluate your answer."
        );
      }

      const result =
        data?.result ||
        data?.evaluation ||
        data;

      setEvaluation(result);

      const rawScore =
        result?.score ??
        result?.overallScore ??
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
  // NEXT QUESTION
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
                    AI INTERVIEW COACH
                  </div>

                  <h1 className="text-3xl font-black sm:text-4xl">
                    AI Mock Interview
                  </h1>

                  <p className="muted mt-3 max-w-4xl leading-7">
                    Practice realistic interview
                    questions, receive AI feedback,
                    identify weaknesses and improve
                    your interview performance.
                  </p>
                </div>

                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border border-border bg-muted/30 text-primary ai-glow">
                  <Mic size={42} />
                </div>
              </div>
            </section>

            <section className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="card">
                <h2 className="text-xl font-bold">
                  Configure your interview
                </h2>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="label">
                      Target role
                    </label>

                    <input
                      className="input"
                      value={role}
                      onChange={(e) =>
                        setRole(e.target.value)
                      }
                      placeholder="Software Engineer"
                    />
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
                      <option>
                        Technical
                      </option>
                      <option>
                        HR
                      </option>
                      <option>
                        Behavioral
                      </option>
                      <option>
                        Mixed
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
                      <option>
                        Beginner
                      </option>
                      <option>
                        Intermediate
                      </option>
                      <option>
                        Advanced
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="label">
                      Number of questions
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
                    RESUME UPLOAD
                ================================================== */}

                <div className="mt-5">
                  <label className="label">
                    Optional resume
                  </label>

                  {!resumeFile ? (
                    <label className="flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed border-border bg-muted/20 p-5 transition hover:bg-muted/40">
                      <input
                        type="file"
                        accept=".pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.txt,text/plain"
                        className="hidden"
                        onChange={(e) => {
                          const file =
                            e.target.files?.[0];

                          uploadResume(file);

                          /*
                           * Allows the user to select
                           * the same file again after
                           * removing it.
                           */
                          e.target.value = "";
                        }}
                      />

                      <Upload
                        className="text-primary"
                      />

                      <div>
                        <p className="font-semibold">
                          Upload resume for
                          personalized questions
                        </p>

                        <p className="muted text-sm">
                          PDF, DOCX or TXT ·
                          Maximum 10 MB · Optional
                        </p>
                      </div>
                    </label>
                  ) : (
                    <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/20 p-4">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {resumeFile.name}
                        </p>

                        <p className="muted mt-1 text-xs">
                          Resume uploaded
                          successfully
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
                  <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  className="btn btn-primary mt-5"
                  onClick={startInterview}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Preparing interview...
                    </>
                  ) : (
                    <>
                      <Sparkles size={17} />
                      Start Mock Interview
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </div>

              <div className="card">
                <h2 className="text-xl font-bold">
                  What you'll practice
                </h2>

                <div className="mt-5 space-y-3">
                  {[
                    "Role-specific questions",
                    "Clear answer structure",
                    "Technical reasoning",
                    "Communication",
                    "Problem solving",
                    "Interview confidence",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3"
                    >
                      <CheckCircle2
                        size={17}
                        className="text-teal"
                      />

                      <span className="text-sm font-medium">
                        {item}
                      </span>
                    </div>
                  ))}
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
            <section className="mt-5 grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
              <div className="card">
                <div className="ai-badge inline-flex">
                  QUESTION {current + 1} /{" "}
                  {questions.length}
                </div>

                <h1 className="mt-5 text-2xl font-black">
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

                <p className="muted mt-5 text-sm">
                  Take your time and answer as if
                  you're in a real interview.
                </p>
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
                      placeholder="Write your answer here..."
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
                          Evaluating...
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
                      <h2 className="text-xl font-bold">
                        AI Feedback
                      </h2>

                      <span className="text-3xl font-black text-primary">
                        {evaluation.score ??
                          evaluation.overallScore ??
                          evaluation.rating ??
                          0}
                        %
                      </span>
                    </div>

                    <div className="mt-5 space-y-4">
                      <div className="rounded-2xl bg-muted/30 p-4">
                        <p className="font-bold">
                          Summary
                        </p>

                        <p className="muted mt-2 text-sm leading-6">
                          {evaluation.summary ||
                            evaluation.feedback ||
                            "Your answer has been evaluated."}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-muted/30 p-4">
                        <p className="font-bold">
                          Strengths
                        </p>

                        <p className="muted mt-2 text-sm leading-6">
                          {Array.isArray(
                            evaluation.strengths
                          )
                            ? evaluation.strengths.join(
                                ", "
                              )
                            : evaluation.strengths ||
                              "Good effort and relevant response."}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-muted/30 p-4">
                        <p className="font-bold">
                          Improvements
                        </p>

                        <p className="muted mt-2 text-sm leading-6">
                          {Array.isArray(
                            evaluation.improvements
                          )
                            ? evaluation.improvements.join(
                                ", "
                              )
                            : evaluation.improvements ||
                              "Try to make your answer more structured and specific."}
                        </p>
                      </div>

                      {(evaluation.betterAnswer ||
                        evaluation.idealAnswer) && (
                        <div className="rounded-2xl bg-muted/30 p-4">
                          <p className="font-bold">
                            Better answer
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
              Great work. Review your feedback and
              continue practicing the areas where you
              scored lower.
            </p>

            <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-border bg-muted/20 p-6">
              <p className="muted text-sm">
                Average score
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