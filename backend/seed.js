const mongoose = require('mongoose');
const Module = require('./models/Module');
require('dotenv').config();

/**
 * Step verification types (must match backend tutorController.js):
 * - verifyType: 'code'        → AI verifies concept; expectedConsole: null
 * - verifyType: 'checkConsole' → backend checks console output; expectedConsole:
 *   { type: 'any' }            → any output
 *   { type: 'multipleLines' }  → at least 2 lines
 *   { exactLine: 'string' }    → exactly one line matching (strict)
 *   { contains: ['a','b'] }    → each string must appear in some log line
 * - verifyType: 'checkComments' → backend checks for // or multi-line comments; expectedConsole: null
 */
const sampleModules = [
  // =============================================
  //  JAVASCRIPT BASICS (0–9) — beginner
  // =============================================
  {
    title: 'Hello Console',
    description: 'Write your very first lines of JavaScript and watch output appear in the console.',
    difficulty: 'beginner',
    category: 'javascript-basics',
    order: 0,
    content: `# Hello Console

## Why the console?
The console is the quickest way to see what your code is doing. Every game developer uses it constantly to test ideas and squash bugs.

## Printing output
\`\`\`javascript
console.log('Game loaded!');
console.log(42);
console.log(true);
\`\`\`

You can print strings, numbers, booleans — anything.

## Combining values
Pass multiple arguments separated by commas:
\`\`\`javascript
console.log('Score:', 100);
\`\`\`

## Your Task
Print a welcome banner, your player name, starting HP, and a ready status.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head><title>Hello Console</title></head>\n<body>\n  <h1>Open the Console</h1>\n  <p>All output appears in the console panel below the editor.</p>\n</body>\n</html>',
      css: 'body { font-family: system-ui, sans-serif; padding: 2rem; background: #0f172a; color: #e2e8f0; }\nh1 { color: #38bdf8; }',
      javascript: '// Welcome to GamiLearn!\n// Follow the steps on the left to complete this module.\n',
    },
    objectives: [
      'Use console.log to print text',
      'Print numbers and booleans',
      'Combine multiple values in one log',
    ],
    steps: [
      {
        title: 'Print a welcome message',
        instruction: 'Use console.log to print a welcome message (e.g. "Welcome to GamiLearn!"). Run the code and check the console.',
        concept: 'console.log() sends output to the browser console.',
        verifyType: 'checkConsole',
        expectedConsole: { type: 'any' },
      },
      {
        title: 'Log your player name',
        instruction: 'Add a second console.log that prints a player name of your choice (any non-empty string). Run and confirm you see multiple lines.',
        concept: 'Each console.log prints on its own line.',
        verifyType: 'checkConsole',
        expectedConsole: { type: 'multipleLines' },
      },
      {
        title: 'Log a number and a boolean',
        instruction: 'Log the number 100 and the boolean true on separate lines. Run and verify you see several lines in the console.',
        concept: 'JavaScript has different data types: strings, numbers, and booleans.',
        verifyType: 'checkConsole',
        expectedConsole: { type: 'multipleLines' },
      },
      {
        title: 'Print a combined status line',
        instruction: 'Use a single console.log with multiple arguments to print something like: console.log("HP:", 100, "| Ready:", true)',
        concept: 'Passing multiple arguments to console.log separates them with spaces.',
        verifyType: 'code',
        expectedConsole: null,
      },
    ],
    hints: [
      'Strings go in quotes — single or double',
      'Numbers and booleans are written without quotes',
      'Separate multiple values with commas inside console.log()',
    ],
  },
  {
    title: 'Variables and Data Types',
    description: 'Store game data in variables using let and const, and explore strings, numbers, and booleans.',
    difficulty: 'beginner',
    category: 'javascript-basics',
    order: 1,
    content: `# Variables and Data Types

## Storing data
Games constantly track state — a player's name, their score, whether a level is complete. Variables hold that data for you.

## let vs const
- \`const\` — value cannot be reassigned (use for things that stay the same)
- \`let\` — value can change later

\`\`\`javascript
const gameName = 'Dungeon Quest';
let lives = 3;
lives = lives - 1; // now 2
\`\`\`

## Data types
| Type | Example |
|------|---------|
| String | \`'hero'\` |
| Number | \`42\` |
| Boolean | \`true\` |

Use \`typeof\` to check a value's type: \`typeof 42\` → \`"number"\`.

## Your Task
Declare variables for a player profile and log each value along with its type.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head><title>Variables</title></head>\n<body>\n  <h1>Variables &amp; Types</h1>\n  <p>Check the console for output.</p>\n</body>\n</html>',
      css: 'body { font-family: system-ui, sans-serif; padding: 2rem; background: #0f172a; color: #e2e8f0; }\nh1 { color: #a78bfa; }',
      javascript: '// Declare your variables below and log them with typeof.\n',
    },
    objectives: [
      'Declare variables with let and const',
      'Store strings, numbers, and booleans',
      'Inspect types with typeof',
    ],
    steps: [
      {
        title: 'Add a single-line comment',
        instruction: 'Add a single-line comment at the top (e.g. // Player profile variables) describing what the block does.',
        concept: 'Single-line comments use // and help document your code.',
        verifyType: 'checkComments',
        expectedConsole: null,
      },
      {
        title: 'Declare a constant player name',
        instruction: 'Use const to create a variable called playerName and assign it a string value (your name or a character name). Log it.',
        concept: 'const prevents accidental reassignment of values that should stay fixed.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Declare mutable score and alive variables',
        instruction: 'Use let to declare a score variable set to 0 and an isAlive variable set to true. Log both.',
        concept: 'let allows the value to change later — perfect for game state.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Log the type of each variable',
        instruction: 'Use console.log(typeof playerName), console.log(typeof score), and console.log(typeof isAlive) to print each type. Run and check the console.',
        concept: 'typeof returns "string", "number", or "boolean" — useful for debugging.',
        verifyType: 'checkConsole',
        expectedConsole: { contains: ['string', 'number', 'boolean'] },
      },
      {
        title: 'Update score and log the change',
        instruction: 'Add 50 to score (score = score + 50) and log the new value. Try reassigning playerName to see what happens.',
        concept: 'let variables can be updated; const variables throw an error if reassigned.',
        verifyType: 'code',
        expectedConsole: null,
      },
    ],
    hints: [
      'const values cannot be reassigned — you will get an error',
      'typeof always returns a lowercase string like "number"',
      'Use let for any value that will change during the game',
    ],
  },
  {
    title: 'Operators and Expressions',
    description: 'Perform calculations and comparisons — the math behind every game mechanic.',
    difficulty: 'beginner',
    category: 'javascript-basics',
    order: 2,
    content: `# Operators and Expressions

## Arithmetic
\`\`\`javascript
let damage = 25;
let armor = 10;
let actualDamage = damage - armor; // 15
\`\`\`

Operators: \`+\` \`-\` \`*\` \`/\` \`%\` (remainder)

## Comparison
\`\`\`javascript
health > 0    // true / false
score === 100 // strict equality
level !== 1   // not equal
\`\`\`

## Logical
\`\`\`javascript
isAlive && hasKey   // both must be true
isFlying || isSwimming // at least one true
!isGameOver         // flip the boolean
\`\`\`

## Your Task
Calculate damage after armor, check if the player survives, and decide if a treasure chest can be opened.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head><title>Operators</title></head>\n<body>\n  <h1>Operators Lab</h1>\n  <p>Results appear in the console.</p>\n</body>\n</html>',
      css: 'body { font-family: system-ui, sans-serif; padding: 2rem; background: #0f172a; color: #e2e8f0; }\nh1 { color: #fb923c; }',
      javascript: '// Game variables — use these in your calculations\nconst attackPower = 30;\nconst armorRating = 12;\nlet health = 45;\nconst hasKey = true;\nconst isTrapped = false;\n',
    },
    objectives: [
      'Use arithmetic operators for game math',
      'Compare values with === and >',
      'Combine conditions with && and ||',
    ],
    steps: [
      {
        title: 'Calculate net damage',
        instruction: 'Create a variable netDamage equal to attackPower minus armorRating. Log it.',
        concept: 'Subtraction calculates the difference — here it models damage reduction.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Apply damage and check survival',
        instruction: 'Subtract netDamage from health. Then log whether health > 0 (this is a boolean expression).',
        concept: 'Comparison operators return true or false, which drives game decisions.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Check if the chest can open',
        instruction: 'Log the result of hasKey && !isTrapped. The chest opens only when the player has the key AND the area is not trapped.',
        concept: '&& requires both sides to be true; ! flips a boolean.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Use the remainder operator',
        instruction: 'Create a variable turnNumber set to 7. Log turnNumber % 2 to check if the turn is odd or even (0 = even, 1 = odd).',
        concept: 'The remainder (%) operator is useful for alternating turns or cycling through frames.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Add a multi-line comment',
        instruction: 'Add a multi-line comment above the commented block (e.g. /* net damage = attack - armor */) or a short // comment describing one of your calculations.',
        concept: 'Comments document intent; multi-line comments use /* ... */.',
        verifyType: 'checkComments',
        expectedConsole: null,
      },
    ],
    hints: [
      'Remember: === checks equality without type coercion',
      '! flips true to false and false to true',
      '% returns the remainder after division',
    ],
  },
  {
    title: 'Conditionals',
    description: 'Branch your game logic with if/else and make decisions based on player state.',
    difficulty: 'beginner',
    category: 'javascript-basics',
    order: 3,
    content: `# Conditionals

## Making decisions
Games are full of choices: should the enemy attack or flee? Is the player alive or dead? Conditionals answer these questions.

## if / else if / else
\`\`\`javascript
if (health <= 0) {
  console.log('Game Over');
} else if (health < 25) {
  console.log('Danger! Low HP');
} else {
  console.log('Looking good');
}
\`\`\`

## Ternary shorthand
\`\`\`javascript
const status = health > 0 ? 'alive' : 'dead';
\`\`\`

## Your Task
Write a function that assigns a threat level based on an enemy's power and distance, then display the appropriate warning.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head><title>Conditionals</title></head>\n<body>\n  <h1>Threat Detector</h1>\n  <div id="output" style="font-size:1.5rem;margin-top:1rem;"></div>\n</body>\n</html>',
      css: 'body { font-family: system-ui, sans-serif; padding: 2rem; background: #0f172a; color: #e2e8f0; }\nh1 { color: #f87171; }\n#output { padding: 1rem; border-radius: 0.5rem; background: #1e293b; }',
      javascript: '// Enemy stats\nconst enemyPower = 80;\nconst enemyDistance = 15;\nlet playerHealth = 60;\n\n// Write your threat-level logic here\n',
    },
    objectives: [
      'Use if / else if / else to branch logic',
      'Combine conditions for complex checks',
      'Use the ternary operator for quick decisions',
    ],
    steps: [
      {
        title: 'Check if the player is alive',
        instruction: 'Write an if statement: if playerHealth <= 0 log "Game Over", else log "Still fighting".',
        concept: 'if evaluates a boolean expression and runs the block when true.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Determine threat level',
        instruction: 'Add else-if branches: if enemyPower > 70 AND enemyDistance < 20 → log "CRITICAL", else if enemyPower > 50 → log "HIGH", else → log "LOW".',
        concept: 'else-if chains let you check multiple conditions in priority order.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Display threat on the page',
        instruction: 'Store your threat string in a variable. Then set document.getElementById("output").textContent to that variable so it shows on the page.',
        concept: 'Assigning to textContent updates visible text in the DOM.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Use a ternary for a quick status',
        instruction: 'Create a variable shield using a ternary: playerHealth > 50 ? "shield up" : "shield down". Log it.',
        concept: 'The ternary operator is a compact if/else that returns a value.',
        verifyType: 'code',
        expectedConsole: null,
      },
    ],
    hints: [
      'Use && to combine two conditions',
      'Order your if/else-if from most specific to most general',
      'Ternary syntax: condition ? valueIfTrue : valueIfFalse',
    ],
  },
  {
    title: 'Functions',
    description: 'Package reusable game logic into functions with parameters and return values.',
    difficulty: 'beginner',
    category: 'javascript-basics',
    order: 4,
    content: `# Functions

## Why functions?
Instead of copying the same code everywhere, wrap it in a function. Call it whenever you need it.

## Declaration
\`\`\`javascript
function heal(current, amount, max) {
  return Math.min(current + amount, max);
}
\`\`\`

## Arrow syntax
\`\`\`javascript
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
\`\`\`

## Your Task
Create utility functions a game engine would use: calculateDamage, applyHealing, and isInRange.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head><title>Functions</title></head>\n<body>\n  <h1>Utility Toolkit</h1>\n  <pre id="log"></pre>\n</body>\n</html>',
      css: 'body { font-family: system-ui, sans-serif; padding: 2rem; background: #0f172a; color: #e2e8f0; }\nh1 { color: #34d399; }\npre { background: #1e293b; padding: 1rem; border-radius: 0.5rem; font-size: 1rem; }',
      javascript: '// Build your utility functions below.\n// Use the log helper to show results on the page.\nfunction log(text) {\n  document.getElementById("log").textContent += text + "\\n";\n  console.log(text);\n}\n',
    },
    objectives: [
      'Declare functions with parameters and return values',
      'Use Math.min / Math.max for clamping',
      'Call and test functions with different arguments',
    ],
    steps: [
      {
        title: 'Create calculateDamage(base, multiplier)',
        instruction: 'Write a function that returns base * multiplier. Call it with (20, 1.5) and log the result.',
        concept: 'Functions take inputs (parameters) and produce an output (return value).',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Create applyHealing(current, amount, maxHP)',
        instruction: 'Return the healed value but never exceed maxHP. Use Math.min(current + amount, maxHP). Test with (60, 50, 100) — should return 100.',
        concept: 'Math.min picks the smaller value, preventing overflow.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Create isInRange(x1, y1, x2, y2, range)',
        instruction: 'Calculate distance with Math.sqrt((x2-x1)**2 + (y2-y1)**2) and return distance <= range. Test with two points.',
        concept: 'The distance formula is essential for collision checks and AI triggers.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Combine functions in a scenario',
        instruction: 'Simulate: if isInRange(0, 0, 3, 4, 5) is true, call calculateDamage(20, 1.5) and log the damage dealt. Then call applyHealing on the remaining health.',
        concept: 'Composing small functions keeps game logic readable and testable.',
        verifyType: 'code',
        expectedConsole: null,
      },
    ],
    hints: [
      'return exits the function and sends back a value',
      'Math.sqrt(dx*dx + dy*dy) gives the straight-line distance',
      'Test edge cases like healing past max HP',
    ],
  },
  {
    title: 'Arrays',
    description: 'Manage ordered collections — inventories, enemy lists, and leaderboards.',
    difficulty: 'beginner',
    category: 'javascript-basics',
    order: 5,
    content: `# Arrays

## Ordered lists
Arrays store items in order, starting at index 0.

\`\`\`javascript
const inventory = ['sword', 'potion', 'shield'];
console.log(inventory[0]); // 'sword'
console.log(inventory.length); // 3
\`\`\`

## Common methods
| Method | Effect |
|--------|--------|
| push(item) | Add to end |
| pop() | Remove last |
| includes(item) | Check if present |
| indexOf(item) | Find position |
| splice(i, 1) | Remove at index |

## Your Task
Build a simple inventory system: add items, remove items, and display the current list.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head><title>Arrays</title></head>\n<body>\n  <h1>Inventory</h1>\n  <ul id="list"></ul>\n  <button id="addBtn">Add Random Item</button>\n  <button id="useBtn">Use Last Item</button>\n</body>\n</html>',
      css: 'body { font-family: system-ui, sans-serif; padding: 2rem; background: #0f172a; color: #e2e8f0; }\nh1 { color: #facc15; }\nul { list-style: none; padding: 0; }\nli { padding: 0.5rem 1rem; margin: 0.25rem 0; background: #1e293b; border-radius: 0.375rem; }\nbutton { margin-right: 0.5rem; padding: 0.625rem 1.25rem; background: #6366f1; color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-size: 1rem; }\nbutton:hover { background: #4f46e5; }',
      javascript: 'const inventory = [];\nconst lootTable = ["sword", "shield", "potion", "arrow", "gem", "scroll", "ring"];\n\n// Implement addItem, useItem, and render, then wire them to the buttons.\n',
    },
    objectives: [
      'Create arrays and access elements by index',
      'Add and remove items with push and pop',
      'Render array contents to the page',
    ],
    steps: [
      {
        title: 'Implement addItem()',
        instruction: 'Write a function addItem that picks a random element from lootTable (use Math.floor(Math.random() * lootTable.length)) and pushes it into inventory. Then call render().',
        concept: 'push() appends to the end of an array.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Implement useItem()',
        instruction: 'Write useItem that calls pop() on inventory (only if inventory.length > 0) and logs what was used. Then call render().',
        concept: 'pop() removes and returns the last element — like using the most recent pickup.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Implement render()',
        instruction: 'Clear #list innerHTML, then loop through inventory and create an <li> for each item. Append each to #list.',
        concept: 'Rebuilding the list from the array keeps the UI in sync with the data.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Wire buttons and test',
        instruction: 'Add click event listeners to #addBtn and #useBtn that call addItem and useItem. Click each button several times and verify the list updates.',
        concept: 'addEventListener connects user actions to your functions.',
        verifyType: 'code',
        expectedConsole: null,
      },
    ],
    hints: [
      'Math.floor(Math.random() * arr.length) gives a random index',
      'Check inventory.length before calling pop()',
      'Use innerHTML = "" to clear a container before re-rendering',
    ],
  },
  {
    title: 'Loops',
    description: 'Repeat actions efficiently — spawn enemies, animate frames, process input queues.',
    difficulty: 'beginner',
    category: 'javascript-basics',
    order: 6,
    content: `# Loops

## Repeating work
Loops run a block of code multiple times. Games use them to iterate over enemies, draw tiles, and process events.

## for loop
\`\`\`javascript
for (let i = 0; i < 5; i++) {
  console.log('Enemy', i);
}
\`\`\`

## for...of (iterate values)
\`\`\`javascript
const weapons = ['bow', 'axe', 'staff'];
for (const w of weapons) {
  console.log(w);
}
\`\`\`

## while
\`\`\`javascript
let stamina = 10;
while (stamina > 0) {
  stamina -= 3;
}
\`\`\`

## Your Task
Use loops to spawn a grid of enemies, filter items from an inventory, and simulate a battle countdown.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head><title>Loops</title></head>\n<body>\n  <h1>Loop Training</h1>\n  <div id="grid" style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:1rem;"></div>\n  <pre id="log"></pre>\n</body>\n</html>',
      css: 'body { font-family: system-ui, sans-serif; padding: 2rem; background: #0f172a; color: #e2e8f0; }\nh1 { color: #f472b6; }\n.cell { width: 40px; height: 40px; border-radius: 0.25rem; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; }\npre { background: #1e293b; padding: 1rem; border-radius: 0.5rem; }',
      javascript: 'function log(text) {\n  document.getElementById("log").textContent += text + "\\n";\n  console.log(text);\n}\n\nconst grid = document.getElementById("grid");\n\n// Use loops to complete the steps.\n',
    },
    objectives: [
      'Use for loops with counters',
      'Iterate arrays with for...of',
      'Use while for condition-based repetition',
    ],
    steps: [
      {
        title: 'Spawn a 5×5 grid of cells',
        instruction: 'Use a nested for loop (row 0–4, col 0–4). For each cell create a div with class "cell", set its background to a color (e.g. row % 2 === 0 ? "#334155" : "#475569"), and append it to #grid.',
        concept: 'Nested loops are perfect for generating 2D grids (tiles, boards, maps).',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Log each enemy name with for...of',
        instruction: 'Create an array enemies with at least 4 names. Use for...of to loop over it and call log() for each.',
        concept: 'for...of reads values directly — no index needed.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Filter potions from an inventory',
        instruction: 'Create an inventory array with mixed items. Use a for loop and an if check to push only items that include "potion" into a new potions array. Log the potions array.',
        concept: 'Looping and filtering is a pattern you will use constantly in games.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Simulate a stamina drain with while',
        instruction: 'Set let stamina = 20. Write a while (stamina > 0) loop that subtracts a random amount (1–5) each iteration and logs stamina. Log "Exhausted!" after the loop.',
        concept: 'while loops run until a condition is false — useful for drain/regen simulations.',
        verifyType: 'code',
        expectedConsole: null,
      },
    ],
    hints: [
      'Nested loops: outer controls rows, inner controls columns',
      'for...of does not give you the index — use for if you need it',
      'Be careful with while — ensure the condition will eventually be false',
    ],
  },
  {
    title: 'Objects',
    description: 'Model game entities with objects — properties for data, methods for behavior.',
    difficulty: 'beginner',
    category: 'javascript-basics',
    order: 7,
    content: `# Objects

## Bundling data
Objects group related values under one name — ideal for characters, enemies, and items.

\`\`\`javascript
const player = {
  name: 'Rogue',
  hp: 100,
  attack: 15,
  greet() {
    return \`I am \${this.name}\`;
  }
};
\`\`\`

## Access
\`\`\`javascript
player.hp       // dot notation
player['name']  // bracket notation
\`\`\`

## Your Task
Create a character sheet object, add methods for attacking and healing, and display it on the page.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head><title>Objects</title></head>\n<body>\n  <h1>Character Sheet</h1>\n  <div id="sheet"></div>\n  <button id="atkBtn">Attack Dummy</button>\n  <button id="healBtn">Heal</button>\n</body>\n</html>',
      css: 'body { font-family: system-ui, sans-serif; padding: 2rem; background: #0f172a; color: #e2e8f0; }\nh1 { color: #22d3ee; }\n#sheet { background: #1e293b; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; font-size: 1.1rem; line-height: 1.8; }\nbutton { margin-right: 0.5rem; padding: 0.625rem 1.25rem; background: #6366f1; color: white; border: none; border-radius: 0.375rem; cursor: pointer; }\nbutton:hover { background: #4f46e5; }',
      javascript: '// Create your character object and methods below.\n',
    },
    objectives: [
      'Create objects with properties and methods',
      'Use this inside methods',
      'Update the DOM from object state',
    ],
    steps: [
      {
        title: 'Create a character object',
        instruction: 'Declare const hero = { name: "Paladin", hp: 100, maxHp: 100, attack: 18, xp: 0 }. Log the object.',
        concept: 'Object literals use key: value pairs inside curly braces.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Add a describe() method',
        instruction: 'Add a method describe() that returns a template literal: "${this.name} | HP: ${this.hp}/${this.maxHp} | ATK: ${this.attack} | XP: ${this.xp}". Log hero.describe().',
        concept: 'Methods are functions on an object — this refers to the object itself.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Add takeDamage and heal methods',
        instruction: 'Add takeDamage(amount) that reduces this.hp (min 0 with Math.max). Add heal(amount) that increases this.hp (max this.maxHp with Math.min). Test both and log results.',
        concept: 'Clamping with Math.max and Math.min keeps values in valid bounds.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Render to the page and wire buttons',
        instruction: 'Write a render function that sets #sheet innerHTML to hero.describe(). Wire #atkBtn to call hero.takeDamage(15) then render, and #healBtn to call hero.heal(20) then render.',
        concept: 'Updating the DOM after every state change keeps the display accurate.',
        verifyType: 'code',
        expectedConsole: null,
      },
    ],
    hints: [
      'this.hp inside a method refers to the object\'s hp property',
      'Math.max(0, value) ensures the value never goes below 0',
      'Call render() after any change to update the screen',
    ],
  },
  {
    title: 'DOM Manipulation',
    description: 'Select, create, and modify HTML elements to build dynamic game interfaces.',
    difficulty: 'beginner',
    category: 'javascript-basics',
    order: 8,
    content: `# DOM Manipulation

## The DOM
The DOM (Document Object Model) is the live tree of HTML elements. JavaScript can read, change, add, and remove elements.

## Selecting elements
\`\`\`javascript
const el = document.getElementById('score');
const items = document.querySelectorAll('.item');
\`\`\`

## Changing content & style
\`\`\`javascript
el.textContent = 'Score: 42';
el.classList.add('highlight');
el.style.color = '#4ade80';
\`\`\`

## Creating elements
\`\`\`javascript
const card = document.createElement('div');
card.className = 'card';
card.textContent = 'New item';
document.body.appendChild(card);
\`\`\`

## Your Task
Build a dynamic quest log that lets you add quests, mark them complete, and remove them.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head><title>DOM</title></head>\n<body>\n  <h1>Quest Log</h1>\n  <div id="form">\n    <input id="questInput" placeholder="Enter a quest..." />\n    <button id="addBtn">Add Quest</button>\n  </div>\n  <ul id="quests"></ul>\n  <p id="count">Quests: 0</p>\n</body>\n</html>',
      css: 'body { font-family: system-ui, sans-serif; padding: 2rem; background: #0f172a; color: #e2e8f0; }\nh1 { color: #fbbf24; }\n#form { display: flex; gap: 0.5rem; margin-bottom: 1rem; }\ninput { flex: 1; padding: 0.5rem; border-radius: 0.375rem; border: 1px solid #475569; background: #1e293b; color: #e2e8f0; font-size: 1rem; }\nbutton { padding: 0.5rem 1rem; background: #6366f1; color: white; border: none; border-radius: 0.375rem; cursor: pointer; }\nul { list-style: none; padding: 0; }\nli { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; margin: 0.25rem 0; background: #1e293b; border-radius: 0.375rem; }\nli.done { text-decoration: line-through; opacity: 0.5; }\n.remove-btn { background: #ef4444; padding: 0.25rem 0.75rem; border-radius: 0.25rem; border: none; color: white; cursor: pointer; }',
      javascript: '// Wire up the quest log functionality below.\n',
    },
    objectives: [
      'Select elements with getElementById and querySelector',
      'Create and append new elements',
      'Toggle classes and remove elements',
    ],
    steps: [
      {
        title: 'Select the key DOM elements',
        instruction: 'Use document.getElementById to get the input, add button, quest list, and count paragraph. Store them in variables.',
        concept: 'getElementById returns a single element by its id attribute.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Create and append a quest item',
        instruction: 'Write addQuest(). Read the input value, create an <li>, set its textContent, append it to the list, clear the input, and update the count.',
        concept: 'createElement + appendChild adds new content to the page dynamically.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Toggle completion on click',
        instruction: 'When the <li> text is clicked, toggle the "done" class using classList.toggle("done"). This strikes through the text.',
        concept: 'classList.toggle adds the class if missing, removes it if present.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Add a remove button to each quest',
        instruction: 'Inside addQuest, create a button with class "remove-btn" and text "✕". On click, call li.remove() to delete the quest and update the count.',
        concept: 'element.remove() deletes it from the DOM entirely.',
        verifyType: 'code',
        expectedConsole: null,
      },
    ],
    hints: [
      'Read input value with inputEl.value',
      'Reset input with inputEl.value = ""',
      'querySelectorAll("#quests li").length gives the current count',
    ],
  },
  {
    title: 'Events and Interaction',
    description: 'Respond to clicks, keypresses, and mouse movements to create interactive experiences.',
    difficulty: 'beginner',
    category: 'javascript-basics',
    order: 9,
    content: `# Events and Interaction

## Event listeners
\`\`\`javascript
button.addEventListener('click', () => {
  console.log('Clicked!');
});
\`\`\`

## Keyboard events
\`\`\`javascript
window.addEventListener('keydown', (e) => {
  console.log(e.key); // 'ArrowUp', 'a', ' ', etc.
});
\`\`\`

## Mouse tracking
\`\`\`javascript
canvas.addEventListener('mousemove', (e) => {
  const x = e.offsetX;
  const y = e.offsetY;
});
\`\`\`

## Your Task
Build a small interactive playground: a click counter, a key display, and a mouse-tracking spotlight.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head><title>Events</title></head>\n<body>\n  <h1>Event Playground</h1>\n  <div id="panels">\n    <div class="panel">\n      <h2>Clicks</h2>\n      <button id="clickBtn">Click Me</button>\n      <p id="clickCount">0</p>\n    </div>\n    <div class="panel">\n      <h2>Last Key</h2>\n      <p id="keyDisplay">Press any key…</p>\n    </div>\n    <div class="panel">\n      <h2>Mouse</h2>\n      <div id="tracker"></div>\n    </div>\n  </div>\n</body>\n</html>',
      css: 'body { font-family: system-ui, sans-serif; padding: 2rem; background: #0f172a; color: #e2e8f0; }\nh1 { color: #c084fc; }\n#panels { display: flex; gap: 1rem; flex-wrap: wrap; }\n.panel { flex: 1; min-width: 180px; background: #1e293b; padding: 1rem; border-radius: 0.5rem; text-align: center; }\nbutton { padding: 0.75rem 1.5rem; background: #6366f1; color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-size: 1rem; }\n#tracker { width: 100%; height: 120px; background: #0f172a; border-radius: 0.375rem; position: relative; overflow: hidden; }\n#dot { width: 20px; height: 20px; background: #c084fc; border-radius: 50%; position: absolute; pointer-events: none; transform: translate(-50%,-50%); transition: left 0.05s, top 0.05s; }',
      javascript: '// Wire up click, keydown, and mousemove events.\n',
    },
    objectives: [
      'Attach click event listeners',
      'Read keyboard input with keydown',
      'Track mouse position with mousemove',
    ],
    steps: [
      {
        title: 'Count button clicks',
        instruction: 'Select #clickBtn and #clickCount. Add a click listener that increments a counter variable and updates #clickCount textContent.',
        concept: 'Click events fire each time the user presses and releases a button.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Display the last key pressed',
        instruction: 'Add a keydown listener on window. Inside, set #keyDisplay textContent to e.key (the name of the key that was pressed).',
        concept: 'e.key gives a readable name like "ArrowUp" or "a".',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Create a tracking dot',
        instruction: 'Create a div with id "dot" and append it to #tracker. Add a mousemove listener on #tracker that sets dot.style.left and dot.style.top to e.offsetX + "px" and e.offsetY + "px".',
        concept: 'offsetX/offsetY give the mouse position relative to the target element.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Combine: click resets, key triggers action',
        instruction: 'Make the click button also reset the dot to center. On pressing "r", reset the click counter to 0 and update the display.',
        concept: 'Combining multiple event types creates richer interactions.',
        verifyType: 'code',
        expectedConsole: null,
      },
    ],
    hints: [
      'Use addEventListener — not onclick attributes',
      'e.key returns the key name as a string',
      'offsetX/offsetY are relative to the element, not the page',
    ],
  },

  // =============================================
  //  GAME DEVELOPMENT (10–19) — intermediate
  // =============================================
  {
    title: 'Canvas Fundamentals',
    description: 'Get a 2D drawing context and render shapes — the foundation of game graphics.',
    difficulty: 'intermediate',
    category: 'game-development',
    order: 10,
    content: `# Canvas Fundamentals

## The \`<canvas>\` element
Canvas is a blank bitmap you draw on with JavaScript. It has no built-in shapes — you create everything in code.

## Getting started
\`\`\`javascript
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
\`\`\`

## Drawing shapes
| Method | Draws |
|--------|-------|
| fillRect(x, y, w, h) | Filled rectangle |
| strokeRect(x, y, w, h) | Outlined rectangle |
| arc(x, y, r, 0, Math.PI*2) | Circle path |
| fill() / stroke() | Renders the current path |

## Your Task
Draw a night scene with a ground plane, a house (rectangles), a moon (circle), and some stars.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head><title>Canvas</title></head>\n<body>\n  <canvas id="game" width="800" height="500"></canvas>\n</body>\n</html>',
      css: 'body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #111; }\ncanvas { border: 2px solid #333; }',
      javascript: 'const canvas = document.getElementById("game");\nconst ctx = canvas.getContext("2d");\n\n// Draw your scene below.\n',
    },
    objectives: [
      'Obtain the 2D rendering context',
      'Draw filled and stroked rectangles',
      'Draw circles using arc + fill',
    ],
    steps: [
      {
        title: 'Fill the sky background',
        instruction: 'Set ctx.fillStyle to a dark blue (e.g. "#0f172a") and call ctx.fillRect(0, 0, canvas.width, canvas.height) to paint the entire canvas.',
        concept: 'fillStyle sets the color for all subsequent fill operations.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Draw the ground',
        instruction: 'Set fillStyle to a green (e.g. "#166534") and draw a rectangle that covers the bottom quarter of the canvas.',
        concept: 'Layering rectangles from back to front builds a scene.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Draw a house with rectangles',
        instruction: 'Draw a main wall rectangle and a smaller door rectangle in a different color. Position the house on the ground.',
        concept: 'Multiple fillRect calls with different coordinates and sizes create composite objects.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Draw a moon and stars with arc',
        instruction: 'Use ctx.beginPath(), ctx.arc(x, y, radius, 0, Math.PI*2), ctx.fill() to draw a yellow moon. Add several small white circles for stars.',
        concept: 'arc() takes center (x,y), radius, and start/end angles in radians.',
        verifyType: 'code',
        expectedConsole: null,
      },
    ],
    hints: [
      'Always call beginPath() before drawing a new circle',
      'Math.PI * 2 radians = 360° = full circle',
      'Draw background layers first, foreground last',
    ],
  },
  {
    title: 'The Game Loop',
    description: 'Create a 60 FPS update-draw cycle with requestAnimationFrame — the heartbeat of any game.',
    difficulty: 'intermediate',
    category: 'game-development',
    order: 11,
    content: `# The Game Loop

## Update → Draw → Repeat
Every game runs a loop that:
1. **Updates** positions, physics, AI
2. **Draws** the current state to screen
3. **Repeats** as fast as the monitor refreshes (~60 FPS)

\`\`\`javascript
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}
gameLoop();
\`\`\`

## Why requestAnimationFrame?
It syncs to the display refresh rate and pauses automatically when the tab is hidden.

## Your Task
Animate a ball that bounces back and forth across the canvas.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head><title>Game Loop</title></head>\n<body>\n  <canvas id="game" width="800" height="400"></canvas>\n</body>\n</html>',
      css: 'body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #0a0a0a; }\ncanvas { border: 2px solid #1e293b; }',
      javascript: 'const canvas = document.getElementById("game");\nconst ctx = canvas.getContext("2d");\n\nlet ball = { x: 100, y: 200, radius: 20, vx: 4, vy: 3 };\n\n// Implement update(), draw(), and gameLoop().\n',
    },
    objectives: [
      'Build an update → draw → repeat cycle',
      'Move objects by adding velocity each frame',
      'Bounce objects off canvas edges',
    ],
    steps: [
      {
        title: 'Write update() to move the ball',
        instruction: 'Add ball.vx to ball.x and ball.vy to ball.y each frame. This moves the ball by its velocity.',
        concept: 'Position += velocity is the simplest motion model.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Bounce off the edges',
        instruction: 'In update(), if ball.x + ball.radius > canvas.width or ball.x - ball.radius < 0, flip ball.vx (*= -1). Same for ball.y and ball.vy.',
        concept: 'Reversing velocity on impact simulates a bounce.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Write draw() to render the ball',
        instruction: 'Clear the canvas with clearRect, then draw the ball as a filled circle using arc(). Pick a bright color.',
        concept: 'Clearing before each draw prevents trails from previous frames.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Start the loop with requestAnimationFrame',
        instruction: 'Write gameLoop() that calls update(), draw(), then requestAnimationFrame(gameLoop). Call gameLoop() once to start.',
        concept: 'requestAnimationFrame schedules the next frame at the display refresh rate.',
        verifyType: 'code',
        expectedConsole: null,
      },
    ],
    hints: [
      'clearRect(0, 0, canvas.width, canvas.height) wipes the canvas',
      'Multiply velocity by -1 to reverse direction',
      'Call gameLoop() once at the bottom to kick things off',
    ],
  },
  {
    title: 'Player Movement',
    description: 'Handle keyboard input so the player can move a character around the canvas.',
    difficulty: 'intermediate',
    category: 'game-development',
    order: 12,
    content: `# Player Movement

## Tracking keys
Use an object to record which keys are currently held down:
\`\`\`javascript
const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);
\`\`\`

## Applying movement
\`\`\`javascript
if (keys['ArrowLeft'])  player.x -= player.speed;
if (keys['ArrowRight']) player.x += player.speed;
\`\`\`

## Keeping in bounds
\`\`\`javascript
player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
\`\`\`

## Your Task
Create a controllable character that moves in four directions and stays within the canvas.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head><title>Movement</title></head>\n<body>\n  <canvas id="game" width="800" height="500"></canvas>\n  <p style="color:#94a3b8;text-align:center;font-family:sans-serif;">Arrow keys or WASD to move</p>\n</body>\n</html>',
      css: 'body { margin: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; background: #0a0a0a; }\ncanvas { border: 2px solid #1e293b; }',
      javascript: 'const canvas = document.getElementById("game");\nconst ctx = canvas.getContext("2d");\n\nconst player = { x: 375, y: 225, size: 40, speed: 5, color: "#4ade80" };\nconst keys = {};\n\n// Add key listeners, update, draw, and game loop.\n',
    },
    objectives: [
      'Track held keys with keydown / keyup',
      'Move the player based on active keys',
      'Clamp position to canvas bounds',
    ],
    steps: [
      {
        title: 'Add keydown and keyup listeners',
        instruction: 'Add two listeners on window: keydown sets keys[e.key] = true, keyup sets keys[e.key] = false.',
        concept: 'Recording key state allows smooth, simultaneous movement.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Move the player in update()',
        instruction: 'Check keys for ArrowUp/w, ArrowDown/s, ArrowLeft/a, ArrowRight/d and adjust player.x or player.y by player.speed.',
        concept: 'Checking every frame lets the player hold a key for continuous motion.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Clamp to canvas bounds',
        instruction: 'After moving, clamp player.x between 0 and canvas.width - player.size, and player.y between 0 and canvas.height - player.size.',
        concept: 'Clamping prevents the player from leaving the visible area.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Draw the player and start the loop',
        instruction: 'In draw(), clear the canvas and draw the player as a filled rectangle. Wire up gameLoop with requestAnimationFrame and start it.',
        concept: 'Combining input, update, and draw creates the full movement system.',
        verifyType: 'code',
        expectedConsole: null,
      },
    ],
    hints: [
      'Use || to support both arrow keys and WASD',
      'Math.max(0, Math.min(limit, value)) clamps in one line',
      'Draw the background first, then the player',
    ],
  },
  {
    title: 'Collision Detection',
    description: 'Detect when game objects overlap — essential for pickups, combat, and boundaries.',
    difficulty: 'intermediate',
    category: 'game-development',
    order: 13,
    content: `# Collision Detection

## AABB (Axis-Aligned Bounding Box)
Two rectangles overlap when they overlap on **both** axes:
\`\`\`javascript
function rectsCollide(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}
\`\`\`

## Circle collision
\`\`\`javascript
function circlesCollide(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist < a.radius + b.radius;
}
\`\`\`

## Your Task
Build a coin-collection game. The player moves with arrow keys and collects coins that appear randomly.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head><title>Collision</title></head>\n<body>\n  <canvas id="game" width="800" height="500"></canvas>\n  <p id="hud" style="color:#fbbf24;text-align:center;font-family:sans-serif;font-size:1.25rem;">Score: 0</p>\n</body>\n</html>',
      css: 'body { margin: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; background: #0a0a0a; }\ncanvas { border: 2px solid #1e293b; }',
      javascript: 'const canvas = document.getElementById("game");\nconst ctx = canvas.getContext("2d");\n\nconst player = { x: 380, y: 230, w: 36, h: 36, speed: 5 };\nlet coin = { x: 0, y: 0, w: 24, h: 24 };\nlet score = 0;\nconst keys = {};\n\nfunction spawnCoin() {\n  coin.x = Math.random() * (canvas.width - coin.w);\n  coin.y = Math.random() * (canvas.height - coin.h);\n}\nspawnCoin();\n\n// Implement rectsCollide, update, draw, and game loop.\n',
    },
    objectives: [
      'Implement AABB collision detection',
      'Respond to collisions (score, respawn)',
      'Combine input, movement, and collision in a loop',
    ],
    steps: [
      {
        title: 'Write rectsCollide(a, b)',
        instruction: 'Implement the AABB check: return true if rectangles a and b overlap on both X and Y axes. Each object has x, y, w, h.',
        concept: 'AABB tests four conditions — all must be true for an overlap.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Check collision in update()',
        instruction: 'After moving the player, call rectsCollide(player, coin). If true, increment score, update #hud text, and call spawnCoin().',
        concept: 'Collision triggers game events like scoring and respawning.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Draw player and coin',
        instruction: 'In draw(), clear the canvas. Draw the player as a green rectangle and the coin as a yellow rectangle.',
        concept: 'Different colors distinguish game objects visually.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Complete the game loop',
        instruction: 'Add key listeners, update() (move + collide), draw(), and gameLoop() with requestAnimationFrame. Run and collect coins!',
        concept: 'The full loop ties input, logic, and rendering together.',
        verifyType: 'code',
        expectedConsole: null,
      },
    ],
    hints: [
      'AABB: check left-right overlap AND top-bottom overlap',
      'Respawn the coin with random coordinates after each pickup',
      'Don\'t forget to clamp the player to canvas bounds',
    ],
  },
  {
    title: 'Game State Management',
    description: 'Organize your game with a state object and handle menus, playing, paused, and game-over states.',
    difficulty: 'intermediate',
    category: 'game-development',
    order: 14,
    content: `# Game State Management

## Why state matters
Real games aren't always in "play" mode. They have title screens, pause menus, and game-over screens. A state variable controls which logic and drawing runs.

\`\`\`javascript
let state = 'menu'; // 'menu' | 'playing' | 'paused' | 'gameover'

function gameLoop() {
  if (state === 'playing') {
    update();
  }
  draw();
  requestAnimationFrame(gameLoop);
}
\`\`\`

## Your Task
Create a game with four states: title menu, playing, paused, and game over. Each state shows different content and responds to different input.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head><title>Game States</title></head>\n<body>\n  <canvas id="game" width="800" height="500"></canvas>\n</body>\n</html>',
      css: 'body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #0a0a0a; }\ncanvas { border: 2px solid #1e293b; }',
      javascript: 'const canvas = document.getElementById("game");\nconst ctx = canvas.getContext("2d");\n\nlet state = "menu";\nlet player = { x: 380, y: 230, w: 30, h: 30, speed: 4 };\nlet timer = 10;\nlet frameCount = 0;\nconst keys = {};\n\nwindow.addEventListener("keydown", e => keys[e.key] = true);\nwindow.addEventListener("keyup", e => keys[e.key] = false);\n\n// Build the state machine: menu, playing, paused, gameover.\n',
    },
    objectives: [
      'Use a state variable to control game flow',
      'Draw different screens per state',
      'Transition between states with input',
    ],
    steps: [
      {
        title: 'Draw the title menu',
        instruction: 'In draw(), when state === "menu", fill a dark background and draw centered text: "PRESS ENTER TO START" and the game title.',
        concept: 'ctx.fillText(text, x, y) draws text; ctx.textAlign = "center" centers it.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Transition to playing on Enter',
        instruction: 'In your keydown listener (or a handleInput function), if state is "menu" and e.key is "Enter", set state = "playing" and reset the timer.',
        concept: 'State transitions happen in response to player input.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Build playing and paused states',
        instruction: 'In update(), only move the player when state === "playing". Decrease the timer each second (use frameCount). When "Escape" is pressed during playing, toggle to "paused" and back.',
        concept: 'Pausing freezes update logic while still rendering the screen.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Handle game over',
        instruction: 'When timer reaches 0, set state = "gameover". Draw "GAME OVER" and "Press R to restart". On pressing "r", reset everything and set state = "menu".',
        concept: 'The game-over state shows results and offers a path to replay.',
        verifyType: 'code',
        expectedConsole: null,
      },
    ],
    hints: [
      'Use if/else or switch on the state variable',
      'ctx.font = "32px sans-serif" sets text size',
      'frameCount % 60 === 0 fires roughly once per second at 60 FPS',
    ],
  },
  {
    title: 'Sprite Drawing and Animation',
    description: 'Bring characters to life with frame-based animation using simple shapes.',
    difficulty: 'intermediate',
    category: 'game-development',
    order: 15,
    content: `# Sprite Animation

## Frame cycling
Instead of loading images, we can draw different shapes for each animation frame and cycle through them.

\`\`\`javascript
const sprite = {
  frame: 0,
  maxFrames: 4,
  delay: 0,
  maxDelay: 8,
  advance() {
    if (++this.delay >= this.maxDelay) {
      this.delay = 0;
      this.frame = (this.frame + 1) % this.maxFrames;
    }
  }
};
\`\`\`

## Direction
Track which direction the character faces and choose the appropriate frame set.

## Your Task
Create a character that has idle and walking animations with visible frame changes.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head><title>Sprites</title></head>\n<body>\n  <canvas id="game" width="800" height="500"></canvas>\n  <p style="color:#94a3b8;text-align:center;font-family:sans-serif;">Arrow keys to walk</p>\n</body>\n</html>',
      css: 'body { margin: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; background: #0a0a0a; }\ncanvas { border: 2px solid #1e293b; }',
      javascript: 'const canvas = document.getElementById("game");\nconst ctx = canvas.getContext("2d");\n\nconst player = {\n  x: 380, y: 230, size: 40, speed: 3,\n  frame: 0, maxFrames: 4, delay: 0, maxDelay: 8,\n  moving: false, direction: "right"\n};\nconst keys = {};\nwindow.addEventListener("keydown", e => keys[e.key] = true);\nwindow.addEventListener("keyup", e => keys[e.key] = false);\n\n// Implement frame advancing, direction tracking, and frame-based drawing.\n',
    },
    objectives: [
      'Cycle through animation frames with a delay',
      'Only animate when the character moves',
      'Draw visually distinct frames',
    ],
    steps: [
      {
        title: 'Advance frames only when moving',
        instruction: 'In update(), determine if any movement key is pressed (set player.moving). If moving, increment player.delay; when it reaches player.maxDelay, reset it and advance player.frame with modulo. If not moving, reset frame to 0.',
        concept: 'Frame delay controls animation speed; modulo cycles through frames.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Track facing direction',
        instruction: 'When left is pressed set player.direction = "left", right sets "right". Keep the last direction when the player stops.',
        concept: 'Direction determines which way the sprite faces even when idle.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Draw different frames',
        instruction: 'In draw(), use player.frame to vary the drawing. For example, alternate the leg positions: draw two small rectangles that swap height based on frame % 2. Use player.direction to mirror (e.g. offset the "eye" dot).',
        concept: 'Even simple shape changes across frames give the illusion of movement.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Wire the game loop and test',
        instruction: 'Add movement logic, clamping, and start the game loop. Walk around and verify the character animates while moving and stands still when idle.',
        concept: 'Animation only plays during movement — idle characters stay on frame 0.',
        verifyType: 'code',
        expectedConsole: null,
      },
    ],
    hints: [
      'Modulo: (frame + 1) % maxFrames wraps back to 0',
      'A delay counter prevents the animation from running too fast',
      'Use different rect sizes or positions per frame for simple animation',
    ],
  },
  {
    title: 'Sound Effects with Web Audio',
    description: 'Generate sounds programmatically for jumps, explosions, and power-ups.',
    difficulty: 'intermediate',
    category: 'game-development',
    order: 16,
    content: `# Sound Effects

## Web Audio API
No sound files needed! Generate tones directly:
\`\`\`javascript
const audioCtx = new AudioContext();

function playTone(freq, duration, type) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;           // 'sine', 'square', 'triangle', 'sawtooth'
  osc.frequency.value = freq;
  gain.gain.value = 0.3;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
\`\`\`

## Your Task
Create four distinct sound effects for common game events: jump, collect, damage, and victory.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head><title>Sound FX</title></head>\n<body>\n  <h1>Sound Lab</h1>\n  <div id="buttons"></div>\n</body>\n</html>',
      css: 'body { font-family: system-ui, sans-serif; padding: 2rem; background: linear-gradient(135deg, #312e81, #1e1b4b); color: #e2e8f0; text-align: center; }\nh1 { color: #818cf8; }\n#buttons { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-top: 2rem; }\n.sfx-btn { padding: 1.25rem 2rem; font-size: 1.1rem; border: 2px solid #818cf8; background: rgba(129,140,248,0.15); color: #e2e8f0; border-radius: 0.75rem; cursor: pointer; transition: background 0.2s; }\n.sfx-btn:hover { background: rgba(129,140,248,0.3); }',
      javascript: 'const audioCtx = new (window.AudioContext || window.webkitAudioContext)();\nconst buttons = document.getElementById("buttons");\n\n// Implement playTone and create four distinct sound buttons.\n',
    },
    objectives: [
      'Use the Web Audio API to generate tones',
      'Control frequency, waveform, and duration',
      'Create distinct sound profiles for game events',
    ],
    steps: [
      {
        title: 'Implement playTone(freq, duration, type)',
        instruction: 'Create an oscillator, set its type and frequency. Create a gain node with volume 0.3. Connect osc → gain → destination. Call osc.start() and osc.stop(audioCtx.currentTime + duration).',
        concept: 'Oscillators produce waveforms; gain controls volume.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Create a jump sound',
        instruction: 'Write jumpSound() that plays a rising tone — start at 300 Hz, quickly sweep to 600 Hz using osc.frequency.linearRampToValueAtTime. Add a button labeled "Jump" that calls it.',
        concept: 'Frequency sweeps create a sense of upward motion.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Create collect and damage sounds',
        instruction: 'collectSound(): short, high-pitched "ding" (~800 Hz, sine, 0.1s). damageSound(): low buzz (~150 Hz, sawtooth, 0.3s). Add buttons for each.',
        concept: 'Different waveforms and frequencies create distinct moods.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Create a victory fanfare',
        instruction: 'winSound(): play a sequence of 3 notes using setTimeout (e.g. 523 Hz, 659 Hz, 784 Hz, each 0.2s apart). Add a button.',
        concept: 'setTimeout chains tones into a melody.',
        verifyType: 'code',
        expectedConsole: null,
      },
    ],
    hints: [
      'AudioContext must be created after a user gesture in some browsers',
      'Sine = smooth, Square = retro, Sawtooth = buzzy',
      'Use linearRampToValueAtTime for pitch sweeps',
    ],
  },
  {
    title: 'Score, Lives, and HUD',
    description: 'Build an in-game heads-up display with score, lives, and timers.',
    difficulty: 'intermediate',
    category: 'game-development',
    order: 17,
    content: `# Heads-Up Display (HUD)

## Drawing text on canvas
\`\`\`javascript
ctx.font = 'bold 20px sans-serif';
ctx.fillStyle = '#fff';
ctx.fillText('Score: 100', 16, 30);
\`\`\`

## Tracking game data
Keep score, lives, and time in a simple object:
\`\`\`javascript
const hud = { score: 0, lives: 3, time: 60 };
\`\`\`

## Your Task
Create a mini-game with a visible HUD: a score counter, heart-style lives, and a countdown timer. Collecting coins adds score; hitting obstacles loses a life.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head><title>HUD</title></head>\n<body>\n  <canvas id="game" width="800" height="500"></canvas>\n</body>\n</html>',
      css: 'body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #0a0a0a; }\ncanvas { border: 2px solid #1e293b; }',
      javascript: 'const canvas = document.getElementById("game");\nconst ctx = canvas.getContext("2d");\n\nconst hud = { score: 0, lives: 3, time: 30 };\nlet frameCount = 0;\nconst player = { x: 380, y: 430, w: 36, h: 36, speed: 5 };\nconst coins = [];\nconst obstacles = [];\nconst keys = {};\n\nwindow.addEventListener("keydown", e => keys[e.key] = true);\nwindow.addEventListener("keyup", e => keys[e.key] = false);\n\n// Spawn coins and obstacles, draw the HUD, and build the game loop.\n',
    },
    objectives: [
      'Draw text-based score and timer on the canvas',
      'Represent lives with visual icons',
      'Update HUD values in real time',
    ],
    steps: [
      {
        title: 'Draw score and timer text',
        instruction: 'In drawHUD(), set ctx.font and ctx.fillStyle. Draw "Score: X" at the top-left and "Time: Xs" at the top-right of the canvas.',
        concept: 'fillText places text at the given coordinates.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Draw heart icons for lives',
        instruction: 'Loop hud.lives times. For each life, draw a small red circle (or heart shape) spaced horizontally near the top-center.',
        concept: 'Visual icons communicate faster than numbers.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Spawn coins and obstacles',
        instruction: 'Write spawnCoin() and spawnObstacle() that push new objects with random x positions and y = -20 (they fall down). Call them periodically using frameCount.',
        concept: 'Spawning objects over time creates ongoing challenge.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Complete the gameplay loop',
        instruction: 'Move coins and obstacles downward each frame. If the player collides with a coin: score++. If colliding with an obstacle: lives--. Decrease time every 60 frames. Game over when lives or time reach 0.',
        concept: 'The HUD reflects the live game state updated every frame.',
        verifyType: 'code',
        expectedConsole: null,
      },
    ],
    hints: [
      'ctx.textAlign = "right" helps position text at the right edge',
      'Use frameCount % 60 === 0 for once-per-second events',
      'Remove objects that go off-screen to keep arrays small',
    ],
  },
  {
    title: 'Particle Systems',
    description: 'Create explosion, spark, and trail effects with a lightweight particle engine.',
    difficulty: 'advanced',
    category: 'game-development',
    order: 18,
    content: `# Particle Systems

## How particles work
Spawn many small objects, each with position, velocity, and lifetime. Update physics each frame. Remove when dead.

\`\`\`javascript
class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 6;
    this.vy = (Math.random() - 0.5) * 6;
    this.life = 1.0;     // 1 = alive, 0 = dead
    this.decay = 0.01 + Math.random() * 0.03;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.1;      // gravity
    this.life -= this.decay;
  }
}
\`\`\`

## Your Task
Click the canvas to spawn colorful particle bursts that fade and fall with gravity.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head><title>Particles</title></head>\n<body>\n  <canvas id="game" width="800" height="500"></canvas>\n  <p style="color:#94a3b8;text-align:center;font-family:sans-serif;">Click anywhere to spawn particles</p>\n</body>\n</html>',
      css: 'body { margin: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; background: #000; }\ncanvas { border: 2px solid #1e293b; cursor: crosshair; }',
      javascript: 'const canvas = document.getElementById("game");\nconst ctx = canvas.getContext("2d");\nconst particles = [];\n\nconst colors = ["#f87171","#fb923c","#facc15","#4ade80","#38bdf8","#a78bfa","#f472b6"];\n\n// Implement Particle class, spawn on click, update/draw loop.\n',
    },
    objectives: [
      'Create a Particle class with physics',
      'Spawn particles on click events',
      'Fade particles using globalAlpha and remove dead ones',
    ],
    steps: [
      {
        title: 'Create the Particle class',
        instruction: 'Define a class with constructor(x, y) setting position, random velocity, life = 1, decay, and a random color from the colors array. Add update() that moves and applies gravity, and decreases life.',
        concept: 'Each particle is independent with its own velocity, lifetime, and color.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Spawn particles on click',
        instruction: 'Add a click listener on the canvas. Get the click position (e.offsetX, e.offsetY). Push 30–50 new particles at that position into the array.',
        concept: 'Spawning many particles at once creates an explosion effect.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Draw particles with fading',
        instruction: 'In draw(), for each particle set ctx.globalAlpha = particle.life, draw a small filled circle at its position with its color. Reset globalAlpha to 1 after the loop.',
        concept: 'globalAlpha controls transparency — decreasing life makes particles fade out.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Remove dead particles in the loop',
        instruction: 'After updating, filter out particles where life <= 0 (use particles = particles.filter(p => p.life > 0) or splice). Run the game and click to test!',
        concept: 'Removing dead particles prevents the array from growing forever.',
        verifyType: 'code',
        expectedConsole: null,
      },
    ],
    hints: [
      'gravity: this.vy += 0.1 pulls particles down',
      'Random velocity: (Math.random() - 0.5) * spread gives ± values',
      'Always reset globalAlpha to 1 after drawing particles',
    ],
  },
  {
    title: 'Complete Mini-Game: Asteroid Dodger',
    description: 'Put everything together — a playable game with movement, collision, scoring, sound, and particles.',
    difficulty: 'advanced',
    category: 'game-development',
    order: 19,
    content: `# Asteroid Dodger — Complete Game

## Bringing it all together
You've learned canvas drawing, game loops, input, collision, state management, sound, HUD, and particles. Now combine them into a complete, playable game.

## Game concept
- A ship moves left and right at the bottom
- Asteroids fall from the top at increasing speed
- Stars (coins) appear randomly for bonus points
- Survive as long as possible — each second adds to your score
- Hitting an asteroid ends the game

## Your Task
Build the complete game from the starter code scaffolding.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head><title>Asteroid Dodger</title></head>\n<body>\n  <canvas id="game" width="800" height="600"></canvas>\n</body>\n</html>',
      css: 'body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #000; }\ncanvas { border: 2px solid #1e293b; }',
      javascript: 'const canvas = document.getElementById("game");\nconst ctx = canvas.getContext("2d");\nconst audioCtx = new (window.AudioContext || window.webkitAudioContext)();\n\nlet state = "menu";\nlet score = 0;\nlet highScore = 0;\nlet frameCount = 0;\n\nconst ship = { x: 380, y: 540, w: 40, h: 30, speed: 6 };\nconst asteroids = [];\nconst stars = [];\nconst particles = [];\nconst keys = {};\n\nwindow.addEventListener("keydown", e => { keys[e.key] = true; if (e.key === "Enter" && state !== "playing") startGame(); });\nwindow.addEventListener("keyup", e => keys[e.key] = false);\n\nfunction startGame() {\n  state = "playing";\n  score = 0;\n  frameCount = 0;\n  asteroids.length = 0;\n  stars.length = 0;\n  particles.length = 0;\n  ship.x = 380;\n}\n\n// Build: spawnAsteroid, spawnStar, Particle class, playTone,\n// update (movement, spawning, collision, scoring),\n// draw (background, ship, asteroids, stars, particles, HUD, menu/gameover),\n// and gameLoop.\n',
    },
    objectives: [
      'Combine all previously learned systems',
      'Build a fully playable game with multiple states',
      'Add polish with sound and particles',
    ],
    steps: [
      {
        title: 'Draw background and ship',
        instruction: 'In draw(), fill the canvas dark. Draw the ship as a triangle or rectangle at ship.x, ship.y. Add stars as twinkling dots (random small circles). Draw a HUD with score and high score.',
        concept: 'The background and HUD set the visual context for the player.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Spawn and move asteroids',
        instruction: 'Every ~40 frames, push a new asteroid { x: random, y: -30, w: random(20-50), h: same, speed: random(2-5) }. In update(), move each down by its speed. Remove if off screen.',
        concept: 'Spawning at intervals with randomness creates unpredictable challenge.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Collision, game over, and sound',
        instruction: 'If the ship collides with an asteroid (AABB), play a damage sound, spawn explosion particles at the collision point, set state = "gameover", and update highScore if needed. On the game-over screen show score and "Press Enter".',
        concept: 'Collision triggers a chain: sound → particles → state change → UI update.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Add stars for bonus points',
        instruction: 'Spawn golden star objects that fall slowly. If the ship collects one, add 50 to score, play a collect sound, and spawn small particles. Run the full game and aim for a high score!',
        concept: 'Rewards balance the difficulty and give the player goals.',
        verifyType: 'code',
        expectedConsole: null,
      },
    ],
    hints: [
      'Increase asteroid speed over time for rising difficulty',
      'Use the Particle class from the previous module',
      'localStorage can persist highScore between sessions',
    ],
  },

  // =============================================
  //  MULTIPLAYER (20–24) — intermediate / advanced
  // =============================================
  {
    title: 'Multiplayer Basics — Socket.IO',
    description: 'Connect to a real-time server, send and receive events, and see other players come online.',
    difficulty: 'intermediate',
    category: 'multiplayer',
    order: 20,
    content: `# Socket.IO Basics

## Real-time communication
Socket.IO enables instant, bidirectional messaging between a browser and a server — perfect for multiplayer games.

## Core API
\`\`\`javascript
const socket = io();

// Send an event
socket.emit('hello', { name: 'Player1' });

// Receive an event
socket.on('welcome', (data) => {
  console.log(data.message);
});
\`\`\`

## Connection lifecycle
- \`connect\` — fired when the connection is established
- \`disconnect\` — fired when the connection drops

## Your Task
Set up a Socket.IO connection, send a join event, and display a live list of connected players.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Socket.IO Basics</title>\n  <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>\n</head>\n<body>\n  <h1>Multiplayer Lobby</h1>\n  <div id="status">Connecting…</div>\n  <ul id="players"></ul>\n  <div id="log"></div>\n</body>\n</html>',
      css: 'body { font-family: system-ui, sans-serif; padding: 2rem; background: #0f172a; color: #e2e8f0; }\nh1 { color: #38bdf8; }\n#status { padding: 0.75rem 1rem; background: #1e293b; border-radius: 0.5rem; margin-bottom: 1rem; }\n#status.connected { border-left: 4px solid #4ade80; }\nul { list-style: none; padding: 0; }\nli { padding: 0.5rem 1rem; background: #1e293b; margin: 0.25rem 0; border-radius: 0.375rem; }\n#log { margin-top: 1rem; padding: 1rem; background: #0f0f23; border-radius: 0.5rem; font-family: monospace; font-size: 0.875rem; max-height: 200px; overflow-y: auto; }',
      javascript: 'function addLog(msg) {\n  const el = document.getElementById("log");\n  const d = document.createElement("div");\n  d.textContent = "[" + new Date().toLocaleTimeString() + "] " + msg;\n  el.prepend(d);\n}\n\naddLog("Connecting to server…");\n\n// Implement socket connection, event handlers, and player list rendering.\n',
      serverJs: `const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const players = {};

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("join", (data) => {
    players[socket.id] = { name: data.name, id: socket.id, joinedAt: Date.now() };
    console.log(data.name + " joined");
    io.emit("playerList", Object.values(players));
  });

  socket.on("disconnect", () => {
    const name = players[socket.id]?.name || socket.id;
    console.log(name + " left");
    delete players[socket.id];
    io.emit("playerList", Object.values(players));
  });
});

