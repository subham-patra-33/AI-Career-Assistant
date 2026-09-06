const API = (() => {
  const base = (import.meta && import.meta.env && import.meta.env.VITE_API_URL) || import.meta?.env?.VITE_API_URL || 'http://localhost:4000';

  function _headers(authRequired = false) {
    const h = { 'Content-Type': 'application/json' };
    if (authRequired) {
      const t = localStorage.getItem('token');
      if (t) h['Authorization'] = `Bearer ${t}`;
    }
    return h;
  }

  // Wraps fetch with a hard timeout so an unreachable/slow backend
  // can never leave the UI stuck on a loading spinner forever.
  async function _fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(id);
    }
  }

  async function post(path, body, auth = false) {
    // Try the configured base, then fall back to same-origin relative path if network failure
    try {
      const res = await _fetchWithTimeout(`${base}${path}`, {
        method: 'POST',
        headers: _headers(auth),
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { error: true, status: res.status, message: data.message || res.statusText || 'Request failed' };
      return data;
    } catch (err) {
      // network level error (e.g., ECONNREFUSED) or timeout. Try relative path if different origin.
      try {
        const res2 = await _fetchWithTimeout(path, {
          method: 'POST',
          headers: _headers(auth),
          body: JSON.stringify(body)
        });
        const data2 = await res2.json().catch(() => ({}));
        if (!res2.ok) return { error: true, status: res2.status, message: data2.message || res2.statusText || 'Request failed' };
        return data2;
      } catch (err2) {
        return { error: true, message: err2.name === 'AbortError' ? 'Request timed out' : (err2.message || 'Network error') };
      }
    }
  }

  async function get(path, auth = false) {
    try {
      const res = await _fetchWithTimeout(`${base}${path}`, { headers: _headers(auth) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { error: true, status: res.status, message: data.message || res.statusText || 'Request failed' };
      return data;
    } catch (err) {
      try {
        const res2 = await _fetchWithTimeout(path, { headers: _headers(auth) });
        const data2 = await res2.json().catch(() => ({}));
        if (!res2.ok) return { error: true, status: res2.status, message: data2.message || res2.statusText || 'Request failed' };
        return data2;
      } catch (err2) {
        return { error: true, message: err2.name === 'AbortError' ? 'Request timed out' : (err2.message || 'Network error') };
      }
    }
  }

  return {
    login: (username, password) => post('/api/auth/login', { username, password }),
    register: (name, username, password) => post('/api/auth/register', { name, username, password }),
    me: () => get('/api/auth/me', true),
    listResumes: () => get('/api/resumes', true),
    createResume: (payload) => post('/api/resumes', payload, true),
    getResume: (id) => get(`/api/resumes/${id}`, true),
    deleteResume: (id) => {
      return (async () => {
        try {
          const res = await fetch(`${base}/api/resumes/${id}`, { method: 'DELETE', headers: _headers(true) });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) return { error: true, status: res.status, message: data.message || res.statusText || 'Request failed' };
          return data;
        } catch (err) {
          try {
            const res2 = await fetch(`/api/resumes/${id}`, { method: 'DELETE', headers: _headers(true) });
            const data2 = await res2.json().catch(() => ({}));
            if (!res2.ok) return { error: true, status: res2.status, message: data2.message || res2.statusText || 'Request failed' };
            return data2;
          } catch (err2) {
            return { error: true, message: err2.message || 'Network error' };
          }
        }
      })();
    },
  listTemplates: () => get('/api/templates', false),
  getTemplate: (id) => get(`/api/templates/${id}`, false),
    uploadAts: async (file) => {
      // tries backend endpoint POST /api/ats/analyze expecting multipart form upload
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch(`${base}/api/ats/analyze`, { method: 'POST', body: fd, headers: { ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}) } });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return { error: true, status: res.status, message: data.message || res.statusText || 'Request failed' };
        return data;
      } catch (err) {
        try {
          const fd2 = new FormData(); fd2.append('file', file);
          const res2 = await fetch(`/api/ats/analyze`, { method: 'POST', body: fd2, headers: { ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}) } });
          const data2 = await res2.json().catch(() => ({}));
          if (!res2.ok) return { error: true, status: res2.status, message: data2.message || res2.statusText || 'Request failed' };
          return data2;
        } catch (err2) {
          return { error: true, message: err2.message || 'Network error' };
        }
      }
    },
    autoGenerate: (payload) => post('/api/resumes/auto-generate', payload, true),
  atsCheck: (id) => post(`/api/resumes/${id}/ats-check`, {}, true),
    aiPopulate: (id, prompt) => post(`/api/resumes/${id}/ai-populate`, { prompt }, true),
    generatePdf: (id) => post(`/api/resumes/${id}/generate-pdf`, {}, true),
  };
})();

export default API;
