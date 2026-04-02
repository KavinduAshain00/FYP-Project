const Achievement = require("../models/Achievement");
const User = require("../models/User");
const Module = require("../models/Module");
const lessonXpService = require("./lessonXpService");

/**
 * GAME_STAT_NUMERIC_KEYS - Counters merged with Math.max(server, client).
 */
const GAME_STAT_NUMERIC_KEYS = [
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

/**
 * mergeProgressWithUser - Snapshot for rules; totalPoints and module count from DB only.
 */
function mergeProgressWithUser(user, progressData) {
  const gs = user.gameStats || {};
  const pd = progressData || {};
  const merged = {};
  for (const key of GAME_STAT_NUMERIC_KEYS) {
    merged[key] = Math.max(Number(gs[key]) || 0, Number(pd[key]) || 0);
  }
  merged.totalPoints = user.totalPoints || 0;
  merged.completedModules =
    (user.completedModules && user.completedModules.length) || 0;
  merged.debugSession = Boolean(pd.debugSession);
  return merged;
}

/**
 * writeGameStatsFromMerged - Write merged numeric stats onto user.gameStats.
 */
function writeGameStatsFromMerged(user, merged) {
  if (!user.gameStats) user.gameStats = {};
  for (const key of GAME_STAT_NUMERIC_KEYS) {
    user.gameStats[key] = merged[key];
  }
}

/**
 * completedModuleIdStrings - Completed module ObjectIds as strings for track checks.
 */
function completedModuleIdStrings(user) {
  return (user.completedModules || [])
    .map((m) => {
      const id = m.moduleId && (m.moduleId._id || m.moduleId);
      return id ? id.toString() : null;
    })
    .filter(Boolean);
}

/**
 * loadTrackFlags - basicsAllDone + setupDone (two queries per checkProgress).
 */
async function loadTrackFlags(user) {
  const completedIds = completedModuleIdStrings(user);

  const basicsModules = await Module.find({ category: "javascript-basics" })
    .select("_id")
    .lean();
  const basicsAllDone =
    basicsModules.length > 0 &&
    basicsModules.every((m) => completedIds.includes(m._id.toString()));

  const setupModule = await Module.findOne({
    $or: [
      { title: /setup/i },
      { title: /console/i },
      { description: /setup and console/i },
    ],
  })
    .select("_id")
    .lean();
  const setupDone =
    Boolean(setupModule) &&
    completedIds.includes(setupModule._id.toString());

  return { basicsAllDone, setupDone };
}

/**
 * buildRequirementEvaluators - Map Achievement.requirement string to predicate(ctx).
 * Note: signup is only granted in grantSignupAchievement, not in checkProgress.
 */
function buildRequirementEvaluators(hour) {
  const m = (fn) => (ctx) => fn(ctx.merged);
  return {
    complete_1_module: m((x) => x.completedModules >= 1),
    complete_3_modules: m((x) => x.completedModules >= 3),
    complete_5_modules: m((x) => x.completedModules >= 5),
    complete_10_modules: m((x) => x.completedModules >= 10),
    complete_15_modules: m((x) => x.completedModules >= 15),
    complete_20_modules: m((x) => x.completedModules >= 20),
    points_100: m((x) => x.totalPoints >= 100),
    points_250: m((x) => x.totalPoints >= 250),
    points_500: m((x) => x.totalPoints >= 500),
    points_750: m((x) => x.totalPoints >= 750),
    points_1000: m((x) => x.totalPoints >= 1000),
    points_1500: m((x) => x.totalPoints >= 1500),
    complete_basics_track: (ctx) => ctx.basicsAllDone,
    complete_setup_module: (ctx) => ctx.setupDone,
    edit_1_time: m((x) => x.totalEdits >= 1),
    edit_10_times: m((x) => x.totalEdits >= 10),
    edit_50_times: m((x) => x.totalEdits >= 50),
    edit_100_times: m((x) => x.totalEdits >= 100),
    streak_5: m((x) => x.streak >= 5),
    streak_10: m((x) => x.streak >= 10),
    session_10_min: m((x) => x.sessionTime >= 10),
    session_30_min: m((x) => x.sessionTime >= 30),
    session_60_min: m((x) => x.sessionTime >= 60),
    run_10_times: m((x) => x.totalRuns >= 10),
    run_25_times: m((x) => x.totalRuns >= 25),
    run_50_times: m((x) => x.totalRuns >= 50),
    save_5_times: m((x) => x.saveCount >= 5),
    code_night: m(
      (x) => hour >= 0 && hour < 6 && x.totalEdits > 0,
    ),
    debug_session: m((x) => x.debugSession),
    ai_companion_first_use: m((x) => x.aiCompanionUses >= 1),
    ai_hint_3: m((x) => x.aiHintRequests >= 3),
    ai_companion_10_uses: m((x) => x.aiCompanionUses >= 10),
    ai_companion_25_uses: m((x) => x.aiCompanionUses >= 25),
    ai_hint_10: m((x) => x.aiHintRequests >= 10),
    ai_hint_25: m((x) => x.aiHintRequests >= 25),
    ai_explain_code_once: m((x) => x.aiExplainCodeUses >= 1),
    ai_explain_code_5: m((x) => x.aiExplainCodeUses >= 5),
    ai_explain_error_once: m((x) => x.aiExplainErrorUses >= 1),
    ai_explain_error_5: m((x) => x.aiExplainErrorUses >= 5),
  };
}

/**
 * grantAchievementToUser - Append id, add points, sync level; push doc into newlyEarned.
 */
function grantAchievementToUser(user, achievement, newlyEarned) {
  user.earnedAchievements.push(achievement.id);
  user.totalPoints = (user.totalPoints || 0) + (achievement.points || 0);
  lessonXpService.syncStoredLevelFromPoints(user);
  newlyEarned.push(achievement);
}

/**
 * checkProgress - Used by POST /api/achievements/check and PUT /user/module/complete.
 * Body progressData merges into gameStats; returns { newlyEarned, user }.
 */
async function checkProgress(userId, progressData) {
  const user = await User.findById(userId);
  if (!user) return { newlyEarned: [], user: null };
  if (!user.earnedAchievements) user.earnedAchievements = [];

  const merged = mergeProgressWithUser(user, progressData);
  writeGameStatsFromMerged(user, merged);

  const hour = new Date().getHours();
  const { basicsAllDone, setupDone } = await loadTrackFlags(user);
  const ctx = { merged, basicsAllDone, setupDone };
  const evaluators = buildRequirementEvaluators(hour);

  const allAchievements = await Achievement.find({ isActive: true });
  const newlyEarned = [];
  const earned = new Set(user.earnedAchievements);

  for (const achievement of allAchievements) {
    if (earned.has(achievement.id)) continue;
    const test = evaluators[achievement.requirement];
    if (!test || !test(ctx)) continue;
    grantAchievementToUser(user, achievement, newlyEarned);
    earned.add(achievement.id);
  }

  await user.save();
  return { newlyEarned, user };
}

/**
 * grantSignupAchievement - Called after POST /auth/signup; awards requirement "signup" once.
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
  grantAchievementToUser(user, achievement, []);
  await user.save();
}

module.exports = {
  checkProgress,
  grantSignupAchievement,
  mergeProgressWithUser,
};
