const User = require("../models/User");
const Module = require("../models/Module");
const Achievement = require("../models/Achievement");
const { buildLevelInfo } = require("../utils/levelSystem");
const { XP_PER_LEVEL } = require("../constants/levelRanks");
const achievementService = require("../services/achievementService");
const { AVATAR_LIST, AVATAR_PRESETS } = require("../constants/avatars");
const { getPathCategories } = require("../constants/learningPath");

const POPULATE = [
  { path: "completedModules.moduleId", select: "title category" },
  { path: "currentModule", select: "title description" },
];
const AI_KEYS = { tone: ["friendly", "formal", "concise"], hintDetail: ["minimal", "moderate", "detailed"], assistanceFrequency: ["low", "normal", "high"] };

function toProfileUser(user) {
  const prefs = user.aiPreferences || {};
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl || "",
    knowsJavaScript: user.knowsJavaScript,
    learningPath: user.learningPath,
    completedModules: user.completedModules,
    currentModule: user.currentModule,
    totalPoints: user.totalPoints || 0,
    level: user.level || 1,
    gameStudioEnabled: user.gameStudioEnabled || false,
    earnedAchievements: user.earnedAchievements || [],
    gameStats: user.gameStats || {},
    isAdmin: (user.role || "user") === "admin",
    aiPreferences: {
      tone: AI_KEYS.tone.includes(prefs.tone) ? prefs.tone : "friendly",
      hintDetail: AI_KEYS.hintDetail.includes(prefs.hintDetail) ? prefs.hintDetail : "moderate",
      assistanceFrequency: AI_KEYS.assistanceFrequency.includes(prefs.assistanceFrequency) ? prefs.assistanceFrequency : "normal",
    },
  };
}

async function getUserWithPopulate(userId) {
  const user = await User.findById(userId).select("-password").populate(POPULATE[0].path, POPULATE[0].select).populate(POPULATE[1].path, POPULATE[1].select);
  return user;
}

/**
 * GET /api/user/avatars
 * Returns avatars with unlock status for the current user (level + achievements).
 */
