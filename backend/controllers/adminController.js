const User = require('../models/User');
const Achievement = require('../models/Achievement');
const { isAdmin } = require('../utils/admin');
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
    isAdmin: isAdmin(user),
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

/**
 * POST /api/admin/bootstrap - Set first admin by email (no auth). Only works when there are 0 admins.
 * Body: { email }. User must exist. If BOOTSTRAP_SECRET is set, body must include { secret }.
 */
async function bootstrap(req, res) {
  try {
    const count = await User.countDocuments({ role: 'admin' });
    if (count > 0) {
      return res.status(403).json({ message: 'Bootstrap only allowed when no admins exist' });
    }
    const secret = process.env.BOOTSTRAP_SECRET;
    if (secret && req.body.secret !== secret) {
      return res.status(401).json({ message: 'Invalid or missing bootstrap secret' });
    }
    const email = (req.body.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      return res.status(400).json({ message: 'Valid email required' });
    }
    const user = await User.findOneAndUpdate(
      { email },
      { role: 'admin' },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: 'No user found with this email' });
    }
    return res.status(201).json({ message: 'First admin set', email });
  } catch (error) {
    console.error('Admin bootstrap error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

/**
 * GET /api/admin/admins - List admin emails (admin only)
 */
async function listAdmins(req, res) {
  try {
    const admins = await User.find({ role: 'admin' }).select('email').sort({ email: 1 }).lean();
    return res.json({ admins: admins.map((a) => a.email) });
  } catch (error) {
    console.error('Admin list admins error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

/**
 * POST /api/admin/admins - Set a user as admin by email (admin only). Body: { email }
 */
async function addAdmin(req, res) {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      return res.status(400).json({ message: 'Valid email required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No user found with this email' });
    }
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Already an admin' });
    }
    user.role = 'admin';
    await user.save();
    return res.status(201).json({ message: 'Admin added', email });
  } catch (error) {
    console.error('Admin add admin error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

/**
 * DELETE /api/admin/admins/:email - Revoke admin from a user (admin only). :email is URL-encoded.
 */
async function removeAdmin(req, res) {
  try {
    const email = decodeURIComponent(req.params.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ message: 'Email required' });
    }
    const adminsCount = await User.countDocuments({ role: 'admin' });
    if (adminsCount <= 1) {
      return res.status(400).json({ message: 'Cannot remove the last admin' });
    }
    const user = await User.findOne({ email });
    if (!user || user.role !== 'admin') {
      return res.status(404).json({ message: 'Admin not found' });
    }
    user.role = 'user';
    await user.save();
    return res.json({ message: 'Admin removed', email });
  } catch (error) {
    console.error('Admin remove admin error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

/**
 * POST /api/admin/users/:id/grant-admin - Grant admin to a user by user id (admin only)
 */
async function grantAdminToUser(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'User is already an admin' });
    }
    user.role = 'admin';
    await user.save();
    const updated = await User.findById(user._id)
      .select('-password')
      .populate(POPULATE_OPTS[0].path, POPULATE_OPTS[0].select)
      .populate(POPULATE_OPTS[1].path, POPULATE_OPTS[1].select);
    return res.status(201).json({ message: 'Admin granted', user: toAdminUserView(updated) });
  } catch (error) {
    console.error('Admin grant admin to user error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

/**
 * DELETE /api/admin/users/:id/revoke-admin - Revoke admin from a user by user id (admin only)
 */
async function revokeAdminFromUser(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.role !== 'admin') {
      return res.status(400).json({ message: 'User is not an admin' });
    }
    const adminsCount = await User.countDocuments({ role: 'admin' });
    if (adminsCount <= 1) {
      return res.status(400).json({ message: 'Cannot revoke the last admin' });
    }
    user.role = 'user';
    await user.save();
    const updated = await User.findById(user._id)
      .select('-password')
      .populate(POPULATE_OPTS[0].path, POPULATE_OPTS[0].select)
      .populate(POPULATE_OPTS[1].path, POPULATE_OPTS[1].select);
    return res.json({ message: 'Admin revoked', user: toAdminUserView(updated) });
  } catch (error) {
    console.error('Admin revoke admin from user error:', error);
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
  bootstrap,
  listAdmins,
  addAdmin,
  removeAdmin,
  grantAdminToUser,
  revokeAdminFromUser,
};
