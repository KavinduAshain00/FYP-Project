/**
 * Map user learning path to Module categories.
 *
 * - Beginner (javascript-basics): Only JS basics category until all are completed; then game-development + multiplayer unlock.
 *   Within JS basics, only the first module is unlocked; each next unlocks when the previous is completed.
 *
 * - Advanced: All categories (javascript-basics, game-development, multiplayer) from the start; no sequential lock.
 *   At signup, JS basics are auto-completed so the user can continue from intermediate/multiplayer modules.
 */
const LEARNING_PATH_TO_CATEGORIES = {
  "javascript-basics": ["javascript-basics"],
  advanced: [ "game-development", "multiplayer"],
};

/**
 * @param {string} learningPath - User's learning path ('javascript-basics' | 'advanced')
 * @returns {string[]} Module category values to filter by (empty if none)
 */
function getPathCategories(learningPath) {
  if (!learningPath || learningPath === "none") return [];
  const cat = LEARNING_PATH_TO_CATEGORIES[learningPath];
  if (Array.isArray(cat)) return cat;
  if (cat) return [cat];
  return [learningPath];
}

module.exports = {
  LEARNING_PATH_TO_CATEGORIES,
  getPathCategories,
};
