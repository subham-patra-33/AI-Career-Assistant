const mongoose = require("mongoose");

const Resume = require("../models/Resume");
const { callGemini } = require("../utils/gemini");
const { logActivity, ACTIVITY_TYPES } = require("../services/activityService");

/* ============================================================
   GENERAL HELPERS
   ============================================================ */

function safeString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.trim();
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function getResumeTitle(data, title) {
  const explicitTitle =
    safeString(title);

  if (explicitTitle) {
    return explicitTitle;
  }

  const targetRole =
    safeString(
      data?.targetRole
    );

  const fullName =
    safeString(
      data?.fullName
    ) ||
    safeString(
      data?.name
    );

  if (targetRole) {
    return `${targetRole} Resume`;
  }

  if (fullName) {
    return `${fullName}'s Resume`;
  }

  return "Untitled Resume";
}

function getTemplateId(data, templateId) {
  return (
    safeString(templateId) ||
    safeString(data?.templateId) ||
    safeString(data?.template) ||
    "modern-minimal"
  );
}

function handleMongoError(res, error) {
  console.error(
    "âŒ MongoDB Resume Error:",
    error
  );

  if (
    error?.name ===
    "ValidationError"
  ) {
    return res.status(400).json({
      success: false,
      code:
        "VALIDATION_ERROR",
      message:
        "The resume data is invalid.",
      error:
        error.message,
    });
  }

  if (
    error?.name ===
      "CastError" &&
    error?.path === "_id"
  ) {
    return res.status(400).json({
      success: false,
      code:
        "INVALID_RESUME_ID",
      message:
        "The resume ID is invalid.",
    });
  }

  return res.status(500).json({
    success: false,
    message:
      error?.message ||
      "An error occurred while processing the resume.",
  });
}

function requireUser(req, res) {
  if (!req.userId) {
    res.status(401).json({
      success: false,
      code:
        "AUTH_REQUIRED",
      message:
        "Please log in to manage your resumes.",
    });

    return false;
  }

  return true;
}

/* ============================================================
   POST /api/resumes/auto-generate
   ============================================================ */

async function autoGenerate(req, res) {
  try {
    if (!requireUser(req, res)) {
      return;
    }

    const {
      title,
      templateId,
      data: inputData,
    } = req.body || {};

    if (
      !inputData ||
      typeof inputData !==
        "object"
    ) {
      return res.status(400).json({
        success: false,
        code:
          "MISSING_RESUME_DATA",
        message:
          "Resume data is required.",
      });
    }

    console.log("");
    console.log(
      "=================================================="
    );
    console.log(
      "ðŸ“ AUTO GENERATE RESUME"
    );
    console.log(
      "=================================================="
    );

    console.log(
      "ðŸ‘¤ User:",
      req.userId
    );

    console.log(
      "ðŸ‘¤ Candidate:",
      inputData.fullName ||
        inputData.name ||
        "Unknown"
    );

    /* --------------------------------------------------------
       Call Gemini
       -------------------------------------------------------- */

    const aiResult =
      await callGemini(
        inputData
      );

    if (
      !aiResult ||
      typeof aiResult !==
        "object"
    ) {
      return res.status(502).json({
        success: false,
        code:
          "INVALID_AI_RESPONSE",
        message:
          "Gemini returned an invalid resume response.",
      });
    }

    /* --------------------------------------------------------
       Determine title + template
       -------------------------------------------------------- */

    const finalTitle =
      getResumeTitle(
        {
          ...inputData,
          ...aiResult,
        },
        title
      );

    const finalTemplateId =
      getTemplateId(
        {
          ...inputData,
          ...aiResult,
        },
        templateId
      );

    const resumeData = {
      ...aiResult,
      templateId:
        finalTemplateId,
      template:
        finalTemplateId,
    };

    /* --------------------------------------------------------
       Save to MongoDB
       -------------------------------------------------------- */

    const resume =
      await Resume.create({
        userId:
          req.userId,

        title:
          finalTitle,

        templateId:
          finalTemplateId,

        data:
          resumeData,

        pdfUrl:
          null,

        isPublic:
          false,
      });

    console.log(
      "âœ… Resume generated and saved:",
      String(resume._id)
    );

    logActivity(req.userId, ACTIVITY_TYPES.RESUME_CREATED, "resume", {
      resumeId: resume._id,
      templateId: finalTemplateId,
    });

    console.log(
      "=================================================="
    );
    console.log("");

    return res.status(201).json({
      success: true,

      resume,

      resumeId:
        String(
          resume._id
        ),

      pdfUrl:
        null,

      message:
        "Resume generated and saved successfully.",
    });
  } catch (error) {
    console.error(
      "âŒ autoGenerate ERROR:",
      error
    );

    return handleMongoError(
      res,
      error
    );
  }
}

