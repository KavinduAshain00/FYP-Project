const mongoose = require('mongoose');
const Module = require('./models/Module');
require('dotenv').config();

// 24 learning modules across 4 categories.
// steps, hints, and starterCode are NOT seeded — the AI generates them on first load.
const sampleModules = [
  {
    "title": "JS Basics 1 – Code Comments",
    "description": "Learn to annotate your code with single-line and multi-line comments so it stays readable and maintainable.",
    "difficulty": "beginner",
    "category": "javascript-basics",
    "moduleType": "vanilla",
    "order": 1,
    "estimatedMinutes": 10,
    "tags": [
      "comments",
      "syntax",
      "readability"
    ],
    "content": "# Code Comments\n\n## What are comments?\nComments are notes inside your code that JavaScript completely ignores at runtime.\nThey exist purely for humans — to explain *why* something is done, not just *what* it does.\n\n## Single-line comments\nStart the line (or trail after code) with `//`:\n\n    // This whole line is a comment\n    let score = 0; // score starts at zero\n\n## Multi-line comments\nWrap a block with `/* ... */`:\n\n    /*\n      This block is ignored.\n      Useful for disabling several lines at once\n      or writing longer explanations.\n    */\n    console.log('only this runs');\n\n## When to comment\n- **Do** comment the *why* behind non-obvious logic.\n- **Don't** comment every line — clean variable names often say enough.\n- Use multi-line comments to temporarily disable code while debugging.\n\n## Your Task\nOpen the JavaScript panel. Add a single-line comment describing what the starter code does,\nthen disable a group of console.log calls using a multi-line comment, and confirm only the\nun-commented line prints.",
    "objectives": [
      "Write a single-line comment using //",
      "Write a multi-line comment using /* ... */",
      "Use a comment to temporarily disable multiple lines of code",
      "Explain in a comment why a piece of code exists"
    ]
  },
  {
    "title": "JS Basics 2 – Variables & Data Types",
    "description": "Declare variables with let and const and learn the five core data types: string, number, boolean, null, and undefined.",
    "difficulty": "beginner",
    "category": "javascript-basics",
    "moduleType": "vanilla",
    "order": 2,
    "estimatedMinutes": 15,
    "tags": [
      "variables",
      "let",
      "const",
      "data-types",
      "typeof"
    ],
    "content": "# Variables & Data Types\n\n## Declaring variables\nUse `const` for values that never change, `let` for values that do. Avoid `var`.\n\n    const MAX_HEALTH = 100;   // never reassign\n    let playerName = 'Nova';  // will change later\n    let score = 0;\n    let isAlive = true;\n    let lastEnemy = null;     // intentionally empty\n    let powerUp;              // undefined until assigned\n\n## The five primitive types\n\n| Type      | Example              | typeof result |\n|-----------|----------------------|---------------|\n| String    | 'hello'              | \"string\"      |\n| Number    | 42, 3.14             | \"number\"      |\n| Boolean   | true / false         | \"boolean\"     |\n| Null      | null                 | \"object\" (quirk!) |\n| Undefined | undefined            | \"undefined\"   |\n\n## Inspecting types\n`typeof` returns what kind of value a variable holds:\n\n    console.log(typeof score);       // \"number\"\n    console.log(typeof playerName);  // \"string\"\n    console.log(typeof isAlive);     // \"boolean\"\n\n## Your Task\nDeclare variables for a player profile: name, score, health, isAlive, current power-up\n(none yet), and rank (not set yet). Log each value and its type with typeof.",
    "objectives": [
      "Declare variables using const and let",
      "Store a string, number, boolean, null, and undefined value",
      "Use typeof to inspect each variable",
      "Understand when to use const versus let"
    ]
  },
  {
    "title": "JS Basics 3 – Strings & Template Literals",
    "description": "Build and format text with string methods and template literals — essential for displaying game feedback and UI messages.",
    "difficulty": "beginner",
    "category": "javascript-basics",
    "moduleType": "vanilla",
    "order": 3,
    "estimatedMinutes": 15,
    "tags": [
      "strings",
      "template-literals",
      "string-methods"
    ],
    "content": "# Strings & Template Literals\n\n## String basics\nStrings hold text. Single quotes, double quotes, and backticks all work.\nBackticks enable **template literals** — the modern way to embed values in text.\n\n    const name = 'Nova';\n    const level = 5;\n\n    // Old concatenation\n    console.log('Player ' + name + ' is level ' + level);\n\n    // Modern template literal (backticks, ${} for expressions)\n    console.log(`Player ${name} is level ${level}`);\n\n## Expressions inside ${}\nAny JavaScript expression works inside ${}:\n\n    const hp = 75, maxHp = 100;\n    console.log(`HP: ${hp}/${maxHp} (${Math.round(hp/maxHp*100)}%)`);\n    // HP: 75/100 (75%)\n\n## Useful string methods\n\n    const tag = '  hero  ';\n    tag.trim()           // 'hero'\n    'Nova'.toUpperCase() // 'NOVA'\n    'Nova'.length        // 4\n    'sword'.includes('or')  // true\n    'a,b,c'.split(',')   // ['a','b','c']\n    'ab'.repeat(3)       // 'ababab'\n\n## Strings are immutable\nMethods always return a new string — they never change the original.\n\n## Your Task\nBuild a formatted player status string like:\n\"NOVA | Level 5 | HP 75/100 (75%)\"\nusing template literals and at least two string methods.",
    "objectives": [
      "Use template literals to embed variables in strings",
      "Embed a JavaScript expression (not just a variable) inside ${}",
      "Apply at least two string methods (e.g. toUpperCase, trim, includes)",
      "Log the formatted result to the console"
    ]
  },
  {
    "title": "JS Basics 4 – Functions & Arrow Functions",
    "description": "Group reusable logic into named functions, understand parameters and return values, and compare function declarations with arrow functions.",
    "difficulty": "beginner",
    "category": "javascript-basics",
    "moduleType": "vanilla",
    "order": 4,
    "estimatedMinutes": 20,
    "tags": [
      "functions",
      "arrow-functions",
      "return",
      "parameters",
      "default-params"
    ],
    "content": "# Functions & Arrow Functions\n\n## Why functions?\nFunctions let you name a block of logic and call it anytime without rewriting it.\nIn a game, almost every action — move, attack, spawn — is a function.\n\n## Function declaration\n\n    function addScore(current, points) {\n      return current + points;\n    }\n    console.log(addScore(50, 10)); // 60\n\n## Arrow function\nThe shorter modern syntax — ideal for small, focused operations:\n\n    const takeDamage = (health, damage) => Math.max(0, health - damage);\n    console.log(takeDamage(80, 30)); // 50\n    console.log(takeDamage(20, 30)); // 0\n\n## Parameters vs arguments\n- **Parameters** — names in the definition (health, damage).\n- **Arguments** — actual values passed when calling (80, 30).\n\n## Default parameters\n\n    function greet(name = 'Player') {\n      return `Welcome, ${name}!`;\n    }\n    console.log(greet());        // Welcome, Player!\n    console.log(greet('Nova'));  // Welcome, Nova!\n\n## Returning an object\n\n    const resetPlayer = () => ({\n      name: 'Player', health: 100, score: 0, level: 1\n    });\n\n## Your Task\nWrite four functions: addScore, takeDamage (health never below 0), healPlayer\n(health never above 100), and resetPlayer (returns a fresh player object).\nCall each and log the results.",
    "objectives": [
      "Write a function using function declaration syntax",
      "Write a function using arrow function syntax",
      "Use Math.max / Math.min to clamp a value",
      "Return an object from a function",
      "Use a default parameter value"
    ]
  },
  {
    "title": "JS Basics 5 – Control Flow",
    "description": "Branch your program with if/else, ternary expressions, and switch statements to make decisions based on game state.",
    "difficulty": "beginner",
    "category": "javascript-basics",
    "moduleType": "vanilla",
    "order": 5,
    "estimatedMinutes": 15,
    "tags": [
      "if-else",
      "switch",
      "ternary",
      "conditionals",
      "logical-operators"
    ],
    "content": "# Control Flow\n\n## if / else if / else\n\n    function getStatus(health) {\n      if (health > 70)       return 'Healthy';\n      else if (health > 30)  return 'Wounded';\n      else                   return 'Critical';\n    }\n\n## Ternary expression\nA compact one-liner for simple yes/no decisions:\n\n    const label = health > 50 ? 'alive' : 'dead';\n\n## switch statement\nIdeal when checking one variable against many fixed values:\n\n    switch (difficulty) {\n      case 'easy':   enemySpeed = 2; break;\n      case 'medium': enemySpeed = 4; break;\n      case 'hard':   enemySpeed = 7; break;\n      default:       enemySpeed = 4;\n    }\n\n## Logical operators\n\n    if (isAlive && score > 100) { /* AND: both true */ }\n    if (isInvincible || health > 0) { /* OR: one true */ }\n    if (!isGameOver) { /* NOT */ }\n\n## Short-circuit evaluation\n\n    const name = playerName || 'Anonymous';  // fallback default\n    const level = player && player.level;    // safe property access\n\n## Your Task\nWrite a chooseAction(health, distance, stamina) function that returns:\n'flee' when health < 20, 'attack' when distance < 50 and stamina > 30,\nor 'defend' otherwise. Test at least four different scenarios.",
    "objectives": [
      "Write an if/else if/else chain with at least three branches",
      "Use a ternary expression for a simple binary decision",
      "Use a switch statement to handle multiple fixed cases",
      "Combine conditions with && and || operators"
    ]
  },
  {
    "title": "JS Basics 6 – Loops & Iteration",
    "description": "Repeat actions with for, while, and array-iteration methods — the tools every game uses to process enemies, bullets, and inventory.",
    "difficulty": "beginner",
    "category": "javascript-basics",
    "moduleType": "vanilla",
    "order": 6,
    "estimatedMinutes": 20,
    "tags": [
      "for-loop",
      "while",
      "forEach",
      "map",
      "filter"
    ],
    "content": "# Loops & Iteration\n\n## The classic for loop\nBest when you need the index or a known number of repetitions:\n\n    const enemies = ['Slime', 'Orc', 'Dragon'];\n    for (let i = 0; i < enemies.length; i++) {\n      console.log(`Enemy ${i}: ${enemies[i]}`);\n    }\n\n## for...of loop\nCleaner when you only need the value:\n\n    for (const enemy of enemies) {\n      console.log(enemy);\n    }\n\n## while loop\nRuns as long as a condition is true:\n\n    let countdown = 3;\n    while (countdown > 0) {\n      console.log(countdown);\n      countdown--;\n    }\n    console.log('Go!');\n\n## Array iteration methods\n\n    const scores = [45, 90, 30, 80, 55];\n\n    // forEach — run code for each item\n    scores.forEach((s, i) => console.log(`Round ${i+1}: ${s}`));\n\n    // map — transform into a new array\n    const doubled = scores.map(s => s * 2);\n\n    // filter — keep only items passing a test\n    const passing = scores.filter(s => s >= 60);\n\n    // find — first match or undefined\n    const firstHigh = scores.find(s => s >= 80);\n\n## Your Task\nGiven an array of player objects { name, score, alive }, use a loop to print\neach player's name and score, filter out eliminated players, find the top scorer,\nand double everyone's score with map.",
    "objectives": [
      "Use a for loop with an index variable",
      "Use a for...of loop to iterate values",
      "Use a while loop with a decrementing counter",
      "Use forEach, map, and filter on an array"
    ]
  },
  {
    "title": "JS Basics 7 – Arrays & Array Methods",
    "description": "Master arrays as dynamic lists — add, remove, search, sort, and transform items using the full set of array methods.",
    "difficulty": "beginner",
    "category": "javascript-basics",
    "moduleType": "vanilla",
    "order": 7,
    "estimatedMinutes": 20,
    "tags": [
      "arrays",
      "push",
      "pop",
      "splice",
      "sort",
      "reduce",
      "spread"
    ],
    "content": "# Arrays & Array Methods\n\n## Creating arrays\n\n    const inventory = ['sword', 'shield', 'potion'];\n    const scores = [];            // start empty\n    const grid = [[0,0],[0,0]];   // 2D array\n\n## Adding and removing\n\n    inventory.push('bow');         // add to end\n    const last = inventory.pop();  // remove from end → 'bow'\n    inventory.unshift('key');      // add to start\n    inventory.shift();             // remove from start\n\n    // splice(index, deleteCount, ...items)\n    inventory.splice(1, 0, 'map'); // insert at index 1\n    inventory.splice(2, 1);        // delete 1 item at index 2\n\n## Searching\n\n    inventory.includes('potion');             // true/false\n    inventory.indexOf('sword');               // first index or -1\n    inventory.findIndex(i => i === 'sword');  // predicate version\n\n## Transforming\n\n    const nums = [3, 1, 4, 1, 5, 9];\n    nums.sort((a, b) => a - b);  // ascending: [1,1,3,4,5,9]\n\n    // reduce — collapse to a single value\n    const total = nums.reduce((sum, n) => sum + n, 0); // 23\n\n## Copying arrays (important!)\nArrays are reference types — assigning does NOT copy:\n\n    const a = [1, 2, 3];\n    const b = a;      // same array\n    const c = [...a]; // independent copy (spread)\n\n## Your Task\nBuild an inventory system: start with some items, add new ones, remove one with splice,\nsort alphabetically, find a specific item's index, and count items with reduce.\nRender the list into a div on the page.",
    "objectives": [
      "Add and remove items with push, pop, and splice",
      "Search the array with includes and findIndex",
      "Sort the array with a comparator function",
      "Use reduce to calculate a total",
      "Copy an array correctly with spread syntax"
    ]
  },
  {
    "title": "JS Basics 8 – Objects & Classes",
    "description": "Model game entities with object literals, access and mutate properties, and use classes to create reusable blueprints with methods.",
    "difficulty": "intermediate",
    "category": "javascript-basics",
    "moduleType": "vanilla",
    "order": 8,
    "estimatedMinutes": 25,
    "tags": [
      "objects",
      "classes",
      "constructor",
      "methods",
      "destructuring",
      "spread"
    ],
    "content": "# Objects & Classes\n\n## Object literals\nKey-value pairs wrapped in {}. Values can be any type, including functions (methods):\n\n    const player = {\n      name: 'Nova',\n      health: 100,\n      score: 0,\n      greet() {\n        return `I am ${this.name}`;\n      },\n    };\n    console.log(player.greet()); // I am Nova\n    player.score += 50;\n\n## Destructuring\nPull values out without repetitive obj.prop:\n\n    const { name, health } = player;              // object destructuring\n    const [first, second] = ['sword', 'shield'];  // array destructuring\n\n## Spread & merge\n\n    const updated = { ...player, score: 200 }; // copy and override\n\n## Classes — reusable blueprints\n\n    class Enemy {\n      constructor(type, hp, speed) {\n        this.type  = type;\n        this.hp    = hp;\n        this.speed = speed;\n        this.alive = true;\n      }\n\n      takeDamage(amount) {\n        this.hp = Math.max(0, this.hp - amount);\n        if (this.hp === 0) this.alive = false;\n        return this; // enable chaining\n      }\n\n      describe() {\n        return `${this.type}: ${this.hp}hp (${this.alive ? 'alive' : 'dead'})`;\n      }\n    }\n\n    const orc = new Enemy('Orc', 80, 3);\n    orc.takeDamage(50).takeDamage(40);\n    console.log(orc.describe()); // Orc: 0hp (dead)\n\n## Your Task\nCreate an Enemy class with type, hp, and speed. Add takeDamage(n), heal(n), and\ndescribe() methods. Spawn three different enemies, damage them with a loop, and\nlog a final status report.",
    "objectives": [
      "Create an object literal with properties and a method",
      "Define a class with a constructor and multiple methods",
      "Instantiate a class with new and call its methods",
      "Use destructuring to extract object properties",
      "Use spread syntax to copy and update an object"
    ]
  },
  {
    "title": "Game Dev 1 – Canvas Setup & Drawing",
    "description": "Get a 2D rendering context from an HTML canvas and draw filled and stroked rectangles and circles to lay the groundwork for game graphics.",
    "difficulty": "beginner",
    "category": "game-development",
    "moduleType": "vanilla",
    "order": 1,
    "estimatedMinutes": 20,
    "tags": [
      "canvas",
      "2d-context",
      "fillRect",
      "arc",
      "colors"
    ],
    "content": "# Canvas Setup & Drawing\n\n## Why canvas?\nThe `<canvas>` element is a blank pixel surface you control entirely with JavaScript —\nperfect for games where every frame needs to be drawn from scratch.\n\n## Getting the context\n\n    const canvas = document.getElementById('gameCanvas');\n    const ctx = canvas.getContext('2d'); // always '2d' for 2D games\n\n## Rectangles\n\n    ctx.fillStyle = '#4ade80';\n    ctx.fillRect(x, y, width, height);  // filled rectangle\n\n    ctx.strokeStyle = '#ffffff';\n    ctx.lineWidth = 2;\n    ctx.strokeRect(x, y, width, height); // outlined rectangle\n\n    ctx.clearRect(0, 0, canvas.width, canvas.height); // erase area\n\n## Circles\n\n    ctx.beginPath();\n    ctx.arc(cx, cy, radius, 0, Math.PI * 2); // full circle\n    ctx.fillStyle = '#f472b6';\n    ctx.fill();\n\n## Colors\nAccepts any CSS color: 'red', '#ff0000', 'rgb(255,0,0)', 'rgba(255,0,0,0.5)'.\n\n## Coordinate system\nOrigin (0, 0) is the **top-left** corner.\nX increases to the right. Y increases **downward**.\n\n## Your Task\nDraw a simple scene on the canvas: a colored background, a player\n(rectangle body + circle head), and a ground line.\nUse at least three different fill colors.",
    "objectives": [
      "Get a 2D context from a canvas element",
      "Draw a filled rectangle with fillRect",
      "Draw a filled circle using arc and fill",
      "Use strokeRect to draw an outline",
      "Use clearRect to erase part of the canvas"
    ]
  },
  {
    "title": "Game Dev 2 – Paths, Text & Transforms",
    "description": "Draw custom polygon shapes with paths, write text on the canvas, and apply translate/rotate transforms using save and restore.",
    "difficulty": "beginner",
    "category": "game-development",
    "moduleType": "vanilla",
    "order": 2,
    "estimatedMinutes": 20,
    "tags": [
      "canvas",
      "paths",
      "text",
      "translate",
      "rotate",
      "save-restore"
    ],
    "content": "# Paths, Text & Transforms\n\n## Custom paths\n\n    ctx.beginPath();\n    ctx.moveTo(100, 50);   // lift pen to start\n    ctx.lineTo(200, 150);  // draw line\n    ctx.lineTo(50,  150);  // another line\n    ctx.closePath();       // connect back to start (triangle)\n    ctx.fillStyle = '#facc15';\n    ctx.fill();\n\n## Text\n\n    ctx.font = 'bold 24px Arial';\n    ctx.fillStyle = '#ffffff';\n    ctx.textAlign = 'center'; // 'left' | 'center' | 'right'\n    ctx.fillText('Score: 100', canvas.width / 2, 40);\n\n## Transforms\nAlways wrap transforms in save/restore to avoid affecting other drawing:\n\n    ctx.save();\n    ctx.translate(canvas.width / 2, canvas.height / 2); // move origin\n    ctx.rotate(angle);           // rotate in radians\n    ctx.fillRect(-25, -25, 50, 50); // centered on new origin\n    ctx.restore();               // pop back to previous state\n\n## Radians\n2π radians = 360°.  Convert: degrees × Math.PI / 180.\n\n## globalAlpha\n\n    ctx.globalAlpha = 0.5;  // 50% transparent for next draws\n    ctx.fillRect(0, 0, 100, 100);\n    ctx.globalAlpha = 1.0;  // always reset after use\n\n## Your Task\nDraw a rotated star or triangle at the canvas center using paths.\nAdd a score label with fillText. Use save/restore correctly.",
    "objectives": [
      "Draw a custom polygon using moveTo and lineTo",
      "Close a path and fill it with a color",
      "Display text on the canvas with fillText",
      "Use save and restore to isolate a transform",
      "Rotate a shape around a point using translate and rotate"
    ]
  },
  {
    "title": "Game Dev 3 – The Game Loop",
    "description": "Build the heartbeat of every game: a requestAnimationFrame loop that separates update logic from drawing and runs at 60 fps with delta time.",
    "difficulty": "intermediate",
    "category": "game-development",
    "moduleType": "vanilla",
    "order": 3,
    "estimatedMinutes": 25,
    "tags": [
      "game-loop",
      "requestAnimationFrame",
      "delta-time",
      "animation",
      "update-draw"
    ],
    "content": "# The Game Loop\n\n## What is a game loop?\nA game loop runs continuously — every frame it updates the game state (positions,\nphysics, logic) and then redraws the screen.\n\n## requestAnimationFrame\nThe browser calls your function right before painting the next frame — ~60 times/sec:\n\n    function gameLoop() {\n      update();\n      draw();\n      requestAnimationFrame(gameLoop);\n    }\n    requestAnimationFrame(gameLoop); // kick off\n\n## Delta time — frame-rate independent movement\nA frame can take 16ms or 32ms depending on the device. Multiply speeds by delta time\nso movement is consistent regardless of frame rate:\n\n    let lastTime = 0;\n\n    function gameLoop(timestamp) {\n      const delta = timestamp - lastTime; // ms since last frame\n      lastTime = timestamp;\n      update(delta);\n      draw();\n      requestAnimationFrame(gameLoop);\n    }\n\n    function update(delta) {\n      const dt = delta / 1000; // convert to seconds\n      player.x += player.speedX * dt; // pixels/sec × sec = pixels\n    }\n\n## The clear-draw pattern\nAlways clear the canvas before drawing — otherwise frames accumulate:\n\n    function draw() {\n      ctx.clearRect(0, 0, canvas.width, canvas.height);\n      // draw background, entities, then UI\n    }\n\n## Your Task\nCreate a bouncing ball that moves diagonally and reverses direction when it\nhits any canvas edge. The game loop must call update(delta) and draw() every frame.",
    "objectives": [
      "Create a game loop using requestAnimationFrame",
      "Separate update and draw into two functions",
      "Calculate delta time between frames",
      "Multiply velocity by delta time for frame-rate independent movement",
      "Clear the canvas each frame before drawing",
      "Reverse direction when an object hits the canvas boundary"
    ]
  },
  {
    "title": "Game Dev 4 – Player & Keyboard Controls",
    "description": "Track keyboard state in real time and move a player smoothly across the canvas using arrow keys and WASD with boundary clamping.",
    "difficulty": "intermediate",
    "category": "game-development",
    "moduleType": "vanilla",
    "order": 4,
    "estimatedMinutes": 25,
    "tags": [
      "keyboard",
      "input",
      "player-movement",
      "keydown",
      "keyup",
      "clamp"
    ],
    "content": "# Player & Keyboard Controls\n\n## The key-state map pattern\nStore pressed keys in an object. Check the map every frame inside update() —\nthis allows smooth diagonal movement with no jitter:\n\n    const keys = {};\n\n    window.addEventListener('keydown', (e) => {\n      keys[e.code] = true;\n      e.preventDefault(); // prevent page scrolling on arrow keys\n    });\n\n    window.addEventListener('keyup', (e) => {\n      keys[e.code] = false;\n    });\n\n## Using key state in update()\n\n    const SPEED = 200; // pixels per second\n\n    function update(delta) {\n      const dt = delta / 1000;\n\n      if (keys['ArrowLeft']  || keys['KeyA']) player.x -= SPEED * dt;\n      if (keys['ArrowRight'] || keys['KeyD']) player.x += SPEED * dt;\n      if (keys['ArrowUp']    || keys['KeyW']) player.y -= SPEED * dt;\n      if (keys['ArrowDown']  || keys['KeyS']) player.y += SPEED * dt;\n\n      // Clamp — keep player fully inside canvas\n      player.x = Math.max(0, Math.min(canvas.width  - player.w, player.x));\n      player.y = Math.max(0, Math.min(canvas.height - player.h, player.y));\n    }\n\n## e.code vs e.key\n- e.code — physical key position: 'KeyA', 'ArrowLeft', 'Space' (layout-independent)\n- e.key  — character produced: 'a', 'ArrowLeft', ' '\n\nPrefer e.code for game controls.\n\n## Your Task\nAdd a player rectangle that moves smoothly via WASD or arrow keys at a fixed\npixels-per-second speed. It must stay fully inside the canvas.\nDisplay the live x/y position with fillText.",
    "objectives": [
      "Set up keydown and keyup listeners that track key state in an object",
      "Use e.code to identify keys independently of keyboard layout",
      "Move a player using delta-time scaled velocity",
      "Support WASD and arrow keys simultaneously",
      "Clamp the player position to stay inside the canvas"
    ]
  },
  {
    "title": "Game Dev 5 – Collision Detection",
    "description": "Implement AABB rectangle-vs-rectangle and circle-vs-circle collision detection to make objects interact and respond in your game.",
    "difficulty": "intermediate",
    "category": "game-development",
    "moduleType": "vanilla",
    "order": 5,
    "estimatedMinutes": 25,
    "tags": [
      "collision",
      "AABB",
      "circle",
      "rectangle",
      "physics",
      "overlap"
    ],
    "content": "# Collision Detection\n\n## AABB — Axis-Aligned Bounding Box\nTwo rectangles overlap when neither is completely outside the other on any axis:\n\n    function rectOverlap(a, b) {\n      // a, b have properties: x, y, w, h\n      return a.x < b.x + b.w &&\n             a.x + a.w > b.x &&\n             a.y < b.y + b.h &&\n             a.y + a.h > b.y;\n    }\n\n## Circle vs. circle\nTwo circles overlap when the distance between centres is less than the sum of radii:\n\n    function circlesOverlap(a, b) {\n      // a, b have: x, y, radius (centre point)\n      const dx = b.x - a.x;\n      const dy = b.y - a.y;\n      const dist = Math.sqrt(dx * dx + dy * dy);\n      return dist < a.radius + b.radius;\n    }\n\n## Faster: skip the sqrt\nCompare squared distances to avoid the expensive square root:\n\n    const distSq   = dx*dx + dy*dy;\n    const minDist  = a.radius + b.radius;\n    return distSq < minDist * minDist;\n\n## Detecting every frame\n\n    function update(delta) {\n      // move player and coin ...\n      if (rectOverlap(player, coin)) {\n        score++;\n        coin.x = Math.random() * (canvas.width  - coin.w);\n        coin.y = Math.random() * (canvas.height - coin.h);\n      }\n    }\n\n## Your Task\nBuild a collector game: a player (arrow-key rectangle) chases randomly placed coin\ncircles. On overlap, increment score and move the coin to a new random position.\nDisplay score with fillText.",
    "objectives": [
      "Implement AABB rectangle collision detection",
      "Implement circle-vs-circle collision using distance",
      "Optimise circle collision with squared distance comparison",
      "Detect collision each frame inside update()",
      "Respond to a collision by updating score and repositioning the item"
    ]
  },
  {
    "title": "Game Dev 6 – Game States & Screens",
    "description": "Use a state machine to manage MENU, PLAYING, PAUSED, and GAME_OVER screens — the structural foundation of every polished game.",
    "difficulty": "intermediate",
    "category": "game-development",
    "moduleType": "vanilla",
    "order": 6,
    "estimatedMinutes": 30,
    "tags": [
      "game-states",
      "state-machine",
      "menu",
      "pause",
      "game-over"
    ],
    "content": "# Game States & Screens\n\n## Why a state machine?\nWithout states, the game loop becomes a tangle of nested ifs.\nA single string representing the current state keeps logic clean and maintainable.\n\n## Four core states\n\n| State     | Player sees                        |\n|-----------|------------------------------------|\n| 'menu'    | Title screen, \"Press Enter to start\" |\n| 'playing' | Active gameplay                    |\n| 'paused'  | Frozen game, \"Press P to resume\"   |\n| 'gameover'| End screen, score, \"Press R to restart\" |\n\n## State machine skeleton\n\n    let state = 'menu';\n\n    function update(delta) {\n      if (state === 'playing') {\n        movePlayer(delta);\n        moveEnemies(delta);\n        checkCollisions();\n      }\n    }\n\n    function draw() {\n      ctx.clearRect(0, 0, canvas.width, canvas.height);\n      if      (state === 'menu')     drawMenu();\n      else if (state === 'playing')  drawGame();\n      else if (state === 'paused')   { drawGame(); drawPauseOverlay(); }\n      else if (state === 'gameover') drawGameOver();\n    }\n\n## Transitions via keyboard\n\n    window.addEventListener('keydown', (e) => {\n      if (e.code === 'Enter' && state === 'menu')     { resetGame(); state = 'playing'; }\n      if (e.code === 'KeyP'  && state === 'playing')  state = 'paused';\n      if (e.code === 'KeyP'  && state === 'paused')   state = 'playing';\n      if (e.code === 'KeyR'  && state === 'gameover') state = 'menu';\n    });\n\n## Semi-transparent overlay\n\n    function drawPauseOverlay() {\n      ctx.fillStyle = 'rgba(0,0,0,0.5)';\n      ctx.fillRect(0, 0, canvas.width, canvas.height);\n      ctx.fillStyle = '#fff';\n      ctx.font = 'bold 36px Arial';\n      ctx.textAlign = 'center';\n      ctx.fillText('PAUSED', canvas.width/2, canvas.height/2);\n    }\n\n## Your Task\nBuild a game shell with all four states: menu loads first, Enter starts a moving dot,\nP toggles pause, and the game-over screen appears after a 10-second timer.\nEach screen must show an instructional prompt.",
    "objectives": [
      "Represent game state with a single string variable",
      "Run update logic only in the playing state",
      "Draw a different screen per state",
      "Transition between states via keyboard input",
      "Draw a semi-transparent overlay for the pause screen"
    ]
  },
  {
    "title": "Game Dev 7 – Score, Lives & HUD",
    "description": "Draw an always-visible heads-up display showing score, lives, a countdown timer, and a colour-changing health bar directly on the canvas.",
    "difficulty": "intermediate",
    "category": "game-development",
    "moduleType": "vanilla",
    "order": 7,
    "estimatedMinutes": 25,
    "tags": [
      "HUD",
      "score",
      "lives",
      "health-bar",
      "timer",
      "canvas-text"
    ],
    "content": "# Score, Lives & HUD\n\n## What is a HUD?\nA Heads-Up Display shows gameplay info on top of everything else — drawn last every frame.\n\n## Drawing text helper\n\n    function drawText(text, x, y, { size=18, color='#fff', align='left' } = {}) {\n      ctx.font = `${size}px Arial`;\n      ctx.fillStyle = color;\n      ctx.textAlign = align;\n      ctx.fillText(text, x, y);\n    }\n\n## Score, lives and timer\n\n    function drawHUD() {\n      drawText(`Score: ${score}`, 16, 30, { size: 20 });\n\n      // Lives as heart icons\n      for (let i = 0; i < lives; i++) {\n        drawText('♥', canvas.width - 24 - i * 28, 30, { color: '#f87171' });\n      }\n\n      // Timer — turns red below 5 seconds\n      const secs = Math.ceil(timeLeft);\n      drawText(`${secs}s`, canvas.width / 2, 30, {\n        align: 'center',\n        color: secs < 5 ? '#ef4444' : '#fff',\n      });\n    }\n\n## Health bar — two stacked rectangles\n\n    function drawHealthBar(x, y, maxW, h, current, max) {\n      const pct   = Math.max(0, current / max);\n      const color = pct > 0.5 ? '#4ade80' : pct > 0.25 ? '#facc15' : '#ef4444';\n\n      ctx.fillStyle = '#1e293b';           // dark background\n      ctx.fillRect(x, y, maxW, h);\n\n      ctx.fillStyle = color;               // filled portion\n      ctx.fillRect(x, y, maxW * pct, h);\n\n      ctx.strokeStyle = '#ffffff44';\n      ctx.strokeRect(x, y, maxW, h);       // subtle border\n    }\n\n## Countdown timer in update()\n\n    function update(delta) {\n      timeLeft -= delta / 1000;\n      if (timeLeft <= 0) { timeLeft = 0; state = 'gameover'; }\n    }\n\n## Your Task\nAdd a full HUD showing: score (top-left), heart icons for each life (top-right),\na countdown timer (top-centre, turns red below 5s), and a health bar (bottom-left)\nthat shifts from green to yellow to red.",
    "objectives": [
      "Draw score text on the canvas every frame",
      "Render life icons using a loop",
      "Show a countdown timer that changes colour when low",
      "Draw a two-layer health bar that changes colour based on percentage",
      "Draw the HUD on top of all other elements"
    ]
  },
  {
    "title": "Game Dev 8 – Enemy Spawning & Wave AI",
    "description": "Spawn enemies in escalating waves, give them a simple chase AI, and manage the lifecycle of dynamic game objects in an array.",
    "difficulty": "intermediate",
    "category": "game-development",
    "moduleType": "vanilla",
    "order": 8,
    "estimatedMinutes": 30,
    "tags": [
      "enemies",
      "spawning",
      "waves",
      "chase-AI",
      "object-lifecycle"
    ],
    "content": "# Enemy Spawning & Wave AI\n\n## Managing a dynamic list\n\n    let enemies = [];\n\n    function update(delta) {\n      enemies.forEach(e => e.update(delta));\n      enemies = enemies.filter(e => e.alive); // remove dead\n    }\n\n    function draw() {\n      enemies.forEach(e => e.draw(ctx));\n    }\n\n## Enemy class with chase AI\n\n    class Enemy {\n      constructor(x, y, speed, hp) {\n        this.x = x; this.y = y;\n        this.w = 30; this.h = 30;\n        this.speed = speed;\n        this.hp = hp;\n        this.alive = true;\n      }\n\n      update(delta) {\n        // Normalised direction toward the player\n        const dx   = player.x - this.x;\n        const dy   = player.y - this.y;\n        const dist = Math.sqrt(dx*dx + dy*dy) || 1;\n        const dt   = delta / 1000;\n        this.x += (dx / dist) * this.speed * dt;\n        this.y += (dy / dist) * this.speed * dt;\n      }\n\n      hit(damage) {\n        this.hp -= damage;\n        if (this.hp <= 0) this.alive = false;\n      }\n\n      draw(ctx) {\n        ctx.fillStyle = '#ef4444';\n        ctx.fillRect(this.x, this.y, this.w, this.h);\n      }\n    }\n\n## Wave spawning\n\n    let waveTimer = 0, wave = 1;\n    const WAVE_INTERVAL = 8; // seconds\n\n    function spawnWave(waveNum) {\n      const count = 2 + waveNum * 2;\n      const speed = 60 + waveNum * 15;\n      for (let i = 0; i < count; i++) {\n        // Spawn off-screen on a random edge\n        const side = Math.floor(Math.random() * 4);\n        let x = 0, y = 0;\n        if (side === 0) { x = Math.random() * canvas.width; y = -30; }\n        if (side === 1) { x = canvas.width + 30; y = Math.random() * canvas.height; }\n        if (side === 2) { x = Math.random() * canvas.width; y = canvas.height + 30; }\n        if (side === 3) { x = -30; y = Math.random() * canvas.height; }\n        enemies.push(new Enemy(x, y, speed, waveNum * 20));\n      }\n    }\n\n## Your Task\nBuild a wave survival game: spawn increasingly difficult waves every 8 seconds,\nenemies chase the player, clicking an enemy damages it.\nShow current wave number and enemy count in the HUD.",
    "objectives": [
      "Store enemies in an array and update/draw them in a loop each frame",
      "Remove dead enemies using filter after each update",
      "Implement chase AI using normalised direction vectors",
      "Spawn waves off-screen with increasing count and speed",
      "Display wave number and enemy count in the HUD"
    ]
  },
  {
    "title": "Game Dev 9 – Particle Systems",
    "description": "Build a lightweight particle system for explosions, trails, and visual feedback using canvas drawing primitives and globalAlpha.",
    "difficulty": "advanced",
    "category": "game-development",
    "moduleType": "vanilla",
    "order": 9,
    "estimatedMinutes": 30,
    "tags": [
      "particles",
      "explosion",
      "effects",
      "globalAlpha",
      "lifecycle"
    ],
    "content": "# Particle Systems\n\n## What is a particle?\nA tiny, short-lived visual element — a spark, smoke puff, or dust grain.\nHundreds together create explosions, fire, and magic effects.\n\n## Particle class\n\n    class Particle {\n      constructor(x, y, color) {\n        this.x     = x;\n        this.y     = y;\n        this.vx    = (Math.random() - 0.5) * 300; // px/s\n        this.vy    = (Math.random() - 0.5) * 300;\n        this.life  = 1.0;   // 0→1, starts full\n        this.decay = 0.8 + Math.random() * 0.8; // life per second\n        this.size  = 4 + Math.random() * 4;\n        this.color = color || '#facc15';\n      }\n\n      update(delta) {\n        const dt = delta / 1000;\n        this.x  += this.vx * dt;\n        this.y  += this.vy * dt;\n        this.vy += 200 * dt;   // gravity\n        this.life -= this.decay * dt;\n      }\n\n      draw(ctx) {\n        if (this.life <= 0) return;\n        ctx.save();\n        ctx.globalAlpha = Math.max(0, this.life);\n        ctx.fillStyle   = this.color;\n        ctx.beginPath();\n        ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);\n        ctx.fill();\n        ctx.restore();\n      }\n\n      isDead() { return this.life <= 0; }\n    }\n\n## Emitting particles\n\n    let particles = [];\n\n    function explode(x, y, count = 30, color = '#facc15') {\n      for (let i = 0; i < count; i++) {\n        particles.push(new Particle(x, y, color));\n      }\n    }\n\n    function update(delta) {\n      particles.forEach(p => p.update(delta));\n      particles = particles.filter(p => !p.isDead());\n    }\n\n## Performance tip\nKeep particle count below ~500 at a time to maintain 60fps.\n\n## Your Task\nMake clicking anywhere on the canvas trigger a colour explosion at that point.\nAdd a right-click continuous emitter (trail effect).\nShow live particle count in the HUD.",
    "objectives": [
      "Create a Particle class with position, velocity, life, and decay",
      "Apply gravity by incrementing vertical velocity each frame",
      "Use globalAlpha to fade particles as their life decreases",
      "Remove dead particles with filter each frame",
      "Trigger a burst of particles on a canvas click event"
    ]
  },
  {
    "title": "Game Dev 10 – Web Audio & Sound Effects",
    "description": "Generate jump, collect, hurt, and win sounds programmatically using the Web Audio API — no audio files needed.",
    "difficulty": "intermediate",
    "category": "game-development",
    "moduleType": "vanilla",
    "order": 10,
    "estimatedMinutes": 25,
    "tags": [
      "audio",
      "Web-Audio-API",
      "oscillator",
      "sound-effects",
      "gain"
    ],
    "content": "# Web Audio & Sound Effects\n\n## Why Web Audio API?\nThe built-in AudioContext generates sounds in code — no MP3s, no loading delays,\nand complete control over pitch, duration, and waveform shape.\n\n## Key concepts\n\n| Node            | Role                                  |\n|-----------------|---------------------------------------|\n| AudioContext    | The audio engine — create once        |\n| OscillatorNode  | Generates a periodic waveform (tone)  |\n| GainNode        | Controls volume                       |\n| destination     | Final output (speakers)               |\n\nSignal chain: Oscillator → GainNode → destination\n\n## A reusable playTone helper\n\n    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();\n\n    function playTone({ frequency = 440, type = 'sine', duration = 0.15, volume = 0.3 } = {}) {\n      const osc  = audioCtx.createOscillator();\n      const gain = audioCtx.createGain();\n\n      osc.connect(gain);\n      gain.connect(audioCtx.destination);\n\n      osc.type           = type;  // 'sine' | 'square' | 'sawtooth' | 'triangle'\n      osc.frequency.value = frequency;\n      gain.gain.setValueAtTime(volume, audioCtx.currentTime);\n      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);\n\n      osc.start(audioCtx.currentTime);\n      osc.stop(audioCtx.currentTime + duration);\n    }\n\n## Sound recipes\n\n    const sfx = {\n      jump:    () => playTone({ frequency: 440, type: 'square',   duration: 0.1  }),\n      collect: () => playTone({ frequency: 880, type: 'sine',     duration: 0.15 }),\n      hurt:    () => playTone({ frequency: 180, type: 'sawtooth', duration: 0.25 }),\n      win:     () => {\n        playTone({ frequency: 523, duration: 0.1 });\n        setTimeout(() => playTone({ frequency: 659, duration: 0.1 }), 120);\n        setTimeout(() => playTone({ frequency: 784, duration: 0.3 }), 240);\n      },\n    };\n\n## IMPORTANT — browser audio policy\nBrowsers block audio until the user interacts. Resume the context on first click:\n\n    document.addEventListener('click', () => {\n      if (audioCtx.state === 'suspended') audioCtx.resume();\n    }, { once: true });\n\n## Your Task\nCreate four buttons (Jump, Collect, Hurt, Win) each wired to a distinct sound.\nThe Win sound must play a sequence of at least three notes.\nDisplay the name of the currently playing sound in the UI.",
    "objectives": [
      "Create an AudioContext and resume it on user interaction",
      "Build an Oscillator → GainNode → destination signal chain",
      "Use exponentialRampToValueAtTime for a natural fade-out",
      "Create at least four distinct sound effects with different frequencies and wave types",
      "Build a multi-note sequence using setTimeout"
    ]
  },
  {
    "title": "React 1 – Components & JSX",
    "description": "Write your first React functional components, understand JSX syntax rules, and pass data between parent and children using props.",
    "difficulty": "beginner",
    "category": "react-game-dev",
    "moduleType": "react",
    "order": 1,
    "estimatedMinutes": 20,
    "tags": [
      "react",
      "components",
      "JSX",
      "props",
      "functional-components"
    ],
    "content": "# React Components & JSX\n\n## What is React?\nReact builds UIs from small, reusable pieces called **components**.\nEach component is a JavaScript function that returns JSX —\nHTML-like syntax that compiles to React.createElement calls.\n\n## Your first component\n\n    function Greeting({ name }) {\n      return <h1>Hello, {name}!</h1>;\n    }\n\n- Function name starts with a capital letter (required).\n- { name } is destructured from the **props** object.\n- {} inside JSX evaluates any JavaScript expression.\n\n## Composing a parent from children\n\n    function PlayerCard({ name, score, level }) {\n      return (\n        <div className=\"card\">\n          <h2>{name}</h2>\n          <p>Score: {score}</p>\n          <p>Level: {level}</p>\n        </div>\n      );\n    }\n\n    function App() {\n      return (\n        <div>\n          <PlayerCard name=\"Nova\"  score={1200} level={5} />\n          <PlayerCard name=\"Blaze\" score={800}  level={3} />\n        </div>\n      );\n    }\n\n## JSX rules\n1. Every element must be closed: <br /> not <br>.\n2. Only one root element per return — wrap extras in <></>.\n3. Use className not class.\n4. Inline styles use an object: style={{ color: 'red' }}.\n\n## Props are read-only\nData flows down — a component must never modify its props.\n\n## Your Task\nBuild an App with a ScoreBoard component that receives an array of player objects\nas props and renders a styled card for each: name, score, and rank.",
    "objectives": [
      "Create a functional component that accepts and renders props",
      "Compose a parent component from multiple child components",
      "Render a list of items by mapping an array to JSX",
      "Apply inline styles and className in JSX",
      "Follow JSX syntax rules (closing tags, single root, className)"
    ]
  },
  {
    "title": "React 2 – State, Events & Re-rendering",
    "description": "Add interactivity using useState, handle click and input events, and understand what causes a React component to re-render.",
    "difficulty": "beginner",
    "category": "react-game-dev",
    "moduleType": "react",
    "order": 2,
    "estimatedMinutes": 20,
    "tags": [
      "useState",
      "events",
      "re-render",
      "controlled-input",
      "conditional-rendering"
    ],
    "content": "# State, Events & Re-rendering\n\n## Why state?\nProps are read-only data from outside. **State** is data the component owns and can change.\nWhen state changes, React re-renders the component automatically.\n\n## useState hook\n\n    import { useState } from 'react';\n\n    function Counter() {\n      const [count, setCount] = useState(0); // [value, setter]\n\n      return (\n        <div>\n          <p>Count: {count}</p>\n          <button onClick={() => setCount(count + 1)}>+1</button>\n          <button onClick={() => setCount(0)}>Reset</button>\n        </div>\n      );\n    }\n\n## State update rules\n- NEVER mutate state directly — always use the setter.\n- Updater function form is safer when updates batch:\n  setCount(prev => prev + 1)\n\n## Controlled inputs\n\n    const [name, setName] = useState('');\n\n    <input\n      value={name}\n      onChange={(e) => setName(e.target.value)}\n      placeholder=\"Player name\"\n    />\n\n## Conditional rendering\n\n    {isGameOver && <p>Game Over!</p>}\n    {score > 100 ? <span>High scorer!</span> : <span>Keep going</span>}\n\n## Multiple state variables\n\n    const [score, setScore]     = useState(0);\n    const [lives, setLives]     = useState(3);\n    const [running, setRunning] = useState(false);\n\n## Your Task\nBuild a clicker game: a big button adds points, a penalty button removes a life,\na toggle controls a 2x bonus multiplier.\nShow score, lives, and multiplier. Display \"Game Over\" when lives reach 0.",
    "objectives": [
      "Declare state with useState and destructure value and setter",
      "Update state in an onClick handler",
      "Use a controlled input bound to state",
      "Use the updater function form (prev => prev + 1)",
      "Conditionally render an element based on state"
    ]
  },
  {
    "title": "React 3 – useEffect & the Game Loop",
    "description": "Run side effects with useEffect, animate a canvas inside React using requestAnimationFrame, and manage cleanup to prevent memory leaks.",
    "difficulty": "intermediate",
    "category": "react-game-dev",
    "moduleType": "react",
    "order": 3,
    "estimatedMinutes": 30,
    "tags": [
      "useEffect",
      "useRef",
      "requestAnimationFrame",
      "game-loop",
      "cleanup"
    ],
    "content": "# useEffect & the Game Loop\n\n## What is a side effect?\nAnything outside React's render — timers, event listeners, canvas drawing, subscriptions.\nReact handles these with useEffect.\n\n## useEffect basics\n\n    useEffect(() => {\n      // runs once on mount (empty dep array)\n    }, []);\n\n    useEffect(() => {\n      // runs every time score changes\n    }, [score]);\n\n## useRef — mutable box that survives re-renders\n\n    const canvasRef  = useRef(null);     // DOM element reference\n    const animId     = useRef(null);     // store animation frame ID\n    const playerRef  = useRef({ x: 50, y: 200, speed: 150 });\n\n## Canvas game loop inside React\n\n    import { useEffect, useRef } from 'react';\n\n    function GameCanvas() {\n      const canvasRef = useRef(null);\n      const stateRef  = useRef({ x: 50, y: 200, vx: 150 });\n      const animRef   = useRef(null);\n\n      useEffect(() => {\n        const canvas = canvasRef.current;\n        const ctx    = canvas.getContext('2d');\n        let lastTime = 0;\n\n        function loop(ts) {\n          const dt  = (ts - lastTime) / 1000;\n          lastTime  = ts;\n          const s   = stateRef.current;\n          s.x      += s.vx * dt;\n          if (s.x > canvas.width || s.x < 0) s.vx *= -1;\n\n          ctx.clearRect(0, 0, canvas.width, canvas.height);\n          ctx.fillStyle = '#4ade80';\n          ctx.fillRect(s.x, s.y, 30, 30);\n\n          animRef.current = requestAnimationFrame(loop);\n        }\n\n        animRef.current = requestAnimationFrame(loop);\n        return () => cancelAnimationFrame(animRef.current); // cleanup!\n      }, []);\n\n      return <canvas ref={canvasRef} width={600} height={400} />;\n    }\n\n## Why store physics in useRef, not useState?\nuseState triggers a re-render on every change — 60 re-renders/second is too expensive.\nGame physics live in useRef; only UI values (score, lives) use useState.\n\n## Your Task\nAnimate a bouncing ball that bounces off all four canvas edges.\nAdd a React score display (useState) that increments on each wall bounce.\nInclude a Pause/Resume button that stops and restarts the loop.",
    "objectives": [
      "Use useEffect with an empty dependency array to run code once on mount",
      "Store a DOM reference with useRef",
      "Run a requestAnimationFrame loop inside useEffect",
      "Return a cleanup function from useEffect to cancel the animation",
      "Store fast-changing game physics in useRef to avoid excessive re-renders"
    ]
  },
  {
    "title": "React 4 – Build a Complete React Game",
    "description": "Combine components, state, refs, and effects into a fully playable game with keyboard controls, lives, a score counter, and a game-over screen.",
    "difficulty": "intermediate",
    "category": "react-game-dev",
    "moduleType": "react",
    "order": 4,
    "estimatedMinutes": 35,
    "tags": [
      "react",
      "complete-game",
      "useCallback",
      "keyboard",
      "game-states",
      "architecture"
    ],
    "content": "# Complete React Game\n\n## Architecture overview\nSplit a React game into clearly responsible pieces:\n\n    App\n     ├─ GameCanvas  — canvas rendering (refs + requestAnimationFrame)\n     ├─ HUD         — score, lives (pure React useState)\n     └─ Overlay     — menu / pause / game-over (conditional render)\n\n## useCallback for stable event listeners\nWithout useCallback, a new function reference is created every render,\ncausing the useEffect to re-run and re-attach listeners:\n\n    const handleKeyDown = useCallback((e) => {\n      keysRef.current[e.code] = true;\n    }, []); // stable — same function every render\n\n    useEffect(() => {\n      window.addEventListener('keydown', handleKeyDown);\n      window.addEventListener('keyup',   handleKeyUp);\n      return () => {\n        window.removeEventListener('keydown', handleKeyDown);\n        window.removeEventListener('keyup',   handleKeyUp);\n      };\n    }, [handleKeyDown, handleKeyUp]);\n\n## Bridging the game loop to React UI\nGame loop runs in a ref; HUD updates via setState but only when the value changes:\n\n    const scoreRef     = useRef(0);\n    const [uiScore, setUiScore] = useState(0);\n\n    // Inside the game loop, after picking up a coin:\n    scoreRef.current  += 10;\n    setUiScore(scoreRef.current); // triggers HUD re-render only\n\n## Game state as a string\n\n    const [gameState, setGameState] = useState('menu');\n    // 'menu' | 'playing' | 'paused' | 'gameover'\n\n## What to build\nA dodge game: coloured blocks fall from the top, the player (left/right arrow keys)\nmoves left and right to avoid them. Each block dodged adds to score.\nBeing hit loses a life. Three lives total. Game over shows score and a restart button.\n\n## Your Task\nImplement the full game using the architecture above.\nThe HUD must be a separate styled React component (not drawn on canvas).\nAll event listeners must be cleaned up when the component unmounts.",
    "objectives": [
      "Separate canvas rendering from React UI into distinct components",
      "Use useCallback to create stable event handler references",
      "Bridge game loop state (useRef) to UI state (useState) efficiently",
      "Implement a full state machine: menu, playing, paused, gameover",
      "Clean up all event listeners and animation frames on unmount"
    ]
  },
  {
    "title": "Multiplayer 1 – Simulating Real-Time with Events",
    "description": "Understand WebSocket and Socket.IO patterns, then simulate a client-side event bus that mimics multi-player messaging — no server required.",
    "difficulty": "intermediate",
    "category": "multiplayer",
    "moduleType": "vanilla",
    "order": 1,
    "estimatedMinutes": 25,
    "tags": [
      "multiplayer",
      "events",
      "simulation",
      "socket-io",
      "event-bus"
    ],
    "content": "# Simulating Real-Time with Events\n\n## How real multiplayer works\nPlayers communicate through a server (Node.js + Socket.IO):\n\n    Player A  -emit('move', data)->  Server  -broadcast->  Player B\n\nIn this editor we cannot run a real server, but we can simulate the same patterns\nclient-side using a message bus — so you understand the model before using real sockets.\n\n## Key concepts: emit and on\n\n    // Real Socket.IO:\n    socket.emit('playerMove', { x: 100, y: 200 });\n    socket.on('playerMove', (data) => updateOtherPlayer(data));\n\n## Client-side message bus (simulation)\n\n    const bus = {\n      listeners: {},\n      on(event, fn) {\n        if (!this.listeners[event]) this.listeners[event] = [];\n        this.listeners[event].push(fn);\n      },\n      emit(event, data) {\n        (this.listeners[event] || []).forEach(fn => fn(data));\n      },\n    };\n\n## Simulating two players\n\n    // Player 1 sends a move\n    bus.emit('playerMove', { playerId: 'p1', x: 150, y: 200 });\n\n    // \"Server\" handler re-broadcasts to all listeners\n    bus.on('playerMove', (data) => {\n      players[data.playerId] = { x: data.x, y: data.y };\n      redrawPlayers();\n    });\n\n## Events to simulate\n\n| Event        | Direction                |\n|--------------|--------------------------|\n| playerJoin   | client → server → all    |\n| playerLeave  | client → server → all    |\n| playerMove   | client → server → others |\n| chatMessage  | client → server → all    |\n| gameReady    | server → all             |\n\n## Real-world best practices\n- Send **inputs** (key presses), not positions — the server computes authoritative state.\n- Always handle disconnect — remove the player and broadcast playerLeave.\n- Never trust client-provided positions in a real game (prevents cheating).\n\n## Your Task\nBuild a simulated 2-player lobby using the message bus.\nTwo buttons (Join as P1, Join as P2) trigger playerJoin.\nA Leave button triggers playerLeave.\nWhen both are joined, broadcast gameReady and show both avatars on a mini canvas.",
    "objectives": [
      "Understand the emit/on event model used by Socket.IO",
      "Build a client-side message bus that mimics socket events",
      "Simulate player join, leave, and move events",
      "Handle a game-ready condition when all players are connected",
      "Update a shared canvas view when the game state changes"
    ]
  },
  {
    "title": "Multiplayer 2 – Turn-Based Game Logic",
    "description": "Build a complete 2-player Noughts and Crosses game: turn management, move validation, win detection, score tracking across rounds, and rematch.",
    "difficulty": "intermediate",
    "category": "multiplayer",
    "moduleType": "vanilla",
    "order": 2,
    "estimatedMinutes": 30,
    "tags": [
      "turn-based",
      "noughts-and-crosses",
      "win-detection",
      "rematch",
      "score-tracking"
    ],
    "content": "# Turn-Based Game Logic\n\n## Core concepts\n\n| Concept         | Responsibility                               |\n|-----------------|----------------------------------------------|\n| Turn lock       | Only the active player can make a move       |\n| Move validation | Is the cell empty? Is it my turn?            |\n| Win detection   | Check all lines after every move             |\n| Draw detection  | Board full, no winner                        |\n| Score tracking  | Persist across multiple rounds               |\n| Rematch         | Reset board, alternate who goes first        |\n\n## State structure\n\n    let game = {\n      board:         Array(9).fill(null),  // null | 'X' | 'O'\n      currentPlayer: 'X',\n      phase:         'playing',            // 'playing' | 'won' | 'draw'\n      winner:        null,\n      scores:        { X: 0, O: 0, draws: 0 },\n      round:         1,\n      firstPlayer:   'X',\n    };\n\n## Making a move\n\n    function makeMove(index) {\n      const { board, currentPlayer, phase } = game;\n      if (phase !== 'playing')  return; // game already over\n      if (board[index] !== null) return; // cell taken\n\n      board[index] = currentPlayer;\n      const winner = detectWinner(board);\n\n      if (winner) {\n        game.phase = 'won';\n        game.winner = winner;\n        game.scores[winner]++;\n      } else if (board.every(c => c !== null)) {\n        game.phase = 'draw';\n        game.scores.draws++;\n      } else {\n        game.currentPlayer = currentPlayer === 'X' ? 'O' : 'X';\n      }\n      render();\n    }\n\n## Win detection\n\n    const WIN_LINES = [\n      [0,1,2],[3,4,5],[6,7,8], // rows\n      [0,3,6],[1,4,7],[2,5,8], // columns\n      [0,4,8],[2,4,6],          // diagonals\n    ];\n\n    function detectWinner(board) {\n      for (const [a,b,c] of WIN_LINES) {\n        if (board[a] && board[a] === board[b] && board[a] === board[c]) {\n          return board[a];\n        }\n      }\n      return null;\n    }\n\n## Rematch (alternate who starts)\n\n    function rematch() {\n      game.firstPlayer   = game.firstPlayer === 'X' ? 'O' : 'X';\n      game.board         = Array(9).fill(null);\n      game.currentPlayer = game.firstPlayer;\n      game.phase         = 'playing';\n      game.winner        = null;\n      game.round++;\n      render();\n    }\n\n## Your Task\nBuild a fully playable Noughts and Crosses game. Render the grid as DOM buttons,\nhighlight the winning line, show whose turn it is, track scores across multiple rounds,\nand alternate who starts on each rematch.",
    "objectives": [
      "Represent board state as an array and render it to DOM buttons",
      "Validate a move: reject if cell taken or game is over",
      "Detect a winner by checking all eight win lines",
      "Detect a draw when the board is full with no winner",
      "Track cumulative scores across multiple rounds",
      "Alternate the starting player on each rematch"
    ]
  }
];

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected');
    await Module.deleteMany({});
    console.log('Cleared existing modules');
    await Module.insertMany(sampleModules);
    console.log(`Inserted ${sampleModules.length} modules`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  });
