const Resume = require("../models/Resume");
const { callGemini } = require("../utils/gemini");

// ============================================================
// POST /api/resumes/auto-generate
// ============================================================
// Generates and saves a resume for the authenticated user.

async function autoGenerate(req, res) {
  try {
    const { title, data: inputData } = req.body || {};

    if (!inputData) {
      return res.status(400).json({
        message: "Resume data is required"
      });
    }

    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required"
      });
    }

    console.log(
      "📝 Generating resume for:",
      inputData.fullName || inputData.name
    );

    const aiResult = await callGemini(inputData);

    const resume = await Resume.create({
      userId: req.userId,

      title:
        title ||
        `${inputData.fullName || inputData.name || "My"}'s Resume`,

      templateId:
        inputData.templateId || "modern-minimal",

      data: aiResult
    });

    console.log(
      "✅ Resume generated and saved:",
      resume._id.toString()
    );

    return res.status(201).json({
      success: true,
      resume,
      pdfUrl: null
    });

  } catch (err) {
    console.error(
      "❌ autoGenerate ERROR:",
      err.message
    );

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Failed to generate resume"
    });
  }
}


// ============================================================
// GET /api/resumes
// ============================================================

async function list(req, res) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required"
      });
    }

    const resumes = await Resume.find({
      userId: req.userId
    })
      .sort({ updatedAt: -1 })
      .lean();

    return res.json(resumes);

  } catch (err) {
    console.error(
      "❌ Resume list error:",
      err.message
    );

    return res.status(500).json({
      message: err.message
    });
  }
}


// ============================================================
// POST /api/resumes
// ============================================================

async function create(req, res) {
  try {
    const { title, templateId, data } = req.body || {};

    if (!req.userId) {
      return res.status(401).json({
        error: true,
        message: "Authentication required",
      });
    }

    if (!data) {
      return res.status(400).json({
        error: true,
        message: "Resume data is required",
      });
    }

    const resume = await Resume.create({
      userId: req.userId,
      title: title || `${data.fullName || "My"}'s Resume`,
      templateId: templateId || "simple-ats",
      data,
    });

    console.log("✅ Resume saved to MongoDB:", resume._id);

    return res.status(201).json(resume);
  } catch (err) {
    console.error("❌ Resume create error:", err);

    return res.status(500).json({
      error: true,
      message: err.message,
    });
  }
}


// ============================================================
// GET /api/resumes/:id
// ============================================================

async function getOne(req, res) {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!resume) {
      return res.status(404).json({
        message: "Resume not found"
      });
    }

    return res.json(resume);

  } catch (err) {
    console.error(
      "❌ Get resume error:",
      err.message
    );

    return res.status(500).json({
      message: err.message
    });
  }
}


// ============================================================
// PUT /api/resumes/:id
// ============================================================

async function update(req, res) {
  try {
    const allowedFields = {};

    if (req.body.title !== undefined) {
      allowedFields.title = req.body.title;
    }

    if (req.body.templateId !== undefined) {
      allowedFields.templateId =
        req.body.templateId;
    }

    if (req.body.data !== undefined) {
      allowedFields.data = req.body.data;
    }

    const resume =
      await Resume.findOneAndUpdate(
        {
          _id: req.params.id,
          userId: req.userId
        },

        {
          $set: allowedFields
        },

        {
          new: true,
          runValidators: true
        }
      );

    if (!resume) {
      return res.status(404).json({
        message: "Resume not found"
      });
    }

    console.log(
      "✅ Resume updated:",
      resume._id.toString()
    );

    return res.json(resume);

  } catch (err) {
    console.error(
      "❌ Resume update error:",
      err.message
    );

    return res.status(500).json({
      message: err.message
    });
  }
}


// ============================================================
// DELETE /api/resumes/:id
// ============================================================

async function remove(req, res) {
  try {
    const resume =
      await Resume.findOneAndDelete({
        _id: req.params.id,
        userId: req.userId
      });

    if (!resume) {
      return res.status(404).json({
        message: "Resume not found"
      });
    }

    console.log(
      "🗑️ Resume deleted:",
      resume._id.toString()
    );

    return res.json({
      success: true,
      message: "Deleted successfully"
    });

  } catch (err) {
    console.error(
      "❌ Resume delete error:",
      err.message
    );

    return res.status(500).json({
      message: err.message
    });
  }
}


