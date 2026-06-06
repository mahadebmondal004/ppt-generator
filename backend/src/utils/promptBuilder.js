const buildSlideGenerationPrompt = (config, uploadedContext = '') => {
  const {
    board, grade, subject, topic, subTopics,
    slideCount, classDuration, imagePreference,
    difficultyLevel, additionalInstructions, style
  } = config;

  const subTopicsList = subTopics && subTopics.length > 0
    ? subTopics.join(', ')
    : 'All sub-topics';

  let imageInstruction = '';
  if (imagePreference === 'none') {
    imageInstruction = 'Do NOT include image queries — set imageQuery to "" for all slides.';
  } else if (imagePreference === 'textbook') {
    imageInstruction = `For each slide, decide if it needs/benefits from a visual layout. Only provide a descriptive imageQuery (8-15 words) if it really needs one (e.g. to explain a diagram, chart, map, or scientific concept). If no image is needed, set imageQuery to "".
    When providing a query, make it highly focused on textbook diagrams, schematics, charts, maps, equations, or scientific illustrations. Do NOT suggest photographs. Include visual style hints like "textbook diagram", "scientific schematic", "educational chart", etc.
    Example: "structure of human heart diagram showing ventricles and auricles, textbook style illustration"
    Example: "periodic table elements trends chart showing ionization energy direction, educational vector schematic"`;
  } else if (imagePreference === 'both') {
    imageInstruction = `For each slide, decide if it needs/benefits from a visual layout. Only provide a descriptive imageQuery (8-15 words) if it really needs one (e.g. for a diagram, schematic, map, or classroom activity photo). If no image is needed, set imageQuery to "".
    When providing a query, blend educational stock photos and textbook diagrams where appropriate.
    Example: "plant photosynthesis cell diagram showing chloroplasts, bright educational illustration"
    Example: "students working together in biology laboratory experiment, modern classroom setting, stock photo"`;
  } else {
    // Default to 'ai'
    imageInstruction = `For each slide, decide if it needs/benefits from a visual layout. Only provide a descriptive imageQuery (8-15 words) if it really needs one (e.g. for a visual reference, classroom setting, or object photograph). If no image is needed, set imageQuery to "".
    When providing a query, represent a relevant educational stock photo or realistic scene.
    Example: "students doing physics experiment with pendulum, classroom setting, educational stock photo"
    Example: "historic ancient ruins of Rome Colosseum under bright blue sky, travel photograph"`;
  }

  const difficultyGuide = {
    basic: 'Use very simple language. Short sentences. Minimal jargon. Suitable for beginners.',
    intermediate: 'Use clear, grade-appropriate language. Some technical terms with brief explanations.',
    advanced: 'Use precise academic language. Include technical details and complex concepts.'
  }[difficultyLevel || 'intermediate'];

  const styleGuide = style ? `Style preference: ${style}` : '';
  const extraInstructions = additionalInstructions ? `Additional teacher instructions: ${additionalInstructions}` : '';
  const uploadedContextSection = uploadedContext
    ? `\n\nTEACHER-PROVIDED REFERENCE MATERIAL (prioritize this content):\n${uploadedContext}\n`
    : '';

  return `You are an expert educational content creator for ${board} curriculum teachers. 
Generate a complete, professional PowerPoint presentation for a classroom lesson.

CONFIGURATION:
- Board: ${board}
- Grade: ${grade}  
- Subject: ${subject}
- Topic: ${topic}
- Sub-topics to cover: ${subTopicsList}
- Total Slides: ${slideCount}
- Class Duration: ${classDuration} minutes
- Difficulty Level: ${difficultyLevel || 'intermediate'}
- Image Preference: ${imagePreference}

DIFFICULTY GUIDELINE: ${difficultyGuide}
${styleGuide}
${extraInstructions}
${uploadedContextSection}

SLIDE GENERATION RULES:
1. Generate EXACTLY ${slideCount} slides
2. Follow this pedagogical progression:
   - Slide 1: Title/Introduction slide (type: "intro")
   - Slides 2-3: Learning objectives and prerequisites (type: "content")  
   - Middle slides: Core content with examples (type: "content" and "example")
   - 2 slides before last: Activity/practice (type: "activity")
   - Last slide: Summary and key takeaways (type: "summary")
3. Each slide must have:
   - A clear, specific title (max 8 words)
   - 4-6 bullet points (max 12 words each) — concise, classroom-friendly
   - speakerNotes: 2-3 sentences of teaching guidance for the teacher
   - type: one of ["intro", "content", "example", "activity", "summary"]
   ${imageInstruction}
4. Content must be factually accurate for ${board} ${grade} ${subject}
5. Key terms and formulas must appear naturally in bullet points
6. Calibrate depth to fill exactly ${classDuration} minutes of teaching

RESPOND WITH VALID JSON ONLY — no markdown, no explanation, just the JSON object:
{
  "slides": [
    {
      "index": 0,
      "title": "slide title here",
      "bullets": ["bullet 1", "bullet 2", "bullet 3", "bullet 4"],
      "speakerNotes": "Teacher guidance notes here.",
      "type": "intro",
      "imageQuery": "topic relevant image query"
    }
  ]
}`;
};

