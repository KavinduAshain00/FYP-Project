const User = require('../models/User');
const Module = require('../models/Module');
const Achievement = require('../models/Achievement');

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
    isAdmin: (user.role || 'user') === 'admin',
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
  } catch (err) {
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
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
}

/**
 * PUT /api/admin/users/:id - Update a user (admin only)
 * Allowed: name, email, learningPath, gameStudioEnabled, knowsJavaScript, role
 */
async function updateUser(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, email, learningPath, gameStudioEnabled, knowsJavaScript, role } = req.body;

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
    if (role !== undefined) {
      if (role === 'user' || role === 'admin') {
        user.role = role;
      }
    }

    await user.save();

    const updated = await User.findById(user._id)
      .select('-password')
      .populate(POPULATE_OPTS[0].path, POPULATE_OPTS[0].select)
      .populate(POPULATE_OPTS[1].path, POPULATE_OPTS[1].select);

    return res.json({ message: 'User updated', user: toAdminUserView(updated) });
  } catch (err) {
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
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
}

/**
 * GET /api/admin/stats - Aggregated platform statistics (admin only)
 */
async function getStats(req, res) {
  try {
    const [users, modules, achievements] = await Promise.all([
      User.find().select('totalPoints level learningPath role earnedAchievements createdAt'),
      Module.find().select('category difficulty moduleType contentGenerated estimatedMinutes order'),
      Achievement.find().select('rarity category points isActive'),
    ]);

    const totalUsers = users.length;
    const adminCount = users.filter((u) => u.role === 'admin').length;
    const totalXP = users.reduce((s, u) => s + (u.totalPoints || 0), 0);
    const avgLevel =
      totalUsers > 0
        ? +(users.reduce((s, u) => s + (u.level || 1), 0) / totalUsers).toFixed(1)
        : 0;

    const topUsers = [...users]
      .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
      .slice(0, 5)
      .map((u) => ({
        name: u.name || '(no name)',
        totalPoints: u.totalPoints || 0,
        level: u.level || 1,
        achievements: (u.earnedAchievements || []).length,
      }));

    const pathBreakdown = {};
    users.forEach((u) => {
      const p = u.learningPath || 'none';
      pathBreakdown[p] = (pathBreakdown[p] || 0) + 1;
    });

    const categoryBreakdown = {};
    modules.forEach((m) => {
      const c = m.category || 'unknown';
      categoryBreakdown[c] = (categoryBreakdown[c] || 0) + 1;
    });

    const difficultyBreakdown = {};
    modules.forEach((m) => {
      const d = m.difficulty || 'beginner';
      difficultyBreakdown[d] = (difficultyBreakdown[d] || 0) + 1;
    });

    const aiGenerated = modules.filter((m) => m.contentGenerated).length;

    const rarityBreakdown = {};
    achievements.forEach((a) => {
      const r = a.rarity || 'common';
      rarityBreakdown[r] = (rarityBreakdown[r] || 0) + 1;
    });

    return res.json({
      users: { total: totalUsers, admins: adminCount, totalXP, avgLevel, pathBreakdown, topUsers },
      modules: { total: modules.length, aiGenerated, categoryBreakdown, difficultyBreakdown },
      achievements: { total: achievements.length, rarityBreakdown },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
  getStats,
};
