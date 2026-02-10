import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import mermaid from "mermaid";
import { tutorAPI, diagramsAPI, achievementsAPI } from "../api/api";
import {
  FaRocket,
  FaLightbulb,
  FaCode,
  FaChevronRight,
  FaChevronLeft,
  FaGamepad,
  FaPuzzlePiece,
  FaBrain,
  FaChartLine,
  FaClipboardList,
  FaEye,
  FaUsers,
  FaTrophy,
  FaCheck,
  FaRegLightbulb,
  FaCog,
  FaStream,
  FaProjectDiagram,
  FaMagic,
  FaSpinner,
  FaStar,
  FaCrown,
  FaAward,
  FaRoute,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import { GameLayout } from "../components/layout/GameLayout";
import MarkdownContent from "../components/ui/MarkdownContent";

// Initialize Mermaid with proper configuration
mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "loose",
  fontFamily: "ui-sans-serif, system-ui, sans-serif",
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: "basis",
  },
  themeVariables: {
    primaryColor: "#667eea",
    primaryTextColor: "#fff",
    primaryBorderColor: "#764ba2",
    lineColor: "#94a3b8",
    secondaryColor: "#1e293b",
    tertiaryColor: "#0f172a",
    background: "#0f172a",
    mainBkg: "#1e293b",
    nodeBorder: "#667eea",
    clusterBkg: "#1e293b",
    clusterBorder: "#475569",
    titleColor: "#f1f5f9",
    edgeLabelBackground: "#1e293b",
  },
});

// Game Mode Options (Single Player vs Multiplayer)
const GAME_MODES = {
  single: {
    id: "single",
    name: "Single Player",
    icon: FaGamepad,
    description: "Create a game for one player",
  },
  multiplayer: {
    id: "multiplayer",
    name: "Multiplayer",
    icon: FaUsers,
    description: "Create a 2-player turn-based game",
  },
};

// Planning Steps (user-friendly, no genre/mechanics picker — full description + mechanics & loop)
const PLANNING_STEPS = [
  { id: 1, title: "Game Concept", icon: <FaLightbulb />, description: "Name and describe your game" },
  { id: 2, title: "Mechanics & Game Loop", icon: <FaPuzzlePiece />, description: "How it plays and loops" },
  { id: 3, title: "Features & Rules", icon: <FaClipboardList />, description: "Core features and win/lose" },
  { id: 4, title: "Game Flow", icon: <FaStream />, description: "Visualize states and flow" },
  { id: 5, title: "Strategy Insights", icon: <FaBrain />, description: "AI suggestions for your plan" },
  { id: 6, title: "Generate Starter Code", icon: <FaCode />, description: "Create code from your plan" },
  { id: 7, title: "Start Coding", icon: <FaRocket />, description: "Open in Game Studio" },
];

const PLANNING_ACHIEVEMENTS = {
  concept: { id: 37, name: "Blueprint Initiated" },
  flow: { id: 38, name: "Flow Architect" },
  insights: { id: 39, name: "Strategy Tactician" },
  launch: { id: 40, name: "Launch Commander" },
};

