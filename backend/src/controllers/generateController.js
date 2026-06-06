const Generation = require('../models/Generation');
const aiService = require('../services/aiService');
const { buildPPT } = require('../services/pptService');
const { buildLessonPlanDoc } = require('../services/lessonPlanService');
const { parseMultipleFiles } = require('../utils/fileParser');
const archiver = require('archiver');

// @desc    Generate PPT + Lesson Plan
// @route   POST /api/generate
const generate = async (req, res) => {
  const {
    board, grade, subject, topic, subTopics,
    slideCount, classDuration, imagePreference,
    difficultyLevel
  } = req.body;

  if (!board || !grade || !subject || !topic) {
    return res.status(400).json({ success: false, message: 'Board, grade, subject, and topic are required' });
  }

  // Parse uploaded files
  let uploadedContext = '';
  const uploadedFiles = [];
  if (req.files && req.files.length > 0) {
    uploadedContext = await parseMultipleFiles(req.files);
    req.files.forEach(f => uploadedFiles.push({ name: f.originalname, path: f.path, type: f.mimetype }));
  }

  // Create a generation record
  const generation = await Generation.create({
    userId: req.user.id,
    board, grade, subject, topic,
    subTopics: Array.isArray(subTopics) ? subTopics : (subTopics ? [subTopics] : []),
    slideCount: parseInt(slideCount) || 15,
    classDuration: parseInt(classDuration) || 45,
    imagePreference: imagePreference || 'ai',
    difficultyLevel: difficultyLevel || 'intermediate',
    uploadedFiles,
    status: 'generating'
  });

  // Run generation asynchronously and update
  const config = {
    board, grade, subject, topic,
    subTopics: Array.isArray(subTopics) ? subTopics : (subTopics ? [subTopics] : []),
    slideCount: parseInt(slideCount) || 15,
    classDuration: parseInt(classDuration) || 45,
    imagePreference: imagePreference || 'ai',
    difficultyLevel: difficultyLevel || 'intermediate'
  };

  // Send back the generation ID immediately
  res.status(202).json({
    success: true,
    message: 'Generation started',
    generationId: generation._id
  });

  // Background generation
  try {
    const [slides, lessonPlan] = await Promise.all([
      aiService.generateSlides(config, uploadedContext, generation.uploadedFiles),
      aiService.generateLessonPlan(config, uploadedContext, generation.uploadedFiles)
    ]);

    // Generate DALL-E images for the slides
    const slidesWithImages = await aiService.generateImagesForSlides(slides, generation._id, config.imagePreference);

    await Generation.findByIdAndUpdate(generation._id, {
      slides: slidesWithImages,
      lessonPlan,
      status: 'completed'
    });

    console.log(`✅ Generation ${generation._id} completed — ${slidesWithImages.length} slides`);
  } catch (err) {
    console.error(`❌ Generation ${generation._id} failed:`, err.message);
    await Generation.findByIdAndUpdate(generation._id, {
      status: 'failed',
      errorMessage: err.message
    });
  }
};

// @desc    Poll generation status
// @route   GET /api/generate/:id/status
const getStatus = async (req, res) => {
  const generation = await Generation.findOne({ _id: req.params.id, userId: req.user.id });
  if (!generation) {
    return res.status(404).json({ success: false, message: 'Generation not found' });
  }

  res.json({
    success: true,
    status: generation.status,
    slideCount: generation.slides?.length || 0,
    generationId: generation._id
  });
};

// @desc    Get full generation data (for preview)
// @route   GET /api/generate/:id
const getGeneration = async (req, res) => {
  const generation = await Generation.findOne({ _id: req.params.id, userId: req.user.id });
  if (!generation) {
    return res.status(404).json({ success: false, message: 'Generation not found' });
  }

  res.json({ success: true, generation });
};

// @desc    Download PPT file
// @route   GET /api/generate/:id/download/ppt
const downloadPPT = async (req, res) => {
  const generation = await Generation.findOne({ _id: req.params.id, userId: req.user.id });
  if (!generation || generation.status !== 'completed') {
    return res.status(404).json({ success: false, message: 'Generation not found or not completed' });
  }

  const pptBuffer = await buildPPT(generation, generation.slides);
  const fileName = `${generation.board}_${generation.grade}_${generation.subject}_${generation.topic}_PPT.pptx`
    .replace(/[^a-zA-Z0-9_.-]/g, '_');

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.send(pptBuffer);
};

// @desc    Download Lesson Plan (.docx)
// @route   GET /api/generate/:id/download/lesson
const downloadLessonPlan = async (req, res) => {
  const generation = await Generation.findOne({ _id: req.params.id, userId: req.user.id });
  if (!generation || generation.status !== 'completed') {
    return res.status(404).json({ success: false, message: 'Generation not found or not completed' });
  }

  const docBuffer = await buildLessonPlanDoc(generation, generation.lessonPlan);
  const fileName = `${generation.board}_${generation.grade}_${generation.subject}_${generation.topic}_LessonPlan.docx`
    .replace(/[^a-zA-Z0-9_.-]/g, '_');

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.send(docBuffer);
};

