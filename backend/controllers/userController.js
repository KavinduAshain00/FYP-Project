const User = require('../models/User');
const Module = require('../models/Module');
const Achievement = require('../models/Achievement');
const crypto = require('crypto');
const { buildLevelInfo } = require('../utils/levelSystem');
const { XP_PER_LEVEL } = require('../constants/levelRanks');
const achievementService = require('../services/achievementService');
const { AVATAR_LIST, AVATAR_PRESETS } = require('../constants/avatars');
const { getPathCategories } = require('../constants/learningPath');
const { isAdmin } = require('../utils/admin');

/** Beginner: only javascript-basics until all completed, then game-development + multiplayer. Advanced: all three from start. */
async function getEffectivePathCategories(user) {
  let pathCategories = getPathCategories(user.learningPath);
  if (user.learningPath === 'javascript-basics' && pathCategories.length > 0) {
    const basicsModules = await Module.find({ category: 'javascript-basics' }).select('_id');
    const basicsIds = new Set(basicsModules.map((m) => m._id.toString()));
    const completedIds = (user.completedModules || [])
      .map((m) => {
        const id = m.moduleId && (m.moduleId._id || m.moduleId);
        return id ? id.toString() : null;
      })
      .filter(Boolean);
    const allBasicsDone =
      basicsIds.size > 0 && [...basicsIds].every((id) => completedIds.includes(id));
    if (allBasicsDone) {
      pathCategories = ['javascript-basics', 'game-development', 'multiplayer'];
    }
  }
  return pathCategories;
}

const POPULATE_OPTS = [
  { path: 'completedModules.moduleId', select: 'title category' },
  { path: 'currentModule', select: 'title description' },
];

const AI_PREFERENCE_KEYS = {
  tone: ['friendly', 'formal', 'concise'],
  hintDetail: ['minimal', 'moderate', 'detailed'],
  assistanceFrequency: ['low', 'normal', 'high'],
};

function toProfileUser(user) {
  const aiPrefs = user.aiPreferences || {};
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
    isAdmin: isAdmin(user),
    aiPreferences: {
      tone: AI_PREFERENCE_KEYS.tone.includes(aiPrefs.tone) ? aiPrefs.tone : 'friendly',
      hintDetail: AI_PREFERENCE_KEYS.hintDetail.includes(aiPrefs.hintDetail)
        ? aiPrefs.hintDetail
        : 'moderate',
      assistanceFrequency: AI_PREFERENCE_KEYS.assistanceFrequency.includes(
        aiPrefs.assistanceFrequency
      )
        ? aiPrefs.assistanceFrequency
        : 'normal',
    },
  };
}

/**
 * GET /api/user/avatars
 * Returns avatars with unlock status for the current user (level + achievements).
 */
