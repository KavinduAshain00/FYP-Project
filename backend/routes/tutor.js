const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const auth = require('../middleware/auth');
const tutorController = require('../controllers/tutorController');
const { TUTOR_LIMIT } = require('../constants/rateLimit');

// Rate limit tutor requests
const tutorLimiter = rateLimit({
  windowMs: TUTOR_LIMIT.windowMs,
  max: TUTOR_LIMIT.max,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req),
  standardHeaders: true,
  legacyHeaders: false,
  message: TUTOR_LIMIT.message,
});

// Post a tutor request
router.post('/', auth, tutorLimiter, tutorController.postTutor);

// Verify code against current step (AI)
router.post('/verify', auth, tutorLimiter, tutorController.verifyStep);

// MCQ: generate (qwen3-coder:480b) and verify with explanation if wrong
router.post('/mcq/generate', auth, tutorLimiter, tutorController.generateMCQs);
router.post('/mcq/verify', auth, tutorLimiter, tutorController.verifyMCQ);

// Explain highlighted code snippet
router.post('/explain-code', auth, tutorLimiter, tutorController.explainCode);

// Generate game starter code from planning board (qwen3-coder:480b)
router.post('/generate-starter-code', auth, tutorLimiter, tutorController.generateGameStarterCode);

module.exports = router;
