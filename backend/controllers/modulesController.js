const Module = require("../models/Module");
const { getPathCategories } = require("../constants/learningPath");

async function getAll(req, res) {
  try {
    const { category } = req.query;
    const query = {};
    if (category && category !== "all") {
      query.category = category;
    } else if (
      !category &&
      req.user &&
      req.user.learningPath &&
      req.user.learningPath !== "none"
    ) {
      const pathCategories = getPathCategories(req.user.learningPath);
      if (pathCategories.length) {
        query.category = { $in: pathCategories };
      }
    }
    const modules = await Module.find(query).sort({ order: 1, createdAt: 1 });
    return res.json({ modules });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}

async function getById(req, res) {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }
    return res.json({ module });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}

async function create(req, res) {
  try {
    const module = new Module(req.body);
    await module.save();
    return res.status(201).json({ message: "Module created", module });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}

async function update(req, res) {
  try {
    const module = await Module.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true },
    );
    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }
    return res.json({ message: "Module updated", module });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}

async function remove(req, res) {
  try {
    const module = await Module.findByIdAndDelete(req.params.id);
    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }
    return res.json({ message: "Module deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
