const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Module = require('../models/Module');

// @route   GET /api/user/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('completedModules.moduleId', 'title category')
      .populate('currentModule', 'title description');

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        knowsJavaScript: user.knowsJavaScript,
        learningPath: user.learningPath,
        completedModules: user.completedModules,
        currentModule: user.currentModule,
        totalPoints: user.totalPoints || 0,
        level: user.level || 1,
        gameStudioEnabled: user.gameStudioEnabled || false,
        earnedAchievements: user.earnedAchievements || [],
        gameStats: user.gameStats || {}
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/user/module/complete
// @desc    Mark module as completed
// @access  Private
router.put('/module/complete', auth, async (req, res) => {
  try {
    const { moduleId } = req.body;

    const user = await User.findById(req.user._id);
    const module = await Module.findById(moduleId);
    if (!module) return res.status(404).json({ message: 'Module not found' });
    
    // Check if already completed
    const alreadyCompleted = user.completedModules.some(
      m => m.moduleId.toString() === moduleId
    );

    if (!alreadyCompleted) {
      // Mark completed
      user.completedModules.push({ moduleId });
      // Award fixed points per module (match frontend logic: 100 points per module)
      const pointsAward = 100;
      user.totalPoints = (user.totalPoints || 0) + pointsAward;
      // Recalculate level based on totalPoints: level = floor(totalPoints / 200) + 1
      user.level = Math.floor(user.totalPoints / 200) + 1;
      // If the user's currentModule matches this module, clear it
      if (user.currentModule && user.currentModule.toString() === moduleId) {
        user.currentModule = undefined;
      }

      await user.save();
    }

    // If the user completed all modules in their learning path category, enable game studio
    if (user.learningPath && user.learningPath !== 'none') {
      const modulesForPath = await Module.find({ category: user.learningPath }).select('_id');
      const completedIds = user.completedModules.map(m => m.moduleId.toString());
      const allCompleted = modulesForPath.every(m => completedIds.includes(m._id.toString()));
      if (allCompleted && !user.gameStudioEnabled) {
        user.gameStudioEnabled = true;
        await user.save();
      }
    }

    // Return updated profile for frontend sync
    const updatedUser = await User.findById(req.user._id)
      .select('-password')
      .populate('completedModules.moduleId', 'title category')
      .populate('currentModule', 'title description');

    res.json({ message: 'Module marked as completed', user: updatedUser });
  } catch (error) {
    console.error('Complete module error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/user/module/current
// @desc    Set current module
// @access  Private
router.put('/module/current', auth, async (req, res) => {
  try {
    const { moduleId } = req.body;

    const user = await User.findById(req.user._id);
    user.currentModule = moduleId;
    await user.save();

    const updatedUser = await User.findById(req.user._id)
      .select('-password')
      .populate('completedModules.moduleId', 'title category')
      .populate('currentModule', 'title description');

    res.json({ message: 'Current module updated', user: updatedUser });
  } catch (error) {
    console.error('Set current module error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
