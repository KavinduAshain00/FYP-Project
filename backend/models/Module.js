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
        "react-fundamentals",
        "react-game-dev",
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
          '<!DOCTYPE html>\n<html>\n<head>\n  <title>Game</title>\n</head>\n<body>\n  <canvas id="gameCanvas"></canvas>\n</body>\n</html>',
      },
      css: {
        type: String,
        default:
          "body {\n  margin: 0;\n  padding: 0;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  min-height: 100vh;\n  background: #1a1a2e;\n}\n\ncanvas {\n  border: 2px solid #16213e;\n}",
      },
      javascript: {
        type: String,
        default:
          '// Start coding your game here!\nconsole.log("Game started");',
      },
      // Support for React-based modules
      jsx: {
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
    objectives: [
      {
        type: String,
      },
    ],
    // Optional: 4-5 small granular steps per module (title, instruction, concept for MCQ)
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
