import React, { useEffect, useState } from 'react';
import API from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import BackButton from '../BackButton';

export default function TotalResumes() {
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
    try {
      const resp = await API.listResumes();
      if (resp && resp.error) {
        setError(resp.message || 'Failed to load resumes');
        setResumes([]);
      } else {
        const resumeList = Array.isArray(resp) ? resp : (resp?.data || []);
        setResumes(resumeList);
      }
    } catch (err) {
      setError('Error loading resumes. Please try again.');
      setResumes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    load(); 
  }, []);

  useEffect(() => {
    const h = () => load();
    window.addEventListener('resumes:changed', h);
    return () => window.removeEventListener('resumes:changed', h);
  }, []);

  async function handleDelete(id) {
    if (!confirm('Delete this resume?')) return;
    try {
      const resp = await API.deleteResume(id);
      if (resp && resp.error) {
        setError(resp.message || 'Delete failed');
      } else {
        await load();
        try { window.dispatchEvent(new CustomEvent('resumes:changed')); } catch(e){}
      }
    } catch (err) {
      setError('Error deleting resume. Please try again.');
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full px-4 overflow-hidden">
      <div className="w-full max-w-4xl h-full flex flex-col overflow-y-auto">
        {/* Header - only show when data is present or loading with data */}
        {(resumes.length > 0 || (loading && resumes.length > 0)) && (
          <div className="flex items-center gap-3 mb-6 shrink-0">
            <BackButton fallbackRoute="/db" />
            <div className="flex-1">
              <h1 className="text-3xl font-display font-bold">Total Resumes</h1>
              {(!loading && resumes.length > 0) && (
                <p className="text-sm muted mt-1">{resumes.length} {resumes.length === 1 ? 'resume' : 'resumes'}</p>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-brick/10 text-brick border border-brick/30 rounded-lg animate-fade shrink-0">
            {error}
            <button onClick={() => setError(null)} className="ml-2 font-semibold">×</button>
          </div>
        )}

        {/* Loading State */}
        {loading && resumes.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1">
            <div className="spinner mb-2" style={{ width: 28, height: 28 }}></div>
            <div className="muted">Loading resumes...</div>
          </div>
        )}

        {/* Empty State */}
        {!loading && resumes.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center flex-1 w-full">
            <div className="text-center max-w-md">
              <span className="stamp mb-4">Blank page</span>
              {/* Message */}
              <p className="text-lg muted mt-4 mb-10">
                No resumes created yet. Tap the button to start your first draft.
              </p>

              {/* Plus Button */}
              <div className="flex justify-center mb-6">
                <button
                  onClick={() => navigate('/create-resume')}
                  onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/create-resume'); }}
                  className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary text-primary-foreground text-5xl font-display font-bold shadow-lg hover:-translate-y-1 active:scale-95 transform transition-transform duration-200 cursor-pointer focus:outline-none focus:ring-4 focus:ring-ring/40 focus:ring-offset-2"
                  aria-label="Create a new resume"
                  tabIndex={0}
                  type="button"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Resumes Grid */}
        {!loading && resumes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
            {resumes.map((r, idx) => (
              <div 
                key={r._id || r.id} 
                className="card p-5 hover:shadow-lg active:shadow-md transition-all animate-pop hover:-translate-y-0.5"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex flex-col gap-3">
                  {/* Resume Info */}
                  <div>
                    <div className="font-semibold text-lg">{r.title || 'Untitled Resume'}</div>
                    <div className="text-xs muted mt-1">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Date unknown'}
                    </div>
                    {r.data?.fullName && <div className="text-sm muted mt-2">{r.data.fullName}</div>}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2 border-t border-border">
                   <button
  onClick={() => navigate(`/resume/view/${r._id || r.id}`)}
  className="flex-1 btn btn-secondary text-sm"
  aria-label={`View resume: ${r.title || 'Untitled'}`}
>
  View
</button>
                    <button 
                      onClick={() => navigate(`/resume?id=${r._id || r.id}&edit=true`)}
                      className="flex-1 btn text-sm"
                      aria-label={`Edit resume: ${r.title || 'Untitled'}`}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(r._id || r.id)}
                      className="flex-1 btn text-sm hover:bg-brick/10 hover:text-brick"
                      aria-label={`Delete resume: ${r.title || 'Untitled'}`}
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