server.listen(3001, () => console.log("Server on :3001"));`,
    },
    objectives: [
      'Create a Socket.IO connection',
      'Send events with emit()',
      'Listen for events with on()',
      'Handle connect and disconnect',
    ],
    steps: [
      {
        title: 'Create the socket connection',
        instruction: 'Call const socket = io() to open a connection. Listen for "connect": update #status to "Connected ✓", add the "connected" class, and call addLog with your socket.id.',
        concept: 'io() opens a persistent WebSocket connection to the server.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Handle disconnect',
        instruction: 'Listen for "disconnect": reset #status text to "Disconnected", remove the "connected" class, and log the event.',
        concept: 'Detecting disconnects lets you update the UI immediately.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Emit a join event',
        instruction: 'Inside the connect handler, call socket.emit("join", { name: "Player1" }). The server will add you to the player list.',
        concept: 'emit() sends named events with data to the server.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Render the player list',
        instruction: 'Listen for "playerList". Clear #players innerHTML, then loop over the array and create an <li> for each player showing their name. Log the count.',
        concept: 'The server broadcasts the full list so every client stays in sync.',
        verifyType: 'code',
        expectedConsole: null,
      },
    ],
    hints: [
      'socket.id is assigned after the "connect" event fires',
      'emit sends to the server; on receives from the server',
      'The server uses io.emit to broadcast to all connected clients',
    ],
  },
  {
    title: 'Multiplayer — Game State Sync',
    description: 'Send player inputs to an authoritative server and render the shared game state.',
    difficulty: 'intermediate',
    category: 'multiplayer',
    order: 21,
    content: `# Game State Synchronization

