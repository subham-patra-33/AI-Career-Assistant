import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Bookmark,
  BookmarkCheck,
  BriefcaseBusiness,
  Building2,
  ExternalLink,
  Filter,
  MapPin,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";

import BackButton from "../BackButton";
import { getToken } from "../../lib/auth";

/* ============================================================
   API CONFIGURATION
   ============================================================ */

/*
 * Backend default port in this project is 4000.
 *
 * We prefer VITE_API_URL when it exists.
 * Otherwise use 127.0.0.1 instead of localhost.
 *
 * 127.0.0.1 avoids some localhost IPv4/IPv6 issues on
 * macOS + Chromium/Brave environments.
 */
const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:4000"
)
  .trim()
  .replace(/\/+$/, "")
  .replace(
    /^http:\/\/localhost(?=[:/]|$)/i,
    "http://127.0.0.1"
  );

const JOBS_ENDPOINT =
  `${API_URL}/api/ai/jobs`;

const SAVED_JOBS_KEY =
  "savedJobs";

/* ============================================================
   FILTER OPTIONS
   ============================================================ */

const JOB_TYPES = [
  {
    value: "all",
    label: "All job types",
  },
  {
    value: "full_time",
    label: "Full-time",
  },
  {
    value: "part_time",
    label: "Part-time",
  },
  {
    value: "contract",
    label: "Contract",
  },
  {
    value: "permanent",
    label: "Permanent",
  },
];

const POSTED_OPTIONS = [
  {
    value: "all",
    label: "Any time",
  },
  {
    value: "1",
    label: "Past 24 hours",
  },
  {
    value: "3",
    label: "Past 3 days",
  },
  {
    value: "7",
    label: "Past week",
  },
  {
    value: "14",
    label: "Past 2 weeks",
  },
  {
    value: "30",
    label: "Past month",
  },
];

const SORT_OPTIONS = [
  {
    value: "date",
    label: "Newest first",
  },
  {
    value: "relevance",
    label: "Most relevant",
  },
  {
    value: "salary",
    label: "Highest salary",
  },
];

/* ============================================================
   LOCAL STORAGE
   ============================================================ */

function readSavedJobs() {
  try {
    const stored =
      localStorage.getItem(
        SAVED_JOBS_KEY
      );

    if (!stored) {
      return [];
    }

    const parsed =
      JSON.parse(stored);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch (error) {
    console.error(
      "Failed to read saved jobs:",
      error
    );

    return [];
  }
}

/* ============================================================
   JOB HELPERS
   ============================================================ */

function getJobKey(job) {
  return String(
    job?.id ||
      job?.sourceId ||
      job?.applyUrl ||
      job?.sourceUrl ||
      `${job?.title || ""}-${job?.company || ""}-${job?.location || ""}`
  );
}

function formatPostedDate(
  dateValue
) {
  if (!dateValue) {
    return "Recently posted";
  }

  const date =
    new Date(dateValue);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Recently posted";
  }

  const diffMs =
    Date.now() -
    date.getTime();

  /*
   * If the provider gives a future timestamp because of
   * timezone/clock differences, don't display a negative
   * number.
   */
  if (diffMs < 0) {
    return "Recently posted";
  }

  const diffMinutes =
    Math.floor(
      diffMs / 60000
    );

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours =
    Math.floor(
      diffMinutes / 60
    );

  if (diffHours < 24) {
    return `${diffHours} hr ago`;
  }

  const diffDays =
    Math.floor(
      diffHours / 24
    );

  if (diffDays < 30) {
    return `${diffDays} day${
      diffDays === 1
        ? ""
        : "s"
    } ago`;
  }

  const diffMonths =
    Math.floor(
      diffDays / 30
    );

  return `${diffMonths} month${
    diffMonths === 1
      ? ""
      : "s"
  } ago`;
}

