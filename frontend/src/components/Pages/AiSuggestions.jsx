import React, { useEffect, useState } from "react";
import API from "../../lib/api";
import { useNavigate } from "react-router-dom";
import BackButton from "../BackButton";

const SUGGESTION_CATEGORIES = [
  { id: "recommended", label: "What to Include", icon: "✅" },
  { id: "avoid", label: "What to Avoid", icon: "⚠️" },
  { id: "trending", label: "Trending Skills", icon: "🔥" },
  { id: "personalized", label: "Personalized", icon: "🎯" },
];

const INDUSTRY_INSIGHTS = {
  recommended: {
    default: [
      'Quantifiable achievements with metrics (e.g., "Increased revenue by 35%")',
      "Action-oriented language: Led, Designed, Implemented, Optimized",
      "Specific technologies and frameworks used in projects",
      "Certifications and professional development",
      "Awards, recognitions, and leadership roles",
      "Remote work experience and collaboration tools proficiency",
      "Problem-solving approach and methodology used",
      "Impact on team productivity and business outcomes",
      "Continuous learning mindset (courses, certifications)",
      "Soft skills: Communication, teamwork, adaptability",
    ],

    tech: [
      "Specific programming languages and frameworks (React, Node.js, etc.)",
      "Cloud platform experience (AWS, Azure, GCP)",
      "Database technologies and query optimization",
      "CI/CD pipeline and DevOps practices",
      "Version control systems (Git, GitHub)",
      "Testing frameworks and code quality metrics",
      "API design and integration experience",
      "Microservices and scalable architecture",
      "Performance optimization and monitoring",
      "Security best practices and implementation",
    ],

    leadership: [
      "Team size managed and outcomes achieved",
      "Cross-functional collaboration examples",
      "Mentoring and development of team members",
      "Strategic initiatives led to completion",
      "Budget management and ROI impact",
      "Process improvements implemented",
      "Innovation and new technology adoption",
      "Conflict resolution and problem-solving",
      "Stakeholder management experience",
      "Company culture and values alignment",
    ],
  },

  avoid: {
    default: [
      'Vague descriptions like "responsible for" or "worked on"',
      "Objective statements (outdated - use professional summary instead)",
      "Typos, grammatical errors, or inconsistent formatting",
      "Unexplained employment gaps or timeline inconsistencies",
      "Too much personal information (age, photo, marital status)",
      "Negative language or complaints about previous employers",
      'Generic phrases like "hard worker" or "team player"',
      "Overly colorful formatting or unprofessional design",
      "Irrelevant certifications or outdated technologies",
      "Self-promotional exaggerations or false claims",
    ],

    tech: [
      "Listing technologies without context or proficiency level",
      "Outdated frameworks (Flash, ActiveX, older versions)",
      'Vague tech descriptions ("good with computers")',
      "Missing specific versions of tools used",
      "Overstating expertise in unfamiliar technologies",
      "Listing every technology tool without relevance",
      "No mention of actual problems solved with technology",
      "Missing DevOps and modern deployment practices",
      "Ignoring cloud and containerization experience",
      "Not highlighting security awareness and best practices",
    ],

    general: [
      "Using personal pronouns (I, me, we) - use action verbs instead",
      "Weak power verbs (helped, assisted, worked on)",
      "More than 1 page (unless 10+ years experience)",
      "Fancy fonts, colors, or graphics that don't render",
      "Inconsistent date formats or missing dates",
      "Including salary expectations",
      "Listing references on resume (provide separately)",
      "Too many job duties without achievements",
      "Unclear or misleading job titles",
      "Missing contact information or outdated LinkedIn URL",
    ],
  },

  trending: {
    skills2024: [
      "Artificial Intelligence / Machine Learning",
      "Cloud Computing (AWS, Azure, GCP)",
      "Data Analysis and Big Data",
      "Cybersecurity and Data Protection",
      "DevOps and Infrastructure as Code",
      "Full-stack Development",
      "Mobile App Development (React Native, Flutter)",
      "API Development and Integration",
      "UI/UX Design and Prototyping",
      "Agile and Scrum Methodologies",
    ],

    emerging: [
      "Generative AI (ChatGPT, LLMs)",
      "Blockchain and Web3 Technologies",
      "Quantum Computing Basics",
      "Edge Computing",
      "Low-code/No-code Platforms",
      "AI Ethics and Responsible AI",
      "Data Privacy (GDPR, CCPA)",
      "Sustainability and Green Tech",
      "Extended Reality (AR/VR/XR)",
      "Autonomous Systems",
    ],

    soft: [
      "Adaptability and Learning Agility",
      "Remote Work Excellence",
      "Critical Thinking and Problem-solving",
      "Emotional Intelligence",
      "Cross-functional Collaboration",
      "Communication and Storytelling",
      "Leadership and Mentoring",
      "Customer-centric Mindset",
      "Resilience and Stress Management",
      "Innovation and Creative Thinking",
    ],
  },
};

