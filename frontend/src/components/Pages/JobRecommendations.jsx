import React, { useMemo, useState } from "react";
import {
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Building2,
  ExternalLink,
  Filter,
  MapPin,
  Search,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import BackButton from "../BackButton";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const demoJobs = [
  {
    id: "demo-1",
    title: "Software Engineer",
    company: "Technology Company",
    location: "Bengaluru, India",
    type: "Full-time",
    experience: "0–2 years",
    salary: "₹6–10 LPA",
    matchScore: 94,
    skills: ["React", "JavaScript", "Node.js", "SQL"],
    description:
      "Build and maintain modern web applications and backend services.",
    url: "#",
  },
  {
    id: "demo-2",
    title: "Junior Data Analyst",
    company: "Analytics Company",
    location: "Hyderabad, India",
    type: "Full-time",
    experience: "0–2 years",
    salary: "₹5–8 LPA",
    matchScore: 89,
    skills: ["SQL", "Python", "Excel", "Power BI"],
    description:
      "Analyze business data and create dashboards and reports.",
    url: "#",
  },
  {
    id: "demo-3",
    title: "Frontend Developer",
    company: "Product Startup",
    location: "Remote",
    type: "Full-time",
    experience: "0–2 years",
    salary: "₹5–9 LPA",
    matchScore: 86,
    skills: ["React", "CSS", "JavaScript", "Git"],
    description:
      "Develop responsive and user-friendly product interfaces.",
    url: "#",
  },
];

export default function JobRecommendations() {
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("All");
  const [search, setSearch] = useState("");

  const [resume, setResume] = useState("");
  const [file, setFile] = useState(null);

  const [jobs, setJobs] = useState([]);
  const [saved, setSaved] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("savedJobs") || "[]"
      );
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const displayedJobs = jobs.length ? jobs : demoJobs;

  const filteredJobs = useMemo(() => {
    return displayedJobs.filter((job) => {
      const q = search.toLowerCase().trim();

      const searchMatch =
        !q ||
        job.title?.toLowerCase().includes(q) ||
        job.company?.toLowerCase().includes(q) ||
        job.skills?.some((skill) =>
          skill.toLowerCase().includes(q)
        );

      const locationMatch =
        !location.trim() ||
        job.location
          ?.toLowerCase()
          .includes(location.toLowerCase().trim());

      const typeMatch =
        jobType === "All" ||
        job.type?.toLowerCase() === jobType.toLowerCase();

      return searchMatch && locationMatch && typeMatch;
    });
  }, [displayedJobs, search, location, jobType]);

  const uploadResume = async (selectedFile) => {
    if (!selectedFile) return;

    setFile(selectedFile);
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
      setError(err.message || "Resume processing failed.");
      setFile(null);
    }
  };

  const findJobs = async () => {
    if (!resume.trim()) {
      setError("Upload or paste your resume first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/ai/job-recommendations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            targetRole: role,
            location,
            jobType,
            resume,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || data?.success === false) {
        throw new Error(
          data?.message || "Unable to find recommended jobs."
        );
      }

      const result =
        data?.result ||
        data?.jobs ||
        data?.recommendations ||
        [];

      setJobs(
        Array.isArray(result)
          ? result
          : result?.jobs || []
      );
    } catch (err) {
      setError(err.message || "Job recommendation failed.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSave = (job) => {
    const exists = saved.some(
      (item) =>
        String(item.id || item.title) ===
        String(job.id || job.title)
    );

    const updated = exists
      ? saved.filter(
          (item) =>
            String(item.id || item.title) !==
            String(job.id || job.title)
        )
      : [...saved, job];

    setSaved(updated);
    localStorage.setItem(
      "savedJobs",
      JSON.stringify(updated)
    );
  };

  const isSaved = (job) =>
    saved.some(
      (item) =>
        String(item.id || item.title) ===
        String(job.id || job.title)
    );

  return (
    <main className="min-h-screen w-full bg-background px-5 py-5 text-foreground sm:px-6 sm:py-6 lg:px-7 lg:py-7">
      <div className="w-full">
        <BackButton />

        <section className="card mt-5">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="ai-badge mb-3 inline-flex items-center gap-2">
                <Sparkles size={14} />
                AI JOB DISCOVERY
              </div>

              <h1 className="text-3xl font-black sm:text-4xl">
                Recommended Jobs
              </h1>

              <p className="muted mt-3 max-w-4xl leading-7">
                Find actual job opportunities that match your
                resume, skills, preferred location and career
                direction.
              </p>
            </div>

            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border border-border bg-muted/30 text-primary ai-glow">
              <Briefcase size={42} />
            </div>
          </div>
        </section>

        <section className="card mt-5">
          <div className="grid gap-4 lg:grid-cols-4">
            <div>
              <label className="label">Job role</label>
              <input
                className="input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Software Engineer"
              />
            </div>

            <div>
              <label className="label">Location</label>
              <input
                className="input"
                value={location}
                onChange={(e) =>
                  setLocation(e.target.value)
                }
                placeholder="Bengaluru / Remote"
              />
            </div>

            <div>
              <label className="label">Job type</label>
              <select
                className="input"
                value={jobType}
                onChange={(e) =>
                  setJobType(e.target.value)
                }
              >
                <option>All</option>
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Internship</option>
                <option>Contract</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/20 p-3 text-sm font-semibold">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={(e) =>
                    uploadResume(e.target.files?.[0])
                  }
                />
                <Upload size={17} />
                {file ? "Resume uploaded" : "Upload resume"}
              </label>
            </div>
          </div>

          {file && (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-muted/20 p-3">
              <span className="text-sm font-semibold">
                {file.name}
              </span>

              <button
                className="nav-btn"
                onClick={() => {
                  setFile(null);
                  setResume("");
                }}
              >
                <X size={16} />
              </button>
            </div>
          )}

          <textarea
            className="textarea mt-4 min-h-[100px]"
            value={resume}
            onChange={(e) => setResume(e.target.value)}
            placeholder="Or paste your resume text..."
          />

          {error && (
            <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <button
            className="btn btn-primary mt-4"
            onClick={findJobs}
            disabled={loading}
          >
            <Sparkles size={17} />
            {loading ? "Finding jobs..." : "Find Recommended Jobs"}
          </button>
        </section>

        <section className="mt-5">
          <div className="card">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-2xl font-black">
                  Jobs matched to you
                </h2>
                <p className="muted mt-1">
                  Compare opportunities and save the ones you want
                  to pursue.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="relative">
                  <Search
                    size={16}
                    className="muted absolute left-3 top-1/2 -translate-y-1/2"
                  />
                  <input
                    className="input pl-9"
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    placeholder="Search jobs..."
                  />
                </div>

                <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/20 px-4 text-sm">
                  <Filter size={15} />
                  {filteredJobs.length} jobs
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            {filteredJobs.map((job) => (
              <article
                key={job.id || job.title}
                className="card transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Building2 size={22} />
                    </div>

                    <div>
                      <h3 className="text-xl font-bold">
                        {job.title}
                      </h3>

                      <p className="muted mt-1 text-sm">
                        {job.company}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-black text-primary">
                      {job.matchScore || job.score || 0}%
                    </p>
                    <p className="muted text-xs">
                      match
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin size={15} className="text-primary" />
                    {job.location || "Location not specified"}
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase
                      size={15}
                      className="text-primary"
                    />
                    {job.type || "Full-time"}
                  </div>

                  <div className="text-sm font-semibold">
                    {job.salary || "Salary not specified"}
                  </div>
                </div>

                <p className="muted mt-5 text-sm leading-6">
                  {job.description ||
                    job.reason ||
                    "Recommended because your profile matches this opportunity."}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {(job.skills || []).map((skill) => (
                    <span className="chip" key={skill}>
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="mt-5 flex gap-3">
                  <button
                    className="btn btn-secondary flex-1"
                    onClick={() => toggleSave(job)}
                  >
                    {isSaved(job) ? (
                      <BookmarkCheck size={17} />
                    ) : (
                      <Bookmark size={17} />
                    )}
                    {isSaved(job) ? "Saved" : "Save Job"}
                  </button>

                  <a
                    href={job.url || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary flex-1"
                  >
                    Apply Now
                    <ExternalLink size={16} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}