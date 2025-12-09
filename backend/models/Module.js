const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  category: {
    type: String,
    enum: ['javascript-basics', 'game-development', 'advanced-concepts'],
    required: true
  },
  order: {
    type: Number,
    default: 0
  },
  content: {
    type: String,
    required: true
  },
  starterCode: {
    html: {
      type: String,
      default: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Game</title>\n</head>\n<body>\n  <canvas id="gameCanvas"></canvas>\n</body>\n</html>'
    },
    css: {
      type: String,
      default: 'body {\n  margin: 0;\n  padding: 0;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  min-height: 100vh;\n  background: #1a1a2e;\n}\n\ncanvas {\n  border: 2px solid #16213e;\n}'
    },
    javascript: {
      type: String,
      default: '// Start coding your game here!\nconsole.log("Game started");'
    }
  },
  objectives: [{
    type: String
  }],
  hints: [{
    type: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Module', moduleSchema);