/* ============================================================
   GET /api/resumes
   ============================================================ */

async function list(req, res) {
  try {
    if (!requireUser(req, res)) {
      return;
    }

    const resumes =
      await Resume.find({
        userId:
          req.userId,
      })
        .sort({
          updatedAt: -1,
        })
        .lean();

    return res.json({
      success: true,

      resumes,

      count:
        resumes.length,
    });
  } catch (error) {
    return handleMongoError(
      res,
      error
    );
  }
}

/* ============================================================
   POST /api/resumes
   ============================================================ */

async function create(req, res) {
  try {
    if (!requireUser(req, res)) {
      return;
    }

    const {
      title,
      templateId,
      data,
      pdfUrl,
      isPublic,
    } = req.body || {};

    if (
      !data ||
      typeof data !==
        "object"
    ) {
      return res.status(400).json({
        success: false,
        code:
          "MISSING_RESUME_DATA",
        message:
          "Resume data is required.",
      });
    }

    const finalTemplateId =
      getTemplateId(
        data,
        templateId
      );

    const resume =
      await Resume.create({
        userId:
          req.userId,

        title:
          getResumeTitle(
            data,
            title
          ),

        templateId:
          finalTemplateId,

        data: {
          ...data,
          templateId:
            finalTemplateId,
          template:
            finalTemplateId,
        },

        pdfUrl:
          pdfUrl || null,

        isPublic:
          Boolean(isPublic),
      });

    console.log(
      "âœ… Resume created:",
      String(resume._id)
    );

    logActivity(req.userId, ACTIVITY_TYPES.RESUME_CREATED, "resume", {
      resumeId: resume._id,
      templateId: finalTemplateId,
    });

    return res.status(201).json({
      success: true,

      resume,

      resumeId:
        String(
          resume._id
        ),

      message:
        "Resume created successfully.",
    });
  } catch (error) {
    return handleMongoError(
      res,
      error
    );
  }
}

/* ============================================================
   GET /api/resumes/:id
   ============================================================ */

async function getOne(req, res) {
  try {
    if (!requireUser(req, res)) {
      return;
    }

    const {
      id,
    } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        code:
          "INVALID_RESUME_ID",
        message:
          "The resume ID is invalid.",
      });
    }

    const resume =
      await Resume.findOne({
        _id: id,
        userId:
          req.userId,
      }).lean();

    if (!resume) {
      return res.status(404).json({
        success: false,
        code:
          "RESUME_NOT_FOUND",
        message:
          "Resume not found.",
      });
    }

    return res.json({
      success: true,

      resume,
    });
  } catch (error) {
    return handleMongoError(
      res,
      error
    );
  }
}

/* ============================================================
   PUT /api/resumes/:id
   ============================================================ */

async function update(req, res) {
  try {
    if (!requireUser(req, res)) {
      return;
    }

    const {
      id,
    } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        code:
          "INVALID_RESUME_ID",
        message:
          "The resume ID is invalid.",
      });
    }

    const body =
      req.body || {};

    /*
      Only allow actual resume fields to be updated.

      This prevents a frontend request from changing:
      - userId
      - _id
      - createdAt
      - updatedAt
    */

    const updateData = {};

    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "title"
      )
    ) {
      updateData.title =
        safeString(
          body.title
        ) ||
        "Untitled Resume";
    }

    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "templateId"
      )
    ) {
      updateData.templateId =
        safeString(
          body.templateId
        ) ||
        "modern-minimal";
    }

    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "data"
      )
    ) {
      if (
        !body.data ||
        typeof body.data !==
          "object"
      ) {
        return res.status(400).json({
          success: false,
          code:
            "INVALID_RESUME_DATA",
          message:
            "Resume data must be an object.",
        });
      }

      const finalTemplateId =
        getTemplateId(
          body.data,
          body.templateId
        );

      updateData.data = {
        ...body.data,
        templateId:
          finalTemplateId,
        template:
          finalTemplateId,
      };

      if (
        !Object.prototype.hasOwnProperty.call(
          body,
          "title"
        )
      ) {
        updateData.title =
          getResumeTitle(
            body.data
          );
      }

      if (
        !Object.prototype.hasOwnProperty.call(
          body,
          "templateId"
        )
      ) {
        updateData.templateId =
          finalTemplateId;
      }
    }

    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "pdfUrl"
      )
    ) {
      updateData.pdfUrl =
        body.pdfUrl || null;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "isPublic"
      )
    ) {
      updateData.isPublic =
        Boolean(
          body.isPublic
        );
    }

    if (
      Object.keys(
        updateData
      ).length === 0
    ) {
      return res.status(400).json({
        success: false,
        code:
          "NO_UPDATE_DATA",
        message:
          "No valid resume fields were provided for update.",
      });
    }

    const resume =
      await Resume.findOneAndUpdate(
        {
          _id: id,
          userId:
            req.userId,
        },
        {
          $set:
            updateData,
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!resume) {
      return res.status(404).json({
        success: false,
        code:
          "RESUME_NOT_FOUND",
        message:
          "Resume not found.",
      });
    }

    console.log(
      "âœ… Resume updated:",
      String(resume._id)
    );

    return res.json({
      success: true,

      resume,

      resumeId:
        String(
          resume._id
        ),

      message:
        "Resume updated successfully.",
    });
  } catch (error) {
    return handleMongoError(
      res,
      error
    );
  }
}

