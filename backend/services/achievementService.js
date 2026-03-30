const Achievement = require("../models/Achievement");
const User = require("../models/User");
const Module = require("../models/Module");
const lessonXpService = require("./lessonXpService");
const { SYNC_ACHIEVEMENT_CHECKS } = require("../constants/achievementChecks");

const MERGED_GAMESTAT_KEYS = [
  "totalEdits",
  "totalRuns",
  "sessionTime",
  "saveCount",
  "streak",
  "aiCompanionUses",
  "aiHintRequests",
  "aiExplainCodeUses",
  "aiExplainErrorUses",
];

function maxMergedStat(gameStats, progressData, key) {
  const gs = gameStats || {};
  const pd = progressData || {};
  return Math.max(gs[key] || 0, pd[key] || 0);
}

/**
 * Only allowlisted numeric game-stat fields from the client (no raw req.body in merge logic).
 */
function pickClientGameStats(body) {
  if (body === undefined || body === null || typeof body !== "object" || Array.isArray(body)) {
    return {};
  }
  const out = {};
  for (const key of MERGED_GAMESTAT_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(body, key)) continue;
    const v = body[key];
    const n = typeof v === "number" ? v : parseInt(String(v), 10);
    if (Number.isFinite(n) && n >= 0) {
      out[key] = n;
    }
  }
  if (body.debugSession === true) {
    out.debugSession = true;
  }
  return out;
}

/**
 * Merge client payload with user's persisted state so achievements are evaluated
 * against lifetime/canonical data. Persists merged gameStats back to user.
 */
function mergeProgressWithUser(user, progressData) {
  const gs = user.gameStats || {};
  const numeric = Object.fromEntries(
    MERGED_GAMESTAT_KEYS.map((key) => [key, maxMergedStat(gs, progressData, key)]),
  );
  return {
    ...numeric,
    totalPoints: user.totalPoints || 0,
    completedModules:
      (user.completedModules && user.completedModules.length) || 0,
    debugSession: progressData.debugSession || false,
  };
}

function copyMergedStatsToUserDoc(user, merged) {
  for (const key of MERGED_GAMESTAT_KEYS) {
    user.gameStats[key] = merged[key];
  }
}

async function checkCompleteBasicsTrack(user) {
  const basicsModules = await Module.find({
    category: "javascript-basics",
  }).select("_id");
  const completedIds = (user.completedModules || [])
    .map((mod) => {
      const id = mod.moduleId && (mod.moduleId._id || mod.moduleId);
      return id ? id.toString() : null;
    })
    .filter(Boolean);
  return (
    basicsModules.length > 0 &&
    basicsModules.every((mod) => completedIds.includes(mod._id.toString()))
  );
}

async function checkCompleteSetupModule(user) {
  const completedIds = (user.completedModules || [])
    .map((mod) => mod.moduleId && (mod.moduleId._id || mod.moduleId))
    .filter(Boolean);
  const setupModule = await Module.findOne({
    $or: [
      { title: /setup/i },
      { title: /console/i },
      { description: /setup and console/i },
    ],
  }).select("_id");
  return (
    setupModule &&
    completedIds.some((id) => id.toString() === setupModule._id.toString())
  );
}

async function isAchievementRequirementMet(requirement, merged, user, hour) {
  if (requirement === "complete_basics_track") {
    return checkCompleteBasicsTrack(user);
  }
  if (requirement === "complete_setup_module") {
    return checkCompleteSetupModule(user);
  }
  const fn = SYNC_ACHIEVEMENT_CHECKS[requirement];
  if (!fn) return false;
  return fn(merged, hour);
}

async function tryEarnAchievement(user, achievement, merged, hour) {
  if (user.earnedAchievements.includes(achievement.id)) return null;
  const ok = await isAchievementRequirementMet(
    achievement.requirement,
    merged,
    user,
    hour,
  );
  if (!ok) return null;
  user.earnedAchievements.push(achievement.id);
  user.totalPoints = (user.totalPoints || 0) + (achievement.points || 0);
  lessonXpService.syncStoredLevelFromPoints(user);
  return achievement;
}

/**
 * Check and award achievements based on user state + progress. Uses DB as source of truth
 * for totalPoints and completedModules; merges and persists gameStats.
 * @param {string} userId - User _id
 * @param {object} progressData - Client payload (totalEdits, totalRuns, streak, etc.)
 * @returns {Promise<{ newlyEarned: Array, user: object }>}
 */
async function checkProgress(userId, progressData) {
  const user = await User.findById(userId);
  if (!user) return { newlyEarned: [], user: null };
  if (!user.earnedAchievements) user.earnedAchievements = [];
  if (!user.gameStats) user.gameStats = {};

  const safeProgress = pickClientGameStats(progressData);
  const merged = mergeProgressWithUser(user, safeProgress);
  copyMergedStatsToUserDoc(user, merged);

  const allAchievements = await Achievement.find({ isActive: true });
  const hour = new Date().getHours();
  const newlyEarned = [];

  for (const achievement of allAchievements) {
    const earned = await tryEarnAchievement(user, achievement, merged, hour);
    if (earned) newlyEarned.push(earned);
  }

  await user.save();
  return { newlyEarned, user };
}

/**
 * Grant the "signup" achievement (e.g. id 1) to a user. Call after user creation.
 */
async function grantSignupAchievement(userId) {
  const achievement = await Achievement.findOne({
    requirement: "signup",
    isActive: true,
  });
  if (!achievement) return;
  const user = await User.findById(userId);
  if (!user || (user.earnedAchievements || []).includes(achievement.id)) return;
  user.earnedAchievements = user.earnedAchievements || [];
  user.earnedAchievements.push(achievement.id);
  user.totalPoints = (user.totalPoints || 0) + (achievement.points || 0);
  lessonXpService.syncStoredLevelFromPoints(user);
  await user.save();
}

module.exports = {
  checkProgress,
  grantSignupAchievement,
  mergeProgressWithUser,
  pickClientGameStats,
};
