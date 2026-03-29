const Module = require('../models/Module');
const { getPathCategories } = require('../constants/learningPath');

/**
 * Path categories for listing modules, with beginner gating: after all JS basics
 * are done, include game-development and multiplayer.
 */
async function getEffectivePathCategories(user) {
  let pathCategories = getPathCategories(user.learningPath);
  if (user.learningPath === 'javascript-basics' && pathCategories.length > 0) {
    const basicsModules = await Module.find({ category: 'javascript-basics' }).select('_id');
    const basicsIds = new Set(basicsModules.map((m) => m._id.toString()));
    const completedIds = (user.completedModules || [])
      .map((m) => {
        const id = m.moduleId && (m.moduleId._id || m.moduleId);
        return id ? id.toString() : null;
      })
      .filter(Boolean);
    const allBasicsDone =
      basicsIds.size > 0 && [...basicsIds].every((id) => completedIds.includes(id));
    if (allBasicsDone) {
      pathCategories = ['javascript-basics', 'game-development', 'multiplayer'];
    }
  }
  return pathCategories;
}

module.exports = { getEffectivePathCategories };
