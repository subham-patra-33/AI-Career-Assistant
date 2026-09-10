import React, { useState } from "react";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Mic,
  Sparkles,
  Target,
  Upload,
  X,
} from "lucide-react";
import BackButton from "../BackButton";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AiMockInterview() {
  const [role, setRole] = useState("");
  const [type, setType] = useState("Technical");
  const [difficulty, setDifficulty] =
    useState("Intermediate");

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

  const uploadResume = async (file) => {
    if (!file) return;

    setResumeFile(file);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${API_URL}/api/ai/parse-resume-file`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to read resume."
        );
      }

      setResume(
        data?.text ||
          data?.resume?.text ||
          data?.resumeText ||
          ""
      );
    } catch (err) {
      setError(err.message || "Resume upload failed.");
      setResumeFile(null);
    }
  };

  const startInterview = async () => {
    if (!role.trim()) {
      setError("Enter the role you want to practice for.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/ai/mock-interview`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role,
            interviewType: type,
            difficulty,
            resume,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || data?.success === false) {
        throw new Error(
          data?.message || "Unable to generate interview."
        );
      }

      const generated =
        data?.result ||
        data?.questions ||
        [];

      const normalized = Array.isArray(generated)
        ? generated
        : Array.isArray(generated.questions)
          ? generated.questions
          : [];

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
    } catch (err) {
      setError(err.message || "Interview generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const evaluateAnswer = async () => {
    if (!answer.trim()) {
      setError("Write your answer before submitting.");
      return;
    }

    setLoading(true);
    setError("");

    const question =
      questions[current]?.question ||
      questions[current]?.text ||
      questions[current];

    try {
      const response = await fetch(
        `${API_URL}/api/ai/evaluate-interview`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role,
            question,
            answer,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || data?.success === false) {
        throw new Error(
          data?.message || "Unable to evaluate answer."
        );
      }

      const result = data?.result || data;
      setEvaluation(result);

      const score = Number(
        result?.score ||
          result?.overallScore ||
          result?.rating ||
          0
      );

      setScores((previous) => [...previous, score]);
    } catch (err) {
      setError(err.message || "Evaluation failed.");
    } finally {
      setLoading(false);
    }
  };

  const nextQuestion = () => {
    if (current < questions.length - 1) {
      setCurrent((value) => value + 1);
      setAnswer("");
      setEvaluation(null);
      setError("");
    } else {
      setPhase("finished");
      localStorage.setItem(
        "lastInterviewScore",
        String(
          scores.length
            ? Math.round(
                scores.reduce((a, b) => a + b, 0) /
                  scores.length
              )
            : 0
        )
      );
    }
  };

  return (
    <main className="min-h-screen w-full bg-background px-5 py-5 text-foreground sm:px-6 sm:py-6 lg:px-7 lg:py-7">
      <div className="w-full">
        <BackButton />

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
                    Practice realistic interview questions,
                    receive AI feedback, identify weaknesses and
                    improve your interview performance.
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

                <div className="mt-5 grid gap-4 md:grid-cols-3">
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
                      <option>Technical</option>
                      <option>HR</option>
                      <option>Behavioral</option>
                      <option>Mixed</option>
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
                        setDifficulty(e.target.value)
                      }
                    >
                      <option>Beginner</option>
                      <option>Intermediate</option>
                      <option>Advanced</option>
                    </select>
                  </div>
                </div>

                <div className="mt-5">
                  <label className="label">
                    Optional resume
                  </label>

                  {!resumeFile ? (
                    <label className="flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed border-border bg-muted/20 p-5">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        className="hidden"
                        onChange={(e) =>
                          uploadResume(
                            e.target.files?.[0]
                          )
                        }
                      />

                      <Upload className="text-primary" />

                      <div>
                        <p className="font-semibold">
                          Upload resume for personalized questions
                        </p>
                        <p className="muted text-sm">
                          Optional
                        </p>
                      </div>
                    </label>
                  ) : (
                    <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/20 p-4">
                      <span className="font-semibold">
                        {resumeFile.name}
                      </span>

                      <button
                        className="nav-btn"
                        onClick={() => {
                          setResumeFile(null);
                          setResume("");
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

        {phase === "questions" && questions[current] && (
          <section className="mt-5 grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
            <div className="card">
              <div className="ai-badge inline-flex">
                QUESTION {current + 1} / {questions.length}
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
                Take your time and answer as if you're in a real
                interview.
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
                      {evaluation.score ||
                        evaluation.overallScore ||
                        evaluation.rating ||
                        0}
                      %
                    </span>
                  </div>

                  <div className="mt-5 space-y-4">
                    <div className="rounded-2xl bg-muted/30 p-4">
                      <p className="font-bold">
                        Strengths
                      </p>
                      <p className="muted mt-2 text-sm leading-6">
                        {Array.isArray(
                          evaluation.strengths
                        )
                          ? evaluation.strengths.join(", ")
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

                    {evaluation.betterAnswer && (
                      <div className="rounded-2xl bg-muted/30 p-4">
                        <p className="font-bold">
                          Better answer approach
                        </p>
                        <p className="muted mt-2 text-sm leading-6">
                          {evaluation.betterAnswer}
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    className="btn btn-primary mt-5"
                    onClick={nextQuestion}
                  >
                    {current === questions.length - 1
                      ? "Finish Interview"
                      : "Next Question"}
                    <ChevronRight size={17} />
                  </button>
                </>
              )}
            </div>
          </section>
        )}

        {phase === "finished" && (
          <section className="card mt-5 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal/10 text-teal">
              <CheckCircle2 size={34} />
            </div>

            <h1 className="mt-5 text-3xl font-black">
              Interview complete
            </h1>

            <p className="muted mx-auto mt-3 max-w-xl">
              Great work. Review your feedback and continue
              practicing the areas where you scored lower.
            </p>

            <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-border bg-muted/20 p-6">
              <p className="muted text-sm">
                Average score
              </p>

              <p className="mt-2 text-5xl font-black text-primary">
                {scores.length
                  ? Math.round(
                      scores.reduce(
                        (a, b) => a + b,
                        0
                      ) / scores.length
                    )
                  : 0}
                %
              </p>
            </div>

            <button
              className="btn btn-primary mt-6"
              onClick={() => {
                setPhase("setup");
                setQuestions([]);
                setCurrent(0);
                setScores([]);
                setEvaluation(null);
                setAnswer("");
              }}
            >
              Practice Again
            </button>
          </section>
        )}
      </div>
    </main>
  );
}