## Authoritative server model
The server is the single source of truth. Clients send **inputs** (not positions). The server processes them and broadcasts the resulting **state**.

\`\`\`
Client → emit('input', {up, down, left, right}) → Server
Server → processes input, updates positions → emit('state', gameState)
Client → receives state → draws all players
\`\`\`

## Why this matters
- Prevents cheating (server validates moves)
- Keeps all clients in sync
- Single place to run game logic

## Your Task
Create a shared canvas where multiple players move around. Each client sends arrow-key inputs; the server updates positions and broadcasts state.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>State Sync</title>\n  <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>\n</head>\n<body>\n  <canvas id="game" width="600" height="400"></canvas>\n  <p id="info" style="color:#94a3b8;text-align:center;font-family:sans-serif;">Players: <span id="count">0</span></p>\n</body>\n</html>',
      css: 'body { margin: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; background: #0a0a0a; }\ncanvas { border: 2px solid #334155; border-radius: 0.5rem; }',
      javascript: 'const canvas = document.getElementById("game");\nconst ctx = canvas.getContext("2d");\nlet gameState = { players: {} };\nlet myId = null;\nconst keys = {};\n\nconst socket = io();\n\nwindow.addEventListener("keydown", e => { keys[e.key] = true; });\nwindow.addEventListener("keyup", e => { keys[e.key] = false; });\n\nsocket.on("connect", () => {\n  myId = socket.id;\n  console.log("Connected as", myId);\n});\n\n// Implement: send inputs, receive state, draw all players.\n',
      serverJs: `const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const state = { players: {} };
