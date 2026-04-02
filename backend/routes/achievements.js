const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const achievementsController = require("../controllers/achievementsController");

/**
 * GET /api/achievements - Active catalog
 */
router.get("/", achievementsController.getAll);

/**
 * GET /api/achievements/user - Catalog + earned flags (auth)
 */
router.get("/user", auth, achievementsController.getUserAchievements);

/**
 * POST /api/achievements/earn - Manual grant (auth)
 */
router.post("/earn", auth, achievementsController.earn);

/**
 * GET /api/achievements/stats - Progress summary (auth)
 */
router.get("/stats", auth, achievementsController.getStats);

/**
 * POST /api/achievements/check - Run rules against merged stats (auth)
 */
router.post("/check", auth, achievementsController.check);

module.exports = router;
