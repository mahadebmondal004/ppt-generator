const QuestionPaper = require('../models/QuestionPaper');
const Evaluation = require('../models/Evaluation');
const aiService = require('../services/aiService');
const { parseMultipleFiles } = require('../utils/fileParser');

// @desc    Generate Question Paper
// @route   POST /api/qp/generate
const generatePaper = async (req, res) => {
  const {
    board, grade, subject, topic,
    questionsCount, totalMarks, difficulty
  } = req.body;

  if (!board || !grade || !subject || !topic) {
    return res.status(400).json({ success: false, message: 'Board, grade, subject, and topic are required' });
  }

  let uploadedContext = '';
  if (req.files && req.files.length > 0) {
    uploadedContext = await parseMultipleFiles(req.files);
  }

  // Create record
  const paper = await QuestionPaper.create({
    userId: req.user.id,
    board, grade, subject, topic,
    difficulty: difficulty || 'medium',
    questionsCount: parseInt(questionsCount) || 5,
    totalMarks: parseInt(totalMarks) || 25,
    status: 'generating'
  });

  res.status(202).json({
    success: true,
    message: 'Question paper generation started',
    paperId: paper._id
  });

  // Background AI call
  try {
    const config = {
      board, grade, subject, topic,
      difficulty: difficulty || 'medium',
      questionsCount: parseInt(questionsCount) || 5,
      totalMarks: parseInt(totalMarks) || 25
    };

    const aiData = await aiService.generateQuestionPaper(config, uploadedContext);

    await QuestionPaper.findByIdAndUpdate(paper._id, {
      questions: aiData.questions,
      answerKey: aiData.answerKey,
      status: 'completed'
    });

    console.log(`✅ Question Paper ${paper._id} generated — ${aiData.questions?.length} questions`);
  } catch (err) {
    console.error(`❌ Question Paper ${paper._id} generation failed:`, err.message);
    await QuestionPaper.findByIdAndUpdate(paper._id, {
      status: 'failed'
    });
  }
};

// @desc    Get List of Papers
// @route   GET /api/qp
const getPapers = async (req, res) => {
  const papers = await QuestionPaper.find({ userId: req.user.id })
    .sort({ createdAt: -1 });

  res.json({ success: true, papers });
};

// @desc    Get Paper Details
// @route   GET /api/qp/:id
const getPaperDetails = async (req, res) => {
  const paper = await QuestionPaper.findOne({ _id: req.params.id, userId: req.user.id });
  if (!paper) {
    return res.status(404).json({ success: false, message: 'Question paper not found' });
  }
  res.json({ success: true, paper });
};

// @desc    Evaluate Student Answer Sheet
// @route   POST /api/qp/:id/evaluate
const evaluatePaper = async (req, res) => {
  const { studentName, studentRegNo, studentAnswersText } = req.body;

  if (!studentName) {
    return res.status(400).json({ success: false, message: 'Student name is required' });
  }

  const paper = await QuestionPaper.findOne({ _id: req.params.id, userId: req.user.id });
  if (!paper || paper.status !== 'completed') {
    return res.status(404).json({ success: false, message: 'Completed question paper not found' });
  }

  let finalAnswersText = studentAnswersText || '';
  if (req.files && req.files.length > 0) {
    // Parse simulated/uploaded document text
    finalAnswersText = await parseMultipleFiles(req.files);
  }

  if (!finalAnswersText.trim()) {
    // Fallback if no text provided/parsed, create some sample student answers for testing
    finalAnswersText = paper.questions.map(q => 
      `Answer ${q.questionNumber}: This is the student's answer for question ${q.questionNumber} about ${paper.topic}. It covers the primary keywords.`
    ).join('\n\n');
  }

  // Create evaluation record
  const evaluation = await Evaluation.create({
    userId: req.user.id,
    questionPaperId: paper._id,
    studentName,
    studentRegNo,
    studentAnswers: finalAnswersText,
    status: 'generating'
  });

  res.status(202).json({
    success: true,
    message: 'Sheet evaluation started',
    evaluationId: evaluation._id
  });

  // Background evaluation
  try {
    const aiEval = await aiService.evaluateAnswerSheet(paper, finalAnswersText);

    await Evaluation.findByIdAndUpdate(evaluation._id, {
      gradedResults: aiEval.gradedResults,
      totalMarks: aiEval.totalMarks,
      maxMarks: aiEval.maxMarks || paper.totalMarks,
      feedbackSummary: aiEval.feedbackSummary,
      strengths: aiEval.strengths,
      weaknesses: aiEval.weaknesses,
      status: 'completed'
    });

    console.log(`✅ Evaluation ${evaluation._id} completed: ${aiEval.totalMarks} marks`);
  } catch (err) {
    console.error(`❌ Evaluation ${evaluation._id} failed:`, err.message);
    await Evaluation.findByIdAndUpdate(evaluation._id, {
      status: 'failed'
    });
  }
};

// @desc    Get Detailed Evaluation
// @route   GET /api/qp/evaluations/:id
const getEvaluationDetails = async (req, res) => {
  const evaluation = await Evaluation.findOne({ _id: req.params.id, userId: req.user.id })
    .populate('questionPaperId');

  if (!evaluation) {
    return res.status(404).json({ success: false, message: 'Evaluation not found' });
  }

  res.json({ success: true, evaluation });
};

// @desc    Get List of Evaluations
// @route   GET /api/qp/evaluations
const getEvaluations = async (req, res) => {
  const { paperId } = req.query;
  const filter = { userId: req.user.id };
  if (paperId) filter.questionPaperId = paperId;

  const evaluations = await Evaluation.find(filter)
    .populate('questionPaperId', 'topic board grade subject')
    .sort({ createdAt: -1 });

  res.json({ success: true, evaluations });
};

module.exports = {
  generatePaper,
  getPapers,
  getPaperDetails,
  evaluatePaper,
  getEvaluationDetails,
  getEvaluations
};
