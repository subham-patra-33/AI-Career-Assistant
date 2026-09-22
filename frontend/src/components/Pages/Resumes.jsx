import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import API from "../../lib/api";
import { getToken } from "../../lib/auth";

/* ============================================================
   ICONS
   ============================================================ */

function DocumentIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h6" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.2 4.2L7 8.5l3.8 1.3L12 14l1.2-4.2L17 8.5l-3.8-1.3z" />
      <path d="m19 14-.7 2.3L16 17l2.3.7L19 20l.7-2.3L22 17l-2.3-.7z" />
      <path d="m5 15-.6 2L2.5 17l1.9.6L5 20l.6-2.4 1.9-.6-1.9-.6z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle
        cx="11"
        cy="11"
        r="7"
      />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="m19 6-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle
        cx="12"
        cy="12"
        r="3"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 11a8.1 8.1 0 0 0-15-3" />
      <path d="M4 4v5h5" />
      <path d="M4 13a8.1 8.1 0 0 0 15 3" />
      <path d="M20 20v-5h-5" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect
        x="4"
        y="4"
        width="6"
        height="6"
      />
      <rect
        x="14"
        y="4"
        width="6"
        height="6"
      />
      <rect
        x="4"
        y="14"
        width="6"
        height="6"
      />
      <rect
        x="14"
        y="14"
        width="6"
        height="6"
      />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M8 6h12" />
      <path d="M8 12h12" />
      <path d="M8 18h12" />
      <path d="M4 6h.01" />
      <path d="M4 12h.01" />
      <path d="M4 18h.01" />
    </svg>
  );
}

/* ============================================================
   HELPERS
   ============================================================ */

function getResumeData(resume) {
  return resume?.data &&
    typeof resume.data === "object"
    ? resume.data
    : resume || {};
}

function getResumeName(resume) {
  const data =
    getResumeData(resume);

  return (
    data?.fullName ||
    data?.name ||
    resume?.title ||
    "Untitled Resume"
  );
}

function getResumeRole(resume) {
  const data =
    getResumeData(resume);

  return (
    data?.targetRole ||
    data?.role ||
    "Professional Resume"
  );
}

function getTemplateName(resume) {
  const data =
    getResumeData(resume);

  return (
    resume?.templateId ||
    data?.templateId ||
    data?.template ||
    "simple-ats"
  );
}

