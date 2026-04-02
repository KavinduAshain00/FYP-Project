const Module = require('../models/Module');
const { getPathCategories } = require('../constants/learningPath');
const { isAdmin } = require('../utils/admin');

const SLIM_FIELDS = '_id title description difficulty category order';

/**
 * GET /api/modules or GET /api/admin/modules - List modules (auth; admin route uses same handler)
 * Query: category, difficulty, meta, page, limit (see controller)
 */
async function getAll(req, res) {
  try {
    const { category, difficulty, meta } = req.query;
    const query = {};
    if (category && category !== 'all') {
      query.category = category;
    } else if (!category && req.user && req.user.learningPath && req.user.learningPath !== 'none') {
      let pathCategories = getPathCategories(req.user.learningPath);

      // Beginner: only show game-development and multiplayer after all javascript-basics are completed
      if (req.user.learningPath === 'javascript-basics' && pathCategories.length > 0) {
        const basicsModules = await Module.find({ category: 'javascript-basics' }).select('_id');
        const basicsIds = new Set(basicsModules.map((m) => m._id.toString()));
        const completedIds = (req.user.completedModules || [])
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

      if (pathCategories.length) {
        query.category = { $in: pathCategories };
      }
    }
    if (difficulty && difficulty !== 'all') {
      query.difficulty = difficulty;
    }

    if (meta === '1') {
      const [categories, difficulties] = await Promise.all([
        Module.find(query).distinct('category'),
        Module.find(query).distinct('difficulty'),
      ]);
      return res.json({
        categories: categories.filter(Boolean).sort(),
        difficulties: difficulties.filter(Boolean).sort(),
      });
    }

    const page =
      req.query.page !== undefined && req.query.page !== null ? parseInt(req.query.page, 10) : null;
    const limit =
      req.query.limit !== undefined && req.query.limit !== null
        ? parseInt(req.query.limit, 10)
        : null;
    const usePagination =
      Number.isInteger(page) && Number.isInteger(limit) && page >= 1 && limit >= 1;

    if (usePagination) {
      const safeLimit = Math.min(100, Math.max(1, limit));
      const skip = (page - 1) * safeLimit;
      const [modules, total] = await Promise.all([
        Module.find(query)
          .select(SLIM_FIELDS)
          .sort({ order: 1, createdAt: 1 })
          .skip(skip)
          .limit(safeLimit)
          .lean(),
        Module.countDocuments(query),
      ]);
      const totalPages = Math.max(1, Math.ceil(total / safeLimit));
      return res.json({
        modules,
        pagination: { total, page, limit: safeLimit, totalPages },
      });
    }

    const modules = await Module.find(query)
      .select(SLIM_FIELDS)
      .sort({ order: 1, createdAt: 1 })
      .lean();
    return res.json({ modules });
  } catch (error) {
    console.error('Get modules error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

/**
 * GET /api/modules/:id or GET /api/admin/modules/:id - Full module document (auth)
 * Learner path: beginner gating unless user is admin
 */
async function getById(req, res) {
  const moduleId = req.params.id;
  try {
    console.log('[Modules] getById', { moduleId });
    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    if (req.user && isAdmin(req.user)) {
      return res.json({ module });
    }

    // Enforce beginner gating for direct module access
    if (req.user && req.user.learningPath === 'javascript-basics') {
      const basicsModules = await Module.find({ category: 'javascript-basics' }).select('_id');
      const basicsIds = new Set(basicsModules.map((m) => m._id.toString()));
      const completedIds = (req.user.completedModules || [])
        .map((m) => {
          const id = m.moduleId && (m.moduleId._id || m.moduleId);
          return id ? id.toString() : null;
        })
        .filter(Boolean);
      const allBasicsDone =
        basicsIds.size > 0 && [...basicsIds].every((id) => completedIds.includes(id));
      if (module.category !== 'javascript-basics' && !allBasicsDone) {
        return res
          .status(403)
          .json({ message: 'Complete all JavaScript basics modules to unlock other modules' });
      }
    }

    return res.json({ module });
  } catch (error) {
    console.error('[Modules] getById error', { moduleId, error: error.message });
    return res.status(500).json({ message: 'Server error' });
  }
}

/**
 * POST /api/admin/modules - Create module (admin only)
 */
async function create(req, res) {
  try {
    const module = new Module(req.body);
    await module.save();
    return res.status(201).json({ message: 'Module created', module });
  } catch (error) {
    console.error('Create module error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

/**
 * PUT /api/admin/modules/:id - Partial update (admin only)
 */
async function update(req, res) {
  try {
    const module = await Module.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    return res.json({
      message: 'Module updated',
      delta: { _id: module._id, ...req.body },
    });
  } catch (error) {
    console.error('Update module error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

/**
 * DELETE /api/admin/modules/:id - Remove module (admin only)
 */
async function remove(req, res) {
  try {
    const module = await Module.findByIdAndDelete(req.params.id);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    return res.json({ message: 'Module deleted' });
  } catch (error) {
    console.error('Delete module error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
