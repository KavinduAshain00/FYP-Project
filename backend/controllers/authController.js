const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { isAdmin } = require('../utils/admin');
const { grantSignupAchievement } = require('../services/achievementService');

/**
 * POST /api/auth/signup - Register new user
 */
async function signup(req, res) {
  try {
    const { name, email, password, knowsJavaScript } = req.body;

    if (!name || !email || !password || knowsJavaScript === undefined) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    console.log('[Auth] signup', { email });

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
      user.gameStudioEnabled = false;
    }

    if (learningPath === 'advanced') {
      user.gameStudioEnabled = true;
    }

    await user.save();
    await grantSignupAchievement(user._id);
    console.log('[Auth] signup success', { userId: user._id?.toString(), email });
    const token = generateToken(user._id);

    const savedUser = await User.findById(user._id)
      .select('-password')
      .populate('completedModules.moduleId', 'title category')
      .populate('currentModule', 'title');

    const userPayload = savedUser.toObject();
    userPayload.isAdmin = isAdmin(savedUser);

    return res.status(201).json({
      message: 'User created successfully',
      token,
      user: userPayload,
    });
  } catch (error) {
    console.error('[Auth] signup error', error.message);
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
    console.log('[Auth] login', { email });

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    console.log('[Auth] login success', { userId: user._id?.toString(), email });
    const fullUser = await User.findById(user._id)
      .select('-password')
      .populate('completedModules.moduleId', 'title category')
      .populate('currentModule', 'title');

    const userPayload = fullUser.toObject();
    userPayload.isAdmin = isAdmin(fullUser);

    return res.json({
      message: 'Login successful',
      token,
      user: userPayload,
    });
  } catch (error) {
    console.error('[Auth] login error', error.message);
    return res.status(500).json({ message: 'Server error during login' });
  }
}

module.exports = {
  signup,
  login,
};
