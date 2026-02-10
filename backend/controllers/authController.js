const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
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

    // All new users start with zero progress: no completed modules, level 1, 0 totalPoints.
    // New Explorer (javascript-basics path) and Experienced Coder (advanced path) both start fresh.
    if (learningPath === 'javascript-basics') {
      user.gameStudioEnabled = false;
    }

    if (learningPath === 'advanced') {
      user.gameStudioEnabled = true;
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
