const fs = require('fs');
const path = require('path');
const { buildSlideGenerationPrompt, buildLessonPlanPrompt, buildQuestionPaperPrompt, buildEvaluationPrompt } = require('../utils/promptBuilder');

// ─── PRIORITY LOGIC ─────────────────────────────────────────────────────────────
// 1. MOCK_AI=true  → always use mock (no real API calls)
// 2. OPENAI_API_KEY set → try OpenAI (gpt-4o-mini) first
// 3. If OpenAI fails → fallback to Gemini (GEMINI_API_KEY)
// 4. If both fail → fallback to mock

// ─── MOCK DATA GENERATOR ───────────────────────────────────────────────────────
const generateMockSlides = (config) => {
  const { topic, subTopics, slideCount } = config;
  const count = parseInt(slideCount) || 12;
  const slides = [];

  const types = ['intro', 'content', 'content', 'content', 'example', 'content', 'example', 'content', 'activity', 'content', 'activity', 'summary'];

  const subTopicsList = subTopics && subTopics.length > 0 ? subTopics : ['Key Concepts', 'Applications', 'Examples'];

  for (let i = 0; i < count; i++) {
    const type = types[i % types.length];
    let title, bullets, speakerNotes;

    if (i === 0) {
      title = topic;
      bullets = [
        `Welcome to today's lesson on ${topic}`,
        `We will explore ${subTopicsList.slice(0, 3).join(', ')}`,
        'Lesson objectives will be covered step-by-step',
        'Feel free to ask questions throughout',
        'Let\'s begin our learning journey!'
      ];
      speakerNotes = `Introduce yourself and the topic. Ask students what they already know about ${topic} to gauge prior knowledge.`;
    } else if (type === 'intro' || i === 1) {
      title = 'Learning Objectives';
      bullets = [
        `Understand the core principles of ${topic}`,
        `Apply concepts to solve real-world problems`,
        `Analyze examples related to ${subTopicsList[0] || topic}`,
        `Demonstrate understanding through activities`,
        `Summarize key takeaways by end of lesson`
      ];
      speakerNotes = 'Review learning objectives with students. Ask if anyone has questions about what will be covered.';
    } else if (type === 'summary' || i === count - 1) {
      title = 'Summary & Key Takeaways';
      bullets = [
        `Today we covered: ${topic}`,
        ...subTopicsList.slice(0, 3).map(st => `✓ ${st} — core concepts mastered`),
        'Practice problems will reinforce learning',
        'See homework for extension activities'
      ];
      speakerNotes = 'Recap the main points covered. Ask 2-3 students to share one thing they learned today.';
    } else if (type === 'activity') {
      title = `Class Activity: ${subTopicsList[(i % subTopicsList.length)] || topic}`;
      bullets = [
        'Work in pairs or small groups',
        'Apply the concepts learned to solve the problem',
        'Discuss your approach with your partner',
        'Share your solutions with the class',
        'Time allowed: 5-7 minutes'
      ];
      speakerNotes = 'Circulate the classroom. Provide hints if students are stuck. Ensure all groups participate.';
    } else if (type === 'example') {
      const stIdx = Math.floor(i / (count / subTopicsList.length)) % subTopicsList.length;
      title = `Example: ${subTopicsList[stIdx] || topic}`;
      bullets = [
        `Step 1: Identify what is given and what is required`,
        `Step 2: Apply the relevant formula or concept`,
        `Step 3: Solve step-by-step, showing all working`,
        `Step 4: Verify your answer makes sense`,
        `Step 5: Interpret the result in context`
      ];
      speakerNotes = 'Work through this example slowly on the board. Ask students to follow along and spot each step.';
    } else {
      const stIdx = Math.floor(i / (count / subTopicsList.length)) % subTopicsList.length;
      const subTopic = subTopicsList[stIdx] || topic;
      title = subTopic;
      bullets = [
        `${subTopic} is a fundamental concept in ${config.subject}`,
        `Definition: The systematic study of ${subTopic.toLowerCase()} and its properties`,
        `Key principle: Understanding ${subTopic.toLowerCase()} enables deeper analysis`,
        `Real-world application: Found in everyday phenomena around us`,
        `Important formula / rule: Applied consistently in problem-solving`,
        `Common misconception: Students often confuse this with related concepts`
      ];
      speakerNotes = `Explain ${subTopic} using the whiteboard. Draw a diagram or use an analogy students can relate to. Check for understanding before moving on.`;
    }

    slides.push({
      index: i,
      title,
      bullets: bullets.slice(0, 6),
      speakerNotes,
      type,
      imageQuery: `${config.subject} ${topic} ${subTopicsList[i % subTopicsList.length] || ''} ${type === 'activity' ? 'classroom activity students' : type === 'example' ? 'solved example diagram' : 'education concept'}`
    });
  }

  return slides;
};

