const Module = require('../models/Module');
const { getEffectivePathCategories } = require('../utils/learningPathModules');

const SLIM_FIELDS = '_id title description difficulty category order';

const MODULE_CATEGORIES = new Set([
  'javascript-basics',
  'game-development',
  'multiplayer',
  'advanced-concepts',
]);
const MODULE_DIFFICULTIES = new Set(['beginner', 'intermediate', 'advanced']);
const MODULE_TYPES = new Set(['vanilla', 'react']);
const STEP_VERIFY_TYPES = new Set(['code', 'checkConsole', 'checkComments']);

const STARTER_CODE_KEYS = ['html', 'css', 'javascript', 'serverJs'];

function queryFilterString(raw, maxLen) {
  if (raw === undefined || raw === null || typeof raw !== 'string') return '';
  return raw.trim().substring(0, maxLen);
}

function pickStarterCode(raw) {
  if (raw === undefined || raw === null || typeof raw !== 'object' || Array.isArray(raw))
    return undefined;
  const out = {};
  for (const k of STARTER_CODE_KEYS) {
    if (typeof raw[k] === 'string') out[k] = raw[k];
  }
  return Object.keys(out).length ? out : undefined;
}

function pickStep(raw) {
  if (raw === undefined || raw === null || typeof raw !== 'object' || Array.isArray(raw))
    return null;
  if (typeof raw.title !== 'string' || !raw.title.trim()) return null;
  const step = { title: raw.title.trim() };
  if (typeof raw.instruction === 'string') step.instruction = raw.instruction;
  if (typeof raw.concept === 'string') step.concept = raw.concept;
  if (STEP_VERIFY_TYPES.has(raw.verifyType)) step.verifyType = raw.verifyType;
  if (raw.expectedConsole !== undefined) step.expectedConsole = raw.expectedConsole;
  return step;
}

/**
 * Allowlisted module fields only (no mass assignment / operator injection via req.body).
 */
function pickModuleWritablePayload(body) {
  if (
    body === undefined ||
    body === null ||
    typeof body !== 'object' ||
    Array.isArray(body)
  )
    return {};
  const out = {};

  if (typeof body.title === 'string') out.title = body.title;
  if (typeof body.description === 'string') out.description = body.description;
  if (typeof body.content === 'string') out.content = body.content;

  if (body.order !== undefined && body.order !== null) {
    const n = Number(body.order);
    if (Number.isFinite(n)) out.order = n;
  }

  if (typeof body.difficulty === 'string' && MODULE_DIFFICULTIES.has(body.difficulty)) {
    out.difficulty = body.difficulty;
  }
  if (typeof body.category === 'string' && MODULE_CATEGORIES.has(body.category)) {
    out.category = body.category;
  }
  if (typeof body.moduleType === 'string' && MODULE_TYPES.has(body.moduleType)) {
    out.moduleType = body.moduleType;
  }

  const starterCode = pickStarterCode(body.starterCode);
  if (starterCode) out.starterCode = starterCode;

  if (Array.isArray(body.steps)) {
    out.steps = body.steps.map((s) => pickStep(s)).filter(Boolean);
  }
  if (Array.isArray(body.hints)) {
    out.hints = body.hints.filter((h) => typeof h === 'string');
  }

  return out;
}

async function buildModuleListQuery(req) {
  const query = {};
  let forceEmpty = false;
  const category = queryFilterString(req.query.category, 128);
  const difficulty = queryFilterString(req.query.difficulty, 64);

  if (category && category !== 'all') {
    if (MODULE_CATEGORIES.has(category)) {
      query.category = category;
    } else {
      forceEmpty = true;
    }
  } else if (
    !category &&
    req.user &&
    req.user.learningPath &&
    req.user.learningPath !== 'none'
  ) {
    const pathCategories = await getEffectivePathCategories(req.user);
    if (pathCategories.length) {
      query.category = { $in: pathCategories };
    }
  }
  if (difficulty && difficulty !== 'all') {
    if (MODULE_DIFFICULTIES.has(difficulty)) {
      query.difficulty = difficulty;
    } else {
      forceEmpty = true;
    }
  }
  if (forceEmpty) {
    query._id = { $in: [] };
  }
  return query;
}

function parsePaginationParams(req) {
  const page =
    req.query.page !== undefined && req.query.page !== null ? parseInt(req.query.page, 10) : null;
  const limit =
    req.query.limit !== undefined && req.query.limit !== null
      ? parseInt(req.query.limit, 10)
      : null;
  const usePagination =
    Number.isInteger(page) && Number.isInteger(limit) && page >= 1 && limit >= 1;
  return { page, limit, usePagination };
}

function baseModulesListQuery(query) {
  return Module.find(query).select(SLIM_FIELDS).sort({ order: 1, createdAt: 1 });
}

async function sendModuleMetaResponse(res, query) {
  const [categories, difficulties] = await Promise.all([
    Module.find(query).distinct('category'),
    Module.find(query).distinct('difficulty'),
  ]);
  return res.json({
    categories: categories.filter(Boolean).sort(),
    difficulties: difficulties.filter(Boolean).sort(),
  });
}

async function sendPaginatedModulesResponse(res, query, page, limit) {
  const safeLimit = Math.min(100, Math.max(1, limit));
  const skip = (page - 1) * safeLimit;
  const [modules, total] = await Promise.all([
    baseModulesListQuery(query).skip(skip).limit(safeLimit).lean(),
    Module.countDocuments(query),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  return res.json({
    modules,
    pagination: { total, page, limit: safeLimit, totalPages },
  });
}

async function sendFullModulesListResponse(res, query) {
  const modules = await baseModulesListQuery(query).lean();
  return res.json({ modules });
}

async function getAll(req, res) {
  try {
    const query = await buildModuleListQuery(req);
    if (req.query.meta === '1') {
      return sendModuleMetaResponse(res, query);
    }
    const { page, limit, usePagination } = parsePaginationParams(req);
    if (usePagination) {
      return sendPaginatedModulesResponse(res, query, page, limit);
    }
    return sendFullModulesListResponse(res, query);
  } catch (error) {
    console.error('Get modules error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function getById(req, res) {
  const moduleId = req.params.id;
  try {
    console.log('[Modules] getById', { moduleId });
    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
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

async function create(req, res) {
  try {
    const payload = pickModuleWritablePayload(req.body);
    const module = new Module(payload);
    await module.save();
    return res.status(201).json({ message: 'Module created', module });
  } catch (error) {
    console.error('Create module error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function update(req, res) {
  try {
    const payload = pickModuleWritablePayload(req.body);
    const module = await Module.findByIdAndUpdate(
      req.params.id,
      { $set: payload },
      { new: true, runValidators: true }
    );
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    return res.json({
      message: 'Module updated',
      delta: { _id: module._id, ...payload },
    });
  } catch (error) {
    console.error('Update module error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

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
