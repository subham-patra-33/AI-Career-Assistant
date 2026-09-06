import React, { useMemo, useState } from "react";
import BackButton from "../BackButton";
import AuthGate from "../AuthGate";
import API from "../../lib/api";
import { isAuthed } from "../../lib/auth";
import jsPDF from "jspdf";

const emptyResume = {
  fullName: "Your Name", email: "", phone: "", location: "", linkedin: "", github: "",
  targetRole: "", summary: "", skills: [], experience: [], projects: [], education: [],
  certifications: [], achievements: [], atsKeywords: []
};

const splitList = (value) => value.split(",").map(s => s.trim()).filter(Boolean);

function Resume() {
  const authed = isAuthed();
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", location: "", linkedin: "", github: "",
    targetRole: "", jobDescription: "", summary: "", skills: "", experience: "",
    projects: "", education: "", certifications: "", achievements: ""
  });
  const [previewData, setPreviewData] = useState(emptyResume);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const update = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const sourceData = useMemo(() => ({
    ...form,
    skills: splitList(form.skills),
    certifications: splitList(form.certifications),
    achievements: splitList(form.achievements)
  }), [form]);

  const downloadPDF = (data) => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const margin = 17;
    const width = 210 - margin * 2;
    const bottom = 282;
    let y = 18;

    const addText = (text, size = 9.5, bold = false, gap = 4.5) => {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(String(text || ""), width);
      lines.forEach(line => {
        if (y > bottom) { doc.addPage(); y = 18; }
        doc.text(line, margin, y);
        y += gap;
      });
    };

    const section = (title) => {
      if (y > bottom - 12) { doc.addPage(); y = 18; }
      y += 2;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.text(title.toUpperCase(), margin, y);
      y += 1.5;
      doc.line(margin, y, 210 - margin, y);
      y += 5;
    };

    doc.setFont("helvetica", "bold");
    doc.setFontSize(19);
    doc.text((data.fullName || "YOUR NAME").toUpperCase(), margin, y);
    y += 6;
    if (data.targetRole) addText(data.targetRole, 10, true, 4.5);
    const contact = [data.email, data.phone, data.location, data.linkedin, data.github].filter(Boolean).join(" | ");
    if (contact) addText(contact, 8.5, false, 4.5);

    if (data.summary) { section("Professional Summary"); addText(data.summary, 9.5, false, 4.5); }
    if (data.skills?.length) { section("Skills"); addText(data.skills.join(" • "), 9.5, false, 4.5); }

    if (data.experience?.length) {
      section("Experience");
      data.experience.forEach(exp => {
        addText([exp.role, exp.company].filter(Boolean).join(" | "), 10, true, 4.5);
        const dates = [exp.start, exp.end].filter(Boolean).join(" – ");
        if (dates) addText(dates, 8.5, false, 4);
        (exp.bullets || []).forEach(b => addText(`• ${b}`, 9.2, false, 4.3));
        y += 1;
      });
    }

       if (data.projects?.length) {
      section("Projects");
      data.projects.forEach(p => {
        addText(p.title || p.name, 10, true, 4.5);
        if (p.bullets?.length) p.bullets.forEach(b => addText(`• ${b}`, 9.2, false, 4.3));
        else if (p.description) addText(p.description, 9.2, false, 4.3);
        if (p.technologies?.length) addText(`Technologies: ${p.technologies.join(", ")}`, 8.8, false, 4.2);
        y += 1;
      });
    }

    if (data.education?.length) {
      section("Education");
      data.education.forEach(e => {
        addText([e.degree, e.school].filter(Boolean).join(" | "), 9.8, true, 4.5);
        addText([e.year, e.grade].filter(Boolean).join(" | "), 8.8, false, 4.2);
      });
    }
    if (data.certifications?.length) { section("Certifications"); data.certifications.forEach(c => addText(`• ${c}`, 9.2, false, 4.3)); }
    if (data.achievements?.length) { section("Achievements"); data.achievements.forEach(a => addText(`• ${a}`, 9.2, false, 4.3)); }

       const safeName = (data.fullName || "Resume")
      .trim()
      .replace(/[^a-zA-Z0-9\s-]/g, "")   // strip special characters unsafe in filenames
      .replace(/\s+/g, "-");              // spaces -> hyphens
    doc.save(`${safeName}-Resume.pdf`);
  };

  const openResumePreview = (data) => {
    const newWindow = window.open("", "_blank");
    if (!newWindow) {
      setError("Your browser blocked the preview popup. Allow popups for this site, or use the PDF download.");
      return;
    }
    const escape = (v) => String(v || "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const projectHtml = (data.projects || []).map(p => `<div class="item"><b>${escape(p.title)}</b>${p.bullets?.length ? `<ul>${p.bullets.map(b=>`<li>${escape(b)}</li>`).join("")}</ul>` : (p.description ? `<p>${escape(p.description)}</p>` : "")}<small>${escape((p.technologies || []).join(", "))}</small></div>`).join("");    const experienceHtml = (data.experience || []).map(e => `<div class="item"><b>${escape(e.role)}${e.company ? ` | ${escape(e.company)}` : ""}</b><small>${escape([e.start,e.end].filter(Boolean).join(" – "))}</small><ul>${(e.bullets||[]).map(b=>`<li>${escape(b)}</li>`).join("")}</ul></div>`).join("");
    const educationHtml = (data.education || []).map(e => `<div class="item"><b>${escape(e.degree)}</b><div>${escape(e.school)}</div><small>${escape([e.year,e.grade].filter(Boolean).join(" | "))}</small></div>`).join("");
    newWindow.document.open();
    
newWindow.document.documentElement.innerHTML = `<head><meta charset="utf-8" /> <title>ATS Resume</title><style>body{font-family:Arial,sans-serif;color:#20242b;max-width:800px;margin:40px auto;padding:0 35px;line-height:1.45}h1{font-size:30px;margin:0;text-transform:uppercase}h2{font-size:14px;text-transform:uppercase;border-bottom:1px solid #333;padding-bottom:4px;margin-top:22px}.contact,small{font-size:12px;color:#555}.item{margin-bottom:12px}p{margin:4px 0}ul{margin:5px 0;padding-left:20px}@media print{body{margin:0;max-width:none}}</style></head><body><h1>${escape(data.fullName)}</h1><div>${escape(data.targetRole)}</div><div class="contact">${escape([data.email,data.phone,data.location,data.linkedin,data.github].filter(Boolean).join(" | "))}</div>${data.summary?`<h2>Professional Summary</h2><p>${escape(data.summary)}</p>`:""}${data.skills?.length?`<h2>Skills</h2><p>${escape(data.skills.join(" • "))}</p>`:""}${experienceHtml?`<h2>Experience</h2>${experienceHtml}`:""}${projectHtml?`<h2>Projects</h2>${projectHtml}`:""}${educationHtml?`<h2>Education</h2>${educationHtml}`:""}${data.certifications?.length?`<h2>Certifications</h2><ul>${data.certifications.map(c=>`<li>${escape(c)}</li>`).join("")}</ul>`:""}${data.achievements?.length?`<h2>Achievements</h2><ul>${data.achievements.map(a=>`<li>${escape(a)}</li>`).join("")}</ul>`:""}${data.atsKeywords?.length?`<h2>ATS Keywords</h2><p>${escape(data.atsKeywords.join(" • "))}</p>`:""}</body>`;    newWindow.document.close();
  };

  async function handleGenerate(e) {
    e.preventDefault();
    if (!isAuthed()) return setError("Please log in to generate a resume.");
    if (!form.fullName.trim() || !form.targetRole.trim() || !form.email.trim()) {
      return setError("Please provide at least your full name, email, and target job role.");
    }
    setLoading(true); setError("");
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000);
      let res;
      try {
        res = await fetch("http://localhost:4000/api/ai/generate", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: sourceData }), signal: controller.signal
        });
      } finally { clearTimeout(timeout); }
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result.resume) throw new Error(result.error || result.message || "Failed to generate resume");
         const data = { ...emptyResume, ...result.resume };

      const toText = (item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") return item.name || item.skill || item.title || Object.values(item)[0] || "";
        return String(item ?? "");
      };
      data.skills = (Array.isArray(data.skills) ? data.skills : []).map(toText).filter(Boolean);
      data.projects = (Array.isArray(data.projects) ? data.projects : []).map((p) => {
        if (typeof p === "string") return { title: p, bullets: [], technologies: [] };
        let bullets = Array.isArray(p.bullets) ? p.bullets : [];
        if (!bullets.length && typeof p.description === "string") {
          bullets = p.description
            .split(/\.\s*,|\.\s+(?=[A-Z])/)
            .map((s) => s.trim().replace(/^,/, "").trim())
            .filter(Boolean)
            .map((s) => (s.endsWith(".") ? s : s + "."));
        }
        return { title: p.title || p.name || "", bullets, technologies: Array.isArray(p.technologies) ? p.technologies : [] };
      });

      setPreviewData(data);
      downloadPDF(data);
      openResumePreview(data);
    } catch (err) {
      console.error(err);
      setError(err.name === "AbortError" ? "AI request timed out. Check that the backend and Gemini API key are working." : err.message || "Error generating resume");
    } finally { setLoading(false); }
  }

  async function handleUploadChange(e) {
    const f = e.target.files?.[0]; if (!f) return;
    if (!isAuthed()) return setError("Please log in to upload a resume.");
    setUploadFile(f); setUploadResult(null); setUploadLoading(true); setError("");
    try {
      const resp = await API.uploadAts(f);
      if (resp && !resp.error) setUploadResult(resp.result || resp);
      else setError(resp?.message || "Could not read that file");
    } catch { setError("Error uploading file"); }
    finally { setUploadLoading(false); }
  }

  return (
    <div className="flex justify-center w-full px-4 pb-8">
      <div className="max-w-7xl w-full">
        <div className="mb-6 ruled"><BackButton fallbackRoute="/db" /><h1 className="text-3xl font-display font-bold mt-2">AI Professional Resume Maker</h1><p className="muted mt-1">Build a recruiter-ready, ATS-friendly resume tailored to your target role.</p></div>

        {authed ? <div className="mb-5"><button onClick={handleGenerate} className="btn btn-accent w-full py-3" disabled={loading}>{loading ? <><span className="spinner" /> AI is analyzing your profile and job requirements…</> : "Generate professional ATS resume"}</button></div> : <AuthGate action="generate an AI resume" />}

        <div className="card p-4 mb-6">
          <h2 className="font-display font-semibold mb-1">Optimize an existing resume</h2><p className="text-sm muted mb-3">Optional: upload a PDF/DOCX to check its ATS readiness while you edit.</p>
          {authed ? <div className="flex flex-col sm:flex-row sm:items-center gap-3"><label className="btn btn-secondary cursor-pointer w-fit"><input type="file" accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleUploadChange} className="hidden" />{uploadFile ? "Choose a different file" : "Choose file"}</label>{uploadLoading && <span className="text-sm muted"><span className="spinner" /> Reading file…</span>}{uploadFile && !uploadLoading && <span className="text-sm muted">{uploadFile.name}</span>}{uploadResult?.score !== undefined && <span className="stamp stamp-teal">{uploadResult.score}% ATS match</span>}</div> : <AuthGate action="upload an existing resume" />}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <form onSubmit={handleGenerate} className="card p-5 space-y-4">
            <div><h2 className="font-display font-semibold">1. Target role</h2><p className="text-xs muted">The target role and job description drive ATS keyword optimization.</p></div>
            <input className="input" placeholder="Target Job Role * e.g. Full Stack Developer" value={form.targetRole} onChange={update("targetRole")} />
            <textarea className="textarea" rows="5" placeholder="Paste the job description here (recommended for ATS optimization)" value={form.jobDescription} onChange={update("jobDescription")} />

            <div><h2 className="font-display font-semibold">2. Contact information</h2></div>
            <div className="grid sm:grid-cols-2 gap-3"><input className="input" placeholder="Full Name *" value={form.fullName} onChange={update("fullName")} /><input className="input" placeholder="Email *" value={form.email} onChange={update("email")} /><input className="input" placeholder="Phone" value={form.phone} onChange={update("phone")} /><input className="input" placeholder="Location" value={form.location} onChange={update("location")} /><input className="input" placeholder="LinkedIn URL" value={form.linkedin} onChange={update("linkedin")} /><input className="input" placeholder="GitHub / Portfolio URL" value={form.github} onChange={update("github")} /></div>

            <div><h2 className="font-display font-semibold">3. Professional profile</h2></div>
            <textarea className="textarea" rows="4" placeholder="Existing summary (optional). AI will rewrite it professionally." value={form.summary} onChange={update("summary")} />
            <textarea className="textarea" rows="3" placeholder="Skills, comma separated — e.g. React, JavaScript, MongoDB, Git" value={form.skills} onChange={update("skills")} />

            <div><h2 className="font-display font-semibold">4. Experience</h2><p className="text-xs muted">Enter your actual experience. Include company, role, dates and responsibilities. Separate entries with blank lines.</p></div>
            <textarea className="textarea" rows="7" placeholder={'Example:\nWeb Developer Intern | Gauravgo Games | June 2026 - Present\nWorked on SEO-optimized gaming website and frontend development.'} value={form.experience} onChange={update("experience")} />

            <div><h2 className="font-display font-semibold">5. Projects</h2><p className="text-xs muted">Include what you built, your contribution, and technologies you actually used.</p></div>
            <textarea className="textarea" rows="7" placeholder={'Example:\nAI Resume Generator\nBuilt an AI-powered resume generation application.\nTechnologies: React, JavaScript, Express, MongoDB'} value={form.projects} onChange={update("projects")} />

            <div><h2 className="font-display font-semibold">6. Education</h2></div>
            <textarea className="textarea" rows="4" placeholder="Degree | Institution | Year | CGPA/Percentage" value={form.education} onChange={update("education")} />
            <textarea className="textarea" rows="3" placeholder="Certifications, comma separated" value={form.certifications} onChange={update("certifications")} />
            <textarea className="textarea" rows="3" placeholder="Achievements, comma separated" value={form.achievements} onChange={update("achievements")} />
            {error && <p className="text-sm text-brick bg-brick/10 border border-brick/30 rounded-md px-3 py-2">{error}</p>}
          </form>

          <div className="card p-6" style={{ background: "#fffdf8", color: "#22262f" }}>
            <div className="flex items-center justify-between gap-3 mb-5"><div><p className="text-xs uppercase tracking-wider opacity-60">Live ATS preview</p><h2 className="text-2xl font-display font-bold uppercase">{previewData.fullName || "Your Name"}</h2></div>{previewData.atsKeywords?.length > 0 && <span className="stamp stamp-teal">ATS optimized</span>}</div>
            <div className="text-xs mb-5 opacity-75">{[previewData.email,previewData.phone,previewData.location,previewData.linkedin,previewData.github].filter(Boolean).join(" | ")}</div>
            {previewData.targetRole && <p className="font-semibold mb-3">{previewData.targetRole}</p>}
            {previewData.summary && <><h3 className="font-display font-semibold border-b mb-2" style={{borderColor:"#ddd7c4"}}>Professional Summary</h3><p className="text-sm mb-4">{previewData.summary}</p></>}
            {previewData.skills?.length > 0 && <><h3 className="font-display font-semibold border-b mb-2" style={{borderColor:"#ddd7c4"}}>Skills</h3><p className="text-sm mb-4">{previewData.skills.join(" • ")}</p></>}
            {previewData.experience?.length > 0 && <><h3 className="font-display font-semibold border-b mb-2" style={{borderColor:"#ddd7c4"}}>Experience</h3>{previewData.experience.map((e,i)=><div className="text-sm mb-4" key={i}><strong>{e.role}{e.company ? ` | ${e.company}` : ""}</strong><div className="text-xs opacity-60">{[e.start,e.end].filter(Boolean).join(" – ")}</div><ul className="mt-1">{(e.bullets||[]).map((b,j)=><li key={j}>• {b}</li>)}</ul></div>)}</>}
{previewData.projects?.length > 0 && <><h3 className="font-display font-semibold border-b mb-2" style={{borderColor:"#ddd7c4"}}>Projects</h3>{previewData.projects.map((p,i)=><div className="text-sm mb-4" key={i}><strong>{p.title}</strong>{p.bullets?.length>0 ? <ul className="mt-1">{p.bullets.map((b,j)=><li key={j}>• {b}</li>)}</ul> : p.description ? <p>{p.description}</p> : null}{p.technologies?.length>0&&<p className="text-xs mt-1"><b>Technologies:</b> {p.technologies.join(", ")}</p>}</div>)}</>}            {previewData.education?.length > 0 && <><h3 className="font-display font-semibold border-b mb-2" style={{borderColor:"#ddd7c4"}}>Education</h3>{previewData.education.map((e,i)=><div className="text-sm mb-3" key={i}><strong>{e.degree}</strong><div>{e.school}</div><div className="text-xs opacity-60">{[e.year,e.grade].filter(Boolean).join(" | ")}</div></div>)}</>}
            {previewData.certifications?.length > 0 && <><h3 className="font-display font-semibold border-b mb-2" style={{borderColor:"#ddd7c4"}}>Certifications</h3><ul className="text-sm mb-4">{previewData.certifications.map((c,i)=><li key={i}>• {c}</li>)}</ul></>}
{previewData.achievements?.length > 0 && (
  <>
    <h3
      className="font-display font-semibold border-b mb-2"
      style={{ borderColor: "#ddd7c4" }}
    >
      Achievements
    </h3>

    <ul className="text-sm mb-4">
      {previewData.achievements.map((a, i) => (
        <li key={i}>
          • {typeof a === "string" ? a : a.title || a.description || ""}
        </li>
      ))}
    </ul>
  </>
)}       
     {previewData.atsKeywords?.length > 0 && <><h3 className="font-display font-semibold border-b mb-2" style={{borderColor:"#ddd7c4"}}>ATS Keywords</h3><p className="text-xs">{previewData.atsKeywords.join(" • ")}</p></>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Resume;