const colors = ["#4ade80", "#f472b6", "#facc15", "#38bdf8", "#a78bfa"];
let colorIdx = 0;

io.on("connection", (socket) => {
  state.players[socket.id] = {
    x: 100 + Math.random() * 400,
    y: 100 + Math.random() * 200,
    color: colors[colorIdx++ % colors.length],
    size: 20
  };
  io.emit("state", state);

  socket.on("input", (input) => {
    const p = state.players[socket.id];
    if (!p) return;
    const speed = 5;
    if (input.up) p.y = Math.max(0, p.y - speed);
    if (input.down) p.y = Math.min(400 - p.size, p.y + speed);
    if (input.left) p.x = Math.max(0, p.x - speed);
    if (input.right) p.x = Math.min(600 - p.size, p.x + speed);
    io.emit("state", state);
  });

  socket.on("disconnect", () => {
    delete state.players[socket.id];
    io.emit("state", state);
  });
});

server.listen(3001, () => console.log("Sync server on :3001"));`,
    },
    objectives: [
      'Send inputs to the server instead of moving locally',
      'Receive and store server-authoritative state',
      'Render all players from shared state',
    ],
    steps: [
      {
        title: 'Send inputs to the server',
        instruction: 'Write a sendInput function that emits "input" with { up, down, left, right } booleans based on the keys object. Call it every 50ms with setInterval.',
        concept: 'Clients send intentions, not positions — the server decides what happens.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Receive state from the server',
        instruction: 'Listen for "state". Store it in gameState. Update #count with the number of players.',
        concept: 'The server broadcasts the full game state after every change.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Draw all players',
        instruction: 'Write draw(): clear the canvas, loop over gameState.players, draw each as a colored circle at their x,y. Label the local player "You" and others with their last 4 id characters.',
        concept: 'All clients render the same state — this keeps everyone visually in sync.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Run the drawing loop',
        instruction: 'Create a renderLoop with requestAnimationFrame that calls draw(). Start it. Move with arrow keys and verify both clients show the same positions.',
        concept: 'Separating the render loop from network updates gives smooth animation.',
        verifyType: 'code',
        expectedConsole: null,
      },
    ],
    hints: [
      'setInterval(sendInput, 50) sends inputs at 20Hz',
      'Object.keys(gameState.players) gives an array of player IDs',
      'Use ctx.textAlign = "center" to center player labels',
    ],
  },
  {
    title: 'Multiplayer — Turn-Based Game',
    description: 'Build a multiplayer tic-tac-toe where the server enforces turns and detects wins.',
    difficulty: 'intermediate',
    category: 'multiplayer',
    order: 22,
    content: `# Turn-Based Multiplayer

