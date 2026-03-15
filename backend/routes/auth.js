const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const authController = require('../controllers/authController');
const { AUTH_LIMIT } = require('../constants/rateLimit');

const authLimiter = rateLimit({
  windowMs: AUTH_LIMIT.windowMs,
  max: AUTH_LIMIT.max,
  message: AUTH_LIMIT.message,
  standardHeaders: true,
  legacyHeaders: false,
});

// Sign up a new user
router.post('/signup', authLimiter, authController.signup);
// Login a user
router.post('/login', authLimiter, authController.login);
// Forgot password – request reset token
router.post('/forgot-password', authLimiter, authController.forgotPassword);
// Reset password – set new password with token
router.post('/reset-password', authLimiter, authController.resetPassword);

module.exports = router;
