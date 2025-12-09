const mongoose = require('mongoose');
require('dotenv').config();
const Achievement = require('./models/Achievement');

const achievements = [
  // Learning Achievements (Dashboard)
  { id: 1, name: 'Getting Started', description: 'Welcome to GamiLearn!', icon: '🎯', points: 10, category: 'learning', requirement: 'signup' },
  { id: 2, name: 'First Module', description: 'Complete your first module', icon: '📚', points: 50, category: 'learning', requirement: 'complete_1_module' },
  { id: 3, name: 'Quick Learner', description: 'Complete 3 modules', icon: '⚡', points: 100, category: 'learning', requirement: 'complete_3_modules' },
  { id: 4, name: 'Dedicated', description: 'Complete 5 modules', icon: '💎', points: 150, category: 'learning', requirement: 'complete_5_modules' },
  { id: 5, name: 'Master', description: 'Complete 10 modules', icon: '👑', points: 250, category: 'learning', requirement: 'complete_10_modules' },
  
  // Coding Achievements (Custom Game)
  { id: 6, name: 'First Steps', description: 'Write your first line of code', icon: '🎯', points: 10, category: 'coding', requirement: 'edit_1_time' },
  { id: 7, name: 'Code Warrior', description: 'Make 10 code edits', icon: '⚔️', points: 20, category: 'coding', requirement: 'edit_10_times' },
  { id: 8, name: 'Speed Demon', description: 'Complete 5 runs in a row', icon: '⚡', points: 25, category: 'coding', requirement: 'streak_5' },
  { id: 9, name: 'Persistent Coder', description: 'Code for 10 minutes', icon: '💪', points: 30, category: 'coding', requirement: 'session_10_min' },
  { id: 10, name: 'Bug Hunter', description: 'Fix and run code 10 times', icon: '🐛', points: 35, category: 'coding', requirement: 'run_10_times' },
  { id: 11, name: 'Night Owl', description: 'Code after midnight', icon: '🦉', points: 40, category: 'special', requirement: 'code_night' },
  { id: 12, name: 'Century Club', description: 'Earn 100 points', icon: '💯', points: 50, category: 'general', requirement: 'points_100' },
  { id: 13, name: 'Master Builder', description: 'Earn 250 points', icon: '🏆', points: 100, category: 'general', requirement: 'points_250' },
  { id: 14, name: 'Code Ninja', description: 'Make 50 code edits', icon: '🥷', points: 75, category: 'coding', requirement: 'edit_50_times' },
  { id: 15, name: 'Marathon Runner', description: 'Code for 30 minutes', icon: '🏃', points: 80, category: 'coding', requirement: 'session_30_min' },
  { id: 16, name: 'Perfectionist', description: 'Save project 5 times', icon: '✨', points: 45, category: 'coding', requirement: 'save_5_times' },
  { id: 17, name: 'Legend', description: 'Earn 500 points', icon: '👑', points: 200, category: 'general', requirement: 'points_500' },
];

const seedAchievements = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding achievements...');

    // Clear existing achievements
    await Achievement.deleteMany({});
    console.log('Cleared existing achievements');

    // Insert new achievements
    await Achievement.insertMany(achievements);
    console.log(`Seeded ${achievements.length} achievements successfully!`);

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding achievements:', error);
    process.exit(1);
  }
};

seedAchievements();
