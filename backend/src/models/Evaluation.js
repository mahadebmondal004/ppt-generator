const mongoose = require('mongoose');

const gradedResultSchema = new mongoose.Schema({
  questionNumber: Number,
  marksAwarded: Number,
  maxMarks: Number,
  feedback: String,
  rubricMatched: Boolean
}, { _id: false });

const evaluationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questionPaperId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuestionPaper',
    required: true
  },
  studentName: { type: String, required: true },
  studentRegNo: { type: String },
  studentAnswers: { type: String }, // Plain text of simulated student answers
  gradedResults: [gradedResultSchema],
  totalMarks: { type: Number, default: 0 },
  maxMarks: { type: Number, default: 0 },
  feedbackSummary: { type: String },
  strengths: [String],
  weaknesses: [String],
  status: {
    type: String,
    enum: ['pending', 'generating', 'completed', 'failed'],
    default: 'completed'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Evaluation', evaluationSchema);
