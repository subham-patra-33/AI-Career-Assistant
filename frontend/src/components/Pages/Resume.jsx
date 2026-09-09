import React, { useMemo, useState } from "react";
import BackButton from "../BackButton";
import AuthGate from "../AuthGate";
import API from "../../lib/api";
import { isAuthed, getToken } from "../../lib/auth";
import jsPDF from "jspdf";
import { ROLE_OPTIONS, getSkillsForRole, getBulletsForRole } from "../../lib/resumeSuggestions";

/* ============================================================
   EMPTY RESUME
============================================================ */

const emptyResume = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  github: "",
  targetRole: "",
  summary: "",
  skills: [],
  experience: [],
  projects: [],
  education: [],
  certifications: [],
  achievements: [],
  atsKeywords: [],
  recommendedSkills: [],
  skillGaps: [],
};

/* ============================================================
   HELPERS
============================================================ */

const splitList = (value = "") =>
  String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const toText = (item) => {
  if (typeof item === "string") return item;

  if (item && typeof item === "object") {
    return (
      item.name ||
      item.skill ||
      item.title ||
      item.description ||
      Object.values(item)[0] ||
      ""
    );
  }

  return String(item ?? "");
};

function normalizeGeneratedResume(result) {
  const data = {
    ...emptyResume,
    ...(result || {}),
  };

  data.skills = (
    Array.isArray(data.skills) ? data.skills : []
  )
    .map(toText)
    .filter(Boolean);

  data.recommendedSkills = (
    Array.isArray(data.recommendedSkills)
      ? data.recommendedSkills
      : []
  )
    .map(toText)
    .filter(Boolean);

  data.skillGaps = (
    Array.isArray(data.skillGaps)
      ? data.skillGaps
      : []
  )
    .map(toText)
    .filter(Boolean);

  data.atsKeywords = (
    Array.isArray(data.atsKeywords)
      ? data.atsKeywords
      : []
  )
    .map(toText)
    .filter(Boolean);

  data.certifications = (
    Array.isArray(data.certifications)
      ? data.certifications
      : []
  )
    .map(toText)
    .filter(Boolean);

  data.achievements = (
    Array.isArray(data.achievements)
      ? data.achievements
      : []
  )
    .map(toText)
    .filter(Boolean);

  /* ----------------------------------------------------------
     EXPERIENCE
  ---------------------------------------------------------- */

  data.experience = (
    Array.isArray(data.experience)
      ? data.experience
      : []
  ).map((exp) => {
    if (typeof exp === "string") {
      return {
        role: "",
        company: "",
        start: "",
        end: "",
        bullets: [exp],
      };
    }

    return {
      role: exp?.role || exp?.position || "",
      company: exp?.company || exp?.organization || "",
      start: exp?.start || exp?.startDate || "",
      end: exp?.end || exp?.endDate || "",
      duration: exp?.duration || "",
      bullets: Array.isArray(exp?.bullets)
        ? exp.bullets.map(toText).filter(Boolean)
        : exp?.description
        ? [String(exp.description)]
        : [],
    };
  });

  /* ----------------------------------------------------------
     PROJECTS
  ---------------------------------------------------------- */

  data.projects = (
    Array.isArray(data.projects)
      ? data.projects
      : []
  ).map((project) => {
    if (typeof project === "string") {
      return {
        title: project,
        bullets: [],
        technologies: [],
        description: "",
      };
    }

    let bullets = Array.isArray(project?.bullets)
      ? project.bullets.map(toText).filter(Boolean)
      : [];

    /*
     * If Gemini returns only a description, turn it into
     * readable bullet points.
     */
    if (
      !bullets.length &&
      typeof project?.description === "string" &&
      project.description.trim()
    ) {
      bullets = project.description
        .split(/\.\s+(?=[A-Z])/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) =>
          s.endsWith(".") ? s : `${s}.`
        );
    }

    return {
      title:
        project?.title ||
        project?.name ||
        "",
      bullets,
      description:
        project?.description || "",
      technologies: Array.isArray(
        project?.technologies
      )
        ? project.technologies
            .map(toText)
            .filter(Boolean)
        : [],
    };
  });

  /* ----------------------------------------------------------
     EDUCATION
  ---------------------------------------------------------- */

  data.education = (
    Array.isArray(data.education)
      ? data.education
      : []
  ).map((education) => {
    if (typeof education === "string") {
      return {
        degree: education,
        school: "",
        year: "",
        grade: "",
      };
    }

    return {
      degree:
        education?.degree ||
        education?.qualification ||
        "",
      school:
        education?.school ||
        education?.institution ||
        education?.college ||
        "",
      year:
        education?.year ||
        education?.date ||
        education?.duration ||
        "",
      grade:
        education?.grade ||
        education?.cgpa ||
        education?.percentage ||
        "",
    };
  });

  return data;
}

/* ============================================================
   COMPONENT
============================================================ */