/* ============================================================
   DELETE /api/resumes/:id
   ============================================================ */

async function remove(req, res) {
  try {
    if (!requireUser(req, res)) {
      return;
    }

    const {
      id,
    } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        code:
          "INVALID_RESUME_ID",
        message:
          "The resume ID is invalid.",
      });
    }

    const resume =
      await Resume.findOneAndDelete({
        _id: id,
        userId:
          req.userId,
      });

    if (!resume) {
      return res.status(404).json({
        success: false,
        code:
          "RESUME_NOT_FOUND",
        message:
          "Resume not found.",
      });
    }

    console.log(
      "ðŸ—‘ï¸ Resume deleted:",
      String(resume._id)
    );

    return res.json({
      success: true,

      message:
        "Resume deleted successfully.",

      resumeId:
        String(
          resume._id
        ),
    });
  } catch (error) {
    return handleMongoError(
      res,
      error
    );
  }
}

/* ============================================================
   POST /api/resumes/:id/ai-populate
   Re-analyze and improve existing resume with AI
   ============================================================ */

async function aiPopulate(req, res) {
  try {
    if (!requireUser(req, res)) {
      return;
    }

    const {
      id,
    } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        code:
          "INVALID_RESUME_ID",
        message:
          "The resume ID is invalid.",
      });
    }

    const resume =
      await Resume.findOne({
        _id: id,
        userId:
          req.userId,
      });

    if (!resume) {
      return res.status(404).json({
        success: false,
        code:
          "RESUME_NOT_FOUND",
        message:
          "Resume not found.",
      });
    }

    console.log(
      "ðŸ¤– AI improving resume:",
      String(
        resume._id
      )
    );

    const aiResult =
      await callGemini(
        resume.data || {}
      );

    if (
      !aiResult ||
      typeof aiResult !==
        "object"
    ) {
      return res.status(502).json({
        success: false,
        code:
          "INVALID_AI_RESPONSE",
        message:
          "Gemini returned an invalid resume response.",
      });
    }

    const existingData =
      resume.data &&
      typeof resume.data ===
        "object"
        ? resume.data
        : {};

    const templateId =
      getTemplateId(
        {
          ...existingData,
          ...aiResult,
        },
        resume.templateId
      );

    resume.data = {
      ...existingData,
      ...aiResult,
      templateId,
      template:
        templateId,
    };

    resume.templateId =
      templateId;

    if (
      !safeString(
        resume.title
      ) ||
      resume.title ===
        "Untitled Resume"
    ) {
      resume.title =
        getResumeTitle(
          resume.data
        );
    }

    await resume.save();

    console.log(
      "âœ… AI resume improvement saved:",
      String(
        resume._id
      )
    );

    return res.json({
      success: true,

      resume,

      resumeId:
        String(
          resume._id
        ),

      message:
        "Resume improved successfully.",
    });
  } catch (error) {
    console.error(
      "âŒ AI Populate Error:",
      error
    );

    return handleMongoError(
      res,
      error
    );
  }
}

/* ============================================================
   POST /api/resumes/:id/generate-pdf
   ============================================================ */