const buildLessonPlanPrompt = (config, uploadedContext = '') => {
  const { board, grade, subject, topic, subTopics, slideCount, classDuration, difficultyLevel } = config;
  const subTopicsList = subTopics && subTopics.length > 0 ? subTopics.join(', ') : 'All sub-topics';
  const uploadedContextSection = uploadedContext
    ? `\n\nTEACHER-PROVIDED REFERENCE MATERIAL:\n${uploadedContext}\n`
    : '';

  return `You are an expert educational curriculum designer for ${board} schools.
Generate a complete, detailed lesson plan for a teacher to use in class.

LESSON CONFIGURATION:
- Board: ${board}
- Grade: ${grade}
- Subject: ${subject}  
- Topic: ${topic}
- Sub-topics: ${subTopicsList}
- Class Duration: ${classDuration} minutes
- Number of Slides: ${slideCount}
- Difficulty: ${difficultyLevel || 'intermediate'}
${uploadedContextSection}

Generate a professional lesson plan exactly as a real ${board} teacher would write it.

RESPOND WITH VALID JSON ONLY:
{
  "learningObjectives": ["By the end of this lesson, students will be able to...", "..."],
  "priorKnowledge": "What students should already know before this lesson...",
  "hook": "Engaging opening question or activity to capture student attention (2-3 sentences)...",
  "teachingActivities": [
    "0-5 min: Introduction - ...",
    "5-15 min: Core concept explanation - ...",
    "15-30 min: Examples and demonstration - ...",
    "30-40 min: Student practice - ...",
    "40-${classDuration} min: Summary and Q&A - ..."
  ],
  "studentActivities": ["Activity 1...", "Activity 2...", "Group discussion..."],
  "assessment": "How the teacher will check for understanding: Q&A, exit tickets, or formative quiz...",
  "resources": ["Textbook Chapter X", "Whiteboard", "Printed worksheet", "..."],
  "homework": "Optional homework or extension task for students...",
  "durationMap": [
    { "phase": "Introduction/Hook", "minutes": 5 },
    { "phase": "Prior Knowledge Check", "minutes": 5 },
    { "phase": "Core Content Delivery", "minutes": 20 },
    { "phase": "Examples & Practice", "minutes": 10 },
    { "phase": "Summary & Assessment", "minutes": 5 }
  ]
}`;
};

const buildQuestionPaperPrompt = (config, uploadedContext = '') => {
  const { board, grade, subject, topic, difficulty, questionsCount, totalMarks } = config;
  const uploadedContextSection = uploadedContext
    ? `\n\nTEACHER-PROVIDED REFERENCE MATERIAL (align questions with this):\n${uploadedContext}\n`
    : '';

  return `You are an expert curriculum examiner for ${board}. 
Generate a complete, professional Question Paper and Answer Key/Rubrics based on the following details:

CONFIGURATION:
- Board: ${board}
- Grade: ${grade}
- Subject: ${subject}
- Topic: ${topic}
- Difficulty: ${difficulty || 'medium'}
- Questions Count: ${questionsCount || 5}
- Total Marks: ${totalMarks || 25}
${uploadedContextSection}

RULES:
1. Generate EXACTLY ${questionsCount || 5} questions.
2. Distribute the total marks (${totalMarks || 25}) evenly or appropriately across questions.
3. For each question, decide the type: "mcq" (multiple choice), "short" (short answer), or "long" (long answer/essay).
4. For each question, provide a detailed Model Answer and specific grading rubrics (bullet points describing what elements must be present to score marks).
5. Ensure formatting is perfect for ${board} curriculum standards.

RESPOND WITH VALID JSON ONLY — no markdown, no explanation:
{
  "questions": [
    {
      "questionNumber": 1,
      "text": "Question text here?",
      "marks": 5,
      "type": "short"
    }
  ],
  "answerKey": [
    {
      "questionNumber": 1,
      "modelAnswer": "Model answer goes here.",
      "rubrics": ["Rubric point 1", "Rubric point 2"]
    }
  ]
}`;
};

const buildEvaluationPrompt = (paper, studentAnswersText) => {
  const formattedQuestions = paper.questions.map(q => {
    const key = paper.answerKey.find(ak => ak.questionNumber === q.questionNumber) || {};
    return `Question ${q.questionNumber} (${q.marks} Marks): ${q.text}
Model Answer: ${key.modelAnswer}
Rubrics:
${key.rubrics?.map(r => `- ${r}`).join('\n') || ''}
`;
  }).join('\n---\n');

  return `You are an expert examiner for grading handwritten student papers. 
Grade the following student answers against the provided question paper, model answers, and rubrics.

QUESTIONS & SCHEME:
${formattedQuestions}

STUDENT'S RAW ANSWERS:
${studentAnswersText}

GRADING RULES:
1. Grade every question. Assign marks fairly. The marks awarded for a question cannot exceed its maximum marks.
2. For each question, compare the student's answer to the model answer and rubrics. State clearly which rubrics were matched or missed.
3. Provide constructive, encouraging feedback for each question.
4. Calculate the overall total marks awarded.
5. Provide a summary of strengths, weaknesses, and general feedback.

RESPOND WITH VALID JSON ONLY:
{
  "gradedResults": [
    {
      "questionNumber": 1,
      "marksAwarded": 4,
      "maxMarks": 5,
      "feedback": "The student explained the concept well and matched key rubrics, but missed mentioning the unit of measurement.",
      "rubricMatched": true
    }
  ],
  "totalMarks": 18,
  "maxMarks": 25,
  "feedbackSummary": "Overall feedback summary here...",
  "strengths": ["Strengths point 1", "Strengths point 2"],
  "weaknesses": ["Weaknesses point 1", "Weaknesses point 2"]
}`;
};

module.exports = { 
  buildSlideGenerationPrompt, 
  buildLessonPlanPrompt,
  buildQuestionPaperPrompt,
  buildEvaluationPrompt
};
