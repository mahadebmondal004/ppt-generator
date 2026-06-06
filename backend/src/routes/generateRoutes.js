const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  generate,
  getStatus,
  getGeneration,
  downloadPPT,
  downloadLessonPlan,
  downloadZip,
  regenerateAll,
  regenerateSingleSlide
} = require('../controllers/generateController');

router.post('/', protect, upload.array('files', 5), generate);
router.get('/:id/status', protect, getStatus);
router.get('/:id', protect, getGeneration);
router.get('/:id/download/ppt', protect, downloadPPT);
router.get('/:id/download/lesson', protect, downloadLessonPlan);
router.get('/:id/download/zip', protect, downloadZip);
router.post('/:id/regenerate', protect, regenerateAll);
router.post('/:id/slides/:slideIndex/regenerate', protect, regenerateSingleSlide);

module.exports = router;