// @desc    Download both as ZIP
// @route   GET /api/generate/:id/download/zip
const downloadZip = async (req, res) => {
  const generation = await Generation.findOne({ _id: req.params.id, userId: req.user.id });
  if (!generation || generation.status !== 'completed') {
    return res.status(404).json({ success: false, message: 'Generation not found or not completed' });
  }

  const baseName = `${generation.board}_${generation.grade}_${generation.subject}_${generation.topic}`
    .replace(/[^a-zA-Z0-9_.-]/g, '_');

  const [pptBuffer, docBuffer] = await Promise.all([
    buildPPT(generation, generation.slides),
    buildLessonPlanDoc(generation, generation.lessonPlan)
  ]);

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${baseName}.zip"`);

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(res);
  archive.append(pptBuffer, { name: `${baseName}_PPT.pptx` });
  archive.append(docBuffer, { name: `${baseName}_LessonPlan.docx` });
  await archive.finalize();
};

// @desc    Regenerate all slides
// @route   POST /api/generate/:id/regenerate
const regenerateAll = async (req, res) => {
  const { additionalInstructions, difficultyLevel, style } = req.body;

  const generation = await Generation.findOne({ _id: req.params.id, userId: req.user.id });
  if (!generation) {
    return res.status(404).json({ success: false, message: 'Generation not found' });
  }

  const config = {
    board: generation.board,
    grade: generation.grade,
    subject: generation.subject,
    topic: generation.topic,
    subTopics: generation.subTopics,
    slideCount: generation.slideCount,
    classDuration: generation.classDuration,
    imagePreference: generation.imagePreference,
    difficultyLevel: difficultyLevel || generation.difficultyLevel,
    additionalInstructions,
    style
  };

  await Generation.findByIdAndUpdate(generation._id, { status: 'generating' });

  res.status(202).json({ success: true, message: 'Regeneration started', generationId: generation._id });

  try {
    const slides = await aiService.generateSlides(config);
    
    // Generate DALL-E images for the regenerated slides
    const slidesWithImages = await aiService.generateImagesForSlides(slides, generation._id, config.imagePreference);
    
    await Generation.findByIdAndUpdate(generation._id, { slides: slidesWithImages, status: 'completed' });
    console.log(`✅ Regeneration ${generation._id} completed`);
  } catch (err) {
    console.error(`❌ Regeneration failed:`, err.message);
    await Generation.findByIdAndUpdate(generation._id, { status: 'failed', errorMessage: err.message });
  }
};

// @desc    Regenerate a single slide
// @route   POST /api/generate/:id/slides/:slideIndex/regenerate
const regenerateSingleSlide = async (req, res) => {
  const { slideIndex } = req.params;
  const { instructions, slideType } = req.body;

  const generation = await Generation.findOne({ _id: req.params.id, userId: req.user.id });
  if (!generation || generation.status !== 'completed') {
    return res.status(404).json({ success: false, message: 'Generation not found or not completed' });
  }

  const config = {
    board: generation.board,
    grade: generation.grade,
    subject: generation.subject,
    topic: generation.topic,
    subTopics: generation.subTopics,
    slideCount: 1,
    classDuration: generation.classDuration,
    imagePreference: generation.imagePreference,
    difficultyLevel: generation.difficultyLevel,
    additionalInstructions: instructions || ''
  };

  const newSlide = await aiService.regenerateSlide(config, parseInt(slideIndex), instructions);
  if (slideType) newSlide.type = slideType;
  newSlide.index = parseInt(slideIndex);

  // If slide wants image, generate a new image for this single slide too!
  if (generation.imagePreference !== 'none' && newSlide.type !== 'intro' && newSlide.type !== 'summary' && newSlide.imageQuery && newSlide.imageQuery.trim() !== '') {
    try {
      const slidesWithImg = await aiService.generateImagesForSlides([newSlide], generation._id, generation.imagePreference);
      if (slidesWithImg && slidesWithImg[0]) {
        newSlide.imageUrl = slidesWithImg[0].imageUrl;
      }
    } catch (err) {
      console.error('Single slide image regeneration failed:', err.message);
    }
  }

  // Replace the slide in the array
  const updatedSlides = [...generation.slides];
  updatedSlides[parseInt(slideIndex)] = newSlide;

  await Generation.findByIdAndUpdate(generation._id, { slides: updatedSlides });

  res.json({ success: true, slide: newSlide });
};

module.exports = {
  generate,
  getStatus,
  getGeneration,
  downloadPPT,
  downloadLessonPlan,
  downloadZip,
  regenerateAll,
  regenerateSingleSlide
};
