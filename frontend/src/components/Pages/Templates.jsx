import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import API from "../../lib/api";

// ============================================================
// RESUME TEMPLATE COLLECTION
// ============================================================

const RESUME_TEMPLATES = [
  {
    id: "modern",
    name: "Modern",
    category: "modern",
    description:
      "Clean modern resume with bold typography and balanced spacing.",
    color: "#6366f1",
    features: [
      "Modern design",
      "ATS-friendly",
      "Professional",
    ],
    variant: "modern",
  },

  {
    id: "classic",
    name: "Classic Professional",
    category: "professional",
    description:
      "Traditional professional layout suitable for corporate applications.",
    color: "#1e293b",
    features: [
      "Corporate",
      "Traditional",
      "ATS-friendly",
    ],
    variant: "classic",
  },

  {
    id: "minimal",
    name: "Minimal",
    category: "ats",
    description:
      "Simple, clean and highly readable resume focused on content.",
    color: "#64748b",
    features: [
      "Minimal",
      "ATS-friendly",
      "Clean",
    ],
    variant: "minimal",
  },

  {
    id: "modern-minimal",
    name: "Modern Minimal",
    category: "modern",
    description:
      "Elegant whitespace, modern typography and subtle accent colors.",
    color: "#2563eb",
    features: [
      "Whitespace",
      "Modern",
      "Clean",
    ],
    variant: "modern-minimal",
  },

  {
    id: "executive",
    name: "Executive",
    category: "professional",
    description:
      "Sophisticated executive resume for experienced professionals and leaders.",
    color: "#334155",
    features: [
      "Executive",
      "Leadership",
      "Premium",
    ],
    variant: "executive",
  },

  {
    id: "creative-bold",
    name: "Creative Bold",
    category: "creative",
    description:
      "Strong visual hierarchy and colorful accents for creative professionals.",
    color: "#7c3aed",
    features: [
      "Creative",
      "Bold colors",
      "Two-column",
    ],
    variant: "creative",
  },

  {
    id: "two-column",
    name: "Two Column",
    category: "modern",
    description:
      "Information-rich two-column layout with a strong professional structure.",
    color: "#0f766e",
    features: [
      "Two-column",
      "Organized",
      "Modern",
    ],
    variant: "two-column",
  },

  {
    id: "tech-developer",
    name: "Tech Developer",
    category: "tech",
    description:
      "Developer-focused design with terminal-inspired styling and technical sections.",
    color: "#16a34a",
    features: [
      "Developer",
      "Technical",
      "Terminal",
    ],
    variant: "tech",
  },

  {
    id: "academic",
    name: "Academic",
    category: "academic",
    description:
      "Formal academic CV with strong emphasis on education, research and publications.",
    color: "#7c3aed",
    features: [
      "Academic",
      "Research",
      "Formal",
    ],
    variant: "academic",
  },

  {
    id: "elegant",
    name: "Elegant",
    category: "professional",
    description:
      "Refined typography and sophisticated styling for polished applications.",
    color: "#be123c",
    features: [
      "Elegant",
      "Refined",
      "Premium",
    ],
    variant: "elegant",
  },

  {
    id: "gradient-modern",
    name: "Gradient Modern",
    category: "modern",
    description:
      "Contemporary resume with vibrant gradient accents and modern cards.",
    color: "#8b5cf6",
    features: [
      "Gradient",
      "Modern",
      "Colorful",
    ],
    variant: "gradient",
  },

  {
    id: "colorful-vibrant",
    name: "Colorful Vibrant",
    category: "creative",
    description:
      "Energetic multi-color design for marketing, design and creative roles.",
    color: "#f43f5e",
    features: [
      "Vibrant",
      "Creative",
      "Colorful",
    ],
    variant: "vibrant",
  },

  {
    id: "compact",
    name: "Compact",
    category: "ats",
    description:
      "Space-efficient resume for candidates with extensive information.",
    color: "#475569",
    features: [
      "Compact",
      "ATS-friendly",
      "Dense",
    ],
    variant: "compact",
  },

  {
    id: "timeline",
    name: "Timeline",
    category: "modern",
    description:
      "Timeline-based experience layout that clearly communicates career progression.",
    color: "#0891b2",
    features: [
      "Timeline",
      "Modern",
      "Career-focused",
    ],
    variant: "timeline",
  },

  {
    id: "portfolio",
    name: "Portfolio",
    category: "creative",
    description:
      "Portfolio-inspired design with strong visual sections and project emphasis.",
    color: "#ea580c",
    features: [
      "Portfolio",
      "Projects",
      "Creative",
    ],
    variant: "portfolio",
  },

  {
    id: "infographic",
    name: "Infographic",
    category: "creative",
    description:
      "Visual resume using cards, skill indicators and strong visual hierarchy.",
    color: "#2563eb",
    features: [
      "Infographic",
      "Visual",
      "Skills",
    ],
    variant: "infographic",
  },

  {
    id: "photo-professional",
    name: "Photo Professional",
    category: "photo",
    description:
      "Professional photo resume with a polished sidebar layout.",
    color: "#0f766e",
    features: [
      "Photo",
      "Professional",
      "Sidebar",
    ],
    variant: "photo",
  },

  {
    id: "fresh-graduate",
    name: "Fresh Graduate",
    category: "graduate",
    description:
      "Modern entry-level resume designed to highlight education and projects.",
    color: "#2563eb",
    features: [
      "Graduate",
      "Projects",
      "Entry-level",
    ],
    variant: "graduate",
  },

  {
    id: "marketing-creative",
    name: "Marketing Creative",
    category: "creative",
    description:
      "Colorful marketing-oriented design with campaign and achievement sections.",
    color: "#db2777",
    features: [
      "Marketing",
      "Creative",
      "Colorful",
    ],
    variant: "marketing",
  },

  {
    id: "international-cv",
    name: "International CV",
    category: "professional",
    description:
      "Structured international CV layout suitable for global applications.",
    color: "#0369a1",
    features: [
      "International",
      "Professional",
      "Structured",
    ],
    variant: "international",
  },

  {
    id: "animated-modern",
    name: "Animated Modern",
    category: "modern",
    description:
      "Dynamic modern resume concept with gradient accents and contemporary styling.",
    color: "#9333ea",
    features: [
      "Modern",
      "Gradient",
      "Dynamic",
    ],
    variant: "animated",
  },
];

