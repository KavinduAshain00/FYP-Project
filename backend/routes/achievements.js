const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const achievementsController = require('../controllers/achievementsController');

// Get all achievements
router.get('/', achievementsController.getAll);
// Get the user's achievements
router.get('/user', auth, achievementsController.getUserAchievements);
// Earn an achievement
router.post('/earn', auth, achievementsController.earn);
// Get the user's achievement stats
router.get('/stats', auth, achievementsController.getStats);
// Check if an achievement is earned
router.post('/check', auth, achievementsController.check);

module.exports = router;
