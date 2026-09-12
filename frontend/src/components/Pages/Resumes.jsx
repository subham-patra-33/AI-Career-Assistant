import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import API from "../../lib/api";

import {
  useNavigate,
} from "react-router-dom";

import BackButton from "../BackButton";

import {
  FileText,
  Plus,
  Search,
  Pencil,
  Eye,
  Trash2,
  MoreHorizontal,
  Clock3,
  LayoutTemplate,
  Grid3X3,
  List,
  X,
  AlertCircle,
  FilePlus2,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
} from "lucide-react";

// ============================================================
// HELPERS
// ============================================================

function getResumeId(resume) {
  return resume?._id || resume?.id;
}

function getResumeTitle(resume) {
  return (
    resume?.title ||
    resume?.name ||
    resume?.resumeName ||
    "Untitled Resume"
  );
}

function getTemplateName(resume) {
  return (
    resume?.templateName ||
    resume?.template ||
    resume?.templateId ||
    "Professional Template"
  );
}

function getDateValue(resume) {
  return (
    resume?.updatedAt ||
    resume?.updated_at ||
    resume?.createdAt ||
    resume?.created_at ||
    null
  );
}

function formatDate(date) {
  if (!date) {
    return "Recently created";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Recently created";
  }

  const now = new Date();

  const difference =
    now.getTime() - parsed.getTime();

  const minutes = Math.floor(
    difference / (1000 * 60)
  );

  const hours = Math.floor(
    difference / (1000 * 60 * 60)
  );

  const days = Math.floor(
    difference / (1000 * 60 * 60 * 24)
  );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min${
      minutes === 1 ? "" : "s"
    } ago`;
  }

  if (hours < 24) {
    return `${hours} hour${
      hours === 1 ? "" : "s"
    } ago`;
  }

  if (days === 1) {
    return "Yesterday";
  }

  if (days < 7) {
    return `${days} days ago`;
  }

  return parsed.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

// ============================================================
// MINI RESUME PREVIEW
// ============================================================

function ResumePreview({
  resume,
  onPreview,
}) {
  const title =
    getResumeTitle(resume);

  return (
    <div
      className="
        group/preview
        relative
        flex
        h-[250px]
        items-center
        justify-center
        overflow-hidden
        rounded-t-2xl
        bg-gradient-to-br
        from-slate-100
        via-slate-50
        to-white
      "
    >
      {/* Decorative glow */}

      <div
        className="
          pointer-events-none
          absolute
          -right-10
          -top-10
          h-32
          w-32
          rounded-full
          bg-plum/10
          blur-3xl
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          -bottom-12
          -left-12
          h-32
          w-32
          rounded-full
          bg-primary/10
          blur-3xl
        "
      />

      {/* Resume paper */}

      <div
        className="
          relative
          h-[210px]
          w-[158px]
          overflow-hidden
          rounded-[3px]
          bg-white
          shadow-[0_15px_40px_rgba(15,23,42,0.18)]
          transition-all
          duration-300
          group-hover:-translate-y-1
          group-hover:shadow-[0_20px_50px_rgba(15,23,42,0.24)]
        "
      >
        {/* Header */}

        <div
          className="
            border-b
            border-slate-100
            px-4
            pb-3
            pt-4
          "
        >
          <div
            className="
              h-2
              w-16
              rounded-full
              bg-slate-800
            "
          />

          <div
            className="
              mt-2
              h-1.5
              w-24
              rounded-full
              bg-slate-200
            "
          />

          <div
            className="
              mt-2
              flex
              gap-1
            "
          >
            <span
              className="
                h-1
                w-8
                rounded-full
                bg-slate-200
              "
            />

            <span
              className="
                h-1
                w-10
                rounded-full
                bg-slate-200
              "
            />

            <span
              className="
                h-1
                w-7
                rounded-full
                bg-slate-200
              "
            />
          </div>
        </div>

        {/* Body */}

        <div className="px-4 py-3">
          <div
            className="
              mb-2
              h-1.5
              w-12
              rounded-full
              bg-slate-700
            "
          />

          {[1, 2, 3, 4].map(
            (item) => (
              <div
                key={item}
                className="
                  mb-1.5
                  h-1
                  rounded-full
                  bg-slate-100
                "
                style={{
                  width:
                    item === 3
                      ? "68%"
                      : item === 4
                      ? "82%"
                      : "94%",
                }}
              />
            )
          )}

          <div
            className="
              mb-2
              mt-4
              h-1.5
              w-14
              rounded-full
              bg-slate-700
            "
          />

          {[1, 2, 3].map(
            (item) => (
              <div
                key={item}
                className="
                  mb-1.5
                  h-1
                  rounded-full
                  bg-slate-100
                "
                style={{
                  width:
                    item === 2
                      ? "72%"
                      : "90%",
                }}
              />
            )
          )}

          <div
            className="
              mb-2
              mt-4
              h-1.5
              w-10
              rounded-full
              bg-slate-700
            "
          />

          <div className="flex flex-wrap gap-1">
            {[1, 2, 3, 4, 5].map(
              (item) => (
                <span
                  key={item}
                  className="
                    h-3
                    w-7
                    rounded
                    bg-slate-100
                  "
                />
              )
            )}
          </div>
        </div>

        <span className="sr-only">
          {title}
        </span>
      </div>

      {/* Preview overlay */}

      <div
        className="
          absolute
          inset-0
          flex
          items-center
          justify-center
          bg-slate-950/0
          opacity-0
          transition-all
          duration-300
          group-hover/preview:bg-slate-950/20
          group-hover/preview:opacity-100
        "
      >
        <button
          type="button"
          onClick={() =>
            onPreview(resume)
          }
          className="
            flex
            items-center
            gap-2
            rounded-xl
            bg-white
            px-4
            py-2.5
            text-sm
            font-semibold
            text-slate-900
            shadow-xl
            transition
            hover:scale-105
          "
        >
          <Eye className="h-4 w-4" />
          View Resume
        </button>
      </div>
    </div>
  );
}

// ============================================================
// SKELETON CARD
// ============================================================

function SkeletonCard() {
  return (
    <div
      className="
        overflow-hidden
        rounded-2xl
        border
        border-border
        bg-background
      "
    >
      <div
        className="
          h-[250px]
          animate-pulse
          bg-secondary
        "
      />

      <div className="space-y-3 p-4">
        <div
          className="
            h-4
            w-2/3
            animate-pulse
            rounded
            bg-secondary
          "
        />

        <div
          className="
            h-3
            w-1/2
            animate-pulse
            rounded
            bg-secondary
          "
        />

        <div
          className="
            h-9
            w-full
            animate-pulse
            rounded-lg
            bg-secondary
          "
        />
      </div>
    </div>
  );
}

// ============================================================
// ACTION MENU
// ============================================================

function ActionMenu({
  resume,
  onView,
  onEdit,
  onDelete,
}) {
  const [
    open,
    setOpen,
  ] = useState(false);

  useEffect(() => {
    const handleOutside =
      (event) => {
        if (
          !event.target.closest(
            "[data-resume-menu]"
          )
        ) {
          setOpen(false);
        }
      };

    document.addEventListener(
      "mousedown",
      handleOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutside
      );
    };
  }, []);

  return (
    <div
      className="relative"
      data-resume-menu
    >
      <button
        type="button"
        onClick={() =>
          setOpen(
            (value) => !value
          )
        }
        className="
          flex
          h-9
          w-9
          items-center
          justify-center
          rounded-lg
          border
          border-border
          bg-background
          text-muted-foreground
          transition
          hover:bg-secondary
          hover:text-foreground
        "
        aria-label="Resume actions"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="
            absolute
            right-0
            top-11
            z-50
            w-44
            overflow-hidden
            rounded-xl
            border
            border-border
            bg-background
            p-1.5
            shadow-2xl
          "
        >
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onView(resume);
            }}
            className="
              flex
              w-full
              items-center
              gap-3
              rounded-lg
              px-3
              py-2.5
              text-left
              text-sm
              hover:bg-secondary
            "
          >
            <Eye className="h-4 w-4" />
            View Resume
          </button>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onEdit(resume);
            }}
            className="
              flex
              w-full
              items-center
              gap-3
              rounded-lg
              px-3
              py-2.5
              text-left
              text-sm
              hover:bg-secondary
            "
          >
            <Pencil className="h-4 w-4" />
            Edit Resume
          </button>

          <div className="my-1 border-t border-border" />

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete(resume);
            }}
            className="
              flex
              w-full
              items-center
              gap-3
              rounded-lg
              px-3
              py-2.5
              text-left
              text-sm
              text-red-600
              hover:bg-red-50
            "
          >
            <Trash2 className="h-4 w-4" />
            Delete Resume
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// DELETE MODAL
// ============================================================

function DeleteModal({
  resume,
  deleting,
  onCancel,
  onConfirm,
}) {
  if (!resume) {
    return null;
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-center
        justify-center
        bg-slate-950/50
        p-4
        backdrop-blur-sm
      "
    >
      <div
        className="
          w-full
          max-w-md
          rounded-2xl
          border
          border-border
          bg-background
          p-6
          shadow-2xl
        "
      >
        <div
          className="
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-xl
            bg-red-50
            text-red-600
          "
        >
          <Trash2 className="h-5 w-5" />
        </div>

        <h2
          className="
            mt-5
            text-lg
            font-bold
            text-foreground
          "
        >
          Delete this resume?
        </h2>

        <p
          className="
            mt-2
            text-sm
            leading-relaxed
            text-muted-foreground
          "
        >
          You're about to permanently
          delete{" "}
          <span className="font-semibold text-foreground">
            {getResumeTitle(
              resume
            )}
          </span>
          . This action cannot be undone.
        </p>

        <div
          className="
            mt-6
            flex
            justify-end
            gap-2
          "
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="
              rounded-xl
              border
              border-border
              px-4
              py-2.5
              text-sm
              font-medium
              text-foreground
              transition
              hover:bg-secondary
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="
              inline-flex
              items-center
              gap-2
              rounded-xl
              bg-red-600
              px-4
              py-2.5
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-red-700
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {deleting && (
              <RefreshCw className="h-4 w-4 animate-spin" />
            )}

            {deleting
              ? "Deleting..."
              : "Delete Resume"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState({
  searching,
  onCreate,
  onClearSearch,
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-dashed
        border-border
        bg-background
        px-6
        py-16
        text-center
      "
    >
      <div
        className="
          mx-auto
          flex
          h-16
          w-16
          items-center
          justify-center
          rounded-2xl
          bg-plum/10
          text-plum
        "
      >
        {searching ? (
          <Search className="h-7 w-7" />
        ) : (
          <FilePlus2 className="h-7 w-7" />
        )}
      </div>

      <h2
        className="
          mt-5
          text-lg
          font-bold
          text-foreground
        "
      >
        {searching
          ? "No resumes found"
          : "Your resume workspace is empty"}
      </h2>

      <p
        className="
          mx-auto
          mt-2
          max-w-md
          text-sm
          leading-relaxed
          text-muted-foreground
        "
      >
        {searching
          ? "We couldn't find a resume matching your search. Try another name or clear the search."
          : "Create your first professional resume and keep all your versions organized in one place."}
      </p>

      {searching ? (
        <button
          type="button"
          onClick={onClearSearch}
          className="
            mt-6
            inline-flex
            items-center
            gap-2
            rounded-xl
            border
            border-border
            px-4
            py-2.5
            text-sm
            font-semibold
            text-foreground
            transition
            hover:bg-secondary
          "
        >
          <X className="h-4 w-4" />
          Clear Search
        </button>
      ) : (
        <button
          type="button"
          onClick={onCreate}
          className="
            mt-6
            inline-flex
            items-center
            gap-2
            rounded-xl
            bg-foreground
            px-5
            py-3
            text-sm
            font-semibold
            text-background
            shadow-sm
            transition
            hover:-translate-y-0.5
            hover:shadow-lg
          "
        >
          <Plus className="h-4 w-4" />
          Create New Resume
          <ArrowUpRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function Resumes() {
  const navigate =
    useNavigate();

  const [
    resumes,
    setResumes,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState(null);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    sortBy,
    setSortBy,
  ] = useState("updated");

  const [
    viewMode,
    setViewMode,
  ] = useState("grid");

  const [
    deleteTarget,
    setDeleteTarget,
  ] = useState(null);

  const [
    deleting,
    setDeleting,
  ] = useState(false);

  // ==========================================================
  // LOAD RESUMES
  // ==========================================================

  async function load() {
    const token =
      localStorage.getItem(
        "token"
      );

    if (!token) {
      navigate("/");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const resp =
        await API.listResumes();

      if (
        resp &&
        resp.error
      ) {
        setError(
          resp.message ||
            "Failed to load resumes."
        );

        setResumes([]);
      } else {
        setResumes(
          Array.isArray(resp)
            ? resp
            : []
        );
      }
    } catch (err) {
      console.error(
        "Load resumes error:",
        err
      );

      setError(
        "Unable to load your resumes right now."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    load();
  }, []);

  // ==========================================================
  // LISTEN FOR RESUME CHANGES
  // ==========================================================

  useEffect(() => {
    const handleResumeChange =
      () => {
        load();
      };

    window.addEventListener(
      "resumes:changed",
      handleResumeChange
    );

    return () => {
      window.removeEventListener(
        "resumes:changed",
        handleResumeChange
      );
    };
  }, []);

  // ==========================================================
  // DELETE
  // ==========================================================

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    const id =
      getResumeId(
        deleteTarget
      );

    if (!id) {
      setError(
        "Unable to identify this resume."
      );

      setDeleteTarget(null);
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const resp =
        await API.deleteResume(
          id
        );

      if (
        resp &&
        resp.error
      ) {
        setError(
          resp.message ||
            "Delete failed."
        );
      } else {
        setResumes(
          (current) =>
            current.filter(
              (resume) =>
                getResumeId(
                  resume
                ) !== id
            )
        );

        try {
          window.dispatchEvent(
            new CustomEvent(
              "resumes:changed"
            )
          );
        } catch (e) {
          // Ignore event errors
        }
      }
    } catch (err) {
      console.error(
        "Delete resume error:",
        err
      );

      setError(
        "Unable to delete this resume right now."
      );
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  // ==========================================================
  // VIEW
  // ==========================================================

  function handleView(
    resume
  ) {
    const id =
      getResumeId(
        resume
      );

    if (!id) {
      setError(
        "Unable to open this resume."
      );
      return;
    }

    navigate(
      `/resume?id=${id}`
    );
  }

  // ==========================================================
  // EDIT
  // ==========================================================

  function handleEdit(
    resume
  ) {
    const id =
      getResumeId(
        resume
      );

    if (!id) {
      setError(
        "Unable to edit this resume."
      );
      return;
    }

    navigate(
      `/resume?id=${id}&edit=true`
    );
  }

  // ==========================================================
  // FILTER + SORT
  // ==========================================================

  const filteredResumes =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      let result =
        [...resumes];

      if (query) {
        result =
          result.filter(
            (resume) => {
              const title =
                getResumeTitle(
                  resume
                ).toLowerCase();

              const template =
                getTemplateName(
                  resume
                ).toLowerCase();

              return (
                title.includes(
                  query
                ) ||
                template.includes(
                  query
                )
              );
            }
          );
      }

      result.sort(
        (a, b) => {
          if (
            sortBy ===
            "name"
          ) {
            return getResumeTitle(
              a
            ).localeCompare(
              getResumeTitle(
                b
              )
            );
          }

          if (
            sortBy ===
            "oldest"
          ) {
            const dateA =
              new Date(
                getDateValue(
                  a
                ) || 0
              ).getTime();

            const dateB =
              new Date(
                getDateValue(
                  b
                ) || 0
              ).getTime();

            return (
              dateA - dateB
            );
          }

          const dateA =
            new Date(
              getDateValue(
                a
              ) || 0
            ).getTime();

          const dateB =
            new Date(
              getDateValue(
                b
              ) || 0
            ).getTime();

          return (
            dateB - dateA
          );
        }
      );

      return result;
    }, [
      resumes,
      search,
      sortBy,
    ]);

  // ==========================================================
  // CREATE
  // ==========================================================

  function handleCreate() {
    navigate(
      "/resume"
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      className="
        w-full
        min-h-full
        px-4
        pb-10
        pt-2
        sm:px-6
        lg:px-8
      "
    >
      <div className="mx-auto w-full max-w-7xl">

        {/* ==================================================
            BACK BUTTON
        ================================================== */}

        <div className="mb-5">
          <BackButton />
        </div>

        {/* ==================================================
            HEADER
        ================================================== */}

        <div
          className="
            flex
            flex-col
            gap-5
            lg:flex-row
            lg:items-end
            lg:justify-between
          "
        >
          <div>
            <div
              className="
                mb-2
                flex
                items-center
                gap-2
                text-xs
                font-semibold
                uppercase
                tracking-wider
                text-plum
              "
            >
              <FileText className="h-4 w-4" />

              Resume Workspace
            </div>

            <h1
              className="
                text-2xl
                font-bold
                tracking-tight
                text-foreground
                sm:text-3xl
              "
            >
              My Resumes
            </h1>

            <p
              className="
                mt-2
                max-w-2xl
                text-sm
                leading-relaxed
                text-muted-foreground
              "
            >
              Manage all your resumes in one
              place. Create, edit and review
              different versions for your career
              opportunities.
            </p>
          </div>

          <button
            type="button"
            onClick={
              handleCreate
            }
            className="
              inline-flex
              shrink-0
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-foreground
              px-5
              py-3
              text-sm
              font-semibold
              text-background
              shadow-sm
              transition-all
              duration-200
              hover:-translate-y-0.5
              hover:shadow-lg
            "
          >
            <Plus className="h-4 w-4" />

            Create New Resume

            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>

        {/* ==================================================
            QUICK STATS
        ================================================== */}

        <div
          className="
            mt-7
            grid
            grid-cols-1
            gap-3
            sm:grid-cols-3
          "
        >
          {/* Total Resumes */}

          <div
            className="
              rounded-2xl
              border
              border-border
              bg-background
              p-4
              shadow-sm
            "
          >
            <div className="flex items-center gap-3">
              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  bg-secondary
                  text-foreground
                "
              >
                <FileText className="h-5 w-5" />
              </div>

              <div>
                <div
                  className="
                    text-xs
                    text-muted-foreground
                  "
                >
                  Total Resumes
                </div>

                <div
                  className="
                    mt-0.5
                    text-xl
                    font-bold
                    text-foreground
                  "
                >
                  {resumes.length}
                </div>
              </div>
            </div>
          </div>

          {/* AI */}

          <div
            className="
              rounded-2xl
              border
              border-border
              bg-background
              p-4
              shadow-sm
            "
          >
            <div className="flex items-center gap-3">
              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  bg-plum/10
                  text-plum
                "
              >
                <Sparkles className="h-5 w-5" />
              </div>

              <div>
                <div
                  className="
                    text-xs
                    text-muted-foreground
                  "
                >
                  Career Workspace
                </div>

                <div
                  className="
                    mt-0.5
                    text-sm
                    font-bold
                    text-foreground
                  "
                >
                  AI-powered tools
                </div>
              </div>
            </div>
          </div>

          {/* Organization */}

          <div
            className="
              rounded-2xl
              border
              border-border
              bg-background
              p-4
              shadow-sm
            "
          >
            <div className="flex items-center gap-3">
              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  bg-secondary
                  text-foreground
                "
              >
                <LayoutTemplate className="h-5 w-5" />
              </div>

              <div>
                <div
                  className="
                    text-xs
                    text-muted-foreground
                  "
                >
                  Resume Management
                </div>

                <div
                  className="
                    mt-0.5
                    text-sm
                    font-bold
                    text-foreground
                  "
                >
                  Keep versions organized
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div
            className="
              mt-6
              flex
              items-start
              gap-3
              rounded-xl
              border
              border-red-200
              bg-red-50
              px-4
              py-3
              text-sm
              text-red-700
            "
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

            <div className="min-w-0 flex-1">
              {error}
            </div>

            <button
              type="button"
              onClick={() =>
                setError(null)
              }
              className="
                shrink-0
                rounded
                p-1
                hover:bg-red-100
              "
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ==================================================
            SEARCH + CONTROLS
        ================================================== */}

        <div
          className="
            mt-7
            flex
            flex-col
            gap-3
            rounded-2xl
            border
            border-border
            bg-background
            p-3
            shadow-sm
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          {/* Search */}

          <div
            className="
              relative
              min-w-0
              flex-1
              sm:max-w-md
            "
          >
            <Search
              className="
                pointer-events-none
                absolute
                left-3
                top-1/2
                h-4
                w-4
                -translate-y-1/2
                text-muted-foreground
              "
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search your resumes..."
              className="
                h-10
                w-full
                rounded-xl
                border
                border-border
                bg-secondary/30
                pl-9
                pr-9
                text-sm
                text-foreground
                outline-none
                transition
                placeholder:text-muted-foreground
                focus:border-plum/40
                focus:bg-background
                focus:ring-2
                focus:ring-plum/10
              "
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
                className="
                  absolute
                  right-2
                  top-1/2
                  flex
                  h-7
                  w-7
                  -translate-y-1/2
                  items-center
                  justify-center
                  rounded-lg
                  text-muted-foreground
                  hover:bg-secondary
                  hover:text-foreground
                "
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Controls */}

          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(
                  event.target.value
                )
              }
              className="
                h-10
                rounded-xl
                border
                border-border
                bg-background
                px-3
                text-xs
                font-medium
                text-foreground
                outline-none
                focus:border-plum/40
              "
            >
              <option value="updated">
                Recently Updated
              </option>

              <option value="name">
                Name
              </option>

              <option value="oldest">
                Oldest First
              </option>
            </select>

            {/* View switcher */}

            <div
              className="
                hidden
                items-center
                rounded-xl
                border
                border-border
                p-1
                sm:flex
              "
            >
              <button
                type="button"
                onClick={() =>
                  setViewMode(
                    "grid"
                  )
                }
                className={`
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-lg
                  transition
                  ${
                    viewMode ===
                    "grid"
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }
                `}
                title="Grid view"
              >
                <Grid3X3 className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() =>
                  setViewMode(
                    "list"
                  )
                }
                className={`
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-lg
                  transition
                  ${
                    viewMode ===
                    "list"
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }
                `}
                title="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

              <div className="mt-4 muted text-sm">
                Click to create your first resume
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(resumes || []).map(r => (
              <div
                key={r._id || r.id}
                className="card hover:shadow-lg transition transform hover:-translate-y-1"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold">
                      {r.title || 'Untitled'}
                    </div>
                    <div className="muted text-sm">
                      {r.createdAt
                        ? new Date(r.createdAt).toLocaleString()
                        : ''}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      className="btn btn-secondary"
                      onClick={() => navigate(`/resume?id=${r._id || r.id}`)}
                    >
                      View
                    </button>

                    <button
                      className="btn"
                      onClick={() => navigate(`/resume?id=${r._id || r.id}&edit=true`)}
                    >
                      Edit
                    </button>

                    <button
                      className="btn"
                      onClick={() => handleDelete(r._id || r.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )

        {/* ==================================================
            AI CTA
        ================================================== */}

        {resumes.length >
          0 && (
          <div
            className="
              mt-8
              overflow-hidden
              rounded-2xl
              border
              border-white/10
              bg-gradient-to-br
              from-slate-950
              via-slate-900
              to-slate-950
              p-6
              text-white
              shadow-sm
            "
          >
            <div
              className="
                flex
                flex-col
                gap-5
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <div
                className="
                  flex
                  items-start
                  gap-4
                "
              >
                <div
                  className="
                    flex
                    h-11
                    w-11
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-white/10
                  "
                >
                  <Sparkles className="h-5 w-5" />
                </div>

                <div>
                  <h3
                    className="
                      text-sm
                      font-semibold
                    "
                  >
                    Want to make your resume
                    stronger?
                  </h3>

                  <p
                    className="
                      mt-1
                      max-w-xl
                      text-xs
                      leading-relaxed
                      text-white/60
                    "
                  >
                    Use AI Suggestions or the
                    ATS Checker to improve your
                    resume before applying.
                  </p>
                </div>
              </div>

              <div
                className="
                  flex
                  flex-wrap
                  gap-2
                "
              >
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/ai-suggestions"
                    )
                  }
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-xl
                    bg-white
                    px-4
                    py-2.5
                    text-xs
                    font-semibold
                    text-slate-950
                    transition
                    hover:scale-[1.02]
                  "
                >
                  <Sparkles className="h-3.5 w-3.5" />

                  AI Suggestions
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/ats"
                    )
                  }
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-xl
                    border
                    border-white/15
                    bg-white/5
                    px-4
                    py-2.5
                    text-xs
                    font-semibold
                    text-white
                    transition
                    hover:bg-white/10
                  "
                >
                  <FileText className="h-3.5 w-3.5" />

                  ATS Checker
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================
          DELETE CONFIRMATION
      ===================================================== */}

      <DeleteModal
        resume={
          deleteTarget
        }
        deleting={
          deleting
        }
        onCancel={() =>
          setDeleteTarget(
            null
          )
        }
        onConfirm={
          handleDelete
        }
      />
    </div>
  );
}