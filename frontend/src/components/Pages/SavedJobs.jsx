import React, { useMemo, useState } from "react";
import {
  BookmarkCheck,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  Filter,
  MapPin,
  Search,
  Trash2,
  X,
  Clock3,
  IndianRupee,
  Monitor,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import BackButton from "../BackButton";
import { getToken } from "../../lib/auth";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:4000"
)
  .trim()
  .replace(/\/+$/, "")
  .replace(/^http:\/\/localhost(?=[:/]|$)/i, "http://127.0.0.1");

const STORAGE_KEY = "savedJobs";

const STATUS_OPTIONS = [
  "Saved",
  "Applied",
  "Interview",
  "Rejected",
];

/* ============================================================
   HELPERS
   ============================================================ */

function readSavedJobs() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to read saved jobs:", error);
    return [];
  }
}

function getJobUrl(job) {
  const urls = [
    job?.applyUrl,
    job?.employerUrl,
    job?.sourceUrl,
    job?.url,
    job?.redirect_url,
    job?.linkedinUrl,
  ];

  for (const url of urls) {
    if (!url) continue;

    try {
      const parsed = new URL(url);

      if (
        parsed.protocol === "http:" ||
        parsed.protocol === "https:"
      ) {
        return url;
      }
    } catch {
      // Ignore invalid URLs
    }
  }

  return "";
}

function getJobStatus(job) {
  const value = job?.applicationStatus;

  return STATUS_OPTIONS.includes(value)
    ? value
    : "Saved";
}

function getMatchScore(job) {
  const value =
    job?.matchScore ??
    job?.score ??
    job?.match ??
    null;

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return Math.max(
    0,
    Math.min(100, Math.round(number))
  );
}

function getPostedDate(job) {
  return (
    job?.posted ||
    job?.postedAgo ||
    job?.created ||
    ""
  );
}

function getJobTimestamp(job) {
  const dates = [
    job?.savedAt,
    job?.createdAt,
    job?.updatedAt,
    job?.created,
  ];

  for (const date of dates) {
    if (!date) continue;

    const timestamp = new Date(date).getTime();

    if (Number.isFinite(timestamp)) {
      return timestamp;
    }
  }

  return 0;
}

function isRemoteJob(job) {
  if (
    job?.remote === true ||
    job?.remote === "true" ||
    job?.remote === 1 ||
    job?.remote === "1"
  ) {
    return true;
  }

  const text = [
    job?.title,
    job?.description,
    job?.location,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    text.includes("remote") ||
    text.includes("work from home") ||
    text.includes("wfh")
  );
}

function formatSalary(job) {
  if (job?.salary) {
    return String(job.salary);
  }

  const min = Number(
    job?.salaryMin ?? job?.salary_min
  );

  const max = Number(
    job?.salaryMax ?? job?.salary_max
  );

  if (
    !Number.isFinite(min) &&
    !Number.isFinite(max)
  ) {
    return "";
  }

  const currency = job?.currency || "₹";

  const formatNumber = (value) =>
    new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0,
    }).format(value);

  if (
    Number.isFinite(min) &&
    Number.isFinite(max) &&
    min > 0 &&
    max > 0
  ) {
    return `${currency}${formatNumber(
      min
    )} - ${currency}${formatNumber(max)}`;
  }

  if (
    Number.isFinite(min) &&
    min > 0
  ) {
    return `From ${currency}${formatNumber(min)}`;
  }

  if (
    Number.isFinite(max) &&
    max > 0
  ) {
    return `Up to ${currency}${formatNumber(max)}`;
  }

  return "";
}

function normalizeSearchText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getStatusClass(status) {
  if (status === "Applied") {
    return "border-primary/20 bg-primary/10 text-primary";
  }

  if (status === "Interview") {
    return "border-primary/30 bg-primary/15 text-primary";
  }

  if (status === "Rejected") {
    return "border-destructive/20 bg-destructive/10 text-destructive";
  }

  return "border-border bg-muted/30 text-foreground";
}

/* ============================================================
   COMPONENT
   ============================================================ */

