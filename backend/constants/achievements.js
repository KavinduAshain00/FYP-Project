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

  // ── Learning track milestones ──────────────────────────────────────────────
  { id: 41, name: 'JS Graduate',         description: 'Complete all JavaScript basics modules',       icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/certificate.svg',         points: 225, rarity: 'rare',      category: 'learning',    requirement: 'complete_js_track' },
  { id: 42, name: 'Game Dev Apprentice', description: 'Complete 5 game development modules',          icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/device-gamepad-2.svg',   points: 175, rarity: 'rare',      category: 'learning',    requirement: 'complete_5_gamedev_modules' },
  { id: 43, name: 'Game Dev Expert',     description: 'Complete the entire game development track',   icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/tournament.svg',          points: 350, rarity: 'epic',      category: 'learning',    requirement: 'complete_gamedev_track' },
  { id: 44, name: 'React Initiate',      description: 'Complete your first React module',             icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/brand-react.svg',         points: 80,  rarity: 'uncommon',  category: 'learning',    requirement: 'complete_first_react_module' },
  { id: 45, name: 'React Developer',     description: 'Complete all React game development modules',  icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/components.svg',          points: 275, rarity: 'rare',      category: 'learning',    requirement: 'complete_react_track' },
  { id: 46, name: 'Full Stack Scholar',  description: 'Complete every learning track',               icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/stars.svg',              points: 600, rarity: 'legendary', category: 'learning',    requirement: 'complete_all_tracks' },
  { id: 47, name: 'Overachiever',        description: 'Complete 20 modules',                         icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/podium.svg',             points: 400, rarity: 'epic',      category: 'learning',    requirement: 'complete_20_modules' },
  { id: 48, name: 'All-Rounder',         description: 'Complete at least one module in every category', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/layout-grid.svg',    points: 200, rarity: 'rare',      category: 'learning',    requirement: 'complete_all_categories' },

  // ── Coding milestones ──────────────────────────────────────────────────────
  { id: 49, name: 'Canvas Pioneer',      description: 'Write your first canvas draw call',           icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/brush.svg',              points: 25,  rarity: 'common',    category: 'coding',      requirement: 'first_canvas_draw' },
  { id: 50, name: 'Animation Architect', description: 'Build a working requestAnimationFrame loop',  icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/player-track-next.svg',  points: 90,  rarity: 'uncommon',  category: 'coding',      requirement: 'first_animation_loop' },
  { id: 51, name: 'The Grind',           description: 'Run code 50 times total',                     icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/repeat.svg',             points: 80,  rarity: 'uncommon',  category: 'coding',      requirement: 'run_50_times' },
  { id: 52, name: 'Elite Coder',         description: 'Run code 200 times total',                    icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/cpu.svg',               points: 325, rarity: 'epic',      category: 'coding',      requirement: 'run_200_times' },
  { id: 53, name: 'Code Architect',      description: 'Make 200 code edits',                         icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/pencil-code.svg',        points: 200, rarity: 'rare',      category: 'coding',      requirement: 'edit_200_times' },
  { id: 54, name: 'Perfectionist',       description: 'Complete all steps in a module without hints', icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/rosette-discount-check.svg', points: 150, rarity: 'rare', category: 'coding',      requirement: 'complete_module_no_hints' },
  { id: 55, name: 'Speed Learner',       description: 'Complete a module in under 10 minutes',       icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/stopwatch.svg',          points: 80,  rarity: 'uncommon',  category: 'coding',      requirement: 'complete_module_fast' },
  { id: 56, name: 'No Errors',           description: 'Run code that passes on the very first try',  icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/circle-check.svg',       points: 60,  rarity: 'uncommon',  category: 'coding',      requirement: 'first_run_pass' },

  // ── AI / Tutor interaction ─────────────────────────────────────────────────
  { id: 57, name: 'AI Student',          description: 'Ask the AI tutor for help',                   icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/robot.svg',             points: 15,  rarity: 'common',    category: 'learning',    requirement: 'ask_tutor_once' },
  { id: 58, name: 'Knowledge Seeker',    description: 'Ask the AI tutor 10 times',                   icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/message-question.svg',  points: 65,  rarity: 'uncommon',  category: 'learning',    requirement: 'ask_tutor_10_times' },
  { id: 59, name: 'Hint Taker',          description: 'Use an AI-generated hint',                    icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/bulb.svg',              points: 20,  rarity: 'common',    category: 'coding',      requirement: 'use_hint_once' },
  { id: 60, name: 'AI Collaborator',     description: 'Use AI hints 25 times',                       icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/brain.svg',             points: 175, rarity: 'rare',      category: 'coding',      requirement: 'use_hints_25_times' },

  // ── Studio / Creative ──────────────────────────────────────────────────────
  { id: 61, name: 'Studio Veteran',      description: 'Publish 3 custom games',                      icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/paint.svg',             points: 200, rarity: 'rare',      category: 'special',     requirement: 'publish_3_games' },
  { id: 62, name: 'Indie Legend',        description: 'Publish 5 custom games',                      icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/star.svg',              points: 375, rarity: 'epic',      category: 'special',     requirement: 'publish_5_games' },
  { id: 63, name: 'Design Visionary',    description: 'Complete 5 game planning sessions',           icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/artboard.svg',          points: 70,  rarity: 'uncommon',  category: 'planning',    requirement: 'plan_sessions_5' },
  { id: 64, name: 'Grand Architect',     description: 'Complete 10 game planning sessions',          icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/building-castle.svg',   points: 375, rarity: 'epic',      category: 'planning',    requirement: 'plan_sessions_10' },

  // ── Consistency / Streaks ──────────────────────────────────────────────────
  { id: 65, name: 'Three Day Streak',    description: 'Log in 3 days in a row',                      icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/calendar-check.svg',    points: 75,  rarity: 'uncommon',  category: 'special',     requirement: 'login_streak_3' },
  { id: 66, name: 'Week Warrior',        description: 'Log in 7 days in a row',                      icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/calendar-week.svg',     points: 175, rarity: 'rare',      category: 'special',     requirement: 'login_streak_7' },
  { id: 67, name: 'Month Champion',      description: 'Log in 30 days in a row',                     icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/calendar-stats.svg',    points: 500, rarity: 'legendary', category: 'special',     requirement: 'login_streak_30' },
  { id: 68, name: 'Comeback Kid',        description: 'Return and code after 7 days away',           icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/refresh-dot.svg',       points: 60,  rarity: 'uncommon',  category: 'special',     requirement: 'comeback_after_7_days' },
  { id: 69, name: 'Night Shift',         description: 'Code after midnight on 3 separate nights',    icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/moon.svg',              points: 120, rarity: 'rare',      category: 'special',     requirement: 'code_midnight_3_times' },
  { id: 70, name: 'Obsessed',            description: 'Accumulate 10 hours of total coding time',    icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/infinity.svg',           points: 450, rarity: 'legendary', category: 'special',     requirement: 'coding_hours_10' },

  // ── Prestige ───────────────────────────────────────────────────────────────
  { id: 71, name: 'Grand Master',        description: 'Earn 2000 total XP points',                   icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/gem.svg',               points: 600, rarity: 'legendary', category: 'general',     requirement: 'points_2000' },
  { id: 72, name: 'The Completionist',   description: 'Unlock 40 or more achievements',              icon: 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/list-numbers.svg',      points: 500, rarity: 'legendary', category: 'general',     requirement: 'unlock_40_achievements' },
].map((entry) => ({
  ...entry,
  rarity: entry.rarity ?? rarityFromPoints(entry.points),
}));

module.exports = { ACHIEVEMENT_SEED, RARITY_VALUES, rarityFromPoints };
