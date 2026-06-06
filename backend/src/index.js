require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Route imports
const authRoutes = require('./routes/authRoutes');
const curriculumRoutes = require('./routes/curriculumRoutes');
const generateRoutes = require('./routes/generateRoutes');
const historyRoutes = require('./routes/historyRoutes');
const qpRoutes = require('./routes/qpRoutes');

// Error handler
const errorHandler = require('./middleware/errorHandler');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/curriculum', curriculumRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/qp', qpRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 AI PPT Generator Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV}`);
  console.log(`🤖 AI Mode: ${process.env.MOCK_AI === 'true' ? 'MOCK (no API key needed)' : 'LIVE (OpenAI & Gemini Fallback)'}\n`);
});
