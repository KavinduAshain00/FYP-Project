const User = require('../models/User');
const Module = require('../models/Module');
const { generateToken } = require('../utils/jwt');
const { XP_PER_LEVEL } = require('../constants/levelRanks');
const { isAdminEmail } = require('../utils/admin');

/**
 * POST /api/auth/signup - Register new user
 */
async function signup(req, res) {
  try {
    console.log('Signup request received:', { ...req.body, password: '[HIDDEN]' });
    const { name, email, password, knowsJavaScript } = req.body;

    if (!name || !email || !password || knowsJavaScript === undefined) {
      console.log('Validation failed:', {
        name: Boolean(name),
        email: Boolean(email),
        password: Boolean(password),
        knowsJavaScript,
      });
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const learningPath = knowsJavaScript ? 'advanced' : 'javascript-basics';
    const user = new User({
      name,
      email,
      password,
      knowsJavaScript,
      learningPath,
    });

    if (learningPath === 'javascript-basics') {
      const basicModules = await Module.find({ category: 'javascript-basics' }).select('_id');
      if (basicModules && basicModules.length > 0) {
        user.completedModules = basicModules.map((m) => ({ moduleId: m._id }));
        user.totalPoints = (basicModules.length || 0) * 100;
        user.level = Math.max(1, Math.floor((user.totalPoints || 0) / XP_PER_LEVEL) + 1);
        user.gameStudioEnabled = true;
      }
    }

    await user.save();
    const token = generateToken(user._id);

    const savedUser = await User.findById(user._id)
      .select('-password')
      .populate('completedModules.moduleId', 'title category')
      .populate('currentModule', 'title');

    const userPayload = savedUser.toObject();
    userPayload.isAdmin = isAdminEmail(savedUser.email);

    return res.status(201).json({
      message: 'User created successfully',
      token,
      user: userPayload,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ message: 'Server error during signup' });
  }
}

/**
 * POST /api/auth/login - Login user
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    const fullUser = await User.findById(user._id)
      .select('-password')
      .populate('completedModules.moduleId', 'title category')
      .populate('currentModule', 'title');

    const userPayload = fullUser.toObject();
    userPayload.isAdmin = isAdminEmail(fullUser.email);

    return res.json({
      message: 'Login successful',
      token,
      user: userPayload,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
}

module.exports = {
  signup,
  login,
};