const generateMockLessonPlan = (config) => {
  const { topic, subject, grade, board, classDuration, subTopics } = config;
  const duration = parseInt(classDuration) || 45;
  const subTopicsList = subTopics && subTopics.length > 0 ? subTopics : ['Core Concepts', 'Applications'];

  return {
    learningObjectives: [
      `By the end of this lesson, students will be able to define and explain the key concepts of ${topic}`,
      `Students will apply their understanding of ${subTopicsList[0] || topic} to solve structured problems`,
      `Students will analyze real-world examples related to ${topic} and draw meaningful conclusions`,
      `Students will demonstrate understanding by participating in class activities and discussions`
    ],
    priorKnowledge: `Students should have a foundational understanding of ${subject} concepts from previous grades. Familiarity with basic terminology related to ${topic} will be helpful. Prior exposure to ${subTopicsList[0] || 'related topics'} is assumed.`,
    hook: `Begin the lesson by asking: "Can you think of a place where you've seen ${topic} in your daily life?" Allow 2-3 students to share. This connects classroom learning to real-world experience and immediately engages curiosity.`,
    teachingActivities: [
      `0-5 min: Welcome and hook question — ask students about ${topic} in real life`,
      `5-10 min: Review prior knowledge — quick Q&A on prerequisite concepts`,
      `10-20 min: Direct instruction — introduce ${subTopicsList[0] || topic} with visual aids and board work`,
      `20-30 min: Worked examples — solve 2-3 examples step-by-step, thinking aloud`,
      subTopicsList[1] ? `30-${Math.min(duration - 10, 38)} min: Explore ${subTopicsList[1]} — explanation and diagram` : `30-${Math.min(duration - 10, 38)} min: Deeper dive with additional examples`,
      `${Math.min(duration - 8, 38)}-${duration - 3} min: Student activity — pair or group work on practice problems`,
      `${duration - 3}-${duration} min: Wrap-up, summary, and preview of next lesson`
    ],
    studentActivities: [
      `Complete 3 practice problems on ${topic} individually, then compare with a partner`,
      `Group discussion: "How would you explain ${subTopicsList[0] || topic} to a younger student?"`,
      `Mind-map activity: Create a concept map connecting ${topic} to other things you know`,
      `Exit ticket: Write one thing you learned and one question you still have`
    ],
    assessment: `Formative assessment throughout the lesson: teacher questions during direct instruction, observation during pair activity. Exit ticket at the end of class — students write one key learning and one remaining question. These are reviewed before the next lesson.`,
    resources: [
      `${board} ${grade} ${subject} Textbook — relevant chapter`,
      'Whiteboard and markers for diagrams',
      `Printed worksheet: ${topic} practice problems`,
      'Projector for PPT slides',
      'Scientific calculator (if applicable)',
      'Colored pens for concept mapping'
    ],
    homework: `Complete exercises 1-5 from the textbook chapter on ${topic}. Write a short paragraph (5-6 sentences) explaining ${subTopicsList[0] || topic} in your own words. Optional extension: research one real-world application of ${topic} and present it in the next class.`,
    durationMap: [
      { phase: 'Introduction & Hook', minutes: 5 },
      { phase: 'Prior Knowledge Review', minutes: 5 },
      { phase: 'Core Content Delivery', minutes: Math.floor(duration * 0.4) },
      { phase: 'Worked Examples', minutes: Math.floor(duration * 0.2) },
      { phase: 'Student Activity', minutes: Math.floor(duration * 0.2) },
      { phase: 'Summary & Assessment', minutes: Math.max(duration - Math.floor(duration * 0.4) - Math.floor(duration * 0.2) - Math.floor(duration * 0.2) - 10, 5) }
    ]
  };
};

