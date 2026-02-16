const Achievement = require('../models/Achievement');
const User = require('../models/User');
const achievementService = require('../services/achievementService');

async function getAll(req, res) {
  try {
    const achievements = await Achievement.find({ isActive: true }).sort({ id: 1 });
    return res.json({ achievements });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
}

async function getUserAchievements(req, res) {
  try {
    const user = await User.findById(req.user._id).select('earnedAchievements');
    const allAchievements = await Achievement.find({ isActive: true }).sort({ id: 1 });
    const earned = user?.earnedAchievements || [];
    const userAchievements = allAchievements.map((ach) => ({
      ...ach.toObject(),
      earned: earned.includes(ach.id),
    }));
    return res.json({ achievements: userAchievements });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
}

async function earn(req, res) {
  try {
    const achievementId = req.body?.achievementId;
    if (achievementId == null) {
      return res.status(400).json({ message: 'achievementId required' });
    }
    const { awarded, achievement, user } = await achievementService.awardAchievement(req.user._id, achievementId);
    if (!achievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }
    if (awarded) {
      return res.json({ message: 'Achievement earned!', achievement, totalPoints: user.totalPoints });
    }
    return res.json({ message: 'Achievement already earned' });
  } catch (err) {
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
  } catch (err) {
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
  } catch (err) {
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
