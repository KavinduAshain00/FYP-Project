const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Module = require('../models/Module');

// @route   GET /api/modules
// @desc    Get all learning modules (filtered by user's learning path)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { category } = req.query;
    
    let query = {};
    // If the client explicitly requests "all", return all modules.
    // If no category is provided but the user has a learningPath, filter by that.
    if (category && category !== 'all') {
      query.category = category;
    } else if (!category && req.user.learningPath !== 'none') {
      // Filter by user's learning path
      query.category = req.user.learningPath;
    }

    const modules = await Module.find(query).sort({ order: 1, createdAt: 1 });
    res.json({ modules });
  } catch (error) {
    console.error('Get modules error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/modules/:id
// @desc    Get single module by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    res.json({ module });
  } catch (error) {
    console.error('Get module error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/modules
// @desc    Create new module (Admin only - simplified for now)
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const module = new Module(req.body);
    await module.save();
    res.status(201).json({ message: 'Module created', module });
  } catch (error) {
    console.error('Create module error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