// ─── MOCK QUESTION PAPER & EVALUATION ─────────────────────────────────────────
const generateMockQuestionPaper = (config) => {
  const { topic, difficulty, questionsCount, totalMarks } = config;
  const count = parseInt(questionsCount) || 5;
  const marks = parseInt(totalMarks) || 25;
  const eachMarks = Math.floor(marks / count);

  const questions = [];
  const answerKey = [];

  for (let i = 1; i <= count; i++) {
    const isLast = (i === count);
    const qMarks = isLast ? (marks - (eachMarks * (count - 1))) : eachMarks;
    const type = i % 3 === 0 ? 'mcq' : (i % 2 === 0 ? 'long' : 'short');

    let text, modelAnswer, rubrics;

    if (type === 'mcq') {
      text = `Which of the following best describes the key property of ${topic}?`;
      modelAnswer = `Option A: The primary characteristic defining ${topic} and its relative behavior.`;
      rubrics = [`Identify Option A as the correct answer`, `Explain why Option A is correct`];
    } else if (type === 'long') {
      text = `Provide a comprehensive analysis of ${topic}. Explain its core mechanisms and give at least two real-world examples.`;
      modelAnswer = `A complete explanation of ${topic} detailing its mechanism (Point 1, Point 2) and providing two examples (e.g. Case A, Case B).`;
      rubrics = [
        `Detailed definition and core mechanism description`,
        `Example 1 provided and explained in context`,
        `Example 2 provided and explained in context`,
        `Precise use of key terminology`
      ];
    } else {
      text = `Explain the concept of ${topic} and mention one primary application.`;
      modelAnswer = `The definition of ${topic} is ... and it is applied primarily in ... to improve overall results.`;
      rubrics = [`Accurate definition of ${topic}`, `Valid real-world application mentioned`];
    }

    questions.push({ questionNumber: i, text, marks: qMarks, type });
    answerKey.push({ questionNumber: i, modelAnswer, rubrics });
  }

  return { questions, answerKey };
};

const generateMockEvaluation = (paper, studentAnswersText) => {
  const gradedResults = [];
  let totalMarks = 0;
  let maxMarks = 0;

  paper.questions.forEach(q => {
    const key = paper.answerKey.find(ak => ak.questionNumber === q.questionNumber) || {};
    const successRatio = 0.7 + Math.random() * 0.25;
    const marksAwarded = Math.round(q.marks * successRatio);
    totalMarks += marksAwarded;
    maxMarks += q.marks;

    const rubricMatched = successRatio > 0.8;
    const feedback = rubricMatched
      ? `Strong answer. The student successfully met all major rubric points including key terms.`
      : `Good attempt. The student met the basic criteria but missed some essential terminology or specific details.`;

    gradedResults.push({
      questionNumber: q.questionNumber,
      marksAwarded,
      maxMarks: q.marks,
      feedback,
      rubricMatched
    });
  });

  return {
    gradedResults,
    totalMarks,
    maxMarks,
    feedbackSummary: `The student performed very well overall, scoring ${totalMarks}/${maxMarks}. They demonstrated a solid understanding of the concepts of ${paper.topic}, though minor details in technical terms can be improved.`,
    strengths: [`Clear and structured definitions`, `Accurate identification of primary applications`],
    weaknesses: [`Missed minor technical details in long-answer questions`, `COULD explain mechanisms more deeply`]
  };
};

