const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const userController = require("../controllers/userController");

/**
 * GET /api/user/profile - Profile + levelInfo (auth)
 */
router.get("/profile", auth, userController.getProfile);

/**
 * GET /api/user/avatars - Avatar unlock list (auth)
 */
router.get("/avatars", auth, userController.getAvatars);

/**
 * GET /api/user/dashboard - Path modules, next module, achievements slice (auth)
 */
router.get("/dashboard", auth, userController.getDashboard);

/**
 * PUT /api/user/module/complete - Mark module done + XP + badges (auth)
 */
router.put("/module/complete", auth, userController.completeModule);

/**
 * PUT /api/user/module/current - Set current module + optional step progress (auth)
 */
router.put("/module/current", auth, userController.setCurrentModule);

/**
 * GET /api/user/module/step-progress/:moduleId - Editor checkpoint (auth)
 */
router.get("/module/step-progress/:moduleId", auth, userController.getModuleStepProgress);

/**
 * PUT /api/user/profile - Update name, avatar, AI prefs (auth)
 */
router.put("/profile", auth, userController.updateProfile);

/**
 * PUT /api/user/password - Change password (auth)
 */
router.put("/password", auth, userController.changePassword);

module.exports = router;
