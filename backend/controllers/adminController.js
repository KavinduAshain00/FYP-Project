const User = require('../models/User');
const Achievement = require('../models/Achievement');
const { isAdminEmail } = require('../utils/admin');
const { XP_PER_LEVEL } = require('../constants/levelRanks');

const POPULATE_OPTS = [
  { path: 'completedModules.moduleId', select: 'title category' },
  { path: 'currentModule', select: 'title description' },
];

function toAdminUserView(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl || '',
    knowsJavaScript: user.knowsJavaScript,
    learningPath: user.learningPath,
    completedModules: user.completedModules,
    currentModule: user.currentModule,
    totalPoints: user.totalPoints || 0,
    level: user.level || 1,
    gameStudioEnabled: user.gameStudioEnabled ?? false,
    earnedAchievements: user.earnedAchievements || [],
    gameStats: user.gameStats || {},
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    isAdmin: isAdminEmail(user.email),
  };
}

/**
 * GET /api/admin/users - List all users (admin only)
 */
async function listUsers(req, res) {
  try {
    const users = await User.find()
      .select('-password')
      .populate(POPULATE_OPTS[0].path, POPULATE_OPTS[0].select)
      .populate(POPULATE_OPTS[1].path, POPULATE_OPTS[1].select)
      .sort({ createdAt: -1 });

    const payload = users.map((u) => toAdminUserView(u));
    return res.json({ users: payload });
  } catch (error) {
    console.error('Admin list users error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

/**
 * GET /api/admin/users/:id - Get one user (admin only)
 */
async function getUserById(req, res) {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate(POPULATE_OPTS[0].path, POPULATE_OPTS[0].select)
      .populate(POPULATE_OPTS[1].path, POPULATE_OPTS[1].select);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({ user: toAdminUserView(user) });
  } catch (error) {
    console.error('Admin get user error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

/**
 * PUT /api/admin/users/:id - Update a user (admin only)
 * Allowed: name, email, learningPath, gameStudioEnabled, knowsJavaScript
 */
async function updateUser(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, email, learningPath, gameStudioEnabled, knowsJavaScript } = req.body;

    if (typeof name === 'string' && name.trim()) {
      user.name = name.trim();
    }
    if (typeof email === 'string' && email.trim()) {
      const normalized = email.trim().toLowerCase();
      const existing = await User.findOne({ email: normalized, _id: { $ne: user._id } });
      if (existing) {
        return res.status(400).json({ message: 'Another user already has this email' });
      }
      user.email = normalized;
    }
    if (learningPath !== undefined) {
      const valid = [
        'javascript-basics',
        'game-development',
        'react-basics',
        'multiplayer',
        'advanced-concepts',
        'advanced',
        'none',
      ];
      if (valid.includes(learningPath)) {
        user.learningPath = learningPath;
      }
    }
    if (typeof gameStudioEnabled === 'boolean') {
      user.gameStudioEnabled = gameStudioEnabled;
    }
    if (typeof knowsJavaScript === 'boolean') {
      user.knowsJavaScript = knowsJavaScript;
    }

    await user.save();

    const updated = await User.findById(user._id)
      .select('-password')
      .populate(POPULATE_OPTS[0].path, POPULATE_OPTS[0].select)
      .populate(POPULATE_OPTS[1].path, POPULATE_OPTS[1].select);

    return res.json({ message: 'User updated', user: toAdminUserView(updated) });
  } catch (error) {
    console.error('Admin update user error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

/**
 * DELETE /api/admin/users/:id - Delete a user (admin only)
 */
async function deleteUser(req, res) {
  try {
    const targetId = req.params.id;
    if (req.user._id.toString() === targetId) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(targetId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

/**
 * POST /api/admin/users/:id/achievements - Grant an achievement to a user (admin only)
 */
async function grantAchievement(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const achievementId = Number(req.body.achievementId);
    if (!Number.isInteger(achievementId)) {
      return res.status(400).json({ message: 'achievementId must be a number' });
    }
    const achievement = await Achievement.findOne({ id: achievementId, isActive: true });
    if (!achievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }
    if (!user.earnedAchievements) user.earnedAchievements = [];
    if (user.earnedAchievements.includes(achievementId)) {
      return res.status(400).json({ message: 'User already has this achievement' });
    }
    user.earnedAchievements.push(achievementId);
    user.totalPoints = (user.totalPoints || 0) + (achievement.points || 0);
    user.level = Math.max(1, Math.floor((user.totalPoints || 0) / XP_PER_LEVEL) + 1);
    await user.save();
    return res.json({ message: 'Achievement granted', user: toAdminUserView(user) });
  } catch (error) {
    console.error('Admin grant achievement error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

/**
 * DELETE /api/admin/users/:id/achievements/:achievementId - Revoke an achievement (admin only)
 */
async function revokeAchievement(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const achievementId = Number(req.params.achievementId);
    if (!Number.isInteger(achievementId)) {
      return res.status(400).json({ message: 'achievementId must be a number' });
    }
    const achievement = await Achievement.findOne({ id: achievementId });
    const points = achievement ? (achievement.points || 0) : 0;
    if (!user.earnedAchievements) user.earnedAchievements = [];
    user.earnedAchievements = user.earnedAchievements.filter((id) => id !== achievementId);
    user.totalPoints = Math.max(0, (user.totalPoints || 0) - points);
    user.level = Math.max(1, Math.floor((user.totalPoints || 0) / XP_PER_LEVEL) + 1);
    await user.save();
    return res.json({ message: 'Achievement revoked', user: toAdminUserView(user) });
  } catch (error) {
    console.error('Admin revoke achievement error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
  grantAchievement,
  revokeAchievement,
};
