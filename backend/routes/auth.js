const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Module = require('../models/Module');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @route   POST /api/auth/signup
// @desc    Register new user
// @access  Public
router.post('/signup', async (req, res) => {
  try {
    console.log('Signup request received:', { ...req.body, password: '[HIDDEN]' });
    const { name, email, password, knowsJavaScript } = req.body;

    // Validation
    if (!name || !email || !password || knowsJavaScript === undefined) {
      console.log('Validation failed:', { name: !!name, email: !!email, password: !!password, knowsJavaScript });
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Determine learning path based on JavaScript knowledge
    const learningPath = knowsJavaScript ? 'advanced' : 'javascript-basics';

    // Create new user
    const user = new User({
      name,
      email,
      password,
      knowsJavaScript,
      learningPath
    });

    // If this user is new and assigned to javascript-basics, pre-mark basic modules as completed
    if (learningPath === 'javascript-basics') {
      const basicModules = await Module.find({ category: 'javascript-basics' }).select('_id');
      if (basicModules && basicModules.length > 0) {
        user.completedModules = basicModules.map(m => ({ moduleId: m._id }));
        // award points for each basic module
        user.totalPoints = (basicModules.length || 0) * 100;
        user.level = Math.floor(user.totalPoints / 200) + 1;
        // Since basics are completed, enable Game Studio
        user.gameStudioEnabled = true;
      }
    }

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // return a full user profile (without password) for the client
    const savedUser = await User.findById(user._id)
      .select('-password')
      .populate('completedModules.moduleId', 'title category')
      .populate('currentModule', 'title');

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: savedUser
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    // Return full profile without password so client has all needed fields
    const fullUser = await User.findById(user._id)
      .select('-password')
      .populate('completedModules.moduleId', 'title category')
      .populate('currentModule', 'title');

    res.json({
      message: 'Login successful',
      token,
      user: fullUser
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

module.exports = router;
