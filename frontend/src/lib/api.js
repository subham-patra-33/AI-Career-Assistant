const API = (() => {
  const base =
    (import.meta && import.meta.env && import.meta.env.VITE_API_URL) ||
    import.meta?.env?.VITE_API_URL ||
    "http://localhost:4000";

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

  // Prevent requests from hanging forever.
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

  async function post(path, body, auth = false, timeoutMs = 5000) {
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
      // Try same-origin fallback.
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

        const data2 = await res2.json().catch(() => ({}));

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

  async function get(path, auth = false) {
    try {
      const res = await _fetchWithTimeout(
        `${base}${path}`,
        {
          headers: _headers(auth),
        }
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
      try {
        const res2 = await _fetchWithTimeout(path, {
          headers: _headers(auth),
        });

        const data2 = await res2.json().catch(() => ({}));

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

    me: () => get("/api/auth/me", true),

    /* =====================================================
       RESUMES
    ===================================================== */

    listResumes: () =>
      get("/api/resumes", true),

    createResume: (payload) =>
      post("/api/resumes", payload, true),

    getResume: (id) =>
      get(`/api/resumes/${id}`, true),

    deleteResume: (id) => {
      return (async () => {
        try {
          const res = await fetch(
            `${base}/api/resumes/${id}`,
            {
              method: "DELETE",
              headers: _headers(true),
            }
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
          try {
            const res2 = await fetch(
              `/api/resumes/${id}`,
              {
                method: "DELETE",
                headers: _headers(true),
              }
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
                err2.message || "Network error",
            };
          }
        }
      })();
    },

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

        fd.append("file", file);
        fd.append("role", targetRole || "");

        const token = localStorage.getItem("token");

        const headers = {};

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const res = await fetch(
          `${base}/api/ats/analyze`,
          {
            method: "POST",
            body: fd,
            headers,
          }
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

          const res2 = await fetch(
            "/api/ats/analyze",
            {
              method: "POST",
              body: fd2,
              headers: headers2,
            }
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
              err2.message || "Network error",
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
        45000
      ),

    atsCheck: (id) =>
      post(
        `/api/resumes/${id}/ats-check`,
        {},
        true
      ),

    aiPopulate: (id, prompt) =>
      post(
        `/api/resumes/${id}/ai-populate`,
        { prompt },
        true,
        45000
      ),

    generatePdf: (id) =>
      post(
        `/api/resumes/${id}/generate-pdf`,
        {},
        true
      ),

    /* =====================================================
       GEMINI AI
    ===================================================== */

    // AI Resume Generator
    aiGenerate: (payload) =>
      post(
        "/api/ai/generate",
        payload,
        true,
        60000
      ),

    // Personalized AI Career Suggestions
    aiSuggestions: (payload) =>
      post(
        "/api/ai/suggestions",
        payload,
        true,
        60000
      ),

    // Generate AI Mock Interview
    mockInterviewStart: (payload) =>
      post(
        "/api/ai/mock-interview/start",
        payload,
        true,
        60000
      ),

    // Evaluate an interview answer
    mockInterviewEvaluate: (payload) =>
      post(
        "/api/ai/mock-interview/evaluate",
        payload,
        true,
        60000
      ),
  };
})();

export default API;