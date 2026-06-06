const mongoose = require('mongoose');

const slideSchema = new mongoose.Schema({
  index: Number,
  title: String,
  bullets: [String],
  speakerNotes: String,
  imageQuery: String,
  imageUrl: String,
  type: {
    type: String,
    enum: ['intro', 'content', 'example', 'activity', 'summary'],
    default: 'content'
  }
}, { _id: false });

const lessonPlanSchema = new mongoose.Schema({
  learningObjectives: [String],
  priorKnowledge: String,
  hook: String,
  teachingActivities: [String],
  studentActivities: [String],
  assessment: String,
  resources: [String],
  homework: String,
  durationMap: [{ phase: String, minutes: Number }]
}, { _id: false });

const generationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  board: { type: String, required: true },
  grade: { type: String, required: true },
  subject: { type: String, required: true },
  topic: { type: String, required: true },
  subTopics: [String],
  slideCount: { type: Number, default: 15 },
  classDuration: { type: Number, default: 45 },
  imagePreference: {
    type: String,
    enum: ['none', 'ai', 'textbook', 'both'],
    default: 'ai'
  },
  difficultyLevel: {
    type: String,
    enum: ['basic', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  slides: [slideSchema],
  lessonPlan: lessonPlanSchema,
  status: {
    type: String,
    enum: ['pending', 'generating', 'completed', 'failed'],
    default: 'pending'
  },
  errorMessage: String,
  uploadedFiles: [{ name: String, path: String, type: String }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Generation', generationSchema);
