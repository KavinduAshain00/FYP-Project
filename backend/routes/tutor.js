const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const auth = require("../middleware/auth");
const tutorController = require("../controllers/tutorController");
const { TUTOR_LIMIT } = require("../constants/rateLimit");

const tutorLimiter = rateLimit({
  ...TUTOR_LIMIT,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/tutor - Tutor chat / hints (auth, rate limited)
 */
router.post("/", auth, tutorLimiter, tutorController.postTutor);

/**
 * POST /api/tutor/verify - Step code verification + optional XP (auth, rate limited)
 */
router.post("/verify", auth, tutorLimiter, tutorController.verifyStep);

/**
 * POST /api/tutor/mcq/generate - Generate MCQs for a step (auth, rate limited)
 */
router.post("/mcq/generate", auth, tutorLimiter, tutorController.generateMCQs);

/**
 * POST /api/tutor/mcq/verify - Verify MCQ + optional XP (auth, rate limited)
 */
router.post("/mcq/verify", auth, tutorLimiter, tutorController.verifyMCQ);

/**
 * POST /api/tutor/explain-code - Explain selection (auth, rate limited)
 */
router.post("/explain-code", auth, tutorLimiter, tutorController.explainCode);

/**
 * POST /api/tutor/explain-error - Explain error message (auth, rate limited)
 */
router.post("/explain-error", auth, tutorLimiter, tutorController.explainError);

/**
 * POST /api/tutor/lecture-notes - Learning overview notes (auth, rate limited)
 */
router.post(
  "/lecture-notes",
  auth,
  tutorLimiter,
  tutorController.generateLectureNotes,
);

module.exports = router;
