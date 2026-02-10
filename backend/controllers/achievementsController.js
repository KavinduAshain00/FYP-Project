const Achievement = require('../models/Achievement');
const User = require('../models/User');
const achievementService = require('../services/achievementService');
const { XP_PER_LEVEL } = require('../constants/levelRanks');

async function getAll(req, res) {
  try {
    const achievements = await Achievement.find({ isActive: true }).sort({ id: 1 });
    return res.json({ achievements });
  } catch (error) {
    console.error('Get achievements error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function getUserAchievements(req, res) {
  try {
    const user = await User.findById(req.user._id).select('earnedAchievements');
    const allAchievements = await Achievement.find({ isActive: true }).sort({ id: 1 });
    const userAchievements = allAchievements.map((ach) => ({
      ...ach.toObject(),
      earned: user.earnedAchievements ? user.earnedAchievements.includes(ach.id) : false,
    }));
    return res.json({ achievements: userAchievements });
  } catch (error) {
    console.error('Get user achievements error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function earn(req, res) {
  try {
    const { achievementId } = req.body;
    const achievement = await Achievement.findOne({ id: achievementId });
    if (!achievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }

    const user = await User.findById(req.user._id);
    if (!user.earnedAchievements) user.earnedAchievements = [];

    if (!user.earnedAchievements.includes(achievementId)) {
      user.earnedAchievements.push(achievementId);
      user.totalPoints = (user.totalPoints || 0) + achievement.points;
      user.level = Math.max(1, Math.floor((user.totalPoints || 0) / XP_PER_LEVEL) + 1);
      await user.save();
      return res.json({
        message: 'Achievement earned!',
        achievement,
        totalPoints: user.totalPoints,
      });
    }
    return res.json({ message: 'Achievement already earned' });
  } catch (error) {
    console.error('Earn achievement error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function getStats(req, res) {
  try {
    const user = await User.findById(req.user._id);
    const totalAchievements = await Achievement.countDocuments({ isActive: true });
    const earnedCount = user.earnedAchievements ? user.earnedAchievements.length : 0;
    return res.json({
      totalAchievements,
      earnedCount,
      totalPoints: user.totalPoints || 0,
      completionPercentage:
        totalAchievements > 0 ? Math.round((earnedCount / totalAchievements) * 100) : 0,
    });
  } catch (error) {
    console.error('Get achievement stats error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function check(req, res) {
  try {
    const { newlyEarned, user } = await achievementService.checkProgress(req.user._id, req.body);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({
      newlyEarned,
      totalPoints: user.totalPoints || 0,
      earnedCount: user.earnedAchievements.length,
    });
  } catch (error) {
    console.error('Check achievements error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  getAll,
  getUserAchievements,
  earn,
  getStats,
  check,
};
