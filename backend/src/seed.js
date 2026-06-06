const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('./config/db');
const CurriculumTopic = require('./models/CurriculumTopic');

const SEED_DATA = [
  {
    board: 'CBSE',
    grade: 'Grade 9',
    subject: 'Science',
    topics: [
      {
        name: 'Matter in Our Surroundings',
        description: 'Physical nature of matter and its states.',
        subTopics: [
          { name: 'Physical Nature of Matter', description: 'Matter is made up of particles.' },
          { name: 'States of Matter', description: 'Solid, liquid, and gas.' },
          { name: 'Evaporation', description: 'Factors affecting evaporation and cooling effect.' }
        ]
      },
      {
        name: 'Force and Laws of Motion',
        description: 'Newton\'s laws and momentum.',
        subTopics: [
          { name: 'First Law of Motion', description: 'Inertia and mass.' },
          { name: 'Second Law of Motion', description: 'Force equals mass times acceleration.' },
          { name: 'Third Law of Motion', description: 'Action and reaction.' },
          { name: 'Conservation of Momentum', description: 'Total momentum remains constant.' }
        ]
      }
    ]
  },
  {
    board: 'CBSE',
    grade: 'Grade 10',
    subject: 'Science',
    topics: [
      {
        name: 'Chemical Reactions and Equations',
        description: 'Types of chemical reactions and balancing equations.',
        subTopics: [
          { name: 'Chemical Equations', description: 'Writing and balancing chemical equations.' },
          { name: 'Types of Chemical Reactions', description: 'Combination, decomposition, displacement, etc.' },
          { name: 'Oxidation and Reduction', description: 'Effects of oxidation reactions in everyday life.' }
        ]
      }
    ]
  },
  {
    board: 'IGCSE',
    grade: 'Grade 9',
    subject: 'Mathematics',
    topics: [
      {
        name: 'Algebra and Graphs',
        description: 'Equations, inequalities, and plotting graphs.',
        subTopics: [
          { name: 'Linear Equations', description: 'Solving linear equations.' },
          { name: 'Simultaneous Equations', description: 'Solving pairs of simultaneous equations.' },
          { name: 'Quadratic Equations', description: 'Factorization and quadratic formula.' },
          { name: 'Graphs of Functions', description: 'Plotting linear and non-linear graphs.' }
        ]
      }
    ]
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for Seeding');

    await CurriculumTopic.deleteMany({});
    console.log('Cleared existing curriculum data.');

    await CurriculumTopic.insertMany(SEED_DATA);
    console.log('✅ Seeded Curriculum Topics successfully!');

    process.exit(0);
  } catch (error) {
    console.error(`❌ Error seeding database: ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();
