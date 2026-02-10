const User = require('../models/User');
const Module = require('../models/Module');
const Achievement = require('../models/Achievement');
const { buildLevelInfo } = require('../utils/levelSystem');
const { XP_PER_LEVEL } = require('../constants/levelRanks');
const achievementService = require('../services/achievementService');
const { AVATAR_LIST, AVATAR_PRESETS } = require('../constants/avatars');
const { getPathCategories } = require('../constants/learningPath');
const { isAdminEmail } = require('../utils/admin');

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
    gameStudioEnabled: user.gameStudioEnabled || false,
    earnedAchievements: user.earnedAchievements || [],
    gameStats: user.gameStats || {},
    isAdmin: isAdminEmail(user.email),
    aiPreferences: {
      tone: AI_PREFERENCE_KEYS.tone.includes(aiPrefs.tone) ? aiPrefs.tone : 'friendly',
      hintDetail: AI_PREFERENCE_KEYS.hintDetail.includes(aiPrefs.hintDetail) ? aiPrefs.hintDetail : 'moderate',
      assistanceFrequency: AI_PREFERENCE_KEYS.assistanceFrequency.includes(aiPrefs.assistanceFrequency) ? aiPrefs.assistanceFrequency : 'normal',
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
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate(POPULATE_OPTS[0].path, POPULATE_OPTS[0].select)
      .populate(POPULATE_OPTS[1].path, POPULATE_OPTS[1].select);

    const levelInfo = buildLevelInfo(user.totalPoints || 0, user.level || 1);
    const userPayload = toProfileUser(user);
    userPayload.levelInfo = levelInfo;
    userPayload.pathCategories = getPathCategories(user.learningPath);

    return res.json({ user: userPayload });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function getDashboard(req, res) {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate(POPULATE_OPTS[0].path, POPULATE_OPTS[0].select)
      .populate(POPULATE_OPTS[1].path, POPULATE_OPTS[1].select);

    const levelInfo = buildLevelInfo(user.totalPoints || 0, user.level || 1);
    const userPayload = toProfileUser(user);
    userPayload.levelInfo = levelInfo;

    const pathCategories = getPathCategories(user.learningPath);
    const query = pathCategories.length
      ? { category: { $in: pathCategories } }
      : {};
    const modules = await Module.find(query).sort({ order: 1, createdAt: 1 });

    const completedModuleIds = (user.completedModules || []).map((m) => {
      const id = m.moduleId?._id || m.moduleId;
      return id ? id.toString() : null;
    }).filter(Boolean);

    const modulePath = [...modules].sort((a, b) => (a.order || 0) - (b.order || 0));
    const nextModule = modulePath.find((m) => !completedModuleIds.includes(m._id.toString()));
    const completionPercentage = modules.length > 0 ? Math.round((completedModuleIds.length / modules.length) * 100) : 0;

    const allAchievements = await Achievement.find({ isActive: true }).sort({ id: 1 });
    const achievements = allAchievements.map((ach) => ({
      ...ach.toObject(),
      earned: (user.earnedAchievements || []).includes(ach.id),
    }));
    const learningAchievements = achievements.filter(
      (a) => a.category === 'learning' || a.category === 'general'
    );

    return res.json({
      user: { ...userPayload, pathCategories },
      modules,
      completedModuleIds,
      nextModuleId: nextModule ? nextModule._id : null,
      nextModule: nextModule ? { _id: nextModule._id, title: nextModule.title } : null,
      completionPercentage,
      levelInfo,
      achievements: learningAchievements,
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function completeModule(req, res) {
  try {
    const { moduleId, sessionStats = {} } = req.body;
    const user = await User.findById(req.user._id);
    const module = await Module.findById(moduleId);
    if (!module) return res.status(404).json({ message: 'Module not found' });

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

    if (user.learningPath && user.learningPath !== 'none') {
      const pathCategories = getPathCategories(user.learningPath);
      if (pathCategories.length) {
        const categoryQuery = { category: { $in: pathCategories } };
        const modulesForPath = await Module.find(categoryQuery).select('_id');
        const completedIds = user.completedModules.map((m) => {
          const id = m.moduleId?._id || m.moduleId;
          return id ? id.toString() : null;
        }).filter(Boolean);
        const allCompleted = modulesForPath.every((m) => completedIds.includes(m._id.toString()));
        if (allCompleted && !user.gameStudioEnabled) {
          user.gameStudioEnabled = true;
          await user.save();
        }
      }
    }

    const completedCount = user.completedModules.length;
    const progressData = {
      ...sessionStats,
      totalPoints: user.totalPoints || 0,
      completedModules: completedCount,
    };
    const { newlyEarned } = await achievementService.checkProgress(req.user._id, progressData);

    const updatedUser = await User.findById(req.user._id)
      .select('-password')
      .populate(POPULATE_OPTS[0].path, POPULATE_OPTS[0].select)
      .populate(POPULATE_OPTS[1].path, POPULATE_OPTS[1].select);

    const payload = toProfileUser(updatedUser);
    payload.levelInfo = buildLevelInfo(updatedUser.totalPoints || 0, updatedUser.level || 1);
    return res.json({
      message: 'Module marked as completed',
      user: payload,
      newlyEarned: newlyEarned || [],
    });
  } catch (error) {
    console.error('Complete module error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function setCurrentModule(req, res) {
  try {
    const { moduleId } = req.body;
    const user = await User.findById(req.user._id);
    user.currentModule = moduleId;
    await user.save();

    const updatedUser = await User.findById(req.user._id)
      .select('-password')
      .populate(POPULATE_OPTS[0].path, POPULATE_OPTS[0].select)
      .populate(POPULATE_OPTS[1].path, POPULATE_OPTS[1].select);

    const payload = toProfileUser(updatedUser);
    payload.levelInfo = buildLevelInfo(updatedUser.totalPoints || 0, updatedUser.level || 1);
    return res.json({ message: 'Current module updated', user: payload });
  } catch (error) {
    console.error('Set current module error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function updateProfile(req, res) {
  try {
    const { name, avatarUrl, avatarPresetId, aiPreferences } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (typeof name === 'string' && name.trim()) {
      user.name = name.trim();
    }
    // Avatar: custom URL takes precedence, then preset by index
    if (typeof avatarUrl === 'string' && avatarUrl.trim()) {
      user.avatarUrl = avatarUrl.trim();
    } else if (typeof avatarPresetId === 'number' && avatarPresetId >= 0 && avatarPresetId < AVATAR_PRESETS.length) {
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

    const updatedUser = await User.findById(req.user._id)
      .select('-password')
      .populate(POPULATE_OPTS[0].path, POPULATE_OPTS[0].select)
      .populate(POPULATE_OPTS[1].path, POPULATE_OPTS[1].select);

    const payload = toProfileUser(updatedUser);
    payload.levelInfo = buildLevelInfo(updatedUser.totalPoints || 0, updatedUser.level || 1);
    return res.json({ message: 'Profile updated', user: payload });
  } catch (error) {
    console.error('Update profile error:', error);
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
};
