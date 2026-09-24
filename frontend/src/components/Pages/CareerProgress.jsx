import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Award,
  BarChart3,
  Briefcase,
  CheckCircle2,
  FileText,
  GraduationCap,
  Mic,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import BackButton from "../BackButton";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:4000"
)
  .trim()
  .replace(/\/+$/, "")
  .replace(/^http:\/\/localhost(?=[:/]|$)/i, "http://127.0.0.1");

export default function CareerProgress() {
  const navigate = useNavigate();

  const [resumeCount, setResumeCount] = useState(0);
  const [savedJobsCount, setSavedJobsCount] = useState(0);
  const [appliedCount, setAppliedCount] = useState(0);
  const [interviewCount, setInterviewCount] = useState(0);
  const [backendProgress, setBackendProgress] = useState(null);

  const [skillGapCompleted, setSkillGapCompleted] = useState(
    localStorage.getItem("skillGapCompleted") === "true"
  );

  const [interviewScore, setInterviewScore] = useState(
    Number(localStorage.getItem("lastInterviewScore") || 0)
  );

  const fetchCareerProgress = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/career-progress`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) return;

      const result = await response.json();
      if (result?.success && result?.data) {
        const d = result.data;
        setResumeCount(Number(d.resumesCreated) || 0);
        setSavedJobsCount(Number(d.jobsSaved) || 0);
        setAppliedCount(Number(d.applications) || 0);
        setInterviewCount(Number(d.interviews) || 0);

        if (typeof d.overallProgress === "number") {
          setBackendProgress(d.overallProgress);
        }

        if (typeof d.interviewScore === "number" && d.interviewScore > 0) {
          setInterviewScore(d.interviewScore);
          localStorage.setItem("lastInterviewScore", String(d.interviewScore));
        }

        if (d.skillGapStatus === "Completed") {
          setSkillGapCompleted(true);
          localStorage.setItem("skillGapCompleted", "true");
        }
      }
    } catch (err) {
      console.error("Failed to load career progress:", err);
    }
  };

  useEffect(() => {
    fetchCareerProgress();

    // Fallback: sync latest interview score if not yet set
    const token = localStorage.getItem("token");
    if (!localStorage.getItem("lastInterviewScore") && token) {
      fetch(`${API_URL}/api/interview/latest-score`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.score) {
            localStorage.setItem("lastInterviewScore", String(d.score));
            setInterviewScore(Number(d.score));
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    const refresh = () => {
      fetchCareerProgress();

      setSkillGapCompleted(
        localStorage.getItem("skillGapCompleted") === "true"
      );

      setInterviewScore(
        Number(localStorage.getItem("lastInterviewScore") || 0)
      );
    };

    window.addEventListener("storage", refresh);

    return () => window.removeEventListener("storage", refresh);
  }, []);

  const checklist = [
    {
      title: "Create a resume",
      description: "Build a polished resume tailored to your target role.",
      complete: resumeCount > 0,
      icon: FileText,
      action: () => navigate("/resume"),
    },
    {
      title: "Analyze your skill gap",
      description: "Understand which capabilities you need to improve.",
      complete: skillGapCompleted,
      icon: Target,
      action: () => navigate("/skill-gap"),
    },
    {
      title: "Practice an interview",
      description: "Use AI to practice realistic interview questions.",
      complete: interviewScore > 0,
      icon: Mic,
      action: () => navigate("/ai-mock-interview"),
    },
    {
      title: "Apply to jobs",
      description: "Find relevant opportunities and start applying.",
      complete: appliedCount > 0,
      icon: Briefcase,
      action: () => navigate("/job-recommendations"),
    },
  ];

  const completed = checklist.filter((item) => item.complete).length;

  const progress =
    backendProgress !== null
      ? backendProgress
      : Math.round((completed / checklist.length) * 100);

  const milestones = useMemo(
    () => [
      {
        value: resumeCount,
        label: "Resumes created",
        icon: FileText,
      },
      {
        value: savedJobsCount,
        label: "Jobs saved",
        icon: Briefcase,
      },
      {
        value: appliedCount,
        label: "Applications",
        icon: TrendingUp,
      },
      {
        value: interviewCount,
        label: "Interviews",
        icon: Mic,
      },
    ],
    [resumeCount, savedJobsCount, appliedCount, interviewCount]
  );

  return (
    <main className="min-h-screen w-full bg-background px-5 py-5 text-foreground sm:px-6 sm:py-6 lg:px-7 lg:py-7">
      <div className="w-full">
        <BackButton />

        <section className="card mt-5">
          <div className="flex flex-col gap-7 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="ai-badge mb-3 inline-flex items-center gap-2">
                <Sparkles size={14} />
                CAREER DASHBOARD
              </div>

              <h1 className="text-3xl font-black sm:text-4xl">
                Career Progress
              </h1>

              <p className="muted mt-3 max-w-4xl leading-7">
                Track how far you've progressed through your
                career preparation journey and see what to work on
                next.
              </p>
            </div>

            <div className="flex h-32 w-32 shrink-0 flex-col items-center justify-center rounded-3xl border border-border bg-muted/30">
              <span className="text-4xl font-black text-primary">
                {progress}%
              </span>

              <span className="muted text-xs">
                overall progress
              </span>
            </div>
          </div>

          <div className="progress mt-7 h-3">
            <div
              className="progress-fill"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {milestones.map((item) => {
            const Icon = item.icon;

            return (
              <div className="card" key={item.label}>
                <div className="flex items-center justify-between">
                  <p className="muted text-sm">
                    {item.label}
                  </p>

                  <Icon
                    size={19}
                    className="text-primary"
                  />
                </div>

                <p className="mt-3 text-3xl font-black">
                  {item.value}
                </p>
              </div>
            );
          })}
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="card">
            <div className="flex items-center gap-3">
              <Target className="text-primary" />
              <div>
                <h2 className="text-2xl font-black">
                  Your career checklist
                </h2>

                <p className="muted mt-1 text-sm">
                  Complete these steps to build a stronger
                  career profile.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {checklist.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.title}
                    onClick={item.action}
                    className="flex w-full items-center gap-4 rounded-2xl border border-border bg-muted/20 p-4 text-left transition hover:border-primary/40 hover:bg-muted/40"
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        item.complete
                          ? "bg-teal/10 text-teal"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {item.complete ? (
                        <CheckCircle2 size={21} />
                      ) : (
                        <Icon size={21} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-bold">
                        {item.title}
                      </p>

                      <p className="muted mt-1 text-sm">
                        {item.description}
                      </p>
                    </div>

                    <ArrowRight
                      size={18}
                      className="shrink-0 text-muted-foreground"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <Award className="text-gold" />
              <div>
                <h2 className="text-xl font-bold">
                  Performance snapshot
                </h2>

                <p className="muted mt-1 text-sm">
                  Your latest career preparation signals.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-muted/30 p-4">
                <div className="flex justify-between">
                  <span className="muted text-sm">
                    Interview score
                  </span>

                  <span className="font-black text-primary">
                    {interviewScore
                      ? `${interviewScore}%`
                      : "Not attempted"}
                  </span>
                </div>

                <div className="progress mt-3">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(
                        100,
                        interviewScore
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-muted/30 p-4">
                <div className="flex justify-between">
                  <span className="muted text-sm">
                    Skill gap analysis
                  </span>

                  <span className="font-bold">
                    {skillGapCompleted
                      ? "Completed"
                      : "Pending"}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl bg-muted/30 p-4">
                <div className="flex justify-between">
                  <span className="muted text-sm">
                    Applications
                  </span>

                  <span className="font-black">
                    {appliedCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="card mt-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <BarChart3 className="text-teal" />

                <h2 className="text-xl font-bold">
                  Keep building momentum
                </h2>
              </div>

              <p className="muted mt-2 max-w-3xl text-sm leading-6">
                The strongest career progress comes from combining
                a good resume, targeted skill development, interview
                practice and consistent applications.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                className="btn btn-secondary"
                onClick={() =>
                  navigate("/recommended-skills")
                }
              >
                <GraduationCap size={17} />
                Recommended Skills
              </button>

              <button
                className="btn btn-primary"
                onClick={() =>
                  navigate("/job-recommendations")
                }
              >
                <Briefcase size={17} />
                Find Jobs
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}