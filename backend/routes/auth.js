const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const authController = require("../controllers/authController");
const { AUTH_LIMIT } = require("../constants/rateLimit");

const authLimiter = rateLimit({
  windowMs: AUTH_LIMIT.windowMs,
  max: AUTH_LIMIT.max,
  message: AUTH_LIMIT.message,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/auth/signup-precheck - Validate email/password before path step
 */
router.post("/signup-precheck", authLimiter, authController.signupPrecheck);

/**
 * POST /api/auth/signup - Create account
 */
router.post("/signup", authLimiter, authController.signup);

/**
 * POST /api/auth/login - Issue JWT
 */
router.post("/login", authLimiter, authController.login);

/**
 * POST /api/auth/forgot-password - Request reset JWT
 */
router.post("/forgot-password", authLimiter, authController.forgotPassword);

/**
 * POST /api/auth/reset-password - Set password from reset JWT
 */
router.post("/reset-password", authLimiter, authController.resetPassword);

module.exports = router;
