const mongoose = require('mongoose');
const Module = require('./models/Module');
require('dotenv').config();

// Sample game development learning modules (rewritten and expanded)
const sampleModules = [
  {
    title: 'JavaScript Basics - Setup and Console',
    description: 'Set up a page, run JavaScript, and use the console for quick feedback.',
    difficulty: 'beginner',
    category: 'javascript-basics',
    order: 1,
    content: `# JavaScript Setup and Console

## Why start here?
The console is the fastest way to see what your code is doing. You will log values, run small tests, and spot mistakes.

## Example
\`\`\`javascript
console.log('Hello, GamiLearn');
const level = 1;
console.log('Player level:', level);
\`\`\`

## Your Task
Print a short status report that includes your player name, a starting level, and whether tutorials are completed.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Console Warmup</title>\n</head>\n<body>\n  <h1>Open the DevTools console</h1>\n  <p>Use Option+Command+I (Mac) to open it.</p>\n</body>\n</html>',
      css: 'body {\n  font-family: Arial, sans-serif;\n  padding: 24px;\n  background: #f4f6fb;\n}\n\nh1 {\n  color: #1f2d3d;\n}',
      javascript: "const playerName = 'Rookie';\nconst level = 1;\nconst tutorialsComplete = false;\n\nconsole.log('Player:', playerName);\nconsole.log('Level:', level);\nconsole.log('Tutorials done?', tutorialsComplete);"
    },
    objectives: [
      'Open the browser console',
      'Log strings, numbers, and booleans',
      'Describe what the output means'
    ],
    hints: [
      'Use console.log for quick feedback',
      'Strings use quotes, booleans are true/false',
      'Keep logs short and clear'
    ]
  },
  {
    title: 'JavaScript Basics - Variables and Types',
    description: 'Declare variables with let and const, and track core data types.',
    difficulty: 'beginner',
    category: 'javascript-basics',
    order: 2,
    content: `# Variables and Types

## Core idea
Variables store state for your game. Use \`const\` when a value should not change, and \`let\` when it should.

## Example
\`\`\`javascript
const maxHealth = 100;
let currentHealth = 90;
let playerName = 'Sky';
\`\`\`

## Your Task
Track a player name, score, and a flag for tutorial completion. Log the types using \`typeof\`.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Variables</title>\n</head>\n<body>\n  <h1>Variables and Types</h1>\n  <p>Check the console for output.</p>\n</body>\n</html>',
      css: 'body {\n  font-family: Arial, sans-serif;\n  padding: 24px;\n  background: #eef2f7;\n  color: #1b2a41;\n}',
      javascript: "const maxHealth = 100;\nlet currentHealth = 75;\nlet playerName = 'Sky';\nlet tutorialComplete = false;\n\nconsole.log('Player:', playerName, '| Type:', typeof playerName);\nconsole.log('Current health:', currentHealth, '| Type:', typeof currentHealth);\nconsole.log('Tutorial complete:', tutorialComplete, '| Type:', typeof tutorialComplete);"
    },
    objectives: [
      'Use let and const',
      'Store strings, numbers, and booleans',
      'Use typeof to inspect data'
    ],
    hints: [
      'Choose const when the value should stay fixed',
      'Numbers can be integers or decimals',
      'typeof returns a string like "string" or "number"'
    ]
  },
  {
    title: 'JavaScript Basics - Strings and Templates',
    description: 'Combine text with template literals and practice string methods.',
    difficulty: 'beginner',
    category: 'javascript-basics',
    order: 3,
    content: `# Strings and Template Literals

## Template literals
Backticks let you embed values: \`\${value}\`.

## Example
\`\`\`javascript
const name = 'Nova';
const level = 2;
console.log(\`Player \${name} is level \${level}\`);
\`\`\`

## Your Task
Build a status line like: "Nova | Level 2 | Health 90/100" using a template literal and a couple of string methods.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Strings</title>\n</head>\n<body>\n  <h1>String Workshop</h1>\n  <p>Open the console for output.</p>\n</body>\n</html>',
      css: 'body {\n  font-family: Arial, sans-serif;\n  padding: 24px;\n  background: #f7f9fb;\n  color: #1b2a41;\n}',
      javascript: "const name = 'Nova';\nconst level = 2;\nconst health = 90;\nconst maxHealth = 100;\n\nconst status = `Player ${name.toUpperCase()} | Level ${level} | Health ${health}/${maxHealth}`;\nconsole.log(status);"
    },
    objectives: [
      'Create template literals',
      'Use string methods like toUpperCase()',
      'Embed variables in strings'
    ],
    hints: [
      'Template literals use backticks, not quotes',
      'Call methods with parentheses, for example text.trim()',
      'Include separators like | for readability'
    ]
  },
  {
    title: 'JavaScript Basics - Functions and Scope',
    description: 'Write reusable functions and understand local versus global scope.',
    difficulty: 'beginner',
    category: 'javascript-basics',
    order: 4,
    content: `# Functions and Scope

## Why functions?
Functions group steps into a named action. Scope controls what variables they can see.

## Example
\`\`\`javascript
function heal(amount, current, max) {
  const next = Math.min(current + amount, max);
  return next;
}
\`\`\`

## Your Task
Create three functions: addScore, takeDamage, and resetPlayer. Each should return updated values without relying on globals.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Functions</title>\n</head>\n<body>\n  <h1>Functions and Scope</h1>\n  <p>Inspect console output.</p>\n</body>\n</html>',
      css: 'body {\n  font-family: Arial, sans-serif;\n  padding: 24px;\n  background: #e8f4ff;\n  color: #0f172a;\n}',
      javascript: "function addScore(score, amount) {\n  return score + amount;\n}\n\nfunction takeDamage(health, amount) {\n  const next = Math.max(0, health - amount);\n  return next;\n}\n\nfunction resetPlayer() {\n  return { score: 0, health: 100, level: 1 };\n}\n\nlet score = 0;\nlet health = 100;\n\nscore = addScore(score, 50);\nhealth = takeDamage(health, 30);\n\nconsole.log('Score now:', score);\nconsole.log('Health now:', health);\nconsole.log('Reset player:', resetPlayer());"
    },
    objectives: [
      'Declare and call functions',
      'Return values instead of mutating globals',
      'Use Math.min/Math.max for bounds'
    ],
    hints: [
      'Pass needed data as parameters',
      'Return new values instead of modifying outer variables',
      'Keep functions focused on one job'
    ]
  },
  {
    title: 'JavaScript Basics - Control Flow',
    description: 'Use conditionals to branch game logic.',
    difficulty: 'beginner',
    category: 'javascript-basics',
    order: 5,
    content: `# Control Flow

## Decisions
if/else blocks choose what happens next based on conditions.

## Example
\`\`\`javascript
const stamina = 40;
if (stamina > 50) {
  console.log('Sprint allowed');
} else {
  console.log('Catch your breath');
}
\`\`\`

## Your Task
Implement a chooseAction function that returns "attack", "defend", or "flee" based on player health and enemy distance.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Control Flow</title>\n</head>\n<body>\n  <h1>Control Flow</h1>\n  <p>Review console output.</p>\n</body>\n</html>',
      css: 'body {\n  font-family: Arial, sans-serif;\n  padding: 24px;\n  background: #f3f4f6;\n  color: #111827;\n}',
      javascript: "function chooseAction(health, distance) {\n  if (health < 20) return 'flee';\n  if (distance > 20) return 'attack';\n  return 'defend';\n}\n\nconsole.log('Decision A:', chooseAction(80, 30));\nconsole.log('Decision B:', chooseAction(15, 10));\nconsole.log('Decision C:', chooseAction(50, 5));"
    },
    objectives: [
      'Use if/else to branch logic',
      'Return different outcomes based on conditions',
      'Keep conditions readable'
    ],
    hints: [
      'Order conditions from most specific to most general',
      'Return early when a decision is made',
      'Use descriptive variable names'
    ]
  },
  {
    title: 'JavaScript Basics - Arrays and Loops',
    description: 'Manage collections of items with arrays, and iterate with loops.',
    difficulty: 'beginner',
    category: 'javascript-basics',
    order: 6,
    content: `# Arrays and Loops

## Why arrays?
Games track inventory, enemies, projectiles, and more. Arrays hold ordered lists.

## Example
\`\`\`javascript
const inventory = ['sword', 'shield'];
for (let i = 0; i < inventory.length; i++) {
  console.log(inventory[i]);
}
\`\`\`

## Your Task
Create an inventory array, add items with push, remove one with pop, and print each item with its index.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Arrays</title>\n</head>\n<body>\n  <h1>Inventory</h1>\n  <div id="inventory"></div>\n  <button onclick="addItem()">Add Item</button>\n  <button onclick="useItem()">Use Last Item</button>\n</body>\n</html>',
      css: '#inventory {\n  padding: 12px;\n  margin: 16px 0;\n  background: #e5e7eb;\n  border-radius: 8px;\n  font-family: Arial, sans-serif;\n}\nbutton {\n  margin-right: 8px;\n  padding: 10px 16px;\n}',
      javascript: `const inventory = ['Map'];
const possibleItems = ['Sword', 'Shield', 'Potion', 'Key', 'Compass'];

function addItem() {
  const next = possibleItems[Math.floor(Math.random() * possibleItems.length)];
  inventory.push(next);
  render();
}

function useItem() {
  inventory.pop();
  render();
}

function render() {
  const div = document.getElementById('inventory');
  div.innerHTML = '<strong>Items:</strong>';
  for (let i = 0; i < inventory.length; i++) {
    div.innerHTML += '<div>' + (i + 1) + '. ' + inventory[i] + '</div>';
  }
  div.innerHTML += '<div>Total: ' + inventory.length + '</div>';
}

render();`
    },
    objectives: [
      'Create and update arrays',
      'Iterate with for loops',
      'Render array contents to the page'
    ],
    hints: [
      'Use push to add and pop to remove the last item',
      'Loop until i < array.length',
      'Re-render after each change'
    ]
  },
  {
    title: 'JavaScript Basics - Objects and Methods',
    description: 'Bundle related data and behavior inside objects.',
    difficulty: 'beginner',
    category: 'javascript-basics',
    order: 7,
    content: `# Objects and Methods

## Why objects?
They model entities like players or enemies with properties and actions.

## Example
\`\`\`javascript
const player = {
  name: 'Ranger',
  level: 3,
  attack() {
    return 'Ranger attacks';
  }
};
\`\`\`

## Your Task
Create a character object with properties for name, level, and health, plus methods levelUp and describe that return strings.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Objects</title>\n</head>\n<body>\n  <h1>Character Sheet</h1>\n  <div id="character"></div>\n  <button onclick="levelUp()">Level Up</button>\n</body>\n</html>',
      css: 'body {\n  font-family: Arial, sans-serif;\n  background: #0f172a;\n  color: #f8fafc;\n  padding: 24px;\n}\nbutton {\n  margin-top: 12px;\n  padding: 10px 16px;\n}',
      javascript: "const character = {\n  name: 'Ranger',\n  level: 1,\n  health: 100,\n  levelUp() {\n    this.level += 1;\n    this.health = 100 + this.level * 10;\n  },\n  describe() {\n    return `${this.name} | Level ${this.level} | Health ${this.health}`;\n  }\n};\n\nfunction render() {\n  document.getElementById('character').textContent = character.describe();\n}\n\nfunction levelUp() {\n  character.levelUp();\n  render();\n}\n\nrender();"
    },
    objectives: [
      'Define objects with properties and methods',
      'Use this to reference object data',
      'Return formatted strings from methods'
    ],
    hints: [
      'Methods are functions defined inside objects',
      'Use template literals to format the summary',
      'Update the DOM after state changes'
    ]
  },
  {
    title: 'JavaScript Basics - DOM and Events',
    description: 'Read and update the DOM, and react to user actions.',
    difficulty: 'beginner',
    category: 'javascript-basics',
    order: 8,
    content: `# DOM and Events

## Interactivity
The DOM is the live page. You can select elements, change them, and listen for events like clicks.

## Example
\`\`\`javascript
document.getElementById('start').addEventListener('click', () => {
  console.log('Start pressed');
});
\`\`\`

## Your Task
Create a start button that toggles between "Start" and "Pause", updating a status line each time it is clicked.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>DOM and Events</title>\n</head>\n<body>\n  <h1>DOM Practice</h1>\n  <button id="start">Start</button>\n  <p id="status">Game is stopped.</p>\n</body>\n</html>',
      css: 'body {\n  font-family: Arial, sans-serif;\n  padding: 24px;\n  background: #f8fafc;\n  color: #0f172a;\n}\nbutton {\n  padding: 10px 16px;\n  margin-bottom: 12px;\n}',
      javascript: "const button = document.getElementById('start');\nconst status = document.getElementById('status');\nlet running = false;\n\nbutton.addEventListener('click', () => {\n  running = !running;\n  button.textContent = running ? 'Pause' : 'Start';\n  status.textContent = running ? 'Game is running...' : 'Game is stopped.';\n});"
    },
    objectives: [
      'Select DOM elements with getElementById',
      'Attach click event listeners',
      'Update textContent based on state'
    ],
    hints: [
      'Track state in a boolean',
      'Update both the button and the status text',
      'Use textContent instead of innerHTML for plain text'
    ]
  },
  {
    title: 'JavaScript Basics - Debugging and Console Tools',
    description: 'Use console methods and breakpoints to diagnose issues.',
    difficulty: 'beginner',
    category: 'javascript-basics',
    order: 9,
    content: `# Debugging

## Console helpers
console.warn highlights warnings, and console.table prints arrays or objects in a readable grid.

## Example
\`\`\`javascript
const enemies = [\n  { name: 'Slime', hp: 10 },\n  { name: 'Orc', hp: 30 }\n];\nconsole.table(enemies);
\`\`\`

## Your Task
Create a small array of player stats and print them with console.table. Set a breakpoint in your browser to step through a function that adjusts hit points.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Debugging</title>\n</head>\n<body>\n  <h1>Debugging Playground</h1>\n  <p>Use DevTools to pause in the adjustHealth function.</p>\n</body>\n</html>',
      css: 'body {\n  font-family: Arial, sans-serif;\n  padding: 24px;\n  background: #eef2f7;\n  color: #0f172a;\n}',
      javascript: "const players = [\n  { name: 'Ada', hp: 12 },\n  { name: 'Lin', hp: 18 },\n  { name: 'Mina', hp: 20 }\n];\n\nconsole.table(players);\n\nfunction adjustHealth(list, name, change) {\n  const target = list.find(p => p.name === name);\n  if (!target) return list;\n  target.hp = Math.max(0, target.hp + change);\n  return list;\n}\n\nadjustHealth(players, 'Lin', -5);\nconsole.table(players);"
    },
    objectives: [
      'Use console.warn and console.table',
      'Set a breakpoint and step through code',
      'Inspect how data changes over time'
    ],
    hints: [
      'Right-click the line number to toggle a breakpoint',
      'Refresh the page after adding a breakpoint',
      'Check the Scope panel to see variable values'
    ]
  },
  {
    title: 'Canvas Drawing Basics',
    description: 'Learn to draw shapes on HTML Canvas as the foundation of game graphics.',
    difficulty: 'beginner',
    category: 'game-development',
    order: 1,
    content: `# HTML Canvas - Drawing Basics

## Introduction
The HTML canvas is your digital drawing surface. You will draw rectangles and circles to form a simple character.

## Example
\`\`\`javascript
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.fillStyle = 'blue';
ctx.fillRect(50, 50, 100, 100);
\`\`\`

## Your Task
Draw a simple game character using basic shapes (rectangles and circles).`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Canvas Drawing</title>\n</head>\n<body>\n  <canvas id="gameCanvas" width="800" height="600"></canvas>\n</body>\n</html>',
      css: 'body {\n  margin: 0;\n  padding: 20px;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  min-height: 100vh;\n  background: #34495e;\n}\n\ncanvas {\n  border: 3px solid #2c3e50;\n  background: white;\n}',
      javascript: 'const canvas = document.getElementById("gameCanvas");\nconst ctx = canvas.getContext("2d");\n\nctx.fillStyle = "#3498db";\nctx.fillRect(100, 100, 50, 50);\n\nctx.fillStyle = "#e74c3c";\nctx.beginPath();\nctx.arc(125, 80, 20, 0, Math.PI * 2);\nctx.fill();\n\nconsole.log("Character drawn");'
    },
    objectives: [
      'Get a 2D canvas context',
      'Draw rectangles and circles',
      'Change fillStyle to set colors'
    ],
    hints: [
      'ctx.fillRect(x, y, width, height) draws rectangles',
      'ctx.arc uses radians; use Math.PI * 2 for a full circle',
      'Call beginPath before drawing arcs'
    ]
  },
  {
    title: 'Game Loop and Animation',
    description: 'Create smooth animations using requestAnimationFrame - the heart of every game.',
    difficulty: 'intermediate',
    category: 'game-development',
    order: 2,
    content: `# Game Loop and Animation

## The Game Loop
Every game needs a loop that runs continuously, updating game state and drawing graphics.

\`\`\`javascript
function gameLoop() {
  // Update game state
  updateGame();
  
  // Draw graphics
  drawGame();
  
  // Loop continues
  requestAnimationFrame(gameLoop);
}

gameLoop();
\`\`\`

## Your Task
Create a moving character that animates across the screen.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Game Animation</title>\n</head>\n<body>\n  <canvas id="gameCanvas" width="800" height="600"></canvas>\n</body>\n</html>',
      css: 'body {\n  margin: 0;\n  padding: 0;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  min-height: 100vh;\n  background: #1a1a2e;\n}\n\ncanvas {\n  border: 2px solid #16213e;\n  background: #0f3460;\n}',
      javascript: 'const canvas = document.getElementById("gameCanvas");\nconst ctx = canvas.getContext("2d");\n\nlet playerX = 50;\nlet playerY = 250;\nlet speed = 2;\n\nfunction update() {\n  // Move player\n  playerX += speed;\n  \n  // Wrap around screen\n  if (playerX > canvas.width) {\n    playerX = -50;\n  }\n}\n\nfunction draw() {\n  // Clear canvas\n  ctx.clearRect(0, 0, canvas.width, canvas.height);\n  \n  // Draw player\n  ctx.fillStyle = "#00d9ff";\n  ctx.fillRect(playerX, playerY, 50, 50);\n}\n\nfunction gameLoop() {\n  update();\n  draw();\n  requestAnimationFrame(gameLoop);\n}\n\ngameLoop();'
    },
    objectives: [
      'Create a game loop with requestAnimationFrame',
      'Update game state (position, velocity)',
      'Clear and redraw canvas each frame',
      'Implement basic movement'
    ],
    hints: [
      'requestAnimationFrame runs at 60 FPS',
      'clearRect() clears the canvas for the next frame',
      'Change position values to create movement'
    ]
  },
  {
    title: 'Keyboard Input and Controls',
    description: 'Make your game interactive by handling keyboard input for player controls.',
    difficulty: 'intermediate',
    category: 'game-development',
    order: 3,
    content: `# Keyboard Controls

## Handling Input
Games need to respond to player input. Let's add keyboard controls!

\`\`\`javascript
const keys = {};

window.addEventListener('keydown', (e) => {
  keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

// Check if key is pressed
if (keys['ArrowRight']) {
  playerX += speed;
}
\`\`\`

## Your Task
Create a character that moves in all directions with arrow keys.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Keyboard Controls</title>\n</head>\n<body>\n  <canvas id="gameCanvas" width="800" height="600"></canvas>\n  <div style="color: white; text-align: center; margin-top: 10px;">Use Arrow Keys to Move</div>\n</body>\n</html>',
      css: 'body {\n  margin: 0;\n  padding: 20px;\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n  align-items: center;\n  min-height: 100vh;\n  background: #2c3e50;\n}\n\ncanvas {\n  border: 3px solid #34495e;\n  background: #ecf0f1;\n}',
      javascript: 'const canvas = document.getElementById("gameCanvas");\nconst ctx = canvas.getContext("2d");\n\nlet playerX = 375;\nlet playerY = 275;\nconst speed = 5;\nconst keys = {};\n\n// Keyboard event listeners\nwindow.addEventListener("keydown", (e) => {\n  keys[e.key] = true;\n});\n\nwindow.addEventListener("keyup", (e) => {\n  keys[e.key] = false;\n});\n\nfunction update() {\n  // Movement controls\n  if (keys["ArrowUp"]) playerY -= speed;\n  if (keys["ArrowDown"]) playerY += speed;\n  if (keys["ArrowLeft"]) playerX -= speed;\n  if (keys["ArrowRight"]) playerX += speed;\n  \n  // Keep player in bounds\n  playerX = Math.max(0, Math.min(canvas.width - 50, playerX));\n  playerY = Math.max(0, Math.min(canvas.height - 50, playerY));\n}\n\nfunction draw() {\n  ctx.clearRect(0, 0, canvas.width, canvas.height);\n  \n  // Draw player\n  ctx.fillStyle = "#e74c3c";\n  ctx.fillRect(playerX, playerY, 50, 50);\n}\n\nfunction gameLoop() {\n  update();\n  draw();\n  requestAnimationFrame(gameLoop);\n}\n\ngameLoop();'
    },
    objectives: [
      'Set up keyboard event listeners',
      'Track which keys are pressed',
      'Move player based on input',
      'Keep player within canvas bounds'
    ],
    hints: [
      'Use an object to track multiple keys at once',
      'keydown fires when a key is pressed',
      'keyup fires when a key is released',
      'Math.max and Math.min help with boundary checking'
    ]
  },
  {
    title: 'Collision Detection',
    description: 'Detect when game objects collide - essential for interactive gameplay.',
    difficulty: 'intermediate',
    category: 'game-development',
    order: 4,
    content: `# Collision Detection

## Detecting Collisions
Games need to know when objects touch or overlap. This is called collision detection.

\`\`\`javascript
function checkCollision(rect1, rect2) {
  return rect1.x < rect2.x + rect2.width &&
         rect1.x + rect1.width > rect2.x &&
         rect1.y < rect2.y + rect2.height &&
         rect1.y + rect1.height > rect2.y;
}
\`\`\`

## Your Task
Create a game where the player collects items that appear on screen.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Collision Detection</title>\n</head>\n<body>\n  <canvas id="gameCanvas" width="800" height="600"></canvas>\n  <div id="score" style="color: white; text-align: center; margin-top: 10px; font-size: 24px;">Score: 0</div>\n</body>\n</html>',
      css: 'body {\n  margin: 0;\n  padding: 20px;\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n  align-items: center;\n  min-height: 100vh;\n  background: #16213e;\n}\n\ncanvas {\n  border: 3px solid #0f3460;\n  background: #1a1a2e;\n}',
      javascript: 'const canvas = document.getElementById("gameCanvas");\nconst ctx = canvas.getContext("2d");\n\nconst player = { x: 375, y: 275, width: 50, height: 50 };\nconst coin = { \n  x: Math.random() * (canvas.width - 30), \n  y: Math.random() * (canvas.height - 30), \n  width: 30, \n  height: 30 \n};\n\nlet score = 0;\nconst speed = 5;\nconst keys = {};\n\nwindow.addEventListener("keydown", (e) => keys[e.key] = true);\nwindow.addEventListener("keyup", (e) => keys[e.key] = false);\n\nfunction checkCollision(rect1, rect2) {\n  return rect1.x < rect2.x + rect2.width &&\n         rect1.x + rect1.width > rect2.x &&\n         rect1.y < rect2.y + rect2.height &&\n         rect1.y + rect1.height > rect2.y;\n}\n\nfunction update() {\n  if (keys["ArrowUp"]) player.y -= speed;\n  if (keys["ArrowDown"]) player.y += speed;\n  if (keys["ArrowLeft"]) player.x -= speed;\n  if (keys["ArrowRight"]) player.x += speed;\n  \n  // Bounds\n  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));\n  player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));\n  \n  // Check collision\n  if (checkCollision(player, coin)) {\n    score++;\n    document.getElementById("score").textContent = "Score: " + score;\n    coin.x = Math.random() * (canvas.width - coin.width);\n    coin.y = Math.random() * (canvas.height - coin.height);\n  }\n}\n\nfunction draw() {\n  ctx.clearRect(0, 0, canvas.width, canvas.height);\n  \n  // Draw player\n  ctx.fillStyle = "#00d9ff";\n  ctx.fillRect(player.x, player.y, player.width, player.height);\n  \n  // Draw coin\n  ctx.fillStyle = "#f1c40f";\n  ctx.beginPath();\n  ctx.arc(coin.x + coin.width/2, coin.y + coin.height/2, coin.width/2, 0, Math.PI * 2);\n  ctx.fill();\n}\n\nfunction gameLoop() {\n  update();\n  draw();\n  requestAnimationFrame(gameLoop);\n}\n\ngameLoop();'
    },
    objectives: [
      'Implement rectangle collision detection',
      'Detect when player touches collectible',
      'Update score on collision',
      'Respawn collectibles at random positions'
    ],
    hints: [
      'Collision occurs when rectangles overlap on both X and Y axes',
      'Math.random() creates random positions',
      'Update DOM elements to show score changes'
    ]
  },
  {
    title: 'Sprite Animation',
    description: 'Bring characters to life with sprite sheet animation.',
    difficulty: 'advanced',
    category: 'game-development',
    order: 5,
    content: `# Sprite Animation

## Animating Characters
Professional games use sprite sheets - images with multiple frames. Let's animate them!

\`\`\`javascript
const sprite = {
  frame: 0,
  frameCount: 4,
  frameWidth: 64,
  update: function() {
    this.frame = (this.frame + 1) % this.frameCount;
  }
};
\`\`\`

## Your Task
Create a walking animation that cycles through different poses.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Sprite Animation</title>\n</head>\n<body>\n  <canvas id="gameCanvas" width="800" height="600"></canvas>\n  <div style="color: white; text-align: center; margin-top: 10px;">Press Arrow Keys to Move</div>\n</body>\n</html>',
      css: 'body {\n  margin: 0;\n  padding: 20px;\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n  align-items: center;\n  min-height: 100vh;\n  background: #1a1a1a;\n}\n\ncanvas {\n  border: 3px solid #333;\n  background: #2a2a2a;\n}',
      javascript: 'const canvas = document.getElementById("gameCanvas");\nconst ctx = canvas.getContext("2d");\n\nconst player = {\n  x: 375,\n  y: 275,\n  width: 50,\n  height: 50,\n  frame: 0,\n  frameCount: 4,\n  frameDelay: 0,\n  speed: 3\n};\n\nconst keys = {};\nwindow.addEventListener("keydown", (e) => keys[e.key] = true);\nwindow.addEventListener("keyup", (e) => keys[e.key] = false);\n\nlet isMoving = false;\n\nfunction update() {\n  isMoving = false;\n  \n  if (keys["ArrowUp"]) {\n    player.y -= player.speed;\n    isMoving = true;\n  }\n  if (keys["ArrowDown"]) {\n    player.y += player.speed;\n    isMoving = true;\n  }\n  if (keys["ArrowLeft"]) {\n    player.x -= player.speed;\n    isMoving = true;\n  }\n  if (keys["ArrowRight"]) {\n    player.x += player.speed;\n    isMoving = true;\n  }\n  \n  // Animate only when moving\n  if (isMoving) {\n    player.frameDelay++;\n    if (player.frameDelay > 8) {\n      player.frame = (player.frame + 1) % player.frameCount;\n      player.frameDelay = 0;\n    }\n  } else {\n    player.frame = 0;\n  }\n  \n  // Keep in bounds\n  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));\n  player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));\n}\n\nfunction draw() {\n  ctx.clearRect(0, 0, canvas.width, canvas.height);\n  \n  // Simulate sprite animation with color changes\n  const colors = ["#3498db", "#2ecc71", "#f39c12", "#e74c3c"];\n  ctx.fillStyle = colors[player.frame];\n  ctx.fillRect(player.x, player.y, player.width, player.height);\n  \n  // Draw animation frame indicator\n  ctx.fillStyle = "white";\n  ctx.font = "16px Arial";\n  ctx.fillText(`Frame: ${player.frame + 1}/${player.frameCount}`, 10, 30);\n}\n\nfunction gameLoop() {\n  update();\n  draw();\n  requestAnimationFrame(gameLoop);\n}\n\ngameLoop();'
    },
    objectives: [
      'Implement frame-based animation',
      'Control animation speed with delays',
      'Switch between idle and moving states',
      'Create smooth sprite transitions'
    ],
    hints: [
      'Use modulo (%) to cycle through frames',
      'Add a delay counter to control animation speed',
      'Only animate when the character is moving'
    ]
  },
  {
    title: 'Sound Effects and Music',
    description: 'Add audio to your game for an immersive experience.',
    difficulty: 'intermediate',
    category: 'game-development',
    order: 6,
    content: `# Game Audio

## Adding Sound
Sound effects and music make games feel alive! Learn to use the Web Audio API.

\`\`\`javascript
const audio = new Audio('sound.mp3');
audio.play();

// Create sound effects programmatically
const audioContext = new AudioContext();
\`\`\`

## Your Task
Create a simple game with sound effects using oscillators.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Game Audio</title>\n</head>\n<body>\n  <h1>Audio Demo</h1>\n  <button id="jumpBtn">Jump Sound</button>\n  <button id="collectBtn">Collect Sound</button>\n  <button id="hurtBtn">Hurt Sound</button>\n  <button id="winBtn">Win Fanfare</button>\n</body>\n</html>',
      css: 'body {\n  font-family: Arial, sans-serif;\n  padding: 40px;\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n  color: white;\n  text-align: center;\n}\n\nbutton {\n  margin: 10px;\n  padding: 20px 40px;\n  font-size: 20px;\n  cursor: pointer;\n  background: rgba(255,255,255,0.2);\n  color: white;\n  border: 2px solid white;\n  border-radius: 12px;\n  backdrop-filter: blur(10px);\n  transition: all 0.3s;\n}\n\nbutton:hover {\n  background: rgba(255,255,255,0.3);\n  transform: scale(1.05);\n}',
      javascript: 'const audioContext = new (window.AudioContext || window.webkitAudioContext)();\n\nfunction playSound(frequency, duration, type = "sine") {\n  const oscillator = audioContext.createOscillator();\n  const gainNode = audioContext.createGain();\n  \n  oscillator.connect(gainNode);\n  gainNode.connect(audioContext.destination);\n  \n  oscillator.type = type;\n  oscillator.frequency.value = frequency;\n  \n  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);\n  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);\n  \n  oscillator.start(audioContext.currentTime);\n  oscillator.stop(audioContext.currentTime + duration);\n}\n\nfunction jumpSound() {\n  playSound(400, 0.2);\n  setTimeout(() => playSound(600, 0.1), 100);\n}\n\nfunction collectSound() {\n  playSound(800, 0.1);\n  setTimeout(() => playSound(1000, 0.1), 80);\n  setTimeout(() => playSound(1200, 0.1), 160);\n}\n\nfunction hurtSound() {\n  playSound(200, 0.3, "sawtooth");\n}\n\nfunction winSound() {\n  playSound(523, 0.15); // C\n  setTimeout(() => playSound(659, 0.15), 150); // E\n  setTimeout(() => playSound(784, 0.15), 300); // G\n  setTimeout(() => playSound(1047, 0.3), 450); // C\n}\n\ndocument.getElementById("jumpBtn").addEventListener("click", jumpSound);\ndocument.getElementById("collectBtn").addEventListener("click", collectSound);\ndocument.getElementById("hurtBtn").addEventListener("click", hurtSound);\ndocument.getElementById("winBtn").addEventListener("click", winSound);'
    },
    objectives: [
      'Use Web Audio API',
      'Create oscillators for sound effects',
      'Control volume with gain nodes',
      'Create sound sequences'
    ],
    hints: [
      'AudioContext is the main audio interface',
      'Oscillators generate tones',
      'Different frequencies create different pitches',
      'Chain sounds with setTimeout for melodies'
    ]
  },
  {
    title: 'Local Storage and High Scores',
    description: 'Save game data and create a high score system.',
    difficulty: 'intermediate',
    category: 'game-development',
    order: 7,
    content: `# Saving Game Data

## Local Storage
Keep player progress between sessions using browser storage.

\`\`\`javascript
// Save data
localStorage.setItem('highScore', 1000);

// Load data
const score = localStorage.getItem('highScore');
\`\`\`

## Your Task
Build a high score system that persists data.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>High Scores</title>\n</head>\n<body>\n  <h1>High Score System</h1>\n  <div id="gameArea">\n    <p>Current Score: <span id="score">0</span></p>\n    <p>High Score: <span id="highScore">0</span></p>\n    <button onclick="addPoints()">Earn Points</button>\n    <button onclick="resetGame()">Reset Game</button>\n  </div>\n  <div id="leaderboard">\n    <h2>Leaderboard</h2>\n    <ol id="topScores"></ol>\n  </div>\n</body>\n</html>',
      css: 'body {\n  font-family: Arial, sans-serif;\n  padding: 40px;\n  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);\n  color: white;\n  text-align: center;\n}\n\n#gameArea {\n  background: rgba(0,0,0,0.2);\n  padding: 30px;\n  border-radius: 16px;\n  margin: 20px auto;\n  max-width: 400px;\n  backdrop-filter: blur(10px);\n}\n\n#gameArea p {\n  font-size: 24px;\n  margin: 15px 0;\n}\n\nbutton {\n  margin: 10px;\n  padding: 12px 24px;\n  font-size: 16px;\n  cursor: pointer;\n  background: rgba(255,255,255,0.3);\n  color: white;\n  border: 2px solid white;\n  border-radius: 8px;\n}\n\n#leaderboard {\n  background: rgba(0,0,0,0.2);\n  padding: 20px;\n  border-radius: 16px;\n  margin: 20px auto;\n  max-width: 400px;\n  backdrop-filter: blur(10px);\n}\n\n#topScores {\n  text-align: left;\n  font-size: 18px;\n}',
      javascript: `let currentScore = 0;

function loadHighScore() {
  const saved = localStorage.getItem("highScore");
  return saved ? parseInt(saved, 10) : 0;
}

function saveHighScore(score) {
  localStorage.setItem("highScore", score);
}

function loadLeaderboard() {
  const saved = localStorage.getItem("leaderboard");
  return saved ? JSON.parse(saved) : [];
}

function saveLeaderboard(scores) {
  localStorage.setItem("leaderboard", JSON.stringify(scores));
}

function showToast(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  Object.assign(t.style, { position: 'fixed', right: '20px', top: '20px', padding: '12px 16px', background: 'rgba(0,0,0,0.85)', color: 'white', borderRadius: '8px', zIndex: 9999 });
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

function addPoints() {
  const points = Math.floor(Math.random() * 100) + 50;
  currentScore += points;
  document.getElementById("score").textContent = currentScore;

  const highScore = loadHighScore();
  if (currentScore > highScore) {
    saveHighScore(currentScore);
    document.getElementById("highScore").textContent = currentScore;
    showToast("New High Score!");
  }
}

function resetGame() {
  if (currentScore > 0) {
    const leaderboard = loadLeaderboard();
    leaderboard.push(currentScore);
    leaderboard.sort((a, b) => b - a);
    leaderboard.splice(5);
    saveLeaderboard(leaderboard);
    displayLeaderboard();
  }

  currentScore = 0;
  document.getElementById("score").textContent = 0;
}

function displayLeaderboard() {
  const scores = loadLeaderboard();
  const list = document.getElementById("topScores");
  list.innerHTML = "";

  if (scores.length === 0) {
    list.innerHTML = "<li>No scores yet!</li>";
    return;
  }

  scores.forEach(score => {
    const li = document.createElement("li");
    li.textContent = score.toLocaleString();
    list.appendChild(li);
  });
}

document.getElementById("highScore").textContent = loadHighScore();
displayLeaderboard();`
    },
    objectives: [
      'Use localStorage to save data',
      'Load saved data on page load',
      'Store complex data with JSON',
      'Create a leaderboard system'
    ],
    hints: [
      'localStorage only stores strings',
      'Use JSON.stringify() to save objects',
      'Use JSON.parse() to load objects',
      'Always check if data exists before loading'
    ]
  },
  {
    title: 'Particle Effects',
    description: 'Create stunning visual effects with particle systems.',
    difficulty: 'advanced',
    category: 'game-development',
    order: 8,
    content: `# Particle Systems

## Visual Effects
Particles create explosions, magic spells, smoke, and other cool effects!

\`\`\`javascript
class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 4;
    this.vy = (Math.random() - 0.5) * 4;
    this.life = 1.0;
  }
}
\`\`\`

## Your Task
Create an explosion effect when clicking on the canvas.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Particle Effects</title>\n</head>\n<body>\n  <canvas id="gameCanvas" width="800" height="600"></canvas>\n  <div style="color: white; text-align: center; margin-top: 10px;">Click anywhere to create particles!</div>\n</body>\n</html>',
      css: 'body {\n  margin: 0;\n  padding: 20px;\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n  align-items: center;\n  min-height: 100vh;\n  background: #0a0a0a;\n}\n\ncanvas {\n  border: 2px solid #333;\n  background: #1a1a1a;\n  cursor: crosshair;\n}',
      javascript: 'const canvas = document.getElementById("gameCanvas");\nconst ctx = canvas.getContext("2d");\n\nclass Particle {\n  constructor(x, y) {\n    this.x = x;\n    this.y = y;\n    this.vx = (Math.random() - 0.5) * 8;\n    this.vy = (Math.random() - 0.5) * 8;\n    this.life = 1.0;\n    this.size = Math.random() * 4 + 2;\n    this.color = `hsl(${Math.random() * 60 + 180}, 100%, 60%)`;\n  }\n  \n  update() {\n    this.x += this.vx;\n    this.y += this.vy;\n    this.vy += 0.1; // Gravity\n    this.life -= 0.02;\n  }\n  \n  draw() {\n    ctx.save();\n    ctx.globalAlpha = this.life;\n    ctx.fillStyle = this.color;\n    ctx.beginPath();\n    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);\n    ctx.fill();\n    ctx.restore();\n  }\n  \n  isDead() {\n    return this.life <= 0;\n  }\n}\n\nconst particles = [];\n\ncanvas.addEventListener("click", (e) => {\n  const rect = canvas.getBoundingClientRect();\n  const x = e.clientX - rect.left;\n  const y = e.clientY - rect.top;\n  \n  // Create burst of particles\n  for (let i = 0; i < 50; i++) {\n    particles.push(new Particle(x, y));\n  }\n});\n\nfunction update() {\n  // Update all particles\n  for (let i = particles.length - 1; i >= 0; i--) {\n    particles[i].update();\n    if (particles[i].isDead()) {\n      particles.splice(i, 1);\n    }\n  }\n}\n\nfunction draw() {\n  // Fade effect\n  ctx.fillStyle = "rgba(26, 26, 26, 0.1)";\n  ctx.fillRect(0, 0, canvas.width, canvas.height);\n  \n  // Draw all particles\n  particles.forEach(particle => particle.draw());\n  \n  // Draw particle count\n  ctx.fillStyle = "white";\n  ctx.font = "16px Arial";\n  ctx.fillText(`Particles: ${particles.length}`, 10, 30);\n}\n\nfunction gameLoop() {\n  update();\n  draw();\n  requestAnimationFrame(gameLoop);\n}\n\ngameLoop();'
    },
    objectives: [
      'Create particle class with physics',
      'Manage particle lifecycle',
      'Apply gravity and fade effects',
      'Optimize by removing dead particles'
    ],
    hints: [
      'Each particle needs position and velocity',
      'Use life value for fading',
      'Remove particles when life reaches 0',
      'Random values create natural-looking effects'
    ]
  },
  {
    title: 'Enemy AI and Pathfinding',
    description: 'Create intelligent enemies that chase the player.',
    difficulty: 'advanced',
    category: 'game-development',
    order: 9,
    content: `# Enemy AI

## Creating Smart Enemies
Make enemies that follow, patrol, and react to the player!

\`\`\`javascript
function moveTowards(enemy, target) {
  const dx = target.x - enemy.x;
  const dy = target.y - enemy.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  enemy.x += (dx / distance) * enemy.speed;
  enemy.y += (dy / distance) * enemy.speed;
}
\`\`\`

## Your Task
Create enemies that chase the player when nearby.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Enemy AI</title>\n</head>\n<body>\n  <canvas id="gameCanvas" width="800" height="600"></canvas>\n  <div style="color: white; text-align: center; margin-top: 10px;">Avoid the enemies! Use Arrow Keys</div>\n</body>\n</html>',
      css: 'body {\n  margin: 0;\n  padding: 20px;\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n  align-items: center;\n  min-height: 100vh;\n  background: #1a0033;\n}\n\ncanvas {\n  border: 3px solid #330066;\n  background: #0d001a;\n}',
      javascript: 'const canvas = document.getElementById("gameCanvas");\nconst ctx = canvas.getContext("2d");\n\nconst player = { x: 400, y: 300, size: 25, speed: 4 };\n\nclass Enemy {\n  constructor(x, y) {\n    this.x = x;\n    this.y = y;\n    this.size = 20;\n    this.speed = 2;\n    this.detectionRange = 200;\n    this.state = "patrol";\n    this.patrolTarget = { x: Math.random() * canvas.width, y: Math.random() * canvas.height };\n  }\n  \n  update() {\n    const dx = player.x - this.x;\n    const dy = player.y - this.y;\n    const distance = Math.sqrt(dx * dx + dy * dy);\n    \n    if (distance < this.detectionRange) {\n      // Chase player\n      this.state = "chase";\n      this.x += (dx / distance) * this.speed;\n      this.y += (dy / distance) * this.speed;\n    } else {\n      // Patrol\n      this.state = "patrol";\n      const pdx = this.patrolTarget.x - this.x;\n      const pdy = this.patrolTarget.y - this.y;\n      const pdist = Math.sqrt(pdx * pdx + pdy * pdy);\n      \n      if (pdist < 10) {\n        this.patrolTarget = { x: Math.random() * canvas.width, y: Math.random() * canvas.height };\n      } else {\n        this.x += (pdx / pdist) * (this.speed * 0.5);\n        this.y += (pdy / pdist) * (this.speed * 0.5);\n      }\n    }\n  }\n  \n  draw() {\n    // Draw detection range\n    if (this.state === "chase") {\n      ctx.strokeStyle = "rgba(255, 0, 0, 0.2)";\n      ctx.beginPath();\n      ctx.arc(this.x, this.y, this.detectionRange, 0, Math.PI * 2);\n      ctx.stroke();\n    }\n    \n    // Draw enemy\n    ctx.fillStyle = this.state === "chase" ? "#ff0044" : "#ff6b6b";\n    ctx.beginPath();\n    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);\n    ctx.fill();\n  }\n}\n\nconst enemies = [\n  new Enemy(100, 100),\n  new Enemy(700, 100),\n  new Enemy(100, 500),\n  new Enemy(700, 500)\n];\n\nconst keys = {};\nwindow.addEventListener("keydown", (e) => keys[e.key] = true);\nwindow.addEventListener("keyup", (e) => keys[e.key] = false);\n\nfunction update() {\n  if (keys["ArrowUp"]) player.y -= player.speed;\n  if (keys["ArrowDown"]) player.y += player.speed;\n  if (keys["ArrowLeft"]) player.x -= player.speed;\n  if (keys["ArrowRight"]) player.x += player.speed;\n  \n  player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));\n  player.y = Math.max(player.size, Math.min(canvas.height - player.size, player.y));\n  \n  enemies.forEach(enemy => enemy.update());\n}\n\nfunction draw() {\n  ctx.fillStyle = "#0d001a";\n  ctx.fillRect(0, 0, canvas.width, canvas.height);\n  \n  enemies.forEach(enemy => enemy.draw());\n  \n  // Draw player\n  ctx.fillStyle = "#00ffff";\n  ctx.beginPath();\n  ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);\n  ctx.fill();\n}\n\nfunction gameLoop() {\n  update();\n  draw();\n  requestAnimationFrame(gameLoop);\n}\n\ngameLoop();'
    },
    objectives: [
      'Calculate distance between objects',
      'Implement chase behavior',
      'Create patrol patterns',
      'Switch between AI states'
    ],
    hints: [
      'Use distance formula: sqrt(dx^2 + dy^2)',
      'Normalize direction vectors for consistent speed',
      'State machines help organize AI behavior',
      'Detection ranges make AI feel more realistic'
    ]
  },
  {
    title: 'Mobile Touch Controls',
    description: 'Make your game playable on mobile devices with touch input.',
    difficulty: 'intermediate',
    category: 'game-development',
    order: 10,
    content: `# Touch Controls

## Mobile-Friendly Games
Add touch controls so players can enjoy your game on phones and tablets!

\`\`\`javascript
canvas.addEventListener('touchstart', (e) => {
  const touch = e.touches[0];
  const x = touch.clientX;
  const y = touch.clientY;
});
\`\`\`

## Your Task
Create a game with virtual joystick controls for mobile.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Touch Controls</title>\n  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">\n</head>\n<body>\n  <canvas id="gameCanvas" width="800" height="600"></canvas>\n</body>\n</html>',
      css: 'body {\n  margin: 0;\n  padding: 0;\n  overflow: hidden;\n  background: #111;\n  touch-action: none;\n}\n\ncanvas {\n  display: block;\n  margin: 0 auto;\n  background: #222;\n  max-width: 100%;\n  height: auto;\n}',
      javascript: 'const canvas = document.getElementById("gameCanvas");\nconst ctx = canvas.getContext("2d");\n\nconst player = { x: 400, y: 300, size: 25, vx: 0, vy: 0 };\nconst joystick = { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 };\n\n// Touch events\ncanvas.addEventListener("touchstart", (e) => {\n  e.preventDefault();\n  const touch = e.touches[0];\n  const rect = canvas.getBoundingClientRect();\n  joystick.active = true;\n  joystick.startX = touch.clientX - rect.left;\n  joystick.startY = touch.clientY - rect.top;\n  joystick.currentX = joystick.startX;\n  joystick.currentY = joystick.startY;\n});\n\ncanvas.addEventListener("touchmove", (e) => {\n  e.preventDefault();\n  if (joystick.active) {\n    const touch = e.touches[0];\n    const rect = canvas.getBoundingClientRect();\n    joystick.currentX = touch.clientX - rect.left;\n    joystick.currentY = touch.clientY - rect.top;\n  }\n});\n\ncanvas.addEventListener("touchend", (e) => {\n  e.preventDefault();\n  joystick.active = false;\n  player.vx = 0;\n  player.vy = 0;\n});\n\n// Mouse events for desktop testing\ncanvas.addEventListener("mousedown", (e) => {\n  const rect = canvas.getBoundingClientRect();\n  joystick.active = true;\n  joystick.startX = e.clientX - rect.left;\n  joystick.startY = e.clientY - rect.top;\n  joystick.currentX = joystick.startX;\n  joystick.currentY = joystick.startY;\n});\n\ncanvas.addEventListener("mousemove", (e) => {\n  if (joystick.active) {\n    const rect = canvas.getBoundingClientRect();\n    joystick.currentX = e.clientX - rect.left;\n    joystick.currentY = e.clientY - rect.top;\n  }\n});\n\ncanvas.addEventListener("mouseup", () => {\n  joystick.active = false;\n  player.vx = 0;\n  player.vy = 0;\n});\n\nfunction update() {\n  if (joystick.active) {\n    const dx = joystick.currentX - joystick.startX;\n    const dy = joystick.currentY - joystick.startY;\n    const distance = Math.sqrt(dx * dx + dy * dy);\n    const maxDistance = 50;\n    \n    if (distance > 0) {\n      const normalized = Math.min(distance, maxDistance) / maxDistance;\n      player.vx = (dx / distance) * normalized * 6;\n      player.vy = (dy / distance) * normalized * 6;\n    }\n  }\n  \n  player.x += player.vx;\n  player.y += player.vy;\n  \n  player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));\n  player.y = Math.max(player.size, Math.min(canvas.height - player.size, player.y));\n}\n\nfunction draw() {\n  ctx.fillStyle = "#222";\n  ctx.fillRect(0, 0, canvas.width, canvas.height);\n  \n  // Draw joystick\n  if (joystick.active) {\n    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";\n    ctx.lineWidth = 3;\n    ctx.beginPath();\n    ctx.arc(joystick.startX, joystick.startY, 50, 0, Math.PI * 2);\n    ctx.stroke();\n    \n    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";\n    ctx.beginPath();\n    ctx.arc(joystick.currentX, joystick.currentY, 20, 0, Math.PI * 2);\n    ctx.fill();\n    \n    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";\n    ctx.beginPath();\n    ctx.moveTo(joystick.startX, joystick.startY);\n    ctx.lineTo(joystick.currentX, joystick.currentY);\n    ctx.stroke();\n  }\n  \n  // Draw player\n  ctx.fillStyle = "#00ffaa";\n  ctx.beginPath();\n  ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);\n  ctx.fill();\n  \n  // Instructions\n  ctx.fillStyle = "white";\n  ctx.font = "20px Arial";\n  ctx.textAlign = "center";\n  ctx.fillText("Touch/Click and drag to move!", canvas.width / 2, 40);\n}\n\nfunction gameLoop() {\n  update();\n  draw();\n  requestAnimationFrame(gameLoop);\n}\n\ngameLoop();'
    },
    objectives: [
      'Handle touch events',
      'Create virtual joystick',
      'Calculate touch direction and magnitude',
      'Support both mobile and desktop'
    ],
    hints: [
      'Prevent default to avoid scrolling',
      'Use e.touches[0] for first touch point',
      'Calculate distance for joystick strength',
      'Add mouse events for desktop testing'
    ]
  }
];

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected');
    
    // Clear existing modules
    await Module.deleteMany({});
    console.log('Cleared existing modules');
    
    // Insert sample modules
    await Module.insertMany(sampleModules);
    console.log(`Inserted ${sampleModules.length} sample modules`);
    
    console.log('Seed completed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  });
