const CurriculumTopic = require('../models/CurriculumTopic');

const BOARD_INFO = {
  CBSE: {
    name: 'CBSE',
    fullName: 'Central Board of Secondary Education',
    description: 'National curriculum board of India — Grades 1–12',
    grades: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
             'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
             'Grade 11', 'Grade 12']
  },
  IGCSE: {
    name: 'IGCSE',
    fullName: 'International General Certificate of Secondary Education',
    description: 'International Cambridge curriculum — Grades 9–12',
    grades: ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']
  }
};

const SUBJECTS = {
  CBSE: {
    'Grade 1': ['English', 'Mathematics', 'Environmental Studies', 'Hindi'],
    'Grade 2': ['English', 'Mathematics', 'Environmental Studies', 'Hindi'],
    'Grade 3': ['English', 'Mathematics', 'Environmental Studies', 'Hindi'],
    'Grade 4': ['English', 'Mathematics', 'Environmental Studies', 'Hindi'],
    'Grade 5': ['English', 'Mathematics', 'Science', 'Social Studies', 'Hindi'],
    'Grade 6': ['English', 'Mathematics', 'Science', 'Social Science', 'Hindi', 'Sanskrit'],
    'Grade 7': ['English', 'Mathematics', 'Science', 'Social Science', 'Hindi', 'Sanskrit'],
    'Grade 8': ['English', 'Mathematics', 'Science', 'Social Science', 'Hindi', 'Sanskrit'],
    'Grade 9': ['English', 'Mathematics', 'Science', 'Social Science', 'Hindi', 'Sanskrit', 'Information Technology'],
    'Grade 10': ['English', 'Mathematics', 'Science', 'Social Science', 'Hindi', 'Sanskrit', 'Information Technology'],
    'Grade 11': ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'English', 'Computer Science', 'Economics', 'Accountancy', 'Business Studies', 'History', 'Geography'],
    'Grade 12': ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'English', 'Computer Science', 'Economics', 'Accountancy', 'Business Studies', 'History', 'Geography']
  },
  IGCSE: {
    'Grade 9': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English Language', 'History', 'Geography', 'Computer Science', 'Economics', 'Business Studies', 'Art & Design'],
    'Grade 10': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English Language', 'History', 'Geography', 'Computer Science', 'Economics', 'Business Studies', 'Art & Design'],
    'Grade 11': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English Language', 'History', 'Geography', 'Computer Science', 'Economics', 'Business Studies'],
    'Grade 12': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English Language', 'History', 'Geography', 'Computer Science', 'Economics', 'Business Studies']
  }
};

// @desc    Get all boards
// @route   GET /api/curriculum/boards
const getBoards = (req, res) => {
  const boards = Object.values(BOARD_INFO).map(b => ({
    name: b.name,
    fullName: b.fullName,
    description: b.description
  }));
  res.json({ success: true, boards });
};

// @desc    Get grades for a board
// @route   GET /api/curriculum/grades?board=CBSE
const getGrades = (req, res) => {
  const { board } = req.query;
  if (!board || !BOARD_INFO[board]) {
    return res.status(400).json({ success: false, message: 'Invalid board' });
  }
  res.json({ success: true, grades: BOARD_INFO[board].grades });
};

// @desc    Get subjects for board + grade
// @route   GET /api/curriculum/subjects?board=CBSE&grade=Grade 9
const getSubjects = (req, res) => {
  const { board, grade } = req.query;
  if (!board || !grade) {
    return res.status(400).json({ success: false, message: 'Board and grade are required' });
  }
  const subjects = SUBJECTS[board]?.[grade] || [];
  res.json({ success: true, subjects });
};

// @desc    Get topics for board + grade + subject
// @route   GET /api/curriculum/topics?board=CBSE&grade=Grade 9&subject=Science
const getTopics = async (req, res) => {
  const { board, grade, subject } = req.query;
  if (!board || !grade || !subject) {
    return res.status(400).json({ success: false, message: 'Board, grade, and subject are required' });
  }

  let curriculum = await CurriculumTopic.findOne({ board, grade, subject });

  // If not found in DB, return generic topics
  if (!curriculum) {
    const genericTopics = generateGenericTopics(subject);
    return res.json({ success: true, topics: genericTopics });
  }

  res.json({ success: true, topics: curriculum.topics });
};

