import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Sparkles, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../BackButton';
import API from '../../lib/api';

function Dashboard() {
  const [counts, setCounts] = useState({ resumes: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Check login first
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
    }
  }, []);

  // Load data
  async function load() {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const resp = await API.listResumes();

      if (resp && resp.error) {
        setError(resp.message || 'Failed to load');
      } else {
        setCounts({ resumes: (resp || []).length });
      }

    } catch (err) {
      console.error(err);
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full px-4">

      <div className="w-full max-w-4xl">

        <div className="flex items-center justify-between mb-6 ruled">
          <div className="flex items-center gap-3">
            <BackButton fallbackRoute="/home" />
            <h1 className="text-2xl font-display font-bold">Dashboard</h1>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem('token');
              navigate('/');
            }}
            className="btn btn-secondary text-sm"
          >
            <LogOut className="w-4 h-4" /> Log out
          </button>
        </div>

        {/* Banner */}
        <div className="card border-2 border-foreground p-6 mb-4 mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="stamp mb-3">Next step</span>
            <h2 className="text-xl font-display font-bold mt-3">Start a new draft</h2>
            <p className="mt-1 muted text-sm">Answer a few prompts and AI will fill in the rest.</p>
          </div>

          <button
            onClick={() => navigate('/resume')}
            className="btn btn-accent shrink-0"
          >
            Generate resume
          </button>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <div
            onClick={() => navigate('/total-resumes')}
            role="button"
            tabIndex={0}
            className="cursor-pointer transition-transform hover:-translate-y-1"
          >
            <Card className="border-2 border-border hover:border-teal transition-colors">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal" />
                  <CardTitle>Total resumes</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm muted">
                {loading
                  ? 'Loading…'
                  : counts.resumes === 0
                    ? 'No resumes yet — start your first draft'
                    : `${counts.resumes} created`}
              </CardContent>
            </Card>
          </div>

          <div
            onClick={() => navigate('/ai-suggestions')}
            role="button"
            tabIndex={0}
            className="cursor-pointer transition-transform hover:-translate-y-1"
          >
            <Card className="border-2 border-border hover:border-gold transition-colors">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold" />
                  <CardTitle>AI suggestions</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm muted">
                Get wording and content ideas for your draft
              </CardContent>
            </Card>
          </div>

        </div>

        {error && (
          <p className="text-sm text-brick bg-brick/10 border border-brick/30 rounded-md px-3 py-2 mt-4">
            {error}
          </p>
        )}

      </div>
    </div>
  );
}

export default Dashboard;
