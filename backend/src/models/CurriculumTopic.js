const mongoose = require('mongoose');

const subTopicSchema = new mongoose.Schema({
  name: String,
  description: String
}, { _id: false });

const topicSchema = new mongoose.Schema({
  name: String,
  description: String,
  subTopics: [subTopicSchema]
}, { _id: false });

const curriculumTopicSchema = new mongoose.Schema({
  board: {
    type: String,
    required: true,
    enum: ['CBSE', 'IGCSE']
  },
  grade: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  topics: [topicSchema]
}, {
  timestamps: true
});

curriculumTopicSchema.index({ board: 1, grade: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model('CurriculumTopic', curriculumTopicSchema);
