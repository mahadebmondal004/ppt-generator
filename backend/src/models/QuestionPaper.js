const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionNumber: Number,
  text: String,
  marks: Number,
  type: {
    type: String,
    enum: ['mcq', 'short', 'long'],
    default: 'short'
  }
}, { _id: false });

const answerKeySchema = new mongoose.Schema({
  questionNumber: Number,
  modelAnswer: String,
  rubrics: [String]
}, { _id: false });

const questionPaperSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  board: { type: String, required: true },
  grade: { type: String, required: true },
  subject: { type: String, required: true },
  topic: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  questionsCount: { type: Number, default: 5 },
  totalMarks: { type: Number, default: 25 },
  questions: [questionSchema],
  answerKey: [answerKeySchema],
  status: {
    type: String,
    enum: ['pending', 'generating', 'completed', 'failed'],
    default: 'completed'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('QuestionPaper', questionPaperSchema);
