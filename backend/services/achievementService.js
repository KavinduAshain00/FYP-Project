const Achievement = require('../models/Achievement');
const User = require('../models/User');
const { XP_PER_LEVEL } = require('../constants/levelRanks');

/**
 * Check and award achievements based on progress data. Updates user in DB.
 * @param {string} userId - User _id
 * @param {object} progressData - totalEdits, totalRuns, sessionTime, saveCount, streak, totalPoints, completedModules, etc.
 * @returns {Promise<{ newlyEarned: Array, user: object }>}
 */
async function checkProgress(userId, progressData) {
  const {
    totalEdits = 0,
    totalRuns = 0,
    sessionTime = 0,
    saveCount = 0,
    streak = 0,
    totalPoints = 0,
    completedModules = 0,
    isMultiplayerGame = false,
    multiplayerWins = 0,
    multiplayerGames = 0,
    createdRoom = false,
    fullLobby = false,
    filesCreated = 0,
    packagesInstalled = 0,
    terminalCommands = 0,
    planStep1 = false,
    planFlow = false,
    planInsights = false,
    planLaunch = false,
  } = progressData;

  const user = await User.findById(userId);
  if (!user) return { newlyEarned: [], user: null };
  if (!user.earnedAchievements) user.earnedAchievements = [];

  const allAchievements = await Achievement.find({ isActive: true });
  const newlyEarned = [];
  const hour = new Date().getHours();

  for (const achievement of allAchievements) {
    if (user.earnedAchievements.includes(achievement.id)) continue;

    let shouldEarn = false;
    const reqReq = achievement.requirement;

    if (reqReq === 'edit_1_time' && totalEdits >= 1) shouldEarn = true;
    else if (reqReq === 'edit_10_times' && totalEdits >= 10) shouldEarn = true;
    else if (reqReq === 'edit_50_times' && totalEdits >= 50) shouldEarn = true;
    else if (reqReq === 'streak_5' && streak >= 5) shouldEarn = true;
    else if (reqReq === 'session_10_min' && sessionTime >= 10) shouldEarn = true;
    else if (reqReq === 'session_30_min' && sessionTime >= 30) shouldEarn = true;
    else if (reqReq === 'run_10_times' && totalRuns >= 10) shouldEarn = true;
    else if (reqReq === 'save_5_times' && saveCount >= 5) shouldEarn = true;
    else if (reqReq === 'code_night' && hour >= 0 && hour < 6 && totalEdits > 0) shouldEarn = true;
    else if (reqReq === 'points_100' && totalPoints >= 100) shouldEarn = true;
    else if (reqReq === 'points_250' && totalPoints >= 250) shouldEarn = true;
    else if (reqReq === 'points_500' && totalPoints >= 500) shouldEarn = true;
    else if (reqReq === 'points_750' && totalPoints >= 750) shouldEarn = true;
    else if (reqReq === 'points_1000' && totalPoints >= 1000) shouldEarn = true;
    else if (reqReq === 'complete_1_module' && completedModules >= 1) shouldEarn = true;
    else if (reqReq === 'complete_3_modules' && completedModules >= 3) shouldEarn = true;
    else if (reqReq === 'complete_5_modules' && completedModules >= 5) shouldEarn = true;
    else if (reqReq === 'complete_10_modules' && completedModules >= 10) shouldEarn = true;
    else if (reqReq === 'first_multiplayer_game' && isMultiplayerGame) shouldEarn = true;
    else if (reqReq === 'create_room' && createdRoom) shouldEarn = true;
    else if (reqReq === 'full_lobby' && fullLobby) shouldEarn = true;
    else if (reqReq === 'first_mp_win' && multiplayerWins >= 1) shouldEarn = true;
    else if (reqReq === 'mp_win_streak_3' && streak >= 3 && multiplayerWins > 0) shouldEarn = true;
    else if (reqReq === 'mp_wins_10' && multiplayerWins >= 10) shouldEarn = true;
    else if (reqReq === 'mp_games_5' && multiplayerGames >= 5) shouldEarn = true;
    else if (reqReq === 'complete_match' && multiplayerGames >= 1) shouldEarn = true;
    else if (reqReq === 'files_created_5' && filesCreated >= 5) shouldEarn = true;
    else if (reqReq === 'packages_installed_3' && packagesInstalled >= 3) shouldEarn = true;
    else if (reqReq === 'terminal_commands_10' && terminalCommands >= 10) shouldEarn = true;
    else if (reqReq === 'plan_step_1' && planStep1) shouldEarn = true;
    else if (reqReq === 'plan_flow' && planFlow) shouldEarn = true;
    else if (reqReq === 'plan_insights' && planInsights) shouldEarn = true;
    else if (reqReq === 'plan_launch' && planLaunch) shouldEarn = true;

    if (shouldEarn) {
      user.earnedAchievements.push(achievement.id);
      user.totalPoints = (user.totalPoints || 0) + achievement.points;
      user.level = Math.max(1, Math.floor((user.totalPoints || 0) / XP_PER_LEVEL) + 1);
      newlyEarned.push(achievement);
    }
  }

  if (newlyEarned.length > 0) await user.save();

  return { newlyEarned, user };
}

module.exports = { checkProgress };