// ============================================================
// POST /api/resumes/:id/ai-populate
// ============================================================

async function aiPopulate(req, res) {
  try {
    const resume =
      await Resume.findOne({
        _id: req.params.id,
        userId: req.userId
      });

    if (!resume) {
      return res.status(404).json({
        message: "Resume not found"
      });
    }

    console.log(
      "🤖 AI improving resume:",
      resume._id.toString()
    );

    const aiResult =
      await callGemini(resume.data);

    resume.data = {
      ...resume.data,
      ...aiResult
    };

    await resume.save();

    return res.json(resume);

  } catch (err) {
    console.error(
      "❌ AI populate error:",
      err.message
    );

    return res.status(500).json({
      message: err.message
    });
  }
}


// ============================================================
// POST /api/resumes/:id/generate-pdf
// ============================================================

async function generatePdfHandler(req, res) {
  try {
    const resume =
      await Resume.findOne({
        _id: req.params.id,
        userId: req.userId
      });

    if (!resume) {
      return res.status(404).json({
        message: "Resume not found"
      });
    }

    return res.json({
      pdfUrl: resume.pdfUrl || null,
      message: "Use frontend PDF generation"
    });

  } catch (err) {
    console.error(
      "❌ Generate PDF error:",
      err.message
    );

    return res.status(500).json({
      message: err.message
    });
  }
}


// ============================================================
// POST /api/resumes/:id/ats-check
// ============================================================

async function atsCheck(req, res) {
  try {
    const resume =
      await Resume.findOne({
        _id: req.params.id,
        userId: req.userId
      });

    if (!resume) {
      return res.status(404).json({
        message: "Resume not found"
      });
    }

    const data = resume.data || {};

    const issues = [];
    const suggestions = [];

    // ----------------------------------------------------------
    // SUMMARY
    // ----------------------------------------------------------

    if (
      !data.summary ||
      data.summary.trim().length < 50
    ) {
      issues.push(
        "Professional summary is missing or too short"
      );

      suggestions.push(
        "Add a concise 3-4 sentence professional summary"
      );
    }

    // ----------------------------------------------------------
    // SKILLS
    // ----------------------------------------------------------

    if (
      !Array.isArray(data.skills) ||
      data.skills.length < 5
    ) {
      issues.push(
        "Too few skills listed"
      );

      suggestions.push(
        "Add 10-15 relevant skills supported by your experience"
      );
    }

    // ----------------------------------------------------------
    // EXPERIENCE
    // ----------------------------------------------------------

    const experience =
      Array.isArray(data.experience)
        ? data.experience
        : [];

    if (experience.length === 0) {
      issues.push(
        "No work experience found"
      );

      suggestions.push(
        "Add relevant internship, work, or practical experience"
      );
    }

    // ----------------------------------------------------------
    // CONTACT
    // ----------------------------------------------------------

    const contact =
      data.contact || {};

    const email =
      data.email ||
      contact.email;

    const phone =
      data.phone ||
      contact.phone;

    if (!email) {
      issues.push(
        "Email address is missing"
      );

      suggestions.push(
        "Add a professional email address"
      );
    }

    if (!phone) {
      issues.push(
        "Phone number is missing"
      );

      suggestions.push(
        "Add your contact phone number"
      );
    }

    // ----------------------------------------------------------
    // ATS SCORE
    // ----------------------------------------------------------

    const score = Math.max(
      30,
      100 - issues.length * 15
    );

    const keywords =
      Array.isArray(data.atsKeywords)
        ? data.atsKeywords.slice(0, 15)
        : Array.isArray(data.skills)
          ? data.skills.slice(0, 15)
          : [];

    return res.json({
      result: {
        score,
        issues,
        suggestions,
        keywords
      }
    });

  } catch (err) {
    console.error(
      "❌ ATS check error:",
      err.message
    );

    return res.status(500).json({
      message: err.message
    });
  }
}


// ============================================================
// EXPORT
// ============================================================

module.exports = {
  list,
  create,
  getOne,
  update,
  remove,
  aiPopulate,
  generatePdfHandler,
  autoGenerate,
  atsCheck
};