function formatSalary(job) {
  const min =
    Number(job?.salaryMin);

  const max =
    Number(job?.salaryMax);

  const hasMin =
    Number.isFinite(min) &&
    min > 0;

  const hasMax =
    Number.isFinite(max) &&
    max > 0;

  if (
    !hasMin &&
    !hasMax
  ) {
    return "";
  }

  const currency =
    job?.currency ||
    "₹";

  const formatter =
    new Intl.NumberFormat(
      "en-IN",
      {
        maximumFractionDigits: 0,
      }
    );

  if (
    hasMin &&
    hasMax
  ) {
    return `${currency}${formatter.format(
      min
    )} – ${currency}${formatter.format(
      max
    )}`;
  }

  if (hasMin) {
    return `${currency}${formatter.format(
      min
    )}+`;
  }

  return `${currency}${formatter.format(
    max
  )}`;
}

function cleanDescription(
  description = ""
) {
  return String(description)
    .replace(
      /<[^>]*>/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

function getInitials(
  name = ""
) {
  const words =
    String(name)
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (!words.length) {
    return "CO";
  }

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

/* ============================================================
   URL VALIDATION
   ============================================================ */

function getApplyUrl(job) {
  /*
   * Prefer the original employer/listing URL.
   *
   * Do NOT invent LinkedIn URLs.
   */
  const candidates = [
    job?.employerUrl,
    job?.applyUrl,
    job?.sourceUrl,
    job?.linkedinUrl,
  ];

  for (
    const candidate of candidates
  ) {
    if (
      typeof candidate !==
      "string"
    ) {
      continue;
    }

    const trimmed =
      candidate.trim();

    if (!trimmed) {
      continue;
    }

    try {
      const url =
        new URL(trimmed);

      if (
        url.protocol ===
          "http:" ||
        url.protocol ===
          "https:"
      ) {
        return url.toString();
      }
    } catch {
      // Ignore invalid URL.
    }
  }

  return "";
}

/* ============================================================
   NORMALIZE JOB
   ============================================================ */

function normalizeJob(job) {
  const postedAt =
    job?.postedAt ||
    job?.created ||
    null;

  return {
    ...job,

    id: getJobKey(job),

    title:
      String(
        job?.title || ""
      ).trim() ||
      "Untitled position",

    company:
      String(
        job?.company ||
          job?.companyName ||
          ""
      ).trim() ||
      "Company not specified",

    location:
      String(
        job?.location || ""
      ).trim() ||
      "Location not specified",

    description:
      cleanDescription(
        job?.description ||
          ""
      ),

    postedAt,

    postedAgo:
      job?.postedAgo ||
      formatPostedDate(
        postedAt
      ),

    skills:
      Array.isArray(
        job?.skills
      )
        ? job.skills.filter(
            Boolean
          )
        : [],

    salaryLabel:
      job?.salaryLabel ||
      formatSalary(job),

    applyUrl:
      getApplyUrl(job),

    remote:
      Boolean(job?.remote),

    source:
      job?.source ||
      "Adzuna",
  };
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function JobRecommendations() {
  const [role, setRole] =
    useState("");

  const [location, setLocation] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [jobType, setJobType] =
    useState("all");

  const [postedWithin, setPostedWithin] =
    useState("all");

  const [sortBy, setSortBy] =
    useState("date");

  const [remoteOnly, setRemoteOnly] =
    useState(false);

  const [jobs, setJobs] =
    useState([]);

  const [savedJobs, setSavedJobs] =
    useState(readSavedJobs);

  const [loading, setLoading] =
    useState(false);

  const [initialLoading, setInitialLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [searched, setSearched] =
    useState(false);

  const [totalJobs, setTotalJobs] =
    useState(0);

  const [page, setPage] =
    useState(1);

  const [showFilters, setShowFilters] =
    useState(false);

  const [hasMore, setHasMore] =
    useState(false);

  /* ==========================================================
     AUTH HEADERS
     ========================================================== */

  const authHeaders =
    useCallback(() => {
      const token =
        getToken();

      return {
        Accept:
          "application/json",

        ...(token
          ? {
              Authorization:
                `Bearer ${token}`,
            }
          : {}),
      };
    }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    fetch(`${API_URL}/api/jobs/saved`, {
      headers: authHeaders(),
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
          setSavedJobs(formatted);
          localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(formatted));
        }
      })
      .catch(() => {});
  }, [authHeaders]);

  /* ==========================================================
     FETCH JOBS
     ========================================================== */

  const fetchJobs =
    useCallback(
      async ({
        pageNumber = 1,
        append = false,
        useSearchValue = false,
      } = {}) => {
        setLoading(true);

        setError("");

        const controller =
          new AbortController();

        /*
         * Stop the request after 15 seconds.
         * This prevents the UI from hanging indefinitely.
         */
        const timeoutId =
          setTimeout(
            () => {
              controller.abort();
            },
            15000
          );

        try {
          const params =
            new URLSearchParams();

          /*
           * Search behavior:
           *
           * If user pressed Search:
           * search input → role fallback
           *
           * Initial load:
           * role only, normally empty.
           */
          const finalQuery =
            useSearchValue
              ? search.trim() ||
                role.trim()
              : role.trim();

          if (finalQuery) {
            params.set(
              "query",
              finalQuery
            );
          }

          if (
            location.trim()
          ) {
            params.set(
              "location",
              location.trim()
            );
          }

          if (
            jobType !== "all"
          ) {
            params.set(
              "jobType",
              jobType
            );
          }

          if (
            postedWithin !==
            "all"
          ) {
            params.set(
              "postedWithin",
              postedWithin
            );
          }

          if (remoteOnly) {
            params.set(
              "remote",
              "true"
            );
          }

          params.set(
            "sort",
            sortBy
          );

          params.set(
            "page",
            String(
              Math.max(
                1,
                pageNumber
              )
            )
          );

          params.set(
            "limit",
            "20"
          );

          const requestUrl =
            `${JOBS_ENDPOINT}?${params.toString()}`;

          console.log(
            "=========================================="
          );

          console.log(
            "🌐 JOB REQUEST"
          );

          console.log(
            "API:",
            requestUrl
          );

          console.log(
            "Token:",
            getToken()
              ? "available"
              : "missing"
          );

          console.log(
            "=========================================="
          );

          let response;

          /*
           * This catch is specifically for:
           *
           * Failed to fetch
           * NetworkError
           * ERR_CONNECTION_REFUSED
           * CORS/network failures
           */
          try {
            response =
              await fetch(
                requestUrl,
                {
                  method:
                    "GET",

                  headers:
                    authHeaders(),

                  signal:
                    controller.signal,
                }
              );
          } catch (
            networkError
          ) {
            console.error(
              "❌ FETCH COULD NOT REACH BACKEND"
            );

            console.error(
              "Backend URL:",
              requestUrl
            );

            console.error(
              "Error:",
              networkError
            );

            if (
              networkError?.name ===
              "AbortError"
            ) {
              throw new Error(
                `Job server did not respond within 15 seconds. Check that the backend is running at ${API_URL}.`
              );
            }

            throw new Error(
              `Cannot connect to the backend at ${API_URL}. Start the backend with "cd backend && npm run dev" and make sure it is running on port 4000.`
            );
          }

          console.log(
            "📡 HTTP STATUS:",
            response.status
          );

          const rawText =
            await response.text();

          console.log(
            "📦 RAW RESPONSE:",
            rawText.slice(
              0,
              1000
            )
          );

          let data = {};

          if (rawText.trim()) {
            try {
              data =
                JSON.parse(
                  rawText
                );
            } catch (
              parseError
            ) {
              console.error(
                "❌ Backend returned invalid JSON:",
                parseError
              );

              throw new Error(
                `Backend returned an invalid response. HTTP status: ${response.status}.`
              );
            }
          }

          /*
           * HTTP ERROR
           */
          if (
            !response.ok
          ) {
            console.error(
              "❌ JOB API HTTP ERROR:",
              {
                status:
                  response.status,
                data,
              }
            );

            if (
              response.status ===
              401
            ) {
              throw new Error(
                "Your session is missing or expired. Please log in again."
              );
            }

            if (
              response.status ===
              403
            ) {
              throw new Error(
                "The server denied access to the job search."
              );
            }

            if (
              response.status ===
              429
            ) {
              throw new Error(
                "The job provider rate limit has been reached. Please try again shortly."
              );
            }

            const providerStatus =
              data?.providerStatus
                ? ` Provider status: ${data.providerStatus}.`
                : "";

            throw new Error(
              `${
                data?.message ||
                data?.error ||
                `Job search failed with HTTP ${response.status}.`
              }${providerStatus}`
            );
          }

          /*
           * APPLICATION-LEVEL ERROR
           */
          if (
            data?.success ===
            false
          ) {
            throw new Error(
              data?.message ||
                data?.error ||
                "The job server returned an error."
            );
          }

          /*
           * NORMALIZE JOB RESULTS
           */
          const receivedJobs =
            Array.isArray(
              data?.jobs
            )
              ? data.jobs.map(
                  normalizeJob
                )
              : [];

          console.log(
            `✅ Received ${receivedJobs.length} jobs`
          );

          /*
           * Remove duplicates when loading more.
           */
          setJobs(
            (previous) => {
              const combined =
                append
                  ? [
                      ...previous,
                      ...receivedJobs,
                    ]
                  : receivedJobs;

              const unique =
                Array.from(
                  new Map(
                    combined.map(
                      (job) => [
                        getJobKey(
                          job
                        ),
                        job,
                      ]
                    )
                  ).values()
                );

              return unique;
            }
          );

          setTotalJobs(
            Number(
              data?.total || 0
            )
          );

          setHasMore(
            Boolean(
              data?.hasMore
            )
          );

          setPage(
            pageNumber
          );

          setSearched(
            true
          );
        } catch (err) {
          console.error(
            "❌ Job recommendations error:",
            err
          );

          setError(
            err?.message ||
              "Unable to load current jobs."
          );

          if (!append) {
            setJobs([]);
          }
        } finally {
          clearTimeout(
            timeoutId
          );

          setLoading(false);

          setInitialLoading(
            false
          );
        }
      },
      [
        authHeaders,
        jobType,
        location,
        postedWithin,
        remoteOnly,
        role,
        search,
        sortBy,
      ]
    );

  /* ==========================================================
     INITIAL LOAD
     ========================================================== */

  useEffect(() => {
    fetchJobs({
      pageNumber: 1,
      append: false,
      useSearchValue: false,
    });
  }, [fetchJobs]);

  /* ==========================================================
     SEARCH
     ========================================================== */

  const handleSearch =
    async (event) => {
      event?.preventDefault();

      await fetchJobs({
        pageNumber: 1,
        append: false,
        useSearchValue: true,
      });
    };

  /* ==========================================================
     REFRESH
     ========================================================== */

  const handleRefresh =
    async () => {
      await fetchJobs({
        pageNumber: 1,
        append: false,
        useSearchValue: true,
      });
    };

  /* ==========================================================
     LOAD MORE
     ========================================================== */

  const handleLoadMore =
    async () => {
      if (
        loading ||
        !hasMore
      ) {
        return;
      }

      await fetchJobs({
        pageNumber:
          page + 1,
        append: true,
        useSearchValue: true,
      });
    };

  /* ==========================================================
     SAVE / UNSAVE
     ========================================================== */

  const toggleSave =
    (job) => {
      const key =
        getJobKey(job);

      const alreadySaved =
        savedJobs.some(
          (savedJob) =>
            getJobKey(
              savedJob
            ) === key
        );

      const updated =
        alreadySaved
          ? savedJobs.filter(
              (savedJob) =>
                getJobKey(
                  savedJob
                ) !== key
            )
          : [
              ...savedJobs,
              job,
            ];

      setSavedJobs(
        updated
      );

      try {
        localStorage.setItem(
          SAVED_JOBS_KEY,
          JSON.stringify(
            updated
          )
        );
      } catch (storageError) {
        console.error(
          "Failed to save job:",
          storageError
        );
      }

      const token = getToken();
      if (token) {
        fetch(`${API_URL}/api/jobs/saved/toggle`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            jobId: key,
            title: job?.title || "",
            company: job?.company || "",
            location: job?.location || "",
            salary: job?.salary || "",
            applyUrl: job?.applyUrl || job?.url || "",
            description: job?.description || "",
            jobData: job,
          }),
        }).catch((err) => console.error("Failed to sync toggle saved job with backend:", err));
      }

      window.dispatchEvent(new Event("storage"));
    };

  const isSaved =
    (job) => {
      const key =
        getJobKey(job);

      return savedJobs.some(
        (savedJob) =>
          getJobKey(
            savedJob
          ) === key
      );
    };

  /* ==========================================================
     CLEAR FILTERS
     ========================================================== */

  const clearFilters =
    async () => {
      setSearch("");
      setRole("");
      setLocation("");
      setJobType("all");
      setPostedWithin("all");
      setSortBy("date");
      setRemoteOnly(false);

      /*
       * Use a direct request here instead of setTimeout.
       * This avoids relying on React state updates happening
       * before fetchJobs executes.
       */
      setLoading(true);
      setError("");

      const controller =
        new AbortController();

      const timeoutId =
        setTimeout(
          () =>
            controller.abort(),
          15000
        );

      try {
        const params =
          new URLSearchParams();

        params.set(
          "sort",
          "date"
        );

        params.set(
          "page",
          "1"
        );

        params.set(
          "limit",
          "20"
        );

        const response =
          await fetch(
            `${JOBS_ENDPOINT}?${params.toString()}`,
            {
              method:
                "GET",

              headers:
                authHeaders(),

              signal:
                controller.signal,
            }
          );

        const rawText =
          await response.text();

        let data = {};

        try {
          data =
            rawText
              ? JSON.parse(
                  rawText
                )
              : {};
        } catch {
          throw new Error(
            "Backend returned an invalid response."
          );
        }

        if (
          !response.ok
        ) {
          throw new Error(
            data?.message ||
              `Job search failed (${response.status}).`
          );
        }

        const receivedJobs =
          Array.isArray(
            data?.jobs
          )
            ? data.jobs.map(
                normalizeJob
              )
            : [];

        setJobs(
          receivedJobs
        );

        setTotalJobs(
          Number(
            data?.total || 0
          )
        );

        setHasMore(
          Boolean(
            data?.hasMore
          )
        );

        setPage(1);

        setSearched(true);
      } catch (err) {
        console.error(
          "Clear filters / reload error:",
          err
        );

        setError(
          err?.message ||
            "Unable to reload jobs."
        );

        setJobs([]);
      } finally {
        clearTimeout(
          timeoutId
        );

        setLoading(false);
        setInitialLoading(
          false
        );
      }
    };

  /* ==========================================================
     DISPLAYED JOBS
     ========================================================== */

  const displayedJobs =
    useMemo(() => {
      return jobs.map(
        normalizeJob
      );
    }, [jobs]);

  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <main className="min-h-screen w-full bg-background px-5 py-5 text-foreground sm:px-6 sm:py-6 lg:px-7 lg:py-7">
      <div className="mx-auto w-full max-w-[1500px]">

        <BackButton />

        {/* ====================================================
            HEADER
        ==================================================== */}

        <section className="mt-5 overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

            <div className="max-w-3xl">

              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Live Job Recommendations
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                Find your next opportunity
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Search current job advertisements by
                role, location, job type and posting
                date. Apply through the available
                original listing.
              </p>

            </div>

            <button
              type="button"
              onClick={
                handleRefresh
              }
              disabled={loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  loading
                    ? "animate-spin"
                    : ""
                }`}
              />

              Refresh jobs
            </button>

          </div>

          {/* ==================================================
              SEARCH
          ================================================== */}

          <form
            onSubmit={
              handleSearch
            }
            className="mt-7 grid gap-3 lg:grid-cols-[1.5fr_1fr_auto]"
          >

            <div className="relative">

              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

              <input
                value={search}
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target
                      .value
                  )
                }
                placeholder="Job title, skills or keywords"
                className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-4 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              />

            </div>

            <div className="relative">

              <MapPin className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

              <input
                value={location}
                onChange={(
                  event
                ) =>
                  setLocation(
                    event.target
                      .value
                  )
                }
                placeholder="Location e.g. Bengaluru"
                className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-4 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              />

            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}

              Search jobs
            </button>

          </form>

          {/* ==================================================
              FILTER BUTTON
          ================================================== */}

          <div className="mt-4 flex flex-wrap items-center gap-2">

            <button
              type="button"
              onClick={() =>
                setShowFilters(
                  (value) =>
                    !value
                )
              }
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-medium transition hover:bg-muted"
            >
              <SlidersHorizontal className="h-4 w-4" />

              Filters
            </button>

            {(jobType !==
              "all" ||
              postedWithin !==
                "all" ||
              remoteOnly) && (
              <button
                type="button"
                onClick={
                  clearFilters
                }
                className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />

                Clear filters
              </button>
            )}

          </div>

          {/* ==================================================
              FILTERS
          ================================================== */}

          {showFilters && (
            <div className="mt-4 grid gap-4 rounded-2xl border border-border bg-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-4">

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Job type
                </label>

                <select
                  value={
                    jobType
                  }
                  onChange={(
                    event
                  ) =>
                    setJobType(
                      event.target
                        .value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                >
                  {JOB_TYPES.map(
                    (
                      option
                    ) => (
                      <option
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                      >
                        {
                          option.label
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Posted
                </label>

                <select
                  value={
                    postedWithin
                  }
                  onChange={(
                    event
                  ) =>
                    setPostedWithin(
                      event.target
                        .value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                >
                  {POSTED_OPTIONS.map(
                    (
                      option
                    ) => (
                      <option
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                      >
                        {
                          option.label
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Sort
                </label>

                <select
                  value={
                    sortBy
                  }
                  onChange={(
                    event
                  ) =>
                    setSortBy(
                      event.target
                        .value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                >
                  {SORT_OPTIONS.map(
                    (
                      option
                    ) => (
                      <option
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                      >
                        {
                          option.label
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="flex items-end">

                <label className="flex h-11 w-full cursor-pointer items-center gap-3 rounded-xl border border-border bg-background px-3 text-sm font-medium">

                  <input
                    type="checkbox"
                    checked={
                      remoteOnly
                    }
                    onChange={(
                      event
                    ) =>
                      setRemoteOnly(
                        event.target
                          .checked
                      )
                    }
                    className="h-4 w-4 rounded border-border accent-primary"
                  />

                  Remote jobs only

                </label>

              </div>

            </div>
          )}

        </section>

        {/* ====================================================
            JOB STATUS
        ==================================================== */}

        <section className="mt-6">

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="text-lg font-bold sm:text-xl">
                {searched
                  ? "Job opportunities"
                  : "Latest opportunities"}
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">

                {totalJobs > 0
                  ? `${totalJobs.toLocaleString()} jobs available`
                  : jobs.length > 0
                  ? `${jobs.length} jobs found`
                  : "Current job listings"}

              </p>

            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              Powered by Adzuna
            </div>

          </div>

          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (
            <div className="mb-5 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">

              <div className="font-semibold">
                Unable to load jobs
              </div>

              <p className="mt-1">
                {error}
              </p>

              <p className="mt-2 break-all text-xs opacity-80">
                API: {JOBS_ENDPOINT}
              </p>

              <button
                type="button"
                onClick={
                  handleRefresh
                }
                disabled={
                  loading
                }
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-semibold transition hover:bg-destructive/10 disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${
                    loading
                      ? "animate-spin"
                      : ""
                  }`}
                />

                Try again
              </button>

            </div>
          )}

          {/* ==================================================
              INITIAL LOADING
          ================================================== */}

          {initialLoading && (
            <div className="grid gap-4 lg:grid-cols-2">

              {Array.from({
                length: 6,
              }).map(
                (_, index) => (
                  <div
                    key={
                      index
                    }
                    className="animate-pulse rounded-2xl border border-border bg-card p-5"
                  >

                    <div className="flex gap-4">

                      <div className="h-12 w-12 rounded-xl bg-muted" />

                      <div className="flex-1">

                        <div className="h-4 w-2/3 rounded bg-muted" />

                        <div className="mt-3 h-3 w-1/3 rounded bg-muted" />

                        <div className="mt-3 h-3 w-1/2 rounded bg-muted" />

                      </div>

                    </div>

                    <div className="mt-5 h-3 w-full rounded bg-muted" />

                    <div className="mt-2 h-3 w-5/6 rounded bg-muted" />

                    <div className="mt-6 h-10 w-full rounded bg-muted" />

                  </div>
                )
              )}

            </div>
          )}

          {/* ==================================================
              EMPTY
          ================================================== */}

          {!initialLoading &&
            !loading &&
            displayedJobs.length ===
              0 &&
            !error && (
              <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">

                  <BriefcaseBusiness className="h-7 w-7 text-muted-foreground" />

                </div>

                <h3 className="mt-4 text-lg font-bold">
                  No jobs found
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  Try a broader job title,
                  another location, or
                  remove some filters.
                </p>

              </div>
            )}

          {/* ==================================================
              JOB CARDS
          ================================================== */}

          {!initialLoading &&
            displayedJobs.length >
              0 && (
              <div className="grid gap-4 lg:grid-cols-2">

                {displayedJobs.map(
                  (job) => {
                    const saved =
                      isSaved(job);

                    const applyUrl =
                      getApplyUrl(
                        job
                      );

                    return (
                      <article
                        key={getJobKey(
                          job
                        )}
                        className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >

                        <div className="flex gap-4">

                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-sm font-bold">
                            {getInitials(
                              job.company
                            )}
                          </div>

                          <div className="min-w-0 flex-1">

                            <div className="flex items-start justify-between gap-3">

                              <div className="min-w-0">

                                <h3 className="truncate text-base font-bold sm:text-lg">
                                  {job.title}
                                </h3>

                                <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">

                                  <Building2 className="h-3.5 w-3.5 shrink-0" />

                                  <span className="truncate">
                                    {job.company}
                                  </span>

                                </div>

                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  toggleSave(
                                    job
                                  )
                                }
                                aria-label={
                                  saved
                                    ? "Remove saved job"
                                    : "Save job"
                                }
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background transition hover:bg-muted"
                              >
                                {saved ? (
                                  <BookmarkCheck className="h-4 w-4 text-primary" />
                                ) : (
                                  <Bookmark className="h-4 w-4" />
                                )}
                              </button>

                            </div>

                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">

                              <span className="inline-flex items-center gap-1.5">

                                <MapPin className="h-3.5 w-3.5" />

                                {job.location}

                              </span>

                              {job.postedAgo && (
                                <span>
                                  {
                                    job.postedAgo
                                  }
                                </span>
                              )}

                              {job.contractTime && (
                                <span>
                                  {
                                    job.contractTime
                                  }
                                </span>
                              )}

                              {job.contractType && (
                                <span>
                                  {
                                    job.contractType
                                  }
                                </span>
                              )}

                            </div>

                            {job.salaryLabel && (
                              <div className="mt-3 text-sm font-semibold text-primary">
                                {
                                  job.salaryLabel
                                }
                              </div>
                            )}

                          </div>

                        </div>

                        {job.description && (
                          <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">
                            {
                              job.description
                            }
                          </p>
                        )}

                        {job.skills?.length >
                          0 && (
                          <div className="mt-4 flex flex-wrap gap-2">

                            {job.skills
                              .slice(
                                0,
                                8
                              )
                              .map(
                                (
                                  skill
                                ) => (
                                  <span
                                    key={
                                      skill
                                    }
                                    className="rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs font-medium"
                                  >
                                    {
                                      skill
                                    }
                                  </span>
                                )
                              )}

                          </div>
                        )}

                        {/* =================================================
                            ACTIONS
                        ================================================= */}

                        <div className="mt-5 flex flex-col gap-2 sm:flex-row">

                          {applyUrl ? (
                            <a
                              href={
                                applyUrl
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => {
                                const token = getToken();
                                if (token) {
                                  fetch(`${API_URL}/api/jobs/apply`, {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                      Authorization: `Bearer ${token}`,
                                    },
                                    body: JSON.stringify({
                                      jobId: getJobKey(job),
                                      title: job?.title || "",
                                      company: job?.company || "",
                                      location: job?.location || "",
                                      salary: job?.salary || "",
                                      applyUrl: applyUrl,
                                      description: job?.description || "",
                                    }),
                                  })
                                    .then(() => window.dispatchEvent(new Event("storage")))
                                    .catch(() => {});
                                }
                              }}
                              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                            >
                              Apply Now

                              <ExternalLink className="h-4 w-4" />
                            </a>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="inline-flex h-10 flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-muted px-4 text-sm font-semibold text-muted-foreground"
                            >
                              Application link unavailable
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              toggleSave(
                                job
                              )
                            }
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold transition hover:bg-muted"
                          >
                            {saved ? (
                              <>
                                <BookmarkCheck className="h-4 w-4" />
                                Saved
                              </>
                            ) : (
                              <>
                                <Bookmark className="h-4 w-4" />
                                Save
                              </>
                            )}
                          </button>

                        </div>

                        {/* =================================================
                            FOOTER
                        ================================================= */}

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">

                          <span>
                            Source:{" "}
                            {job.source ||
                              "Adzuna"}
                          </span>

                          {job.postedAt && (
                            <span>
                              {new Date(
                                job.postedAt
                              ).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month:
                                    "short",
                                  year:
                                    "numeric",
                                }
                              )}
                            </span>
                          )}

                        </div>

                      </article>
                    );
                  }
                )}

              </div>
            )}

          {/* ==================================================
              LOADING MORE
          ================================================== */}

          {!initialLoading &&
            displayedJobs.length >
              0 &&
            loading &&
            page > 1 && (
              <div className="mt-6 flex justify-center">
                <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Loading more jobs...
                </div>
              </div>
            )}

          {/* ==================================================
              LOAD MORE
          ================================================== */}

          {!initialLoading &&
            displayedJobs.length >
              0 &&
            hasMore &&
            !loading && (
              <div className="mt-7 flex justify-center">

                <button
                  type="button"
                  onClick={
                    handleLoadMore
                  }
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-6 text-sm font-semibold transition hover:bg-muted"
                >
                  Load more jobs
                </button>

              </div>
            )}

        </section>

        {/* ====================================================
            ATTRIBUTION
        ==================================================== */}

        <footer className="mt-8 rounded-2xl border border-border bg-card px-4 py-3 text-center text-xs text-muted-foreground">
          Job listings are provided through
          Adzuna's job search API. Application
          links are opened from the original
          listing URL returned by the job provider.
        </footer>

      </div>
    </main>
  );
}