// ─── MULTIMODAL IMAGE HELPERS ──────────────────────────────────────────────────
const getImagePartsForOpenAI = (uploadedFiles) => {
  if (!uploadedFiles || uploadedFiles.length === 0) return [];
  const imageParts = [];
  uploadedFiles.forEach(file => {
    if (!file.path) return;
    const ext = path.extname(file.path).toLowerCase();
    if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) {
      try {
        if (fs.existsSync(file.path)) {
          const base64 = fs.readFileSync(file.path).toString('base64');
          const mime = file.type || 'image/jpeg';
          imageParts.push({
            type: 'image_url',
            image_url: {
              url: `data:${mime};base64,${base64}`
            }
          });
        }
      } catch (err) {
        console.error('Error reading image file for OpenAI:', err);
      }
    }
  });
  return imageParts;
};

const getImagePartsForGemini = (uploadedFiles) => {
  if (!uploadedFiles || uploadedFiles.length === 0) return [];
  const imageParts = [];
  uploadedFiles.forEach(file => {
    if (!file.path) return;
    const ext = path.extname(file.path).toLowerCase();
    if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) {
      try {
        if (fs.existsSync(file.path)) {
          const base64 = fs.readFileSync(file.path).toString('base64');
          const mime = file.type || 'image/jpeg';
          imageParts.push({
            inlineData: {
              data: base64,
              mimeType: mime
            }
          });
        }
      } catch (err) {
        console.error('Error reading image file for Gemini:', err);
      }
    }
  });
  return imageParts;
};

// ─── OPENAI AI SERVICE (PRIMARY) ───────────────────────────────────────────────
const callOpenAI = async (prompt, uploadedFiles = []) => {
  const OpenAI = require('openai');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const imageParts = getImagePartsForOpenAI(uploadedFiles);
  let userMessageContent = prompt;

  if (imageParts.length > 0) {
    userMessageContent = [
      { type: 'text', text: prompt },
      ...imageParts
    ];
  }

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an expert educational content creator. Always respond with valid JSON only — no markdown, no code fences, no explanations outside JSON.'
      },
      {
        role: 'user',
        content: userMessageContent
      }
    ],
    temperature: 0.7,
    max_tokens: 8000,
    response_format: { type: 'json_object' },
  });

  const text = response.choices[0].message.content;
  return JSON.parse(text);
};

// ─── GEMINI AI SERVICE (FALLBACK) ──────────────────────────────────────────────
const callGemini = async (prompt, uploadedFiles = []) => {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const imageParts = getImagePartsForGemini(uploadedFiles);
  const parts = [
    { text: prompt },
    ...imageParts
  ];

  const result = await model.generateContent({
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    }
  });

  const text = result.response.text();
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
};

// ─── SMART AI CALLER: OpenAI → Gemini → Mock ──────────────────────────────────
const hasOpenAI = () => process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here' && process.env.OPENAI_API_KEY.length > 10;
const hasGemini = () => process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here' && process.env.GEMINI_API_KEY.length > 10;

