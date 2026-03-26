/**
 * Map user learning path to Module categories (Module schema uses different enum for react/advanced).
 */
const LEARNING_PATH_TO_CATEGORIES = {
  'javascript-basics': ['javascript-basics'],
  'game-development': ['game-development'],
  'react-basics': ['react-fundamentals', 'react-game-dev'],
  multiplayer: ['multiplayer'],
  'advanced-concepts': ['advanced-concepts'],
  advanced: ['advanced-concepts'],
};

/**
 * @param {string} learningPath - User's learning path (e.g. 'javascript-basics', 'react-basics')
 * @returns {string[]} Module category values to filter by (empty if none)
 */
function getPathCategories(learningPath) {
  if (!learningPath || learningPath === 'none') return [];
  const cat = LEARNING_PATH_TO_CATEGORIES[learningPath];
  if (Array.isArray(cat)) return cat;
  if (cat) return [cat];
  return [learningPath];
}

module.exports = {
  LEARNING_PATH_TO_CATEGORIES,
  getPathCategories,
};