const GamePlanningBoard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mermaidRef = useRef(null);

  // Planning state (no genre/mechanics picker — user gives full description + mechanics & loop)
  const [currentStep, setCurrentStep] = useState(1);
  const [gameConcept, setGameConcept] = useState({
    name: "",
    description: "",
    gameMode: "single",
  });
  const [mechanicsText, setMechanicsText] = useState("");
  const [gameLoopText, setGameLoopText] = useState("");
  const [coreFeatures, setCoreFeatures] = useState("");
  const [winLoseConditions, setWinLoseConditions] = useState("");
  const [isMultiplayer, setIsMultiplayer] = useState(false);

  // Flowchart state
  const [flowchartCode, setFlowchartCode] = useState("");
  const [flowchartLoading, setFlowchartLoading] = useState(false);

  // AI/strategy state
  const [aiLoading, setAiLoading] = useState(false);
  const [starterCodeProgress, setStarterCodeProgress] = useState(0);
  const [aiRecommendations, setAiRecommendations] = useState(null);
  const [generatedCode, setGeneratedCode] = useState(null);
  const [skipStarterCode, setSkipStarterCode] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [earnedAchievementIds, setEarnedAchievementIds] = useState([]);
  const [planningProgress, setPlanningProgress] = useState({
    planStep1: false,
    planFlow: false,
    planInsights: false,
    planLaunch: false,
  });

  // Load planning board from navigation (e.g. "View plan" from studio) or from saved plan
  useEffect(() => {
    const loaded = location.state?.planningBoard || location.state?.loadedPlan;
    if (loaded && typeof loaded === "object") {
      if (loaded.gameConcept) setGameConcept(loaded.gameConcept);
      if (loaded.mechanicsText != null) setMechanicsText(loaded.mechanicsText || "");
      if (loaded.gameLoopText != null) setGameLoopText(loaded.gameLoopText || "");
      if (loaded.coreFeatures != null) setCoreFeatures(loaded.coreFeatures || "");
      if (loaded.winLoseConditions != null) setWinLoseConditions(loaded.winLoseConditions || "");
      if (loaded.flowchartCode) setFlowchartCode(loaded.flowchartCode);
      if (loaded.aiRecommendations) setAiRecommendations(loaded.aiRecommendations);
      if (loaded.generatedCode) setGeneratedCode(loaded.generatedCode);
      if (loaded.xpEarned != null) setXpEarned(loaded.xpEarned || 0);
      if (typeof loaded.currentStep === "number" && loaded.currentStep >= 1 && loaded.currentStep <= PLANNING_STEPS.length) {
        setCurrentStep(loaded.currentStep);
      }
      if (loaded.gameConcept?.gameMode === "multiplayer") setIsMultiplayer(true);
      toast.info("Planning board loaded. You can edit and continue.", { autoClose: 3000 });
    } else if (location.state?.fromStudio) {
      toast.info("Plan your new game step by step.", { autoClose: 3000 });
    }
  }, [location.state]);

  useEffect(() => {
    const loadAchievements = async () => {
      try {
        const response = await achievementsAPI.getUserAchievements();
        const list = response.data.achievements || [];
        setEarnedAchievementIds(
          list.filter((ach) => ach.earned).map((ach) => ach.id),
        );
      } catch (error) {
        console.error("Error loading planning achievements:", error);
      }
    };

    loadAchievements();
  }, []);

  // Render flowchart when code changes
  const renderFlowchart = useCallback(async () => {
    if (!mermaidRef.current || !flowchartCode) return;

    try {
      // Clear previous content
      mermaidRef.current.innerHTML = "";

      // Generate unique ID for this render
      const id = `mermaid-diagram-${Date.now()}`;

      // Remove any existing diagram with same pattern
      const existingDiagrams = document.querySelectorAll(
        '[id^="mermaid-diagram-"]',
      );
      existingDiagrams.forEach((el) => {
        if (el.id !== id) el.remove();
      });

      // Render the diagram
      const { svg } = await mermaid.render(id, flowchartCode);

      // Apply custom styling to SVG
      const styledSvg = svg.replace(
        "<svg",
        '<svg style="max-width: 100%; height: auto; background: transparent;"',
      );

      mermaidRef.current.innerHTML = styledSvg;

      // Add zoom/pan capabilities via CSS
      const svgEl = mermaidRef.current.querySelector("svg");
      if (svgEl) {
        svgEl.style.cursor = "grab";
      }
    } catch (err) {
      console.error("Mermaid render error:", err);
      // Show fallback message with code preview
      if (mermaidRef.current) {
        mermaidRef.current.innerHTML = `
          <div style="color: #ff6b9d; padding: 20px; text-align: center;">
            <p style="font-weight: bold; margin-bottom: 10px;">Unable to render diagram</p>
            <p style="font-size: 12px; color: #94a3b8;">The diagram syntax may need adjustment</p>
            <details style="margin-top: 15px; text-align: left;">
              <summary style="cursor: pointer; color: #667eea;">View raw code</summary>
              <pre style="margin-top: 10px; padding: 10px; background: #1e293b; border-radius: 8px; font-size: 11px; overflow: auto; max-height: 200px;">${flowchartCode}</pre>
            </details>
          </div>
        `;
      }
    }
  }, [flowchartCode]);

  useEffect(() => {
    if (flowchartCode && mermaidRef.current) {
      renderFlowchart();
    }
  }, [flowchartCode, renderFlowchart]);

  // Award XP for completing steps
  const awardXP = (amount, reason) => {
    setXpEarned((prev) => prev + amount);
    toast.success(`+${amount} XP: ${reason}`, { autoClose: 2000 });
  };

  // Server-side planning achievement check
  useEffect(() => {
    achievementsAPI
      .checkAchievements(planningProgress)
      .then((res) => {
        const { newlyEarned = [] } = res.data;
        if (newlyEarned.length > 0) {
          const newIds = newlyEarned.map((a) => a.id);
          setEarnedAchievementIds((prev) => {
            const combined = [...prev];
            newIds.forEach((id) => {
              if (!combined.includes(id)) combined.push(id);
            });
            return combined;
          });
          newlyEarned.forEach((ach) => {
            toast.success(`Achievement unlocked: ${ach.name}`, {
              autoClose: 3000,
            });
            awardXP(ach.points || 50, "Achievement Unlocked");
          });
        }
      })
      .catch((err) => console.error("Failed to check achievements:", err));
  }, [planningProgress]);

  // Generate flowchart using AI (uses full description + mechanics + game loop)
  const generateFlowchart = async () => {
    if (!gameConcept.name || !gameConcept.description) {
      toast.error("Add a game name and description first.");
      return;
    }

    setFlowchartLoading(true);

    if (gameConcept.gameMode === "multiplayer" || isMultiplayer) {
      // Generate multiplayer-specific flowchart
      const multiplayerFlowchart = `stateDiagram-v2
    [*] --> WaitingForPlayers
    WaitingForPlayers --> GameStart: Both Players Ready
    
    state GameStart {
        [*] --> InitializeState
        InitializeState --> Player1Turn
    }
    
    state TurnLoop {
        Player1Turn --> ValidateMove1: Player 1 Action
        ValidateMove1 --> UpdateState1: Valid
        ValidateMove1 --> Player1Turn: Invalid
        UpdateState1 --> CheckWin1
        CheckWin1 --> Player1Wins: Win Detected
        CheckWin1 --> CheckDraw1: No Win
        CheckDraw1 --> Draw: Board Full
        CheckDraw1 --> Player2Turn: Continue
        
        Player2Turn --> ValidateMove2: Player 2 Action
        ValidateMove2 --> UpdateState2: Valid
        ValidateMove2 --> Player2Turn: Invalid
        UpdateState2 --> CheckWin2
        CheckWin2 --> Player2Wins: Win Detected
        CheckWin2 --> CheckDraw2: No Win
        CheckDraw2 --> Draw: Board Full
        CheckDraw2 --> Player1Turn: Continue
    }
    
    GameStart --> TurnLoop
    
    Player1Wins --> GameEnd: emit win/loss
    Player2Wins --> GameEnd: emit win/loss
    Draw --> GameEnd: emit draw
    
    GameEnd --> [*]: matchCompleted`;

      setFlowchartCode(multiplayerFlowchart);
      awardXP(35, "Generated Multiplayer Flow");
      setPlanningProgress((prev) => ({ ...prev, planFlow: true }));
      setFlowchartLoading(false);
      return;
    }

    try {
      const description = `Game flow diagram for "${gameConcept.name}".
        Description: ${gameConcept.description}
        Mechanics: ${mechanicsText || "General gameplay"}
        Game loop: ${gameLoopText || "Start → Play → End"}
        Show the main game states: Menu, Playing, Paused, Game Over, Victory.
        Include transitions and player actions.`;

      const response = await diagramsAPI.generate(
        description,
        "stateDiagram-v2",
      );
      setFlowchartCode(response.data.mermaidCode);
      awardXP(30, "Generated Game Flow");
      setPlanningProgress((prev) => ({ ...prev, planFlow: true }));
    } catch {
      toast.error("We couldn't generate the flowchart. Try again.");
      // Fallback flowchart
      setFlowchartCode(`stateDiagram-v2
    [*] --> Menu
    Menu --> Playing: Start Game
    Playing --> Paused: Pause
    Paused --> Playing: Resume
    Paused --> Menu: Quit
    Playing --> GameOver: Lose
    Playing --> Victory: Win
    GameOver --> Menu: Restart
    Victory --> Menu: Play Again
    GameOver --> [*]
    Victory --> [*]`);
    } finally {
      setFlowchartLoading(false);
    }
  };

  // Get AI recommendations for the game (uses full plan)
  const getAIRecommendations = async () => {
    if (!gameConcept.name || !gameConcept.description) {
      toast.error("Add a game name and description first.");
      return;
    }

    setAiLoading(true);

    if (gameConcept.gameMode === "multiplayer" || isMultiplayer) {
      const multiplayerRecommendations = `# Multiplayer Game Design Recommendations

## Game: ${gameConcept.name}

### 1. Game State Model
Your game needs a **shared state** model where both players see the same data:
\`\`\`javascript
const INITIAL_STATE = {
  board: [],           // Your game board/data
  currentPlayer: 'player1',
  winner: null,
  isDraw: false,
  moveCount: 0,
  scores: { player1: 0, player2: 0 }
};
\`\`\`

### 2. Turn-Based Logic (Critical)
- **Only the current player can make moves**
- Invalid actions must be silently ignored
- State changes ONLY after move validation passes
- Turn switches explicitly after successful move

### 3. Key Implementation Steps
1. Set up initial game state with \`useState\`
2. Implement move validation function
3. Create state transition function (apply moves)
4. Build win/draw detection logic
5. Handle achievement events (win/loss/draw/matchCompleted)

### 4. Technical Recommendations
- Use \`useCallback\` for game logic functions
- Keep state **immutable** (always create new arrays/objects)
- Store game state in a single object for easy sync
- Implement optimistic updates for responsiveness

### 5. Achievement Events to Emit
| Event | When to Trigger |
|-------|-----------------|
| \`win\` | Current player matches win condition |
| \`loss\` | Opponent wins |
| \`draw\` | Board full with no winner |
| \`matchCompleted\` | Game ends (any outcome) |

### 6. Common Pitfalls to Avoid
- Do not mutate state directly
- Do not allow moves when it is not your turn
- Do not forget to check for draws
- Do not calculate XP client-side (only emit events)

### 7. File Structure
\`\`\`
src/
├── App.jsx          # Main game component
├── App.css          # Game styling
├── gameLogic.js     # Pure game functions (optional)
└── constants.js     # Win conditions, initial state
\`\`\`

Ready to code! Click "Generate Starter Code" for a working implementation.`;

      setAiRecommendations(multiplayerRecommendations);
      awardXP(45, "Strategy Insights");
      setPlanningProgress((prev) => ({ ...prev, planInsights: true }));
      setAiLoading(false);
      return;
    }

    try {
      const prompt = `I'm creating a game called "${gameConcept.name}".

Description: ${gameConcept.description || "A fun game"}
Game Mode: ${gameConcept.gameMode === "multiplayer" ? "Multiplayer (2 players)" : "Single Player"}
Mechanics: ${mechanicsText || "General gameplay"}
Game loop: ${gameLoopText || "Start → Play → End"}
Core features: ${coreFeatures || "Standard game states"}
Win/Lose: ${winLoseConditions || "Standard win/lose"}

Please provide:
1. A brief game concept summary (2-3 sentences)
2. Core game loop explanation
3. 5 key features to implement
4. Technical recommendations (React hooks, state management approach)
5. Potential challenges and solutions
6. Suggested file structure

Format your response clearly with headers.`;

      const response = await tutorAPI.ask(prompt, { type: "game-planning" });

      setAiRecommendations(response.data.answer);
      awardXP(40, "Strategy Insights");
      setPlanningProgress((prev) => ({ ...prev, planInsights: true }));
    } catch {
      toast.error("AI isn't available right now. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  // Generate multiplayer game starter code (no templates)
  const generateMultiplayerStarterCode = useCallback(() => {
    const gameName = gameConcept.name || "My Multiplayer Game";

    return `// ==========================================
// ${gameName} - Multiplayer Game Template
// ==========================================
// 
// MULTIPLAYER GAME DESIGN CONCEPTS:
// ---------------------------------
// 1. DETERMINISTIC: Same action always produces same result
// 2. SHARED STATE: Both players see identical game state
// 3. TURN-BASED: Only current player can make moves
// 4. VALIDATION: All moves are checked before applying
//
// The game runs in a sandboxed environment with 2 live previews:
// - Player 1 preview (left)
// - Player 2 preview (right)
// Each player has their own client logs visible in the console tabs.

import { useState, useCallback } from 'react';
// ===================
// GAME STATE MODEL
// ===================
// This is the SINGLE SOURCE OF TRUTH for the game.
// Customize this for your specific game!
const INITIAL_STATE = {
  // Example: A simple grid-based game
  board: Array(9).fill(null),  // 3x3 grid as flat array
  currentPlayer: 'player1',    // 'player1' or 'player2'
  winner: null,                // 'player1', 'player2', or null
  isDraw: false,               // true if game is a draw
  moveCount: 0,                // tracks number of moves
  scores: { player1: 0, player2: 0 },
};

function App() {
  // Game state - synced between both players
  const [gameState, setGameState] = useState(INITIAL_STATE);
  
  // Which player is viewing this instance
  // In actual multiplayer, this would be set by the server
  const [myRole] = useState('player1'); // or 'player2'
  
  // ===================
  // MOVE VALIDATION
  // ===================
  // CRITICAL: Validate BEFORE changing state
  const isValidMove = useCallback((index, state) => {
    // Rule 1: Cell must be empty
    if (state.board[index] !== null) {
      console.log('Invalid: Cell already occupied');
      return false;
    }
    
    // Rule 2: Game must still be in progress
    if (state.winner || state.isDraw) {
      console.log('Invalid: Game already ended');
      return false;
    }
    
    // Rule 3: Must be current player's turn
    if (state.currentPlayer !== myRole) {
      console.log('Invalid: Not your turn!');
      return false;
    }
    
    return true;
  }, [myRole]);

  // ===================
  // CHECK WIN CONDITION
  // ===================
  // Customize this for your game's win conditions!
  const checkWinner = useCallback((board) => {
    // Example: Check for 3 in a row (customize as needed)
    const WIN_LINES = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6],             // Diagonals
    ];
    
    for (const [a, b, c] of WIN_LINES) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return null;
  }, []);

  // ===================
  // APPLY MOVE (State Transition)
  // ===================
  const applyMove = useCallback((index, currentState) => {
    // Create new board (immutable update!)
    const newBoard = [...currentState.board];
    newBoard[index] = currentState.currentPlayer;
    
    // Check for winner
    const winner = checkWinner(newBoard);
    
    // Check for draw
    const moveCount = currentState.moveCount + 1;
    const isDraw = !winner && moveCount === 9;
    
    // Return NEW state (never mutate!)
    return {
      ...currentState,
      board: newBoard,
      currentPlayer: currentState.currentPlayer === 'player1' ? 'player2' : 'player1',
      winner,
      isDraw,
      moveCount,
    };
  }, [checkWinner]);

  // ===================
  // PLAYER ACTION
  // ===================
  const handleCellClick = useCallback((index) => {
    // Step 1: Validate the move
    if (!isValidMove(index, gameState)) {
      return; // Invalid moves are silently ignored
    }
    
    // Step 2: Calculate new state
    const newState = applyMove(index, gameState);
    
    // Step 3: Update local state
    setGameState(newState);
    
    // Step 4: Emit achievement events based on result
    if (newState.winner === myRole) {
      console.log('ACHIEVEMENT EVENT: win');
      // emit('win')
    } else if (newState.winner && newState.winner !== myRole) {
      console.log('ACHIEVEMENT EVENT: loss');
      // emit('loss')
    } else if (newState.isDraw) {
      console.log('ACHIEVEMENT EVENT: draw');
      // emit('draw')
    }
    
    if (newState.winner || newState.isDraw) {
      console.log('ACHIEVEMENT EVENT: matchCompleted');
      // emit('matchCompleted')
    }
  }, [gameState, isValidMove, applyMove, myRole]);

  // ===================
  // RESET GAME
  // ===================
  const resetGame = () => {
    setGameState(INITIAL_STATE);
    console.log('Game reset');
  };

  // ===================
  // RENDER
  // ===================
  const isMyTurn = gameState.currentPlayer === myRole;
  
  const getStatusMessage = () => {
    if (gameState.winner) {
      return gameState.winner === myRole ? 'You Win' : 'You Lose';
    }
    if (gameState.isDraw) return 'Draw';
    return isMyTurn ? 'Your Turn' : 'Waiting for opponent...';
  };

  return (
    <div className="game-container">
      <h1>${gameName}</h1>
      
      <div className="game-info">
        <div className="player-role">
          You are: <span className={\`role \${myRole}\`}>{myRole}</span>
        </div>
        <div className="status">{getStatusMessage()}</div>
      </div>
      
      <div className="board">
        {gameState.board.map((cell, i) => (
          <button
            key={i}
            className={\`cell \${cell || ''} \${!cell && isMyTurn && !gameState.winner ? 'clickable' : ''}\`}
            onClick={() => handleCellClick(i)}
            disabled={!!cell || !!gameState.winner || gameState.isDraw || !isMyTurn}
          >
            {cell && <span className={\`symbol \${cell}\`}>{cell === 'player1' ? 'X' : 'O'}</span>}
          </button>
        ))}
      </div>
      
      {(gameState.winner || gameState.isDraw) && (
        <button className="reset-btn" onClick={resetGame}>
          Play Again
        </button>
      )}
      
      <div className="debug-panel">
        <h4>Game State:</h4>
        <pre>{JSON.stringify(gameState, null, 2)}</pre>
      </div>
    </div>
  );
}

export default App;

/* ============= App.css ============= */

/*
.game-container {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', sans-serif;
  text-align: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  min-height: 100vh;
  color: white;
}

.board {
  display: grid;
  grid-template-columns: repeat(3, 100px);
  gap: 5px;
  justify-content: center;
  margin: 20px auto;
}

.cell {
  width: 100px;
  height: 100px;
  background: rgba(255,255,255,0.1);
  border: 2px solid rgba(255,255,255,0.2);
  border-radius: 10px;
  font-size: 2rem;
  cursor: pointer;
  transition: all 0.2s;
}

.cell.clickable:hover {
  background: rgba(102, 126, 234, 0.3);
  transform: scale(1.05);
}

.symbol.player1 { color: #ff6b6b; }
.symbol.player2 { color: #4ecdc4; }

.reset-btn {
  padding: 15px 30px;
  font-size: 1.2rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  margin-top: 20px;
}
*/`;
  }, [gameConcept.name]);

  // Parse AI response: PACKAGES line + multiple code blocks (App.jsx, App.css, utils, etc.)
  const parseGeneratedCode = (raw) => {
    if (!raw || typeof raw !== "string") return null;
    const packagesMatch = raw.match(/PACKAGES:\s*([^\n]+)/i);
    const packages = packagesMatch
      ? packagesMatch[1].split(",").map((p) => p.trim()).filter(Boolean)
      : ["react", "react-dom"];
    const files = {};
    const blockRegex = /(?:^|\n)(?:(\S+(?:\/\S+)?\.(?:jsx?|css|js))\s*)?```(?:jsx?|javascript|css)?\s*([\s\S]*?)```/gi;
    let m;
    while ((m = blockRegex.exec(raw)) !== null) {
      const path = (m[1] || "").trim();
      const code = (m[2] || "").trim();
      if (!code) continue;
      if (path) {
        const norm = path.startsWith("src/") ? path : path === "App.css" ? "src/App.css" : path === "App.jsx" ? "src/App.jsx" : `src/${path}`;
        files[norm] = code;
      } else {
        if (raw.indexOf("```css") !== -1 && !files["src/App.css"] && /\.css|style/i.test(m[0])) files["src/App.css"] = code;
        else if (!files["src/App.jsx"]) files["src/App.jsx"] = code;
        else if (!files["src/App.css"]) files["src/App.css"] = code;
      }
    }
    if (Object.keys(files).length > 0) return { files, packages, raw };
    const jsxMatch = raw.match(/```(?:jsx?|javascript)\s*([\s\S]*?)```/i) || raw.match(/```\s*([\s\S]*?)```/);
    const cssMatch = raw.match(/```css\s*([\s\S]*?)```/i);
    const jsx = jsxMatch ? jsxMatch[1].trim() : "";
    const css = cssMatch ? cssMatch[1].trim() : "";
    if (jsx || css) return { jsx, css, files: jsx ? { "src/App.jsx": jsx, "src/App.css": css || "" } : {}, packages, raw };
    return { jsx: raw, css: "", files: {}, packages, raw };
  };

  // Generate starter code using qwen3-coder:480b and planning data; progress bar while waiting
  const generateStarterCode = async () => {
    if (!gameConcept.name || !gameConcept.description) {
      toast.error("Add a game name and description first.");
      return;
    }

    setAiLoading(true);
    setStarterCodeProgress(0);
    setSkipStarterCode(false);

    // Simulate progress (API has no streaming); advance every 400ms toward 90%, then 100% on done
    const progressInterval = setInterval(() => {
      setStarterCodeProgress((p) => {
        if (p >= 90) return p;
        return p + Math.random() * 8 + 4;
      });
    }, 400);

    if (gameConcept.gameMode === "multiplayer" || isMultiplayer) {
      const multiplayerCode = generateMultiplayerStarterCode();
      setGeneratedCode(multiplayerCode);
      awardXP(60, "Starter Code Generated");
      clearInterval(progressInterval);
      setStarterCodeProgress(100);
      setAiLoading(false);
      setTimeout(() => setStarterCodeProgress(0), 800);
      return;
    }

    try {
      const planning = {
        name: gameConcept.name,
        description: gameConcept.description,
        mechanics: mechanicsText || "Score, basic controls, keyboard input",
        gameLoop: gameLoopText || "Start → Play → Win/Lose → Restart",
        coreFeatures: coreFeatures || "Menu, playing state, score display",
        winLoseConditions: winLoseConditions || "Lose when condition met; win by reaching goal",
        gameMode: gameConcept.gameMode,
        flowchart: flowchartCode,
      };
      const response = await tutorAPI.generateStarterCode(planning);
      const answer = response.data?.answer || "";
      setGeneratedCode(answer);
      awardXP(50, "Starter Code Generated");
      clearInterval(progressInterval);
      setStarterCodeProgress(100);
      setTimeout(() => setStarterCodeProgress(0), 800);
    } catch {
      toast.error("We couldn't generate code. Please try again.");
      clearInterval(progressInterval);
      setStarterCodeProgress(0);
    } finally {
      setAiLoading(false);
    }
  };

  // Full planning board state for saving in project and loading later
  const getPlanningBoardState = () => ({
    gameConcept: { ...gameConcept },
    mechanicsText,
    gameLoopText,
    coreFeatures,
    winLoseConditions,
    flowchartCode,
    aiRecommendations,
    generatedCode,
    xpEarned,
    currentStep,
    planningProgress: { ...planningProgress },
    isMultiplayer: gameConcept.gameMode === "multiplayer" || isMultiplayer,
    gameMode: gameConcept.gameMode,
    createdAt: new Date().toISOString(),
  });

  // Navigate to CustomGameStudio; with or without starter code (skip = fresh project)
  const startCoding = (skipCode = false) => {
    const planningBoard = getPlanningBoardState();
    const parsedCode = skipCode ? null : parseGeneratedCode(generatedCode);

    const gameData = {
      name: gameConcept.name || "My New Game",
      description: gameConcept.description,
      mechanicsText,
      gameLoopText,
      coreFeatures,
      winLoseConditions,
      flowchart: flowchartCode,
      recommendations: aiRecommendations,
      generatedCode: skipCode ? undefined : generatedCode,
      generatedCodeParsed: parsedCode || undefined,
      fromPlanning: true,
      skipStarterCode: skipCode,
      xpEarned,
      isMultiplayer: gameConcept.gameMode === "multiplayer" || isMultiplayer,
      gameMode: gameConcept.gameMode,
      createdAt: new Date().toISOString(),
      planningBoard,
    };

    sessionStorage.setItem("gamePlanData", JSON.stringify(gameData));

    const savedGames = JSON.parse(
      localStorage.getItem("savedGamePlans") || "[]",
    );
    const existingIndex = savedGames.findIndex((g) => g.name === gameData.name);
    if (existingIndex >= 0) {
      savedGames[existingIndex] = gameData;
    } else {
      savedGames.push(gameData);
    }
    localStorage.setItem("savedGamePlans", JSON.stringify(savedGames));

    setPlanningProgress((prev) => ({ ...prev, planLaunch: true }));

    const isMultiplayerGame =
      gameConcept.gameMode === "multiplayer" || isMultiplayer;
    const targetPath = isMultiplayerGame
      ? "/multiplayer-studio"
      : "/custom-game";

    navigate(targetPath, {
      state: { fromPlanning: true, gameData },
    });
  };

  // Step navigation (7 steps)
  const nextStep = () => {
    const maxStep = PLANNING_STEPS.length;
    if (currentStep >= maxStep) return;

    if (currentStep === 1 && (!gameConcept.name || !gameConcept.description?.trim())) {
      toast.warning("Enter a game name and description.");
      return;
    }
    if (currentStep === 2 && (!mechanicsText?.trim() || !gameLoopText?.trim())) {
      toast.warning("Describe mechanics and game loop.");
      return;
    }

    setCurrentStep((prev) => prev + 1);
    awardXP(10, `Completed Step ${currentStep}`);

    if (currentStep === 1) setPlanningProgress((prev) => ({ ...prev, planStep1: true }));
    if (currentStep === 3) generateFlowchart();
    if (currentStep === 4) getAIRecommendations();
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-violet-200">
                <FaLightbulb />
                Concept
              </div>
              <h2 className="mt-4 text-2xl font-semibold">
                Define Your Game Concept
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Every great game starts with a clear mission.
              </p>
            </div>

            <label className="block text-sm font-medium text-slate-300">
              Game name
              <div className="mt-2 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                <input
                  type="text"
                  value={gameConcept.name}
                  onChange={(e) =>
                    setGameConcept({ ...gameConcept, name: e.target.value })
                  }
                  placeholder="Enter your game name"
                  className="w-full bg-transparent text-sm text-slate-100 outline-none"
                />
              </div>
            </label>

            <label className="block text-sm font-medium text-slate-300">
              Description
              <div className="mt-2 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                <textarea
                  value={gameConcept.description}
                  onChange={(e) =>
                    setGameConcept({
                      ...gameConcept,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe your game in a few sentences"
                  className="h-28 w-full resize-none bg-transparent text-sm text-slate-100 outline-none"
                />
              </div>
            </label>

            <div>
              <p className="text-sm font-semibold text-slate-300">Game mode</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {Object.values(GAME_MODES).map((mode) => {
                  const ModeIcon = mode.icon;
                  const isSelected = gameConcept.gameMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        setGameConcept({ ...gameConcept, gameMode: mode.id });
                        setIsMultiplayer(mode.id === "multiplayer");
                      }}
                      className={`flex items-center gap-3 rounded-2xl border px-4 py-4 text-left text-sm transition ${
                        isSelected
                          ? "border-cyan-400/60 bg-cyan-500/10 text-cyan-100"
                          : "border-white/10 bg-white/5 text-slate-300"
                      }`}
                    >
                      <span className="rounded-xl bg-white/10 p-2 text-lg text-white">
                        <ModeIcon />
                      </span>
                      <div>
                        <p className="font-semibold">{mode.name}</p>
                        <p className="text-xs text-slate-400">
                          {mode.description}
                        </p>
                      </div>
                      {isSelected && (
                        <FaCheck className="ml-auto text-emerald-300" />
                      )}
                    </button>
                  );
                })}
              </div>
              {gameConcept.gameMode === "multiplayer" && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-xs text-slate-400">
                  Multiplayer mode includes two live previews, server logs, and
                  client logs for validation.
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <p className="flex items-center gap-2 font-semibold text-cyan-200">
                <FaRegLightbulb />
                Tips
              </p>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-xs text-slate-400">
                <li>Keep your concept focused with one primary loop.</li>
                <li>Define what makes the player feel progression.</li>
                <li>
                  Multiplayer games should emphasize turn clarity and
                  validation.
                </li>
              </ul>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-violet-200">
                <FaPuzzlePiece />
                Mechanics & Game Loop
              </div>
              <h2 className="mt-4 text-2xl font-semibold">
                How does your game play?
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Describe the main mechanics and the game loop in your own words. No presets — you define everything.
              </p>
            </div>

            <label className="block text-sm font-medium text-slate-300">
              Mechanics
              <span className="ml-1 text-slate-500">(e.g. scoring, lives, power-ups, controls)</span>
              <div className="mt-2 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                <textarea
                  value={mechanicsText}
                  onChange={(e) => setMechanicsText(e.target.value)}
                  placeholder="Describe the main mechanics: how the player scores, what they control, what items or abilities exist, etc."
                  className="h-24 w-full resize-none bg-transparent text-sm text-slate-100 outline-none"
                />
              </div>
            </label>

            <label className="block text-sm font-medium text-slate-300">
              Game loop
              <span className="ml-1 text-slate-500">(e.g. start → play → win/lose → restart)</span>
              <div className="mt-2 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                <textarea
                  value={gameLoopText}
                  onChange={(e) => setGameLoopText(e.target.value)}
                  placeholder="Describe the loop: how does a round start? What happens during play? How does the player win or lose? What happens after (restart, menu)?"
                  className="h-24 w-full resize-none bg-transparent text-sm text-slate-100 outline-none"
                />
              </div>
            </label>

            {(gameConcept.gameMode === "multiplayer" || isMultiplayer) && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-cyan-200">
                  <FaUsers />
                  Multiplayer
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Turn-based, shared state, dual previews. Describe turn rules and win/draw in Mechanics and Game loop above.
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <p className="flex items-center gap-2 font-semibold text-cyan-200">
                <FaRegLightbulb />
                Tips
              </p>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-xs text-slate-400">
                <li>Mechanics = what the player can do and what the game tracks (score, health, items).</li>
                <li>Game loop = the cycle from start to end of a round or session.</li>
              </ul>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-violet-200">
                <FaClipboardList />
                Features & Rules
              </div>
              <h2 className="mt-4 text-2xl font-semibold">
                Core features and win/lose
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                List the main features and how the player wins or loses. This helps the AI generate better starter code.
              </p>
            </div>

            <label className="block text-sm font-medium text-slate-300">
              Core features
              <span className="ml-1 text-slate-500">(e.g. menu, pause, score display, levels)</span>
              <div className="mt-2 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                <textarea
                  value={coreFeatures}
                  onChange={(e) => setCoreFeatures(e.target.value)}
                  placeholder="What must the game have? Menu, pause, score, levels, power-ups, etc."
                  className="h-20 w-full resize-none bg-transparent text-sm text-slate-100 outline-none"
                />
              </div>
            </label>

            <label className="block text-sm font-medium text-slate-300">
              Win / lose conditions
              <span className="ml-1 text-slate-500">(when does the player win or lose?)</span>
              <div className="mt-2 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                <textarea
                  value={winLoseConditions}
                  onChange={(e) => setWinLoseConditions(e.target.value)}
                  placeholder="e.g. Lose when lives reach 0; win by reaching the goal or beating the boss."
                  className="h-20 w-full resize-none bg-transparent text-sm text-slate-100 outline-none"
                />
              </div>
            </label>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-violet-200">
                <FaStream />
                Flow
              </div>
              <h2 className="mt-4 text-2xl font-semibold">Game Flow Design</h2>
              <p className="mt-2 text-sm text-slate-400">
                Visualize the core state transitions.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <FaProjectDiagram className="text-cyan-200" />
                  Game state diagram
                </div>
                <button
                  onClick={generateFlowchart}
                  disabled={flowchartLoading}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/60 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-white/30 disabled:opacity-50"
                >
                  {flowchartLoading ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <FaMagic />
                  )}
                  Regenerate
                </button>
              </div>

              <div className="min-h-[280px] px-6 py-8">
                {flowchartLoading ? (
                  <div className="flex flex-col items-center justify-center gap-3 text-sm text-slate-400">
                    <FaSpinner className="animate-spin" />
                    Generating your game flow...
                  </div>
                ) : flowchartCode ? (
                  <div
                    className="flex items-center justify-center"
                    ref={mermaidRef}
                  ></div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 text-sm text-slate-500">
                    <FaProjectDiagram className="text-2xl" />
                    Your game flow diagram will appear here.
                  </div>
                )}
              </div>

              {flowchartCode && (
                <div className="border-t border-white/10 px-5 py-4">
                  <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Mermaid code
                  </h4>
                  <pre className="mt-3 max-h-48 overflow-auto rounded-xl bg-slate-950/70 p-3 text-xs text-slate-300">
                    {flowchartCode}
                  </pre>
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  label: "Menu",
                  description: "Where players start and access options.",
                },
                {
                  label: "Playing",
                  description: "Main gameplay loop and state.",
                },
                {
                  label: "Paused",
                  description: "Temporary halt with overlays.",
                },
                { label: "Game Over", description: "When the player loses." },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <p className="text-sm font-semibold text-white">
                    {item.label}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-violet-200">
                <FaBrain />
                Strategy
              </div>
              <h2 className="mt-4 text-2xl font-semibold">Strategy Insights</h2>
              <p className="mt-2 text-sm text-slate-400">
                Get tailored suggestions for your concept based on your plan.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              {aiLoading && !aiRecommendations ? (
                <div className="flex flex-col items-center justify-center gap-3 text-sm text-slate-400">
                  <FaSpinner className="animate-spin" />
                  Generating strategy insights...
                </div>
              ) : aiRecommendations ? (
                <div className="max-h-72 overflow-auto text-sm text-slate-200">
                  <MarkdownContent content={aiRecommendations} />
                </div>
              ) : (
                <div className="flex flex-col items-start gap-3 text-sm text-slate-400">
                  <p>
                    Generate insights to help balance your systems and mechanics.
                  </p>
                  <button
                    onClick={getAIRecommendations}
                    className="inline-flex items-center gap-2 rounded-full bg-cyan-500/90 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                  >
                    <FaMagic />
                    Generate insights
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-violet-200">
                <FaCode />
                Generate Starter Code
              </div>
              <h2 className="mt-4 text-2xl font-semibold">Create code from your plan</h2>
              <p className="mt-2 text-sm text-slate-400">
                AI (qwen3-coder) will generate React starter code using your game description, mechanics, game loop, and rules.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={generateStarterCode}
                  disabled={aiLoading}
                  className="inline-flex items-center gap-2 rounded-full bg-violet-500/90 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-violet-400 disabled:opacity-60"
                >
                  {aiLoading ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <FaCode />
                  )}
                  Generate starter code
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSkipStarterCode(true);
                    setGeneratedCode(null);
                    toast.info("Starting with a fresh project. Go to the next step to launch.");
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/10"
                >
                  Skip and start fresh
                </button>
              </div>

              {aiLoading && (
                <div className="space-y-2">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-violet-500 transition-all duration-300"
                      style={{ width: `${Math.min(100, starterCodeProgress)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400">
                    Generating starter code… {Math.round(starterCodeProgress)}%
                  </p>
                </div>
              )}

              {(generatedCode || skipStarterCode) && (
                <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  {skipStarterCode
                    ? "Starting fresh. Go to the next step to launch in the studio."
                    : "Starter code generated. Go to the next step to launch in the studio."}
                </div>
              )}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-violet-200">
                <FaRocket />
                Launch
              </div>
              <h2 className="mt-4 text-2xl font-semibold">Ready to launch</h2>
              <p className="mt-2 text-sm text-slate-400">
                Review your plan before entering the studio.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <FaGamepad className="text-cyan-200" />
                  Game overview
                </div>
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Name
                    </p>
                    <p className="font-semibold text-white">
                      {gameConcept.name || "Untitled game"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Description
                    </p>
                    <p className="font-semibold text-white line-clamp-2">
                      {gameConcept.description || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Mode
                    </p>
                    <p className="font-semibold text-white">
                      {gameConcept.gameMode === "multiplayer"
                        ? "Multiplayer"
                        : "Single Player"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <FaCog className="text-cyan-200" />
                  Mechanics & loop
                </div>
                <div className="mt-4 space-y-2 text-xs text-slate-300">
                  <p><span className="text-slate-500">Mechanics:</span> {mechanicsText || "—"}</p>
                  <p><span className="text-slate-500">Game loop:</span> {gameLoopText || "—"}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <FaStar className="text-amber-300" />
                  XP earned
                </div>
                <div className="mt-4 text-3xl font-semibold text-white">
                  {xpEarned}
                </div>
                <p className="mt-1 text-xs text-slate-500">Experience points</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {earnedAchievementIds.map((a) => (
                    <span
                      key={a}
                      className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-200"
                    >
                      <FaTrophy className="inline-block" />
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => startCoding(skipStarterCode)}
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-violet-500/90 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-violet-400"
              >
                <FaRocket />
                Start coding in studio
              </button>
              {skipStarterCode && (
                <p className="text-xs text-slate-400">
                  Starting with a fresh project (no generated code).
                </p>
              )}
              {!skipStarterCode && generatedCode && (
                <p className="text-xs text-slate-500">
                  Your plan and generated code will load automatically.
                </p>
              )}
              {!skipStarterCode && !generatedCode && (
                <p className="text-xs text-slate-500">
                  Generate starter code above, or go back and choose “Skip and start fresh”.
                </p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <GameLayout>
      <ToastContainer position="bottom-right" theme="dark" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-gray-200">
        <div className="border-b border-gray-800 pb-6 mb-6">
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div>
              <div className="inline-flex items-center gap-2 border border-gray-600 bg-gray-800 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gray-400 rounded">
                <FaRoute />
                Game blueprint
              </div>
              <h1 className="mt-4 text-2xl font-bold text-gray-100">
                Game Planning Board
              </h1>
              <p className="mt-2 text-sm text-gray-400">
                Build your game blueprint with structured steps, milestones, and
                flow diagrams.
              </p>
            </div>

            <div className="border border-gray-700 bg-gray-900/50 p-5 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="border border-gray-600 bg-gray-800 p-3 text-gray-400 rounded">
                  <FaCrown />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Planning progress</p>
                  <p className="text-xl font-semibold text-gray-100">
                    Step {currentStep} of {PLANNING_STEPS.length}
                  </p>
                </div>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden bg-gray-700 rounded">
                <div
                  className="h-full bg-gray-500 rounded"
                  style={{
                    width: `${(currentStep / PLANNING_STEPS.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.35fr_0.65fr]">
        <div className="border border-gray-700 bg-gray-900/50 p-6 rounded-lg">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <FaRoute />
            Steps
          </div>
          <div className="mt-6 space-y-3">
            {PLANNING_STEPS.map((step) => (
              <button
                key={step.id}
                onClick={() =>
                  step.id <= currentStep && setCurrentStep(step.id)
                }
                className={`flex w-full items-center gap-3 border px-4 py-3 text-left text-sm font-semibold rounded-lg ${
                  currentStep === step.id
                    ? "border-gray-600 bg-gray-800 text-gray-100"
                    : currentStep > step.id
                      ? "border-gray-600 bg-gray-800/50 text-gray-300"
                      : "border-gray-700 bg-gray-900/30 text-gray-500"
                }`}
              >
                <div className="border border-gray-600 bg-gray-800 p-2 text-gray-400 rounded">
                  {currentStep > step.id ? <FaCheck /> : step.icon}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500">
                    Step {step.id}
                  </p>
                  <p>{step.title}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 border border-gray-700 bg-gray-800 p-4 text-xs text-gray-400 rounded-lg">
            Complete each step to unlock the next planning milestone.
          </div>
        </div>

        <div className="border border-gray-700 bg-gray-900/50 p-6 rounded-lg">
          <div key={currentStep} className="min-h-[520px]">
            {renderStepContent()}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={prevStep}
              type="button"
              disabled={currentStep === 1}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold disabled:opacity-40"
            >
              <FaChevronLeft />
              Previous
            </button>
            <div className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Step {currentStep} of {PLANNING_STEPS.length}
            </div>
            {currentStep < PLANNING_STEPS.length ? (
              <button
                onClick={nextStep}
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-cyan-500/90 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                Next
                <FaChevronRight />
              </button>
            ) : (
              <button
                onClick={startCoding}
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-violet-500/90 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-violet-400"
              >
                <FaRocket />
                Start Coding
              </button>
            )}
          </div>
        </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default GamePlanningBoard;
