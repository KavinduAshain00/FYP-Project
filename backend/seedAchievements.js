const mongoose = require('mongoose');
require('dotenv').config();
const Achievement = require('./models/Achievement');
const { ACHIEVEMENT_SEED } = require('./constants/achievements');

async function seedAchievements() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding achievements...');

    await Achievement.deleteMany({});
    console.log('Cleared existing achievements');

    await Achievement.insertMany(ACHIEVEMENT_SEED);
    console.log(`Seeded ${ACHIEVEMENT_SEED.length} achievements successfully!`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding achievements:', error);
    process.exit(1);
  }
}

seedAchievements();
