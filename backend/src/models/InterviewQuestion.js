const mongoose = require('mongoose');

const interviewQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'Question is required'],
      trim: true,
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
    },
    difficulty: {
      type: String,
      required: [true, 'Difficulty is required'],
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium',
      index: true,
    },
    interviewType: {
      type: String,
      required: [true, 'Interview type is required'],
      enum: ['Technical', 'Behavioral', 'Mixed'],
      default: 'Technical',
      index: true,
    },
    expectedTopics: {
      type: [String],
      default: [],
    },
    keywords: {
      type: [String],
      default: [],
    },
    answerGuidance: {
      type: String,
      default: '',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound index for querying eligible questions
interviewQuestionSchema.index({ role: 1, category: 1, difficulty: 1, interviewType: 1, isActive: 1 });

module.exports = mongoose.model('InterviewQuestion', interviewQuestionSchema);
