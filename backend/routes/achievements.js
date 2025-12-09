const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Achievement = require('../models/Achievement');
const User = require('../models/User');

// @route   GET /api/achievements
// @desc    Get all achievements
// @access  Public
router.get('/', async (req, res) => {
  try {
    const achievements = await Achievement.find({ isActive: true }).sort({ id: 1 });
    res.json({ achievements });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/achievements/user
// @desc    Get user's earned achievements
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('earnedAchievements');
    const allAchievements = await Achievement.find({ isActive: true }).sort({ id: 1 });
    
    const userAchievements = allAchievements.map(ach => ({
      ...ach.toObject(),
      earned: user.earnedAchievements ? user.earnedAchievements.includes(ach.id) : false
    }));
    
    res.json({ achievements: userAchievements });
  } catch (error) {
    console.error('Get user achievements error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/achievements/earn
// @desc    Mark achievement as earned
// @access  Private
router.post('/earn', auth, async (req, res) => {
  try {
    const { achievementId } = req.body;
    
    const achievement = await Achievement.findOne({ id: achievementId });
    if (!achievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }
    
    const user = await User.findById(req.user._id);
    
    if (!user.earnedAchievements) {
      user.earnedAchievements = [];
    }
    
    if (!user.earnedAchievements.includes(achievementId)) {
      user.earnedAchievements.push(achievementId);
      user.totalPoints = (user.totalPoints || 0) + achievement.points;
      await user.save();
      
      return res.json({ 
        message: 'Achievement earned!', 
        achievement,
        totalPoints: user.totalPoints 
      });
    }
    
    res.json({ message: 'Achievement already earned' });
  } catch (error) {
    console.error('Earn achievement error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/achievements/stats
// @desc    Get user achievement stats
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const totalAchievements = await Achievement.countDocuments({ isActive: true });
    const earnedCount = user.earnedAchievements ? user.earnedAchievements.length : 0;
    
    res.json({
      totalAchievements,
      earnedCount,
      totalPoints: user.totalPoints || 0,
      completionPercentage: totalAchievements > 0 
        ? Math.round((earnedCount / totalAchievements) * 100) 
        : 0
    });
  } catch (error) {
    console.error('Get achievement stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
