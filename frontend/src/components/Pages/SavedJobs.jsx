import React, { useMemo, useState } from "react";
import {
  BookmarkCheck,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  Filter,
  Search,
  Trash2,
} from "lucide-react";
import BackButton from "../BackButton";

export default function SavedJobs() {
  const [jobs, setJobs] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("savedJobs") || "[]"
      );
    } catch {
      return [];
    }
  });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  const updateJobs = (next) => {
    setJobs(next);
    localStorage.setItem("savedJobs", JSON.stringify(next));
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const q = search.trim().toLowerCase();

      const searchMatch =
        !q ||
        job.title?.toLowerCase().includes(q) ||
        job.company?.toLowerCase().includes(q);

      const statusMatch =
        status === "All" ||
        (job.applicationStatus || "Saved") === status;

      return searchMatch && statusMatch;
    });
  }, [jobs, search, status]);

  const setJobStatus = (job, nextStatus) => {
    updateJobs(
      jobs.map((item) =>
        item.id === job.id
          ? { ...item, applicationStatus: nextStatus }
          : item
      )
    );
  };

  const removeJob = (job) => {
    updateJobs(
      jobs.filter((item) => item.id !== job.id)
    );
  };

  const savedCount = jobs.length;
  const appliedCount = jobs.filter(
    (job) => job.applicationStatus === "Applied"
  ).length;
  const interviewCount = jobs.filter(
    (job) => job.applicationStatus === "Interview"
  ).length;

  return (
    <main className="min-h-screen w-full bg-background px-5 py-5 text-foreground sm:px-6 sm:py-6 lg:px-7 lg:py-7">
      <div className="w-full">
        <BackButton />

        <section className="card mt-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="ai-badge mb-3 inline-flex items-center gap-2">
                <BookmarkCheck size={14} />
                JOB TRACKER
              </div>

              <h1 className="text-3xl font-black sm:text-4xl">
                Saved Jobs
              </h1>

              <p className="muted mt-3 max-w-3xl leading-7">
                Keep track of interesting opportunities and update
                their application status as you progress.
              </p>
            </div>

            <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-border bg-muted/30 text-primary">
              <Briefcase size={35} />
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="card">
            <p className="muted text-sm">Saved</p>
            <p className="mt-2 text-3xl font-black">
              {savedCount}
            </p>
          </div>

          <div className="card">
            <p className="muted text-sm">Applied</p>
            <p className="mt-2 text-3xl font-black">
              {appliedCount}
            </p>
          </div>

          <div className="card">
            <p className="muted text-sm">Interviews</p>
            <p className="mt-2 text-3xl font-black">
              {interviewCount}
            </p>
          </div>
        </section>

        <section className="card mt-5">
          <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
            <div className="relative">
              <Search
                size={17}
                className="muted absolute left-3 top-1/2 -translate-y-1/2"
              />
              <input
                className="input pl-10"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search saved jobs..."
              />
            </div>

            <select
              className="input"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value)
              }
            >
              <option>All</option>
              <option>Saved</option>
              <option>Applied</option>
              <option>Interview</option>
              <option>Rejected</option>
            </select>

            <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/20 px-4 text-sm">
              <Filter size={15} />
              {filteredJobs.length}
            </div>
          </div>
        </section>

        {filteredJobs.length === 0 ? (
          <section className="card mt-5 py-16 text-center">
            <BookmarkCheck
              size={42}
              className="mx-auto text-muted-foreground"
            />

            <h2 className="mt-4 text-xl font-bold">
              No saved jobs yet
            </h2>

            <p className="muted mx-auto mt-2 max-w-lg text-sm">
              Jobs you save from the Recommended Jobs page will
              appear here.
            </p>
          </section>
        ) : (
          <section className="mt-5 grid gap-5 xl:grid-cols-2">
            {filteredJobs.map((job) => (
              <article key={job.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">
                      {job.title}
                    </h2>

                    <p className="muted mt-1">
                      {job.company}
                    </p>

                    <p className="muted mt-2 text-sm">
                      {job.location}
                    </p>
                  </div>

                  <button
                    className="nav-btn"
                    onClick={() => removeJob(job)}
                    title="Remove job"
                  >
                    <Trash2
                      size={17}
                      className="text-destructive"
                    />
                  </button>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {(job.skills || []).map((skill) => (
                    <span className="chip" key={skill}>
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label">
                      Application status
                    </label>

                    <select
                      className="input"
                      value={
                        job.applicationStatus || "Saved"
                      }
                      onChange={(e) =>
                        setJobStatus(job, e.target.value)
                      }
                    >
                      <option>Saved</option>
                      <option>Applied</option>
                      <option>Interview</option>
                      <option>Rejected</option>
                    </select>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/20 p-4">
                    <p className="muted text-xs">
                      Match
                    </p>

                    <p className="mt-1 text-xl font-black text-primary">
                      {job.matchScore ||
                        job.score ||
                        "—"}
                      {job.matchScore || job.score
                        ? "%"
                        : ""}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex gap-3">
                  <a
                    href={job.url || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary flex-1"
                  >
                    Open Job
                    <ExternalLink size={16} />
                  </a>

                  <div className="btn btn-secondary">
                    <CheckCircle2 size={16} />
                    {job.applicationStatus || "Saved"}
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}