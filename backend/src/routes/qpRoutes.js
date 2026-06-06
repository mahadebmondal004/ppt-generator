const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  generatePaper,
  getPapers,
  getPaperDetails,
  evaluatePaper,
  getEvaluationDetails,
  getEvaluations
} = require('../controllers/qpController');

// All endpoints require auth
router.use(protect);

router.post('/generate', upload.array('files', 5), generatePaper);
router.get('/', getPapers);
router.get('/evaluations', getEvaluations);
router.get('/evaluations/:id', getEvaluationDetails);
router.get('/:id', getPaperDetails);
router.post('/:id/evaluate', upload.array('files', 5), evaluatePaper);

module.exports = router;
