const Module = require("../models/Module");
const { getPathCategories } = require("../constants/learningPath");
const ai = require("../services/aiService");

async function getAll(req, res) {
  try {
    const { category } = req.query;
    const query = {};
    const isAdmin = req.user && (req.user.role || "user") === "admin";
    if (category && category !== "all") {
      query.category = category;
    } else if (
      !category &&
      !isAdmin &&
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

    // If steps/hints/starterCode haven't been generated yet, generate them with AI
    if (!module.contentGenerated) {
      try {
        const [stepsResult, hintsResult, starterCodeResult] = await Promise.all([
          ai.generateModuleSteps(module.title, module.content, module.objectives, module.difficulty),
          ai.generateModuleHints(module.title, module.content, module.objectives),
          ai.generateModuleStarterCode(module.title, module.content, module.objectives, module.category, module.moduleType),
        ]);

        // Only save if we got valid results
        if (stepsResult.steps.length > 0) {
          module.steps = stepsResult.steps;
        }
        if (hintsResult.hints.length > 0) {
          module.hints = hintsResult.hints;
        }
        if (starterCodeResult.starterCode) {
          module.starterCode = starterCodeResult.starterCode;
        }

        module.contentGenerated = true;
        await module.save();
        console.log(`AI-generated content for module: ${module.title}`);
      } catch (genErr) {
        console.error(`AI generation failed for module ${module.title}:`, genErr.message || genErr);
        // Return the module as-is — frontend will use objectives as fallback steps
      }
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

/**
 * Force-regenerate steps, hints, and starter code for a module using AI.
 * Useful when an admin wants fresh content or the initial generation failed.
 */
async function regenerateContent(req, res) {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }

    const [stepsResult, hintsResult, starterCodeResult] = await Promise.all([
      ai.generateModuleSteps(module.title, module.content, module.objectives, module.difficulty),
      ai.generateModuleHints(module.title, module.content, module.objectives),
      ai.generateModuleStarterCode(module.title, module.content, module.objectives, module.category, module.moduleType),
    ]);

    if (stepsResult.steps.length > 0) {
      module.steps = stepsResult.steps;
    }
    if (hintsResult.hints.length > 0) {
      module.hints = hintsResult.hints;
    }
    if (starterCodeResult.starterCode) {
      module.starterCode = starterCodeResult.starterCode;
    }

    module.contentGenerated = true;
    await module.save();

    return res.json({ message: "Content regenerated", module });
  } catch (err) {
    console.error("Regenerate error:", err.message || err);
    return res.status(500).json({ message: "Content regeneration failed" });
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  regenerateContent,
};