async function getAvatars(req, res) {
  try {
    const user = await User.findById(req.user._id).select("level earnedAchievements");
    if (!user) return res.status(404).json({ message: "User not found" });
    const level = user.level || 1;
    const earnedSet = new Set((user.earnedAchievements || []).map(Number));
    const achievementNames = Object.fromEntries((await Achievement.find({ isActive: true }).select("id name")).map((a) => [a.id, a.name]));

    const avatars = AVATAR_LIST.map((item, index) => {
      const u = item.unlock;
      let unlocked = true, unlockType = "default", unlockLabel = null, requirementTag = null, unlockedMessage = null;
      if (u.type === "level") {
        unlocked = level >= u.level;
        unlockType = "level";
        requirementTag = `Lv ${u.level}`;
        unlockLabel = unlocked ? requirementTag : `Unlock at level ${u.level}`;
        unlockedMessage = unlocked ? `Unlocked at level ${u.level}` : null;
      } else if (u.type === "achievement") {
        const name = achievementNames[u.achievementId] || `#${u.achievementId}`;
        unlocked = earnedSet.has(u.achievementId);
        unlockType = "achievement";
        requirementTag = name;
        unlockLabel = unlocked ? name : `Unlock: ${name}`;
        unlockedMessage = unlocked ? `Unlocked: ${name}` : null;
      } else {
        unlockedMessage = "Default avatar";
      }
      return { index, url: item.url, unlocked, unlockType, unlockLabel, requirementTag, unlockedMessage };
    });
    return res.json({ avatars });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}

async function getProfile(req, res) {
  try {
    const user = await getUserWithPopulate(req.user._id);
    const payload = toProfileUser(user);
    payload.levelInfo = buildLevelInfo(user.totalPoints || 0, user.level || 1);
    payload.pathCategories = getPathCategories(user.learningPath);
    return res.json({ user: payload });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * GET /api/user/profile/full
 * Returns profile + achievements (with earned) + avatars in one response (Profile page).
 */
async function getProfileFull(req, res) {
  try {
    const user = await getUserWithPopulate(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const profilePayload = toProfileUser(user);
    profilePayload.levelInfo = buildLevelInfo(user.totalPoints || 0, user.level || 1);
    profilePayload.pathCategories = getPathCategories(user.learningPath);

    const earnedSet = new Set((user.earnedAchievements || []).map(Number));
    const allAchievements = await Achievement.find({ isActive: true }).sort({ id: 1 });
    const achievements = allAchievements.map((a) => ({
      ...a.toObject(),
      earned: earnedSet.has(a.id),
    }));

    const level = user.level || 1;
    const achievementNames = Object.fromEntries(
      allAchievements.map((a) => [a.id, a.name])
    );
    const avatars = AVATAR_LIST.map((item, index) => {
      const u = item.unlock;
      let unlocked = true, unlockType = "default", unlockLabel = null, requirementTag = null, unlockedMessage = null;
      if (u.type === "level") {
        unlocked = level >= u.level;
        unlockType = "level";
        requirementTag = `Lv ${u.level}`;
        unlockLabel = unlocked ? requirementTag : `Unlock at level ${u.level}`;
        unlockedMessage = unlocked ? `Unlocked at level ${u.level}` : null;
      } else if (u.type === "achievement") {
        const name = achievementNames[u.achievementId] || `#${u.achievementId}`;
        unlocked = earnedSet.has(u.achievementId);
        unlockType = "achievement";
        requirementTag = name;
        unlockLabel = unlocked ? name : `Unlock: ${name}`;
        unlockedMessage = unlocked ? `Unlocked: ${name}` : null;
      } else {
        unlockedMessage = "Default avatar";
      }
      return { index, url: item.url, unlocked, unlockType, unlockLabel, requirementTag, unlockedMessage };
    });

    return res.json({
      user: profilePayload,
      achievements,
      avatars,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * GET /api/user/modules-context
 * Returns all modules + user profile in one response (Modules page).
 */
async function getModulesContext(req, res) {
  try {
    const user = await getUserWithPopulate(req.user._id);
    const modules = await Module.find({}).sort({ order: 1, createdAt: 1 });
    const profilePayload = toProfileUser(user);
    profilePayload.levelInfo = buildLevelInfo(user.totalPoints || 0, user.level || 1);
    profilePayload.pathCategories = getPathCategories(user.learningPath);
    return res.json({ user: profilePayload, modules });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}

async function getDashboard(req, res) {
  try {
    const user = await getUserWithPopulate(req.user._id);
    const pathCategories = getPathCategories(user.learningPath);
    const query = pathCategories.length ? { category: { $in: pathCategories } } : {};
    const modules = await Module.find(query).sort({ order: 1, createdAt: 1 });
    const completedModuleIds = (user.completedModules || [])
      .map((m) => (m.moduleId?._id || m.moduleId)?.toString())
      .filter(Boolean);
    const nextModule = [...modules].sort((a, b) => (a.order || 0) - (b.order || 0))
      .find((m) => !completedModuleIds.includes(m._id.toString()));
    const allAchievements = await Achievement.find({ isActive: true }).sort({ id: 1 });
    const learningAchievements = allAchievements
      .map((a) => ({ ...a.toObject(), earned: (user.earnedAchievements || []).includes(a.id) }))
      .filter((a) => a.category === "learning" || a.category === "general");

    const userPayload = { ...toProfileUser(user), pathCategories };
    userPayload.levelInfo = buildLevelInfo(user.totalPoints || 0, user.level || 1);
    return res.json({
      user: userPayload,
      modules,
      completedModuleIds,
      nextModuleId: nextModule?._id ?? null,
      nextModule: nextModule ? { _id: nextModule._id, title: nextModule.title } : null,
      completionPercentage: modules.length ? Math.round((completedModuleIds.length / modules.length) * 100) : 0,
      levelInfo: userPayload.levelInfo,
      achievements: learningAchievements,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}

async function completeModule(req, res) {
  try {
    const { moduleId, sessionStats = {} } = req.body;
    const user = await User.findById(req.user._id);
    const module = await Module.findById(moduleId);
    if (!module) return res.status(404).json({ message: "Module not found" });

    const alreadyCompleted = user.completedModules.some(
      (m) => m.moduleId.toString() === moduleId,
    );

    if (!alreadyCompleted) {
      user.completedModules.push({ moduleId });
      const pointsAward = 100;
      user.totalPoints = (user.totalPoints || 0) + pointsAward;
      user.level = Math.max(
        1,
        Math.floor((user.totalPoints || 0) / XP_PER_LEVEL) + 1,
      );
      if (user.currentModule && user.currentModule.toString() === moduleId) {
        user.currentModule = undefined;
      }
      await user.save();
    }

    if (user.learningPath && user.learningPath !== "none") {
      const pathCategories = getPathCategories(user.learningPath);
      if (pathCategories.length) {
        const categoryQuery = { category: { $in: pathCategories } };
        const modulesForPath = await Module.find(categoryQuery).select("_id");
        const completedIds = user.completedModules
          .map((m) => {
            const id = m.moduleId?._id || m.moduleId;
            return id ? id.toString() : null;
          })
          .filter(Boolean);
        const allCompleted = modulesForPath.every((m) =>
          completedIds.includes(m._id.toString()),
        );
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
    const { newlyEarned } = await achievementService.checkProgress(
      req.user._id,
      progressData,
    );

    const updatedUser = await getUserWithPopulate(req.user._id);
    const payload = toProfileUser(updatedUser);
    payload.levelInfo = buildLevelInfo(updatedUser.totalPoints || 0, updatedUser.level || 1);
    return res.json({ message: "Module marked as completed", user: payload, newlyEarned: newlyEarned || [] });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}

async function setCurrentModule(req, res) {
  try {
    const user = await User.findById(req.user._id);
    user.currentModule = req.body.moduleId;
    await user.save();
    const updated = await getUserWithPopulate(req.user._id);
    const payload = toProfileUser(updated);
    payload.levelInfo = buildLevelInfo(updated.totalPoints || 0, updated.level || 1);
    return res.json({ message: "Current module updated", user: payload });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}

async function updateProfile(req, res) {
  try {
    const { name, avatarUrl, avatarPresetId, aiPreferences } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (typeof name === "string" && name.trim()) {
      user.name = name.trim();
    }
    // Avatar: custom URL takes precedence, then preset by index
    if (typeof avatarUrl === "string" && avatarUrl.trim()) {
      user.avatarUrl = avatarUrl.trim();
    } else if (
      typeof avatarPresetId === "number" &&
      avatarPresetId >= 0 &&
      avatarPresetId < AVATAR_PRESETS.length
    ) {
      user.avatarUrl = AVATAR_PRESETS[avatarPresetId];
    } else if (
      avatarPresetId !== undefined &&
      typeof avatarPresetId === "string"
    ) {
      const idx = parseInt(avatarPresetId, 10);
      if (!Number.isNaN(idx) && idx >= 0 && idx < AVATAR_PRESETS.length) {
        user.avatarUrl = AVATAR_PRESETS[idx];
      }
    }
    if (aiPreferences && typeof aiPreferences === "object") {
      if (!user.aiPreferences) user.aiPreferences = {};
      if (AI_KEYS.tone.includes(aiPreferences.tone)) user.aiPreferences.tone = aiPreferences.tone;
      if (AI_KEYS.hintDetail.includes(aiPreferences.hintDetail)) user.aiPreferences.hintDetail = aiPreferences.hintDetail;
      if (AI_KEYS.assistanceFrequency.includes(aiPreferences.assistanceFrequency)) user.aiPreferences.assistanceFrequency = aiPreferences.assistanceFrequency;
    }
    await user.save();
    const updated = await getUserWithPopulate(req.user._id);
    const payload = toProfileUser(updated);
    payload.levelInfo = buildLevelInfo(updated.totalPoints || 0, updated.level || 1);
    return res.json({ message: "Profile updated", user: payload });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  getProfile,
  getProfileFull,
  getDashboard,
  getModulesContext,
  completeModule,
  setCurrentModule,
  updateProfile,
  getAvatars,
};
