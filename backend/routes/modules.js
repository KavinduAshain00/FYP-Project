const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const requireAdmin = auth.requireAdmin;
const modulesController = require("../controllers/modulesController");

// Get all modules
router.get("/", auth, modulesController.getAll);
// Get a module by ID
router.get("/:id", auth, modulesController.getById);
// Create a new module (admin only)
router.post("/", auth, requireAdmin, modulesController.create);
// Update a module (admin only)
router.put("/:id", auth, requireAdmin, modulesController.update);
// Delete a module (admin only)
router.delete("/:id", auth, requireAdmin, modulesController.remove);

module.exports = router;