export default function SavedJobs() {
  const [jobs, setJobs] = useState(readSavedJobs);

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("All");

  const [sortBy, setSortBy] = useState("Newest");

  const [showFilters, setShowFilters] = useState(false);

  const [selectedJob, setSelectedJob] = useState(null);

  const [showClearConfirm, setShowClearConfirm] =
    useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    fetch(`${API_URL}/api/jobs/saved`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && Array.isArray(data.data)) {
          const formatted = data.data.map((item) => ({
            id: item.jobId,
            jobId: item.jobId,
            title: item.title,
            company: item.company,
            location: item.location,
            salary: item.salary,
            applyUrl: item.applyUrl,
            description: item.description,
            applicationStatus: item.applicationStatus,
            savedAt: item.savedAt,
            ...(item.jobData || {}),
          }));
          setJobs(formatted);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(formatted));
        }
      })
      .catch(() => {});
  }, []);

  /* ==========================================================
     STORAGE
     ========================================================== */

  const saveJobs = (nextJobs) => {
    setJobs(nextJobs);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(nextJobs)
    );

    window.dispatchEvent(new Event("storage"));
  };

  /* ==========================================================
     FILTER + SORT
     ========================================================== */

  const filteredJobs = useMemo(() => {
    const query = normalizeSearchText(search);

    let result = jobs.filter((job) => {
      const skills = Array.isArray(job?.skills)
        ? job.skills.join(" ")
        : "";

      const searchableText = [
        job?.title,
        job?.company,
        job?.location,
        job?.description,
        skills,
        job?.jobType,
        job?.contractTime,
      ]
        .filter(Boolean)
        .join(" ");

      const matchesSearch =
        !query ||
        normalizeSearchText(searchableText).includes(
          query
        );

      const currentStatus = getJobStatus(job);

      const matchesStatus =
        status === "All" ||
        currentStatus === status;

      return matchesSearch && matchesStatus;
    });

    result = [...result];

    if (sortBy === "Company") {
      result.sort((a, b) =>
        normalizeSearchText(a?.company).localeCompare(
          normalizeSearchText(b?.company)
        )
      );
    } else if (sortBy === "Match") {
      result.sort(
        (a, b) =>
          (getMatchScore(b) ?? -1) -
          (getMatchScore(a) ?? -1)
      );
    } else if (sortBy === "Status") {
      result.sort((a, b) =>
        getJobStatus(a).localeCompare(
          getJobStatus(b)
        )
      );
    } else {
      result.sort(
        (a, b) =>
          getJobTimestamp(b) -
          getJobTimestamp(a)
      );
    }

    return result;
  }, [
    jobs,
    search,
    status,
    sortBy,
  ]);

  /* ==========================================================
     UPDATE STATUS
     ========================================================== */

  const updateStatus = (job, nextStatus) => {
    const nextJobs = jobs.map((item) => {
      if (
        String(item.id) !==
        String(job.id)
      ) {
        return item;
      }

      return {
        ...item,
        applicationStatus: nextStatus,
        updatedAt: new Date().toISOString(),
      };
    });

    saveJobs(nextJobs);

    const token = getToken();
    if (token) {
      fetch(`${API_URL}/api/jobs/saved/${encodeURIComponent(job.id || job.jobId)}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      }).catch((err) => console.error("Failed to update status on server:", err));
    }

    if (
      selectedJob &&
      String(selectedJob.id) ===
        String(job.id)
    ) {
      setSelectedJob({
        ...selectedJob,
        applicationStatus: nextStatus,
      });
    }
  };

  /* ==========================================================
     REMOVE JOB
     ========================================================== */

  const removeJob = (job) => {
    const confirmed = window.confirm(
      `Remove "${
        job?.title || "this job"
      }" from saved jobs?`
    );

    if (!confirmed) {
      return;
    }

    const nextJobs = jobs.filter(
      (item) =>
        String(item.id) !==
        String(job.id)
    );

    saveJobs(nextJobs);

    const token = getToken();
    if (token) {
      fetch(`${API_URL}/api/jobs/saved/${encodeURIComponent(job.id || job.jobId)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).catch((err) => console.error("Failed to delete saved job on server:", err));
    }

    if (
      selectedJob &&
      String(selectedJob.id) ===
        String(job.id)
    ) {
      setSelectedJob(null);
    }
  };

  /* ==========================================================
     CLEAR ALL
     ========================================================== */

  const clearAllJobs = () => {
    saveJobs([]);

    setSelectedJob(null);
    setShowClearConfirm(false);
  };

  /* ==========================================================
     RESET FILTERS
     ========================================================== */

  const resetFilters = () => {
    setSearch("");
    setStatus("All");
    setSortBy("Newest");
  };

  /* ==========================================================
     OPEN JOB
     ========================================================== */

  const openJob = (job) => {
    const url = getJobUrl(job);

    if (!url) {
      window.alert(
        "This saved job does not have a valid application link."
      );

      return;
    }

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  /* ==========================================================
     COUNTS
     ========================================================== */

  const savedCount = jobs.length;

  const appliedCount = jobs.filter(
    (job) =>
      getJobStatus(job) === "Applied"
  ).length;

  const interviewCount = jobs.filter(
    (job) =>
      getJobStatus(job) === "Interview"
  ).length;

  const rejectedCount = jobs.filter(
    (job) =>
      getJobStatus(job) === "Rejected"
  ).length;

  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <>
      <style>{`
        /* ======================================================
           PAGE
        ====================================================== */

        .saved-jobs-page {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          overflow-x: hidden !important;
        }

        /* ======================================================
           JOB GRID
        ====================================================== */

        .saved-jobs-page .saved-jobs-grid {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) !important;
          gap: 20px !important;
        }

        @media (min-width: 1280px) {
          .saved-jobs-page .saved-jobs-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr)) !important;
          }
        }

        /* ======================================================
           CARD
        ====================================================== */

        .saved-jobs-page .saved-job-card {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          overflow: hidden !important;
        }

        /* ======================================================
           HEADER

           This uses GRID instead of FLEX so the text area
           cannot collapse to a tiny width.
        ====================================================== */

        .saved-jobs-page .saved-job-header {
          display: grid !important;
          grid-template-columns:
            minmax(0, 1fr) 44px !important;
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          column-gap: 16px !important;
          align-items: start !important;
        }

        .saved-jobs-page .saved-job-content {
          display: block !important;
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          overflow: visible !important;
        }

        /* ======================================================
           TITLE
        ====================================================== */

        .saved-jobs-page .saved-job-title {
          display: block !important;

          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;

          margin: 12px 0 0 0 !important;

          word-break: normal !important;
          overflow-wrap: break-word !important;
          white-space: normal !important;

          hyphens: none !important;

          writing-mode: horizontal-tb !important;
          text-orientation: mixed !important;
          direction: ltr !important;

          text-align: left !important;

          line-height: 1.75rem !important;
        }

        /* ======================================================
           COMPANY
        ====================================================== */

        .saved-jobs-page .saved-job-company {
          display: block !important;

          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;

          word-break: normal !important;
          overflow-wrap: break-word !important;
          white-space: normal !important;

          writing-mode: horizontal-tb !important;
          direction: ltr !important;

          text-align: left !important;
        }

        /* ======================================================
           LOCATION
        ====================================================== */

        .saved-jobs-page .saved-job-location {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;

          word-break: normal !important;
          overflow-wrap: break-word !important;
          white-space: normal !important;

          writing-mode: horizontal-tb !important;
          direction: ltr !important;

          text-align: left !important;
        }

        /* ======================================================
           DESCRIPTION
        ====================================================== */

        .saved-jobs-page .saved-job-description {
          display: block !important;

          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;

          word-break: normal !important;
          overflow-wrap: break-word !important;
          white-space: normal !important;

          writing-mode: horizontal-tb !important;
          direction: ltr !important;
        }

        /* ======================================================
           SKILLS
        ====================================================== */

        .saved-jobs-page .saved-job-skill {
          word-break: normal !important;
          overflow-wrap: break-word !important;
          white-space: normal !important;

          writing-mode: horizontal-tb !important;
          direction: ltr !important;
        }

        /* ======================================================
           SEARCH AREA
        ====================================================== */

        .saved-jobs-page .saved-search-wrapper {
          position: relative !important;
          width: 100% !important;
          min-width: 0 !important;
          flex: 1 1 auto !important;
        }

        /*
         * IMPORTANT SEARCH FIX:
         *
         * The global .input class is apparently overriding
         * Tailwind's pl-10. We therefore force the padding
         * here.
         */

        .saved-jobs-page .saved-search-input {
          display: block !important;

          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;

          box-sizing: border-box !important;

          padding-left: 48px !important;
          padding-right: 16px !important;

          text-indent: 0 !important;

          word-break: normal !important;
          overflow-wrap: normal !important;
          white-space: nowrap !important;
        }

        .saved-jobs-page .saved-search-input::placeholder {
          padding-left: 0 !important;
          text-indent: 0 !important;

          word-break: normal !important;
          overflow-wrap: normal !important;
          white-space: nowrap !important;
        }

        .saved-jobs-page .saved-search-icon {
          position: absolute !important;

          left: 16px !important;
          right: auto !important;
          top: 50% !important;

          width: 17px !important;
          height: 17px !important;

          transform: translateY(-50%) !important;

          pointer-events: none !important;

          z-index: 20 !important;

          display: block !important;
        }

        /* ======================================================
           ACTIONS
        ====================================================== */

        .saved-jobs-page .saved-job-actions {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
        }

        .saved-jobs-page .saved-job-actions > * {
          min-width: 0 !important;
        }

        /* ======================================================
           MOBILE
        ====================================================== */

        @media (max-width: 640px) {
          .saved-jobs-page {
            overflow-x: hidden !important;
          }

          .saved-jobs-page .saved-job-header {
            grid-template-columns:
              minmax(0, 1fr) 40px !important;

            column-gap: 10px !important;
          }

          .saved-jobs-page .saved-search-input {
            padding-left: 46px !important;
          }

          .saved-jobs-page .saved-search-icon {
            left: 15px !important;
          }
        }
      `}</style>

      <main className="saved-jobs-page min-h-screen w-full bg-background px-5 py-5 text-foreground sm:px-6 sm:py-6 lg:px-7 lg:py-7">
        <div className="w-full min-w-0">

          {/* ==================================================
              BACK
          ================================================== */}

          <BackButton />

          {/* ==================================================
              HEADER
          ================================================== */}

          <section className="card mt-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              <div className="min-w-0 flex-1">

                <div className="ai-badge mb-3 inline-flex items-center gap-2">
                  <BookmarkCheck size={14} />
                  JOB TRACKER
                </div>

                <h1 className="text-3xl font-black sm:text-4xl">
                  Saved Jobs
                </h1>

                <p className="muted mt-3 max-w-3xl leading-7">
                  Keep track of interesting
                  opportunities, manage your
                  applications, and update each
                  job as you move through the
                  hiring process.
                </p>

              </div>

              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border border-border bg-muted/30 text-primary">
                <Briefcase size={35} />
              </div>

            </div>
          </section>

          {/* ==================================================
              STATISTICS
          ================================================== */}

          <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {/* SAVED */}

            <div className="card">
              <div className="flex items-center justify-between">

                <div>
                  <p className="muted text-sm">
                    Saved
                  </p>

                  <p className="mt-2 text-3xl font-black">
                    {savedCount}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BookmarkCheck size={20} />
                </div>

              </div>
            </div>

            {/* APPLIED */}

            <div className="card">
              <div className="flex items-center justify-between">

                <div>
                  <p className="muted text-sm">
                    Applied
                  </p>

                  <p className="mt-2 text-3xl font-black">
                    {appliedCount}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CheckCircle2 size={20} />
                </div>

              </div>
            </div>

            {/* INTERVIEWS */}

            <div className="card">
              <div className="flex items-center justify-between">

                <div>
                  <p className="muted text-sm">
                    Interviews
                  </p>

                  <p className="mt-2 text-3xl font-black">
                    {interviewCount}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Briefcase size={20} />
                </div>

              </div>
            </div>

            {/* REJECTED */}

            <div className="card">
              <div className="flex items-center justify-between">

                <div>
                  <p className="muted text-sm">
                    Rejected
                  </p>

                  <p className="mt-2 text-3xl font-black">
                    {rejectedCount}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                  <X size={20} />
                </div>

              </div>
            </div>

          </section>

          {/* ==================================================
              SEARCH + FILTER
          ================================================== */}

          <section className="card mt-5">

            <div className="flex flex-col gap-3 lg:flex-row">

              {/* SEARCH */}

              <div className="saved-search-wrapper">

                <Search
                  size={17}
                  aria-hidden="true"
                  className="saved-search-icon text-muted-foreground"
                />

                <input
                  type="text"
                  className="saved-search-input input"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search by job title, company, location, or skill..."
                />

              </div>

              {/* FILTER BUTTON */}

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() =>
                  setShowFilters(
                    (value) => !value
                  )
                }
              >
                <Filter size={16} />

                Filters

                <ChevronDown
                  size={15}
                  className={
                    showFilters
                      ? "rotate-180 transition-transform"
                      : "transition-transform"
                  }
                />
              </button>

              {/* CLEAR ALL */}

              {jobs.length > 0 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    setShowClearConfirm(true)
                  }
                >
                  <Trash2 size={16} />
                  Clear All
                </button>
              )}

            </div>

            {/* FILTER PANEL */}

            {showFilters && (
              <div className="mt-4 grid gap-4 border-t border-border pt-4 md:grid-cols-2">

                <div>
                  <label className="label">
                    Application Status
                  </label>

                  <select
                    className="input"
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value)
                    }
                  >
                    <option value="All">
                      All statuses
                    </option>

                    {STATUS_OPTIONS.map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="label">
                    Sort By
                  </label>

                  <select
                    className="input"
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value)
                    }
                  >
                    <option value="Newest">
                      Newest Saved
                    </option>

                    <option value="Match">
                      Highest Match
                    </option>

                    <option value="Company">
                      Company
                    </option>

                    <option value="Status">
                      Application Status
                    </option>
                  </select>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:col-span-2">

                  <p className="muted text-sm">
                    Showing{" "}
                    <span className="font-semibold text-foreground">
                      {filteredJobs.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-foreground">
                      {jobs.length}
                    </span>{" "}
                    saved jobs
                  </p>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={resetFilters}
                  >
                    <RotateCcw size={15} />
                    Reset
                  </button>

                </div>

              </div>
            )}

          </section>

          {/* ==================================================
              CLEAR ALL CONFIRMATION
          ================================================== */}

          {showClearConfirm && (
            <section className="card mt-5 border-destructive/30">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <h2 className="font-bold">
                    Clear all saved jobs?
                  </h2>

                  <p className="muted mt-1 text-sm">
                    This will remove all saved
                    jobs from this browser.
                  </p>
                </div>

                <div className="flex gap-2">

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() =>
                      setShowClearConfirm(false)
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="btn bg-destructive text-destructive-foreground"
                    onClick={clearAllJobs}
                  >
                    <Trash2 size={15} />
                    Clear All
                  </button>

                </div>

              </div>

            </section>
          )}

          {/* ==================================================
              EMPTY STATE
          ================================================== */}

          {jobs.length === 0 ? (

            <section className="card mt-5 py-20 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <BookmarkCheck size={32} />
              </div>

              <h2 className="mt-5 text-xl font-bold">
                No saved jobs yet
              </h2>

              <p className="muted mx-auto mt-2 max-w-lg text-sm leading-6">
                Jobs you save from the
                Recommended Jobs page will
                appear here.
              </p>

            </section>

          ) : filteredJobs.length === 0 ? (

            <section className="card mt-5 py-20 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/40 text-muted-foreground">
                <Search size={30} />
              </div>

              <h2 className="mt-5 text-xl font-bold">
                No matching jobs
              </h2>

              <p className="muted mx-auto mt-2 max-w-lg text-sm">
                Try a different search term or
                change your filters.
              </p>

              <button
                type="button"
                className="btn btn-secondary mx-auto mt-5"
                onClick={resetFilters}
              >
                <RotateCcw size={15} />
                Reset Filters
              </button>

            </section>

          ) : (

            /* ==================================================
               JOB GRID
            ================================================== */

            <section className="saved-jobs-grid mt-5">

              {filteredJobs.map(
                (job, index) => {

                  const score =
                    getMatchScore(job);

                  const currentStatus =
                    getJobStatus(job);

                  const salary =
                    formatSalary(job);

                  const posted =
                    getPostedDate(job);

                  const remote =
                    isRemoteJob(job);

                  const jobUrl =
                    getJobUrl(job);

                  const skills =
                    Array.isArray(job?.skills)
                      ? job.skills
                      : [];

                  return (
                    <article
                      key={
                        job?.id ??
                        `${job?.title}-${job?.company}-${index}`
                      }
                      className="saved-job-card card"
                    >

                      {/* ======================================
                          HEADER
                      ====================================== */}

                      <div className="saved-job-header">

                        {/* CONTENT */}

                        <div className="saved-job-content">

                          {/* STATUS */}

                          <div className="flex flex-wrap items-center gap-2">

                            <span
                              className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                                currentStatus
                              )}`}
                            >
                              {currentStatus}
                            </span>

                            {remote && (
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-muted/30 px-2.5 py-1 text-xs font-medium">
                                <Monitor size={12} />
                                Remote
                              </span>
                            )}

                          </div>

                          {/* TITLE */}

                          <h2 className="saved-job-title text-xl font-bold">
                            {String(
                              job?.title ||
                              "Untitled Job"
                            )}
                          </h2>

                          {/* COMPANY */}

                          <p className="saved-job-company muted text-base">
                            {String(
                              job?.company ||
                              "Company not specified"
                            )}
                          </p>

                          {/* LOCATION */}

                          {job?.location && (
                            <div className="saved-job-location muted mt-2 flex items-start gap-1.5 text-sm">

                              <MapPin
                                size={14}
                                className="mt-0.5 shrink-0"
                              />

                              <span>
                                {String(
                                  job.location
                                )}
                              </span>

                            </div>
                          )}

                        </div>

                        {/* DELETE */}

                        <button
                          type="button"
                          className="nav-btn"
                          onClick={() =>
                            removeJob(job)
                          }
                          title="Remove saved job"
                          aria-label="Remove saved job"
                        >
                          <Trash2
                            size={17}
                            className="text-destructive"
                          />
                        </button>

                      </div>

                      {/* ======================================
                          META
                      ====================================== */}

                      <div className="mt-5 flex flex-wrap gap-2">

                        {salary && (
                          <span className="chip inline-flex items-center gap-1.5">
                            <IndianRupee size={13} />

                            <span>
                              {salary.replace(
                                /^₹/,
                                ""
                              )}
                            </span>
                          </span>
                        )}

                        {job?.jobType && (
                          <span className="chip">
                            {job.jobType}
                          </span>
                        )}

                        {job?.contractTime && (
                          <span className="chip">
                            {job.contractTime}
                          </span>
                        )}

                        {posted && (
                          <span className="chip inline-flex items-center gap-1.5">
                            <Clock3 size={13} />

                            <span>
                              {String(posted)}
                            </span>
                          </span>
                        )}

                      </div>

                      {/* ======================================
                          SKILLS
                      ====================================== */}

                      {skills.length > 0 && (
                        <div className="mt-5">

                          <p className="muted mb-2 text-xs font-semibold uppercase tracking-wider">
                            Skills
                          </p>

                          <div className="flex flex-wrap gap-2">

                            {skills
                              .slice(0, 10)
                              .map(
                                (
                                  skill,
                                  skillIndex
                                ) => (
                                  <span
                                    className="saved-job-skill chip"
                                    key={`${skill}-${skillIndex}`}
                                  >
                                    {String(skill)}
                                  </span>
                                )
                              )}

                            {skills.length > 10 && (
                              <span className="chip">
                                +
                                {skills.length - 10}{" "}
                                more
                              </span>
                            )}

                          </div>

                        </div>
                      )}

                      {/* ======================================
                          DESCRIPTION
                      ====================================== */}

                      {job?.description && (
                        <div className="mt-5 rounded-xl border border-border bg-muted/20 p-4">

                          <p className="saved-job-description line-clamp-3 text-sm leading-6">
                            {String(
                              job.description
                            )}
                          </p>

                          <button
                            type="button"
                            className="mt-2 text-sm font-semibold text-primary hover:underline"
                            onClick={() =>
                              setSelectedJob(job)
                            }
                          >
                            View details
                          </button>

                        </div>
                      )}

                      {/* ======================================
                          STATUS + MATCH
                      ====================================== */}

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">

                        <div className="min-w-0">

                          <label className="label">
                            Application Status
                          </label>

                          <select
                            className="input"
                            value={currentStatus}
                            onChange={(e) =>
                              updateStatus(
                                job,
                                e.target.value
                              )
                            }
                          >
                            {STATUS_OPTIONS.map(
                              (option) => (
                                <option
                                  key={option}
                                  value={option}
                                >
                                  {option}
                                </option>
                              )
                            )}
                          </select>

                        </div>

                        <div className="min-w-0 rounded-xl border border-border bg-muted/20 p-4">

                          <p className="muted text-xs">
                            Resume Match
                          </p>

                          <p className="mt-1 text-xl font-black text-primary">
                            {score !== null
                              ? `${score}%`
                              : "—"}
                          </p>

                        </div>

                      </div>

                      {/* ======================================
                          ACTIONS
                      ====================================== */}

                      <div className="saved-job-actions mt-5 flex flex-col gap-3 sm:flex-row">

                        <button
                          type="button"
                          className="btn btn-primary flex-1"
                          onClick={() =>
                            openJob(job)
                          }
                          disabled={!jobUrl}
                        >
                          <ExternalLink size={16} />

                          {jobUrl
                            ? "Open Job"
                            : "No Job Link"}
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() =>
                            setSelectedJob(job)
                          }
                        >
                          View Details
                        </button>

                      </div>

                    </article>
                  );
                }
              )}

            </section>
          )}

          {/* ==================================================
              FOOTER
          ================================================== */}

          {jobs.length > 0 && (
            <section className="card mt-5">

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-center gap-2">

                  <BookmarkCheck
                    size={16}
                    className="text-primary"
                  />

                  <p className="text-sm font-medium">
                    Your saved jobs are stored
                    locally in this browser.
                  </p>

                </div>

                <p className="muted text-xs">
                  {filteredJobs.length}{" "}
                  currently visible
                </p>

              </div>

            </section>
          )}

        </div>
      </main>

      {/* ========================================================
          DETAILS MODAL
      ======================================================== */}

      {selectedJob && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedJob(null);
            }
          }}
        >

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-background shadow-2xl">

            {/* MODAL HEADER */}

            <div className="grid grid-cols-[minmax(0,1fr)_40px] gap-4 border-b border-border bg-background p-5">

              <div className="min-w-0">

                <div className="mb-2 flex flex-wrap gap-2">

                  <span
                    className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                      getJobStatus(
                        selectedJob
                      )
                    )}`}
                  >
                    {getJobStatus(
                      selectedJob
                    )}
                  </span>

                  {isRemoteJob(
                    selectedJob
                  ) && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-muted/30 px-2.5 py-1 text-xs font-medium">
                      <Monitor size={12} />
                      Remote
                    </span>
                  )}

                </div>

                <h2 className="saved-job-title text-2xl font-black">
                  {String(
                    selectedJob?.title ||
                    "Untitled Job"
                  )}
                </h2>

                <p className="saved-job-company muted mt-1">
                  {String(
                    selectedJob?.company ||
                    "Company not specified"
                  )}
                </p>

              </div>

              <button
                type="button"
                className="nav-btn"
                onClick={() =>
                  setSelectedJob(null)
                }
                aria-label="Close details"
              >
                <X size={18} />
              </button>

            </div>

            {/* MODAL BODY */}

            <div className="space-y-5 p-5">

              {/* JOB INFORMATION */}

              <div className="grid gap-3 sm:grid-cols-2">

                {selectedJob?.location && (
                  <div className="rounded-xl border border-border bg-muted/20 p-4">

                    <p className="muted text-xs">
                      Location
                    </p>

                    <div className="saved-job-location mt-1 flex items-start gap-2 text-sm font-medium">

                      <MapPin
                        size={15}
                        className="mt-0.5 shrink-0 text-primary"
                      />

                      <span>
                        {String(
                          selectedJob.location
                        )}
                      </span>

                    </div>

                  </div>
                )}

                {formatSalary(
                  selectedJob
                ) && (
                  <div className="rounded-xl border border-border bg-muted/20 p-4">

                    <p className="muted text-xs">
                      Salary
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      {formatSalary(
                        selectedJob
                      )}
                    </p>

                  </div>
                )}

                {selectedJob?.jobType && (
                  <div className="rounded-xl border border-border bg-muted/20 p-4">

                    <p className="muted text-xs">
                      Job Type
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      {selectedJob.jobType}
                    </p>

                  </div>
                )}

                {getMatchScore(
                  selectedJob
                ) !== null && (
                  <div className="rounded-xl border border-border bg-muted/20 p-4">

                    <p className="muted text-xs">
                      Resume Match
                    </p>

                    <p className="mt-1 text-xl font-black text-primary">
                      {getMatchScore(
                        selectedJob
                      )}
                      %
                    </p>

                  </div>
                )}

              </div>

              {/* APPLICATION STATUS */}

              <div>

                <label className="label">
                  Application Status
                </label>

                <select
                  className="input"
                  value={getJobStatus(
                    selectedJob
                  )}
                  onChange={(e) =>
                    updateStatus(
                      selectedJob,
                      e.target.value
                    )
                  }
                >
                  {STATUS_OPTIONS.map(
                    (option) => (
                      <option
                        key={option}
                        value={option}
                      >
                        {option}
                      </option>
                    )
                  )}
                </select>

              </div>

              {/* SKILLS */}

              {Array.isArray(
                selectedJob?.skills
              ) &&
                selectedJob.skills.length >
                  0 && (
                  <div>

                    <p className="label">
                      Skills
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">

                      {selectedJob.skills.map(
                        (
                          skill,
                          index
                        ) => (
                          <span
                            className="saved-job-skill chip"
                            key={`${skill}-${index}`}
                          >
                            {String(skill)}
                          </span>
                        )
                      )}

                    </div>

                  </div>
                )}

              {/* DESCRIPTION */}

              {selectedJob?.description && (
                <div>

                  <p className="label">
                    Job Description
                  </p>

                  <div className="mt-2 rounded-xl border border-border bg-muted/20 p-4">

                    <p className="saved-job-description whitespace-pre-line text-sm leading-7">
                      {String(
                        selectedJob.description
                      )}
                    </p>

                  </div>

                </div>
              )}

              {/* MODAL ACTIONS */}

              <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row">

                <button
                  type="button"
                  className="btn btn-primary flex-1"
                  onClick={() =>
                    openJob(selectedJob)
                  }
                  disabled={
                    !getJobUrl(
                      selectedJob
                    )
                  }
                >
                  <ExternalLink size={16} />

                  {getJobUrl(
                    selectedJob
                  )
                    ? "Open Original Job"
                    : "No Job Link Available"}
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setSelectedJob(null);
                    removeJob(selectedJob);
                  }}
                >
                  <Trash2 size={16} />
                  Remove
                </button>

              </div>

            </div>

          </div>

        </div>
      )}
    </>
  );
}