const mongoose = require('mongoose');
const Module = require('./models/Module');
require('dotenv').config();

// Sample game development learning modules (rewritten and expanded)
const sampleModules = [
  {
    title: 'JavaScript Basics - Comments',
    description: 'Practice adding single-line and multi-line comments. Small steps with concept checks.',
    difficulty: 'beginner',
    category: 'javascript-basics',
    order: 0,
    content: `# Code Comments

## Why comments?
Comments help you and others understand code. They are ignored when the code runs.

## Single-line comments
Use two forward slashes: \`// Everything after is a comment\`

## Multi-line comments
Use \`/* ... */\` to comment out a block. Good for temporarily disabling code or long notes.

\`\`\`javascript
console.log(/*IGNORED!*/ 5); // Still just prints 5
\`\`\`

## Your Task
Follow the steps on the left: add a single-line comment, then use a multi-line comment so only one line is logged.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Comments</title>\n</head>\n<body>\n  <h1>Open the console</h1>\n</body>\n</html>',
      css: 'body { font-family: Arial, sans-serif; padding: 24px; background: #f4f6fb; }\nh1 { color: #1f2d3d; }',
      javascript: `console.log('It was love at first sight.');
// (add your single-line comment on line 1 above)

console.log('The first time Yossarian saw the chaplain he fell madly in love with him.');
console.log('Yossarian was in the hospital with a pain in his liver that fell just short of being jaundice.');
console.log('The doctors were puzzled by the fact that it wasn't quite jaundice.');
console.log('If it became jaundice they could treat it.');
console.log('If it didn't become jaundice and went away they could discharge him.');
console.log('But this just being short of jaundice all the time confused them.');
`,
    },
    objectives: [
      'Add a single-line comment on line 1',
      'Run and check the console',
      'Use a multi-line comment after the first console.log',
      'Run again and verify only one line is logged',
      'Add a short comment above the commented block',
    ],
    steps: [
      { title: "Add a single-line comment on line 1 that says 'Opening line.'", instruction: "On line 1, write a single-line comment that says Opening line. (Use // before the text.)", concept: 'Single-line comments use // and are ignored by JavaScript.', verifyType: 'checkComments', expectedConsole: null },
      { title: 'Run the code and check the console.', instruction: 'Click Run and open the in-app Console panel below. Confirm that all the passage lines are still logged (multiple lines).', concept: 'Comments do not change how the code runs; they are ignored.', verifyType: 'checkConsole', expectedConsole: { type: 'multipleLines' } },
      { title: "Use a multi-line comment to comment out the rest after the first console.log.", instruction: "After the first console.log line, add /* and before the last line add */ so everything in between is commented out. Only 'It was love at first sight.' should run.", concept: 'Multi-line comments use /* and */ and can wrap multiple lines.', verifyType: 'code', expectedConsole: null },
      { title: "Run again and verify only 'It was love at first sight.' is logged.", instruction: 'Click Run again. In the Console panel below you should see only one line: It was love at first sight.', concept: 'Commenting out code prevents it from executing.', verifyType: 'checkConsole', expectedConsole: { exactLine: "It was love at first sight." } },
      { title: "Add a short comment above the commented block (e.g. 'Rest of passage commented out').", instruction: "Above the multi-line comment block, add a single-line comment that briefly describes what you did, e.g. // Rest of passage commented out.", concept: 'Good comments explain intent and help others (and you) understand the code later.', verifyType: 'checkComments', expectedConsole: null },
    ],
    hints: [
      'Single-line comments start with //',
      'Multi-line comments start with /* and end with */',
      'Only "It was love at first sight." should appear in the console when done.',
    ],
  },
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
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Console Warmup</title>\n</head>\n<body>\n  <h1>Open the DevTools console</h1>\n  <p>Use Option+Command+I (Mac) or F12 to open it.</p>\n</body>\n</html>',
      css: 'body { font-family: Arial, sans-serif; padding: 24px; background: #f4f6fb; }\nh1 { color: #1f2d3d; }',
      javascript: 'console.log("Ready! Add your code below.");\n// Step 1: Open the console (F12 or Option+Command+I)\n// Step 2: Add variables for player name, level, and tutorials completed\n// Step 3: Use console.log to print a short status report\n',
    },
    objectives: [
      'Open the browser console',
      'Log strings, numbers, and booleans',
      'Describe what the output means',
    ],
    steps: [
      { title: 'Open the browser console.', instruction: 'Open the in-app Console panel below the editor (or use Option+Command+I on Mac / F12 on Windows). Confirm you can see the Console tab.', concept: 'The console is where JavaScript output and errors appear.', verifyType: 'checkConsole', expectedConsole: null },
      { title: 'Add a variable for player name.', instruction: 'In the JavaScript panel, declare a variable for the player name (e.g. const playerName = "YourName";) and use console.log to print it.', concept: 'Variables store values; console.log displays them in the console.', verifyType: 'code', expectedConsole: null },
      { title: 'Add a starting level and tutorials-completed flag.', instruction: 'Add a variable for starting level (number) and one for whether tutorials are completed (boolean true or false). Log both.', concept: 'Numbers and booleans are core data types in JavaScript.', verifyType: 'code', expectedConsole: null },
      { title: 'Print a short status report.', instruction: 'Use console.log to print a single status line that includes player name, level, and tutorials completed (e.g. "Player X | Level 1 | Tutorials: true").', concept: 'Combining values in a log helps you inspect game state at a glance.', verifyType: 'code', expectedConsole: null },
    ],
    hints: [
      'Use console.log for quick feedback',
      'Strings use quotes, booleans are true/false',
      'Keep logs short and clear',
    ],
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
      css: 'body { font-family: Arial, sans-serif; padding: 24px; background: #eef2f7; color: #1b2a41; }',
      javascript: 'console.log("Ready! Declare variables and log with typeof.");\n// Declare: player name (string), score (number), tutorial complete (boolean)\n// Use const for values that do not change, let for ones that do\n// Log each variable and its type using typeof\n',
    },
    objectives: [
      'Use let and const',
      'Store strings, numbers, and booleans',
      'Use typeof to inspect data',
    ],
    steps: [
      { title: 'Declare a player name with const.', instruction: 'Declare a constant variable for the player name (string). Use const because the name does not change during the exercise.', concept: 'const is for values that should not be reassigned.', verifyType: 'code', expectedConsole: null },
      { title: 'Declare score and tutorial-complete with let.', instruction: 'Declare a score (number) and a boolean for tutorial completion using let. Give them initial values.', concept: 'let allows reassignment; use it for values that may change.', verifyType: 'code', expectedConsole: null },
      { title: 'Log each variable and its type.', instruction: 'Use console.log to print each variable (player name, score, tutorial complete). Then use typeof in console.log to print the type of each (e.g. console.log(typeof score)).', concept: 'typeof returns a string describing the data type.', verifyType: 'code', expectedConsole: null },
      { title: 'Verify output in the console.', instruction: 'Click Run and check the console. You should see the three values and their types: string, number, and boolean.', concept: 'Inspecting types helps you catch bugs and understand data.', verifyType: 'checkConsole', expectedConsole: null },
    ],
    hints: [
      'Choose const when the value should stay fixed',
      'Numbers can be integers or decimals',
      'typeof returns a string like "string" or "number"',
    ],
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
      css: 'body { font-family: Arial, sans-serif; padding: 24px; background: #f7f9fb; color: #1b2a41; }',
      javascript: 'console.log("Ready! Build a status string with template literals.");\n// Create variables: name, level, health, maxHealth\n// Build a status string using a template literal (backticks)\n// Use a string method (e.g. toUpperCase) and log the result\n',
    },
    objectives: [
      'Create template literals',
      'Use string methods like toUpperCase()',
      'Embed variables in strings',
    ],
    steps: [
      { title: 'Create variables for name, level, health, and maxHealth.', instruction: 'Declare variables for player name (string), level (number), health (number), and maxHealth (number). Give them sample values.', concept: 'Variables hold the data you will embed in strings.', verifyType: 'code', expectedConsole: null },
      { title: 'Build a status line with a template literal.', instruction: 'Use backticks to create a template literal that builds a status string like "Name | Level X | Health Y/Z". Use ${variableName} to embed each value.', concept: 'Template literals (backticks) let you embed expressions with ${}.', verifyType: 'code', expectedConsole: null },
      { title: 'Log the status string.', instruction: 'Use console.log to print the status string you built. Run and confirm it appears in the console.', concept: 'Logging helps you verify the formatted output.', verifyType: 'code', expectedConsole: null },
      { title: 'Use a string method and log the result.', instruction: 'Call a string method (e.g. toUpperCase() or trim()) on your status string and log the result. Compare with the original.', concept: 'String methods return new strings; they do not change the original.', verifyType: 'code', expectedConsole: null },
    ],
    hints: [
      'Template literals use backticks, not quotes',
      'Call methods with parentheses, for example text.trim()',
      'Include separators like | for readability',
    ],
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
      css: 'body { font-family: Arial, sans-serif; padding: 24px; background: #e8f4ff; color: #0f172a; }',
      javascript: 'console.log("Ready! Define addScore, takeDamage, resetPlayer and log results.");\n// Define addScore(score, amount) that returns the new score\n// Define takeDamage(health, amount) that returns new health (use Math.max(0, ...))\n// Define resetPlayer() that returns an object { score: 0, health: 100, level: 1 }\n// Call them and log the results\n',
    },
    objectives: [
      'Declare and call functions',
      'Return values instead of mutating globals',
      'Use Math.min/Math.max for bounds',
    ],
    steps: [
      { title: 'Define addScore(score, amount).', instruction: 'Write a function addScore that takes score and amount as parameters and returns the new score (score + amount). Do not use global variables.', concept: 'Functions receive data via parameters and return results.', verifyType: 'code', expectedConsole: null },
      { title: 'Define takeDamage(health, amount).', instruction: 'Write a function takeDamage that takes health and amount and returns the new health. Use Math.max(0, health - amount) so health never goes below zero.', concept: 'Math.max helps clamp values to a minimum.', verifyType: 'code', expectedConsole: null },
      { title: 'Define resetPlayer().', instruction: 'Write a function resetPlayer that takes no parameters and returns an object { score: 0, health: 100, level: 1 }.', concept: 'Functions can return objects to reset or represent state.', verifyType: 'code', expectedConsole: null },
      { title: 'Call the functions and log the results.', instruction: 'Call addScore, takeDamage, and resetPlayer with sample values and use console.log to print each return value. Verify the outputs in the console.', concept: 'Calling functions and logging results confirms they work correctly.', verifyType: 'code', expectedConsole: null },
    ],
    hints: [
      'Pass needed data as parameters',
      'Return new values instead of modifying outer variables',
      'Keep functions focused on one job',
    ],
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
      css: 'body { font-family: Arial, sans-serif; padding: 24px; background: #f3f4f6; color: #111827; }',
      javascript: 'console.log("Ready! Implement chooseAction(health, distance).");\n// Implement chooseAction(health, distance)\n// Return "flee" if health < 20, "attack" if distance > 20, otherwise "defend"\n// Log results for a few different inputs\n',
    },
    objectives: [
      'Use if/else to branch logic',
      'Return different outcomes based on conditions',
      'Keep conditions readable',
    ],
    steps: [
      { title: 'Implement chooseAction(health, distance).', instruction: 'Create a function chooseAction(health, distance) that returns "flee" if health < 20, "attack" if distance > 20, otherwise "defend". Use if/else.', concept: 'Conditionals let you branch logic based on values.', verifyType: 'code', expectedConsole: null },
      { title: 'Return "flee" when health is low.', instruction: 'At the start of chooseAction, check if health < 20 and return "flee" if true. This is the highest-priority case.', concept: 'Checking the most critical condition first keeps logic clear.', verifyType: 'code', expectedConsole: null },
      { title: 'Return "attack" or "defend" based on distance.', instruction: 'If health is not low, check distance > 20 and return "attack"; otherwise return "defend".', concept: 'Order of conditions determines which branch runs.', verifyType: 'code', expectedConsole: null },
      { title: 'Log results for different inputs.', instruction: 'Call chooseAction with several different (health, distance) pairs (e.g. low health, high distance, low distance) and log each result. Verify in the console.', concept: 'Testing with different inputs confirms all branches work.', verifyType: 'code', expectedConsole: null },
    ],
    hints: [
      'Order conditions from most specific to most general',
      'Return early when a decision is made',
      'Use descriptive variable names',
    ],
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
      css: '#inventory { padding: 12px; margin: 16px 0; background: #e5e7eb; border-radius: 8px; font-family: Arial, sans-serif; }\nbutton { margin-right: 8px; padding: 10px 16px; }',
      javascript: 'console.log("Ready! Add inventory with push/pop and render.");\nconst inventory = [];\n// Add addItem() using push; add useItem() using pop\n// Add render() that loops over inventory and updates #inventory\n// Call render() after each change\n',
    },
    objectives: [
      'Create and update arrays',
      'Iterate with for loops',
      'Render array contents to the page',
    ],
    steps: [
      { title: 'Create an inventory array and add items with push.', instruction: 'Declare const inventory = []. Implement addItem() so it pushes a new item (e.g. a string like "potion") into inventory and calls render().', concept: 'Arrays hold ordered lists; push adds to the end.', verifyType: 'code', expectedConsole: null },
      { title: 'Remove an item with pop in useItem().', instruction: 'Implement useItem() so it pops the last item from inventory (if any) and calls render().', concept: 'pop removes and returns the last element.', verifyType: 'code', expectedConsole: null },
      { title: 'Implement render() with a for loop.', instruction: 'Write render() that loops over inventory (for let i = 0; i < inventory.length; i++) and builds a string or HTML showing each item with its index. Update the #inventory element.', concept: 'for loops let you iterate over array indices.', verifyType: 'code', expectedConsole: null },
      { title: 'Call render on load and after each change.', instruction: 'Call render() when the page loads and at the end of addItem() and useItem(). Click the buttons and confirm the list updates.', concept: 'Re-rendering after each change keeps the UI in sync with data.', verifyType: 'code', expectedConsole: null },
    ],
    hints: [
      'Use push to add and pop to remove the last item',
      'Loop until i < array.length',
      'Re-render after each change',
    ],
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
      css: 'body { font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; }\nbutton { margin-top: 12px; padding: 10px 16px; }',
      javascript: 'console.log("Ready! Create character object with levelUp and describe.");\n// Create a character object with name, level, health\n// Add levelUp() method that increases level and health\n// Add describe() method that returns a summary string\n// Add render() and levelUp() functions to update the page\n',
    },
    objectives: [
      'Define objects with properties and methods',
      'Use this to reference object data',
      'Return formatted strings from methods',
    ],
    steps: [
      { title: 'Create a character object with name, level, and health.', instruction: 'Declare an object (e.g. const character = { ... }) with properties name, level, and health. Give them initial values.', concept: 'Objects bundle related data as properties.', verifyType: 'code', expectedConsole: null },
      { title: 'Add a levelUp() method.', instruction: 'Add a method levelUp() to the character object that increases level and health (e.g. this.level++; this.health += 10) and returns a string like "Level up!".', concept: 'Methods are functions on objects; this refers to the object.', verifyType: 'code', expectedConsole: null },
      { title: 'Add a describe() method.', instruction: 'Add a method describe() that returns a summary string using template literals (e.g. "${this.name} | Level ${this.level} | HP ${this.health}").', concept: 'Methods can return formatted strings from object data.', verifyType: 'code', expectedConsole: null },
      { title: 'Wire levelUp() and render() to the page.', instruction: 'Implement a render() function that updates #character with the result of describe(). Call render() on load and from a levelUp() function that calls character.levelUp() and then render().', concept: 'Updating the DOM after state changes keeps the UI in sync.', verifyType: 'code', expectedConsole: null },
    ],
    hints: [
      'Methods are functions defined inside objects',
      'Use template literals to format the summary',
      'Update the DOM after state changes',
    ],
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
      css: 'body { font-family: Arial, sans-serif; padding: 24px; background: #f8fafc; color: #0f172a; }\nbutton { padding: 10px 16px; margin-bottom: 12px; }',
      javascript: 'console.log("Ready! Wire button and status with getElementById and click.");\n// Get the button and status elements with getElementById\n// Use a variable to track running state\n// Add a click listener that toggles running and updates button and status textContent\n',
    },
    objectives: [
      'Select DOM elements with getElementById',
      'Attach click event listeners',
      'Update textContent based on state',
    ],
    steps: [
      { title: 'Get the button and status elements.', instruction: 'Use document.getElementById to get the element with id "start" and the element with id "status". Store them in variables.', concept: 'getElementById returns the first element with that id.', verifyType: 'code', expectedConsole: null },
      { title: 'Add a variable to track running state.', instruction: 'Declare a variable (e.g. let isRunning = false) to track whether the game is running or paused.', concept: 'State variables drive what the UI shows.', verifyType: 'code', expectedConsole: null },
      { title: 'Attach a click listener to the button.', instruction: 'Call button.addEventListener("click", ...). In the handler, toggle isRunning, then update the button textContent to "Pause" or "Start" and the status textContent to "Game is running." or "Game is stopped."', concept: 'Event listeners run your code when the user interacts.', verifyType: 'code', expectedConsole: null },
      { title: 'Verify the toggle works.', instruction: 'Click the button several times. Confirm it switches between Start/Pause and the status line updates accordingly.', concept: 'Updating textContent changes the visible text without affecting HTML structure.', verifyType: 'code', expectedConsole: null },
    ],
    hints: [
      'Track state in a boolean',
      'Update both the button and the status text',
      'Use textContent instead of innerHTML for plain text',
    ],
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
      css: 'body { font-family: Arial, sans-serif; padding: 24px; background: #eef2f7; color: #0f172a; }',
      javascript: 'console.log("Ready! Use console.table and set a breakpoint in adjustHealth.");\n// Create a small array of player objects (name, hp)\n// Use console.table to display them\n// Write adjustHealth(list, name, change) and set a breakpoint inside it\n// Call it and use console.table again to see changes\n',
    },
    objectives: [
      'Use console.warn and console.table',
      'Set a breakpoint and step through code',
      'Inspect how data changes over time',
    ],
    steps: [
      { title: 'Create a small array of player stats.', instruction: 'Create an array of objects, each with name and hp (e.g. [{ name: "Hero", hp: 100 }, { name: "Mage", hp: 80 }]). Log it with console.table.', concept: 'console.table displays arrays and objects in a readable grid.', verifyType: 'code', expectedConsole: null },
      { title: 'Write adjustHealth(list, name, change).', instruction: 'Implement adjustHealth(list, name, change) that finds the player in list by name, adds change to their hp, and returns the updated list (or same list).', concept: 'Functions that modify data are good places to set breakpoints.', verifyType: 'code', expectedConsole: null },
      { title: 'Set a breakpoint inside adjustHealth.', instruction: 'Open DevTools, find the line inside adjustHealth where you update hp, and set a breakpoint (click line number or right-click).', concept: 'Breakpoints pause execution so you can inspect state.', verifyType: 'code', expectedConsole: null },
      { title: 'Call adjustHealth and step through.', instruction: 'Call adjustHealth with your list, a player name, and a change value. When execution pauses, step through (F10) and watch the Scope panel. Then call console.table again on the list.', concept: 'Stepping through code shows how data changes step by step.', verifyType: 'code', expectedConsole: null },
    ],
    hints: [
      'Right-click the line number to toggle a breakpoint',
      'Refresh the page after adding a breakpoint',
      'Check the Scope panel to see variable values',
    ],
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
      css: 'body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #34495e; }\ncanvas { border: 3px solid #2c3e50; background: white; }',
      javascript: 'console.log("Ready! Draw shapes on the canvas.");\nconst canvas = document.getElementById("gameCanvas");\nconst ctx = canvas.getContext("2d");\n// Draw rectangles with fillRect; set fillStyle for color\n// Draw a circle with beginPath, arc(x, y, radius, 0, Math.PI*2), fill\n',
    },
    objectives: [
      'Get a 2D canvas context',
      'Draw rectangles and circles',
      'Change fillStyle to set colors',
    ],
    steps: [
      { title: 'Get the canvas and 2D context.', instruction: 'Use document.getElementById("gameCanvas") to get the canvas. Call canvas.getContext("2d") and store the result in a variable (e.g. ctx).', concept: 'The 2D context provides drawing methods for the canvas.', verifyType: 'code', expectedConsole: null },
      { title: 'Draw a rectangle with fillRect.', instruction: 'Set ctx.fillStyle to a color (e.g. "blue"). Call ctx.fillRect(x, y, width, height) to draw a rectangle (e.g. body of a character).', concept: 'fillStyle sets the fill color; fillRect draws a filled rectangle.', verifyType: 'code', expectedConsole: null },
      { title: 'Draw a circle with arc and fill.', instruction: 'Set fillStyle for the circle. Call ctx.beginPath(), then ctx.arc(x, y, radius, 0, Math.PI * 2), then ctx.fill() to draw a full circle (e.g. head).', concept: 'arc draws part of a circle; Math.PI * 2 is a full circle in radians.', verifyType: 'code', expectedConsole: null },
      { title: 'Combine shapes into a simple character.', instruction: 'Draw at least two shapes (e.g. rectangle body and circle head) with different colors and positions so they form a simple character. Run and confirm they appear on the canvas.', concept: 'Combining basic shapes builds game graphics.', verifyType: 'code', expectedConsole: null },
    ],
    hints: [
      'ctx.fillRect(x, y, width, height) draws rectangles',
      'ctx.arc uses radians; use Math.PI * 2 for a full circle',
      'Call beginPath before drawing arcs',
    ],
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
      css: 'body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #1a1a2e; }\ncanvas { border: 2px solid #16213e; background: #0f3460; }',
      javascript: 'console.log("Ready! Add game loop with update and draw.");\nconst canvas = document.getElementById("gameCanvas");\nconst ctx = canvas.getContext("2d");\nlet playerX = 50;\nlet playerY = 250;\nlet speed = 2;\n// Add update() to change playerX/playerY\n// Add draw() to clearRect then fillRect the player\n// Add gameLoop() that calls update, draw, then requestAnimationFrame(gameLoop)\n// Start with gameLoop();\n',
    },
    objectives: [
      'Create a game loop with requestAnimationFrame',
      'Update game state (position, velocity)',
      'Clear and redraw canvas each frame',
      'Implement basic movement',
    ],
    steps: [
      { title: 'Implement update() to change position.', instruction: 'Write an update() function that changes playerX and playerY (e.g. playerX += speed). This will move the character each frame.', concept: 'Updating position each frame creates movement.', verifyType: 'code', expectedConsole: null },
      { title: 'Implement draw() to clear and draw the player.', instruction: 'Write draw() that calls ctx.clearRect(0, 0, canvas.width, canvas.height), then draws the player (e.g. fillRect) at playerX, playerY.', concept: 'Clearing and redrawing each frame creates smooth animation.', verifyType: 'code', expectedConsole: null },
      { title: 'Create gameLoop() with requestAnimationFrame.', instruction: 'Write gameLoop() that calls update(), then draw(), then requestAnimationFrame(gameLoop). At the end of your script, call gameLoop() once to start.', concept: 'requestAnimationFrame runs the loop at the display refresh rate.', verifyType: 'code', expectedConsole: null },
      { title: 'Run and verify the character moves.', instruction: 'Run the code. The character should move across the screen continuously. If it does not, check that gameLoop() is called and update() changes playerX/playerY.', concept: 'The game loop ties update and draw together.', verifyType: 'code', expectedConsole: null },
    ],
    hints: [
      'requestAnimationFrame runs at 60 FPS',
      'clearRect() clears the canvas for the next frame',
      'Change position values to create movement',
    ],
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
      css: 'body { margin: 0; padding: 20px; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; background: #2c3e50; }\ncanvas { border: 3px solid #34495e; background: #ecf0f1; }',
      javascript: 'console.log("Ready! Use arrow keys to move.");\nconst canvas = document.getElementById("gameCanvas");\nconst ctx = canvas.getContext("2d");\nlet playerX = 375;\nlet playerY = 275;\nconst speed = 5;\nconst keys = {};\n// Add keydown listener: keys[e.key] = true\n// Add keyup listener: keys[e.key] = false\n// In update(), move playerX/playerY based on keys["ArrowUp"] etc.\n// Keep player in bounds with Math.max/Math.min\n// Keep your draw() and gameLoop() from the previous step\n',
    },
    objectives: [
      'Set up keyboard event listeners',
      'Track which keys are pressed',
      'Move player based on input',
      'Keep player within canvas bounds',
    ],
    steps: [
      { title: 'Add keydown and keyup listeners.', instruction: 'Add window.addEventListener("keydown", (e) => { keys[e.key] = true; }) and window.addEventListener("keyup", (e) => { keys[e.key] = false; }). The keys object is already declared.', concept: 'Tracking key state lets you move while a key is held.', verifyType: 'code', expectedConsole: null },
      { title: 'Move player in update() based on keys.', instruction: 'In update(), check keys["ArrowUp"], keys["ArrowDown"], keys["ArrowLeft"], keys["ArrowRight"] and add or subtract speed from playerY or playerX accordingly.', concept: 'Checking key state each frame produces responsive movement.', verifyType: 'code', expectedConsole: null },
      { title: 'Keep player within canvas bounds.', instruction: 'In update(), after changing playerX and playerY, clamp them with Math.max(0, Math.min(canvas.width - playerSize, playerX)) and similar for playerY so the player cannot leave the canvas.', concept: 'Clamping keeps values within a range.', verifyType: 'code', expectedConsole: null },
      { title: 'Run and test movement.', instruction: 'Run the game and press the arrow keys. The character should move in all directions and stop at the canvas edges.', concept: 'Event listeners and update() together create interactive controls.', verifyType: 'code', expectedConsole: null },
    ],
    hints: [
      'Use an object to track multiple keys at once',
      'keydown fires when a key is pressed',
      'keyup fires when a key is released',
      'Math.max and Math.min help with boundary checking',
    ],
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
      css: 'body { margin: 0; padding: 20px; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; background: #16213e; }\ncanvas { border: 3px solid #0f3460; background: #1a1a2e; }',
      javascript: 'console.log("Ready! Collect the coin and check collision.");\nconst canvas = document.getElementById("gameCanvas");\nconst ctx = canvas.getContext("2d");\nconst player = { x: 375, y: 275, width: 50, height: 50 };\nconst coin = { x: 100, y: 100, width: 30, height: 30 };\nlet score = 0;\n// Implement checkCollision(rect1, rect2) for overlapping rectangles\n// In update(), if checkCollision(player, coin): add score, move coin to random position, update #score\n// Draw player and coin in draw()\n',
    },
    objectives: [
      'Implement rectangle collision detection',
      'Detect when player touches collectible',
      'Update score on collision',
      'Respawn collectibles at random positions',
    ],
    steps: [
      { title: 'Implement checkCollision(rect1, rect2).', instruction: 'Write checkCollision(rect1, rect2) that returns true when two rectangles overlap. Use: rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x && same for y/height.', concept: 'Rectangles overlap when they overlap on both X and Y axes.', verifyType: 'code', expectedConsole: null },
      { title: 'Check collision in update() and update score.', instruction: 'In update(), if checkCollision(player, coin) is true, increment score, move the coin to a random position (e.g. Math.random() * (canvas.width - coin.width)), and update the #score element.', concept: 'Collision detection drives game logic like scoring.', verifyType: 'code', expectedConsole: null },
      { title: 'Draw the player and coin in draw().', instruction: 'In draw(), after clearing the canvas, draw the player and coin rectangles (e.g. fillRect) at their current positions. Use different colors.', concept: 'Drawing both objects makes the game visible.', verifyType: 'code', expectedConsole: null },
      { title: 'Run and collect the coin.', instruction: 'Run the game, move the player to touch the coin, and confirm the score increases and the coin respawns elsewhere.', concept: 'End-to-end testing confirms collision and respawn work.', verifyType: 'code', expectedConsole: null },
    ],
    hints: [
      'Collision occurs when rectangles overlap on both X and Y axes',
      'Math.random() creates random positions',
      'Update DOM elements to show score changes',
    ],
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
      css: 'body { margin: 0; padding: 20px; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; background: #1a1a1a; }\ncanvas { border: 3px solid #333; background: #2a2a2a; }',
      javascript: 'console.log("Ready! Animate with sprite frames.");\nconst canvas = document.getElementById("gameCanvas");\nconst ctx = canvas.getContext("2d");\nconst player = { x: 375, y: 275, width: 50, height: 50, frame: 0, frameCount: 4, frameDelay: 0, speed: 3 };\nconst keys = {};\n// Add key listeners; in update() advance frame only when moving (use modulo for frame)\n// In draw() use player.frame to pick color or draw different poses\n',
    },
    objectives: [
      'Implement frame-based animation',
      'Control animation speed with delays',
      'Switch between idle and moving states',
      'Create smooth sprite transitions',
    ],
    steps: [
      { title: 'Advance frame only when moving.', instruction: 'In update(), only change player.frame when the character is moving (e.g. when any arrow key is pressed). Use player.frame = (player.frame + 1) % player.frameCount to cycle frames.', concept: 'Frame index cycles with modulo; advancing only when moving saves CPU.', verifyType: 'code', expectedConsole: null },
      { title: 'Add frame delay to control speed.', instruction: 'Use player.frameDelay (or similar) to only advance frame every N updates (e.g. if (++frameDelay >= 4) { frameDelay = 0; player.frame = ... }).', concept: 'Delaying frame advances slows the animation to a readable speed.', verifyType: 'code', expectedConsole: null },
      { title: 'Draw different poses by frame.', instruction: 'In draw(), use player.frame to choose what to draw (e.g. different colors or shapes for each frame, or offset in a sprite sheet). Draw the player at player.x, player.y.', concept: 'Different frames show different poses; cycling creates animation.', verifyType: 'code', expectedConsole: null },
      { title: 'Run and verify animation.', instruction: 'Run the game, move with arrow keys, and confirm the character animates (visual change) while moving and can stay idle when not moving.', concept: 'State (moving vs idle) and frame index together create sprite animation.', verifyType: 'code', expectedConsole: null },
    ],
    hints: [
      'Use modulo (%) to cycle through frames',
      'Add a delay counter to control animation speed',
      'Only animate when the character is moving',
    ],
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
      css: 'body { font-family: Arial, sans-serif; padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; }\nbutton { margin: 10px; padding: 20px 40px; font-size: 20px; cursor: pointer; background: rgba(255,255,255,0.2); color: white; border: 2px solid white; border-radius: 12px; }\nbutton:hover { background: rgba(255,255,255,0.3); }',
      javascript: 'console.log("Ready! Wire buttons to sound effects.");\nconst audioContext = new (window.AudioContext || window.webkitAudioContext)();\n// Create playSound(frequency, duration, type): oscillator + gainNode, connect, start/stop\n// Add jumpSound, collectSound, hurtSound, winSound and wire buttons with addEventListener\n',
    },
    objectives: [
      'Use Web Audio API',
      'Create oscillators for sound effects',
      'Control volume with gain nodes',
      'Create sound sequences',
    ],
    steps: [
      { title: 'Create playSound(frequency, duration, type).', instruction: 'Implement playSound(frequency, duration, type) using the AudioContext: create an oscillator, set frequency and type, connect to a gain node, connect gain to destination, start and stop the oscillator after duration ms.', concept: 'Oscillators generate waveforms; gain nodes control volume.', verifyType: 'code', expectedConsole: null },
      { title: 'Wire Jump button to a sound.', instruction: 'Get the jumpBtn element and add a click listener that calls playSound with a frequency (e.g. 440) and short duration for a jump sound.', concept: 'Event listeners trigger sound effects on user action.', verifyType: 'code', expectedConsole: null },
      { title: 'Wire Collect, Hurt, and Win buttons.', instruction: 'Add click listeners to collectBtn, hurtBtn, and winBtn. Call playSound with different frequencies and durations (e.g. collect: higher pitch, hurt: lower, win: sequence or longer).', concept: 'Different parameters create distinct sound effects.', verifyType: 'code', expectedConsole: null },
      { title: 'Test each button.', instruction: 'Run the page and click each button. Confirm you hear distinct sounds for jump, collect, hurt, and win.', concept: 'Web Audio API runs in the browser without external files.', verifyType: 'code', expectedConsole: null },
    ],
    hints: [
      'AudioContext is the main audio interface',
      'Oscillators generate tones',
      'Different frequencies create different pitches',
      'Chain sounds with setTimeout for melodies',
    ],
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
      css: 'body { font-family: Arial, sans-serif; padding: 40px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; text-align: center; }\n#gameArea { background: rgba(0,0,0,0.2); padding: 30px; border-radius: 16px; margin: 20px auto; max-width: 400px; }\n#gameArea p { font-size: 24px; margin: 15px 0; }\nbutton { margin: 10px; padding: 12px 24px; font-size: 16px; cursor: pointer; background: rgba(255,255,255,0.3); color: white; border: 2px solid white; border-radius: 8px; }\n#leaderboard { background: rgba(0,0,0,0.2); padding: 20px; border-radius: 16px; margin: 20px auto; max-width: 400px; }\n#topScores { text-align: left; font-size: 18px; }',
      javascript: 'console.log("Ready! Build high score and leaderboard with localStorage.");\nlet currentScore = 0;\n// loadHighScore: localStorage.getItem("highScore") then parseInt\n// saveHighScore(score): localStorage.setItem("highScore", score)\n// addPoints(): add random points, update #score, if new high save and update #highScore\n// resetGame(): push currentScore to leaderboard (JSON.parse/stringify), clear current, displayLeaderboard()\n// On load: set #highScore from loadHighScore(), call displayLeaderboard()\n',
    },
    objectives: [
      'Use localStorage to save data',
      'Load saved data on page load',
      'Store complex data with JSON',
      'Create a leaderboard system',
    ],
    steps: [
      { title: 'Implement loadHighScore() and saveHighScore(score).', instruction: 'Write loadHighScore() that returns parseInt(localStorage.getItem("highScore") || 0). Write saveHighScore(score) that calls localStorage.setItem("highScore", score).', concept: 'localStorage persists key-value strings across sessions.', verifyType: 'code', expectedConsole: null },
      { title: 'Load high score and display on page load.', instruction: 'On load, call loadHighScore(), set #highScore textContent to it, and call displayLeaderboard() if you have one.', concept: 'Loading on startup restores the player\'s progress.', verifyType: 'code', expectedConsole: null },
      { title: 'Update score and high score in addPoints().', instruction: 'In addPoints(), add random points to currentScore, update #score. If currentScore > highScore, call saveHighScore(currentScore) and update #highScore.', concept: 'Comparing and saving ensures the high score persists.', verifyType: 'code', expectedConsole: null },
      { title: 'Implement resetGame() and leaderboard.', instruction: 'In resetGame(), push currentScore to a leaderboard array (load with JSON.parse(localStorage.getItem("leaderboard")||"[]"), push, save with JSON.stringify). Clear current score and call displayLeaderboard() to show the list.', concept: 'JSON lets you store and load arrays/objects in localStorage.', verifyType: 'code', expectedConsole: null },
    ],
    hints: [
      'localStorage only stores strings',
      'Use JSON.stringify() to save objects',
      'Use JSON.parse() to load objects',
      'Always check if data exists before loading',
    ],
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
      css: 'body { margin: 0; padding: 20px; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; background: #0a0a0a; }\ncanvas { border: 2px solid #333; background: #1a1a1a; cursor: crosshair; }',
      javascript: 'console.log("Ready! Click the canvas to spawn particles.");\nconst canvas = document.getElementById("gameCanvas");\nconst ctx = canvas.getContext("2d");\nconst particles = [];\n// Add class Particle with x, y, vx, vy, life; update() moves and decreases life; draw() with globalAlpha; isDead()\n// On canvas click, push many new Particle(x, y) into particles\n// In gameLoop: update each, remove dead ones, draw all\n',
    },
    objectives: [
      'Create particle class with physics',
      'Manage particle lifecycle',
      'Apply gravity and fade effects',
      'Optimize by removing dead particles',
    ],
    steps: [
      { title: 'Add Particle class with update and draw.', instruction: 'Create a Particle class with x, y, vx, vy, life. In update(), add vx to x, vy to y, and decrease life. In draw(ctx), set globalAlpha to life and draw a small shape (e.g. circle). Add isDead() that returns life <= 0.', concept: 'Particles have position, velocity, and lifetime.', verifyType: 'code', expectedConsole: null },
      { title: 'Spawn particles on canvas click.', instruction: 'Add a click listener on the canvas. On click, get the click position (relative to canvas) and push several new Particle(x, y) into the particles array (use random vx, vy and life = 1).', concept: 'Spawning many particles at once creates an explosion effect.', verifyType: 'code', expectedConsole: null },
      { title: 'Update and remove dead particles in the loop.', instruction: 'In your game loop, loop over particles: call update() on each, remove particles where isDead() is true, then call draw() on each remaining particle.', concept: 'Removing dead particles keeps the array small and avoids leaks.', verifyType: 'code', expectedConsole: null },
      { title: 'Run and click to see the effect.', instruction: 'Run the game and click on the canvas. You should see a burst of particles that move and fade out.', concept: 'Particle systems combine spawning, physics, and rendering.', verifyType: 'code', expectedConsole: null },
    ],
    hints: [
      'Each particle needs position and velocity',
      'Use life value for fading',
      'Remove particles when life reaches 0',
      'Random values create natural-looking effects',
    ],
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
      css: 'body { margin: 0; padding: 20px; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; background: #1a0033; }\ncanvas { border: 3px solid #330066; background: #0d001a; }',
      javascript: 'console.log("Ready! Enemies chase when you are in range.");\nconst canvas = document.getElementById("gameCanvas");\nconst ctx = canvas.getContext("2d");\nconst player = { x: 400, y: 300, size: 25, speed: 4 };\n// Add Enemy class: x, y, size, speed, detectionRange; update() uses distance = sqrt(dx*dx+dy*dy)\n// If distance < detectionRange move towards player (normalize: dx/distance * speed); else patrol\n// Add key listeners, update/draw/gameLoop; draw enemies and player\n',
    },
    objectives: [
      'Calculate distance between objects',
      'Implement chase behavior',
      'Create patrol patterns',
      'Switch between AI states',
    ],
    steps: [
      { title: 'Add Enemy class with position and detectionRange.', instruction: 'Create an Enemy class (or factory) with x, y, size, speed, and detectionRange. In update(), compute distance to player: dx = player.x - enemy.x, dy = player.y - enemy.y, distance = Math.sqrt(dx*dx + dy*dy).', concept: 'Distance formula finds how far the player is from the enemy.', verifyType: 'code', expectedConsole: null },
      { title: 'Move towards player when in range.', instruction: 'If distance < detectionRange and distance > 0, normalize: enemy.x += (dx/distance)*enemy.speed, enemy.y += (dy/distance)*enemy.speed. Otherwise (e.g. patrol) move in a simple pattern.', concept: 'Normalizing (dx, dy) by distance gives consistent chase speed.', verifyType: 'code', expectedConsole: null },
      { title: 'Add key listeners and draw player and enemies.', instruction: 'Add keydown/keyup for movement, update player position in update(). In draw(), draw the player and all enemies. Keep your game loop (update, draw, requestAnimationFrame).', concept: 'Integrating input, AI, and rendering completes the demo.', verifyType: 'code', expectedConsole: null },
      { title: 'Run and verify chase behavior.', instruction: 'Run the game. Move the player near an enemy; the enemy should chase. Move away and it should stop or patrol. Confirm boundaries so nothing goes off-screen if desired.', concept: 'Detection range and movement logic create simple AI.', verifyType: 'code', expectedConsole: null },
    ],
    hints: [
      'Use distance formula: sqrt(dx^2 + dy^2)',
      'Normalize direction vectors for consistent speed',
      'State machines help organize AI behavior',
      'Detection ranges make AI feel more realistic',
    ],
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
      css: 'body { margin: 0; padding: 0; overflow: hidden; background: #111; touch-action: none; }\ncanvas { display: block; margin: 0 auto; background: #222; max-width: 100%; height: auto; }',
      javascript: 'console.log("Ready! Use touch or mouse as joystick.");\nconst canvas = document.getElementById("gameCanvas");\nconst ctx = canvas.getContext("2d");\nconst player = { x: 400, y: 300, size: 25, vx: 0, vy: 0 };\nconst joystick = { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 };\n// touchstart: e.preventDefault(), get e.touches[0], set joystick active and start/current\n// touchmove: update currentX/Y; touchend: active=false, vx=vy=0\n// mousedown/mousemove/mouseup for desktop\n// In update(): dx = currentX - startX, dy = currentY - startY; normalize and set player.vx/vy; move player, clamp bounds\n',
    },
    objectives: [
      'Handle touch events',
      'Create virtual joystick',
      'Calculate touch direction and magnitude',
      'Support both mobile and desktop',
    ],
    steps: [
      { title: 'Handle touchstart and set joystick active.', instruction: 'Add canvas.addEventListener("touchstart", (e) => { e.preventDefault(); const t = e.touches[0]; joystick.active = true; joystick.startX = t.clientX; joystick.startY = t.clientY; joystick.currentX = t.clientX; joystick.currentY = t.clientY; }).', concept: 'Touch events provide clientX/clientY for the touch point.', verifyType: 'code', expectedConsole: null },
      { title: 'Handle touchmove and touchend.', instruction: 'In touchmove, update joystick.currentX and currentY from e.touches[0]. In touchend, set joystick.active = false and player.vx = 0, player.vy = 0.', concept: 'Tracking current position gives direction; touchend resets movement.', verifyType: 'code', expectedConsole: null },
      { title: 'Compute velocity from joystick in update().', instruction: 'In update(), if joystick.active, set dx = currentX - startX, dy = currentY - startY, distance = Math.sqrt(dx*dx+dy*dy). If distance > 0, normalize and set player.vx, player.vy (scale by speed). Move player and clamp to canvas.', concept: 'Direction from start to current gives movement; normalizing sets speed.', verifyType: 'code', expectedConsole: null },
      { title: 'Add mouse events for desktop.', instruction: 'Add mousedown, mousemove, mouseup on the canvas that set joystick active and current position from e.clientX/clientY (and reset on mouseup). This lets you test on desktop.', concept: 'Mouse events mirror touch for a single pointer.', verifyType: 'code', expectedConsole: null },
    ],
    hints: [
      'Prevent default to avoid scrolling',
      'Use e.touches[0] for first touch point',
      'Calculate distance for joystick strength',
      'Add mouse events for desktop testing',
    ],
  },
  // ========== MULTIPLAYER MODULES ==========
  {
    title: 'Multiplayer Basics - Introduction to Socket.IO',
    description:
      'Learn the fundamentals of real-time communication with Socket.IO for multiplayer games.',
    difficulty: 'intermediate',
    category: 'multiplayer',
    order: 1,
    content: `# Introduction to Socket.IO

## Why Socket.IO for Multiplayer?
Socket.IO enables real-time, bidirectional communication between clients and servers - perfect for multiplayer games!

## Basic Concepts
- **WebSockets**: Persistent connection for instant messaging
- **Events**: Send/receive named messages
- **Rooms**: Group players together
- **Broadcasting**: Send to multiple clients at once

## Example Client Code
\`\`\`javascript
const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('Connected to server!');
});

socket.emit('playerJoin', { name: 'Player1' });

socket.on('gameState', (state) => {
  updateGame(state);
});
\`\`\`

## Your Task
Set up a basic Socket.IO connection that logs when players connect and disconnect.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Socket.IO Basics</title>\n  <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>\n</head>\n<body>\n  <div id="status">Connecting...</div>\n  <div id="logs"></div>\n</body>\n</html>',
      css: `body {
  font-family: Arial, sans-serif;
  padding: 24px;
  background: #1a1a2e;
  color: #eee;
}
#status {
  font-size: 24px;
  padding: 16px;
  background: #16213e;
  border-radius: 8px;
  margin-bottom: 16px;
}
#status.connected {
  color: #4ade80;
}
#logs {
  background: #0f0f23;
  padding: 16px;
  border-radius: 8px;
  font-family: monospace;
  min-height: 200px;
}`,
      javascript: 'console.log("Ready! Set up Socket.IO connect and disconnect.");\nfunction log(msg) {\n  const el = document.getElementById("logs");\n  if (el) {\n    const d = document.createElement("div");\n    d.textContent = "[" + new Date().toLocaleTimeString() + "] " + msg;\n    el.appendChild(d);\n  }\n}\n// Simulate or use io(): socket.on("connect", ...) to set #status and log; socket.on("disconnect", ...) to log\n// socket.emit("playerJoin", { name: "Player1" })\nlog("Attempting to connect...");',
    },
    objectives: [
      'Understand WebSocket basics',
      'Connect to a Socket.IO server',
      'Send and receive events',
      'Handle connection states',
    ],
    steps: [
      { title: 'Connect to the Socket.IO server.', instruction: 'Use io() (or the provided server URL) to create a socket connection. Store the socket in a variable (e.g. const socket = io("http://localhost:3001")).', concept: 'Socket.IO establishes a real-time bidirectional connection.', verifyType: 'code', expectedConsole: null },
      { title: 'Handle the connect event.', instruction: 'Call socket.on("connect", () => { ... }). In the handler, set #status textContent to "Connected" (or similar), add a class if needed, and call log("Connected to server!").', concept: 'The connect event fires when the connection is established.', verifyType: 'code', expectedConsole: null },
      { title: 'Handle the disconnect event.', instruction: 'Call socket.on("disconnect", () => { ... }). In the handler, log("Disconnected") and update #status to show disconnected state.', concept: 'Handling disconnect keeps the UI accurate when the connection drops.', verifyType: 'code', expectedConsole: null },
      { title: 'Emit playerJoin and verify in console.', instruction: 'After connecting, emit a playerJoin event: socket.emit("playerJoin", { name: "Player1" }). Run the app and check the console/logs for connect and disconnect messages.', concept: 'emit sends events to the server; the server can respond with other events.', verifyType: 'code', expectedConsole: null },
    ],
    hints: [
      'Socket.IO uses events like emit() and on()',
      'Always handle disconnect events gracefully',
      'Use meaningful event names like "playerJoin"',
      'Log events for debugging',
    ],
  },
  {
    title: 'Multiplayer - Game State Synchronization',
    description: 'Learn how to synchronize game state between multiple players.',
    difficulty: 'intermediate',
    category: 'multiplayer',
    order: 2,
    content: `# Game State Synchronization

## The Challenge
In multiplayer games, all players need to see the same game state. But network latency exists!

## Strategies
1. **Authoritative Server**: Server is the source of truth
2. **Client Prediction**: Predict locally, correct from server
3. **State Interpolation**: Smooth between state updates

## Example
\`\`\`javascript
// Server sends state updates
socket.on('gameState', (state) => {
  gameState.players = state.players;
  gameState.ball = state.ball;
  gameState.scores = state.scores;
});

// Client sends inputs
socket.emit('playerInput', {
  playerId: myId,
  input: { up: true, down: false }
});
\`\`\`

## Your Task
Create a game that syncs player positions between clients using state updates.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>State Sync</title>\n</head>\n<body>\n  <canvas id="gameCanvas" width="600" height="400"></canvas>\n  <div id="info">Players: <span id="playerCount">0</span></div>\n</body>\n</html>',
      css: 'body { margin: 0; padding: 20px; background: #1a1a2e; color: #eee; font-family: Arial, sans-serif; }\ncanvas { border: 2px solid #667eea; border-radius: 8px; display: block; margin-bottom: 16px; }\n#info { font-size: 16px; color: #a0aec0; }',
      javascript: 'console.log("Ready! Sync game state between players.");\nconst canvas = document.getElementById("gameCanvas");\nconst ctx = canvas.getContext("2d");\nlet gameState = { players: {} };\nlet myId = "player1";\n// Add key listeners; receiveServerState() updates gameState from socket.on("gameState")\n// sendInput() emits playerInput or applies locally; draw() renders all players from gameState\n',
    },
    objectives: [
      'Understand authoritative server model',
      'Sync player positions',
      'Handle input and state separately',
      'Update UI from game state',
    ],
    steps: [
      { title: 'Listen for gameState from the server.', instruction: 'Add socket.on("gameState", (state) => { ... }). In the handler, set gameState.players = state.players (or merge state into gameState). This is your receiveServerState logic.', concept: 'The server is the source of truth; clients apply state updates.', verifyType: 'code', expectedConsole: null },
      { title: 'Send player input, not position.', instruction: 'In your input handler (e.g. keydown), instead of updating local position directly, call sendInput() which emits "playerInput" with { playerId: myId, input: { up: true, down: false } } or similar.', concept: 'Sending inputs lets the server validate and compute new state.', verifyType: 'code', expectedConsole: null },
      { title: 'Update UI from gameState in draw().', instruction: 'In draw(), clear the canvas and loop over gameState.players. For each player, draw them at their x, y from state. Include the local player so everyone sees the same positions.', concept: 'Rendering from shared state keeps all clients in sync visually.', verifyType: 'code', expectedConsole: null },
      { title: 'Run and verify sync.', instruction: 'If you have a server, run two clients and move in one; the other should see the updated position. Otherwise confirm gameState updates when you receive gameState and draw() uses it.', concept: 'State sync depends on receiving updates and rendering from them.', verifyType: 'code', expectedConsole: null },
    ],
    hints: [
      'Server should validate all movements',
      'Send inputs, not positions',
      'Interpolate between state updates for smoothness',
      'Keep game state serializable (no functions)',
    ],
  },
  {
    title: 'Multiplayer - Turn-Based Game Logic',
    description: 'Implement turn-based gameplay mechanics for multiplayer games.',
    difficulty: 'intermediate',
    category: 'multiplayer',
    order: 3,
    content: `# Turn-Based Multiplayer

## Turn Management
In turn-based games, players take actions one at a time. The server manages whose turn it is.

## Key Concepts
- **Current Turn**: Track which player can act
- **Turn Timer**: Optional countdown for action
- **Turn Validation**: Server validates moves
- **Turn Events**: Notify all players of changes

## Example
\`\`\`javascript
// Server determines turn
let currentTurn = 'player1';

socket.on('makeMove', (move, playerId) => {
  if (playerId !== currentTurn) {
    socket.emit('error', 'Not your turn!');
    return;
  }
  
  if (isValidMove(move)) {
    applyMove(move);
    currentTurn = getNextPlayer();
    io.emit('gameState', gameState);
    io.emit('turnChange', currentTurn);
  }
});
\`\`\`

## Your Task
Build a simple turn-based game where players alternate making moves.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Turn-Based Game</title>\n</head>\n<body>\n  <div id="game">\n    <div id="turn-indicator">Player 1\'s Turn</div>\n    <div id="board"></div>\n    <div id="scores">\n      <div>Player 1: <span id="p1score">0</span></div>\n      <div>Player 2: <span id="p2score">0</span></div>\n    </div>\n  </div>\n</body>\n</html>',
      css: 'body { font-family: Arial, sans-serif; background: #1a1a2e; color: #eee; padding: 20px; display: flex; justify-content: center; }\n#game { text-align: center; }\n#turn-indicator { font-size: 24px; padding: 16px; margin-bottom: 16px; border-radius: 8px; }\n#turn-indicator.player1 { background: linear-gradient(135deg, #4ade80, #22c55e); color: #000; }\n#turn-indicator.player2 { background: linear-gradient(135deg, #f472b6, #ec4899); color: #000; }\n#board { display: grid; grid-template-columns: repeat(3, 80px); gap: 8px; justify-content: center; margin-bottom: 20px; }\n.cell { width: 80px; height: 80px; background: #16213e; border: 2px solid #667eea; border-radius: 8px; font-size: 36px; cursor: pointer; }\n.cell:hover:not(.taken) { background: #1e3a5f; }\n.cell.taken { cursor: not-allowed; }\n#scores { display: flex; justify-content: center; gap: 40px; font-size: 18px; }',
      javascript: 'console.log("Ready! Take turns and check for a winner.");\nconst board = document.getElementById("board");\nconst turnIndicator = document.getElementById("turn-indicator");\nlet gameState = { board: Array(9).fill(null), currentTurn: "player1", scores: { player1: 0, player2: 0 }, gameOver: false };\n// Create 9 cell buttons; makeMove(index) validates currentTurn, updates board, checks winner/draw, switches turn\n// checkWinner() uses win lines [0,1,2], [3,4,5], etc.; updateTurnIndicator() and updateScores()\n',
    },
    objectives: [
      'Implement turn management',
      'Validate player moves',
      'Detect win conditions',
      'Handle game state transitions',
    ],
    steps: [
      { title: 'Create the board and makeMove(index).', instruction: 'Build 9 cell buttons (or divs) for the board. Implement makeMove(index) so it checks if gameState.board[index] is null and gameState.currentTurn matches the current player; if so, set board[index] to current player.', concept: 'Turn-based games only allow moves when it is that player\'s turn.', verifyType: 'code', expectedConsole: null },
      { title: 'Switch turn and check winner.', instruction: 'After a valid move, call checkWinner() (using win lines [0,1,2], [3,4,5], [6,7,8], etc.). If no winner, set currentTurn to the other player. Update the turn indicator and scores.', concept: 'Win detection and turn switching are core turn-based logic.', verifyType: 'code', expectedConsole: null },
      { title: 'Update UI from gameState.', instruction: 'Implement updateTurnIndicator() and updateScores() to read from gameState.currentTurn and gameState.scores. Call them after each move and on load.', concept: 'UI should always reflect the current game state.', verifyType: 'code', expectedConsole: null },
      { title: 'Handle game over and reset.', instruction: 'When checkWinner() returns a winner or the board is full (draw), set gameState.gameOver and show a message. Provide a way to reset the board and currentTurn for a new game.', concept: 'Game end and reset complete the turn-based flow.', verifyType: 'code', expectedConsole: null },
    ],
    hints: [
      'Server should track whose turn it is',
      'Reject moves from wrong player',
      'Broadcast turn changes to all players',
      'Add turn timers for competitive play',
    ],
  },
  {
    title: 'Multiplayer - Room and Lobby System',
    description: 'Create game rooms and lobbies for players to join matches.',
    difficulty: 'intermediate',
    category: 'multiplayer',
    order: 4,
    content: `# Room and Lobby System

## Why Rooms?
Rooms let players group together for matches instead of playing with everyone on the server.

## Features
- **Create Room**: Player makes a new game room
- **Join Room**: Enter with room code
- **Room List**: See available games
- **Ready System**: Wait for all players

## Example
\`\`\`javascript
// Create room
socket.emit('createRoom', { maxPlayers: 2 });

// Join room
socket.emit('joinRoom', { roomId: 'ABC123' });

// Toggle ready
socket.emit('toggleReady');

// Room events
socket.on('roomUpdate', (room) => {
  updateLobbyUI(room);
});
\`\`\`

## Your Task
Build a lobby system with room creation and ready-up functionality.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Game Lobby</title>\n</head>\n<body>\n  <div id="lobby">\n    <h1>Game Lobby</h1>\n    <div id="actions">\n      <button onclick="createRoom()">Create Room</button>\n      <input type="text" id="roomCode" placeholder="Room code...">\n      <button onclick="joinRoom()">Join Room</button>\n    </div>\n    <div id="room-view" style="display:none">\n      <h2>Room: <span id="room-id"></span></h2>\n      <div id="players"></div>\n      <button onclick="toggleReady()">Ready Up!</button>\n      <button onclick="leaveRoom()">Leave</button>\n      <div id="countdown"></div>\n    </div>\n    <div id="rooms-list">\n      <h3>Available Rooms</h3>\n      <div id="rooms"></div>\n    </div>\n  </div>\n</body>\n</html>',
      css: 'body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #eee; min-height: 100vh; padding: 20px; }\n#lobby { max-width: 600px; margin: 0 auto; }\n#actions { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }\nbutton { padding: 12px 24px; background: linear-gradient(135deg, #667eea, #764ba2); border: none; border-radius: 8px; color: white; font-size: 16px; cursor: pointer; }\ninput { padding: 12px; border: 2px solid #667eea; border-radius: 8px; background: #16213e; color: white; flex: 1; }\n#room-view { background: #16213e; padding: 20px; border-radius: 12px; margin-bottom: 20px; }\n.player-slot { display: flex; align-items: center; justify-content: space-between; padding: 12px; background: #1a1a2e; border-radius: 8px; margin-bottom: 8px; }\n.player-slot.ready { border: 2px solid #4ade80; }\n#rooms-list { background: #16213e; padding: 20px; border-radius: 12px; }\n.room-item { display: flex; justify-content: space-between; padding: 12px; background: #1a1a2e; border-radius: 8px; margin-bottom: 8px; }\n#countdown { font-size: 48px; text-align: center; color: #4ade80; margin-top: 20px; }',
      javascript: 'console.log("Ready! Create or join a room and ready up.");\nlet currentRoom = null;\nlet myId = "player_" + Math.random().toString(36).substr(2, 4);\nlet rooms = {};\n// createRoom(): generate roomId, rooms[roomId] = { id, host: myId, players: [{ id: myId, name: "You", ready: false }], maxPlayers: 2 }; showRoomView(); updateRoomsList()\n// joinRoom(): get roomCode, if rooms[code] and not full push player, set currentRoom, showRoomView\n// leaveRoom(), toggleReady(), checkAllReady(), startCountdown(), showRoomView(), updateRoomsList()\n',
    },
    objectives: [
      'Create and join game rooms',
      'Implement player ready system',
      'Display room status',
      'Handle room lifecycle',
    ],
    steps: [
      { title: 'Implement createRoom().', instruction: 'In createRoom(), generate a unique roomId (e.g. random string), create rooms[roomId] with id, host: myId, players: [{ id: myId, name: "You", ready: false }], maxPlayers: 2. Set currentRoom = roomId, showRoomView(), updateRoomsList().', concept: 'Rooms group players; the creator is the host.', verifyType: 'code', expectedConsole: null },
      { title: 'Implement joinRoom().', instruction: 'Get the room code from #roomCode. If rooms[code] exists and players.length < maxPlayers, push the current player into rooms[code].players, set currentRoom = code, showRoomView(). Otherwise show an error.', concept: 'Joining requires a valid room and space available.', verifyType: 'code', expectedConsole: null },
      { title: 'Implement toggleReady() and showRoomView().', instruction: 'In toggleReady(), find yourself in current room players and flip ready. In showRoomView(), display room id and list of players with their ready status; show/hide #room-view and #rooms-list as needed.', concept: 'Ready state and room view let players see who is in and ready.', verifyType: 'code', expectedConsole: null },
      { title: 'Implement leaveRoom() and checkAllReady().', instruction: 'leaveRoom() removes you from the room, clears currentRoom, hides room view. checkAllReady() returns true if every player in the room has ready === true; use it to start a countdown or game when all are ready.', concept: 'Room lifecycle includes join, ready, start, and leave.', verifyType: 'code', expectedConsole: null },
    ],
    hints: [
      'Generate unique room codes',
      'Limit players per room',
      'Start game when all ready',
      'Clean up empty rooms',
    ],
  },
  {
    title: 'Multiplayer - Win Detection and Game End',
    description: 'Implement win conditions and game end logic for multiplayer games.',
    difficulty: 'intermediate',
    category: 'multiplayer',
    order: 5,
    content: `# Win Detection and Game End

## Handling Game Completion
Every multiplayer game needs clear win/lose/draw conditions and proper game end handling.

## Key Concepts
- **Win Conditions**: Rules that determine victory
- **Score Tracking**: Persistent points across rounds
- **Game End Events**: Notify all players of results
- **Rematch System**: Option to play again

## Example
\`\`\`javascript
function checkGameEnd() {
  const winner = checkWinCondition();
  
  if (winner) {
    io.to(roomId).emit('gameEnd', {
      winner: winner,
      scores: gameState.scores,
      reason: 'victory'
    });
  }
}

socket.on('rematchRequest', () => {
  resetGame();
  io.to(roomId).emit('rematchAccepted');
});
\`\`\`

## Your Task
Create a game with proper win detection, result display, and rematch functionality.`,
    starterCode: {
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Win Detection</title>\n</head>\n<body>\n  <div id="game">\n    <div id="header">\n      <div class="score p1">P1: <span id="p1score">0</span></div>\n      <div id="round">Round <span id="roundNum">1</span></div>\n      <div class="score p2">P2: <span id="p2score">0</span></div>\n    </div>\n    <canvas id="canvas" width="600" height="400"></canvas>\n    <div id="controls">Press SPACE to start round</div>\n  </div>\n  <div id="modal" style="display:none">\n    <div id="modal-content">\n      <h2 id="modal-title">Game Over!</h2>\n      <p id="modal-message"></p>\n      <button onclick="rematch()">Rematch</button>\n      <button onclick="newGame()">New Game</button>\n    </div>\n  </div>\n</body>\n</html>',
      css: 'body { margin: 0; padding: 20px; background: #1a1a2e; color: #eee; font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center; }\n#header { display: flex; justify-content: space-between; width: 600px; margin-bottom: 10px; }\n.score { font-size: 24px; font-weight: bold; }\n.score.p1 { color: #4ade80; }\n.score.p2 { color: #f472b6; }\n#round { font-size: 18px; color: #a0aec0; }\ncanvas { border: 2px solid #667eea; border-radius: 8px; margin-bottom: 10px; }\n#controls { color: #a0aec0; }\n#modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; }\n#modal-content { background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 40px; border-radius: 16px; text-align: center; border: 2px solid #667eea; }\n#modal-content h2 { font-size: 36px; margin-bottom: 10px; }\n#modal-content button { padding: 12px 24px; margin: 10px; background: linear-gradient(135deg, #667eea, #764ba2); border: none; border-radius: 8px; color: white; font-size: 16px; cursor: pointer; }\n.winner-p1 h2 { color: #4ade80; }\n.winner-p2 h2 { color: #f472b6; }',
      javascript: 'console.log("Ready! Win detection, modal, and rematch.");\nconst canvas = document.getElementById("canvas");\nconst ctx = canvas.getContext("2d");\nconst WIN_SCORE = 3;\nlet gameState = { ball: { x: 300, y: 200, vx: 0, vy: 0, radius: 10 }, paddles: { p1: { y: 180, height: 60, score: 0 }, p2: { y: 180, height: 60, score: 0 } }, round: 1, running: false, winner: null };\nlet keys = { w: false, s: false, up: false, down: false };\n// Key listeners; startRound() on Space; checkWin() after each score; scorePoint(player) updates scores and calls showGameEnd if checkWin()\n// showGameEnd(result): set modal title/message, display modal; rematch(): reset scores and round, hide modal\n',
    },
    objectives: [
      'Implement win conditions',
      'Track and display scores',
      'Show game end modal',
      'Implement rematch functionality',
    ],
    steps: [
      { title: 'Check win condition after each score.', instruction: 'After updating a player\'s score (e.g. in scorePoint(player)), call checkWin(). If a player has reached WIN_SCORE (e.g. 3), set gameState.winner and call showGameEnd(result).', concept: 'Win detection runs after every score change.', verifyType: 'code', expectedConsole: null },
      { title: 'Implement showGameEnd(result).', instruction: 'In showGameEnd(result), set #modal-title and #modal-message from result (e.g. "Player 1 wins!" or "Game Over"). Show #modal (e.g. style.display = "flex"). Optionally add a CSS class for winner styling.', concept: 'A modal clearly communicates the game result.', verifyType: 'code', expectedConsole: null },
      { title: 'Implement rematch().', instruction: 'In rematch(), reset gameState (scores, round, winner, ball position, etc.) to initial values, hide the modal, and optionally emit a rematch event so all clients reset. Update the header and canvas.', concept: 'Rematch resets state so the same players can play again.', verifyType: 'code', expectedConsole: null },
      { title: 'Implement newGame() and wire buttons.', instruction: 'newGame() can fully reset or leave the room. Ensure the Rematch and New Game buttons call rematch() and newGame(), and that the modal is hidden when starting a new round.', concept: 'Clear buttons for rematch and new game improve UX.', verifyType: 'code', expectedConsole: null },
    ],
    hints: [
      'Check win conditions after each score',
      'Use modals for end-of-game UI',
      'Broadcast results to all players',
      'Reset state cleanly for rematches',
    ],
  },
];

mongoose
  .connect(process.env.MONGODB_URI)
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