function getUpdatedDate(resume) {
  const value =
    resume?.updatedAt ||
    resume?.createdAt;

  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function getResumeId(resume) {
  return (
    resume?._id ||
    resume?.id ||
    resume?.resumeId ||
    null
  );
}

/* ============================================================
   COMPONENT
   ============================================================ */

export default function Resumes() {
  const navigate =
    useNavigate();

  /* ----------------------------------------------------------
     STATE
     ---------------------------------------------------------- */

  const [resumes, setResumes] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [sortBy, setSortBy] =
    useState("recent");

  const [viewMode, setViewMode] =
    useState("grid");

  const [deletingId, setDeletingId] =
    useState(null);

  /* ----------------------------------------------------------
     LOAD RESUMES
     ---------------------------------------------------------- */

  const loadResumes =
    async (
      showRefresh = false
    ) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const token =
          getToken();

        if (!token) {
          setError(
            "Please log in to view your saved resumes."
          );

          setResumes([]);

          return;
        }

        const response =
          await API.listResumes();

        /* ----------------------------------------------------
           IMPORTANT:
           API.listResumes() may return:

           1. Array
           2. { resumes: [] }
           3. { data: [] }
           4. { error: true, message: "..." }

           Handle all cases safely.
        ---------------------------------------------------- */

        if (
          response?.error
        ) {
          throw new Error(
            response.message ||
              "Unable to load your saved resumes."
          );
        }

        let items = [];

        if (
          Array.isArray(response)
        ) {
          items =
            response;
        } else if (
          Array.isArray(
            response?.resumes
          )
        ) {
          items =
            response.resumes;
        } else if (
          Array.isArray(
            response?.data
          )
        ) {
          items =
            response.data;
        }

        setResumes(
          Array.isArray(items)
            ? items
            : []
        );
      } catch (err) {
        console.error(
          "❌ Load resumes error:",
          err
        );

        setError(
          err?.message ||
            "Unable to load your saved resumes."
        );

        setResumes([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

  /* ----------------------------------------------------------
     INITIAL LOAD + GENERATION EVENT
     ---------------------------------------------------------- */

  useEffect(() => {
    loadResumes();

    const handleResumeChanged =
      () => {
        loadResumes();
      };

    window.addEventListener(
      "resumes:changed",
      handleResumeChanged
    );

    return () => {
      window.removeEventListener(
        "resumes:changed",
        handleResumeChanged
      );
    };
  }, []);

  /* ----------------------------------------------------------
     FILTER + SORT
     ---------------------------------------------------------- */

  const displayedResumes =
    useMemo(() => {
      let result =
        [...resumes];

      const searchValue =
        search
          .trim()
          .toLowerCase();

      if (searchValue) {
        result =
          result.filter(
            (resume) => {
              const name =
                getResumeName(
                  resume
                ).toLowerCase();

              const role =
                getResumeRole(
                  resume
                ).toLowerCase();

              const title =
                String(
                  resume?.title ||
                    ""
                ).toLowerCase();

              const template =
                getTemplateName(
                  resume
                ).toLowerCase();

              return (
                name.includes(
                  searchValue
                ) ||
                role.includes(
                  searchValue
                ) ||
                title.includes(
                  searchValue
                ) ||
                template.includes(
                  searchValue
                )
              );
            }
          );
      }

      result.sort(
        (a, b) => {
          const dateA =
            new Date(
              a?.updatedAt ||
                a?.createdAt ||
                0
            ).getTime();

          const dateB =
            new Date(
              b?.updatedAt ||
                b?.createdAt ||
                0
            ).getTime();

          if (
            sortBy === "oldest"
          ) {
            return dateA - dateB;
          }

          if (
            sortBy === "name"
          ) {
            return getResumeName(
              a
            ).localeCompare(
              getResumeName(b)
            );
          }

          return dateB - dateA;
        }
      );

      return result;
    }, [
      resumes,
      search,
      sortBy,
    ]);

  /* ----------------------------------------------------------
     DELETE
     ---------------------------------------------------------- */

  const handleDelete =
    async (id) => {
      if (!id) {
        return;
      }

      const confirmed =
        window.confirm(
          "Are you sure you want to delete this resume?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setDeletingId(id);
        setError("");

        const response =
          await API.deleteResume(
            id
          );

        /* ----------------------------------------------------
           API.deleteResume() returns an error object instead
           of throwing when the backend returns an error.
        ---------------------------------------------------- */

        if (
          response?.error
        ) {
          throw new Error(
            response.message ||
              "Unable to delete this resume."
          );
        }

        /* ----------------------------------------------------
           Only remove from UI AFTER successful backend
           deletion.
        ---------------------------------------------------- */

        setResumes(
          (previous) =>
            previous.filter(
              (resume) =>
                String(
                  getResumeId(
                    resume
                  )
                ) !==
                String(id)
            )
        );

        window.dispatchEvent(
          new CustomEvent(
            "resumes:changed"
          )
        );
      } catch (err) {
        console.error(
          "❌ Delete resume error:",
          err
        );

        setError(
          err?.message ||
            "Unable to delete this resume."
        );
      } finally {
        setDeletingId(null);
      }
    };

  /* ----------------------------------------------------------
     CREATE
     ---------------------------------------------------------- */

  const createResume =
    () => {
      navigate(
        "/resume"
      );
    };

  /* ----------------------------------------------------------
     VIEW
     ---------------------------------------------------------- */

  const viewResume =
    (id) => {
      if (!id) {
        setError(
          "This resume does not have a valid ID."
        );

        return;
      }

      navigate(
        `/resume?id=${encodeURIComponent(
          id
        )}`
      );
    };

  /* ----------------------------------------------------------
     EDIT
     ---------------------------------------------------------- */

  const editResume =
    (id) => {
      if (!id) {
        setError(
          "This resume does not have a valid ID."
        );

        return;
      }

      navigate(
        `/resume?id=${encodeURIComponent(
          id
        )}&edit=true`
      );
    };

  /* ==========================================================
     UI
     ========================================================== */

  return (
    <div className="min-h-screen w-full bg-background px-5 py-5 text-foreground sm:px-6 sm:py-6 lg:px-7 lg:py-7">

      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="mx-auto w-full max-w-[1180px]">

        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              <DocumentIcon />
              Resume Workspace
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              My Resumes
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Manage all your resumes in one place.
              Create, edit and review different
              versions for your career opportunities.
            </p>
          </div>

          <button
            type="button"
            onClick={createResume}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            <PlusIcon />
            Create New Resume
            <ArrowIcon />
          </button>

        </div>

        {/* ====================================================
            STAT CARDS
            ==================================================== */}

        <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-3">

          {/* TOTAL */}

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground">
                <DocumentIcon />
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Total Resumes
                </p>

                <p className="mt-1 text-2xl font-bold text-foreground">
                  {resumes.length}
                </p>
              </div>

            </div>
          </div>

          {/* AI */}

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <SparkleIcon />
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Career Workspace
                </p>

                <p className="mt-1 text-sm font-semibold text-foreground">
                  AI-powered tools
                </p>
              </div>

            </div>
          </div>

          {/* MANAGEMENT */}

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground">
                <GridIcon />
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Resume Management
                </p>

                <p className="mt-1 text-sm font-semibold text-foreground">
                  Keep versions organized
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* ====================================================
            TOOLBAR
            ==================================================== */}

        <div className="mt-6 rounded-2xl border border-border bg-card p-3 shadow-sm">

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

            {/* SEARCH */}

            <div className="relative w-full lg:max-w-[380px]">

              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <SearchIcon />
              </div>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search your resumes..."
                className="h-10 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20"
              />

            </div>

            {/* CONTROLS */}

            <div className="flex flex-wrap items-center gap-2">

              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(
                    event.target.value
                  )
                }
                className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none"
              >
                <option value="recent">
                  Recently Updated
                </option>

                <option value="oldest">
                  Oldest
                </option>

                <option value="name">
                  Name
                </option>
              </select>

              <button
                type="button"
                onClick={() =>
                  setViewMode("grid")
                }
                className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                  viewMode === "grid"
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground"
                }`}
                aria-label="Grid view"
              >
                <GridIcon />
              </button>

              <button
                type="button"
                onClick={() =>
                  setViewMode("list")
                }
                className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                  viewMode === "list"
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground"
                }`}
                aria-label="List view"
              >
                <ListIcon />
              </button>

              <button
                type="button"
                disabled={refreshing}
                onClick={() =>
                  loadResumes(true)
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:text-foreground disabled:opacity-50"
                aria-label="Refresh resumes"
              >
                <RefreshIcon />
              </button>

            </div>

          </div>

        </div>

        {/* ====================================================
            ERROR
            ==================================================== */}

        {error && (
          <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* ====================================================
            RESULT COUNT
            ==================================================== */}

        <div className="mt-7">

          <h2 className="text-sm font-semibold text-foreground">
            {displayedResumes.length}{" "}
            {displayedResumes.length === 1
              ? "resume"
              : "resumes"}
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            Your saved resume versions
          </p>

        </div>

        {/* ====================================================
            LOADING
            ==================================================== */}

        {loading ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2">

            {[1, 2].map(
              (item) => (
                <div
                  key={item}
                  className="h-40 animate-pulse rounded-2xl border border-border bg-card"
                />
              )
            )}

          </div>
        ) : displayedResumes.length === 0 ? (

          /* ==================================================
             EMPTY STATE
             ================================================== */

          <div className="mt-5 flex min-h-[305px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 text-center">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <PlusIcon />
            </div>

            <h3 className="mt-5 text-base font-semibold text-foreground">
              {search
                ? "No resumes found"
                : "Your resume workspace is empty"}
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              {search
                ? "Try a different search term."
                : "Create your first professional resume and keep all your versions organized in one place."}
            </p>

            {!search && (
              <button
                type="button"
                onClick={
                  createResume
                }
                className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                <PlusIcon />
                Create New Resume
                <ArrowIcon />
              </button>
            )}

          </div>

        ) : (

          /* ==================================================
             RESUME LIST
             ================================================== */

          <div
            className={
              viewMode === "grid"
                ? "mt-5 grid gap-4 md:grid-cols-2"
                : "mt-5 flex flex-col gap-3"
            }
          >

            {displayedResumes.map(
              (resume) => {

                const name =
                  getResumeName(
                    resume
                  );

                const role =
                  getResumeRole(
                    resume
                  );

                const template =
                  getTemplateName(
                    resume
                  );

                const updated =
                  getUpdatedDate(
                    resume
                  );

                const id =
                  getResumeId(
                    resume
                  );

                return (
                  <div
                    key={
                      id ||
                      `${name}-${updated}`
                    }
                    className={`group rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md ${
                      viewMode ===
                      "list"
                        ? "p-4"
                        : "p-5"
                    }`}
                  >

                    <div className="flex items-start gap-4">

                      {/* DOCUMENT ICON */}

                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <DocumentIcon />
                      </div>

                      {/* CONTENT */}

                      <div className="min-w-0 flex-1">

                        <div className="flex items-start justify-between gap-3">

                          <div className="min-w-0">

                            <h3 className="truncate text-base font-semibold text-foreground">
                              {resume?.title ||
                                name}
                            </h3>

                            <p className="mt-1 truncate text-sm text-muted-foreground">
                              {role}
                            </p>

                          </div>

                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">

                          <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                            {template}
                          </span>

                          {updated && (
                            <span className="text-xs text-muted-foreground">
                              Updated{" "}
                              {updated}
                            </span>
                          )}

                        </div>

                        {/* ACTIONS */}

                        <div className="mt-4 flex flex-wrap gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              viewResume(
                                id
                              )
                            }
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-foreground transition hover:bg-muted"
                          >
                            <EyeIcon />
                            View
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              editResume(
                                id
                              )
                            }
                            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
                          >
                            <EditIcon />
                            Edit
                          </button>

                          <button
                            type="button"
                            disabled={
                              deletingId ===
                              id
                            }
                            onClick={() =>
                              handleDelete(
                                id
                              )
                            }
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-destructive transition hover:bg-destructive/5 disabled:opacity-50"
                          >
                            <TrashIcon />

                            {deletingId ===
                            id
                              ? "Deleting..."
                              : "Delete"}
                          </button>

                        </div>

                      </div>

                    </div>

                  </div>
                );
              }
            )}

          </div>
        )}

      </div>
    </div>
  );
}