// ============================================================
// FILTERS
// ============================================================

const FILTERS = [
  {
    id: "all",
    label: "All Templates",
  },
  {
    id: "modern",
    label: "Modern",
  },
  {
    id: "professional",
    label: "Professional",
  },
  {
    id: "ats",
    label: "ATS Friendly",
  },
  {
    id: "creative",
    label: "Creative",
  },
  {
    id: "tech",
    label: "Tech",
  },
  {
    id: "academic",
    label: "Academic",
  },
  {
    id: "photo",
    label: "Photo",
  },
  {
    id: "graduate",
    label: "Graduate",
  },
];

// ============================================================
// SAMPLE CONTENT
// ============================================================

const SAMPLE = {
  name: "Alex Morgan",
  role: "Senior Software Engineer",
  email: "alex.morgan@email.com",
  phone: "+91 98765 43210",
  location: "Bengaluru, India",

  summary:
    "Results-driven professional with 5+ years of experience building scalable digital products and leading high-performing teams.",

  skills: [
    "React.js",
    "Node.js",
    "Python",
    "AWS",
    "MongoDB",
    "Git",
  ],

  company: "TechNova Solutions",
  education:
    "B.Tech Computer Science · NIT Bengaluru",

  project:
    "AI Resume Generator",
};

// ============================================================
// MINI TEXT
// ============================================================

function MiniLine({
  width = "100%",
  dark = false,
}) {
  return (
    <div
      className={`
        h-[3px]
        rounded-full
        ${
          dark
            ? "bg-white/25"
            : "bg-slate-200"
        }
      `}
      style={{
        width,
      }}
    />
  );
}

// ============================================================
// BASE RESUME
// ============================================================

