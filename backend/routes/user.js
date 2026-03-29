const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const userController = require("../controllers/userController");

// Get the user's profile (includes levelInfo)
router.get("/profile", auth, userController.getProfile);

// Get avatars with unlock status (level + achievements)
router.get("/avatars", auth, userController.getAvatars);

// Get dashboard data (modules, nextModule, completion, achievements, levelInfo)
router.get("/dashboard", auth, userController.getDashboard);

// Complete a module
router.put("/module/complete", auth, userController.completeModule);

// Set the current module (optional stepsVerified + currentStepIndex to persist editor progress)
router.put("/module/current", auth, userController.setCurrentModule);

// Saved step progress for a module (code editor)
router.get("/module/step-progress/:moduleId", auth, userController.getModuleStepProgress);

// Update the user's profile
router.put("/profile", auth, userController.updateProfile);

// Change password (current + new)
router.put("/password", auth, userController.changePassword);

module.exports = router;