const generateGeminiImage = async (imageQuery) => {
  if (!hasGemini()) {
    console.log("⚠️ No Gemini key configured for image generation.");
    return null;
  }

  const fetch = require('node-fetch');
  const prompt = `${imageQuery}, clear educational textbook diagram, high quality, student explanation reference style, no irrelevant text, schematic, detailed illustration`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${process.env.GEMINI_API_KEY}`;
  
  console.log(`🎨 [Gemini Imagen] Generating image for prompt: "${prompt}"...`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instances: [{ prompt: prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: "4:3"
        }
      })
    });
    
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }
    
    const base64 = data.predictions?.[0]?.bytesBase64Encoded;
    if (!base64) {
      throw new Error("No image data returned from Gemini Imagen");
    }
    
    return base64;
  } catch (err) {
    console.error(`❌ [Gemini Imagen] Failed: ${err.message}`);
    return null;
  }
};

const generateAIImage = async (imageQuery) => {
  if (!hasOpenAI() && !hasGemini()) {
    console.log("⚠️ Neither OpenAI nor Gemini key configured for image generation.");
    return null;
  }

  let base64 = null;

  // 1. Try OpenAI DALL-E first
  if (hasOpenAI()) {
    try {
      const OpenAI = require('openai');
      const fetch = require('node-fetch');
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const prompt = `${imageQuery}, clear educational textbook diagram, high quality, student explanation reference style, no irrelevant text, schematic, detailed illustration`;
      
      console.log(`🎨 [OpenAI DALL-E 3] Generating image for prompt: "${prompt}"...`);
      const response = await client.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024"
      });
      const url = response.data[0].url;
      if (url) {
        console.log("Downloading generated DALL-E 3 image...");
        const res = await fetch(url);
        if (res.ok) {
          const buffer = await res.buffer();
          base64 = buffer.toString('base64');
        }
      }
    } catch (err) {
      console.warn(`⚠️  [OpenAI DALL-E 3] Failed: ${err.message}. Trying DALL-E 2 fallback...`);
      try {
        const OpenAI = require('openai');
        const fetch = require('node-fetch');
        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const prompt = `${imageQuery}, clear educational textbook diagram, high quality, student explanation reference style, no irrelevant text, schematic, detailed illustration`;
        const response = await client.images.generate({
          model: "dall-e-2",
          prompt: prompt.slice(0, 1000),
          n: 1,
          size: "512x512"
        });
        const url = response.data[0].url;
        if (url) {
          console.log("Downloading generated DALL-E 2 image...");
          const res = await fetch(url);
          if (res.ok) {
            const buffer = await res.buffer();
            base64 = buffer.toString('base64');
          }
        }
      } catch (err2) {
        console.error(`❌ [OpenAI DALL-E 2] Failed: ${err2.message}`);
      }
    }
  }

  // 2. If OpenAI DALL-E failed (or wasn't configured), fall back to Gemini Imagen 4
  if (!base64 && hasGemini()) {
    console.log("⚠️ OpenAI DALL-E failed/not configured. Falling back to Gemini Imagen...");
    try {
      base64 = await generateGeminiImage(imageQuery);
    } catch (err) {
      console.error(`❌ [Gemini Imagen Fallback] Failed: ${err.message}`);
    }
  }

  return base64;
};

const generateImagesForSlides = async (slides, generationId, imagePreference) => {
  if (imagePreference === 'none') {
    console.log('🖼️ Skipping AI image generation (imagePreference is none)');
    return slides;
  }
  
  const hasKey = hasOpenAI();
  if (!hasKey) {
    console.log('🔧 [MOCK IMAGE] No OpenAI API key for DALL-E — skipping AI image generation (relying on frontend Flickr fallback)');
    return slides;
  }

  console.log('🎨 Starting background DALL-E image generation for slides...');
  const uploadsDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Define task limit concurrency (e.g. 2 parallel requests to avoid hitting rate limits too quickly)
  const limit = 2;
  const tasks = slides.map(slide => async () => {
    const isIntroOrSummary = slide.type === 'intro' || slide.type === 'summary';
    if (isIntroOrSummary || !slide.imageQuery || slide.imageQuery.trim() === '') {
      return;
    }

    try {
      const b64 = await generateAIImage(slide.imageQuery);
      if (b64) {
        const fileName = `generated_${generationId}_${slide.index}.png`;
        const filePath = path.join(uploadsDir, fileName);
        fs.writeFileSync(filePath, Buffer.from(b64, 'base64'));
        slide.imageUrl = `/uploads/${fileName}`;
        console.log(`✅ Image generated and saved for Slide ${slide.index + 1}: ${slide.imageUrl}`);
      } else {
        console.warn(`⚠️ Image generation returned empty/failed for Slide ${slide.index + 1}. Will fall back to Flickr.`);
      }
    } catch (err) {
      console.error(`❌ Image generation failed for Slide ${slide.index + 1}: ${err.message}`);
    }
  });

  // Limit concurrency to 2 parallel tasks
  const executing = [];
  for (const task of tasks) {
    const p = Promise.resolve().then(() => task());
    if (limit <= tasks.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }
  await Promise.all(executing);
  
  return slides;
};

const callAI = async (prompt, mockFn, mockArgs, uploadedFiles = []) => {
  // Force mock if MOCK_AI=true
  if (process.env.MOCK_AI === 'true') {
    console.log('🔧 [MOCK AI] MOCK_AI=true — using mock data');
    await new Promise(r => setTimeout(r, 1200));
    return mockFn(...mockArgs);
  }

  // Try OpenAI first (primary)
  if (hasOpenAI()) {
    try {
      console.log(`🤖 [OpenAI] Calling ${process.env.OPENAI_MODEL || 'gpt-4o-mini'} (Multimodal enabled)…`);
      return await callOpenAI(prompt, uploadedFiles);
    } catch (err) {
      console.warn(`⚠️  [OpenAI] Failed: ${err.message} — falling back to Gemini…`);
    }
  }

  // Fallback to Gemini
  if (hasGemini()) {
    try {
      console.log('🤖 [Gemini] Calling gemini-2.0-flash as fallback (Multimodal enabled)…');
      return await callGemini(prompt, uploadedFiles);
    } catch (err) {
      console.warn(`⚠️  [Gemini] Failed: ${err.message} — falling back to mock…`);
    }
  }

  // Last resort: mock
  console.log('🔧 [MOCK AI] No working AI provider — using mock data');
  await new Promise(r => setTimeout(r, 1200));
  return mockFn(...mockArgs);
};

// ─── MAIN EXPORTED FUNCTIONS ───────────────────────────────────────────────────
const generateSlides = async (config, uploadedContext = '', uploadedFiles = []) => {
  const prompt = buildSlideGenerationPrompt(config, uploadedContext);
  const data = await callAI(prompt, generateMockSlides, [config], uploadedFiles);
  return data.slides || data; // Gemini returns {slides:[...]}, mock returns array directly
};

const generateLessonPlan = async (config, uploadedContext = '', uploadedFiles = []) => {
  const prompt = buildLessonPlanPrompt(config, uploadedContext);
  const data = await callAI(prompt, generateMockLessonPlan, [config], uploadedFiles);
  return data;
};

const regenerateSlide = async (config, slideIndex, instructions = '') => {
  const slides = await generateSlides({
    ...config,
    slideCount: 1,
    additionalInstructions: instructions
  });
  const slideArr = Array.isArray(slides) ? slides : (slides.slides || []);
  const slide = slideArr[0] || generateMockSlides({ ...config, slideCount: 1 })[0];
  slide.index = slideIndex;
  return slide;
};

const generateQuestionPaper = async (config, uploadedContext = '') => {
  const prompt = buildQuestionPaperPrompt(config, uploadedContext);
  return await callAI(prompt, generateMockQuestionPaper, [config]);
};

const evaluateAnswerSheet = async (paper, studentAnswersText) => {
  const prompt = buildEvaluationPrompt(paper, studentAnswersText);
  return await callAI(prompt, generateMockEvaluation, [paper, studentAnswersText]);
};

module.exports = {
  generateSlides,
  generateLessonPlan,
  regenerateSlide,
  generateQuestionPaper,
  evaluateAnswerSheet,
  generateAIImage,
  generateImagesForSlides
};
