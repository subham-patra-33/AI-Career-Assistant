import React, { useState } from 'react';
import API from '../../lib/api';
import BackButton from '../BackButton';
import AuthGate from '../AuthGate';
import { isAuthed } from '../../lib/auth';

function fakeAtsAnalyze(text) {
  // simple heuristic: score by length and keyword matches
  const keywords = ['experience','education','skills','javascript','react','node','lead'];
  const lc = (text || '').toLowerCase();
  let matches = 0;
  for (const k of keywords) if (lc.includes(k)) matches++;
  const lenScore = Math.min(1, (text || '').length / 800);
  const kwScore = Math.min(1, matches / keywords.length);
  const score = Math.round(((lenScore * 0.5) + (kwScore * 0.5)) * 100);
  const issues = [];
  if ((text || '').length < 200) issues.push('Resume is short; consider adding more detail to experience sections.');
  if (!lc.includes('skills')) issues.push('Include a dedicated skills section with relevant keywords.');
  return { score, issues, suggestions: ['Add more measurable results', 'Include industry keywords relevant to the role'] };
}

export default function ATS() {
  const authed = isAuthed();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  function onDrop(e) {
    e.preventDefault();
    if (!authed) return;
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  function onFileChange(e) { const f = e.target.files && e.target.files[0]; if (f) handleFile(f); }

  function handleFile(f) {
    setFile(f); setResult(null); setError(null);
  }

  async function analyze() {
    if (!isAuthed()) { setError('Please log in to analyze your resume.'); return; }
    if (!file) return setError('Please upload a file first');
    setLoading(true); setError(null); setResult(null);
    try {
      // Attempt backend upload analysis first (if API exists). Fallback to client-side heuristic when backend not available.
      const resp = await API.uploadAts(file);
      if (resp && !resp.error && resp.result) {
        setResult(resp.result);
      } else {
        // fallback to client-side analysis
        const text = await (async () => {
          try { const buf = await file.text(); return buf.substring(0, 5000); } catch (err) { return `${file.name} ${file.size}`; }
        })();
        const r = fakeAtsAnalyze(text);
        await new Promise(res => setTimeout(res, 600));
        setResult(r);
      }
    } catch (err) {
      setError(err.message || 'Analysis failed');
    } finally { setLoading(false); }
  }

  return (
    <div className="flex items-center justify-center w-full h-full px-4 overflow-hidden">
      <div className="w-full max-w-4xl flex flex-col overflow-y-auto max-h-full pb-4">
      <div className="flex items-center gap-3 mb-6">
        <BackButton fallbackRoute="/db" />
        <h1 className="text-2xl font-display font-bold">ATS Checker</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="text-sm muted">Upload resume (PDF or DOCX)</div>
          {authed ? (
            <div onDrop={onDrop} onDragOver={(e)=>e.preventDefault()} className="mt-4 p-6 border-dashed rounded bg-background flex flex-col items-center justify-center" style={{minHeight:180}}>
              {!file ? (
                <>
                  <div className="muted">Drag & drop a file here or</div>
                  <label className="btn btn-primary mt-3 cursor-pointer">
                    <input type="file" accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={onFileChange} className="hidden" />
                    Choose File
                  </label>
                </>
              ) : (
                <div className="w-full">
                  <div className="font-semibold">{file.name}</div>
                  <div className="muted text-sm">{Math.round(file.size/1024)} KB</div>
                  <div className="flex gap-2 mt-4">
                    <button className="btn btn-primary" onClick={analyze} disabled={loading}>{loading ? 'Analyzing...' : 'Analyze'}</button>
                    <button className="btn" onClick={()=>setFile(null)}>Remove</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4">
              <AuthGate action="upload and analyze your resume" />
            </div>
          )}
          {error && (
            <div className="text-sm text-brick bg-brick/10 border border-brick/30 rounded-md px-3 py-2 mt-3">
              {error}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-display font-semibold">Results</h3>
          {!result && <div className="muted mt-4">No analysis yet.</div>}
          {result && (
            <div className="mt-4">
              <div className="text-sm muted mb-2">ATS score</div>
              <div className="progress"><div className="progress-fill" style={{width: `${result.score}%`}} /></div>
              <div className="mt-3">
                <span className={`stamp ${result.score >= 70 ? 'stamp-teal' : result.score >= 40 ? '' : 'stamp-brick'}`}>
                  {result.score}% {result.score >= 70 ? 'Pass' : result.score >= 40 ? 'Needs work' : 'At risk'}
                </span>
              </div>
              {result.issues && result.issues.length > 0 && (
                <div className="mt-3">
                  <div className="font-semibold">Issues</div>
                  <ul className="list-disc ml-5 mt-2 muted">
                    {result.issues.map((it,i) => <li key={i}>{it}</li>)}
                  </ul>
                </div>
              )}
              {result.suggestions && (
                <div className="mt-3">
                  <div className="font-semibold">Suggestions</div>
                  <ul className="list-disc ml-5 mt-2 muted">
                    {result.suggestions.map((s,i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}