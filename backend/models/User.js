const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    password: {
      type: String,
      required: true,
    },
    knowsJavaScript: {
      type: Boolean,
      default: false,
    },
    learningPath: {
      type: String,
      enum: [
        "javascript-basics",
        "game-development",
        "react-basics",
        "multiplayer",
        "advanced-concepts",
        "advanced",
        "none",
      ],
      default: "none",
    },
    completedModules: [
      {
        moduleId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Module",
        },
        completedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    currentModule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
    },
    earnedAchievements: [
      {
        type: Number,
      },
    ],
    totalPoints: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    // Whether the Game Studio is unlocked for this user
    gameStudioEnabled: {
      type: Boolean,
      default: false,
    },
    gameStats: {
      totalEdits: { type: Number, default: 0 },
      totalRuns: { type: Number, default: 0 },
      sessionTime: { type: Number, default: 0 },
      saveCount: { type: Number, default: 0 },
      streak: { type: Number, default: 0 },
    },
    // UC8: Personalize AI Guide – tone, hint detail, assistance frequency
    aiPreferences: {
      tone: {
        type: String,
        enum: ["friendly", "formal", "concise"],
        default: "friendly",
      },
      hintDetail: {
        type: String,
        enum: ["minimal", "moderate", "detailed"],
        default: "moderate",
      },
      assistanceFrequency: {
        type: String,
        enum: ["low", "normal", "high"],
        default: "normal",
      },
    },
  },
  {
    timestamps: true,
  },
);

// Hash password before saving
// Use async pre-save middleware without next() when returning a promise
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
