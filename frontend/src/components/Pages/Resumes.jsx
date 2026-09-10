import React, { useEffect, useState } from 'react';
import API from '../../lib/api';
import { useNavigate } from 'react-router-dom';

export default function Resumes() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function load() {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    setLoading(true);
    setError(null);

    const resp = await API.listResumes();

    if (resp && resp.error) setError(resp.message || 'Failed to load');
    else setResumes(resp || []);

    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const h = () => load();
    window.addEventListener('resumes:changed', h);
    return () => window.removeEventListener('resumes:changed', h);
  }, []);

  async function handleDelete(id) {
    if (!confirm('Delete this resume?')) return;

    setLoading(true);

    const resp = await API.deleteResume(id);

    if (resp && resp.error) setError(resp.message || 'Delete failed');
    else await load();

    try {
      window.dispatchEvent(new CustomEvent('resumes:changed'));
    } catch (e) {}

    setLoading(false);
  }

  return (
    <div className="w-full min-h-screen px-4 overflow-y-auto"> {/* ✅ FIXED */}
      <div className="w-full max-w-4xl mx-auto">

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Resumes</h1>

          {(!loading && (!resumes || resumes.length === 0)) && (
            <div className="text-sm muted">No resumes available</div>
          )}
        </div>

        {loading && <div className="muted">Loading...</div>}
        {error && (
          <div className="text-sm text-brick bg-brick/10 border border-brick/30 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        {(!loading && (!resumes || resumes.length === 0)) ? (
          <div className="flex flex-col items-center mt-20">
            <div className="card p-10 text-center">
              <div className="text-lg font-display font-semibold">
                No resumes created yet.
              </div>

              <div className="mt-6">
                <button
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl shadow-md hover:-translate-y-1 transition-transform"
                  onClick={() => navigate('/resume')}
                >
                  +
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
    className="btn"
    onClick={() => navigate(`/resume/view/${r._id || r.id}`)}
  >
    View
  </button>

  <button
    className="btn"
    onClick={() => navigate(`/resume/edit/${r._id || r.id}`)}
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
        )}

      </div>
    </div>
  );
}