const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const modulesController = require("../controllers/modulesController");

/**
 * GET /api/modules - Learner catalog (auth). Mutations: /api/admin/modules
 */
router.get("/", auth, modulesController.getAll);

/**
 * GET /api/modules/:id - One module (auth; path gating for beginners)
 */
router.get("/:id", auth, modulesController.getById);

module.exports = router;
