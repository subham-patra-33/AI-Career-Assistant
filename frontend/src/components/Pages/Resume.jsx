import React, { useMemo, useState } from "react";
import BackButton from "../BackButton";
import AuthGate from "../AuthGate";
import API from "../../lib/api";
import { isAuthed, getToken } from "../../lib/auth";
import jsPDF from "jspdf";

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
    const doc = new jsPDF({
      unit: "mm",
      format: "a4",
    });

    const margin = 17;

    const width =
      210 - margin * 2;

    const bottom = 282;

    let y = 18;

    /* ----------------------------------------------------------
       ADD TEXT
    ---------------------------------------------------------- */

    const addText = (
      text,
      size = 9.5,
      bold = false,
      gap = 4.5
    ) => {
      if (
        text === undefined ||
        text === null ||
        String(text).trim() === ""
      ) {
        return;
      }

      doc.setFont(
        "helvetica",
        bold ? "bold" : "normal"
      );

      doc.setFontSize(size);

      const lines =
        doc.splitTextToSize(
          String(text),
          width
        );

      lines.forEach((line) => {
        if (y > bottom) {
          doc.addPage();
          y = 18;
        }

        doc.text(
          line,
          margin,
          y
        );

        y += gap;
      });
    };

    /* ----------------------------------------------------------
       SECTION
    ---------------------------------------------------------- */

    const section = (title) => {
      if (y > bottom - 12) {
        doc.addPage();
        y = 18;
      }

      y += 2;

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(10.5);

      doc.text(
        title.toUpperCase(),
        margin,
        y
      );

      y += 1.5;

      doc.line(
        margin,
        y,
        210 - margin,
        y
      );

      y += 5;
    };

    /* ----------------------------------------------------------
       HEADER
    ---------------------------------------------------------- */

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(19);

    doc.text(
      (
        data.fullName ||
        "YOUR NAME"
      ).toUpperCase(),
      margin,
      y
    );

    y += 6;

    if (data.targetRole) {
      addText(
        data.targetRole,
        10,
        true,
        4.5
      );
    }

    const contact = [
      data.email,
      data.phone,
      data.location,
      data.linkedin,
      data.github,
    ]
      .filter(Boolean)
      .join(" | ");

    if (contact) {
      addText(
        contact,
        8.5,
        false,
        4.5
      );
    }

    /* ----------------------------------------------------------
       SUMMARY
    ---------------------------------------------------------- */

    if (data.summary) {
      section(
        "Professional Summary"
      );

      addText(
        data.summary,
        9.5,
        false,
        4.5
      );
    }

    /* ----------------------------------------------------------
       SKILLS
    ---------------------------------------------------------- */

    if (
      data.skills?.length
    ) {
      section("Skills");

      addText(
        data.skills.join(" • "),
        9.5,
        false,
        4.5
      );
    }

    /* ----------------------------------------------------------
       EXPERIENCE
    ---------------------------------------------------------- */

    if (
      data.experience?.length
    ) {
      section("Experience");

      data.experience.forEach(
        (exp) => {
          addText(
            [
              exp.role,
              exp.company,
            ]
              .filter(Boolean)
              .join(" | "),
            10,
            true,
            4.5
          );

          const dates = [
            exp.start,
            exp.end,
          ]
            .filter(Boolean)
            .join(" – ");

          if (dates) {
            addText(
              dates,
              8.5,
              false,
              4
            );
          }

          (
            exp.bullets || []
          ).forEach((bullet) => {
            addText(
              `• ${bullet}`,
              9.2,
              false,
              4.3
            );
          });

          y += 1;
        }
      );
    }

    /* ----------------------------------------------------------
       PROJECTS
    ---------------------------------------------------------- */

    if (
      data.projects?.length
    ) {
      section("Projects");

      data.projects.forEach(
        (project) => {
          addText(
            project.title ||
              project.name ||
              "",
            10,
            true,
            4.5
          );

          if (
            project.bullets?.length
          ) {
            project.bullets.forEach(
              (bullet) => {
                addText(
                  `• ${bullet}`,
                  9.2,
                  false,
                  4.3
                );
              }
            );
          } else if (
            project.description
          ) {
            addText(
              project.description,
              9.2,
              false,
              4.3
            );
          }

          if (
            project.technologies
              ?.length
          ) {
            addText(
              `Technologies: ${project.technologies.join(
                ", "
              )}`,
              8.8,
              false,
              4.2
            );
          }

          y += 1;
        }
      );
    }

    /* ----------------------------------------------------------
       EDUCATION
    ---------------------------------------------------------- */

    if (
      data.education?.length
    ) {
      section("Education");

      data.education.forEach(
        (education) => {
          addText(
            [
              education.degree,
              education.school,
            ]
              .filter(Boolean)
              .join(" | "),
            9.8,
            true,
            4.5
          );

          addText(
            [
              education.year,
              education.grade,
            ]
              .filter(Boolean)
              .join(" | "),
            8.8,
            false,
            4.2
          );
        }
      );
    }

    /* ----------------------------------------------------------
       CERTIFICATIONS
    ---------------------------------------------------------- */

    if (
      data.certifications?.length
    ) {
      section(
        "Certifications"
      );

      data.certifications.forEach(
        (certification) => {
          addText(
            `• ${certification}`,
            9.2,
            false,
            4.3
          );
        }
      );
    }

    /* ----------------------------------------------------------
       ACHIEVEMENTS
    ---------------------------------------------------------- */

    if (
      data.achievements?.length
    ) {
      section("Achievements");

      data.achievements.forEach(
        (achievement) => {
          const text =
            typeof achievement ===
            "string"
              ? achievement
              : achievement?.title ||
                achievement?.description ||
                "";

          if (text) {
            addText(
              `• ${text}`,
              9.2,
              false,
              4.3
            );
          }
        }
      );
    }

    /* ----------------------------------------------------------
       SAFE FILE NAME
    ---------------------------------------------------------- */

    const safeName = (
      data.fullName ||
      "Resume"
    )
      .trim()
      .replace(
        /[^a-zA-Z0-9\s-]/g,
        ""
      )
      .replace(
        /\s+/g,
        "-"
      );

    doc.save(
      `${safeName}-Resume.pdf`
    );
  };

  /* ============================================================
     BROWSER RESUME PREVIEW
  ============================================================ */

  const openResumePreview = (
    data
  ) => {
    const newWindow =
      window.open(
        "",
        "_blank"
      );

    if (!newWindow) {
      setError(
        "Your browser blocked the preview popup. Allow popups for this site, or use the PDF download."
      );

      return;
    }

    const escape = (value) =>
      String(value || "")
        .replace(
          /[&<>\"]/g,
          (char) =>
            ({
              "&": "&amp;",
              "<": "&lt;",
              ">": "&gt;",
              '"': "&quot;",
            }[char])
        );

    /* ----------------------------------------------------------
       PROJECT HTML
    ---------------------------------------------------------- */

    const projectHtml = (
      data.projects || []
    )
      .map(
        (project) => `
          <div class="item">
            <b>${escape(
              project.title ||
                project.name
            )}</b>

            ${
              project.bullets
                ?.length
                ? `
                  <ul>
                    ${project.bullets
                      .map(
                        (bullet) =>
                          `<li>${escape(
                            bullet
                          )}</li>`
                      )
                      .join("")}
                  </ul>
                `
                : project.description
                ? `<p>${escape(
                    project.description
                  )}</p>`
                : ""
            }

            ${
              project.technologies
                ?.length
                ? `
                  <small>
                    Technologies:
                    ${escape(
                      project.technologies.join(
                        ", "
                      )
                    )}
                  </small>
                `
                : ""
            }
          </div>
        `
      )
      .join("");

    /* ----------------------------------------------------------
       EXPERIENCE HTML
    ---------------------------------------------------------- */

    const experienceHtml = (
      data.experience || []
    )
      .map(
        (experience) => `
          <div class="item">

            <b>
              ${escape(
                experience.role
              )}

              ${
                experience.company
                  ? ` | ${escape(
                      experience.company
                    )}`
                  : ""
              }
            </b>

            <small>
              ${escape(
                [
                  experience.start,
                  experience.end,
                ]
                  .filter(Boolean)
                  .join(" – ")
              )}
            </small>

            <ul>
              ${(experience.bullets ||
                [])
                .map(
                  (bullet) =>
                    `<li>${escape(
                      bullet
                    )}</li>`
                )
                .join("")}
            </ul>

          </div>
        `
      )
      .join("");

    /* ----------------------------------------------------------
       EDUCATION HTML
    ---------------------------------------------------------- */

    const educationHtml = (
      data.education || []
    )
      .map(
        (education) => `
          <div class="item">

            <b>
              ${escape(
                education.degree
              )}
            </b>

            <div>
              ${escape(
                education.school
              )}
            </div>

            <small>
              ${escape(
                [
                  education.year,
                  education.grade,
                ]
                  .filter(Boolean)
                  .join(" | ")
              )}
            </small>

          </div>
        `
      )
      .join("");

    /* ----------------------------------------------------------
       CONTACT
    ---------------------------------------------------------- */

    const contact = [
      data.email,
      data.phone,
      data.location,
      data.linkedin,
      data.github,
    ]
      .filter(Boolean)
      .join(" | ");

    /* ----------------------------------------------------------
       FULL HTML DOCUMENT
    ---------------------------------------------------------- */

    newWindow.document.open();

    newWindow.document.documentElement.innerHTML = `
      <head>

        <meta charset="utf-8" />

        <title>
          ${escape(
            data.fullName ||
              "Resume"
          )}
        </title>

        <style>

          * {
            box-sizing: border-box;
          }

          body {
            font-family:
              Arial,
              Helvetica,
              sans-serif;

            color: #20242b;

            max-width: 800px;

            margin: 40px auto;

            padding:
              0 35px;

            line-height: 1.45;

            background: #ffffff;
          }

          h1 {
            font-size: 30px;

            margin:
              0 0 4px 0;

            text-transform:
              uppercase;

            letter-spacing:
              0.2px;
          }

          h2 {
            font-size: 14px;

            text-transform:
              uppercase;

            border-bottom:
              1px solid #333;

            padding-bottom: 4px;

            margin-top: 22px;

            margin-bottom: 8px;
          }

          .role {
            font-size: 13px;

            font-weight: 600;

            margin-bottom: 3px;
          }

          .contact {
            font-size: 12px;

            color: #555;

            margin-bottom: 5px;
          }

          .item {
            margin-bottom: 12px;
          }

          .item b {
            font-size: 13px;
          }

          .item small {
            display: block;

            font-size: 11px;

            color: #666;

            margin-top: 2px;
          }

          p {
            margin:
              4px 0;
          }

          ul {
            margin:
              5px 0;

            padding-left:
              20px;
          }

          li {
            margin-bottom:
              2px;

            font-size: 12px;
          }

          .skills {
            font-size: 12px;
          }

          @media print {

            body {
              margin: 0;

              max-width:
                none;

              padding:
                15mm 17mm;
            }

          }

        </style>

      </head>

      <body>

        <h1>
          ${escape(
            data.fullName ||
              "YOUR NAME"
          )}
        </h1>

        ${
          data.targetRole
            ? `
              <div class="role">
                ${escape(
                  data.targetRole
                )}
              </div>
            `
            : ""
        }

        ${
          contact
            ? `
              <div class="contact">
                ${escape(
                  contact
                )}
              </div>
            `
            : ""
        }

        ${
          data.summary
            ? `
              <h2>
                Professional Summary
              </h2>

              <p>
                ${escape(
                  data.summary
                )}
              </p>
            `
            : ""
        }

        ${
          data.skills?.length
            ? `
              <h2>
                Skills
              </h2>

              <p class="skills">
                ${escape(
                  data.skills.join(
                    " • "
                  )
                )}
              </p>
            `
            : ""
        }

        ${
          experienceHtml
            ? `
              <h2>
                Experience
              </h2>

              ${experienceHtml}
            `
            : ""
        }

        ${
          projectHtml
            ? `
              <h2>
                Projects
              </h2>

              ${projectHtml}
            `
            : ""
        }

        ${
          educationHtml
            ? `
              <h2>
                Education
              </h2>

              ${educationHtml}
            `
            : ""
        }

        ${
          data.certifications
            ?.length
            ? `
              <h2>
                Certifications
              </h2>

              <ul>
                ${data.certifications
                  .map(
                    (certification) =>
                      `<li>${escape(
                        certification
                      )}</li>`
                  )
                  .join("")}
              </ul>
            `
            : ""
        }

        ${
          data.achievements
            ?.length
            ? `
              <h2>
                Achievements
              </h2>

              <ul>
                ${data.achievements
                  .map(
                    (achievement) => {
                      const text =
                        typeof achievement ===
                        "string"
                          ? achievement
                          : achievement?.title ||
                            achievement?.description ||
                            "";

                      return `<li>${escape(
                        text
                      )}</li>`;
                    }
                  )
                  .join("")}
              </ul>
            `
            : ""
        }

        ${
          data.atsKeywords
            ?.length
            ? `
              <h2>
                ATS Keywords
              </h2>

              <p class="skills">
                ${escape(
                  data.atsKeywords.join(
                    " • "
                  )
                )}
              </p>
            `
            : ""
        }

      </body>
    `;

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
        60000
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
            GENERATE BUTTON
        ====================================================== */}

        {authed ? (
          <div className="mb-5">

            <button
              type="button"
              onClick={
                handleGenerate
              }
              className="btn btn-accent w-full py-3"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" />

                  AI is analyzing
                  your profile and
                  job requirements…
                </>
              ) : (
                "Generate professional ATS resume"
              )}
            </button>

          </div>
        ) : (
          <AuthGate
            action="generate an AI resume"
          />
        )}

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

          <form
            onSubmit={
              handleGenerate
            }
            className="card space-y-4 p-5"
          >

            {/* --------------------------------------------------
                TARGET ROLE
            -------------------------------------------------- */}

            <div>

              <h2 className="font-display font-semibold">
                1. Target role
              </h2>

              <p className="text-xs muted">
                The target role and job
                description drive ATS
                keyword optimization.
              </p>

            </div>

            <input
              className="input"
              placeholder="Target Job Role * e.g. Full Stack Developer"
              value={
                form.targetRole
              }
              onChange={update(
                "targetRole"
              )}
            />

            <textarea
              className="textarea"
              rows="5"
              placeholder="Paste the job description here (recommended for ATS optimization)"
              value={
                form.jobDescription
              }
              onChange={update(
                "jobDescription"
              )}
            />

            {/* --------------------------------------------------
                CONTACT
            -------------------------------------------------- */}

            <div>

              <h2 className="font-display font-semibold">
                2. Contact information
              </h2>

              <p className="text-xs muted mt-1">
                These details are taken
                directly from your input
                and are never replaced by
                AI-generated information.
              </p>

            </div>

            <div className="grid gap-3 sm:grid-cols-2">

              <input
                className="input"
                placeholder="Full Name *"
                value={
                  form.fullName
                }
                onChange={update(
                  "fullName"
                )}
              />

              <input
                className="input"
                type="email"
                placeholder="Email *"
                value={
                  form.email
                }
                onChange={update(
                  "email"
                )}
              />

              <input
                className="input"
                placeholder="Phone"
                value={
                  form.phone
                }
                onChange={update(
                  "phone"
                )}
              />

              <input
                className="input"
                placeholder="Location"
                value={
                  form.location
                }
                onChange={update(
                  "location"
                )}
              />

              <input
                className="input"
                placeholder="LinkedIn URL"
                value={
                  form.linkedin
                }
                onChange={update(
                  "linkedin"
                )}
              />

              <input
                className="input"
                placeholder="GitHub / Portfolio URL"
                value={
                  form.github
                }
                onChange={update(
                  "github"
                )}
              />

            </div>

            {/* --------------------------------------------------
                PROFESSIONAL PROFILE
            -------------------------------------------------- */}

            <div>

              <h2 className="font-display font-semibold">
                3. Professional profile
              </h2>

            </div>

            <textarea
              className="textarea"
              rows="4"
              placeholder="Existing summary (optional). AI will rewrite it professionally."
              value={
                form.summary
              }
              onChange={update(
                "summary"
              )}
            />

            <textarea
              className="textarea"
              rows="3"
              placeholder="Skills, comma separated — e.g. React, JavaScript, MongoDB, Git"
              value={
                form.skills
              }
              onChange={update(
                "skills"
              )}
            />

            {/* --------------------------------------------------
                EXPERIENCE
            -------------------------------------------------- */}

            <div>

              <h2 className="font-display font-semibold">
                4. Experience
              </h2>

              <p className="text-xs muted">
                Enter your actual
                experience. Include
                company, role, dates and
                responsibilities.
                Separate entries with
                blank lines.
              </p>

            </div>

            <textarea
              className="textarea"
              rows="7"
              placeholder={`Example:
Web Developer Intern | Gauravgo Games | June 2026 - Present
Worked on SEO-optimized gaming website and frontend development.`}
              value={
                form.experience
              }
              onChange={update(
                "experience"
              )}
            />

            {/* --------------------------------------------------
                PROJECTS
            -------------------------------------------------- */}

            <div>

              <h2 className="font-display font-semibold">
                5. Projects
              </h2>

              <p className="text-xs muted">
                Include what you built,
                your contribution, and
                technologies you actually
                used.
              </p>

            </div>

            <textarea
              className="textarea"
              rows="7"
              placeholder={`Example:
AI Resume Generator
Built an AI-powered resume generation application.
Technologies: React, JavaScript, Express, MongoDB`}
              value={
                form.projects
              }
              onChange={update(
                "projects"
              )}
            />

            {/* --------------------------------------------------
                EDUCATION
            -------------------------------------------------- */}

            <div>

              <h2 className="font-display font-semibold">
                6. Education
              </h2>

            </div>

            <textarea
              className="textarea"
              rows="4"
              placeholder="Degree | Institution | Year | CGPA/Percentage"
              value={
                form.education
              }
              onChange={update(
                "education"
              )}
            />

            {/* --------------------------------------------------
                CERTIFICATIONS
            -------------------------------------------------- */}

            <textarea
              className="textarea"
              rows="3"
              placeholder="Certifications, comma separated"
              value={
                form.certifications
              }
              onChange={update(
                "certifications"
              )}
            />

            {/* --------------------------------------------------
                ACHIEVEMENTS
            -------------------------------------------------- */}

            <textarea
              className="textarea"
              rows="3"
              placeholder="Achievements, comma separated"
              value={
                form.achievements
              }
              onChange={update(
                "achievements"
              )}
            />

            {/* --------------------------------------------------
                ERROR
            -------------------------------------------------- */}

            {error && (
              <p className="rounded-md border border-brick/30 bg-brick/10 px-3 py-2 text-sm text-brick">
                {error}
              </p>
            )}

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