## How turns work
The server tracks whose turn it is. When a player sends a move:
1. Server checks if it's their turn
2. Validates the move
3. Updates the board
4. Checks for a winner
5. Switches the turn
6. Broadcasts new state

## Your Task
Build a networked tic-tac-toe game. Two players connect, the server assigns them X and O, and enforces the rules.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Tic-Tac-Toe</title>\n  <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>\n</head>\n<body>\n  <h1>Tic-Tac-Toe</h1>\n  <div id="status">Waiting for players…</div>\n  <div id="board"></div>\n  <div id="scores">X: <span id="xScore">0</span> — O: <span id="oScore">0</span></div>\n</body>\n</html>',
      css: 'body { font-family: system-ui, sans-serif; padding: 2rem; background: #0f172a; color: #e2e8f0; text-align: center; }\nh1 { color: #818cf8; }\n#status { font-size: 1.25rem; padding: 0.75rem; background: #1e293b; border-radius: 0.5rem; margin-bottom: 1rem; }\n#board { display: inline-grid; grid-template-columns: repeat(3, 90px); gap: 6px; margin-bottom: 1rem; }\n.cell { width: 90px; height: 90px; background: #1e293b; border: 2px solid #334155; border-radius: 0.5rem; font-size: 2.5rem; font-weight: bold; cursor: pointer; color: #e2e8f0; transition: background 0.15s; }\n.cell:hover:not(.taken) { background: #334155; }\n.cell.taken { cursor: not-allowed; }\n.cell.x { color: #4ade80; }\n.cell.o { color: #f472b6; }\n#scores { font-size: 1.1rem; color: #94a3b8; }',
      javascript: 'const socket = io();\nlet myRole = null;\nlet gameState = { board: Array(9).fill(null), turn: "X", scores: { X: 0, O: 0 }, over: false, winner: null };\n\nconst boardEl = document.getElementById("board");\nconst statusEl = document.getElementById("status");\n\nsocket.on("connect", () => console.log("Connected:", socket.id));\nsocket.on("role", (role) => { myRole = role; console.log("You are", role); });\n\n// Build the 3×3 board, handle clicks, receive state, and render.\n',
      serverJs: `const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let game = { board: Array(9).fill(null), turn: "X", scores: { X: 0, O: 0 }, over: false, winner: null };
const roles = {};
const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

function checkWin(b) {
  for (const [a, x, c] of wins) {
    if (b[a] && b[a] === b[x] && b[a] === b[c]) return b[a];
  }
  return null;
}

io.on("connection", (socket) => {
  const count = Object.keys(roles).length;
  const role = count === 0 ? "X" : "O";
  roles[socket.id] = role;
  socket.emit("role", role);
  io.emit("state", game);
  console.log(role + " connected");

  socket.on("move", (idx) => {
    if (game.over) return;
    if (roles[socket.id] !== game.turn) return;
    if (game.board[idx] !== null) return;
    game.board[idx] = game.turn;
    const w = checkWin(game.board);
    if (w) {
      game.winner = w;
      game.over = true;
      game.scores[w]++;
    } else if (game.board.every(c => c !== null)) {
      game.over = true;
      game.winner = null;
    } else {
      game.turn = game.turn === "X" ? "O" : "X";
    }
    io.emit("state", game);
  });

  socket.on("restart", () => {
    game.board = Array(9).fill(null);
    game.turn = "X";
    game.over = false;
    game.winner = null;
    io.emit("state", game);
  });

  socket.on("disconnect", () => {
    console.log(roles[socket.id] + " disconnected");
    delete roles[socket.id];
  });
});

server.listen(3001, () => console.log("TTT server on :3001"));`,
    },
    objectives: [
      'Build a board UI and send moves to the server',
      'Render server state after each move',
      'Show turn indicators and win/draw results',
    ],
    steps: [
      {
        title: 'Build the 3×3 board',
        instruction: 'Create 9 button elements with class "cell". Append them to #board. Each button should call socket.emit("move", index) on click.',
        concept: 'Each cell maps to an index (0–8) in the board array.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Receive and render state',
        instruction: 'Listen for "state". Store it in gameState. In a render function, loop over the 9 cells: set textContent to "X", "O", or "", and add .x, .o, or .taken classes accordingly.',
        concept: 'The client is a pure renderer — it just shows what the server says.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Show turn and role indicators',
        instruction: 'Update #status to show whose turn it is and your role. For example: "Your turn (X)" or "Opponent\'s turn (O)".',
        concept: 'Clear status messages keep both players informed.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Handle game over and restart',
        instruction: 'When gameState.over is true, show "X wins!", "O wins!", or "Draw!" in #status. Update #xScore and #oScore. Add a restart button that emits "restart".',
        concept: 'The game-over state shows results and lets players start a new round.',
        verifyType: 'code',
        expectedConsole: null,
      },
    ],
    hints: [
      'The server rejects moves that aren\'t your turn',
      'Use classList.add/remove to style X and O differently',
      'board.every(c => c !== null) detects a full board (draw)',
    ],
  },
  {
    title: 'Multiplayer — Rooms and Lobbies',
    description: 'Create game rooms with codes, let players join, and implement a ready-up system.',
    difficulty: 'intermediate',
    category: 'multiplayer',
    order: 23,
    content: `# Rooms and Lobbies

## Why rooms?
Instead of one global game, rooms let players form private matches.

## Flow
1. **Create** — host creates a room, gets a code
2. **Join** — another player enters the code
3. **Ready** — both players toggle "ready"
4. **Start** — game begins when all are ready

## Socket.IO rooms
\`\`\`javascript
// Server side
socket.join(roomId);
io.to(roomId).emit('roomUpdate', room);
\`\`\`

## Your Task
Build a lobby UI where players can create rooms, join by code, ready up, and see available rooms.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Game Lobby</title>\n  <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>\n</head>\n<body>\n  <div id="lobby">\n    <h1>Game Lobby</h1>\n    <div id="actions">\n      <button id="createBtn">Create Room</button>\n      <input id="codeInput" placeholder="Room code…" />\n      <button id="joinBtn">Join Room</button>\n    </div>\n    <div id="roomView" style="display:none">\n      <h2>Room: <span id="roomId"></span></h2>\n      <div id="playerSlots"></div>\n      <button id="readyBtn">Ready Up</button>\n      <button id="leaveBtn">Leave</button>\n      <div id="startMsg"></div>\n    </div>\n    <div id="roomList">\n      <h3>Available Rooms</h3>\n      <div id="rooms"></div>\n    </div>\n  </div>\n</body>\n</html>',
      css: 'body { font-family: system-ui, sans-serif; padding: 2rem; background: linear-gradient(135deg, #0f172a, #1e1b4b); color: #e2e8f0; min-height: 100vh; }\n#lobby { max-width: 520px; margin: 0 auto; }\nh1 { color: #818cf8; }\n#actions { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.5rem; }\ninput { flex: 1; padding: 0.625rem; border: 1px solid #475569; background: #1e293b; color: #e2e8f0; border-radius: 0.375rem; font-size: 1rem; }\nbutton { padding: 0.625rem 1.25rem; background: #6366f1; color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-size: 1rem; }\nbutton:hover { background: #4f46e5; }\n#roomView { background: #1e293b; padding: 1.25rem; border-radius: 0.75rem; margin-bottom: 1.5rem; }\n.slot { display: flex; justify-content: space-between; padding: 0.75rem; background: #0f172a; border-radius: 0.375rem; margin: 0.25rem 0; }\n.slot.ready { border-left: 4px solid #4ade80; }\n.room-card { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: #1e293b; border-radius: 0.375rem; margin: 0.25rem 0; }\n#startMsg { font-size: 1.5rem; text-align: center; margin-top: 1rem; color: #4ade80; }',
      javascript: 'const socket = io();\nlet currentRoom = null;\n\nsocket.on("connect", () => console.log("Connected:", socket.id));\n\n// Implement: createRoom, joinRoom, toggleReady, leaveRoom,\n// and listeners for roomCreated, roomUpdate, gameStart, roomsList.\n',
      serverJs: `const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const rooms = {};

function makeCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("createRoom", () => {
    const id = makeCode();
    rooms[id] = { id, players: [{ id: socket.id, name: "Host", ready: false }], maxPlayers: 2 };
    socket.join(id);
    socket.emit("roomCreated", rooms[id]);
    io.emit("roomsList", Object.values(rooms).map(r => ({ id: r.id, count: r.players.length, max: r.maxPlayers })));
  });

  socket.on("joinRoom", (code) => {
    const room = rooms[code];
    if (!room) return socket.emit("error", "Room not found");
    if (room.players.length >= room.maxPlayers) return socket.emit("error", "Room is full");
    room.players.push({ id: socket.id, name: "Player " + (room.players.length + 1), ready: false });
    socket.join(code);
    io.to(code).emit("roomUpdate", room);
    io.emit("roomsList", Object.values(rooms).map(r => ({ id: r.id, count: r.players.length, max: r.maxPlayers })));
  });

  socket.on("toggleReady", (code) => {
    const room = rooms[code];
    if (!room) return;
    const p = room.players.find(p => p.id === socket.id);
    if (p) p.ready = !p.ready;
    io.to(code).emit("roomUpdate", room);
    if (room.players.length >= 2 && room.players.every(p => p.ready)) {
      io.to(code).emit("gameStart");
    }
  });

  socket.on("leaveRoom", (code) => {
    const room = rooms[code];
    if (!room) return;
    room.players = room.players.filter(p => p.id !== socket.id);
    socket.leave(code);
    if (room.players.length === 0) delete rooms[code];
    else io.to(code).emit("roomUpdate", room);
    io.emit("roomsList", Object.values(rooms).map(r => ({ id: r.id, count: r.players.length, max: r.maxPlayers })));
  });

  socket.on("disconnect", () => {
    for (const [code, room] of Object.entries(rooms)) {
      room.players = room.players.filter(p => p.id !== socket.id);
      if (room.players.length === 0) delete rooms[code];
      else io.to(code).emit("roomUpdate", room);
    }
    io.emit("roomsList", Object.values(rooms).map(r => ({ id: r.id, count: r.players.length, max: r.maxPlayers })));
  });
});

