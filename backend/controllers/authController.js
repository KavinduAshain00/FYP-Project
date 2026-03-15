const crypto = require('crypto');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const { generateToken } = require('../utils/jwt');
const { isAdmin } = require('../utils/admin');
const { grantSignupAchievement } = require('../services/achievementService');

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

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

/**
 * POST /api/auth/forgot-password - Request password reset. Body: { email }
 * Creates a reset token (1h). Returns resetToken in response for dev (no email sending).
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
    const token = crypto.randomBytes(32).toString('hex');
    await PasswordReset.deleteMany({ email });
    await PasswordReset.create({
      email,
      token,
      expiresAt: new Date(Date.now() + RESET_TOKEN_EXPIRY_MS),
    });
    return res.json({
      message: 'If that email is registered, you can reset your password.',
      resetToken: token,
    });
  } catch (error) {
    console.error('[Auth] forgotPassword error', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

/**
 * POST /api/auth/reset-password - Set new password with reset token. Body: { token, newPassword }
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
    const reset = await PasswordReset.findOne({ token });
    if (!reset || reset.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired reset link. Please request a new one.' });
    }
    const user = await User.findOne({ email: reset.email });
    if (!user) {
      await PasswordReset.deleteOne({ token });
      return res.status(400).json({ message: 'Invalid reset link' });
    }
    user.password = newPassword;
    await user.save();
    await PasswordReset.deleteOne({ token });
    return res.json({ message: 'Password reset successfully. You can sign in with your new password.' });
  } catch (error) {
    console.error('[Auth] resetPassword error', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  signup,
  login,
  forgotPassword,
  resetPassword,
};
