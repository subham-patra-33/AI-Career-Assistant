// A small curated bank of role-matched suggestions, in the spirit of Zety's
// "pre-written phrases" — pick a role, get relevant skills/bullets to select
// instead of typing from scratch. Falls back to a generic tech bank if the
// user's typed role doesn't match anything here.

export const ROLE_OPTIONS = [
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Software Engineer",
  "Web Developer",
  "AI/ML Engineer",
  "Data Analyst",
  "DevOps Engineer",
  "Mobile App Developer",
  "UI/UX Designer",
];

const GENERIC_SKILLS = ["Problem Solving", "Git", "GitHub", "Data Structures & Algorithms", "Team Collaboration", "Communication"];

export const SKILL_SUGGESTIONS = {
  "Full Stack Developer": ["JavaScript", "React", "Node.js", "Express.js", "MongoDB", "REST API", "HTML", "CSS", ...GENERIC_SKILLS],
  "Frontend Developer": ["JavaScript", "React", "HTML", "CSS", "Tailwind CSS", "Responsive Design", "TypeScript", ...GENERIC_SKILLS],
  "Backend Developer": ["Node.js", "Express.js", "MongoDB", "SQL", "REST API", "Authentication", "Docker", ...GENERIC_SKILLS],
  "Software Engineer": ["Java", "Python", "C++", "Object-Oriented Design", "System Design", ...GENERIC_SKILLS],
  "Web Developer": ["HTML", "CSS", "JavaScript", "React", "WordPress", "SEO Basics", ...GENERIC_SKILLS],
  "AI/ML Engineer": ["Python", "Machine Learning", "TensorFlow", "PyTorch", "Pandas", "NumPy", "Deep Learning", ...GENERIC_SKILLS],
  "Data Analyst": ["SQL", "Excel", "Python", "Power BI", "Tableau", "Data Visualization", "Statistics", ...GENERIC_SKILLS],
  "DevOps Engineer": ["Docker", "Kubernetes", "CI/CD", "AWS", "Linux", "Jenkins", ...GENERIC_SKILLS],
  "Mobile App Developer": ["React Native", "Flutter", "Kotlin", "Swift", "REST API", ...GENERIC_SKILLS],
  "UI/UX Designer": ["Figma", "Wireframing", "User Research", "Prototyping", "Adobe XD", ...GENERIC_SKILLS],
};

export const BULLET_SUGGESTIONS = {
  "Full Stack Developer": [
    "Developed and maintained full-stack web applications using React and Node.js.",
    "Built and integrated REST APIs to connect frontend and backend services.",
    "Designed and optimized MongoDB schemas to support application data needs.",
    "Collaborated with a team to deliver features on schedule using Git version control.",
    "Improved application performance by optimizing database queries and frontend rendering.",
  ],
  "Frontend Developer": [
    "Built responsive, accessible user interfaces using React and Tailwind CSS.",
    "Translated design mockups into pixel-accurate, functional web pages.",
    "Improved page load performance through code-splitting and lazy loading.",
    "Collaborated with backend developers to integrate REST APIs into the UI.",
  ],
  "Backend Developer": [
    "Designed and implemented REST APIs using Node.js and Express.js.",
    "Built and maintained database schemas and queries in MongoDB.",
    "Implemented authentication and authorization using JWT.",
    "Optimized backend performance and reduced API response times.",
  ],
  "AI/ML Engineer": [
    "Built and trained machine learning models using Python and TensorFlow/PyTorch.",
    "Preprocessed and cleaned datasets to improve model accuracy.",
    "Evaluated model performance using standard metrics and iterated on results.",
    "Deployed trained models into a working application pipeline.",
  ],
  "Data Analyst": [
    "Analyzed large datasets using SQL and Python to identify actionable trends.",
    "Built interactive dashboards using Power BI/Tableau to communicate findings.",
    "Cleaned and validated data to ensure accuracy of reporting.",
  ],
};

// Fuzzy-ish lookup: exact match first, then substring match, then generic fallback.
export function getSkillsForRole(role) {
  if (!role) return GENERIC_SKILLS;
  if (SKILL_SUGGESTIONS[role]) return SKILL_SUGGESTIONS[role];
  const key = Object.keys(SKILL_SUGGESTIONS).find(k => role.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(role.toLowerCase()));
  return key ? SKILL_SUGGESTIONS[key] : GENERIC_SKILLS;
}

export function getBulletsForRole(role) {
  if (!role) return [];
  if (BULLET_SUGGESTIONS[role]) return BULLET_SUGGESTIONS[role];
  const key = Object.keys(BULLET_SUGGESTIONS).find(k => role.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(role.toLowerCase()));
  return key ? BULLET_SUGGESTIONS[key] : BULLET_SUGGESTIONS["Full Stack Developer"];
}