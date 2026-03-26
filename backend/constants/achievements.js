/**
 * Rarity tiers for achievements. Must match Achievement model enum.
 * Used for display, filtering, and seed data.
 */
const RARITY_VALUES = ["common", "uncommon", "rare", "epic", "legendary"];

/**
 * Derive rarity from achievement points.
 * common ≤50, uncommon ≤100, rare ≤200, epic ≤350, legendary 351+
 */
function rarityFromPoints(points) {
  if (points <= 50) return "common";
  if (points <= 100) return "uncommon";
  if (points <= 200) return "rare";
  if (points <= 350) return "epic";
  return "legendary";
}

/**
 * Single source of truth for achievement definitions.
 * Used by seedAchievements.js and must match requirement keys in achievementService.
 * Rarity is derived from points unless overridden in the entry.
 */
const ACHIEVEMENT_SEED = [
  { id: 1, name: 'Getting Started', description: 'Welcome to GamiLearn!', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/target.svg', points: 10, category: 'learning', requirement: 'signup' },
  { id: 2, name: 'First Module', description: 'Complete your first module', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/book-2.svg', points: 50, category: 'learning', requirement: 'complete_1_module' },
  { id: 3, name: 'Quick Learner', description: 'Complete 3 modules', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/bolt.svg', points: 100, category: 'learning', requirement: 'complete_3_modules' },
  { id: 4, name: 'Dedicated', description: 'Complete 5 modules', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/diamond.svg', points: 150, category: 'learning', requirement: 'complete_5_modules' },
  { id: 5, name: 'Module Master', description: 'Complete 10 modules', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/crown.svg', points: 250, category: 'learning', requirement: 'complete_10_modules' },
  { id: 6, name: 'Basics Complete', description: 'Finish all JavaScript basics lessons', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/list-check.svg', points: 150, category: 'learning', requirement: 'complete_basics_track' },
  { id: 7, name: 'Console Confident', description: 'Finish the setup and console lesson', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/terminal-2.svg', points: 20, category: 'learning', requirement: 'complete_setup_module' },
  { id: 8, name: 'First Steps', description: 'Write your first line of code', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/code.svg', points: 10, category: 'coding', requirement: 'edit_1_time' },
  { id: 9, name: 'Code Warrior', description: 'Make 10 code edits', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/keyboard.svg', points: 20, category: 'coding', requirement: 'edit_10_times' },
  { id: 10, name: 'Code Ninja', description: 'Make 50 code edits', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/terminal.svg', points: 75, category: 'coding', requirement: 'edit_50_times' },
  { id: 11, name: 'Speed Demon', description: 'Complete 5 runs in a row', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/player-play.svg', points: 25, category: 'coding', requirement: 'streak_5' },
  { id: 12, name: 'Persistent Coder', description: 'Code for 10 minutes', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/timer.svg', points: 30, category: 'coding', requirement: 'session_10_min' },
  { id: 13, name: 'Marathon Runner', description: 'Code for 30 minutes', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/hourglass.svg', points: 80, category: 'coding', requirement: 'session_30_min' },
  { id: 14, name: 'Bug Hunter', description: 'Fix and run code 10 times', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/bug.svg', points: 35, category: 'coding', requirement: 'run_10_times' },
  { id: 15, name: 'Save Sentinel', description: 'Save your project 5 times', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/device-floppy.svg', points: 45, category: 'coding', requirement: 'save_5_times' },
  { id: 16, name: 'Console Sleuth', description: 'Resolve an error using the debugger', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/bug-off.svg', points: 60, category: 'coding', requirement: 'debug_session' },
  { id: 17, name: 'Night Owl', description: 'Code after midnight', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/moon-stars.svg', points: 40, category: 'special', requirement: 'code_night' },
  { id: 18, name: 'Century Club', description: 'Earn 100 points', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/trophy.svg', points: 50, category: 'general', requirement: 'points_100' },
  { id: 19, name: 'Master Builder', description: 'Earn 250 points', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/medal.svg', points: 100, category: 'general', requirement: 'points_250' },
  { id: 20, name: 'Legend', description: 'Earn 500 points', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/shield-star.svg', points: 200, category: 'general', requirement: 'points_500' },
  { id: 21, name: 'Architect', description: 'Earn 750 points', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/building-skyscraper.svg', points: 300, category: 'general', requirement: 'points_750' },
  { id: 22, name: 'Mythic', description: 'Earn 1000 points', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/award.svg', points: 400, category: 'general', requirement: 'points_1000' },
  { id: 23, name: 'Studio Unlocked', description: 'Unlock the Custom Game Studio', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/rocket.svg', points: 150, category: 'special', requirement: 'unlock_game_studio' },
  { id: 24, name: 'Creator Launch', description: 'Publish your first custom game', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/brand-unity.svg', points: 200, category: 'special', requirement: 'publish_first_game' },
  { id: 25, name: 'Going Online', description: 'Create your first multiplayer game', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/wifi.svg', points: 100, category: 'multiplayer', requirement: 'first_multiplayer_game' },
  { id: 26, name: 'Socket Master', description: 'Complete all multiplayer modules', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/plug-connected.svg', points: 300, category: 'multiplayer', requirement: 'complete_multiplayer_track' },
  { id: 27, name: 'Room Creator', description: 'Create a game room', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/door.svg', points: 50, category: 'multiplayer', requirement: 'create_room' },
  { id: 28, name: 'Party Host', description: 'Have 2 players join your room', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/users.svg', points: 75, category: 'multiplayer', requirement: 'full_lobby' },
  { id: 29, name: 'First Victory', description: 'Win your first multiplayer match', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/trophy.svg', points: 100, category: 'multiplayer', requirement: 'first_mp_win' },
  { id: 30, name: 'Win Streak', description: 'Win 3 matches in a row', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/flame.svg', points: 150, category: 'multiplayer', requirement: 'mp_win_streak_3' },
  { id: 31, name: 'Champion', description: 'Win 10 multiplayer matches', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/medal-2.svg', points: 250, category: 'multiplayer', requirement: 'mp_wins_10' },
  { id: 32, name: 'Good Sport', description: 'Complete a match without disconnecting', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/heart-handshake.svg', points: 30, category: 'multiplayer', requirement: 'complete_match' },
  { id: 33, name: 'Rematch Ready', description: 'Play a rematch after losing', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/refresh.svg', points: 50, category: 'multiplayer', requirement: 'rematch_after_loss' },
  { id: 34, name: 'State Synced', description: 'Implement game state synchronization', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/arrows-exchange.svg', points: 75, category: 'multiplayer', requirement: 'implement_state_sync' },
  { id: 35, name: 'Turn Master', description: 'Implement turn-based logic', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/arrows-shuffle.svg', points: 75, category: 'multiplayer', requirement: 'implement_turns' },
  { id: 36, name: 'Network Wizard', description: 'Complete 5 multiplayer games', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/wand.svg', points: 200, category: 'multiplayer', requirement: 'mp_games_5' },
  { id: 37, name: 'Blueprint Initiated', description: 'Define your first game concept', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/clipboard-check.svg', points: 30, category: 'planning', requirement: 'plan_step_1' },
  { id: 38, name: 'Flow Architect', description: 'Generate a game flow diagram', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/diagram-2.svg', points: 50, category: 'planning', requirement: 'plan_flow' },
  { id: 39, name: 'Strategy Tactician', description: 'Generate strategy insights', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/brain.svg', points: 40, category: 'planning', requirement: 'plan_insights' },
  { id: 40, name: 'Launch Commander', description: 'Start coding from a plan', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/rocket.svg', points: 60, category: 'planning', requirement: 'plan_launch' },
].map((entry) => ({
  ...entry,
  rarity: entry.rarity ?? rarityFromPoints(entry.points),
}));

module.exports = { ACHIEVEMENT_SEED, RARITY_VALUES, rarityFromPoints };