const generateGenericTopics = (subject) => {
  const topicMap = {
    Mathematics: [
      { name: 'Number Systems', description: 'Real numbers, rational and irrational numbers', subTopics: [{ name: 'Real Numbers' }, { name: 'Irrational Numbers' }, { name: 'Number Line' }] },
      { name: 'Algebra', description: 'Polynomials, equations, and expressions', subTopics: [{ name: 'Polynomials' }, { name: 'Linear Equations' }, { name: 'Quadratic Equations' }] },
      { name: 'Geometry', description: 'Lines, angles, triangles, and circles', subTopics: [{ name: 'Lines and Angles' }, { name: 'Triangles' }, { name: 'Circles' }] },
      { name: 'Statistics', description: 'Data collection, analysis, and representation', subTopics: [{ name: 'Mean, Median, Mode' }, { name: 'Bar Graphs' }, { name: 'Frequency Distribution' }] },
      { name: 'Trigonometry', description: 'Trigonometric ratios and applications', subTopics: [{ name: 'Trigonometric Ratios' }, { name: 'Trigonometric Identities' }, { name: 'Heights and Distances' }] }
    ],
    Science: [
      { name: 'Matter in Our Surroundings', description: 'States of matter and their properties', subTopics: [{ name: 'Solid, Liquid, Gas' }, { name: 'Evaporation' }, { name: 'Melting and Boiling' }] },
      { name: 'Atoms and Molecules', description: 'Atomic structure and chemical bonding', subTopics: [{ name: 'Dalton\'s Atomic Theory' }, { name: 'Molecules' }, { name: 'Mole Concept' }] },
      { name: 'Cell: Structure and Function', description: 'Cell biology and organelles', subTopics: [{ name: 'Cell Theory' }, { name: 'Plant vs Animal Cell' }, { name: 'Cell Organelles' }] },
      { name: 'Motion', description: 'Laws of motion and velocity', subTopics: [{ name: 'Speed and Velocity' }, { name: 'Acceleration' }, { name: 'Newton\'s Laws' }] },
      { name: 'Force and Newton\'s Laws', description: 'Forces and their effects', subTopics: [{ name: 'Types of Forces' }, { name: 'Friction' }, { name: 'Gravitation' }] }
    ],
    Physics: [
      { name: 'Kinematics', description: 'Motion, velocity, and acceleration', subTopics: [{ name: 'Displacement & Velocity' }, { name: 'Equations of Motion' }, { name: 'Projectile Motion' }] },
      { name: 'Laws of Motion', description: 'Newton\'s three laws and applications', subTopics: [{ name: 'First Law of Motion' }, { name: 'Second Law and Force' }, { name: 'Third Law and Conservation' }] },
      { name: 'Electricity', description: 'Electric charge, current, and circuits', subTopics: [{ name: 'Electric Charge' }, { name: 'Ohm\'s Law' }, { name: 'Series and Parallel Circuits' }] },
      { name: 'Waves', description: 'Sound and light waves', subTopics: [{ name: 'Wave Properties' }, { name: 'Sound Waves' }, { name: 'Electromagnetic Waves' }] }
    ],
    Chemistry: [
      { name: 'Periodic Table', description: 'Elements, groups, and periods', subTopics: [{ name: 'History of Periodic Table' }, { name: 'Groups and Periods' }, { name: 'Periodic Trends' }] },
      { name: 'Chemical Bonding', description: 'Ionic, covalent, and metallic bonds', subTopics: [{ name: 'Ionic Bonding' }, { name: 'Covalent Bonding' }, { name: 'Hydrogen Bonding' }] },
      { name: 'Acids, Bases and Salts', description: 'pH, neutralization, and salt formation', subTopics: [{ name: 'Properties of Acids' }, { name: 'Properties of Bases' }, { name: 'pH Scale' }] },
      { name: 'Carbon and its Compounds', description: 'Organic chemistry fundamentals', subTopics: [{ name: 'Carbon Bonding' }, { name: 'Hydrocarbons' }, { name: 'Functional Groups' }] }
    ],
    Biology: [
      { name: 'Cell Biology', description: 'Cell structure, division, and function', subTopics: [{ name: 'Cell Structure' }, { name: 'Mitosis' }, { name: 'Meiosis' }] },
      { name: 'Genetics', description: 'Heredity, DNA, and gene expression', subTopics: [{ name: 'Mendel\'s Laws' }, { name: 'DNA Structure' }, { name: 'Gene Expression' }] },
      { name: 'Ecology', description: 'Ecosystems, food chains, and environment', subTopics: [{ name: 'Ecosystems' }, { name: 'Food Chains and Webs' }, { name: 'Conservation' }] },
      { name: 'Human Physiology', description: 'Body systems and their functions', subTopics: [{ name: 'Digestive System' }, { name: 'Respiratory System' }, { name: 'Circulatory System' }] }
    ],
    'English Language': [
      { name: 'Reading Comprehension', description: 'Inferential and literal comprehension', subTopics: [{ name: 'Identifying Main Idea' }, { name: 'Inference Skills' }, { name: 'Vocabulary in Context' }] },
      { name: 'Writing Skills', description: 'Essays, letters, and creative writing', subTopics: [{ name: 'Essay Writing' }, { name: 'Formal Letter Writing' }, { name: 'Creative Writing' }] },
      { name: 'Grammar', description: 'Tenses, clauses, and sentence structure', subTopics: [{ name: 'Tenses' }, { name: 'Clauses' }, { name: 'Active and Passive Voice' }] }
    ],
    English: [
      { name: 'Prose', description: 'Short stories and non-fiction passages', subTopics: [{ name: 'Story Analysis' }, { name: 'Character Study' }, { name: 'Theme and Message' }] },
      { name: 'Poetry', description: 'Poems, imagery, and literary devices', subTopics: [{ name: 'Poetic Devices' }, { name: 'Imagery and Tone' }, { name: 'Poem Summary' }] },
      { name: 'Grammar & Writing', description: 'Formal writing and grammar rules', subTopics: [{ name: 'Tenses' }, { name: 'Letter Writing' }, { name: 'Essay Writing' }] }
    ],
    History: [
      { name: 'Ancient Civilizations', description: 'Early human societies and civilizations', subTopics: [{ name: 'Mesopotamia' }, { name: 'Indus Valley Civilization' }, { name: 'Egyptian Civilization' }] },
      { name: 'Medieval Period', description: 'Medieval Europe and world history', subTopics: [{ name: 'Feudal System' }, { name: 'The Crusades' }, { name: 'Renaissance' }] },
      { name: 'Modern History', description: 'Industrial revolution to present day', subTopics: [{ name: 'Industrial Revolution' }, { name: 'World Wars' }, { name: 'Independence Movements' }] }
    ],
    Geography: [
      { name: 'Physical Geography', description: 'Landforms, climate, and natural features', subTopics: [{ name: 'Landforms and Relief' }, { name: 'Climate Zones' }, { name: 'Rivers and Drainage' }] },
      { name: 'Human Geography', description: 'Population, settlement, and resources', subTopics: [{ name: 'Population Distribution' }, { name: 'Natural Resources' }, { name: 'Urbanization' }] },
      { name: 'Environmental Geography', description: 'Environmental issues and sustainability', subTopics: [{ name: 'Climate Change' }, { name: 'Deforestation' }, { name: 'Sustainable Development' }] }
    ],
    'Computer Science': [
      { name: 'Programming Fundamentals', description: 'Algorithms, flowcharts, and basic coding', subTopics: [{ name: 'Algorithms' }, { name: 'Flowcharts' }, { name: 'Variables and Data Types' }] },
      { name: 'Data Structures', description: 'Arrays, lists, stacks, and queues', subTopics: [{ name: 'Arrays' }, { name: 'Linked Lists' }, { name: 'Stacks and Queues' }] },
      { name: 'Networking Basics', description: 'Internet, protocols, and cybersecurity', subTopics: [{ name: 'OSI Model' }, { name: 'IP Addressing' }, { name: 'Cybersecurity' }] }
    ],
    Economics: [
      { name: 'Basic Economic Concepts', description: 'Scarcity, demand, supply, and market', subTopics: [{ name: 'Scarcity and Choice' }, { name: 'Demand and Supply' }, { name: 'Market Equilibrium' }] },
      { name: 'Macroeconomics', description: 'GDP, inflation, and monetary policy', subTopics: [{ name: 'GDP and National Income' }, { name: 'Inflation' }, { name: 'Fiscal Policy' }] },
      { name: 'International Trade', description: 'Trade, globalization, and balance of payments', subTopics: [{ name: 'Trade Theory' }, { name: 'Tariffs and Quotas' }, { name: 'Globalization' }] }
    ]
  };

  return topicMap[subject] || [
    { name: `Introduction to ${subject}`, description: `Overview and fundamentals`, subTopics: [{ name: 'Key Concepts' }, { name: 'Historical Background' }, { name: 'Applications' }] },
    { name: `Core ${subject} Principles`, description: `Main principles and theories`, subTopics: [{ name: 'Theory 1' }, { name: 'Theory 2' }, { name: 'Practice' }] },
    { name: `Advanced ${subject} Topics`, description: `In-depth analysis and practice`, subTopics: [{ name: 'Complex Problems' }, { name: 'Case Studies' }, { name: 'Review' }] }
  ];
};

module.exports = { getBoards, getGrades, getSubjects, getTopics };
