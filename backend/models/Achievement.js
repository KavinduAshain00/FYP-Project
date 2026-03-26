const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: true,
    },
    points: {
      type: Number,
      required: true,
      default: 10,
    },
    category: {
      type: String,
      enum: ['learning', 'coding', 'general', 'special', 'multiplayer', 'planning'],
      default: 'general',
    },
    requirement: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Achievement', achievementSchema);
