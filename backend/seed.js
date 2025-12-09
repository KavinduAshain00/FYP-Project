const mongoose = require('mongoose');
const Module = require('./models/Module');
require('dotenv').config();

// Sample game development learning modules
const sampleModules = [
  {
    title: 'JavaScript Basics - Variables and Data Types',
    description: 'Learn the fundamentals of JavaScript variables, data types, and basic operations.',
    difficulty: 'beginner',
    category: 'javascript-basics',
    order: 1,
    content: `# JavaScript Basics: Variables and Data Types

## Introduction
JavaScript is the programming language of the web. Let's start with the basics!

## Variables
Variables are containers for storing data values. In JavaScript, we use \`let\`, \`const\`, or \`var\` to declare variables.

\`\`\`javascript
let playerName = "Hero";
const maxHealth = 100;
let currentHealth = 100;
\`\`\`

## Your Task
Create a simple game character with properties using variables. Display them in the console.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>JS Basics</title>\n</head>\n<body>\n  <h1>JavaScript Basics</h1>\n  <p>Open the console to see your code output</p>\n</body>\n</html>',
      css: 'body {\n  font-family: Arial, sans-serif;\n  padding: 20px;\n  background: #f0f0f0;\n}\n\nh1 {\n  color: #333;\n}',
      javascript: '// Create your game character here\nlet characterName = "Hero";\nlet characterLevel = 1;\nlet characterHealth = 100;\n\n// Display character info\nconsole.log("Character Name:", characterName);\nconsole.log("Level:", characterLevel);\nconsole.log("Health:", characterHealth);'
    },
    objectives: [
      'Declare variables using let and const',
      'Assign values to variables',
      'Use console.log to display information'
    ],
    hints: [
      'Use let for values that can change',
      'Use const for values that stay the same',
      'console.log() helps you see your output'
    ]
  },
  {
    title: 'JavaScript Basics - Functions',
    description: 'Learn how to create reusable code with functions.',
    difficulty: 'beginner',
    category: 'javascript-basics',
    order: 2,
    content: `# Functions in JavaScript

## What are Functions?
Functions are reusable blocks of code that perform specific tasks.

\`\`\`javascript
function attackEnemy(damage) {
  console.log("Attacking for " + damage + " damage!");
}

attackEnemy(10);
\`\`\`

## Your Task
Create functions for game actions like attack, heal, and defend.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Functions</title>\n</head>\n<body>\n  <h1>Game Functions</h1>\n  <p>Check console for game actions</p>\n</body>\n</html>',
      css: 'body {\n  font-family: Arial, sans-serif;\n  padding: 20px;\n  background: #e8f4f8;\n}\n\nh1 {\n  color: #2c3e50;\n}',
      javascript: '// Create game action functions\n\nfunction attack(damage) {\n  console.log("⚔️ Attacking for " + damage + " damage!");\n  return damage;\n}\n\nfunction heal(amount) {\n  console.log("❤️ Healing for " + amount + " HP!");\n  return amount;\n}\n\n// Test your functions\nattack(15);\nheal(10);'
    },
    objectives: [
      'Create functions with parameters',
      'Call functions with arguments',
      'Return values from functions'
    ],
    hints: [
      'Functions can take parameters (inputs)',
      'Use the return keyword to send values back',
      'Call functions by their name followed by ()'
    ]
  },
  {
    title: 'Canvas Drawing Basics',
    description: 'Learn to draw shapes on HTML Canvas - the foundation of game graphics.',
    difficulty: 'beginner',
    category: 'game-development',
    order: 1,
    content: `# HTML Canvas - Drawing Basics

## Introduction
The HTML Canvas is where we draw our game graphics. It's like a digital drawing board!

## Getting Started
\`\`\`javascript
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Draw a rectangle
ctx.fillStyle = 'blue';
ctx.fillRect(50, 50, 100, 100);
\`\`\`

## Your Task
Draw a simple game character using basic shapes (rectangles, circles).`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Canvas Drawing</title>\n</head>\n<body>\n  <canvas id="gameCanvas" width="800" height="600"></canvas>\n</body>\n</html>',
      css: 'body {\n  margin: 0;\n  padding: 20px;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  min-height: 100vh;\n  background: #34495e;\n}\n\ncanvas {\n  border: 3px solid #2c3e50;\n  background: white;\n}',
      javascript: 'const canvas = document.getElementById("gameCanvas");\nconst ctx = canvas.getContext("2d");\n\n// Draw a player character (square)\nctx.fillStyle = "#3498db";\nctx.fillRect(100, 100, 50, 50);\n\n// Draw player head (circle)\nctx.fillStyle = "#e74c3c";\nctx.beginPath();\nctx.arc(125, 80, 20, 0, Math.PI * 2);\nctx.fill();\n\nconsole.log("Character drawn!");'
    },
    objectives: [
      'Get canvas context',
      'Draw rectangles with fillRect()',
      'Draw circles with arc()',
      'Change colors with fillStyle'
    ],
    hints: [
      'ctx.fillRect(x, y, width, height) draws a rectangle',
      'ctx.arc(x, y, radius, startAngle, endAngle) draws a circle',
      'Use Math.PI * 2 for a full circle'
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
    title: 'JavaScript - Arrays and Loops',
    description: 'Master arrays and loops to handle multiple game objects efficiently.',
    difficulty: 'beginner',
    category: 'javascript-basics',
    order: 3,
    content: `# Arrays and Loops

## Working with Multiple Items
Games often need to manage many objects - enemies, bullets, collectibles. Arrays and loops help us do this!

\`\`\`javascript
const enemies = ["goblin", "orc", "dragon"];

for (let i = 0; i < enemies.length; i++) {
  console.log("Enemy:", enemies[i]);
}
\`\`\`

## Your Task
Create an inventory system using arrays to store and display items.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Arrays & Loops</title>\n</head>\n<body>\n  <h1>Inventory System</h1>\n  <div id="inventory"></div>\n  <button onclick="addItem()">Add Random Item</button>\n</body>\n</html>',
      css: 'body {\n  font-family: Arial, sans-serif;\n  padding: 40px;\n  background: #2c3e50;\n  color: white;\n}\n\n#inventory {\n  margin: 20px 0;\n  padding: 20px;\n  background: rgba(255,255,255,0.1);\n  border-radius: 8px;\n}\n\nbutton {\n  padding: 12px 24px;\n  font-size: 16px;\n  cursor: pointer;\n  background: #3498db;\n  color: white;\n  border: none;\n  border-radius: 8px;\n}',
      javascript: 'const inventory = [];\nconst possibleItems = ["⚔️ Sword", "🛡️ Shield", "💎 Gem", "🗝️ Key", "📜 Scroll"];\n\nfunction addItem() {\n  const randomItem = possibleItems[Math.floor(Math.random() * possibleItems.length)];\n  inventory.push(randomItem);\n  displayInventory();\n}\n\nfunction displayInventory() {\n  const inventoryDiv = document.getElementById("inventory");\n  inventoryDiv.innerHTML = "<h3>Your Items:</h3>";\n  \n  for (let i = 0; i < inventory.length; i++) {\n    inventoryDiv.innerHTML += `<p>${i + 1}. ${inventory[i]}</p>`;\n  }\n  \n  inventoryDiv.innerHTML += `<p><strong>Total Items: ${inventory.length}</strong></p>`;\n}\n\ndisplayInventory();'
    },
    objectives: [
      'Create and manipulate arrays',
      'Use for loops to iterate through arrays',
      'Add items to arrays with push()',
      'Display array contents dynamically'
    ],
    hints: [
      'Arrays store multiple values in a single variable',
      'Use array.length to get the number of items',
      'Math.floor(Math.random() * array.length) gives a random index'
    ]
  },
  {
    title: 'JavaScript - Objects and Properties',
    description: 'Learn to create complex game entities using JavaScript objects.',
    difficulty: 'beginner',
    category: 'javascript-basics',
    order: 4,
    content: `# Objects and Properties

## Organizing Data
Objects let us group related data together - perfect for game characters, items, and more!

\`\`\`javascript
const player = {
  name: "Hero",
  health: 100,
  attack: function() {
    console.log(this.name + " attacks!");
  }
};
\`\`\`

## Your Task
Create a character creation system using objects with properties and methods.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Objects</title>\n</head>\n<body>\n  <h1>Character Creator</h1>\n  <div id="character"></div>\n  <button onclick="levelUp()">Level Up</button>\n  <button onclick="attack()">Attack</button>\n</body>\n</html>',
      css: 'body {\n  font-family: Arial, sans-serif;\n  padding: 40px;\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n  color: white;\n}\n\n#character {\n  margin: 20px 0;\n  padding: 30px;\n  background: rgba(0,0,0,0.3);\n  border-radius: 12px;\n  backdrop-filter: blur(10px);\n}\n\nbutton {\n  margin: 5px;\n  padding: 12px 24px;\n  font-size: 16px;\n  cursor: pointer;\n  background: #f093fb;\n  color: white;\n  border: none;\n  border-radius: 8px;\n}',
      javascript: 'const character = {\n  name: "Warrior",\n  level: 1,\n  health: 100,\n  maxHealth: 100,\n  attack: 10,\n  \n  levelUp: function() {\n    this.level++;\n    this.maxHealth += 20;\n    this.health = this.maxHealth;\n    this.attack += 5;\n    console.log("Level up! Now level " + this.level);\n  },\n  \n  performAttack: function() {\n    const damage = this.attack + Math.floor(Math.random() * 10);\n    console.log(this.name + " attacks for " + damage + " damage!");\n    return damage;\n  },\n  \n  display: function() {\n    return `<h2>${this.name}</h2>\n            <p>⭐ Level: ${this.level}</p>\n            <p>❤️ Health: ${this.health}/${this.maxHealth}</p>\n            <p>⚔️ Attack Power: ${this.attack}</p>`;\n  }\n};\n\nfunction levelUp() {\n  character.levelUp();\n  updateDisplay();\n}\n\nfunction attack() {\n  const damage = character.performAttack();\n  updateDisplay();\n}\n\nfunction updateDisplay() {\n  document.getElementById("character").innerHTML = character.display();\n}\n\nupdateDisplay();'
    },
    objectives: [
      'Create objects with properties',
      'Add methods to objects',
      'Use "this" keyword to access object properties',
      'Update object data dynamically'
    ],
    hints: [
      'Objects use key-value pairs',
      'Methods are functions inside objects',
      '"this" refers to the current object',
      'Use dot notation to access properties'
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
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Game Audio</title>\n</head>\n<body>\n  <h1>Audio Demo</h1>\n  <button id="jumpBtn">Jump 🎵</button>\n  <button id="collectBtn">Collect 💰</button>\n  <button id="hurtBtn">Hurt 💔</button>\n  <button id="winBtn">Win 🎉</button>\n</body>\n</html>',
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
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>High Scores</title>\n</head>\n<body>\n  <h1>🏆 High Score System</h1>\n  <div id="gameArea">\n    <p>Current Score: <span id="score">0</span></p>\n    <p>High Score: <span id="highScore">0</span></p>\n    <button onclick="addPoints()">Earn Points</button>\n    <button onclick="resetGame()">Reset Game</button>\n  </div>\n  <div id="leaderboard">\n    <h2>Leaderboard</h2>\n    <ol id="topScores"></ol>\n  </div>\n</body>\n</html>',
      css: 'body {\n  font-family: Arial, sans-serif;\n  padding: 40px;\n  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);\n  color: white;\n  text-align: center;\n}\n\n#gameArea {\n  background: rgba(0,0,0,0.2);\n  padding: 30px;\n  border-radius: 16px;\n  margin: 20px auto;\n  max-width: 400px;\n  backdrop-filter: blur(10px);\n}\n\n#gameArea p {\n  font-size: 24px;\n  margin: 15px 0;\n}\n\nbutton {\n  margin: 10px;\n  padding: 12px 24px;\n  font-size: 16px;\n  cursor: pointer;\n  background: rgba(255,255,255,0.3);\n  color: white;\n  border: 2px solid white;\n  border-radius: 8px;\n}\n\n#leaderboard {\n  background: rgba(0,0,0,0.2);\n  padding: 20px;\n  border-radius: 16px;\n  margin: 20px auto;\n  max-width: 400px;\n  backdrop-filter: blur(10px);\n}\n\n#topScores {\n  text-align: left;\n  font-size: 18px;\n}',
      javascript: 'let currentScore = 0;\n\nfunction loadHighScore() {\n  const saved = localStorage.getItem("highScore");\n  return saved ? parseInt(saved) : 0;\n}\n\nfunction saveHighScore(score) {\n  localStorage.setItem("highScore", score);\n}\n\nfunction loadLeaderboard() {\n  const saved = localStorage.getItem("leaderboard");\n  return saved ? JSON.parse(saved) : [];\n}\n\nfunction saveLeaderboard(scores) {\n  localStorage.setItem("leaderboard", JSON.stringify(scores));\n}\n\nfunction showToast(msg) {\n  // basic DOM toast used in sample code (not using React), avoids blocking alert()\n  const t = document.createElement(\'div\');\n  t.textContent = msg;\n  Object.assign(t.style, { position: \'fixed\', right: \'20px\', top: \'20px\', padding: \'12px 16px\', background: \'rgba(0,0,0,0.85)\', color: \'white\', borderRadius: \'8px\', zIndex: 9999 });\n  document.body.appendChild(t);\n  setTimeout(() => t.remove(), 3500);\n}\n\nfunction addPoints() {\n  const points = Math.floor(Math.random() * 100) + 50;\n  currentScore += points;\n  \n  document.getElementById("score").textContent = currentScore;\n  \n  const highScore = loadHighScore();\n  if (currentScore > highScore) {\n    saveHighScore(currentScore);\n    document.getElementById("highScore").textContent = currentScore;\n    showToast("🎉 New High Score!");\n  }\n}\n\nfunction resetGame() {\n  if (currentScore > 0) {\n    const leaderboard = loadLeaderboard();\n    leaderboard.push(currentScore);\n    leaderboard.sort((a, b) => b - a);\n    leaderboard.splice(5); // Keep top 5\n    saveLeaderboard(leaderboard);\n    displayLeaderboard();\n  }\n  \n  currentScore = 0;\n  document.getElementById("score").textContent = 0;\n}\n\nfunction displayLeaderboard() {\n  const scores = loadLeaderboard();\n  const list = document.getElementById("topScores");\n  list.innerHTML = "";\n  \n  if (scores.length === 0) {\n    list.innerHTML = "<li>No scores yet!</li>";\n    return;\n  }\n  \n  scores.forEach(score => {\n    const li = document.createElement("li");\n    li.textContent = score.toLocaleString();\n    list.appendChild(li);\n  });\n}\n\n// Initialize\ndocument.getElementById("highScore").textContent = loadHighScore();\ndisplayLeaderboard();'
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
      'Use distance formula: sqrt(dx² + dy²)',
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
