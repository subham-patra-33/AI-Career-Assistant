const mongoose = require('mongoose');

const interviewSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    mode: {
      type: String,
      enum: ['ai', 'question-bank'],
      required: true,
      default: 'question-bank',
      index: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    interviewType: {
      type: String,
      default: 'Technical',
    },
    difficulty: {
      type: String,
      default: 'Medium',
    },
    questionCount: {
      type: Number,
      default: 5,
    },
    questions: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'InterviewQuestion',
          required: false,
        },
        question: { type: String, required: true },
        category: { type: String, default: 'General' },
        difficulty: { type: String, default: 'Medium' },
        answer: { type: String, default: '' },
        score: { type: Number, default: 0 },
        feedback: { type: String, default: '' },
        strengths: { type: [String], default: [] },
        improvements: { type: [String], default: [] },
        evaluationProvider: { type: String, default: 'local' },
      },
    ],
    score: {
      type: Number,
      default: 0,
    },
    feedback: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

interviewSessionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('InterviewSession', interviewSessionSchema);
