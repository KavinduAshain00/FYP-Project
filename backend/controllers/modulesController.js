const Module = require('../models/Module');
const { getPathCategories } = require('../constants/learningPath');

async function getAll(req, res) {
  try {
    const { category } = req.query;
    const query = {};
    if (category && category !== 'all') {
      query.category = category;
    } else if (!category && req.user && req.user.learningPath && req.user.learningPath !== 'none') {
      const pathCategories = getPathCategories(req.user.learningPath);
      if (pathCategories.length) {
        query.category = { $in: pathCategories };
      }
    }
    const modules = await Module.find(query).sort({ order: 1, createdAt: 1 });
    return res.json({ modules });
  } catch (error) {
    console.error('Get modules error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function getById(req, res) {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    return res.json({ module });
  } catch (error) {
    console.error('Get module error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

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
    return res.json({ message: 'Module updated', module });
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
