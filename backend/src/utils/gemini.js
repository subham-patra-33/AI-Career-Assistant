// Gemini-powered ATS resume generation.
// The model is instructed to use only facts supplied by the user and to
// tailor wording/keywords to the target role and job description.

async function callGemini(resumeData = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is not configured. Add it to backend/.env');
  }

  const skills = Array.isArray(resumeData.skills) ? resumeData.skills.join(', ') : (resumeData.skills || '');
  const experience = Array.isArray(resumeData.experience)
    ? JSON.stringify(resumeData.experience)
    : (resumeData.experience || '');
  const projects = Array.isArray(resumeData.projects)
    ? JSON.stringify(resumeData.projects)
    : (resumeData.projects || '');
  const education = Array.isArray(resumeData.education)
    ? JSON.stringify(resumeData.education)
    : (resumeData.education || '');
  const certifications = Array.isArray(resumeData.certifications)
    ? resumeData.certifications.join(', ')
    : (resumeData.certifications || '');
  const achievements = Array.isArray(resumeData.achievements)
    ? resumeData.achievements.join(', ')
    : (resumeData.achievements || '');

  const prompt = `You are a senior recruiter, professional resume writer, and ATS optimization specialist.
Create a concise, professional, ATS-friendly resume from the candidate information below.

TARGET ROLE: ${resumeData.targetRole || ''}
JOB DESCRIPTION:
${resumeData.jobDescription || '(not provided)'}

CANDIDATE DATA:
Name: ${resumeData.fullName || ''}
Email: ${resumeData.email || ''}
Phone: ${resumeData.phone || ''}
Location: ${resumeData.location || ''}
LinkedIn: ${resumeData.linkedin || ''}
GitHub/Portfolio: ${resumeData.github || ''}
Current/Provided Summary: ${resumeData.summary || ''}
Skills: ${skills}
Experience: ${experience || 'None provided'}
Projects: ${projects || 'None provided'}
Education: ${education || 'None provided'}
Certifications: ${certifications || 'None provided'}
Achievements: ${achievements || 'None provided'}

RULES:
1. Use ONLY facts explicitly supplied by the candidate. Never invent employers, roles, dates, degrees, certifications, technologies, metrics, responsibilities, achievements, or years of experience.
2. If a fact is missing, leave that field empty or omit that item.
3. If a job description is provided, extract important ATS keywords from it and use them naturally ONLY when the candidate's information supports them.
4. Do not add a keyword merely because it is common for the target role.
5. Rewrite weak descriptions into strong, concise bullets using action verbs. Do not create unsupported results or numbers.
6. For students/freshers, do not fabricate work experience. Use projects, education, certifications and achievements instead.
7. Keep the summary to 2-4 sentences and tailor it to the target role.
8. Skills should contain the candidate's actual skills, deduplicated and grouped logically when possible. Do not manufacture skills.
9. Projects should have a clear title, 1-3 concise bullets/descriptions, and technologies only if supplied.
10. Use standard ATS section names and plain professional language.
4. Convert projects they mentioned into structured entries with a "bullets" array (2-3 short bullet points each, like the experience section) — NEVER as one long comma-joined sentence. Each skill in "skills" MUST be a plain string, never an object. If none mentioned, use empty array []
11. Return ONLY valid JSON. No markdown fences and no explanation.

JSON schema:
{
  "fullName": "",
  "email": "",
  "phone": "",
  "location": "",
  "linkedin": "",
  "github": "",
  "targetRole": "",
  "summary": "",
  "skills": [],
  "experience": [{"company":"","role":"","start":"","end":"","bullets":[]}],
   "projects": [{"title": "string", "bullets": ["string", "string"], "technologies": ["string"]}],
  "education": [{"degree":"","school":"","year":"","grade":""}],
  "certifications": [],
  "achievements": [],
  "atsKeywords": []
}`;

  const models = ['gemini-2.5-flash', 'gemini-flash-latest'];
  let lastError = '';

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 3500, responseMimeType: 'application/json' }
          })
        }
      );

      if (!response.ok) {
        lastError = `Gemini ${model} returned HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`;
        continue;
      }

      const result = await response.json();
      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start < 0 || end < start) throw new Error('Gemini returned no JSON');

      const parsed = JSON.parse(text.slice(start, end + 1));
      return normalizeResume(parsed, resumeData);
    } catch (error) {
      lastError = error.message;
    }
  }

  throw new Error(lastError || 'Gemini request failed');
}

function toStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map(v => typeof v === 'string' ? v.trim() : String(v || '').trim()).filter(Boolean);
}
function toText(item) {
  if (typeof item === 'string') return item.trim();
  if (item && typeof item === 'object') return String(item.name || item.skill || item.title || Object.values(item)[0] || '').trim();
  return String(item ?? '').trim();
}

function normalizeResume(parsed, source) {
  const skills = (Array.isArray(parsed.skills) ? parsed.skills : []).map(toText).filter(Boolean);

  const projects = Array.isArray(parsed.projects) ? parsed.projects.map(p => {
    let bullets = toStringArray(p?.bullets);
    if (!bullets.length && typeof p?.description === 'string') {
      // Split a run-on ".,Next sentence" style string into clean separate bullets.
      bullets = p.description
        .split(/\.\s*,|\.\s+(?=[A-Z])/)
        .map(s => s.trim().replace(/^,/, '').trim())
        .filter(Boolean)
        .map(s => (s.endsWith('.') ? s : s + '.'));
    }
    return {
      title: p?.title || p?.name || '',
      bullets,
      technologies: toStringArray(p?.technologies)
    };
  }).filter(p => p.title || p.bullets.length) : [];

  const experience = Array.isArray(parsed.experience) ? parsed.experience.map(e => ({
    company: e?.company || '', role: e?.role || '', start: e?.start || '', end: e?.end || '',
    bullets: toStringArray(e?.bullets)
  })).filter(e => e.company || e.role || e.bullets.length) : [];

  const education = Array.isArray(parsed.education) ? parsed.education.map(e => ({
    degree: e?.degree || '', school: e?.school || '', year: e?.year || '', grade: e?.grade || ''
  })).filter(e => e.degree || e.school || e.year || e.grade) : [];

  const certifications = toStringArray(parsed.certifications);
  const achievements = (Array.isArray(parsed.achievements) ? parsed.achievements : []).map(toText).filter(Boolean);
  const atsKeywords = toStringArray(parsed.atsKeywords);

  return {
    fullName: parsed.fullName || source.fullName || '',
    email: parsed.email || source.email || '',
    phone: parsed.phone || source.phone || '',
    location: parsed.location || source.location || '',
    linkedin: parsed.linkedin || source.linkedin || '',
    github: parsed.github || source.github || '',
    targetRole: parsed.targetRole || source.targetRole || '',
    summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    skills,
    experience,
    projects,
    education,
    certifications,
    achievements,
    atsKeywords
  };
}
module.exports = { callGemini };
