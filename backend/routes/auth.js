const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Sign up a new user
router.post('/signup', authController.signup);
// Login a user
router.post('/login', authController.login);
// Forgot password – request reset token
router.post('/forgot-password', authController.forgotPassword);
// Reset password – set new password with token
router.post('/reset-password', authController.resetPassword);

module.exports = router;
