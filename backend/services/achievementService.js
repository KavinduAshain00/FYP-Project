const Achievement = require('../models/Achievement');
const User = require('../models/User');
const Module = require('../models/Module');
const { XP_PER_LEVEL } = require('../constants/levelRanks');

/**
 * Merge client payload with user's persisted state so achievements are evaluated
 * against lifetime/canonical data. Persists merged gameStats back to user.
 */
function mergeProgressWithUser(user, progressData) {
  const gs = user.gameStats || {};
  const totalEdits = Math.max(gs.totalEdits || 0, progressData.totalEdits || 0);
  const totalRuns = Math.max(gs.totalRuns || 0, progressData.totalRuns || 0);
  const sessionTime = Math.max(gs.sessionTime || 0, progressData.sessionTime || 0);
  const saveCount = Math.max(gs.saveCount || 0, progressData.saveCount || 0);
  const streak = Math.max(gs.streak || 0, progressData.streak || 0);

  const merged = {
    totalEdits,
    totalRuns,
    sessionTime,
    saveCount,
    streak,
    totalPoints: user.totalPoints || 0,
    completedModules: (user.completedModules && user.completedModules.length) || 0,
    debugSession: progressData.debugSession || false,
  };

  return merged;
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

  const merged = mergeProgressWithUser(user, progressData);

  // Persist merged gameStats so we accumulate across sessions
  user.gameStats.totalEdits = merged.totalEdits;
  user.gameStats.totalRuns = merged.totalRuns;
  user.gameStats.sessionTime = merged.sessionTime;
  user.gameStats.saveCount = merged.saveCount;
  user.gameStats.streak = merged.streak;

  const allAchievements = await Achievement.find({ isActive: true });
  const newlyEarned = [];
  const hour = new Date().getHours();

  for (const achievement of allAchievements) {
    if (user.earnedAchievements.includes(achievement.id)) continue;

    let shouldEarn = false;
    const reqReq = achievement.requirement;

    // ─── Learning (use DB: completedModules, totalPoints) ───
    if (reqReq === 'complete_1_module' && merged.completedModules >= 1) shouldEarn = true;
    else if (reqReq === 'complete_3_modules' && merged.completedModules >= 3) shouldEarn = true;
    else if (reqReq === 'complete_5_modules' && merged.completedModules >= 5) shouldEarn = true;
    else if (reqReq === 'complete_10_modules' && merged.completedModules >= 10) shouldEarn = true;
    else if (reqReq === 'points_100' && merged.totalPoints >= 100) shouldEarn = true;
    else if (reqReq === 'points_250' && merged.totalPoints >= 250) shouldEarn = true;
    else if (reqReq === 'points_500' && merged.totalPoints >= 500) shouldEarn = true;
    else if (reqReq === 'points_750' && merged.totalPoints >= 750) shouldEarn = true;
    else if (reqReq === 'points_1000' && merged.totalPoints >= 1000) shouldEarn = true;

    // ─── Track completion (DB: user completedModules vs Module list) ───
    else if (reqReq === 'complete_basics_track') {
      const basicsModules = await Module.find({ category: 'javascript-basics' }).select('_id');
      const completedIds = (user.completedModules || []).map((m) => {
        const id = m.moduleId && (m.moduleId._id || m.moduleId);
        return id ? id.toString() : null;
      }).filter(Boolean);
      const allCompleted = basicsModules.length > 0 && basicsModules.every((m) => completedIds.includes(m._id.toString()));
      if (allCompleted) shouldEarn = true;
    }
    else if (reqReq === 'complete_setup_module') {
      const completedIds = (user.completedModules || []).map((m) => m.moduleId && (m.moduleId._id || m.moduleId)).filter(Boolean);
      const setupModule = await Module.findOne({
        $or: [
          { title: /setup/i },
          { title: /console/i },
          { description: /setup and console/i },
        ],
      }).select('_id');
      if (setupModule && completedIds.some((id) => id.toString() === setupModule._id.toString())) shouldEarn = true;
    }

    // ─── Coding (use merged: totalEdits, totalRuns, sessionTime, etc.) ───
    else if (reqReq === 'edit_1_time' && merged.totalEdits >= 1) shouldEarn = true;
    else if (reqReq === 'edit_10_times' && merged.totalEdits >= 10) shouldEarn = true;
    else if (reqReq === 'edit_50_times' && merged.totalEdits >= 50) shouldEarn = true;
    else if (reqReq === 'streak_5' && merged.streak >= 5) shouldEarn = true;
    else if (reqReq === 'session_10_min' && merged.sessionTime >= 10) shouldEarn = true;
    else if (reqReq === 'session_30_min' && merged.sessionTime >= 30) shouldEarn = true;
    else if (reqReq === 'run_10_times' && merged.totalRuns >= 10) shouldEarn = true;
    else if (reqReq === 'save_5_times' && merged.saveCount >= 5) shouldEarn = true;
    else if (reqReq === 'code_night' && hour >= 0 && hour < 6 && merged.totalEdits > 0) shouldEarn = true;
    else if (reqReq === 'debug_session' && merged.debugSession) shouldEarn = true;

    if (shouldEarn) {
      user.earnedAchievements.push(achievement.id);
      user.totalPoints = (user.totalPoints || 0) + (achievement.points || 0);
      user.level = Math.max(1, Math.floor((user.totalPoints || 0) / XP_PER_LEVEL) + 1);
      newlyEarned.push(achievement);
    }
  }

  if (newlyEarned.length > 0) await user.save();
  else await user.save(); // persist merged gameStats even when no new achievements

  return { newlyEarned, user };
}

/**
 * Grant the "signup" achievement (e.g. id 1) to a user. Call after user creation.
 */
async function grantSignupAchievement(userId) {
  const achievement = await Achievement.findOne({ requirement: 'signup', isActive: true });
  if (!achievement) return;
  const user = await User.findById(userId);
  if (!user || (user.earnedAchievements || []).includes(achievement.id)) return;
  user.earnedAchievements = user.earnedAchievements || [];
  user.earnedAchievements.push(achievement.id);
  user.totalPoints = (user.totalPoints || 0) + (achievement.points || 0);
  user.level = Math.max(1, Math.floor((user.totalPoints || 0) / XP_PER_LEVEL) + 1);
  await user.save();
}

module.exports = { checkProgress, grantSignupAchievement, mergeProgressWithUser };
