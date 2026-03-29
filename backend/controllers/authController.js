const User = require('../models/User');
const Module = require('../models/Module');
const { generateToken, signPasswordResetToken, verifyPasswordResetToken } = require('../utils/jwt');
const { isAdmin } = require('../utils/admin');
const { grantSignupAchievement } = require('../services/achievementService');
const lessonXpService = require('../services/lessonXpService');

/** Default tutor/companion preferences by learning path (applied at signup). */
const AI_PRESET_BY_PATH = {
  'javascript-basics': { tone: 'friendly', hintDetail: 'detailed', assistanceFrequency: 'high' },
  advanced: { tone: 'friendly', hintDetail: 'moderate', assistanceFrequency: 'normal' },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/signup-precheck — validate email/password before path selection (no user created).
 */
async function signupPrecheck(req, res) {
  try {
    const email = (req.body.email || '').trim();
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const normalized = email.toLowerCase();
    const existingUser = await User.findOne({ email: normalized });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    return res.json({ ok: true });
  } catch (error) {
    console.error('[Auth] signupPrecheck error', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

/**
 * POST /api/auth/signup - Register new user
 */
async function signup(req, res) {
  try {
    const { name, email, password, knowsJavaScript } = req.body;

    if (!name || !email || !password || knowsJavaScript === undefined) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    const emailTrimmed = String(email).trim();
    if (!EMAIL_RE.test(emailTrimmed)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const existingUser = await User.findOne({ email: emailTrimmed.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const learningPath = knowsJavaScript ? 'advanced' : 'javascript-basics';
    const aiPreset = AI_PRESET_BY_PATH[learningPath] || AI_PRESET_BY_PATH['javascript-basics'];
    const user = new User({
      name,
      email: emailTrimmed,
      password,
      knowsJavaScript,
      learningPath,
      aiPreferences: aiPreset,
    });

    await user.save();

    // Advanced path: auto-complete all javascript-basics modules so quest map shows game-development + multiplayer
    if (learningPath === 'advanced') {
      const jsBasicsModules = await Module.find({ category: 'javascript-basics' }).select('_id');
      const now = new Date();
      user.completedModules = jsBasicsModules.map((m) => ({
        moduleId: m._id,
        completedAt: now,
      }));
      await user.save();
    }

    await grantSignupAchievement(user._id);
    const token = generateToken(user._id);

    const savedUser = await User.findById(user._id)
      .select('-password')
      .populate('completedModules.moduleId', 'title category')
      .populate('currentModule', 'title');

    const userPayload = savedUser.toObject();
    userPayload.isAdmin = isAdmin(savedUser);
    userPayload.levelInfo = lessonXpService.getLevelInfo(savedUser.totalPoints || 0);

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

    const emailNormalized = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: emailNormalized });
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
    userPayload.isAdmin = isAdmin(fullUser);
    userPayload.levelInfo = lessonXpService.getLevelInfo(fullUser.totalPoints || 0);

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

/**
 * POST /api/auth/forgot-password - Request password reset. Body: { email }
 * Returns a JWT reset token (1h) in the response; frontend stores it (no DB persistence).
 */
async function forgotPassword(req, res) {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      return res.status(400).json({ message: 'Valid email required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: 'If that email is registered, a reset link has been sent.' });
    }
    const resetToken = signPasswordResetToken(email);
    return res.json({
      message: 'If that email is registered, you can reset your password.',
      resetToken,
    });
  } catch (error) {
    console.error('[Auth] forgotPassword error', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

/**
 * POST /api/auth/reset-password - Set new password with JWT reset token. Body: { token, newPassword }
 * Token is verified (signature + expiry); no DB lookup.
 */
async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;
    if (!token || typeof newPassword !== 'string') {
      return res.status(400).json({ message: 'Token and new password required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    let payload;
    try {
      payload = verifyPasswordResetToken(token);
    } catch {
      return res
        .status(400)
        .json({ message: 'Invalid or expired reset link. Please request a new one.' });
    }
    const user = await User.findOne({ email: payload.email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid reset link' });
    }
    user.password = newPassword;
    await user.save();
    return res.json({
      message: 'Password reset successfully. You can sign in with your new password.',
    });
  } catch (error) {
    console.error('[Auth] resetPassword error', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  signupPrecheck,
  signup,
  login,
  forgotPassword,
  resetPassword,
};
