const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const configController = require("../controllers/configController");

router.get("/studio-level", auth, configController.getStudioLevelInfo);
// Preset avatars (no auth - used on signup/profile)
router.get("/avatars", configController.getAvatars);

module.exports = router;
