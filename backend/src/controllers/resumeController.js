const Resume = require('../models/Resume');
const { callGemini } = require('../utils/gemini');

// POST /api/resumes/auto-generate
async function autoGenerate(req, res) {
  try {
    const { title, data: inputData } = req.body || {};

    if (!inputData) {
      return res.status(400).json({ message: 'Resume data is required' });
    }

    console.log('📝 Generating resume for:', inputData.fullName);

    // Call Gemini AI to analyze and generate ATS-friendly resume
    const aiResult = await callGemini(inputData);

    // Save to database
    const resume = await Resume.create({
      userId: req.userId || '65f000000000000000000000',
      title: title || `${inputData.fullName || 'My'}'s Resume`,
      data: aiResult
    });

    console.log('✅ Resume generated and saved:', resume._id);
    return res.json({ resume, pdfUrl: null });

  } catch (err) {
    console.error('autoGenerate ERROR:', err.message);
    return res.status(500).json({ error: true, message: err.message });
  }
}

// GET /api/resumes
async function list(req, res) {
  try {
    const resumes = await Resume.find({ userId: req.userId }).sort({ updatedAt: -1 });
    res.json(resumes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// POST /api/resumes
async function create(req, res) {
  try {
    const { title, templateId, data } = req.body;
    const resume = await Resume.create({ userId: req.userId, title, templateId, data });
    res.status(201).json(resume);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// GET /api/resumes/:id
async function getOne(req, res) {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.userId });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    res.json(resume);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// PUT /api/resumes/:id
async function update(req, res) {
  try {
    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: req.body },
      { new: true }
    );
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    res.json(resume);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// DELETE /api/resumes/:id
async function remove(req, res) {
  try {
    const resume = await Resume.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// POST /api/resumes/:id/ai-populate
// Re-analyze and improve existing resume with AI
async function aiPopulate(req, res) {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    console.log('🤖 AI improving resume:', resume._id);
    const aiResult = await callGemini(resume.data);

    resume.data = { ...resume.data, ...aiResult };
    await resume.save();

    res.json(resume);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// POST /api/resumes/:id/generate-pdf
async function generatePdfHandler(req, res) {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    res.json({ pdfUrl: null, message: 'Use frontend PDF generation' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// POST /api/resumes/:id/ats-check
async function atsCheck(req, res) {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    const data = resume.data || {};
    const issues = [];
    const suggestions = [];

    if (!data.summary || data.summary.length < 50) {
      issues.push('Professional summary is missing or too short');
      suggestions.push('Add a 3-4 sentence professional summary at the top');
    }
    if (!data.skills || data.skills.length < 5) {
      issues.push('Too few skills listed');
      suggestions.push('Add 10-15 relevant technical and soft skills');
    }
    if (!data.experience || data.experience.length === 0) {
      issues.push('No work experience found');
      suggestions.push('Add at least one work experience with bullet points');
    }
    if (!data.email) {
      issues.push('Email address is missing');
      suggestions.push('Add your professional email address');
    }
    if (!data.phone) {
      issues.push('Phone number is missing');
      suggestions.push('Add your contact phone number');
    }

    const score = Math.max(30, 100 - (issues.length * 15));
    const keywords = Array.isArray(data.skills) ? data.skills.slice(0, 10) : [];

    return res.json({ result: { score, issues, suggestions, keywords } });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { list, create, getOne, update, remove, aiPopulate, generatePdfHandler, autoGenerate, atsCheck };