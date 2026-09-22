const API = (() => {
  const base =
    (import.meta && import.meta.env && import.meta.env.VITE_API_URL) ||
    import.meta?.env?.VITE_API_URL ||
    "http://localhost:4000";

  /* =====================================================
     HEADERS
  ===================================================== */

  function _headers(authRequired = false) {
    const h = {
      "Content-Type": "application/json",
    };

    if (authRequired) {
      const token = localStorage.getItem("token");

      if (token) {
        h["Authorization"] = `Bearer ${token}`;
      }
    }

    return h;
  }

  /* =====================================================
     FETCH WITH TIMEOUT
  ===================================================== */

  async function _fetchWithTimeout(
    url,
    options = {},
    timeoutMs = 5000
  ) {
    const controller = new AbortController();

    const id = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      return await fetch(url, {
        ...options,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(id);
    }
  }

  /* =====================================================
     POST
  ===================================================== */

  async function post(
    path,
    body,
    auth = false,
    timeoutMs = 5000
  ) {
    try {
      const res = await _fetchWithTimeout(
        `${base}${path}`,
        {
          method: "POST",
          headers: _headers(auth),
          body: JSON.stringify(body),
        },
        timeoutMs
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return {
          error: true,
          status: res.status,
          message:
            data.message ||
            data.error ||
            res.statusText ||
            "Request failed",
        };
      }

      return data;
    } catch (err) {
      /* -----------------------------------------------
         Same-origin fallback
      ------------------------------------------------ */

      try {
        const res2 = await _fetchWithTimeout(
          path,
          {
            method: "POST",
            headers: _headers(auth),
            body: JSON.stringify(body),
          },
          timeoutMs
        );

        const data2 =
          await res2.json().catch(() => ({}));

        if (!res2.ok) {
          return {
            error: true,
            status: res2.status,
            message:
              data2.message ||
              data2.error ||
              res2.statusText ||
              "Request failed",
          };
        }

        return data2;
      } catch (err2) {
        return {
          error: true,
          message:
            err2.name === "AbortError"
              ? "Request timed out"
              : err2.message || "Network error",
        };
      }
    }
  }

  /* =====================================================
     GET
  ===================================================== */

  async function get(
    path,
    auth = false,
    timeoutMs = 5000
  ) {
    try {
      const res = await _fetchWithTimeout(
        `${base}${path}`,
        {
          headers: _headers(auth),
        },
        timeoutMs
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return {
          error: true,
          status: res.status,
          message:
            data.message ||
            data.error ||
            res.statusText ||
            "Request failed",
        };
      }

      return data;
    } catch (err) {
      /* -----------------------------------------------
         Same-origin fallback
      ------------------------------------------------ */

      try {
        const res2 = await _fetchWithTimeout(
          path,
          {
            headers: _headers(auth),
          },
          timeoutMs
        );

        const data2 =
          await res2.json().catch(() => ({}));

        if (!res2.ok) {
          return {
            error: true,
            status: res2.status,
            message:
              data2.message ||
              data2.error ||
              res2.statusText ||
              "Request failed",
          };
        }

        return data2;
      } catch (err2) {
        return {
          error: true,
          message:
            err2.name === "AbortError"
              ? "Request timed out"
              : err2.message || "Network error",
        };
      }
    }
  }

  /* =====================================================
     PUT
  ===================================================== */

  async function put(
    path,
    body,
    auth = false,
    timeoutMs = 5000
  ) {
    try {
      const res = await _fetchWithTimeout(
        `${base}${path}`,
        {
          method: "PUT",
          headers: _headers(auth),
          body: JSON.stringify(body),
        },
        timeoutMs
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return {
          error: true,
          status: res.status,
          message:
            data.message ||
            data.error ||
            res.statusText ||
            "Request failed",
        };
      }

      return data;
    } catch (err) {
      /* -----------------------------------------------
         Same-origin fallback
      ------------------------------------------------ */

      try {
        const res2 = await _fetchWithTimeout(
          path,
          {
            method: "PUT",
            headers: _headers(auth),
            body: JSON.stringify(body),
          },
          timeoutMs
        );

        const data2 =
          await res2.json().catch(() => ({}));

        if (!res2.ok) {
          return {
            error: true,
            status: res2.status,
            message:
              data2.message ||
              data2.error ||
              res2.statusText ||
              "Request failed",
          };
        }

        return data2;
      } catch (err2) {
        return {
          error: true,
          message:
            err2.name === "AbortError"
              ? "Request timed out"
              : err2.message || "Network error",
        };
      }
    }
  }

  /* =====================================================
     DELETE
  ===================================================== */

  async function remove(
    path,
    auth = false,
    timeoutMs = 5000
  ) {
    try {
      const res = await _fetchWithTimeout(
        `${base}${path}`,
        {
          method: "DELETE",
          headers: _headers(auth),
        },
        timeoutMs
      );

      const data =
        await res.json().catch(() => ({}));

      if (!res.ok) {
        return {
          error: true,
          status: res.status,
          message:
            data.message ||
            data.error ||
            res.statusText ||
            "Request failed",
        };
      }

      return data;
    } catch (err) {
      /* -----------------------------------------------
         Same-origin fallback
      ------------------------------------------------ */

      try {
        const res2 = await _fetchWithTimeout(
          path,
          {
            method: "DELETE",
            headers: _headers(auth),
          },
          timeoutMs
        );

        const data2 =
          await res2.json().catch(() => ({}));

        if (!res2.ok) {
          return {
            error: true,
            status: res2.status,
            message:
              data2.message ||
              data2.error ||
              res2.statusText ||
              "Request failed",
          };
        }

        return data2;
      } catch (err2) {
        return {
          error: true,
          message:
            err2.name === "AbortError"
              ? "Request timed out"
              : err2.message || "Network error",
        };
      }
    }
  }

  /* =====================================================
     RETURN API
  ===================================================== */

  return {
    /* =====================================================
       AUTH
    ===================================================== */

    login: (username, password) =>
      post("/api/auth/login", {
        username,
        password,
      }),

    register: (name, username, password) =>
      post("/api/auth/register", {
        name,
        username,
        password,
      }),

    me: () =>
      get("/api/auth/me", true),

    /* =====================================================
       RESUMES
    ===================================================== */

    listResumes: async () => {
      const data = await get(
        "/api/resumes",
        true
      );

      /*
        Updated backend returns:

        {
          success: true,
          resumes: [],
          count: 0
        }

        Older code may return the array directly.

        We return the array so existing
        Resumes.jsx code continues to work.
      */

      if (Array.isArray(data)) {
        return data;
      }

      if (data?.error) {
        return data;
      }

      return data?.resumes || [];
    },

    /* -----------------------------------------------------
       CREATE RESUME
    ----------------------------------------------------- */

    createResume: async (payload) => {
      const data = await post(
        "/api/resumes",
        payload,
        true,
        15000
      );

      if (data?.error) {
        return data;
      }

      return data?.resume || data;
    },

    /* -----------------------------------------------------
       GET SINGLE RESUME
    ----------------------------------------------------- */

    getResume: async (id) => {
      if (!id) {
        return {
          error: true,
          message: "Resume ID is required",
        };
      }

      const data = await get(
        `/api/resumes/${encodeURIComponent(id)}`,
        true,
        10000
      );

      if (data?.error) {
        return data;
      }

      return data?.resume || data;
    },

    /* -----------------------------------------------------
       UPDATE RESUME
    ----------------------------------------------------- */

    updateResume: async (id, payload) => {
      if (!id) {
        return {
          error: true,
          message: "Resume ID is required",
        };
      }

      const data = await put(
        `/api/resumes/${encodeURIComponent(id)}`,
        payload,
        true,
        15000
      );

      if (data?.error) {
        return data;
      }

      return data?.resume || data;
    },

    /* -----------------------------------------------------
       DELETE RESUME
    ----------------------------------------------------- */

    deleteResume: async (id) => {
      if (!id) {
        return {
          error: true,
          message: "Resume ID is required",
        };
      }

      return remove(
        `/api/resumes/${encodeURIComponent(id)}`,
        true,
        10000
      );
    },

    /* =====================================================
       TEMPLATES
    ===================================================== */

    listTemplates: () =>
      get("/api/templates", false),

    getTemplate: (id) =>
      get(`/api/templates/${id}`, false),

    /* =====================================================
       ATS UPLOAD
    ===================================================== */

    uploadAts: async (file, targetRole) => {
      try {
        const fd = new FormData();

        /*
          Keep "file" because the backend ATS
          route accepts both "resume" and "file".
        */
        fd.append("file", file);
        fd.append("role", targetRole || "");

        const token =
          localStorage.getItem("token");

        const headers = {};

        if (token) {
          headers.Authorization =
            `Bearer ${token}`;
        }

        /*
          IMPORTANT:
          Do NOT manually set Content-Type here.
          Browser automatically adds multipart/form-data
          with the correct boundary.
        */

        const res = await _fetchWithTimeout(
          `${base}/api/ats/analyze`,
          {
            method: "POST",
            body: fd,
            headers,
          },
          30000
        );

        const data =
          await res.json().catch(() => ({}));

        if (!res.ok) {
          return {
            error: true,
            status: res.status,
            message:
              data.message ||
              data.error ||
              res.statusText ||
              "Request failed",
          };
        }

        return data;
      } catch (err) {
        try {
          const fd2 = new FormData();

          fd2.append("file", file);
          fd2.append("role", targetRole || "");

          const token =
            localStorage.getItem("token");

          const headers2 = {};

          if (token) {
            headers2.Authorization =
              `Bearer ${token}`;
          }

          const res2 =
            await _fetchWithTimeout(
              "/api/ats/analyze",
              {
                method: "POST",
                body: fd2,
                headers: headers2,
              },
              30000
            );

          const data2 =
            await res2
              .json()
              .catch(() => ({}));

          if (!res2.ok) {
            return {
              error: true,
              status: res2.status,
              message:
                data2.message ||
                data2.error ||
                res2.statusText ||
                "Request failed",
            };
          }

          return data2;
        } catch (err2) {
          return {
            error: true,
            message:
              err2.name === "AbortError"
                ? "Request timed out"
                : err2.message ||
                  "Network error",
          };
        }
      }
    },

    /* =====================================================
       RESUME FILE IMPORT
    ===================================================== */

    parseResumeFile: async (file) => {
      if (!file) {
        return {
          error: true,
          message: "Resume file is required",
        };
      }

      try {
        const fd = new FormData();

        fd.append("file", file);

        const token =
          localStorage.getItem("token");

        const headers = {};

        if (token) {
          headers.Authorization =
            `Bearer ${token}`;
        }

        /*
          IMPORTANT:
          Do NOT set Content-Type manually.
        */

        const res =
          await _fetchWithTimeout(
            `${base}/api/ai/parse-resume-file`,
            {
              method: "POST",
              body: fd,
              headers,
            },
            60000
          );

        const data =
          await res.json().catch(() => ({}));

        if (!res.ok) {
          return {
            error: true,
            status: res.status,
            message:
              data.message ||
              data.error ||
              res.statusText ||
              "Resume parsing failed",
          };
        }

        return data;
      } catch (err) {
        try {
          const fd2 = new FormData();

          fd2.append("file", file);

          const token =
            localStorage.getItem("token");

          const headers2 = {};

          if (token) {
            headers2.Authorization =
              `Bearer ${token}`;
          }

          const res2 =
            await _fetchWithTimeout(
              "/api/ai/parse-resume-file",
              {
                method: "POST",
                body: fd2,
                headers: headers2,
              },
              60000
            );

          const data2 =
            await res2
              .json()
              .catch(() => ({}));

          if (!res2.ok) {
            return {
              error: true,
              status: res2.status,
              message:
                data2.message ||
                data2.error ||
                res2.statusText ||
                "Resume parsing failed",
            };
          }

          return data2;
        } catch (err2) {
          return {
            error: true,
            message:
              err2.name === "AbortError"
                ? "Resume parsing request timed out"
                : err2.message ||
                  "Network error while parsing resume",
          };
        }
      }
    },

    /* =====================================================
       EXISTING RESUME AI
    ===================================================== */

    autoGenerate: (payload) =>
      post(
        "/api/resumes/auto-generate",
        payload,
        true,
        60000
      ),

    atsCheck: (id) =>
      post(
        `/api/resumes/${id}/ats-check`,
        {},
        true,
        15000
      ),

    aiPopulate: (id, prompt) =>
      post(
        `/api/resumes/${id}/ai-populate`,
        { prompt },
        true,
        60000
      ),

    generatePdf: (id) =>
      post(
        `/api/resumes/${id}/generate-pdf`,
        {},
        true,
        15000
      ),

    /* =====================================================
       GEMINI AI
    ===================================================== */

    /* -----------------------------------------------------
       AI RESUME GENERATOR
    ----------------------------------------------------- */

    aiGenerate: (payload) =>
      post(
        "/api/ai/generate",
        payload,
        true,
        60000
      ),

    /* -----------------------------------------------------
       AI CAREER SUGGESTIONS
    ----------------------------------------------------- */

    aiSuggestions: (payload) =>
      post(
        "/api/ai/suggestions",
        payload,
        true,
        60000
      ),

    /* -----------------------------------------------------
       RECOMMENDED SKILLS
    ----------------------------------------------------- */

    getRecommendedSkills: (payload) =>
      post(
        "/api/ai/recommended-skills",
        payload,
        true,
        60000
      ),

    /* -----------------------------------------------------
       AI MOCK INTERVIEW
    ----------------------------------------------------- */

    mockInterviewStart: (payload) =>
      post(
        "/api/ai/mock-interview/start",
        payload,
        true,
        60000
      ),

    /* -----------------------------------------------------
       EVALUATE INTERVIEW ANSWER
    ----------------------------------------------------- */

    mockInterviewEvaluate: (payload) =>
      post(
        "/api/ai/mock-interview/evaluate",
        payload,
        true,
        60000
      ),

    /* -----------------------------------------------------
       ALTERNATE MOCK INTERVIEW ENDPOINT
    ----------------------------------------------------- */

    mockInterview: (payload) =>
      post(
        "/api/ai/mock-interview",
        payload,
        true,
        60000
      ),

    evaluateInterview: (payload) =>
      post(
        "/api/ai/evaluate-interview",
        payload,
        true,
        60000
      ),

    /* =====================================================
       JOB MATCH
    ===================================================== */

    jobMatch: (payload) =>
      post(
        "/api/ai/job-match",
        payload,
        true,
        60000
      ),

    /* =====================================================
       LIVE JOBS / ADZUNA
    ===================================================== */

    getJobs: async (params = {}) => {
      const searchParams =
        new URLSearchParams();

      Object.entries(params).forEach(
        ([key, value]) => {
          if (
            value !== undefined &&
            value !== null &&
            value !== ""
          ) {
            searchParams.append(
              key,
              String(value)
            );
          }
        }
      );

      const queryString =
        searchParams.toString();

      return get(
        `/api/ai/jobs${
          queryString
            ? `?${queryString}`
            : ""
        }`,
        true,
        35000
      );
    },

    /* =====================================================
       DIRECT API URL
    ===================================================== */

    getBaseUrl: () => base,
  };
})();

export default API;