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
      enum: ["javascript-basics", "advanced", "none"],
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
    /** Per-module step progress in the code editor (scoped to this user in DB). */
    moduleStepProgress: [
      {
        moduleId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Module",
        },
        stepsVerified: {
          type: [Boolean],
          default: [],
        },
        currentStepIndex: {
          type: Number,
          default: 0,
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    earnedAchievements: [
      {
        type: Number,
      },
    ],
    /** Dedup keys for lesson XP: ":step:n" / ":mcq:step:q" per moduleId prefix */
    lessonXpKeys: {
      type: [String],
      default: [],
    },
    totalPoints: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    // Role: 'user' | 'admin' (admin can manage users and modules)
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    gameStats: {
      totalEdits: { type: Number, default: 0 },
      totalRuns: { type: Number, default: 0 },
      sessionTime: { type: Number, default: 0 },
      saveCount: { type: Number, default: 0 },
      streak: { type: Number, default: 0 },
      aiCompanionUses: { type: Number, default: 0 },
      aiHintRequests: { type: Number, default: 0 },
      aiExplainCodeUses: { type: Number, default: 0 },
      aiExplainErrorUses: { type: Number, default: 0 },
    },
    // Tutor/companion preferences: tone, hint detail, assistance frequency
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

userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.password;
    delete ret.lessonXpKeys;
    delete ret.moduleStepProgress;
    return ret;
  },
});
userSchema.set('toObject', {
  transform(_doc, ret) {
    delete ret.password;
    delete ret.lessonXpKeys;
    delete ret.moduleStepProgress;
    return ret;
  },
});

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
