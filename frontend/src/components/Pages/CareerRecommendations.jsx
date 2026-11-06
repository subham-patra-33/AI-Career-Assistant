import React, { useState, useRef } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Loader2,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
  X,
} from "lucide-react";
import BackButton from "../BackButton";
import { getToken } from "../../lib/auth";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000";

const demoCareers = [
  {
    title: "Software Engineer",
    matchScore: 94,
    description:
      "A strong fit for candidates interested in building scalable software products and applications.",
    skills: ["JavaScript", "React", "Node.js", "SQL"],
  },
  {
    title: "Data Analyst",
    matchScore: 87,
    description:
      "A good direction for candidates who enjoy working with data, dashboards and business insights.",
    skills: ["SQL", "Python", "Excel", "Power BI"],
  },
  {
    title: "AI / ML Engineer",
    matchScore: 82,
    description:
      "Suitable for candidates who want to move toward artificial intelligence and machine learning.",
    skills: ["Python", "Machine Learning", "Statistics", "AI"],
  },
];

export default function CareerRecommendations() {
  const [target, setTarget] = useState("");
  const [experience, setExperience] =
    useState("Student / Fresher");
  const [resume, setResume] = useState("");
  const [file, setFile] = useState(null);
  const [recommendations, setRecommendations] =
    useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const lastSubmitRef = useRef(0);
  const cacheRef = useRef(new Map());

  const careers = recommendations.length
    ? recommendations
    : demoCareers;

  const uploadResume = async (selectedFile) => {
    if (!selectedFile) return;

    setFile(selectedFile);
    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

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
          data?.message || "Unable to parse resume."
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
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  const generate = async () => {
    if (loading) return;

    // Debounce rapid clicks (2s)
    const now = Date.now();
    if (now - lastSubmitRef.current < 2000) return;
    lastSubmitRef.current = now;

    if (!resume.trim()) {
      setError("Upload or paste your resume first.");
      return;
    }

    const cacheKey = `${target.trim().toLowerCase()}|${experience}|${resume.trim().slice(0, 300)}`;
    if (cacheRef.current.has(cacheKey)) {
      setRecommendations(cacheRef.current.get(cacheKey));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = getToken();
      const headers = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_URL}/api/ai/career-recommendations`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            targetRole: target,
            experienceLevel: experience,
            resume,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || data?.success === false) {
        throw new Error(
          data?.message ||
            "Unable to generate career recommendations."
        );
      }

      const result =
        data?.result ||
        data?.recommendations ||
        [];

      const finalRecommendations = Array.isArray(result)
        ? result
        : result?.recommendations || [];

      setRecommendations(finalRecommendations);
      cacheRef.current.set(cacheKey, finalRecommendations);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-background px-5 py-5 text-foreground sm:px-6 sm:py-6 lg:px-7 lg:py-7">
      <div className="w-full">
        <BackButton />

        <section className="card mt-5">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="ai-badge mb-3 inline-flex items-center gap-2">
                <Sparkles size={14} />
                AI CAREER DISCOVERY
              </div>

              <h1 className="text-3xl font-black sm:text-4xl">
                Career Recommendations
              </h1>

              <p className="muted mt-3 max-w-4xl leading-7">
                Discover career paths that align with your
                experience, skills, interests and professional
                direction.
              </p>
            </div>

            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border border-border bg-muted/30 text-primary ai-glow">
              <BriefcaseBusiness size={42} />
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="card">
            <h2 className="text-xl font-bold">
              Build your career profile
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label className="label">
                  Career interest
                </label>

                <input
                  className="input"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="e.g. Technology / Data / Finance"
                />
              </div>

              <div>
                <label className="label">
                  Experience level
                </label>

                <select
                  className="input"
                  value={experience}
                  onChange={(e) =>
                    setExperience(e.target.value)
                  }
                >
                  <option>Student / Fresher</option>
                  <option>0–2 years</option>
                  <option>2–5 years</option>
                  <option>5+ years</option>
                </select>
              </div>
            </div>

            <div className="mt-5">
              <label className="label">Resume</label>

              {!file ? (
                <label className="flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed border-border bg-muted/20 p-6">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={(e) =>
                      uploadResume(e.target.files?.[0])
                    }
                  />

                  <Upload className="text-primary" />

                  <div>
                    <p className="font-bold">
                      {uploading
                        ? "Processing..."
                        : "Upload resume"}
                    </p>

                    <p className="muted text-sm">
                      PDF, DOC, DOCX or TXT
                    </p>
                  </div>
                </label>
              ) : (
                <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/20 p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="text-primary" />
                    <span className="font-semibold">
                      {file.name}
                    </span>
                  </div>

                  <button
                    className="nav-btn"
                    onClick={() => {
                      setFile(null);
                      setResume("");
                    }}
                  >
                    <X size={17} />
                  </button>
                </div>
              )}
            </div>

            <textarea
              className="textarea mt-5 min-h-[130px]"
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="Or paste your resume..."
            />

            {error && (
              <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              className="btn btn-primary mt-5"
              onClick={generate}
              disabled={loading || uploading}
            >
              {loading ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Finding careers...
                </>
              ) : (
                <>
                  <Sparkles size={17} />
                  Find Career Paths
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <Target className="text-primary" />
              <h2 className="text-xl font-bold">
                AI considers
              </h2>
            </div>

            <div className="mt-5 space-y-3">
              {[
                "Your existing skills",
                "Experience level",
                "Transferable capabilities",
                "Career direction",
                "Industry relevance",
                "Future growth potential",
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

        <section className="mt-5">
          <div className="mb-4">
            <h2 className="text-2xl font-black">
              Recommended career paths
            </h2>

            <p className="muted mt-1">
              AI-ranked directions based on your profile.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {careers.map((career, index) => (
              <article
                key={career.title || index}
                className="card transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <BriefcaseBusiness size={22} />
                  </div>

                  <span className="text-2xl font-black text-primary">
                    {career.matchScore || career.score || 0}%
                  </span>
                </div>

                <h3 className="mt-5 text-xl font-bold">
                  {career.title || career.role}
                </h3>

                <p className="muted mt-2 text-sm leading-6">
                  {career.description ||
                    career.reason ||
                    "A career direction recommended by AI."}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {(career.skills || []).map((skill) => (
                    <span className="chip" key={skill}>
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="progress mt-5">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(
                        100,
                        career.matchScore ||
                          career.score ||
                          0
                      )}%`,
                    }}
                  />
                </div>

                <button className="btn btn-secondary mt-5 w-full">
                  Explore Career
                  <ArrowRight size={16} />
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="card mt-5">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-teal" />
            <div>
              <h2 className="text-xl font-bold">
                Career growth insight
              </h2>
              <p className="muted mt-1 text-sm">
                Use recommendations as directions, then validate
                them through projects, internships and applications.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}