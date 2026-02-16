const Achievement = require("../models/Achievement");
const User = require("../models/User");
const { XP_PER_LEVEL } = require("../constants/levelRanks");

/** Requirement string -> (data) => boolean. Must match ACHIEVEMENT_SEED in constants/achievements.js */
const REQUIREMENT_CHECKS = {
  signup: (d) => d.signup === true,
  complete_1_module: (d) => d.completedModules >= 1,
  complete_3_modules: (d) => d.completedModules >= 3,
  complete_5_modules: (d) => d.completedModules >= 5,
  complete_10_modules: (d) => d.completedModules >= 10,
  complete_basics_track: (d) => d.complete_basics_track === true,
  complete_setup_module: (d) => d.complete_setup_module === true,
  edit_1_time: (d) => d.totalEdits >= 1,
  edit_10_times: (d) => d.totalEdits >= 10,
  edit_50_times: (d) => d.totalEdits >= 50,
  streak_5: (d) => d.streak >= 5,
  session_10_min: (d) => d.sessionTime >= 10,
  session_30_min: (d) => d.sessionTime >= 30,
  run_10_times: (d) => d.totalRuns >= 10,
  save_5_times: (d) => d.saveCount >= 5,
  debug_session: (d) => d.debug_session === true,
  code_night: (d) => d.hour >= 0 && d.hour < 6 && d.totalEdits > 0,
  points_100: (d) => d.totalPoints >= 100,
  points_250: (d) => d.totalPoints >= 250,
  points_500: (d) => d.totalPoints >= 500,
  points_750: (d) => d.totalPoints >= 750,
  points_1000: (d) => d.totalPoints >= 1000,
  unlock_game_studio: (d) => d.unlock_game_studio === true,
  publish_first_game: (d) => d.publish_first_game === true,
  first_multiplayer_game: (d) => d.isMultiplayerGame === true,
  complete_multiplayer_track: (d) => d.complete_multiplayer_track === true,
  create_room: (d) => d.createdRoom === true,
  full_lobby: (d) => d.fullLobby === true,
  first_mp_win: (d) => d.multiplayerWins >= 1,
  mp_win_streak_3: (d) => d.streak >= 3 && d.multiplayerWins > 0,
  mp_wins_10: (d) => d.multiplayerWins >= 10,
  mp_games_5: (d) => d.multiplayerGames >= 5,
  complete_match: (d) => d.multiplayerGames >= 1,
  rematch_after_loss: (d) => d.rematch_after_loss === true,
  implement_state_sync: (d) => d.implement_state_sync === true,
  implement_turns: (d) => d.implement_turns === true,
  files_created_5: (d) => d.filesCreated >= 5,
  packages_installed_3: (d) => d.packagesInstalled >= 3,
  terminal_commands_10: (d) => d.terminalCommands >= 10,
  plan_step_1: (d) => d.planStep1 === true,
  plan_flow: (d) => d.planFlow === true,
  plan_insights: (d) => d.planInsights === true,
  plan_launch: (d) => d.planLaunch === true,
};

const DEFAULT_PROGRESS = {
  signup: false, complete_basics_track: false, complete_setup_module: false,
  totalEdits: 0, totalRuns: 0, sessionTime: 0, saveCount: 0, streak: 0,
  totalPoints: 0, completedModules: 0, isMultiplayerGame: false, multiplayerWins: 0,
  multiplayerGames: 0, createdRoom: false, fullLobby: false, filesCreated: 0,
  packagesInstalled: 0, terminalCommands: 0, planStep1: false, planFlow: false,
  planInsights: false, planLaunch: false, debug_session: false, unlock_game_studio: false,
  publish_first_game: false, complete_multiplayer_track: false, rematch_after_loss: false,
  implement_state_sync: false, implement_turns: false,
};

async function checkProgress(userId, progressData) {
  const data = {
    ...DEFAULT_PROGRESS,
    hour: new Date().getHours(),
    ...progressData,
  };

  const user = await User.findById(userId);
  if (!user) return { newlyEarned: [], user: null };
  if (!user.earnedAchievements) user.earnedAchievements = [];

  const allAchievements = await Achievement.find({ isActive: true });
  const newlyEarned = [];

  for (const achievement of allAchievements) {
    if (user.earnedAchievements.includes(achievement.id)) continue;
    const fn = REQUIREMENT_CHECKS[achievement.requirement];
    if (!fn || !fn(data)) continue;

    user.earnedAchievements.push(achievement.id);
    user.totalPoints = (user.totalPoints || 0) + achievement.points;
    user.level = Math.max(1, Math.floor((user.totalPoints || 0) / XP_PER_LEVEL) + 1);
    newlyEarned.push(achievement);
  }

  if (newlyEarned.length > 0) await user.save();
  return { newlyEarned, user };
}

/**
 * Award a single achievement by id (e.g. from POST /achievements/earn).
 * Returns { awarded, achievement, user } where awarded is true if newly granted.
 */
async function awardAchievement(userId, achievementId) {
  const achievement = await Achievement.findOne({ id: achievementId, isActive: true });
  if (!achievement) return { awarded: false, achievement: null, user: null };

  const user = await User.findById(userId);
  if (!user) return { awarded: false, achievement, user: null };
  if (!user.earnedAchievements) user.earnedAchievements = [];

  if (user.earnedAchievements.includes(achievementId)) {
    return { awarded: false, achievement, user };
  }

  user.earnedAchievements.push(achievementId);
  user.totalPoints = (user.totalPoints || 0) + achievement.points;
  user.level = Math.max(1, Math.floor((user.totalPoints || 0) / XP_PER_LEVEL) + 1);
  await user.save();
  return { awarded: true, achievement, user };
}

module.exports = { checkProgress, awardAchievement };
