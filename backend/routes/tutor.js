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

// Post a tutor request
router.post("/", auth, tutorLimiter, tutorController.postTutor);

// Verify code against current step (tutor)
router.post("/verify", auth, tutorLimiter, tutorController.verifyStep);

// MCQ: generate (qwen3-coder:480b) and verify with explanation if wrong
router.post("/mcq/generate", auth, tutorLimiter, tutorController.generateMCQs);
router.post("/mcq/verify", auth, tutorLimiter, tutorController.verifyMCQ);

// Explain highlighted code snippet
router.post("/explain-code", auth, tutorLimiter, tutorController.explainCode);

// Explain a runtime/syntax error message
router.post("/explain-error", auth, tutorLimiter, tutorController.explainError);

// Generate lecture notes from module learning overview (on popup open)
router.post(
  "/lecture-notes",
  auth,
  tutorLimiter,
  tutorController.generateLectureNotes,
);

module.exports = router;
