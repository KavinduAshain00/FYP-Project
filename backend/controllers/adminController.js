const User = require('../models/User');
const Achievement = require('../models/Achievement');
const { isAdmin } = require('../utils/admin');
const { XP_PER_LEVEL } = require('../constants/levelRanks');
const aiService = require('../services/aiService');

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
    earnedAchievements: user.earnedAchievements || [],
    gameStats: user.gameStats || {},
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    isAdmin: isAdmin(user),
  };
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/**
 * GET /api/admin/users - List users with pagination (admin only)
 * Query: page (default 1), limit (default 20, max 100), search (name/email), learningPath (filter by path)
 */
async function listUsers(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE)
    );
    const search = (req.query.search || '').trim().substring(0, 200);
    const learningPath = req.query.learningPath || '';
    const allowedSort = [
      'createdAt',
      'name',
      'email',
      'learningPath',
      'level',
      'totalPoints',
      'updatedAt',
    ];
    const sortBy = allowedSort.includes(req.query.sortBy) ? req.query.sortBy : 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const query = {};
    if (search) {
      const searchRegex = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
      query.$or = [{ name: searchRegex }, { email: searchRegex }];
    }
    if (learningPath && learningPath !== 'all') {
      query.learningPath = learningPath === 'none' ? { $in: [null, '', 'none'] } : learningPath;
    }

    const sortOpt = { [sortBy]: sortOrder };
    if (sortBy !== 'createdAt') sortOpt.createdAt = -1;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .populate(POPULATE_OPTS[0].path, POPULATE_OPTS[0].select)
        .populate(POPULATE_OPTS[1].path, POPULATE_OPTS[1].select)
        .sort(sortOpt)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    const payload = users.map((u) => toAdminUserView(u));
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return res.json({
      users: payload,
      pagination: { total, page, limit, totalPages },
    });
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
 * Allowed: name, email, learningPath, knowsJavaScript
 */
async function updateUser(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, email, learningPath, knowsJavaScript } = req.body;

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
      const valid = ['javascript-basics', 'advanced', 'none'];
      if (valid.includes(learningPath)) {
        user.learningPath = learningPath;
      }
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
    const points = achievement ? achievement.points || 0 : 0;
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
    const user = await User.findOneAndUpdate({ email }, { role: 'admin' }, { new: true });
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
    const email = decodeURIComponent(req.params.email || '')
      .trim()
      .toLowerCase();
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

/**
 * GET /api/admin/stats - Aggregate stats for admin overview (no need to load all users)
 */
async function getStats(req, res) {
  try {
    const [totalUsers, aggregated, recentSignups] = await Promise.all([
      User.countDocuments(),
      User.aggregate([
        {
          $group: {
            _id: null,
            totalXp: { $sum: { $ifNull: ['$totalPoints', 0] } },
            totalLevel: { $sum: { $ifNull: ['$level', 1] } },
          },
        },
        { $project: { totalXp: 1, totalLevel: 1, _id: 0 } },
      ]).then((r) => r[0] || { totalXp: 0, totalLevel: 0 }),
      User.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
        { $sort: { createdAt: -1 } },
        { $limit: 5 },
        { $project: { name: 1, email: 1, createdAt: 1, learningPath: 1 } },
      ]),
    ]);
    const totalCompleted = await User.aggregate([
      { $project: { count: { $size: { $ifNull: ['$completedModules', []] } } } },
      { $group: { _id: null, total: { $sum: '$count' } } },
    ]).then((r) => (r[0] ? r[0].total : 0));
    const avgLevel = totalUsers > 0 ? (aggregated.totalLevel / totalUsers).toFixed(1) : 0;
    return res.json({
      totalUsers,
      totalXp: aggregated.totalXp || 0,
      totalCompleted,
      avgLevel: parseFloat(avgLevel, 10),
      recentSignups,
    });
  } catch (error) {
    console.error('Admin getStats error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

/**
 * POST /api/admin/modules/generate-steps
 * Body: { title, description?, content?, category?, difficulty?, moduleType?, stepCount? }
 */
async function generateModuleSteps(req, res) {
  try {
    const { title, description, content, category, difficulty, moduleType, stepCount } = req.body || {};
    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: 'Title is required to generate steps' });
    }
    const steps = await aiService.generateModuleSteps({
      title: String(title).trim(),
      description: description != null ? String(description) : '',
      content: content != null ? String(content) : '',
      category: category != null ? String(category) : '',
      difficulty: difficulty != null ? String(difficulty) : 'beginner',
      moduleType: moduleType != null ? String(moduleType) : 'vanilla',
      stepCount,
    });
    return res.json({ steps });
  } catch (error) {
    console.error('Admin generateModuleSteps error:', error);
    const message =
      error?.message && String(error.message).includes('GITHUB_TOKEN')
        ? 'AI is not configured (missing GITHUB_TOKEN)'
        : error?.message || 'Failed to generate steps';
    return res.status(500).json({ message });
  }
}

/**
 * POST /api/admin/modules/generate-curriculum
 * Body: { title, description?, content?, category?, difficulty?, moduleType?, parts: ('objectives'|'hints'|'starterCode')[], steps? }
 */
async function generateModuleCurriculum(req, res) {
  try {
    const {
      title,
      description,
      content,
      category,
      difficulty,
      moduleType,
      parts,
      steps,
    } = req.body || {};
    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }
    if (!Array.isArray(parts) || parts.length === 0) {
      return res.status(400).json({
        message: 'parts must be a non-empty array (objectives, hints, starterCode)',
      });
    }
    const result = await aiService.generateModuleCurriculumParts({
      title: String(title).trim(),
      description: description != null ? String(description) : '',
      content: content != null ? String(content) : '',
      category: category != null ? String(category) : '',
      difficulty: difficulty != null ? String(difficulty) : 'beginner',
      moduleType: moduleType != null ? String(moduleType) : 'vanilla',
      parts,
      steps: Array.isArray(steps) ? steps : undefined,
    });
    return res.json(result);
  } catch (error) {
    console.error('Admin generateModuleCurriculum error:', error);
    const message =
      error?.message && String(error.message).includes('GITHUB_TOKEN')
        ? 'AI is not configured (missing GITHUB_TOKEN)'
        : error?.message || 'Failed to generate curriculum content';
    return res.status(500).json({ message });
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
  getStats,
  generateModuleSteps,
  generateModuleCurriculum,
};