function Resume() {
  const authed = isAuthed();

  /* ==========================================================
     FORM STATE
  ========================================================== */

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",

    targetRole: "",
    careerLevel: "Student / New Graduate",
    jobDescription: "",

    summary: "",
    skills: "",

    experience: "",
    projects: "",
    education: "",

    certifications: "",
    achievements: "",
  });

  /* ==========================================================
     GENERATED PREVIEW STATE
  ========================================================== */

  const [previewData, setPreviewData] =
    useState(emptyResume);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  /* ==========================================================
     WIZARD INPUT STATE
     Only the user-input experience is step-based; all existing
     generation, ATS, preview and PDF functionality stays intact.
  ========================================================== */
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [customSkill, setCustomSkill] = useState("");
  const [selectedBullets, setSelectedBullets] = useState([]);

  const WIZARD_STEPS = [
    { key: "role", label: "Target role" },
    { key: "contact", label: "Contact info" },
    { key: "profile", label: "Summary & skills" },
    { key: "experience", label: "Experience" },
    { key: "projects", label: "Projects" },
    { key: "extras", label: "Education & extras" },
    { key: "review", label: "Review & generate" },
  ];

  const stepComplete = (key) => {
    switch (key) {
      case "role": return Boolean(form.targetRole.trim());
      case "contact": return Boolean(form.fullName.trim() && form.email.trim());
      case "profile": return Boolean(form.summary.trim() || form.skills.trim());
      case "experience": return Boolean(form.experience.trim());
      case "projects": return Boolean(form.projects.trim());
      case "extras": return Boolean(form.education.trim());
      default: return false;
    }
  };

  const goToStep = (index) => setStepIndex(Math.max(0, Math.min(index, WIZARD_STEPS.length - 1)));
  const currentStep = WIZARD_STEPS[stepIndex];
  const completedCount = WIZARD_STEPS.slice(0, 6).filter((s) => stepComplete(s.key)).length;
  const completenessPct = Math.round((completedCount / 6) * 100);

  /* ==========================================================
     ATS UPLOAD STATE
  ========================================================== */

  const [uploadFile, setUploadFile] =
    useState(null);

  const [uploadLoading, setUploadLoading] =
    useState(false);

  const [uploadResult, setUploadResult] =
    useState(null);

  /* ==========================================================
     FORM UPDATE
  ========================================================== */

  const update = (key) => (e) => {
    const value = e.target.value;

    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

    /*
     * Clear an old error as soon as the user starts typing.
     */
    if (error) {
      setError("");
    }
  };

  /* ==========================================================
     SOURCE DATA FOR GEMINI
  ========================================================== */

  const sourceData = useMemo(
    () => ({
      ...form,
          name: form.fullName,
      careerLevel: form.careerLevel,
      resumeFormat: "single-page ATS",

      skills: splitList(form.skills),

      certifications: splitList(
        form.certifications
      ),

      achievements: splitList(
        form.achievements
      ),
    }),
    [form]
  );

  /* ==========================================================
     LIVE PREVIEW DATA
     
     IMPORTANT:
     Contact information comes DIRECTLY from `form`.
     
     This means:
     
     User types:
     Suvam Sundaram
     
     Preview:
     SUVAM SUNDARAM
     
     without waiting for Gemini.
  ========================================================== */

  const livePreviewData = useMemo(
    () => ({
      ...previewData,

      fullName:
        form.fullName.trim() ||
        previewData.fullName ||
        "",

      email:
        form.email.trim() ||
        previewData.email ||
        "",

      phone:
        form.phone.trim() ||
        previewData.phone ||
        "",

      location:
        form.location.trim() ||
        previewData.location ||
        "",

      linkedin:
        form.linkedin.trim() ||
        previewData.linkedin ||
        "",

      github:
        form.github.trim() ||
        previewData.github ||
        "",

      targetRole:
        form.targetRole.trim() ||
        previewData.targetRole ||
        "",
    }),
    [form, previewData]
  );

  /* ============================================================
     PDF DOWNLOAD
  ============================================================ */

  const downloadPDF = (data) => {
    const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
    const margin = 14;
    const width = 210 - margin * 2;
    const bottom = 283;
    let y = 15;

    const addText = (text, size = 8.6, bold = false, gap = 3.5, indent = 0) => {
      if (text === undefined || text === null || !String(text).trim()) return;
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(String(text), width - indent);
      lines.forEach((line) => {
        if (y > bottom) return;
        doc.text(line, margin + indent, y);
        y += gap;
      });
    };

    const section = (title) => {
      y += 1.5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text(title.toUpperCase(), margin, y);
      y += 1.4;
      doc.setLineWidth(0.25);
      doc.line(margin, y, 210 - margin, y);
      y += 3.6;
    };

    // Compact, ATS-safe A4 header: no icons, graphics, columns, or tables.
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text((data.fullName || "YOUR NAME").toUpperCase(), margin, y);
    y += 5;
    if (data.targetRole) addText(data.targetRole, 9.5, true, 3.4);

    const contact = [data.email, data.phone, data.location, data.linkedin, data.github]
      .filter(Boolean).join(" | ");
    if (contact) addText(contact, 8.1, false, 3.3);
    y += 1;

    if (data.summary) { section("Professional Summary"); addText(data.summary, 8.5, false, 3.45); }

    if (data.skills?.length) {
      section("Skills");
      addText(data.skills.slice(0, 20).join(" • "), 8.4, false, 3.35);
    }

    if (data.experience?.length) {
      section("Experience");
      data.experience.slice(0, 3).forEach((exp) => {
        addText([exp.role, exp.company].filter(Boolean).join(" | "), 9, true, 3.35);
        const dates = [exp.start, exp.end].filter(Boolean).join(" – ") || exp.duration || "";
        if (dates) addText(dates, 7.8, false, 3.1);
        (exp.bullets || []).slice(0, 4).forEach((b) => addText(`• ${b}`, 8.3, false, 3.35, 2));
        y += 0.5;
      });
    }

    if (data.projects?.length) {
      section("Projects");
      data.projects.slice(0, 3).forEach((project) => {
        addText(project.title || project.name || "", 9, true, 3.35);
        (project.bullets || []).slice(0, 3).forEach((b) => addText(`• ${b}`, 8.3, false, 3.35, 2));
        if (!(project.bullets?.length) && project.description) addText(project.description, 8.3, false, 3.35);
        if (project.technologies?.length) addText(`Technologies: ${project.technologies.join(", ")}`, 7.9, false, 3.1);
        y += 0.5;
      });
    }

    if (data.education?.length) {
      section("Education");
      data.education.slice(0, 2).forEach((e) => {
        addText([e.degree, e.school].filter(Boolean).join(" | "), 8.8, true, 3.3);
        addText([e.year, e.grade].filter(Boolean).join(" | "), 7.9, false, 3.1);
      });
    }

    if (data.certifications?.length) {
      section("Certifications");
      data.certifications.slice(0, 4).forEach((c) => addText(`• ${c}`, 8.2, false, 3.25, 2));
    }

    if (data.achievements?.length) {
      section("Achievements");
      data.achievements.slice(0, 4).forEach((a) => {
        const value = typeof a === "string" ? a : a?.title || a?.description || "";
        if (value) addText(`• ${value}`, 8.2, false, 3.25, 2);
      });
    }

    const safeName = (data.fullName || "Resume").trim().replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-");
    doc.save(`${safeName}-Resume.pdf`);
  };

  /* ============================================================
     BROWSER RESUME PREVIEW
  ============================================================ */

  const openResumePreview = (data) => {
    const newWindow = window.open("", "_blank");
    if (!newWindow) {
      setError("Your browser blocked the preview popup. Allow popups for this site, or use the PDF download.");
      return;
    }
    const escape = (value) => String(value || "").replace(/[&<>\"]/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
    const bullets = (items = []) => items.slice(0, 4).map((b) => `<li>${escape(b)}</li>`).join("");
    const projects = (data.projects || []).slice(0, 3).map((p) => `<div class="item"><div class="item-title">${escape(p.title || p.name)}</div>${p.bullets?.length ? `<ul>${bullets(p.bullets)}</ul>` : p.description ? `<p>${escape(p.description)}</p>` : ""}${p.technologies?.length ? `<div class="tech">Technologies: ${escape(p.technologies.join(", "))}</div>` : ""}</div>`).join("");
    const experience = (data.experience || []).slice(0, 3).map((e) => `<div class="item"><div class="item-title">${escape([e.role,e.company].filter(Boolean).join(" | "))}</div><div class="date">${escape([e.start,e.end].filter(Boolean).join(" – ") || e.duration)}</div><ul>${bullets(e.bullets)}</ul></div>`).join("");
    const education = (data.education || []).slice(0, 2).map((e) => `<div class="item"><div class="item-title">${escape([e.degree,e.school].filter(Boolean).join(" | "))}</div><div class="date">${escape([e.year,e.grade].filter(Boolean).join(" | "))}</div></div>`).join("");
    const list = (items = []) => items.slice(0, 4).map((x) => `<li>${escape(typeof x === "string" ? x : x?.title || x?.description)}</li>`).join("");
    const contact = [data.email,data.phone,data.location,data.linkedin,data.github].filter(Boolean).join(" | ");
    newWindow.document.open();
    newWindow.document.documentElement.innerHTML = `<!doctype html><html><head><meta charset="utf-8"><title>${escape(data.fullName || "Resume")}</title><style>
      *{box-sizing:border-box} body{margin:0;background:#eef1f4;font-family:Arial,Helvetica,sans-serif;color:#1f2933} .paper{width:210mm;min-height:297mm;margin:20px auto;background:#fff;padding:14mm 14mm 13mm;box-shadow:0 8px 30px rgba(0,0,0,.12)}
      h1{font-size:27px;margin:0 0 3px;text-transform:uppercase;letter-spacing:.2px} .role{font-size:12px;font-weight:700;margin-bottom:3px}.contact{font-size:10px;color:#4b5563;margin-bottom:8px;word-break:break-word}h2{font-size:11px;margin:9px 0 5px;text-transform:uppercase;border-bottom:1px solid #1f2933;padding-bottom:3px;letter-spacing:.25px}.summary,.skills,.item,p,li{font-size:10px;line-height:1.32}.summary{margin:0 0 2px}.skills{margin:0}.item{margin-bottom:6px}.item-title{font-weight:700;font-size:10.3px}.date,.tech{font-size:8.8px;color:#5f6b76;margin-top:1px}ul{margin:2px 0 0;padding-left:16px}li{margin:0 0 1px}p{margin:2px 0}@media print{body{background:#fff}.paper{margin:0;box-shadow:none;width:210mm;min-height:297mm;page-break-after:always}}
    </style></head><body><main class="paper">
      <h1>${escape(data.fullName || "YOUR NAME")}</h1>${data.targetRole ? `<div class="role">${escape(data.targetRole)}</div>` : ""}${contact ? `<div class="contact">${escape(contact)}</div>` : ""}
      ${data.summary ? `<h2>Professional Summary</h2><p class="summary">${escape(data.summary)}</p>` : ""}
      ${data.skills?.length ? `<h2>Skills</h2><p class="skills">${escape(data.skills.slice(0,20).join(" • "))}</p>` : ""}
      ${experience ? `<h2>Experience</h2>${experience}` : ""}${projects ? `<h2>Projects</h2>${projects}` : ""}${education ? `<h2>Education</h2>${education}` : ""}
      ${data.certifications?.length ? `<h2>Certifications</h2><ul>${list(data.certifications)}</ul>` : ""}${data.achievements?.length ? `<h2>Achievements</h2><ul>${list(data.achievements)}</ul>` : ""}
    </main></body></html>`;
    newWindow.document.close();
  };

  /* ============================================================
     GENERATE RESUME WITH GEMINI
  ============================================================ */

  async function handleGenerate(e) {
    e?.preventDefault();

    if (!isAuthed()) {
      setError(
        "Please log in to generate a resume."
      );

      return;
    }

    if (
      !form.fullName.trim() ||
      !form.targetRole.trim() ||
      !form.email.trim()
    ) {
      setError(
        "Please provide at least your full name, email, and target job role."
      );

      return;
    }

    setLoading(true);
    setError("");

    try {
      const controller =
        new AbortController();

      const timeout = setTimeout(
        () =>
          controller.abort(),
        180000
      );

      let response;

      try {
        const token =
          getToken();

        response =
          await fetch(
            `${
              import.meta.env
                .VITE_API_URL ||
              "http://localhost:4000"
            }/api/ai/generate`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                ...(token
                  ? {
                      Authorization: `Bearer ${token}`,
                    }
                  : {}),
              },

              body: JSON.stringify({
                data: sourceData,
              }),

              signal:
                controller.signal,
            }
          );
      } finally {
        clearTimeout(timeout);
      }

      const result =
        await response
          .json()
          .catch(() => ({}));

      if (
        !response.ok ||
        !result.resume
      ) {
        throw new Error(
          result.error ||
            result.message ||
            "Failed to generate resume."
        );
      }

      /* --------------------------------------------------------
         NORMALIZE GEMINI RESPONSE
      -------------------------------------------------------- */

      let data =
        normalizeGeneratedResume(
          result.resume
        );

      /* --------------------------------------------------------
         VERY IMPORTANT
         
         ALWAYS preserve the user's contact information.
         
         Gemini generates professional content.
         It should NOT replace the user's actual
         personal/contact information.
      -------------------------------------------------------- */

      data = {
        ...data,

        fullName:
          form.fullName.trim(),

        email:
          form.email.trim(),

        phone:
          form.phone.trim(),

        location:
          form.location.trim(),

        linkedin:
          form.linkedin.trim(),

        github:
          form.github.trim(),

        targetRole:
          form.targetRole.trim(),
      };

      /* --------------------------------------------------------
         SAVE FOR OTHER FEATURES
      -------------------------------------------------------- */

      try {
        localStorage.setItem(
          "generatedResume",
          JSON.stringify(data)
        );
      } catch (storageError) {
        console.warn(
          "Could not save generated resume:",
          storageError
        );
      }

      /* --------------------------------------------------------
         UPDATE PREVIEW
      -------------------------------------------------------- */

      setPreviewData(data);

      /* --------------------------------------------------------
         DOWNLOAD PDF
      -------------------------------------------------------- */

      downloadPDF(data);

      /* --------------------------------------------------------
         OPEN BROWSER PREVIEW
      -------------------------------------------------------- */

      openResumePreview(data);
    } catch (err) {
      console.error(
        "Resume generation error:",
        err
      );

      if (
        err?.name ===
        "AbortError"
      ) {
        setError(
          "AI request timed out. Check that the backend and Gemini API are running correctly."
        );
      } else {
        setError(
          err?.message ||
            "Error generating resume."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  /* ============================================================
     ATS FILE UPLOAD
  ============================================================ */

  async function handleUploadChange(
    e
  ) {
    const file =
      e.target.files?.[0];

    if (!file) return;

    if (!isAuthed()) {
      setError(
        "Please log in to upload a resume."
      );

      return;
    }

    setUploadFile(file);

    setUploadResult(null);

    setUploadLoading(true);

    setError("");

    try {
      const response =
        await API.uploadAts(
          file
        );

      if (
        response &&
        !response.error
      ) {
        setUploadResult(
          response.result ||
            response
        );
      } else {
        setError(
          response?.message ||
            "Could not read that file."
        );
      }
    } catch (err) {
      console.error(
        "ATS upload error:",
        err
      );

      setError(
        "Error uploading file."
      );
    } finally {
      setUploadLoading(
        false
      );
    }
  }

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="flex w-full justify-center px-4 pb-8">
      <div className="w-full max-w-7xl">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="ruled mb-6">

          <BackButton
            fallbackRoute="/db"
          />

          <h1 className="mt-2 text-3xl font-display font-bold">
            AI Professional Resume Maker
          </h1>

          <p className="muted mt-1">
            Build a recruiter-ready,
            ATS-friendly resume
            tailored to your target
            role.
          </p>

        </div>

        {/* ======================================================
            ATS UPLOAD
        ====================================================== */}

        <div className="card mb-6 p-4">

          <h2 className="font-display font-semibold mb-1">
            Optimize an existing resume
          </h2>

          <p className="text-sm muted mb-3">
            Optional: upload a PDF/DOCX
            to check its ATS readiness
            while you edit.
          </p>

          {authed ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

              <label className="btn btn-secondary w-fit cursor-pointer">

                <input
                  type="file"
                  accept="
                    application/pdf,
                    application/msword,
                    application/vnd.openxmlformats-officedocument.wordprocessingml.document
                  "
                  onChange={
                    handleUploadChange
                  }
                  className="hidden"
                />

                {uploadFile
                  ? "Choose a different file"
                  : "Choose file"}

              </label>

              {uploadLoading && (
                <span className="text-sm muted">

                  <span className="spinner" />

                  Reading file…

                </span>
              )}

              {uploadFile &&
                !uploadLoading && (
                  <span className="text-sm muted">
                    {uploadFile.name}
                  </span>
                )}

              {uploadResult?.score !==
                undefined && (
                <span className="stamp stamp-teal">
                  {uploadResult.score}%
                  ATS match
                </span>
              )}

            </div>
          ) : (
            <AuthGate
              action="upload an existing resume"
            />
          )}

        </div>

        {/* ======================================================
            MAIN GRID
        ====================================================== */}

        <div className="grid gap-6 lg:grid-cols-2">

          {/* ====================================================
              FORM
          ==================================================== */}

          <form onSubmit={handleGenerate} className="card p-5">

            {/* Wizard section navigation */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <span className="label" style={{ marginBottom: 0 }}>Your information</span>
                <span className="stamp stamp-teal" style={{ fontSize: "0.62rem", padding: "0.2em 0.6em" }}>{completenessPct}%</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {WIZARD_STEPS.map((step, i) => {
                  const done = i < 6 && stepComplete(step.key);
                  const active = i === stepIndex;
                  return (
                    <button
                      key={step.key}
                      type="button"
                      onClick={() => goToStep(i)}
                      className={`nav-btn ${active ? "active" : ""}`}
                      style={{ opacity: active || done ? 1 : 0.72 }}
                    >
                      <span style={{
                        width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.65rem", fontWeight: 700,
                        border: `1.5px solid ${done ? "var(--color-teal)" : "var(--color-border)"}`,
                        color: done ? "var(--color-teal)" : "var(--color-muted-foreground)",
                        background: done ? "color-mix(in srgb, var(--color-teal) 10%, transparent)" : "transparent"
                      }}>
                        {done ? "✓" : i + 1}
                      </span>
                      {step.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target role */}
            {currentStep.key === "role" && (
              <div className="space-y-4">
                <h2 className="font-display font-semibold text-lg">Target role</h2>
                <p className="text-xs muted -mt-2">Pick the closest match — this unlocks relevant skill and bullet suggestions in the next steps.</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {ROLE_OPTIONS.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, targetRole: role }))}
                      className="btn"
                      style={{
                        justifyContent: "flex-start",
                        border: `1.5px solid ${form.targetRole === role ? "var(--color-teal)" : "var(--color-border)"}`,
                        background: form.targetRole === role ? "color-mix(in srgb, var(--color-teal) 10%, transparent)" : "transparent",
                        color: form.targetRole === role ? "var(--color-teal)" : "var(--color-foreground)",
                      }}
                    >
                      {role}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="label">Not listed? Type your own</label>
                  <input className="input" placeholder="e.g. Cloud Security Analyst" value={form.targetRole} onChange={update("targetRole")} />
                </div>
                <div>
                  <label className="label">Career level</label>
                  <select className="input" value={form.careerLevel} onChange={update("careerLevel")}>
                    <option>Student / New Graduate</option>
                    <option>Internship</option>
                    <option>Entry Level</option>
                    <option>Experienced Professional</option>
                  </select>
                  <p className="text-xs muted mt-1">This helps the AI control resume length, wording, and section priority.</p>
                </div>
                <div>
                  <label className="label">Job description (recommended)</label>
                  <textarea className="textarea" rows="6" placeholder="Paste the job description here for stronger ATS keyword matching" value={form.jobDescription} onChange={update("jobDescription")} />
                  <p className="text-xs muted mt-1">For the best ATS result, paste the exact job description from the vacancy.</p>
                </div>
              </div>
            )}

            {/* Contact */}
            {currentStep.key === "contact" && (
              <div className="space-y-4">
                <h2 className="font-display font-semibold text-lg">Contact information</h2>
                <p className="text-xs muted -mt-2">These details are taken directly from your input and are never replaced by AI-generated information.</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><label className="label">Full name *</label><input className="input" value={form.fullName} onChange={update("fullName")} /></div>
                  <div><label className="label">Email *</label><input className="input" type="email" value={form.email} onChange={update("email")} /></div>
                  <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={update("phone")} /></div>
                  <div><label className="label">Location</label><input className="input" value={form.location} onChange={update("location")} /></div>
                  <div><label className="label">LinkedIn URL</label><input className="input" value={form.linkedin} onChange={update("linkedin")} /></div>
                  <div><label className="label">GitHub / Portfolio URL</label><input className="input" value={form.github} onChange={update("github")} /></div>
                </div>
              </div>
            )}

            {/* Summary & skills */}
            {currentStep.key === "profile" && (
              <div className="space-y-4">
                <h2 className="font-display font-semibold text-lg">Summary & skills</h2>
                <div>
                  <label className="label">Existing summary (optional)</label>
                  <textarea className="textarea" rows="4" placeholder="AI will rewrite it professionally" value={form.summary} onChange={update("summary")} />
                </div>
                <div>
                  <label className="label">Select your skills</label>
                  <p className="text-xs muted mb-2">Suggested for {form.targetRole || "your role"} — tap to select, or add your own below.</p>
                  <div className="flex flex-wrap gap-2">
                    {getSkillsForRole(form.targetRole).map((skill) => {
                      const active = selectedSkills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => {
                            const next = active ? selectedSkills.filter((s) => s !== skill) : [...selectedSkills, skill];
                            setSelectedSkills(next);
                            setForm((prev) => ({ ...prev, skills: next.join(", ") }));
                          }}
                          className="btn"
                          style={{
                            padding: "0.35em 0.7em",
                            border: `1.5px solid ${active ? "var(--color-teal)" : "var(--color-border)"}`,
                            color: active ? "var(--color-teal)" : "var(--color-foreground)",
                            background: active ? "color-mix(in srgb, var(--color-teal) 10%, transparent)" : "transparent",
                          }}
                        >
                          {active ? "✓ " : "+ "}{skill}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <input className="input" placeholder="Add a custom skill" value={customSkill} onChange={(e) => setCustomSkill(e.target.value)} />
                    <button type="button" className="btn btn-secondary" onClick={() => {
                      if (!customSkill.trim()) return;
                      const next = [...selectedSkills, customSkill.trim()];
                      setSelectedSkills(next);
                      setForm((prev) => ({ ...prev, skills: next.join(", ") }));
                      setCustomSkill("");
                    }}>Add</button>
                  </div>
                </div>
              </div>
            )}

            {/* Experience */}
            {currentStep.key === "experience" && (
              <div className="space-y-4">
                <h2 className="font-display font-semibold text-lg">Experience</h2>
                <p className="text-xs muted -mt-2">Leave blank if you're a fresher — that's fine.</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input className="input" id="resume-exp-role" placeholder="Job title (e.g. Web Developer Intern)" />
                  <input className="input" id="resume-exp-company" placeholder="Company" />
                  <input className="input" id="resume-exp-start" placeholder="Start date (e.g. June 2026)" />
                  <input className="input" id="resume-exp-end" placeholder="End date (or Present)" />
                </div>
                <div>
                  <label className="label">Suggested bullet points</label>
                  <p className="text-xs muted mb-2">Based on {form.targetRole || "your role"} — select the ones that apply.</p>
                  <div className="space-y-2">
                    {getBulletsForRole(form.targetRole).map((bullet, i) => {
                      const active = selectedBullets.includes(bullet);
                      return (
                        <label key={i} className="flex items-start gap-2 text-sm cursor-pointer">
                          <input type="checkbox" checked={active} onChange={() => setSelectedBullets((prev) => active ? prev.filter((b) => b !== bullet) : [...prev, bullet])} className="mt-1" />
                          <span>{bullet}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <button type="button" className="btn btn-primary w-full" onClick={() => {
                  const role = document.getElementById("resume-exp-role").value;
                  const company = document.getElementById("resume-exp-company").value;
                  const start = document.getElementById("resume-exp-start").value;
                  const end = document.getElementById("resume-exp-end").value;
                  const header = [role, company].filter(Boolean).join(" | ");
                  const dates = [start, end].filter(Boolean).join(" - ");
                  const block = [header, dates, ...selectedBullets].filter(Boolean).join("\n");
                  if (!block) return;
                  setForm((prev) => ({ ...prev, experience: prev.experience ? `${prev.experience}\n\n${block}` : block }));
                  setSelectedBullets([]);
                  document.getElementById("resume-exp-role").value = "";
                  document.getElementById("resume-exp-company").value = "";
                  document.getElementById("resume-exp-start").value = "";
                  document.getElementById("resume-exp-end").value = "";
                }}>Add this experience</button>
                {form.experience && <textarea className="textarea" rows="5" placeholder="Your experience entries" value={form.experience} onChange={update("experience")} />}
              </div>
            )}

            {/* Projects */}
            {currentStep.key === "projects" && (
              <div className="space-y-4">
                <h2 className="font-display font-semibold text-lg">Projects</h2>
                <p className="text-xs muted -mt-2">Include what you built, your contribution, and technologies you actually used.</p>
                <textarea className="textarea" rows="10" placeholder={"Example:\nAI Resume Generator\nBuilt an AI-powered resume generation application.\nTechnologies: React, JavaScript, Express, MongoDB"} value={form.projects} onChange={update("projects")} />
              </div>
            )}

            {/* Education & extras */}
            {currentStep.key === "extras" && (
              <div className="space-y-4">
                <h2 className="font-display font-semibold text-lg">Education & extras</h2>
                <div><label className="label">Education</label><textarea className="textarea" rows="3" placeholder="Degree | Institution | Year | CGPA/Percentage" value={form.education} onChange={update("education")} /></div>
                <div><label className="label">Certifications, comma separated</label><textarea className="textarea" rows="2" value={form.certifications} onChange={update("certifications")} /></div>
                <div><label className="label">Achievements, comma separated</label><textarea className="textarea" rows="2" value={form.achievements} onChange={update("achievements")} /></div>
              </div>
            )}

            {/* Review & generate */}
            {currentStep.key === "review" && (
              <div className="space-y-4">
                <h2 className="font-display font-semibold text-lg">Review & generate</h2>
                <p className="text-sm muted">Check the live preview on the right, then generate your ATS-optimized resume.</p>
                <div className="flex flex-wrap gap-2">
                  {WIZARD_STEPS.slice(0, 6).map((step) => (
                    <span key={step.key} className={`stamp ${stepComplete(step.key) ? "stamp-teal" : ""}`}>
                      {stepComplete(step.key) ? "✓ " : "— "}{step.label}
                    </span>
                  ))}
                </div>
                {authed ? (
                  <button type="submit" className="btn btn-accent w-full py-3" disabled={loading}>
                    {loading ? <><span className="spinner" /> AI is analyzing your profile and job requirements…</> : "Generate my ATS-ready one-page resume"}
                  </button>
                ) : <AuthGate action="generate an AI resume" />}
                {error && <p className="text-sm text-brick bg-brick/10 border border-brick/30 rounded-md px-3 py-2">{error}</p>}
              </div>
            )}

            <div className="flex justify-between mt-6 pt-4" style={{ borderTop: "1px solid var(--color-border)" }}>
              <button type="button" onClick={() => goToStep(stepIndex - 1)} className="btn btn-secondary" disabled={stepIndex === 0}>Back</button>
              {stepIndex < WIZARD_STEPS.length - 1 && <button type="button" onClick={() => goToStep(stepIndex + 1)} className="btn btn-primary">Continue</button>}
            </div>
          </form>

          {/* ====================================================
              LIVE RESUME PREVIEW
          ==================================================== */}

          <div
            className="card p-6"
            style={{
              background:
                "#fffdf8",
              color:
                "#22262f",
            }}
          >

            {/* --------------------------------------------------
                HEADER
            -------------------------------------------------- */}

            <div className="mb-5 flex items-start justify-between gap-3">

              <div>

                <p className="text-xs uppercase tracking-wider opacity-60">
                  Live ATS preview
                </p>

                <h2 className="text-2xl font-display font-bold uppercase">

                  {livePreviewData.fullName ||
                    "Your Name"}

                </h2>

              </div>

              {livePreviewData
                .atsKeywords
                ?.length > 0 && (
                <span className="stamp stamp-teal">
                  ATS optimized
                </span>
              )}

            </div>

            {/* --------------------------------------------------
                CONTACT INFORMATION
            -------------------------------------------------- */}

            <div className="mb-5 text-xs opacity-75">

              {[
                livePreviewData.email,
                livePreviewData.phone,
                livePreviewData.location,
                livePreviewData.linkedin,
                livePreviewData.github,
              ]
                .filter(Boolean)
                .join(" | ")}

            </div>

            {/* --------------------------------------------------
                TARGET ROLE
            -------------------------------------------------- */}

            {livePreviewData
              .targetRole && (
              <p className="mb-3 font-semibold">
                {
                  livePreviewData.targetRole
                }
              </p>
            )}

            {/* --------------------------------------------------
                SUMMARY
            -------------------------------------------------- */}

            {livePreviewData.summary && (
              <>
                <h3
                  className="mb-2 border-b font-display font-semibold"
                  style={{
                    borderColor:
                      "#ddd7c4",
                  }}
                >
                  Professional Summary
                </h3>

                <p className="mb-4 text-sm">
                  {
                    livePreviewData.summary
                  }
                </p>
              </>
            )}

            {/* --------------------------------------------------
                SKILLS
            -------------------------------------------------- */}

            {livePreviewData.skills
              ?.length > 0 && (
              <>
                <h3
                  className="mb-2 border-b font-display font-semibold"
                  style={{
                    borderColor:
                      "#ddd7c4",
                  }}
                >
                  Skills
                </h3>

                <p className="mb-4 text-sm">
                  {livePreviewData.skills.join(
                    " • "
                  )}
                </p>
              </>
            )}

            {/* --------------------------------------------------
                EXPERIENCE
            -------------------------------------------------- */}

            {livePreviewData
              .experience
              ?.length > 0 && (
              <>
                <h3
                  className="mb-2 border-b font-display font-semibold"
                  style={{
                    borderColor:
                      "#ddd7c4",
                  }}
                >
                  Experience
                </h3>

                {livePreviewData.experience.map(
                  (experience, index) => (
                    <div
                      className="mb-4 text-sm"
                      key={index}
                    >

                      <strong>
                        {experience.role}

                        {experience.company
                          ? ` | ${experience.company}`
                          : ""}
                      </strong>

                      <div className="text-xs opacity-60">
                        {[
                          experience.start,
                          experience.end,
                        ]
                          .filter(Boolean)
                          .join(
                            " – "
                          )}
                      </div>

                      {experience
                        .bullets
                        ?.length > 0 && (
                        <ul className="mt-1">
                          {experience.bullets.map(
                            (
                              bullet,
                              bulletIndex
                            ) => (
                              <li
                                key={
                                  bulletIndex
                                }
                              >
                                • {bullet}
                              </li>
                            )
                          )}
                        </ul>
                      )}

                    </div>
                  )
                )}
              </>
            )}

            {/* --------------------------------------------------
                PROJECTS
            -------------------------------------------------- */}

            {livePreviewData
              .projects
              ?.length > 0 && (
              <>
                <h3
                  className="mb-2 border-b font-display font-semibold"
                  style={{
                    borderColor:
                      "#ddd7c4",
                  }}
                >
                  Projects
                </h3>

                {livePreviewData.projects.map(
                  (project, index) => (
                    <div
                      className="mb-4 text-sm"
                      key={index}
                    >

                      <strong>
                        {
                          project.title
                        }
                      </strong>

                      {project.bullets
                        ?.length > 0 ? (
                        <ul className="mt-1">
                          {project.bullets.map(
                            (
                              bullet,
                              bulletIndex
                            ) => (
                              <li
                                key={
                                  bulletIndex
                                }
                              >
                                • {bullet}
                              </li>
                            )
                          )}
                        </ul>
                      ) : project.description ? (
                        <p>
                          {
                            project.description
                          }
                        </p>
                      ) : null}

                      {project
                        .technologies
                        ?.length > 0 && (
                        <p className="mt-1 text-xs">
                          <b>
                            Technologies:
                          </b>{" "}
                          {project.technologies.join(
                            ", "
                          )}
                        </p>
                      )}

                    </div>
                  )
                )}
              </>
            )}

            {/* --------------------------------------------------
                EDUCATION
            -------------------------------------------------- */}

            {livePreviewData
              .education
              ?.length > 0 && (
              <>
                <h3
                  className="mb-2 border-b font-display font-semibold"
                  style={{
                    borderColor:
                      "#ddd7c4",
                  }}
                >
                  Education
                </h3>

                {livePreviewData.education.map(
                  (
                    education,
                    index
                  ) => (
                    <div
                      className="mb-3 text-sm"
                      key={index}
                    >

                      <strong>
                        {
                          education.degree
                        }
                      </strong>

                      <div>
                        {
                          education.school
                        }
                      </div>

                      <div className="text-xs opacity-60">
                        {[
                          education.year,
                          education.grade,
                        ]
                          .filter(Boolean)
                          .join(
                            " | "
                          )}
                      </div>

                    </div>
                  )
                )}
              </>
            )}

            {/* --------------------------------------------------
                CERTIFICATIONS
            -------------------------------------------------- */}

            {livePreviewData
              .certifications
              ?.length > 0 && (
              <>
                <h3
                  className="mb-2 border-b font-display font-semibold"
                  style={{
                    borderColor:
                      "#ddd7c4",
                  }}
                >
                  Certifications
                </h3>

                <ul className="mb-4 text-sm">

                  {livePreviewData.certifications.map(
                    (
                      certification,
                      index
                    ) => (
                      <li
                        key={index}
                      >
                        •{" "}
                        {
                          certification
                        }
                      </li>
                    )
                  )}

                </ul>
              </>
            )}

            {/* --------------------------------------------------
                ACHIEVEMENTS
            -------------------------------------------------- */}

            {livePreviewData
              .achievements
              ?.length > 0 && (
              <>
                <h3
                  className="mb-2 border-b font-display font-semibold"
                  style={{
                    borderColor:
                      "#ddd7c4",
                  }}
                >
                  Achievements
                </h3>

                <ul className="mb-4 text-sm">

                  {livePreviewData.achievements.map(
                    (
                      achievement,
                      index
                    ) => {
                      const text =
                        typeof achievement ===
                        "string"
                          ? achievement
                          : achievement?.title ||
                            achievement?.description ||
                            "";

                      return (
                        <li
                          key={index}
                        >
                          • {text}
                        </li>
                      );
                    }
                  )}

                </ul>
              </>
            )}

            {/* --------------------------------------------------
                ATS KEYWORDS
            -------------------------------------------------- */}

            {livePreviewData
              .atsKeywords
              ?.length > 0 && (
              <>
                <h3
                  className="mb-2 border-b font-display font-semibold"
                  style={{
                    borderColor:
                      "#ddd7c4",
                  }}
                >
                  ATS Keywords
                </h3>

                <p className="text-xs">
                  {livePreviewData.atsKeywords.join(
                    " • "
                  )}
                </p>
              </>
            )}

            {/* --------------------------------------------------
                AI RECOMMENDED SKILLS
            -------------------------------------------------- */}

            {livePreviewData
              .recommendedSkills
              ?.length > 0 && (
              <div className="mt-5 rounded-xl border border-violet-300 bg-violet-50 p-3">

                <h3 className="font-semibold text-sm">
                  AI Recommended Skills
                </h3>

                <p className="mt-1 text-xs opacity-70">
                  These are relevant to the
                  target role but should only
                  be added to your resume if
                  you genuinely have them.
                </p>

                <p className="mt-2 text-xs">
                  {livePreviewData.recommendedSkills.join(
                    " • "
                  )}
                </p>

              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}

export default Resume;