server.listen(3001, () => console.log("Lobby server on :3001"));`,
    },
    objectives: [
      'Create and join game rooms',
      'Implement a ready-up system',
      'Display room status and available rooms',
    ],
    steps: [
      {
        title: 'Create a room',
        instruction: 'Wire #createBtn to emit "createRoom". Listen for "roomCreated": store the room id in currentRoom, display #roomView, hide #actions, and show the room code in #roomId.',
        concept: 'The server generates a unique code and adds the host as the first player.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Join a room by code',
        instruction: 'Wire #joinBtn to read #codeInput value and emit "joinRoom" with it. Listen for "roomUpdate" to show the room view with players. Handle "error" events with an alert.',
        concept: 'Joining requires the code to exist and the room to have space.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Toggle ready and show player status',
        instruction: 'Wire #readyBtn to emit "toggleReady" with currentRoom. In the roomUpdate handler, render each player as a .slot div showing name and ready/waiting status.',
        concept: 'The ready system ensures both players are prepared before starting.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Leave room and display available rooms',
        instruction: 'Wire #leaveBtn to emit "leaveRoom" and reset the UI. Listen for "roomsList" to render .room-card elements showing room code and player count, with a Join button on each.',
        concept: 'The lobby shows all rooms and lets players browse or create new ones.',
        verifyType: 'code',
        expectedConsole: null,
      },
    ],
    hints: [
      'Store currentRoom so you can send it with ready/leave events',
      'socket.join on the server groups sockets — io.to(room) sends to that group',
      'Listen for "gameStart" to transition from lobby to gameplay',
    ],
  },
  {
    title: 'Multiplayer — Win Detection and Rematch',
    description: 'Detect winners, display results to all players, and implement a rematch system.',
    difficulty: 'intermediate',
    category: 'multiplayer',
    order: 24,
    content: `# Win Detection and Rematch