export default function AiSuggestions() {
  const [activeCategory, setActiveCategory] = useState("recommended");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [jobRole, setJobRole] = useState("Software Engineer");
  const [experience, setExperience] = useState("5");
  const [skills, setSkills] = useState("JavaScript, React, Node.js");
  const [industry, setIndustry] = useState("tech");

  const navigate = useNavigate();

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);

    try {
      let generatedSuggestions = [];

      switch (activeCategory) {
        case "recommended": {
          const recommendedBase =
            industry === "tech"
              ? INDUSTRY_INSIGHTS.recommended.tech
              : jobRole.includes("Manager") || jobRole.includes("Lead")
              ? INDUSTRY_INSIGHTS.recommended.leadership
              : INDUSTRY_INSIGHTS.recommended.default;

          generatedSuggestions = recommendedBase.map((text, idx) => ({
            id: `rec-${idx}`,
            category: "recommended",
            text,
            type: "tip",
            priority: idx < 3 ? "high" : "medium",
          }));

          break;
        }

        case "avoid": {
          const avoidBase =
            industry === "tech"
              ? INDUSTRY_INSIGHTS.avoid.tech
              : INDUSTRY_INSIGHTS.avoid.default;

          generatedSuggestions = avoidBase.map((text, idx) => ({
            id: `avoid-${idx}`,
            category: "avoid",
            text,
            type: "warning",
            priority: idx < 3 ? "high" : "medium",
          }));

          break;
        }

        case "trending": {
          const trendingSkills = [
            ...INDUSTRY_INSIGHTS.trending.skills2024.map((skill) => ({
              text: skill,
              trend: "↗ High Demand",
            })),

            ...INDUSTRY_INSIGHTS.trending.emerging.map((skill) => ({
              text: skill,
              trend: "🚀 Emerging",
            })),

            ...INDUSTRY_INSIGHTS.trending.soft.map((skill) => ({
              text: skill,
              trend: "⭐ Essential",
            })),
          ];

          generatedSuggestions = trendingSkills.map((item, idx) => ({
            id: `trend-${idx}`,
            category: "trending",
            text: item.text,
            trend: item.trend,
            type: "skill",
          }));

          break;
        }

        case "personalized": {
          const yearsExp = parseInt(experience) || 5;

          const isJunior = yearsExp < 3;
          const isMid = yearsExp >= 3 && yearsExp < 8;
          const isSenior = yearsExp >= 8;

          const personalized = [];

          if (isJunior) {
            personalized.push(
              "Focus on learning and growth: highlight internships, projects, and courses"
            );
            personalized.push(
              "Emphasize foundational skills and certifications"
            );
            personalized.push(
              "Include passion projects and open-source contributions"
            );
          } else if (isMid) {
            personalized.push(
              "Highlight impact and measurable results from projects"
            );
            personalized.push(
              "Show progression and increasing responsibility"
            );
            personalized.push(
              "Include leadership or mentoring opportunities"
            );
          } else if (isSenior) {
            personalized.push(
              "Focus on strategic impact and business outcomes"
            );
            personalized.push(
              "Demonstrate thought leadership and industry influence"
            );
            personalized.push(
              "Show team leadership and organizational impact"
            );
          }

          if (
            jobRole.includes("Engineer") ||
            jobRole.includes("Developer")
          ) {
            personalized.push(
              `Master modern tech stack relevant to ${jobRole}`
            );
            personalized.push(
              "Include GitHub profile with quality projects"
            );
            personalized.push(
              "Show system design and architecture experience"
            );
          }

          if (
            jobRole.includes("Manager") ||
            jobRole.includes("Lead")
          ) {
            personalized.push(
              "Highlight team size managed and outcomes"
            );
            personalized.push(
              "Show strategic decision-making impact"
            );
            personalized.push(
              "Include employee development and retention metrics"
            );
          }

          if (
            jobRole.includes("Designer") ||
            jobRole.includes("Product")
          ) {
            personalized.push(
              "Include portfolio with case studies"
            );
            personalized.push(
              "Show user impact and design thinking process"
            );
            personalized.push(
              "Highlight design tools and prototyping skills"
            );
          }

          personalized.push(
            `Ensure "${skills}" are prominently featured with examples`
          );

          personalized.push(
            "Match skills to job description keywords"
          );

          personalized.push(
            "Show how skills delivered business value"
          );

          generatedSuggestions = personalized.map((text, idx) => ({
            id: `pers-${idx}`,
            category: "personalized",
            text,
            type: "personalized",
            relevance: idx < 3 ? "very-high" : "high",
          }));

          break;
        }

        default:
          break;
      }

      setSuggestions(generatedSuggestions);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setError(
        "Failed to generate suggestions. Please try again."
      );
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [activeCategory]);

  const toggleFavorite = (id) => {
    setFavorites((prev) =>
      prev.includes(id)
        ? prev.filter((fav) => fav !== id)
        : [...prev, id]
    );
  };

  const copySuggestion = (text) => {
    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        alert("Copied to clipboard!");
      })
      .catch(() => {
        alert("Failed to copy");
      });
  };

  const useSuggestion = (text) => {
    navigate("/create-resume", {
      state: {
        aiSuggestion: {
          category: activeCategory,
          content: text,
        },
      },
    });
  };

  const getTrendColor = (trend) => {
    if (trend.includes("High Demand")) {
      return "bg-teal/15 text-teal";
    }

    if (trend.includes("Emerging")) {
      return "bg-plum/15 text-plum";
    }

    if (trend.includes("Essential")) {
      return "bg-teal/15 text-teal";
    }

    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="w-full min-h-full p-[25px] overflow-hidden">
      <div className="w-full min-h-full h-full flex flex-col overflow-y-auto overflow-x-hidden pr-1">

        {/* HEADER */}
        <div className="shrink-0 mb-[18px] ruled">
          <div className="flex items-center gap-3 mb-2">
            <BackButton fallbackRoute="/db" />

            <h1 className="text-3xl font-display font-bold">
              AI Suggestions
            </h1>
          </div>

          <p className="muted text-sm ml-[40px]">
            Real-time, personalized resume recommendations
          </p>

          {lastUpdated && (
            <p className="text-xs text-muted-foreground/60 mt-1 ml-[40px]">
              Last updated: {lastUpdated}
            </p>
          )}
        </div>

        {/* PERSONALIZATION */}
        <div className="shrink-0 mb-[18px] card p-[16px] bg-linear-to-r from-gold/10 to-plum/10">
          <h3 className="text-lg font-display font-semibold mb-3">
            Personalize your suggestions
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-[12px]">

            <div>
              <label className="block label mb-1">
                JOB ROLE
              </label>

              <input
                type="text"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                className="input w-full text-sm"
                placeholder="e.g., Software Engineer"
              />
            </div>

            <div>
              <label className="block label mb-1">
                YEARS OF EXPERIENCE
              </label>

              <input
                type="number"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="input w-full text-sm"
                placeholder="e.g., 5"
              />
            </div>

            <div>
              <label className="block label mb-1">
                KEY SKILLS
              </label>

              <input
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="input w-full text-sm"
                placeholder="e.g., JavaScript, React"
              />
            </div>

            <div>
              <label className="block label mb-1">
                INDUSTRY
              </label>

              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="input w-full text-sm"
              >
                <option value="tech">Technology</option>
                <option value="finance">Finance</option>
                <option value="healthcare">
                  Healthcare
                </option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <button
            onClick={fetchSuggestions}
            disabled={loading}
            className="mt-[12px] btn btn-primary"
          >
            {loading
              ? "Generating..."
              : "🔄 Refresh Suggestions"}
          </button>
        </div>

        {/* CATEGORY TABS */}
        <div className="shrink-0 mb-[18px]">
          <div className="flex gap-[8px] overflow-x-auto pb-1">
            {SUGGESTION_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() =>
                  setActiveCategory(cat.id)
                }
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-secondary-foreground hover:bg-muted"
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-4 p-4 bg-brick/10 text-brick border border-brick/30 rounded-lg shrink-0 flex justify-between items-center">
            <span>{error}</span>

            <button
              onClick={() => setError(null)}
              className="font-semibold text-lg"
            >
              ×
            </button>
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="spinner"></div>

            <p className="muted mt-3">
              Generating {activeCategory} suggestions...
            </p>
          </div>
        )}

        {/* SUGGESTIONS GRID */}
        {!loading && suggestions.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[14px]">
            {suggestions.map((suggestion, idx) => (
              <div
                key={suggestion.id}
                className={`card p-[16px] hover:shadow-xl transition-all animate-fade border-l-4 ${
                  activeCategory === "avoid"
                    ? "border-brick bg-brick/10"
                    : activeCategory === "trending"
                    ? "border-plum bg-plum/10"
                    : activeCategory === "personalized"
                    ? "border-teal bg-teal/10"
                    : "border-gold bg-gold/10"
                }`}
                style={{
                  animationDelay: `${idx * 50}ms`,
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="leading-relaxed text-sm">
                      {suggestion.text}
                    </p>

                    {suggestion.trend && (
                      <div
                        className={`mt-2 inline-block px-2 py-1 rounded text-xs font-semibold ${getTrendColor(
                          suggestion.trend
                        )}`}
                      >
                        {suggestion.trend}
                      </div>
                    )}

                    {suggestion.priority &&
                      activeCategory === "recommended" && (
                        <div className="mt-2 text-xs font-semibold">
                          {suggestion.priority === "high"
                            ? "🔴 High Priority"
                            : "🟡 Medium Priority"}
                        </div>
                      )}
                  </div>

                  <button
                    onClick={() =>
                      toggleFavorite(suggestion.id)
                    }
                    className="ml-3 text-xl hover:scale-110 transition shrink-0"
                  >
                    {favorites.includes(suggestion.id)
                      ? "❤️"
                      : "🤍"}
                  </button>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex gap-3 mt-4 pt-3 border-t border-border">
                  <button
                    onClick={() =>
                      copySuggestion(suggestion.text)
                    }
                    className="flex-1 btn btn-secondary text-sm"
                  >
                    📋 Copy
                  </button>

                  <button
                    onClick={() =>
                      useSuggestion(suggestion.text)
                    }
                    className="flex-1 btn text-sm"
                  >
                    ✅ Use
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading &&
          suggestions.length === 0 &&
          !error && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-6xl mb-4">
                🤔
              </div>

              <p className="text-xl font-display font-semibold mb-2">
                No suggestions available
              </p>

              <p className="muted text-center mb-6">
                Try refreshing or adjusting your preferences
              </p>

              <button
                onClick={fetchSuggestions}
                className="btn btn-primary"
              >
                🔄 Refresh Now
              </button>
            </div>
          )}

        {/* FAVORITES */}
        {favorites.length > 0 && !loading && (
          <div className="mt-6 pt-5 border-t border-border">
            <h3 className="text-lg font-semibold mb-4">
              ⭐ Your Saved Suggestions (
              {favorites.length})
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-[14px]">
              {suggestions
                .filter((s) =>
                  favorites.includes(s.id)
                )
                .map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="card p-4 bg-gold/10 border-l-4 border-gold"
                  >
                    <p className="text-sm leading-relaxed mb-3">
                      {suggestion.text}
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          copySuggestion(
                            suggestion.text
                          )
                        }
                        className="flex-1 btn btn-secondary text-sm"
                      >
                        📋 Copy
                      </button>

                      <button
                        onClick={() =>
                          useSuggestion(
                            suggestion.text
                          )
                        }
                        className="flex-1 btn text-sm"
                      >
                        ✅ Use
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* PRO TIPS */}
        <div className="mt-6 pt-5 pb-4 border-t border-border">
          <h3 className="text-lg font-semibold mb-4">
            💡 Pro Tips
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px]">

            <div className="card p-4 bg-teal/10 border-l-4 border-teal">
              <p className="font-display font-semibold text-teal mb-2">
                📊 Use Data
              </p>

              <p className="text-sm">
                Include metrics: "Increased by 35%",
                "Saved $50K", "Reduced time by 40%"
              </p>
            </div>

            <div className="card p-4 bg-teal/10 border-l-4 border-teal">
              <p className="font-display font-semibold text-teal mb-2">
                🎯 Match Keywords
              </p>

              <p className="text-sm">
                Use same keywords from job description
                to pass ATS systems
              </p>
            </div>

            <div className="card p-4 bg-plum/10 border-l-4 border-plum">
              <p className="font-display font-semibold text-plum mb-2">
                ✨ Show Impact
              </p>

              <p className="text-sm">
                Focus on results, not duties:
                "Delivered" vs "Responsible for"
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}