function BaseResume({
  accent = "#6366f1",
  dark = false,
  sidebar = false,
  photo = false,
  timeline = false,
  compact = false,
}) {
  const pageClass = dark
    ? "bg-[#101827] text-white"
    : "bg-white text-slate-800";

  return (
    <div
      className={`
        relative
        h-full
        min-h-[360px]
        overflow-hidden
        ${pageClass}
      `}
    >
      {sidebar ? (
        <div className="flex h-full">
          <div
            className="
              w-[31%]
              shrink-0
              p-4
              text-white
            "
            style={{
              background: accent,
            }}
          >
            {photo && (
              <div
                className="
                  mx-auto
                  mb-4
                  h-14
                  w-14
                  rounded-full
                  border-2
                  border-white/70
                  bg-white/20
                "
              />
            )}

            <div className="mb-4">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-wider">
                Contact
              </div>

              <div className="space-y-1 text-[7px] leading-3 text-white/75">
                <div>{SAMPLE.email}</div>
                <div>{SAMPLE.phone}</div>
                <div>{SAMPLE.location}</div>
              </div>
            </div>

            <div className="mb-4">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-wider">
                Skills
              </div>

              <div className="space-y-2">
                {SAMPLE.skills.slice(0, 4).map(
                  (skill) => (
                    <div key={skill}>
                      <div className="mb-1 text-[7px]">
                        {skill}
                      </div>

                      <div className="h-[3px] rounded-full bg-white/20">
                        <div
                          className="h-full rounded-full bg-white/80"
                          style={{
                            width: `${
                              65 +
                              Math.random() * 25
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            <div>
              <div className="mb-2 text-[10px] font-bold uppercase tracking-wider">
                Education
              </div>

              <div className="text-[7px] leading-3 text-white/75">
                {SAMPLE.education}
              </div>
            </div>
          </div>

          <div className="min-w-0 flex-1 p-5">
            <div className="mb-5">
              <div
                className="text-[20px] font-extrabold tracking-tight"
                style={{
                  color: accent,
                }}
              >
                {SAMPLE.name}
              </div>

              <div className="mt-1 text-[9px] font-semibold text-slate-400">
                {SAMPLE.role}
              </div>
            </div>

            <MiniSection
              title="Profile"
              accent={accent}
              dark={dark}
            >
              <MiniLine width="95%" dark={dark} />
              <MiniLine width="88%" dark={dark} />
              <MiniLine width="72%" dark={dark} />
            </MiniSection>

            <MiniSection
              title="Experience"
              accent={accent}
              dark={dark}
            >
              <div className="mb-2 text-[9px] font-bold">
                Senior Engineer
              </div>

              <div className="mb-2 text-[7px] text-slate-400">
                {SAMPLE.company} · 2021 — Present
              </div>

              <div className="space-y-2">
                <MiniLine width="95%" dark={dark} />
                <MiniLine width="85%" dark={dark} />
                <MiniLine width="70%" dark={dark} />
              </div>
            </MiniSection>

            <MiniSection
              title="Projects"
              accent={accent}
              dark={dark}
            >
              <div className="mb-2 text-[9px] font-bold">
                {SAMPLE.project}
              </div>

              <div className="space-y-2">
                <MiniLine width="92%" dark={dark} />
                <MiniLine width="76%" dark={dark} />
              </div>
            </MiniSection>
          </div>
        </div>
      ) : (
        <div
          className={`
            h-full
            ${
              compact
                ? "p-4"
                : "p-5"
            }
          `}
        >
          <div
            className="
              mb-5
              border-b
              pb-4
            "
            style={{
              borderColor: `${accent}55`,
            }}
          >
            <div
              className="text-[21px] font-extrabold tracking-tight"
              style={{
                color: accent,
              }}
            >
              {SAMPLE.name}
            </div>

            <div className="mt-1 text-[9px] font-semibold">
              {SAMPLE.role}
            </div>

            <div className="mt-2 text-[7px] text-slate-400">
              {SAMPLE.email} · {SAMPLE.phone} ·{" "}
              {SAMPLE.location}
            </div>
          </div>

          <MiniSection
            title="Professional Summary"
            accent={accent}
            dark={dark}
          >
            <div className="space-y-2">
              <MiniLine
                width="96%"
                dark={dark}
              />
              <MiniLine
                width="90%"
                dark={dark}
              />
              <MiniLine
                width="76%"
                dark={dark}
              />
            </div>
          </MiniSection>

          <MiniSection
            title="Experience"
            accent={accent}
            dark={dark}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[9px] font-bold">
                Senior Engineer
              </div>

              <div className="text-[7px] text-slate-400">
                2021 — Present
              </div>
            </div>

            <div className="mb-2 text-[7px] font-semibold text-slate-400">
              {SAMPLE.company}
            </div>

            <div className="space-y-2">
              <MiniLine
                width="94%"
                dark={dark}
              />
              <MiniLine
                width="87%"
                dark={dark}
              />
              <MiniLine
                width="73%"
                dark={dark}
              />
            </div>
          </MiniSection>

          <MiniSection
            title="Skills"
            accent={accent}
            dark={dark}
          >
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE.skills.map(
                (skill) => (
                  <span
                    key={skill}
                    className="
                      rounded
                      px-2
                      py-1
                      text-[6px]
                      font-bold
                    "
                    style={{
                      background: `${accent}16`,
                      color: accent,
                    }}
                  >
                    {skill}
                  </span>
                )
              )}
            </div>
          </MiniSection>

          <MiniSection
            title="Education"
            accent={accent}
            dark={dark}
          >
            <div className="text-[8px] font-semibold">
              {SAMPLE.education}
            </div>
          </MiniSection>

          {timeline && (
            <div
              className="
                absolute
                bottom-0
                right-4
                top-5
                w-[2px]
              "
              style={{
                background: `${accent}35`,
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// MINI SECTION
// ============================================================

function MiniSection({
  title,
  accent,
  children,
}) {
  return (
    <div className="mb-5">
      <div
        className="
          mb-2
          text-[8px]
          font-extrabold
          uppercase
          tracking-[0.12em]
        "
        style={{
          color: accent,
        }}
      >
        {title}
      </div>

      {children}
    </div>
  );
}

// ============================================================
// SPECIAL TEMPLATE PREVIEWS
// ============================================================

function ModernPreview() {
  return (
    <BaseResume accent="#6366f1" />
  );
}

function ClassicPreview() {
  return (
    <div className="h-full bg-white p-6 font-serif text-slate-900">
      <div className="mb-5 border-b-2 border-black pb-4 text-center">
        <div className="text-[19px] font-bold tracking-wide">
          {SAMPLE.name.toUpperCase()}
        </div>

        <div className="mt-1 text-[8px]">
          {SAMPLE.role}
        </div>

        <div className="mt-2 text-[7px]">
          {SAMPLE.location} | {SAMPLE.email} |{" "}
          {SAMPLE.phone}
        </div>
      </div>

      {[
        "PROFESSIONAL SUMMARY",
        "EXPERIENCE",
        "EDUCATION",
        "SKILLS",
      ].map((section) => (
        <div
          key={section}
          className="mb-5"
        >
          <div className="mb-2 border-b border-black pb-1 text-[8px] font-bold">
            {section}
          </div>

          <MiniLine width="96%" />
          <div className="mt-2">
            <MiniLine width="88%" />
          </div>
          <div className="mt-2">
            <MiniLine width="74%" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MinimalPreview() {
  return (
    <div className="h-full bg-white p-7 text-slate-800">
      <div className="mb-7">
        <div className="text-[22px] font-light tracking-[0.05em]">
          {SAMPLE.name}
        </div>

        <div className="mt-2 text-[8px] uppercase tracking-[0.18em] text-slate-400">
          {SAMPLE.role}
        </div>

        <div className="mt-3 h-px w-full bg-slate-200" />
      </div>

      <div className="space-y-6">
        <div>
          <div className="mb-3 text-[7px] font-semibold uppercase tracking-[0.2em]">
            About
          </div>

          <div className="space-y-2">
            <MiniLine width="94%" />
            <MiniLine width="82%" />
          </div>
        </div>

        <div>
          <div className="mb-3 text-[7px] font-semibold uppercase tracking-[0.2em]">
            Work History
          </div>

          <div className="mb-3 text-[9px] font-medium">
            Senior Software Engineer
          </div>

          <div className="mb-2 text-[7px] text-slate-400">
            TechNova Solutions · 2021 — Present
          </div>

          <div className="space-y-2">
            <MiniLine width="91%" />
            <MiniLine width="80%" />
          </div>
        </div>

        <div>
          <div className="mb-3 text-[7px] font-semibold uppercase tracking-[0.2em]">
            Skills
          </div>

          <div className="text-[8px] leading-5 text-slate-500">
            React.js · Node.js · Python · AWS · MongoDB
          </div>
        </div>
      </div>
    </div>
  );
}

function CreativePreview() {
  return (
    <div className="flex h-full bg-slate-50">
      <div
        className="
          w-[34%]
          p-4
          text-white
        "
        style={{
          background:
            "linear-gradient(145deg,#7c3aed,#ec4899)",
        }}
      >
        <div className="mb-4 text-[18px] font-extrabold">
          Alex
        </div>

        <div className="mb-6 text-[8px] text-white/70">
          CREATIVE DESIGNER
        </div>

        <div className="mb-5 text-[7px] leading-4 text-white/80">
          UI/UX Design
          <br />
          Branding
          <br />
          Figma
          <br />
          Adobe Creative Cloud
          <br />
          Product Design
        </div>

        <div className="text-[7px] leading-4 text-white/70">
          alex@email.com
          <br />
          Bengaluru, India
        </div>
      </div>

      <div className="flex-1 p-5">
        <div className="mb-5">
          <div className="text-[17px] font-extrabold text-slate-900">
            {SAMPLE.name}
          </div>

          <div className="mt-1 text-[8px] text-purple-600">
            Creative Product Designer
          </div>
        </div>

        {["About Me", "Experience", "Projects"].map(
          (section) => (
            <div
              key={section}
              className="mb-5"
            >
              <div className="mb-2 text-[9px] font-bold text-purple-600">
                {section}
              </div>

              <div className="space-y-2">
                <MiniLine width="94%" />
                <MiniLine width="84%" />
                <MiniLine width="70%" />
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function TechPreview() {
  return (
    <div className="h-full bg-[#f1f5f9] p-4 font-mono">
      <div className="mb-4 rounded-lg bg-[#0f172a] p-4 text-green-400">
        <div className="text-[12px] font-bold">
          $ developer_profile
        </div>

        <div className="mt-1 text-[7px] text-green-500/70">
          ~/resume/alex-morgan
        </div>
      </div>

      {[
        "technical_stack",
        "experience",
        "projects",
        "education",
      ].map((section) => (
        <div
          key={section}
          className="mb-4 rounded-lg border-l-4 border-green-500 bg-white p-3"
        >
          <div className="mb-2 text-[8px] font-bold text-slate-800">
            {"<"}
            {section}
            {"/>"}
          </div>

          <div className="space-y-2">
            <MiniLine width="95%" />
            <MiniLine width="82%" />
            <MiniLine width="65%" />
          </div>
        </div>
      ))}
    </div>
  );
}

function GradientPreview() {
  return (
    <div className="h-full bg-white">
      <div
        className="
          relative
          overflow-hidden
          p-5
          text-white
        "
        style={{
          background:
            "linear-gradient(135deg,#4f46e5,#9333ea,#ec4899)",
        }}
      >
        <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 left-20 h-24 w-24 rounded-full bg-white/10" />

        <div className="relative">
          <div className="text-[20px] font-extrabold">
            {SAMPLE.name}
          </div>

          <div className="mt-1 text-[8px] text-white/75">
            {SAMPLE.role}
          </div>

          <div className="mt-3 text-[7px] text-white/65">
            {SAMPLE.email} · {SAMPLE.location}
          </div>
        </div>
      </div>

      <div className="p-5">
        {[
          "Profile",
          "Experience",
          "Projects",
          "Skills",
        ].map((section) => (
          <div
            key={section}
            className="mb-4"
          >
            <div className="mb-2 inline-block rounded-full bg-purple-50 px-2 py-1 text-[7px] font-bold uppercase text-purple-600">
              {section}
            </div>

            <div className="space-y-2">
              <MiniLine width="93%" />
              <MiniLine width="79%" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AcademicPreview() {
  return (
    <div className="h-full bg-white p-5 font-serif text-slate-800">
      <div className="mb-4 text-center">
        <div className="text-[17px] font-bold">
          EMILY MORGAN
        </div>

        <div className="mt-1 text-[7px]">
          Research Scientist · AI & Machine Learning
        </div>

        <div className="mt-2 text-[6px] text-slate-500">
          Boston, MA · emily@example.com · +1 555 234 5678
        </div>
      </div>

      {[
        "EDUCATION",
        "RESEARCH EXPERIENCE",
        "PUBLICATIONS",
        "TECHNICAL SKILLS",
      ].map((section) => (
        <div
          key={section}
          className="mb-4"
        >
          <div className="mb-2 border-b border-black pb-1 text-[7px] font-bold">
            {section}
          </div>

          <div className="space-y-2">
            <MiniLine width="95%" />
            <MiniLine width="86%" />
            <MiniLine width="71%" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ElegantPreview() {
  return (
    <div className="h-full bg-[#fffafc] p-6">
      <div className="mb-6 border-b border-rose-200 pb-5">
        <div className="text-[22px] font-light tracking-wide text-slate-800">
          {SAMPLE.name}
        </div>

        <div className="mt-2 text-[8px] uppercase tracking-[0.2em] text-rose-600">
          {SAMPLE.role}
        </div>

        <div className="mt-3 text-[7px] text-slate-400">
          {SAMPLE.email} · {SAMPLE.location}
        </div>
      </div>

      {[
        "PROFILE",
        "EXPERIENCE",
        "SELECTED PROJECTS",
        "EDUCATION",
      ].map((section) => (
        <div
          key={section}
          className="mb-5"
        >
          <div className="mb-2 text-[8px] font-bold tracking-[0.15em] text-rose-600">
            {section}
          </div>

          <div className="space-y-2">
            <MiniLine width="93%" />
            <MiniLine width="80%" />
            <MiniLine width="68%" />
          </div>
        </div>
      ))}
    </div>
  );
}

function VibrantPreview() {
  return (
    <div className="h-full bg-slate-50 p-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-rose-500 p-4 text-white">
          <div className="text-[13px] font-extrabold">
            {SAMPLE.name}
          </div>

          <div className="mt-1 text-[7px]">
            Marketing Director
          </div>
        </div>

        <div className="rounded-xl bg-cyan-500 p-4 text-white">
          <div className="text-[7px] leading-4">
            Bengaluru, India
            <br />
            alex@email.com
            <br />
            +91 98765 43210
          </div>
        </div>

        <div className="rounded-xl bg-emerald-200 p-4">
          <div className="mb-2 text-[8px] font-bold">
            SKILLS
          </div>

          <div className="text-[7px] leading-4 text-slate-600">
            SEO
            <br />
            Analytics
            <br />
            CRM
            <br />
            Strategy
          </div>
        </div>

        <div className="rounded-xl bg-orange-400 p-4 text-white">
          <div className="mb-2 text-[8px] font-bold">
            EXPERIENCE
          </div>

          <div className="text-[7px] leading-4">
            5+ years of marketing leadership and campaign strategy.
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-white p-4">
        <div className="mb-3 text-[8px] font-bold text-rose-500">
          ACHIEVEMENTS
        </div>

        <div className="space-y-2">
          <MiniLine width="92%" />
          <MiniLine width="82%" />
          <MiniLine width="73%" />
        </div>
      </div>
    </div>
  );
}

function InfographicPreview() {
  return (
    <div className="h-full bg-white p-5">
      <div className="mb-4">
        <div className="text-[18px] font-extrabold">
          {SAMPLE.name}
        </div>

        <div className="mt-1 text-[8px] text-blue-600">
          UX/UI Designer & Creative Thinker
        </div>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-2">
        {[
          ["5+", "Years"],
          ["40+", "Projects"],
          ["12", "Awards"],
        ].map(([number, label]) => (
          <div
            key={label}
            className="rounded-xl bg-blue-50 p-3 text-center"
          >
            <div className="text-[14px] font-extrabold text-blue-600">
              {number}
            </div>

            <div className="mt-1 text-[6px] text-slate-500">
              {label}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4 text-[8px] font-bold uppercase text-slate-700">
        Skill Proficiency
      </div>

      {[
        ["Figma", "90%"],
        ["React", "82%"],
        ["UI Design", "95%"],
        ["Branding", "78%"],
      ].map(([skill, value]) => (
        <div
          key={skill}
          className="mb-3"
        >
          <div className="mb-1 flex justify-between text-[7px]">
            <span>{skill}</span>
            <span className="text-blue-600">
              {value}
            </span>
          </div>

          <div className="h-2 rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{
                width: value,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function TimelinePreview() {
  return (
    <div className="h-full bg-white p-5">
      <div className="mb-5">
        <div className="text-[20px] font-extrabold text-cyan-700">
          {SAMPLE.name}
        </div>

        <div className="mt-1 text-[8px] text-slate-400">
          {SAMPLE.role}
        </div>
      </div>

      <div className="relative pl-6">
        <div className="absolute bottom-0 left-[6px] top-0 w-[2px] bg-cyan-100" />

        {[
          ["2021 — Present", "Senior Software Engineer"],
          ["2019 — 2021", "Software Engineer"],
          ["2017 — 2019", "Junior Developer"],
        ].map(
          ([date, title]) => (
            <div
              key={date}
              className="relative mb-5"
            >
              <div className="absolute -left-[23px] top-0 h-3 w-3 rounded-full border-2 border-white bg-cyan-500 shadow" />

              <div className="text-[7px] font-bold text-cyan-600">
                {date}
              </div>

              <div className="mt-1 text-[9px] font-bold">
                {title}
              </div>

              <div className="mt-2 space-y-2">
                <MiniLine width="88%" />
                <MiniLine width="72%" />
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function GraduatePreview() {
  return (
    <div className="h-full bg-white p-5">
      <div className="mb-5 rounded-xl bg-blue-600 p-5 text-white">
        <div className="text-[20px] font-extrabold">
          {SAMPLE.name}
        </div>

        <div className="mt-1 text-[8px] text-white/75">
          Computer Science Graduate
        </div>

        <div className="mt-3 text-[7px] text-white/65">
          Bengaluru · alex@email.com · GitHub
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          {[
            "EDUCATION",
            "PROJECTS",
          ].map((section) => (
            <div
              key={section}
              className="mb-5"
            >
              <div className="mb-2 text-[8px] font-bold text-blue-600">
                {section}
              </div>

              <div className="space-y-2">
                <MiniLine width="94%" />
                <MiniLine width="83%" />
                <MiniLine width="68%" />
              </div>
            </div>
          ))}
        </div>

        <div>
          {[
            "SKILLS",
            "CERTIFICATIONS",
          ].map((section) => (
            <div
              key={section}
              className="mb-5"
            >
              <div className="mb-2 text-[8px] font-bold text-blue-600">
                {section}
              </div>

              <div className="space-y-2">
                <MiniLine width="91%" />
                <MiniLine width="77%" />
                <MiniLine width="62%" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TEMPLATE PREVIEW SWITCH
// ============================================================

function TemplatePreview({
  template,
  large = false,
}) {
  const variant =
    template.variant;

  const content = (() => {
    switch (variant) {
      case "classic":
        return <ClassicPreview />;

      case "minimal":
        return <MinimalPreview />;

      case "creative":
        return <CreativePreview />;

      case "tech":
        return <TechPreview />;

      case "gradient":
      case "marketing":
      case "animated":
        return <GradientPreview />;

      case "academic":
        return <AcademicPreview />;

      case "elegant":
        return <ElegantPreview />;

      case "vibrant":
        return <VibrantPreview />;

      case "infographic":
        return <InfographicPreview />;

      case "timeline":
        return <TimelinePreview />;

      case "graduate":
        return <GraduatePreview />;

      case "photo":
        return (
          <BaseResume
            accent="#0f766e"
            sidebar
            photo
          />
        );

      case "executive":
        return (
          <BaseResume
            accent="#334155"
            sidebar
          />
        );

      case "two-column":
        return (
          <BaseResume
            accent="#0f766e"
            sidebar
          />
        );

      case "portfolio":
        return (
          <BaseResume
            accent="#ea580c"
            sidebar
          />
        );

      case "international":
        return (
          <BaseResume
            accent="#0369a1"
            sidebar
          />
        );

      case "compact":
        return (
          <BaseResume
            accent="#475569"
            compact
          />
        );

      case "modern-minimal":
        return (
          <BaseResume
            accent="#2563eb"
          />
        );

      case "modern":
      default:
        return <ModernPreview />;
    }
  })();

  return (
    <div
      className={`
        relative
        overflow-hidden
        bg-white
        ${
          large
            ? "min-h-[680px]"
            : "h-[390px]"
        }
      `}
    >
      {content}
    </div>
  );
}

// ============================================================
// TEMPLATE CARD
// ============================================================

function TemplateCard({
  template,
  selected,
  onPreview,
  onUse,
}) {
  return (
    <div
      className={`
        group
        overflow-hidden
        rounded-2xl
        border
        bg-white
        shadow-sm
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-2xl
        dark:bg-slate-900

        ${
          selected
            ? "border-indigo-500 ring-2 ring-indigo-100 dark:ring-indigo-950"
            : "border-slate-200 dark:border-slate-800"
        }
      `}
    >
      {/* PREVIEW */}

      <div className="relative overflow-hidden bg-slate-100 p-3 dark:bg-slate-800">
        <div
          className="
            relative
            overflow-hidden
            rounded-xl
            bg-white
            shadow-md
          "
        >
          <TemplatePreview
            template={template}
          />

          {/* HOVER */}

          <div
            className="
              absolute
              inset-0
              flex
              items-center
              justify-center
              bg-slate-950/55
              opacity-0
              backdrop-blur-[2px]
              transition
              duration-300
              group-hover:opacity-100
            "
          >
            <button
              type="button"
              onClick={() =>
                onPreview(template)
              }
              className="
                rounded-xl
                bg-white
                px-5
                py-2.5
                text-sm
                font-bold
                text-slate-900
                shadow-xl
                transition
                hover:scale-105
              "
            >
              👁 Preview
            </button>
          </div>

          {selected && (
            <div
              className="
                absolute
                left-3
                top-3
                rounded-full
                bg-indigo-600
                px-3
                py-1.5
                text-[10px]
                font-bold
                text-white
                shadow-lg
              "
            >
              ✓ Selected
            </div>
          )}
        </div>
      </div>

      {/* INFO */}

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3
              className="
                truncate
                text-base
                font-bold
                text-slate-900
                dark:text-white
              "
            >
              {template.name}
            </h3>

            <p
              className="
                mt-1
                line-clamp-2
                text-xs
                leading-5
                text-slate-500
                dark:text-slate-400
              "
            >
              {template.description}
            </p>
          </div>

          <div
            className="
              h-3
              w-3
              shrink-0
              rounded-full
            "
            style={{
              background:
                template.color,
            }}
          />
        </div>

        {/* TAGS */}

        <div className="mt-4 flex flex-wrap gap-1.5">
          {template.features
            .slice(0, 3)
            .map((feature) => (
              <span
                key={feature}
                className="
                  rounded-full
                  bg-slate-100
                  px-2.5
                  py-1
                  text-[10px]
                  font-semibold
                  text-slate-600
                  dark:bg-slate-800
                  dark:text-slate-300
                "
              >
                {feature}
              </span>
            ))}
        </div>

        {/* BUTTONS */}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() =>
              onPreview(template)
            }
            className="
              flex-1
              rounded-xl
              border
              border-slate-200
              bg-white
              px-3
              py-2.5
              text-xs
              font-bold
              text-slate-700
              transition
              hover:bg-slate-50
              dark:border-slate-700
              dark:bg-slate-900
              dark:text-slate-200
              dark:hover:bg-slate-800
            "
          >
            👁 Preview
          </button>

          <button
            type="button"
            onClick={() =>
              onUse(template)
            }
            className="
              flex-1
              rounded-xl
              bg-gradient-to-r
              from-indigo-600
              to-violet-600
              px-3
              py-2.5
              text-xs
              font-bold
              text-white
              shadow-sm
              transition
              hover:-translate-y-0.5
              hover:shadow-lg
            "
          >
            ✨ Use
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PREVIEW MODAL
// ============================================================

function PreviewModal({
  template,
  onClose,
  onUse,
}) {
  if (!template) {
    return null;
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-[99999]
        flex
        items-center
        justify-center
        bg-black/60
        px-4
        py-6
        backdrop-blur-md
      "
    >
      {/* BACKDROP */}

      <button
        type="button"
        aria-label="Close preview"
        onClick={onClose}
        className="
          absolute
          inset-0
          cursor-default
        "
      />

      {/* MODAL */}

      <div
        className="
          relative
          z-10
          flex
          max-h-[94vh]
          w-full
          max-w-6xl
          flex-col
          overflow-hidden
          rounded-3xl
          border
          border-white/20
          bg-white
          shadow-2xl
          dark:bg-slate-900
        "
      >
        {/* HEADER */}

        <div
          className="
            flex
            shrink-0
            items-center
            justify-between
            gap-4
            border-b
            border-slate-200
            px-5
            py-4
            dark:border-slate-800
          "
        >
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div
                className="
                  h-3
                  w-3
                  rounded-full
                "
                style={{
                  background:
                    template.color,
                }}
              />

              <h2
                className="
                  truncate
                  text-lg
                  font-bold
                  text-slate-900
                  dark:text-white
                "
              >
                {template.name}
              </h2>
            </div>

            <p
              className="
                mt-1
                text-xs
                text-slate-500
                dark:text-slate-400
              "
            >
              {template.description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-slate-100
              text-lg
              text-slate-600
              transition
              hover:bg-slate-200
              dark:bg-slate-800
              dark:text-slate-300
              dark:hover:bg-slate-700
            "
          >
            ✕
          </button>
        </div>

        {/* BODY */}

        <div
          className="
            min-h-0
            flex-1
            overflow-y-auto
            bg-slate-100
            p-4
            dark:bg-slate-950
            sm:p-7
          "
        >
          <div
            className="
              mx-auto
              w-full
              max-w-[760px]
              overflow-hidden
              rounded-xl
              bg-white
              shadow-2xl
            "
          >
            <TemplatePreview
              template={template}
              large
            />
          </div>
        </div>

        {/* FOOTER */}

        <div
          className="
            flex
            shrink-0
            flex-col
            gap-3
            border-t
            border-slate-200
            bg-white
            p-4
            sm:flex-row
            sm:items-center
            sm:justify-between
            dark:border-slate-800
            dark:bg-slate-900
          "
        >
          <div className="flex flex-wrap gap-2">
            {template.features.map(
              (feature) => (
                <span
                  key={feature}
                  className="
                    rounded-full
                    bg-indigo-50
                    px-3
                    py-1.5
                    text-[10px]
                    font-bold
                    text-indigo-600
                    dark:bg-indigo-950/40
                    dark:text-indigo-300
                  "
                >
                  {feature}
                </span>
              )
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="
                rounded-xl
                border
                border-slate-200
                px-5
                py-2.5
                text-sm
                font-bold
                text-slate-700
                hover:bg-slate-50
                dark:border-slate-700
                dark:text-slate-200
                dark:hover:bg-slate-800
              "
            >
              Close
            </button>

            <button
              type="button"
              onClick={() =>
                onUse(template)
              }
              className="
                rounded-xl
                bg-gradient-to-r
                from-indigo-600
                to-violet-600
                px-6
                py-2.5
                text-sm
                font-bold
                text-white
                shadow-lg
                transition
                hover:-translate-y-0.5
              "
            >
              ✨ Use This Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function Templates() {
  const navigate = useNavigate();

  const [templates, setTemplates] =
    useState(RESUME_TEMPLATES);

  const [loading, setLoading] =
    useState(false);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [activeFilter, setActiveFilter] =
    useState("all");

  const [preview, setPreview] =
    useState(null);

  const [selectedTemplate, setSelectedTemplate] =
    useState(
      () =>
        localStorage.getItem(
          "selectedResumeTemplate"
        ) || null
    );

  // ==========================================================
  // LOAD API TEMPLATES
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    async function loadTemplates() {
      const token =
        localStorage.getItem(
          "token"
        );

      if (!token) {
        navigate("/");
        return;
      }

      setLoading(true);

      try {
        const response =
          await API.listTemplates?.();

        /*
         * Only use API templates if they are
         * actually compatible with our UI.
         *
         * Otherwise keep the rich built-in
         * collection.
         */

        if (
          mounted &&
          Array.isArray(response) &&
          response.length > 0
        ) {
          const compatible =
            response
              .filter(
                (item) =>
                  item &&
                  item.id &&
                  item.name
              )
              .map(
                (item) => ({
                  ...item,

                  category:
                    item.category ||
                    "modern",

                  description:
                    item.description ||
                    "Professional resume template.",

                  color:
                    item.color ||
                    "#6366f1",

                  features:
                    Array.isArray(
                      item.features
                    )
                      ? item.features
                      : [
                          "Professional",
                          "Modern",
                        ],

                  variant:
                    item.variant ||
                    "modern",
                })
              );

          /*
           * Merge API templates with our
           * built-in templates instead of
           * replacing the visual collection.
           */

          const map =
            new Map();

          [
            ...RESUME_TEMPLATES,
            ...compatible,
          ].forEach(
            (template) => {
              if (
                !map.has(
                  template.id
                )
              ) {
                map.set(
                  template.id,
                  template
                );
              }
            }
          );

          setTemplates(
            Array.from(
              map.values()
            )
          );
        }
      } catch (error) {
        /*
         * Built-in templates remain available.
         */
        console.log(
          "Using built-in resume templates."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadTemplates();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  // ==========================================================
  // FILTER
  // ==========================================================

  const filteredTemplates =
    useMemo(() => {
      const query =
        searchQuery
          .trim()
          .toLowerCase();

      return templates.filter(
        (template) => {
          const matchesSearch =
            !query ||
            template.name
              .toLowerCase()
              .includes(query) ||
            template.description
              .toLowerCase()
              .includes(query) ||
            template.features.some(
              (feature) =>
                feature
                  .toLowerCase()
                  .includes(query)
            );

          const matchesFilter =
            activeFilter ===
              "all" ||
            template.category ===
              activeFilter;

          return (
            matchesSearch &&
            matchesFilter
          );
        }
      );
    }, [
      templates,
      searchQuery,
      activeFilter,
    ]);

  // ==========================================================
  // USE TEMPLATE
  // ==========================================================

  function useTemplate(
    template
  ) {
    if (!template) {
      return;
    }

    /*
     * Save the exact selected template.
     *
     * Resume.jsx can read this value when
     * /create-resume loads.
     */

    localStorage.setItem(
      "selectedResumeTemplate",
      template.id
    );

    localStorage.setItem(
      "selectedResumeTemplateName",
      template.name
    );

    setSelectedTemplate(
      template.id
    );

    setPreview(null);

    navigate(
      "/create-resume",
      {
        state: {
          template: {
            id: template.id,
            name: template.name,
            design:
              template.variant ||
              template.preview ||
              "",
            color:
              template.color,
            description:
              template.description,
          },
        },
      }
    );
  }

  // ==========================================================
  // BACK
  // ==========================================================

  function handleBack() {
    navigate(-1);
  }

  // ==========================================================
  // COUNTS
  // ==========================================================

  function getCount(
    category
  ) {
    if (
      category ===
      "all"
    ) {
      return templates.length;
    }

    return templates.filter(
      (template) =>
        template.category ===
        category
    ).length;
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      className="
        min-h-screen
        w-full
        overflow-x-hidden
        bg-slate-50
        text-slate-900
        dark:bg-slate-950
        dark:text-white
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-7xl
          px-4
          py-6
          sm:px-6
          lg:px-8
        "
      >
        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="mb-8">
          <button
            type="button"
            onClick={
              handleBack
            }
            className="
              mb-5
              inline-flex
              items-center
              gap-2
              rounded-xl
              border
              border-slate-200
              bg-white
              px-4
              py-2.5
              text-sm
              font-bold
              text-slate-700
              shadow-sm
              transition
              hover:-translate-x-0.5
              hover:bg-slate-50
              dark:border-slate-800
              dark:bg-slate-900
              dark:text-slate-200
              dark:hover:bg-slate-800
            "
          >
            ← Back
          </button>

          <div
            className="
              flex
              flex-col
              gap-5
              lg:flex-row
              lg:items-end
              lg:justify-between
            "
          >
            <div>
              <div
                className="
                  mb-2
                  text-xs
                  font-extrabold
                  uppercase
                  tracking-[0.2em]
                  text-indigo-600
                "
              >
                Resume Design Studio
              </div>

              <h1
                className="
                  text-3xl
                  font-extrabold
                  tracking-tight
                  sm:text-4xl
                  lg:text-5xl
                "
              >
                Choose your resume template
              </h1>

              <p
                className="
                  mt-3
                  max-w-2xl
                  text-sm
                  leading-6
                  text-slate-500
                  sm:text-base
                  dark:text-slate-400
                "
              >
                Explore professionally designed
                templates for modern, corporate,
                creative, technical and academic
                resumes.
              </p>
            </div>

            <div
              className="
                flex
                w-fit
                items-center
                gap-3
                rounded-2xl
                border
                border-indigo-100
                bg-indigo-50
                px-4
                py-3
                dark:border-indigo-900
                dark:bg-indigo-950/30
              "
            >
              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  bg-indigo-600
                  text-lg
                  text-white
                "
              >
                ✨
              </div>

              <div>
                <div
                  className="
                    text-lg
                    font-extrabold
                    text-indigo-700
                    dark:text-indigo-300
                  "
                >
                  {templates.length}+
                </div>

                <div
                  className="
                    text-[10px]
                    font-semibold
                    text-indigo-500
                    dark:text-indigo-400
                  "
                >
                  Professional designs
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================
            SEARCH
        ================================================== */}

        <div
          className="
            mb-5
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-3
            shadow-sm
            dark:border-slate-800
            dark:bg-slate-900
          "
        >
          <div
            className="
              flex
              flex-col
              gap-3
              sm:flex-row
            "
          >
            <div className="relative flex-1">
              <span
                className="
                  pointer-events-none
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
              >
                🔍
              </span>

              <input
                type="text"
                value={
                  searchQuery
                }
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value
                  )
                }
                placeholder="Search templates, styles or features..."
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-slate-50
                  py-3
                  pl-11
                  pr-4
                  text-sm
                  text-slate-900
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-indigo-400
                  focus:bg-white
                  focus:ring-4
                  focus:ring-indigo-50
                  dark:border-slate-700
                  dark:bg-slate-950
                  dark:text-white
                  dark:focus:bg-slate-950
                "
              />
            </div>

            {searchQuery && (
              <button
                type="button"
                onClick={() =>
                  setSearchQuery(
                    ""
                  )
                }
                className="
                  rounded-xl
                  border
                  border-slate-200
                  px-5
                  py-3
                  text-sm
                  font-bold
                  text-slate-600
                  hover:bg-slate-50
                  dark:border-slate-700
                  dark:text-slate-300
                  dark:hover:bg-slate-800
                "
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ==================================================
            FILTERS
        ================================================== */}

        <div
          className="
            mb-7
            overflow-x-auto
            pb-1
          "
        >
          <div className="flex min-w-max gap-2">
            {FILTERS.map(
              (filter) => {
                const count =
                  getCount(
                    filter.id
                  );

                return (
                  <button
                    key={
                      filter.id
                    }
                    type="button"
                    onClick={() =>
                      setActiveFilter(
                        filter.id
                      )
                    }
                    className={`
                      rounded-full
                      px-4
                      py-2.5
                      text-xs
                      font-bold
                      transition

                      ${
                        activeFilter ===
                        filter.id
                          ? "bg-indigo-600 text-white shadow-md"
                          : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                      }
                    `}
                  >
                    {filter.label}

                    <span
                      className={`
                        ml-2
                        rounded-full
                        px-1.5
                        py-0.5
                        text-[9px]

                        ${
                          activeFilter ===
                          filter.id
                            ? "bg-white/20 text-white"
                            : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                        }
                      `}
                    >
                      {count}
                    </span>
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* ==================================================
            SELECTED TEMPLATE
        ================================================== */}

        {selectedTemplate && (
          <div
            className="
              mb-6
              flex
              flex-col
              gap-3
              rounded-2xl
              border
              border-indigo-100
              bg-indigo-50
              px-5
              py-4
              sm:flex-row
              sm:items-center
              sm:justify-between
              dark:border-indigo-900
              dark:bg-indigo-950/30
            "
          >
            <div>
              <div
                className="
                  text-xs
                  font-bold
                  uppercase
                  tracking-wider
                  text-indigo-500
                "
              >
                Selected template
              </div>

              <div
                className="
                  mt-1
                  text-sm
                  font-bold
                  text-indigo-800
                  dark:text-indigo-200
                "
              >
                {templates.find(
                  (item) =>
                    item.id ===
                    selectedTemplate
                )?.name ||
                  selectedTemplate}
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/create-resume",
                  {
                    state: {
                      template:
                        templates.find(
                          (item) =>
                            item.id ===
                            selectedTemplate
                        ),
                    },
                  }
                )
              }
              className="
                rounded-xl
                bg-indigo-600
                px-5
                py-2.5
                text-xs
                font-bold
                text-white
                shadow-sm
                transition
                hover:bg-indigo-700
              "
            >
              Continue with Template →
            </button>
          </div>
        )}

        {/* ==================================================
            LOADING
        ================================================== */}

        {loading && (
          <div
            className="
              mb-6
              flex
              items-center
              gap-3
              rounded-2xl
              border
              border-slate-200
              bg-white
              px-5
              py-4
              text-sm
              text-slate-500
              shadow-sm
              dark:border-slate-800
              dark:bg-slate-900
              dark:text-slate-400
            "
          >
            <div
              className="
                h-5
                w-5
                animate-spin
                rounded-full
                border-2
                border-slate-200
                border-t-indigo-600
              "
            />

            Updating template collection...
          </div>
        )}

        {/* ==================================================
            GRID
        ================================================== */}

        {!loading &&
          filteredTemplates.length >
            0 && (
            <>
              <div
                className="
                  mb-5
                  flex
                  items-center
                  justify-between
                  gap-3
                "
              >
                <div>
                  <h2
                    className="
                      text-lg
                      font-bold
                      text-slate-900
                      dark:text-white
                    "
                  >
                    {activeFilter ===
                    "all"
                      ? "All templates"
                      : FILTERS.find(
                          (item) =>
                            item.id ===
                            activeFilter
                        )?.label}
                  </h2>

                  <p
                    className="
                      mt-1
                      text-xs
                      text-slate-400
                    "
                  >
                    Showing{" "}
                    {
                      filteredTemplates.length
                    }{" "}
                    of{" "}
                    {
                      templates.length
                    }{" "}
                    templates
                  </p>
                </div>
              </div>

              <div
                className="
                  grid
                  grid-cols-1
                  gap-5
                  sm:grid-cols-2
                  lg:grid-cols-3
                  xl:grid-cols-4
                "
              >
                {filteredTemplates.map(
                  (
                    template
                  ) => (
                    <TemplateCard
                      key={
                        template.id
                      }
                      template={
                        template
                      }
                      selected={
                        selectedTemplate ===
                        template.id
                      }
                      onPreview={
                        setPreview
                      }
                      onUse={
                        useTemplate
                      }
                    />
                  )
                )}
              </div>
            </>
          )}

        {/* ==================================================
            EMPTY
        ================================================== */}

        {!loading &&
          filteredTemplates.length ===
            0 && (
            <div
              className="
                rounded-3xl
                border
                border-slate-200
                bg-white
                px-6
                py-20
                text-center
                shadow-sm
                dark:border-slate-800
                dark:bg-slate-900
              "
            >
              <div className="text-5xl">
                🔍
              </div>

              <h2
                className="
                  mt-5
                  text-xl
                  font-bold
                  text-slate-900
                  dark:text-white
                "
              >
                No templates found
              </h2>

              <p
                className="
                  mx-auto
                  mt-2
                  max-w-md
                  text-sm
                  leading-6
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Try another template name,
                profession, style or category.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearchQuery(
                    ""
                  );
                  setActiveFilter(
                    "all"
                  );
                }}
                className="
                  mt-6
                  rounded-xl
                  bg-indigo-600
                  px-6
                  py-3
                  text-sm
                  font-bold
                  text-white
                  shadow-lg
                  hover:bg-indigo-700
                "
              >
                Reset Filters
              </button>
            </div>
          )}
      </div>

      {/* ====================================================
          PREVIEW MODAL
      ==================================================== */}

      <PreviewModal
        template={
          preview
        }
        onClose={() =>
          setPreview(null)
        }
        onUse={
          useTemplate
        }
      />
    </div>
  );
}