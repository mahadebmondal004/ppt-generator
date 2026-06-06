const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getHistory, getHistoryItem, deleteHistoryItem } = require('../controllers/historyController');

router.get('/', protect, getHistory);
router.get('/:id', protect, getHistoryItem);
router.delete('/:id', protect, deleteHistoryItem);

module.exports = router;
