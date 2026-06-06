const express = require('express');
const router = express.Router();
const { getBoards, getGrades, getSubjects, getTopics } = require('../controllers/curriculumController');

router.get('/boards', getBoards);
router.get('/grades', getGrades);
router.get('/subjects', getSubjects);
router.get('/topics', getTopics);

module.exports = router;
