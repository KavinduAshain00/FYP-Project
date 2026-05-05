const mongoose = require("mongoose");

const moduleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    category: {
      type: String,
      enum: [
        "javascript-basics",
        "game-development",
        "multiplayer",
        "advanced-concepts",
      ],
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    content: {
      type: String,
      required: true,
    },
    starterCode: {
      html: {
        type: String,
        default:
          '',
      },
      css: {
        type: String,
        default:
          "",
      },
      javascript: {
        type: String,
        default:
          '// Start coding your game here!\nconsole.log("Game started");',
      },
      // Support for multiplayer server code (Node.js / Socket.IO)
      serverJs: {
        type: String,
        default: "",
      },
    },
    // Module type: 'vanilla' or 'react'
    moduleType: {
      type: String,
      enum: ["vanilla", "react"],
      default: "vanilla",
    },
    // Difficulty-aware guided steps (beginner/intermediate can be compact; advanced can include many granular build steps)
    // verifyType: 'code' (default) | 'checkConsole' | 'checkComments' for non-coding steps
    steps: [
      {
        title: { type: String, required: true },
        instruction: { type: String, default: "" },
        concept: { type: String, default: "" },
        verifyType: {
          type: String,
          enum: ["code", "checkConsole", "checkComments"],
          default: "code",
        },
        expectedConsole: { type: mongoose.Schema.Types.Mixed, default: null }, // e.g. { type: 'any' } or { contains: ['It was love at first sight.'] }
      },
    ],
    hints: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Module", moduleSchema);
