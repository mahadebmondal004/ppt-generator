const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Register user
// @route   POST /api/auth/register
const register = async (req, res) => {
  const { name, email, password, school } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ success: false, message: 'User already exists with this email' });
  }

  const user = await User.create({ name, email, password, school: school || '' });

  const token = generateToken(user._id);
  res.status(201).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      school: user.school
    }
  });
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const token = generateToken(user._id);
  res.json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      school: user.school
    }
  });
};

// @desc    Get current user
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({
    success: true,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      school: user.school
    }
  });
};

module.exports = { register, login, getMe };