async function generatePdfHandler(
  req,
  res
) {
  try {
    if (!requireUser(req, res)) {
      return;
    }

    const {
      id,
    } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        code:
          "INVALID_RESUME_ID",
        message:
          "The resume ID is invalid.",
      });
    }

    const resume =
      await Resume.findOne({
        _id: id,
        userId:
          req.userId,
      });

    if (!resume) {
      return res.status(404).json({
        success: false,
        code:
          "RESUME_NOT_FOUND",
        message:
          "Resume not found.",
      });
    }

    /*
      PDF generation is currently handled by the frontend.
      We intentionally do not create a fake PDF URL here.
    */

    return res.json({
      success: true,

      resumeId:
        String(
          resume._id
        ),

      pdfUrl:
        resume.pdfUrl ||
        null,

      message:
        "Use frontend PDF generation.",
    });
  } catch (error) {
    return handleMongoError(
      res,
      error
    );
  }
}

/* ============================================================
   POST /api/resumes/:id/ats-check
   ============================================================ */

async function atsCheck(req, res) {
  try {
    if (!requireUser(req, res)) {
      return;
    }

    const {
      id,
    } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        code:
          "INVALID_RESUME_ID",
        message:
          "The resume ID is invalid.",
      });
    }

    const resume =
      await Resume.findOne({
        _id: id,
        userId:
          req.userId,
      }).lean();

    if (!resume) {
      return res.status(404).json({
        success: false,
        code:
          "RESUME_NOT_FOUND",
        message:
          "Resume not found.",
      });
    }

    const data =
      resume.data || {};

    const issues = [];
    const suggestions = [];

    if (
      !data.summary ||
      typeof data.summary !==
        "string" ||
      data.summary.trim()
        .length < 50
    ) {
      issues.push(
        "Professional summary is missing or too short"
      );

      suggestions.push(
        "Add a 3-4 sentence professional summary at the top"
      );
    }

    if (
      !Array.isArray(
        data.skills
      ) ||
      data.skills.length < 5
    ) {
      issues.push(
        "Too few skills listed"
      );

      suggestions.push(
        "Add 10-15 relevant technical and soft skills"
      );
    }

    if (
      !Array.isArray(
        data.experience
      ) ||
      data.experience.length === 0
    ) {
      issues.push(
        "No work experience found"
      );

      suggestions.push(
        "Add at least one work experience with bullet points"
      );
    }

    if (
      !safeString(
        data.email
      )
    ) {
      issues.push(
        "Email address is missing"
      );

      suggestions.push(
        "Add your professional email address"
      );
    }

    if (
      !safeString(
        data.phone
      )
    ) {
      issues.push(
        "Phone number is missing"
      );

      suggestions.push(
        "Add your contact phone number"
      );
    }

    /*
      Some generated/imported resumes store contact
      information inside a contact object.
    */

    if (
      !safeString(
        data.email
      ) &&
      safeString(
        data?.contact?.email
      )
    ) {
      const email =
        safeString(
          data.contact.email
        );

      const index =
        issues.indexOf(
          "Email address is missing"
        );

      if (index !== -1) {
        issues.splice(
          index,
          1
        );
      }

      const suggestionIndex =
        suggestions.indexOf(
          "Add your professional email address"
        );

      if (
        suggestionIndex !==
        -1
      ) {
        suggestions.splice(
          suggestionIndex,
          1
        );
      }

      data.email =
        email;
    }

    if (
      !safeString(
        data.phone
      ) &&
      safeString(
        data?.contact?.phone
      )
    ) {
      const phone =
        safeString(
          data.contact.phone
        );

      const index =
        issues.indexOf(
          "Phone number is missing"
        );

      if (index !== -1) {
        issues.splice(
          index,
          1
        );
      }

      const suggestionIndex =
        suggestions.indexOf(
          "Add your contact phone number"
        );

      if (
        suggestionIndex !==
        -1
      ) {
        suggestions.splice(
          suggestionIndex,
          1
        );
      }

      data.phone =
        phone;
    }

    const score =
      Math.max(
        30,
        100 -
          issues.length *
            15
      );

    const keywords =
      Array.isArray(
        data.skills
      )
        ? data.skills.slice(
            0,
            10
          )
        : [];

    return res.json({
      success: true,

      resumeId:
        String(
          resume._id
        ),

      result: {
        score,
        issues,
        suggestions,
        keywords,
      },
    });
  } catch (error) {
    return handleMongoError(
      res,
      error
    );
  }
}

/* ============================================================
   EXPORT
   ============================================================ */

module.exports = {
  list,
  create,
  getOne,
  update,
  remove,
  aiPopulate,
  generatePdfHandler,
  autoGenerate,
  atsCheck,
};
