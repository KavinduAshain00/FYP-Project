const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const userController = require("../controllers/userController");

// Get profile + achievements + avatars in one call (Profile page) — must be before /profile
router.get("/profile/full", auth, userController.getProfileFull);
// Get the user's profile (includes levelInfo)
router.get("/profile", auth, userController.getProfile);
// Get all modules + user profile in one call (Modules page)
router.get("/modules-context", auth, userController.getModulesContext);
// Get avatars with unlock status (level + achievements)
router.get("/avatars", auth, userController.getAvatars);
// Get dashboard data (modules, nextModule, completion, achievements, levelInfo)
router.get("/dashboard", auth, userController.getDashboard);
// Complete a module
router.put("/module/complete", auth, userController.completeModule);
// Set the current module
router.put("/module/current", auth, userController.setCurrentModule);
// Update the user's profile
router.put("/profile", auth, userController.updateProfile);

module.exports = router;
