const Generation = require('../models/Generation');

// @desc    Get all generations for current user
// @route   GET /api/history
const getHistory = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const total = await Generation.countDocuments({ userId: req.user.id });
  const generations = await Generation.find({ userId: req.user.id })
    .select('-slides -lessonPlan') // Exclude heavy fields for list
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    generations,
    pagination: { total, page, pages: Math.ceil(total / limit) }
  });
};

// @desc    Get single generation
// @route   GET /api/history/:id
const getHistoryItem = async (req, res) => {
  const generation = await Generation.findOne({ _id: req.params.id, userId: req.user.id });
  if (!generation) {
    return res.status(404).json({ success: false, message: 'Generation not found' });
  }
  res.json({ success: true, generation });
};

// @desc    Delete a generation
// @route   DELETE /api/history/:id
const deleteHistoryItem = async (req, res) => {
  const generation = await Generation.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!generation) {
    return res.status(404).json({ success: false, message: 'Generation not found' });
  }
  res.json({ success: true, message: 'Generation deleted' });
};

module.exports = { getHistory, getHistoryItem, deleteHistoryItem };