## Server-side win checks
The server should check for win conditions after every move. When a winner is found, broadcast the result to all clients.

## Rematch flow
1. Game ends → server emits "gameEnd" with winner info
2. Client shows a results modal
3. Player clicks "Rematch" → server resets state
4. Server emits "rematchStarted" → clients clear UI

## Your Task
Build a number-guessing race for two players. Each round, a target number is set. Players race to guess it. First to 3 wins takes the match. Rematch button resets everything.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Guess Race</title>\n  <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>\n</head>\n<body>\n  <div id="app">\n    <h1>Number Guess Race</h1>\n    <div id="scores">\n      <span class="p1">P1: <b id="s1">0</b></span>\n      <span class="vs">vs</span>\n      <span class="p2">P2: <b id="s2">0</b></span>\n    </div>\n    <div id="round">Round <span id="roundNum">1</span></div>\n    <div id="hint"></div>\n    <div id="guessArea">\n      <input id="guessInput" type="number" placeholder="1–100" />\n      <button id="guessBtn">Guess</button>\n    </div>\n    <div id="feedback"></div>\n  </div>\n  <div id="modal" style="display:none">\n    <div id="modalBox">\n      <h2 id="modalTitle"></h2>\n      <p id="modalMsg"></p>\n      <button id="rematchBtn">Rematch</button>\n    </div>\n  </div>\n</body>\n</html>',
      css: 'body { font-family: system-ui, sans-serif; padding: 2rem; background: #0f172a; color: #e2e8f0; text-align: center; }\nh1 { color: #fbbf24; }\n#scores { font-size: 1.5rem; margin: 1rem 0; }\n.p1 { color: #4ade80; }\n.p2 { color: #f472b6; }\n.vs { margin: 0 1rem; color: #64748b; }\n#round { color: #94a3b8; margin-bottom: 0.5rem; }\n#hint { font-size: 1.1rem; color: #818cf8; margin-bottom: 1rem; }\n#guessArea { display: flex; justify-content: center; gap: 0.5rem; margin-bottom: 1rem; }\ninput[type="number"] { width: 100px; padding: 0.625rem; border: 1px solid #475569; background: #1e293b; color: #e2e8f0; border-radius: 0.375rem; font-size: 1.1rem; text-align: center; }\nbutton { padding: 0.625rem 1.5rem; background: #6366f1; color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-size: 1rem; }\n#feedback { font-size: 1.1rem; min-height: 1.5rem; }\n#modal { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; }\n#modalBox { background: #1e293b; padding: 2.5rem; border-radius: 1rem; border: 2px solid #818cf8; min-width: 300px; }\n#modalBox h2 { font-size: 2rem; margin-bottom: 0.5rem; }\n#modalBox p { color: #94a3b8; margin-bottom: 1.5rem; }',
      javascript: 'const socket = io();\nlet myRole = null;\n\nsocket.on("connect", () => console.log("Connected:", socket.id));\nsocket.on("role", (r) => { myRole = r; console.log("You are", r); });\n\n// Implement: send guesses, receive feedback, update scores,\n// show win modal, and handle rematch.\n',
      serverJs: `const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const WIN_ROUNDS = 3;
let game = { target: 0, scores: { P1: 0, P2: 0 }, round: 1, over: false, winner: null };
const roles = {};

function newTarget() {
  game.target = Math.floor(Math.random() * 100) + 1;
  console.log("Target:", game.target);
}
newTarget();

io.on("connection", (socket) => {
  const num = Object.keys(roles).length + 1;
  const role = "P" + num;
  roles[socket.id] = role;
  socket.emit("role", role);
  io.emit("gameState", game);
  console.log(role + " connected");

  socket.on("guess", (num) => {
    if (game.over) return;
    const role = roles[socket.id];
    if (!role) return;
    const g = parseInt(num);
    if (isNaN(g) || g < 1 || g > 100) return;

    if (g === game.target) {
      game.scores[role]++;
      io.emit("roundWon", { winner: role, target: game.target, scores: game.scores });

      if (game.scores[role] >= WIN_ROUNDS) {
        game.over = true;
        game.winner = role;
        io.emit("gameEnd", { winner: role, scores: game.scores });
      } else {
        game.round++;
        newTarget();
        io.emit("newRound", { round: game.round });
      }
      io.emit("gameState", game);
    } else {
      const hint = g < game.target ? "higher" : "lower";
      socket.emit("guessResult", { guess: g, hint, player: role });
      socket.broadcast.emit("opponentGuessed", { player: role });
    }
  });

  socket.on("rematch", () => {
    game.scores = { P1: 0, P2: 0 };
    game.round = 1;
    game.over = false;
    game.winner = null;
    newTarget();
    io.emit("rematchStarted");
    io.emit("gameState", game);
  });

  socket.on("disconnect", () => {
    console.log(roles[socket.id] + " left");
    delete roles[socket.id];
  });
});

server.listen(3001, () => console.log("Guess Race server on :3001"));`,
    },
    objectives: [
      'Send guesses and receive higher/lower hints',
      'Track scores across multiple rounds',
      'Display win modal and handle rematch',
    ],
    steps: [
      {
        title: 'Send guesses to the server',
        instruction: 'Wire #guessBtn to read #guessInput value and emit "guess". Listen for "guessResult": show the hint ("Try higher" or "Try lower") in #feedback. Clear the input after each guess.',
        concept: 'The server validates the guess and tells you which direction to go.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Handle round wins and new rounds',
        instruction: 'Listen for "roundWon": show who won the round and the target in #feedback. Update #s1 and #s2 from scores. Listen for "newRound": update #roundNum and clear feedback.',
        concept: 'Each round ends when someone guesses correctly; the server picks a new target.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Show the win modal',
        instruction: 'Listen for "gameEnd": set #modalTitle to "P1 Wins!" or "P2 Wins!", set #modalMsg to the final scores, and display #modal.',
        concept: 'A modal overlay clearly communicates the match result.',
        verifyType: 'code',
        expectedConsole: null,
      },
      {
        title: 'Implement rematch',
        instruction: 'Wire #rematchBtn to emit "rematch" and hide the modal. Listen for "rematchStarted": hide the modal, reset all displayed scores and round number, and clear feedback.',
        concept: 'Rematch tells the server to reset; it broadcasts fresh state to both clients.',
        verifyType: 'code',
        expectedConsole: null,
      },
    ],
    hints: [
      'parseInt converts the input string to a number',
      'The server only sends the hint to the guesser, not both players',
      'Listen for "opponentGuessed" to show the other player is active',
    ],
  },
];

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected');

    await Module.deleteMany({});
    console.log('Cleared existing modules');

    await Module.insertMany(sampleModules);
    console.log(`Inserted ${sampleModules.length} sample modules`);

    console.log('Seed completed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  });