async function getAvatars(req, res) {
  try {
    const user = await User.findById(req.user._id).select('level earnedAchievements');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const level = user.level || 1;
    const earnedSet = new Set((user.earnedAchievements || []).map((id) => Number(id)));

    const etagBase = `${level}|${[...earnedSet].sort((a, b) => a - b).join(',')}`;
    const etag = `"${crypto.createHash('sha1').update(etagBase).digest('hex')}"`;
    res.set('ETag', etag);
    if (req.headers['if-none-match'] === etag) {
      return res.status(304).end();
    }

    const achievements = await Achievement.find({ isActive: true }).select('id name');
    const achievementNames = Object.fromEntries(achievements.map((a) => [a.id, a.name]));

    const avatars = AVATAR_LIST.map((item, index) => {
      const u = item.unlock;
      let unlocked = true;
      let unlockType = 'default';
      let unlockLabel = null;
      let requirementTag = null;
      let unlockedMessage;

      if (u.type === 'level') {
        unlocked = level >= u.level;
        unlockType = 'level';
        requirementTag = `Lv ${u.level}`;
        unlockLabel = unlocked ? requirementTag : `Unlock at level ${u.level}`;
        unlockedMessage = unlocked ? `Unlocked at level ${u.level}` : null;
      } else if (u.type === 'achievement') {
        const name = achievementNames[u.achievementId] || `#${u.achievementId}`;
        unlocked = earnedSet.has(u.achievementId);
        unlockType = 'achievement';
        requirementTag = name;
        unlockLabel = unlocked ? name : `Unlock: ${name}`;
        unlockedMessage = unlocked ? `Unlocked: ${name}` : null;
      } else {
        unlockedMessage = 'Default avatar';
      }

      return {
        index,
        url: item.url,
        unlocked,
        unlockType,
        unlockLabel,
        requirementTag: requirementTag || null,
        unlockedMessage,
      };
    });

    return res.json({ avatars });
  } catch (error) {
    console.error('Get avatars error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function getProfile(req, res) {
  const userId = req.user?._id?.toString();
  try {
    console.log('[User] getProfile', { userId });
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate(POPULATE_OPTS[0].path, POPULATE_OPTS[0].select)
      .populate(POPULATE_OPTS[1].path, POPULATE_OPTS[1].select);

    const levelInfo = buildLevelInfo(user.totalPoints || 0, user.level || 1);
    const userPayload = toProfileUser(user);
    userPayload.levelInfo = levelInfo;
    userPayload.pathCategories = await getEffectivePathCategories(user);

    return res.json({ user: userPayload });
  } catch (error) {
    console.error('[User] getProfile error', {
      userId: req.user?._id?.toString(),
      error: error.message,
    });
    return res.status(500).json({ message: 'Server error' });
  }
}

/** Dashboard-only user fields + populated refs for path/completion logic. */
const DASHBOARD_USER_SELECT =
  'name email avatarUrl totalPoints level learningPath earnedAchievements completedModules currentModule';

async function getDashboard(req, res) {
  const userId = req.user?._id?.toString();
  try {
    console.log('[User] getDashboard', { userId });
    const user = await User.findById(req.user._id)
      .select(DASHBOARD_USER_SELECT)
      .populate('completedModules.moduleId', '_id')
      .populate('currentModule', '_id title')
      .lean();

    const levelInfo = buildLevelInfo(user.totalPoints || 0, user.level || 1);
    const pathCategories = await getEffectivePathCategories(user);

    const query = pathCategories.length ? { category: { $in: pathCategories } } : {};
    const modules = await Module.find(query)
      .select('_id title description difficulty category order')
      .sort({ order: 1, createdAt: 1 })
      .lean();

    const completedModuleIds = (user.completedModules || [])
      .map((m) => {
        const id = m.moduleId?._id || m.moduleId;
        return id ? id.toString() : null;
      })
      .filter(Boolean);

    const modulePath = [...modules].sort((a, b) => (a.order || 0) - (b.order || 0));
    const nextModule = modulePath.find((m) => !completedModuleIds.includes(m._id.toString()));
    const completionPercentage =
      modules.length > 0 ? Math.round((completedModuleIds.length / modules.length) * 100) : 0;

    const learningAchievements = await Achievement.find({
      isActive: true,
      category: { $in: ['learning', 'general'] },
    })
      .select('id name icon')
      .sort({ id: 1 })
      .lean();
    const earnedSet = new Set((user.earnedAchievements || []).map(String));
    const achievements = learningAchievements.map((a) => ({
      id: a.id,
      name: a.name,
      icon: a.icon,
      earned: earnedSet.has(String(a.id)),
    }));

    const userPayload = {
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl || '',
      levelInfo,
      pathCategories,
      learningPath: user.learningPath,
      currentModule: user.currentModule
        ? { _id: user.currentModule._id, title: user.currentModule.title }
        : null,
    };

    return res.json({
      user: userPayload,
      modules,
      completedModuleIds,
      nextModuleId: nextModule ? nextModule._id : null,
      nextModule: nextModule ? { _id: nextModule._id, title: nextModule.title } : null,
      completionPercentage,
      levelInfo,
      achievements,
    });
  } catch (error) {
    console.error('[User] getDashboard error', {
      userId: req.user?._id?.toString(),
      error: error.message,
    });
    return res.status(500).json({ message: 'Server error' });
  }
}

async function completeModule(req, res) {
  const userId = req.user?._id?.toString();
  const { moduleId, sessionStats = {} } = req.body;
  try {
    console.log('[User] completeModule', { userId, moduleId });
    const user = await User.findById(req.user._id);
    const module = await Module.findById(moduleId);
    if (!module) return res.status(404).json({ message: 'Module not found' });

    const before = {
      totalPoints: user.totalPoints || 0,
      level: user.level || 1,
      currentModule: user.currentModule ? user.currentModule.toString() : null,
      completedCount: (user.completedModules || []).length,
      earnedAchievements: Array.isArray(user.earnedAchievements)
        ? [...user.earnedAchievements]
        : [],
    };

    const alreadyCompleted = user.completedModules.some((m) => m.moduleId.toString() === moduleId);

    if (!alreadyCompleted) {
      user.completedModules.push({ moduleId });
      const pointsAward = 100;
      user.totalPoints = (user.totalPoints || 0) + pointsAward;
      user.level = Math.max(1, Math.floor((user.totalPoints || 0) / XP_PER_LEVEL) + 1);
      if (user.currentModule && user.currentModule.toString() === moduleId) {
        user.currentModule = undefined;
      }
      await user.save();
    }

    const completedCount = user.completedModules.length;
    const progressData = {
      ...sessionStats,
      totalPoints: user.totalPoints || 0,
      completedModules: completedCount,
    };
    const { newlyEarned } = await achievementService.checkProgress(req.user._id, progressData);

    const afterUser = await User.findById(req.user._id)
      .select('totalPoints level currentModule completedModules earnedAchievements')
      .lean();
    const after = {
      totalPoints: afterUser?.totalPoints || 0,
      level: afterUser?.level || 1,
      currentModule: afterUser?.currentModule ? afterUser.currentModule.toString() : null,
      completedCount: (afterUser?.completedModules || []).length,
      earnedAchievements: Array.isArray(afterUser?.earnedAchievements)
        ? [...afterUser.earnedAchievements]
        : [],
    };

    const delta = {};
    if (!alreadyCompleted) {
      delta.completedModulesAdd = [moduleId];
      delta.completedModulesCount = after.completedCount;
    }
    if (after.totalPoints !== before.totalPoints) delta.totalPoints = after.totalPoints;
    if (after.level !== before.level) delta.level = after.level;
    if (before.currentModule !== after.currentModule) delta.currentModule = after.currentModule;
    if ((newlyEarned || []).length > 0) {
      const beforeSet = new Set(before.earnedAchievements.map(Number));
      const added = (newlyEarned || [])
        .map((a) => a?.id)
        .filter((id) => typeof id === 'number' && !beforeSet.has(id));
      if (added.length > 0) delta.earnedAchievementsAdd = added;
    }
    if (Object.keys(delta).length > 0) {
      delta.levelInfo = buildLevelInfo(after.totalPoints || 0, after.level || 1);
    }

    console.log('[User] completeModule success', {
      userId,
      moduleId,
      newlyEarned: (newlyEarned || []).length,
    });
    return res.json({
      message: 'Module marked as completed',
      delta,
      newlyEarned: newlyEarned || [],
    });
  } catch (error) {
    console.error('[User] completeModule error', { userId, moduleId, error: error.message });
    return res.status(500).json({ message: 'Server error' });
  }
}

async function setCurrentModule(req, res) {
  const userId = req.user?._id?.toString();
  try {
    console.log('[User] setCurrentModule', { userId, moduleId: req.body?.moduleId });
    const { moduleId } = req.body;
    if (!moduleId) return res.status(400).json({ message: 'moduleId is required' });
    const [user, module] = await Promise.all([
      User.findById(req.user._id),
      Module.findById(moduleId).select('_id category order'),
    ]);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!module) return res.status(404).json({ message: 'Module not found' });

    const beforeCurrent = user.currentModule ? user.currentModule.toString() : null;

    // Enforce beginner path gating server-side (prevents URL / API bypass)
    if (user.learningPath === 'javascript-basics') {
      const completedIds = (user.completedModules || [])
        .map((m) => {
          const id = m.moduleId && (m.moduleId._id || m.moduleId);
          return id ? id.toString() : null;
        })
        .filter(Boolean);

      const basicsModules = await Module.find({ category: 'javascript-basics' })
        .select('_id order')
        .sort({ order: 1, createdAt: 1 })
        .lean();
      const basicsIds = basicsModules.map((m) => m._id.toString());
      const allBasicsDone =
        basicsIds.length > 0 && basicsIds.every((id) => completedIds.includes(id));

      // Lock all non-JS modules until all JS basics are completed
      if (module.category !== 'javascript-basics' && !allBasicsDone) {
        return res
          .status(403)
          .json({ message: 'Complete all JavaScript basics modules to unlock other modules' });
      }

      // Within JS basics, prevent skipping ahead (must complete previous module first)
      if (module.category === 'javascript-basics') {
        const idx = basicsIds.indexOf(module._id.toString());
        if (idx > 0) {
          const prevId = basicsIds[idx - 1];
          if (!completedIds.includes(prevId)) {
            return res
              .status(403)
              .json({ message: 'Complete the previous JavaScript basics module first' });
          }
        }
      }
    }

    user.currentModule = moduleId;
    await user.save();

    const afterCurrent = moduleId?.toString?.() || String(moduleId);
    const delta = {};
    if (beforeCurrent !== afterCurrent) delta.currentModule = afterCurrent;
    return res.json({ message: 'Current module updated', delta });
  } catch (error) {
    console.error('Set current module error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function updateProfile(req, res) {
  const userId = req.user?._id?.toString();
  try {
    console.log('[User] updateProfile', { userId, hasAiPrefs: Boolean(req.body?.aiPreferences) });
    const { name, avatarUrl, avatarPresetId, aiPreferences } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const before = {
      name: user.name,
      avatarUrl: user.avatarUrl || '',
      aiPreferences: user.aiPreferences ? { ...user.aiPreferences } : null,
    };

    if (typeof name === 'string' && name.trim()) {
      user.name = name.trim();
    }
    // Avatar: custom URL takes precedence, then preset by index
    if (typeof avatarUrl === 'string' && avatarUrl.trim()) {
      user.avatarUrl = avatarUrl.trim();
    } else if (
      typeof avatarPresetId === 'number' &&
      avatarPresetId >= 0 &&
      avatarPresetId < AVATAR_PRESETS.length
    ) {
      user.avatarUrl = AVATAR_PRESETS[avatarPresetId];
    } else if (avatarPresetId !== undefined && typeof avatarPresetId === 'string') {
      const idx = parseInt(avatarPresetId, 10);
      if (!Number.isNaN(idx) && idx >= 0 && idx < AVATAR_PRESETS.length) {
        user.avatarUrl = AVATAR_PRESETS[idx];
      }
    }
    // UC8: AI Companion preferences (tone, hint detail, assistance frequency)
    if (aiPreferences && typeof aiPreferences === 'object') {
      if (!user.aiPreferences) user.aiPreferences = {};
      if (AI_PREFERENCE_KEYS.tone.includes(aiPreferences.tone)) {
        user.aiPreferences.tone = aiPreferences.tone;
      }
      if (AI_PREFERENCE_KEYS.hintDetail.includes(aiPreferences.hintDetail)) {
        user.aiPreferences.hintDetail = aiPreferences.hintDetail;
      }
      if (AI_PREFERENCE_KEYS.assistanceFrequency.includes(aiPreferences.assistanceFrequency)) {
        user.aiPreferences.assistanceFrequency = aiPreferences.assistanceFrequency;
      }
    }
    await user.save();

    const after = {
      name: user.name,
      avatarUrl: user.avatarUrl || '',
      aiPreferences: user.aiPreferences ? { ...user.aiPreferences } : null,
    };
    const delta = {};
    if (after.name !== before.name) delta.name = after.name;
    if (after.avatarUrl !== before.avatarUrl) delta.avatarUrl = after.avatarUrl;
    if (JSON.stringify(after.aiPreferences) !== JSON.stringify(before.aiPreferences))
      delta.aiPreferences = after.aiPreferences;

    return res.json({ message: 'Profile updated', delta });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

/**
 * PUT /api/user/password - Change password (auth required). Body: { currentPassword, newPassword }
 */
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      return res.status(400).json({ message: 'Current password and new password required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  getProfile,
  getDashboard,
  completeModule,
  setCurrentModule,
  updateProfile,
  getAvatars,
  changePassword,
};
