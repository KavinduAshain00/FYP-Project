import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { achievementsAPI, tutorAPI } from "../api/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaFolder,
  FaFolderOpen,
  FaFile,
  FaReact,
  FaHtml5,
  FaCss3Alt,
  FaJs,
  FaPlay,
  FaSave,
  FaTrophy,
  FaSearch,
  FaCode,
  FaTimes,
  FaChevronDown,
  FaChevronRight,
  FaChevronLeft,
  FaDesktop,
  FaMobileAlt,
  FaPlus,
  FaDownload,
  FaUpload,
  FaStar,
  FaBolt,
  FaGem,
  FaTerminal,
  FaTrash,
  FaCube,
  FaCog,
  FaFileCode,
  FaFolderPlus,
  FaFileMedical,
  FaSyncAlt,
  FaColumns,
  FaCheck,
  FaNpm,
  FaRobot,
  FaComments,
  FaRocket,
  FaLightbulb,
  FaSeedling,
  FaTools,
  FaLaptopCode,
  FaFire,
  FaCrown,
  FaAward,
  FaUsers,
  FaUser,
  FaArrowLeft,
  FaExpand,
  FaCompress,
  FaEllipsisV,
} from "react-icons/fa";
import { toast } from "react-toastify";
import MarkdownContent from "../components/ui/MarkdownContent";
import {
  DropdownMenu,
  DropdownItem,
  DropdownDivider,
} from "../components/ui/DropdownMenu";

// Available NPM packages (simulated)
const AVAILABLE_PACKAGES = {
  // State Management
  zustand: {
    version: "4.4.0",
    description: "State management",
    category: "state",
  },
  jotai: {
    version: "2.6.0",
    description: "Atomic state management",
    category: "state",
  },
  immer: {
    version: "10.0.0",
    description: "Immutable state",
    category: "state",
  },

  // Animation
  "framer-motion": {
    version: "10.16.0",
    description: "Animation library",
    category: "animation",
  },

  // UI Components
  "react-icons": {
    version: "4.12.0",
    description: "Icon library",
    category: "ui",
  },
  "lucide-react": {
    version: "0.300.0",
    description: "Beautiful icons",
    category: "ui",
  },

  // Game Development
  howler: { version: "2.2.4", description: "Audio library", category: "game" },
  "use-sound": {
    version: "4.0.1",
    description: "React sound hooks",
    category: "game",
  },

  // Multiplayer specific
  "socket.io-client": {
    version: "4.7.0",
    description: "WebSocket client",
    category: "multiplayer",
  },
  peer: {
    version: "1.0.0",
    description: "WebRTC peer connections",
    category: "multiplayer",
  },
};

// Initial multiplayer game template
const MULTIPLAYER_TEMPLATE = {
  "src/App.jsx": `import { useState, useCallback } from 'react';

// Game State Model - Single source of truth
const INITIAL_STATE = {
  board: Array(9).fill(null),
  currentPlayer: 'player1',
  winner: null,
  isDraw: false,
  moveCount: 0,
  scores: { player1: 0, player2: 0 },
};

// Win conditions for Tic-Tac-Toe
const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function App({ playerRole = 'player1' }) {
  const [gameState, setGameState] = useState(INITIAL_STATE);
  
  // Check winner
  const checkWinner = useCallback((board) => {
    for (const [a, b, c] of WIN_LINES) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return null;
  }, []);

  // Validate move
  const isValidMove = useCallback((index, state) => {
    if (state.board[index] !== null) return false;
    if (state.winner || state.isDraw) return false;
    if (state.currentPlayer !== playerRole) return false;
    return true;
  }, [playerRole]);

  // Apply move
  const applyMove = useCallback((index, currentState) => {
    const newBoard = [...currentState.board];
    newBoard[index] = currentState.currentPlayer;
    
    const winner = checkWinner(newBoard);
    const moveCount = currentState.moveCount + 1;
    const isDraw = !winner && moveCount === 9;
    
    return {
      ...currentState,
      board: newBoard,
      currentPlayer: currentState.currentPlayer === 'player1' ? 'player2' : 'player1',
      winner,
      isDraw,
      moveCount,
    };
  }, [checkWinner]);

  // Handle cell click
  const handleCellClick = useCallback((index) => {
    if (!isValidMove(index, gameState)) return;
    
    const newState = applyMove(index, gameState);
    setGameState(newState);
    
    // Emit achievement events
    if (newState.winner === playerRole) {
      console.log('[ACHIEVEMENT] win');
    } else if (newState.winner && newState.winner !== playerRole) {
      console.log('[ACHIEVEMENT] loss');
    } else if (newState.isDraw) {
      console.log('[ACHIEVEMENT] draw');
    }
    
    if (newState.winner || newState.isDraw) {
      console.log('[ACHIEVEMENT] matchCompleted');
    }
  }, [gameState, isValidMove, applyMove, playerRole]);

  // Reset game
  const resetGame = () => setGameState(INITIAL_STATE);

  const isMyTurn = gameState.currentPlayer === playerRole;
  
  const getStatusMessage = () => {
    if (gameState.winner) {
      return gameState.winner === playerRole ? '🎉 You Win!' : '😔 You Lose';
    }
    if (gameState.isDraw) return '🤝 Draw!';
    return isMyTurn ? '⚡ Your Turn' : '⏳ Opponent\\'s Turn';
  };

  return (
    <div className="game-container">
      <h1>Multiplayer Game</h1>
      
      <div className="game-info">
        <span className={\`player-badge \${playerRole}\`}>
          You: {playerRole === 'player1' ? 'X' : 'O'}
        </span>
        <span className="status">{getStatusMessage()}</span>
      </div>
      
      <div className="board">
        {gameState.board.map((cell, i) => (
          <button
            key={i}
            className={\`cell \${cell || ''} \${!cell && isMyTurn && !gameState.winner ? 'clickable' : ''}\`}
            onClick={() => handleCellClick(i)}
            disabled={!!cell || !!gameState.winner || gameState.isDraw || !isMyTurn}
          >
            {cell && (
              <span className={\`symbol \${cell}\`}>
                {cell === 'player1' ? 'X' : 'O'}
              </span>
            )}
          </button>
        ))}
      </div>
      
      {(gameState.winner || gameState.isDraw) && (
        <button className="reset-btn" onClick={resetGame}>
          Play Again
        </button>
      )}
    </div>
  );
}

export default App;
`,
  "src/App.css": `* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: 'Segoe UI', system-ui, sans-serif;
  background: #f5f5f5;
  min-height: 100vh;
}

.game-container {
  max-width: 500px;
  margin: 0 auto;
  padding: 30px 20px;
  text-align: center;
  color: #111;
}

h1 {
  font-size: 2rem;
  margin: 0 0 20px 0;
  color: #111;
}

.game-info {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-bottom: 25px;
}

.player-badge {
  padding: 8px 16px;
  border: 1px solid #333;
  font-weight: bold;
  font-size: 0.9rem;
}

.player-badge.player1 {
  background: #fff;
  border-color: #b91c1c;
  color: #b91c1c;
}

.player-badge.player2 {
  background: #fff;
  border-color: #0d9488;
  color: #0d9488;
}

.status {
  font-size: 1.1rem;
  font-weight: 600;
  padding: 8px 16px;
  background: #fff;
  border: 1px solid #ddd;
  color: #333;
}

.board {
  display: grid;
  grid-template-columns: repeat(3, 100px);
  gap: 10px;
  justify-content: center;
  margin: 30px auto;
}

.cell {
  width: 100px;
  height: 100px;
  background: #fff;
  border: 2px solid #ddd;
  font-size: 3rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cell:disabled {
  cursor: not-allowed;
}

.cell.clickable:hover {
  background: #f0f0f0;
  border-color: #333;
}

.symbol {
  font-weight: bold;
}

.symbol.player1 {
  color: #b91c1c;
}

.symbol.player2 {
  color: #0d9488;
}

.reset-btn {
  padding: 15px 40px;
  font-size: 1.1rem;
  font-weight: bold;
  background: #333;
  color: white;
  border: 1px solid #333;
  cursor: pointer;
  margin-top: 20px;
}

.reset-btn:hover {
  background: #555;
}
`,
  "src/components/GameBoard.jsx": `import React from 'react';

const GameBoard = ({ board, onCellClick, disabled }) => {
  return (
    <div className="board">
      {board.map((cell, index) => (
        <button
          key={index}
          className={\`cell \${cell || ''}\`}
          onClick={() => onCellClick(index)}
          disabled={disabled || cell !== null}
        >
          {cell}
        </button>
      ))}
    </div>
  );
};

export default GameBoard;
`,
  "src/utils/gameLogic.js": `// Game logic utilities for multiplayer games

export const checkWinner = (board, winConditions) => {
  for (const condition of winConditions) {
    const [a, b, c] = condition;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
};

export const isDraw = (board) => {
  return board.every(cell => cell !== null);
};

export const getValidMoves = (board) => {
  return board
    .map((cell, index) => cell === null ? index : -1)
    .filter(index => index !== -1);
};

export const cloneState = (state) => {
  return JSON.parse(JSON.stringify(state));
};
`,
  "index.html": `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Multiplayer Game</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
  "package.json": `{
  "name": "multiplayer-game",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}`,
  "README.md": `# Multiplayer Game

A turn-based multiplayer game built with GamiLearn!

## Features
- Two-player gameplay
- Turn validation
- Win/Draw detection
- Shared game state

## How to Play
1. Player 1 uses X, Player 2 uses O
2. Take turns clicking cells
3. First to get 3 in a row wins!
`,
};

// Console message type styling
const consoleStyles = {
  log: "text-slate-300",
  info: "text-cyan-400",
  warn: "text-amber-400",
  error: "text-red-400",
  success: "text-green-400",
  input: "text-purple-400",
  output: "text-slate-300",
};

const MultiplayerGameStudio = () => {
  const navigate = useNavigate();
  const location = useLocation();
  void motion;

  // File system state
  const [files, setFiles] = useState(MULTIPLAYER_TEMPLATE);
  const [folders, setFolders] = useState([
    "src",
    "src/components",
    "src/utils",
  ]);
  const [openFiles, setOpenFiles] = useState(["src/App.jsx"]);
  const [activeFile, setActiveFile] = useState("src/App.jsx");
  const [expandedFolders, setExpandedFolders] = useState({
    src: true,
    "src/components": false,
    "src/utils": false,
  });

  // Preview states - Multiplayer specific (dual previews)
  const [player1PreviewKey, setPlayer1PreviewKey] = useState(0);
  const [player2PreviewKey, setPlayer2PreviewKey] = useState(0);
  const [activePreviewTab, setActivePreviewTab] = useState("split");

  // Console states (separate for each player)
  const [player1Console, setPlayer1Console] = useState([]);
  const [player2Console, setPlayer2Console] = useState([]);
  const [activeConsoleTab, setActiveConsoleTab] = useState("player1");
  const [showConsole, setShowConsole] = useState(true);

  // Terminal state
  const [terminals, setTerminals] = useState([
    {
      id: 1,
      name: "Terminal 1",
      history: [],
      currentInput: "",
      isRunning: false,
    },
  ]);
  const [activeTerminal, setActiveTerminal] = useState(1);
  const [showTerminal, setShowTerminal] = useState(true);
  const [splitTerminal, setSplitTerminal] = useState(false);
  const terminalInputRef = useRef(null);

  // Installed packages
  const [installedPackages, setInstalledPackages] = useState([
    "react",
    "react-dom",
  ]);

  // Package manager modal
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [packageSearch, setPackageSearch] = useState("");
  // UI state for redesigned modal
  const [packageTab, setPackageTab] = useState("browse"); // 'browse' | 'installed' | 'search' | 'recommended'
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [packageCategoryFilter, setPackageCategoryFilter] = useState("all");
  const [favoritePackages, setFavoritePackages] = useState([]);
  const [npmSearchResults, setNpmSearchResults] = useState([]);
  const [npmSearching, setNpmSearching] = useState(false);
  const npmSearchTimerRef = useRef(null);

  // AI Companion
  const [showAICompanion, setShowAICompanion] = useState(false);
  const [aiChat, setAiChat] = useState([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const aiChatRef = useRef(null);

  // Context menu
  const [contextMenu, setContextMenu] = useState({
    show: false,
    x: 0,
    y: 0,
    target: null,
    type: null,
  });

  // Create file/folder modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalType, setCreateModalType] = useState("file");
  const [createModalPath, setCreateModalPath] = useState("");
  const [newItemName, setNewItemName] = useState("");

  // Project state
  const [projectName, setProjectName] = useState("My Multiplayer Game");
  const [savedProjects, setSavedProjects] = useState([]);
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [openToolbarMenu, setOpenToolbarMenu] = useState(null); // 'project' | 'tools' | null

  // Gamification
  const [points, setPoints] = useState(0);
  const [sessionStats, setSessionStats] = useState({
    edits: 0,
    runs: 0,
    saves: 0,
    streak: 0,
    sessionTime: 0,
    filesCreated: 0,
    packagesInstalled: 0,
    terminalCommands: 0,
  });
  const [achievements, setAchievements] = useState([]);

  // Refs
  const player1FrameRef = useRef(null);
  const player2FrameRef = useRef(null);
  const filesRef = useRef(files);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  // NPM search effect
  useEffect(() => {
    const q = packageSearch.trim();
    if (!q) {
      setNpmSearchResults([]);
      setNpmSearching(false);
      return;
    }
    if (npmSearchTimerRef.current) clearTimeout(npmSearchTimerRef.current);
    npmSearchTimerRef.current = setTimeout(async () => {
      try {
        setNpmSearching(true);
        const results = await searchNpmPackages(q);
        setNpmSearchResults(results || []);
      } catch (err) {
        console.error("npm search error:", err);
        setNpmSearchResults([]);
      } finally {
        setNpmSearching(false);
      }
    }, 400);
    return () => {
      if (npmSearchTimerRef.current) clearTimeout(npmSearchTimerRef.current);
    };
  }, [packageSearch]);

  // Build file tree
  const buildFileTree = useCallback(() => {
    const tree = { root: { folders: {}, files: [] } };

    folders.forEach((folderPath) => {
      const parts = folderPath.split("/");
      let current = tree.root;
      parts.forEach((part) => {
        if (!current.folders[part]) {
          current.folders[part] = { folders: {}, files: [] };
        }
        current = current.folders[part];
      });
    });

    Object.keys(files).forEach((filePath) => {
      const parts = filePath.split("/");
      const fileName = parts.pop();

      let current = tree.root;
      parts.forEach((part) => {
        if (!current.folders[part]) {
          current.folders[part] = { folders: {}, files: [] };
        }
        current = current.folders[part];
      });
      current.files.push(fileName);
    });

    return tree;
  }, [files, folders]);

  // Load data on mount
  useEffect(() => {
    let isMounted = true;

    const initializeData = async () => {
      // Load achievements
      try {
        const response = await achievementsAPI.getAll();
        const achievementsData = response.data?.achievements || response.data;
        if (isMounted && Array.isArray(achievementsData)) {
          setAchievements(achievementsData);
        }
      } catch (error) {
        console.error("Error loading achievements:", error);
      }

      // Load saved projects
      try {
        const saved = localStorage.getItem("multiplayerGameProjects");
        if (saved && isMounted) {
          setSavedProjects(JSON.parse(saved));
        }
      } catch (error) {
        console.error("Error loading saved projects:", error);
      }

      // Check if coming from planning board
      const planData = sessionStorage.getItem("gamePlanData");
      if (planData && isMounted) {
        try {
          const gameData = JSON.parse(planData);
          sessionStorage.removeItem("gamePlanData");

          if (gameData.name) {
            setProjectName(gameData.name);
          }

          // Show AI companion with welcome message
          setShowAICompanion(true);
          setAiChat([
            {
              role: "assistant",
              content: `Welcome to your multiplayer game: **${gameData.name}**!

I'm here to help you build it. You can ask me about:
• **Turn-based logic** — whose turn it is and validation
• **Shared state** — keeping both players in sync
• **Win and draw** — detecting when the game ends
• **Balance** — making the game fair and fun

You have two preview windows so you can test as Player 1 and Player 2. Ask me anything!`,
            },
          ]);

          toast.success(
            "Your game plan is loaded. Start building your multiplayer game!",
            { autoClose: 3000 },
          );
        } catch (err) {
          console.error("Error loading game plan:", err);
        }
      }
    };

    initializeData();

    // Session timer
    const timer = setInterval(() => {
      setSessionStats((prev) => ({
        ...prev,
        sessionTime: prev.sessionTime + 1,
      }));
    }, 60000);

    // Close context menu on click outside
    const handleClickOutside = () =>
      setContextMenu({ show: false, x: 0, y: 0, target: null, type: null });
    document.addEventListener("click", handleClickOutside);

    return () => {
      isMounted = false;
      clearInterval(timer);
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  // Server-side achievement check (multiplayer studio)
  useEffect(() => {
    const progressData = {
      totalEdits: sessionStats.edits,
      totalRuns: sessionStats.runs,
      saveCount: sessionStats.saves,
      sessionTime: sessionStats.sessionTime,
      streak: sessionStats.streak,
      totalPoints: points,
      filesCreated: sessionStats.filesCreated,
      packagesInstalled: sessionStats.packagesInstalled,
      terminalCommands: sessionStats.terminalCommands,
      isMultiplayerGame: true,
    };
    achievementsAPI
      .checkAchievements(progressData)
      .then((res) => {
        const { newlyEarned = [] } = res.data;
        if (newlyEarned.length > 0) {
          setAchievements((prev) =>
            prev.map((a) =>
              newlyEarned.some((n) => n.id === a.id)
                ? { ...a, earned: true }
                : a,
            ),
          );
          setPoints((prev) =>
            prev + newlyEarned.reduce((sum, ach) => sum + (ach.points || 0), 0),
          );
          newlyEarned.forEach((ach) =>
            toast.success(
              `Achievement Unlocked: ${ach.name} (+${ach.points} pts)`,
              { autoClose: 4000 },
            ),
          );
        }
      })
      .catch(() => {});
  }, [
    sessionStats.edits,
    sessionStats.runs,
    sessionStats.saves,
    sessionStats.sessionTime,
    sessionStats.streak,
    sessionStats.filesCreated,
    sessionStats.packagesInstalled,
    sessionStats.terminalCommands,
    points,
  ]);

  // Listen for console messages from iframes
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === "console") {
        const { level, message, player, timestamp } = event.data;
        const logEntry = {
          id: Date.now(),
          level,
          message,
          timestamp: new Date(timestamp).toLocaleTimeString(),
        };

        if (player === "player1") {
          setPlayer1Console((prev) => [...prev.slice(-100), logEntry]);
        } else if (player === "player2") {
          setPlayer2Console((prev) => [...prev.slice(-100), logEntry]);
        }
      }

      if (event.data.type === "achievement") {
        const { event: achievementEvent, player } = event.data;
        toast.success(`🏆 ${player}: ${achievementEvent}`, { autoClose: 3000 });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Generate preview HTML for a specific player
  const generatePreviewHTML = useCallback(
    (playerRole) => {
      const appJsx = files["src/App.jsx"] || "";
      const appCss = files["src/App.css"] || "";

      const cleanedJsx = appJsx
        .replace(/import\s+.*?from\s+['"].*?['"];?/g, "")
        .replace(/import\s+['"].*?['"];?/g, "")
        .replace(/export\s+default\s+/g, "")
        .replace(/export\s+/g, "")
        .split("\n")
        .filter((line) => line.trim() !== "")
        .join("\n")
        .trim();

      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>${appCss}</style>
  <style>html, body, #root { margin: 0; padding: 0; height: 100%; }</style>
</head>
<body>
  <div id="root"></div>
  <script>
    (function() {
      const originalConsole = { ...console };
      const interceptConsole = (type) => (...args) => {
        originalConsole[type](...args);
        const message = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');
        window.parent.postMessage({
          type: 'console',
          level: type,
          message,
          player: '${playerRole}',
          timestamp: new Date().toISOString()
        }, '*');
        
        if (message.includes('[ACHIEVEMENT]')) {
          window.parent.postMessage({
            type: 'achievement',
            event: message.replace('[ACHIEVEMENT]', '').trim(),
            player: '${playerRole}'
          }, '*');
        }
      };
      
      console.log = interceptConsole('log');
      console.info = interceptConsole('info');
      console.warn = interceptConsole('warn');
      console.error = interceptConsole('error');
    })();
  </script>
  <script type="text/babel">
    window.onerror = function(msg, url, lineNo) {
      window.parent.postMessage({
        type: 'console',
        level: 'error',
        message: 'Runtime Error: ' + msg + (lineNo ? ' (line ' + lineNo + ')' : ''),
        player: '${playerRole}',
        timestamp: new Date().toISOString()
      }, '*');
      return true;
    };

    try {
      const { useState, useEffect, useReducer, useCallback, useMemo, useRef } = React;
      
      ${cleanedJsx}
      
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<App playerRole="${playerRole}" />);
      console.info('[${playerRole.toUpperCase()}] Game initialized');
    } catch (error) {
      console.error('Compilation Error:', error.message);
      document.getElementById('root').innerHTML = '<div style="color: #ff6b6b; padding: 20px; font-family: monospace;"><h3>Error</h3><pre>' + error.message + '</pre></div>';
    }
  </script>
</body>
</html>`;
    },
    [files],
  );

  // Run both previews
  const runGame = () => {
    setPlayer1Console([]);
    setPlayer2Console([]);
    setPlayer1PreviewKey((prev) => prev + 1);
    setPlayer2PreviewKey((prev) => prev + 1);
    setSessionStats((prev) => ({ ...prev, runs: prev.runs + 1 }));
    awardPoints(5);
    toast.success("⚡ Running for both players!", { autoClose: 2000 });
  };

  // Handle code changes
  const handleEditorChange = (value) => {
    if (value !== files[activeFile]) {
      setFiles((prev) => ({ ...prev, [activeFile]: value || "" }));
      awardPoints(1);
      setSessionStats((prev) => ({
        ...prev,
        edits: prev.edits + 1,
        streak: prev.streak + 1,
      }));
    }
  };

  // Save project
  const saveProject = () => {
    const project = {
      name: projectName,
      files: files,
      folders: folders,
      installedPackages: installedPackages,
      timestamp: new Date().toISOString(),
    };

    const projects = savedProjects.filter((p) => p.name !== projectName);
    projects.unshift(project);
    localStorage.setItem(
      "multiplayerGameProjects",
      JSON.stringify(projects.slice(0, 10)),
    );
    setSavedProjects(projects.slice(0, 10));
    localStorage.setItem("lastMultiplayerProject", JSON.stringify(project));

    awardPoints(10);
    setSessionStats((prev) => ({ ...prev, saves: prev.saves + 1 }));
    toast.success(`💾 Project "${projectName}" saved!`);
  };

  // Load project
  const loadProject = (project) => {
    setFiles(project.files || {});
    setFolders(project.folders || ["src"]);
    setProjectName(project.name);
    setInstalledPackages(project.installedPackages || ["react", "react-dom"]);
    setOpenFiles(["src/App.jsx"]);
    setActiveFile("src/App.jsx");
    setShowProjectsModal(false);
    toast.success(`Loaded "${project.name}"`);
  };

  // Export project
  const exportProject = () => {
    const project = {
      name: projectName,
      files: files,
      folders: folders,
      installedPackages: installedPackages,
      type: "multiplayer",
      timestamp: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(project, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${projectName.replace(/\s+/g, "_")}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success("📥 Project exported!");
  };

  // Reset to template
  const resetProject = () => {
    if (
      window.confirm("Reset to default template? This will erase your changes.")
    ) {
      setFiles(MULTIPLAYER_TEMPLATE);
      setFolders(["src", "src/components", "src/utils"]);
      setPlayer1Console([]);
      setPlayer2Console([]);
      toast.info("Reset to default template");
    }
  };

  // File operations
  const createFile = (path, content = "") => {
    const fullPath = path.startsWith("/") ? path.substring(1) : path;

    if (files[fullPath]) {
      toast.error("File already exists!");
      return false;
    }

    const parts = fullPath.split("/");
    parts.pop();
    if (parts.length > 0) {
      let currentPath = "";
      parts.forEach((part) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        if (!folders.includes(currentPath)) {
          setFolders((prev) => [...prev, currentPath]);
        }
      });
    }

    setFiles((prev) => ({ ...prev, [fullPath]: content }));
    setOpenFiles((prev) => [...prev, fullPath]);
    setActiveFile(fullPath);

    awardPoints(5);
    setSessionStats((prev) => ({
      ...prev,
      filesCreated: prev.filesCreated + 1,
    }));
    toast.success(`📄 Created ${fullPath}`);
    return true;
  };

  const createFolder = (path) => {
    const fullPath = path.startsWith("/") ? path.substring(1) : path;

    if (folders.includes(fullPath)) {
      toast.error("Folder already exists!");
      return false;
    }

    const parts = fullPath.split("/");
    let currentPath = "";
    parts.forEach((part) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      if (!folders.includes(currentPath)) {
        setFolders((prev) => [...prev, currentPath]);
      }
    });

    setExpandedFolders((prev) => ({ ...prev, [fullPath]: true }));
    awardPoints(3);
    toast.success(`Created ${fullPath}`);
    return true;
  };

  const deleteFile = (path) => {
    const newFiles = { ...files };
    delete newFiles[path];
    setFiles(newFiles);

    setOpenFiles((prev) => prev.filter((f) => f !== path));
    if (activeFile === path) {
      const remaining = openFiles.filter((f) => f !== path);
      setActiveFile(remaining[remaining.length - 1] || "");
    }

    toast.success(`Deleted ${path}`);
  };

  const deleteFolder = (path) => {
    const newFiles = { ...files };
    Object.keys(newFiles).forEach((filePath) => {
      if (filePath.startsWith(path + "/")) {
        delete newFiles[filePath];
        setOpenFiles((prev) => prev.filter((f) => f !== filePath));
      }
    });
    setFiles(newFiles);
    setFolders((prev) =>
      prev.filter((f) => f !== path && !f.startsWith(path + "/")),
    );
    toast.success(`Deleted folder ${path}`);
  };

  // Terminal functions
  const addTerminalLine = (terminalId, line, type = "output") => {
    setTerminals((prev) =>
      prev.map((t) => {
        if (t.id === terminalId) {
          return {
            ...t,
            history: [
              ...t.history,
              { text: line, type, timestamp: Date.now() },
            ],
          };
        }
        return t;
      }),
    );
  };

  const searchNpmPackages = async (query) => {
    try {
      const response = await fetch(
        `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=5`,
      );
      if (!response.ok) throw new Error("Search failed");
      const data = await response.json();
      return data.objects.map((obj) => ({
        name: obj.package.name,
        version: obj.package.version,
        description: obj.package.description || "No description",
      }));
    } catch (error) {
      console.error("npm search error:", error);
      return [];
    }
  };

  const fetchNpmPackageInfo = async (packageName) => {
    try {
      const response = await fetch(
        `https://registry.npmjs.org/${encodeURIComponent(packageName)}`,
      );
      if (!response.ok) return null;
      const data = await response.json();
      return {
        name: data.name,
        version: data["dist-tags"]?.latest || "1.0.0",
        description: data.description || "No description available",
      };
    } catch (error) {
      return null;
    }
  };

  // UI helpers for package modal
  const installPackageUI = async (pkgName) => {
    const pkgInfo = await fetchNpmPackageInfo(pkgName);
    if (!installedPackages.includes(pkgName)) {
      setInstalledPackages((prev) => [...prev, pkgName]);
      setSessionStats((prev) => ({
        ...prev,
        packagesInstalled: prev.packagesInstalled + 1,
      }));
      awardPoints(5);
      toast.success(`Installed ${pkgName}`);
    } else {
      toast.info(`${pkgName} already installed`);
    }
    if (pkgInfo && pkgInfo.name)
      setSelectedPackage({
        name: pkgInfo.name,
        version: pkgInfo.version,
        description: pkgInfo.description,
      });
  };

  const removePackageUI = (pkgName) => {
    if (installedPackages.includes(pkgName)) {
      setInstalledPackages((prev) => prev.filter((p) => p !== pkgName));
      toast.success(`Removed ${pkgName}`);
    } else {
      toast.info(`${pkgName} not installed`);
    }
  };

  const copyInstallCommand = async (pkgName) => {
    try {
      await navigator.clipboard.writeText(`npm install ${pkgName}`);
      toast.info("Copied: npm install " + pkgName);
    } catch (err) {
      toast.error("Unable to copy");
    }
  };

  const toggleFavorite = (pkgName) => {
    setFavoritePackages((prev) =>
      prev.includes(pkgName)
        ? prev.filter((p) => p !== pkgName)
        : [...prev, pkgName],
    );
  };

  const processCommand = async (terminalId, command) => {
    const args = command.trim().split(/\s+/);
    const mainCmd = args[0].toLowerCase();

    addTerminalLine(terminalId, `$ ${command}`, "input");
    setSessionStats((prev) => ({
      ...prev,
      terminalCommands: prev.terminalCommands + 1,
    }));
    awardPoints(2);

    setTerminals((prev) =>
      prev.map((t) => (t.id === terminalId ? { ...t, isRunning: true } : t)),
    );

    await new Promise((resolve) =>
      setTimeout(resolve, 300 + Math.random() * 500),
    );

    if (mainCmd === "npm" || mainCmd === "yarn") {
      await handlePackageManagerCommand(terminalId, args);
    } else if (mainCmd === "ls" || mainCmd === "dir") {
      handleLsCommand(terminalId, args[1]);
    } else if (mainCmd === "clear" || mainCmd === "cls") {
      setTerminals((prev) =>
        prev.map((t) => (t.id === terminalId ? { ...t, history: [] } : t)),
      );
    } else if (mainCmd === "help") {
      handleHelpCommand(terminalId);
    } else if (mainCmd === "cat") {
      handleCatCommand(terminalId, args[1]);
    } else if (mainCmd === "touch") {
      if (args[1]) {
        createFile(args[1], "");
        addTerminalLine(terminalId, `Created file: ${args[1]}`, "success");
      } else {
        addTerminalLine(terminalId, "Usage: touch <filename>", "error");
      }
    } else if (mainCmd === "mkdir") {
      if (args[1]) {
        createFolder(args[1]);
        addTerminalLine(terminalId, `Created directory: ${args[1]}`, "success");
      } else {
        addTerminalLine(terminalId, "Usage: mkdir <directory>", "error");
      }
    } else if (mainCmd === "rm") {
      if (args[1] && files[args[1]]) {
        deleteFile(args[1]);
        addTerminalLine(terminalId, `Removed: ${args[1]}`, "success");
      } else {
        addTerminalLine(terminalId, `File not found: ${args[1]}`, "error");
      }
    } else {
      addTerminalLine(
        terminalId,
        `Command not found: ${mainCmd}. Type 'help' for available commands.`,
        "error",
      );
    }

    setTerminals((prev) =>
      prev.map((t) => (t.id === terminalId ? { ...t, isRunning: false } : t)),
    );
  };

  const handlePackageManagerCommand = async (terminalId, args) => {
    const subCmd = args[1];

    if (subCmd === "install" || subCmd === "i" || subCmd === "add") {
      const packageName = args[2];
      if (!packageName) {
        addTerminalLine(terminalId, "Installing dependencies...", "output");
        await new Promise((resolve) => setTimeout(resolve, 1500));
        addTerminalLine(terminalId, "added 125 packages in 2.3s", "success");
        return;
      }

      addTerminalLine(terminalId, `Resolving ${packageName}...`, "output");
      const npmPkg = await fetchNpmPackageInfo(packageName);

      if (!npmPkg) {
        addTerminalLine(
          terminalId,
          `npm ERR! 404 Not Found - ${packageName}`,
          "error",
        );
        return;
      }

      addTerminalLine(
        terminalId,
        `Installing ${npmPkg.name}@${npmPkg.version}...`,
        "output",
      );
      await new Promise((resolve) => setTimeout(resolve, 800));

      if (!installedPackages.includes(packageName)) {
        setInstalledPackages((prev) => [...prev, packageName]);
        setSessionStats((prev) => ({
          ...prev,
          packagesInstalled: prev.packagesInstalled + 1,
        }));
        awardPoints(5);
      }

      addTerminalLine(
        terminalId,
        `+ ${npmPkg.name}@${npmPkg.version}`,
        "success",
      );
    } else if (subCmd === "uninstall" || subCmd === "remove") {
      const packageName = args[2];
      if (packageName && installedPackages.includes(packageName)) {
        setInstalledPackages((prev) => prev.filter((p) => p !== packageName));
        addTerminalLine(terminalId, `removed ${packageName}`, "success");
      } else {
        addTerminalLine(
          terminalId,
          `Package not installed: ${packageName}`,
          "error",
        );
      }
    } else if (subCmd === "list" || subCmd === "ls") {
      addTerminalLine(terminalId, `multiplayer-game@1.0.0`, "output");
      installedPackages.forEach((pkg) => {
        const version = AVAILABLE_PACKAGES[pkg]?.version || "latest";
        addTerminalLine(terminalId, `├── ${pkg}@${version}`, "output");
      });
    } else if (subCmd === "run" && args[2] === "dev") {
      addTerminalLine(
        terminalId,
        "vite v5.0.0 dev server running...",
        "output",
      );
      addTerminalLine(
        terminalId,
        "  ➜  Local:   http://localhost:5173/",
        "success",
      );
      runGame();
    } else {
      addTerminalLine(terminalId, `Unknown command: npm ${subCmd}`, "error");
    }
  };

  const handleLsCommand = (terminalId, path = "") => {
    const items = [];
    folders.forEach((folder) => {
      const parts = folder.split("/");
      if (!path && parts.length === 1)
        items.push({ name: parts[0], type: "folder" });
    });
    Object.keys(files).forEach((filePath) => {
      const parts = filePath.split("/");
      if (!path && parts.length === 1)
        items.push({ name: parts[0], type: "file" });
    });

    if (items.length === 0) {
      addTerminalLine(terminalId, "(empty)", "output");
    } else {
      const output = items
        .map((i) => (i.type === "folder" ? `${i.name}/` : i.name))
        .join("  ");
      addTerminalLine(terminalId, output, "output");
    }
  };

  const handleCatCommand = (terminalId, filePath) => {
    if (!filePath) {
      addTerminalLine(terminalId, "Usage: cat <filename>", "error");
      return;
    }
    if (files[filePath]) {
      files[filePath]
        .split("\n")
        .forEach((line) => addTerminalLine(terminalId, line, "output"));
    } else {
      addTerminalLine(terminalId, `cat: ${filePath}: No such file`, "error");
    }
  };

  const handleHelpCommand = (terminalId) => {
    addTerminalLine(terminalId, "Available Commands:", "info");
    addTerminalLine(
      terminalId,
      "  npm install <pkg>  - Install a package",
      "output",
    );
    addTerminalLine(
      terminalId,
      "  npm uninstall <pkg> - Remove a package",
      "output",
    );
    addTerminalLine(
      terminalId,
      "  npm list           - List packages",
      "output",
    );
    addTerminalLine(
      terminalId,
      "  npm run dev        - Start dev server",
      "output",
    );
    addTerminalLine(terminalId, "  ls                 - List files", "output");
    addTerminalLine(
      terminalId,
      "  cat <file>         - Show file content",
      "output",
    );
    addTerminalLine(terminalId, "  touch <file>       - Create file", "output");
    addTerminalLine(
      terminalId,
      "  mkdir <dir>        - Create directory",
      "output",
    );
    addTerminalLine(terminalId, "  rm <file>          - Remove file", "output");
    addTerminalLine(
      terminalId,
      "  clear              - Clear terminal",
      "output",
    );
  };

  const handleTerminalKeyDown = (e, terminalId) => {
    if (e.key === "Enter") {
      const terminal = terminals.find((t) => t.id === terminalId);
      if (terminal?.currentInput.trim()) {
        processCommand(terminalId, terminal.currentInput);
        setTerminals((prev) =>
          prev.map((t) =>
            t.id === terminalId ? { ...t, currentInput: "" } : t,
          ),
        );
      }
    }
  };

  const updateTerminalInput = (terminalId, value) => {
    setTerminals((prev) =>
      prev.map((t) =>
        t.id === terminalId ? { ...t, currentInput: value } : t,
      ),
    );
  };

  const addNewTerminal = () => {
    if (terminals.length >= 2) {
      toast.warning("Maximum 2 terminals allowed");
      return;
    }
    const newId = terminals.length + 1;
    setTerminals((prev) => [
      ...prev,
      {
        id: newId,
        name: `Terminal ${newId}`,
        history: [
          {
            text: `Welcome to Terminal ${newId}!`,
            type: "info",
            timestamp: Date.now(),
          },
        ],
        currentInput: "",
        isRunning: false,
      },
    ]);
    setActiveTerminal(newId);
    setSplitTerminal(true);
  };

  const closeTerminal = (terminalId) => {
    if (terminals.length <= 1) return;
    setTerminals((prev) => prev.filter((t) => t.id !== terminalId));
    setActiveTerminal(terminals.find((t) => t.id !== terminalId)?.id || 1);
    setSplitTerminal(false);
  };

  // AI Chat
  const handleAIChat = async () => {
    if (!aiInput.trim() || aiLoading) return;

    const userMessage = aiInput.trim();
    setAiInput("");
    setAiChat((prev) => [...prev, { role: "user", content: userMessage }]);
    setAiLoading(true);

    try {
      const context = {
        type: "multiplayer-game-development",
        currentFile: activeFile,
        codeSnippet: (files[activeFile] || "").substring(0, 1000),
        projectFiles: Object.keys(files),
      };

      const response = await tutorAPI.ask(userMessage, context);
      setAiChat((prev) => [
        ...prev,
        { role: "assistant", content: response.data.answer },
      ]);
      awardPoints(5);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Something went wrong. Please try again!";
      setAiChat((prev) => [
        ...prev,
        { role: "assistant", content: msg },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  // Utility functions
  const awardPoints = (amount) => {
    setPoints((prev) => prev + amount);
  };

  const getFileIcon = (filename) => {
    if (filename.endsWith(".jsx")) return <FaReact className="text-cyan-300" />;
    if (filename.endsWith(".html"))
      return <FaHtml5 className="text-orange-400" />;
    if (filename.endsWith(".css"))
      return <FaCss3Alt className="text-blue-400" />;
    if (filename.endsWith(".js")) return <FaJs className="text-yellow-300" />;
    if (filename.endsWith(".json"))
      return <FaCube className="text-emerald-300" />;
    if (filename.endsWith(".md"))
      return <FaFileCode className="text-slate-300" />;
    return <FaFile className="text-slate-400" />;
  };

  const getLanguage = (filename) => {
    if (filename.endsWith(".jsx") || filename.endsWith(".js"))
      return "javascript";
    if (filename.endsWith(".css")) return "css";
    if (filename.endsWith(".html")) return "html";
    if (filename.endsWith(".json")) return "json";
    if (filename.endsWith(".md")) return "markdown";
    return "plaintext";
  };

  const toggleFolder = (folder) => {
    setExpandedFolders((prev) => ({ ...prev, [folder]: !prev[folder] }));
  };

  const openFile = (filePath) => {
    setActiveFile(filePath);
    if (!openFiles.includes(filePath)) {
      setOpenFiles([...openFiles, filePath]);
    }
  };

  const closeFile = (filePath, e) => {
    e.stopPropagation();
    const newOpenFiles = openFiles.filter((f) => f !== filePath);
    setOpenFiles(newOpenFiles);
    if (activeFile === filePath && newOpenFiles.length > 0) {
      setActiveFile(newOpenFiles[newOpenFiles.length - 1]);
    }
  };

  const handleContextMenu = (e, target, type) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ show: true, x: e.clientX, y: e.clientY, target, type });
  };

  const handleCreateModalSubmit = () => {
    if (!newItemName.trim()) {
      toast.error("Please enter a name");
      return;
    }

    const fullPath = createModalPath
      ? `${createModalPath}/${newItemName}`
      : newItemName;

    if (createModalType === "file") {
      let defaultContent = "";
      if (newItemName.endsWith(".jsx")) {
        defaultContent = `import React from 'react';\n\nconst ${newItemName.replace(".jsx", "")} = () => {\n  return (\n    <div>\n      \n    </div>\n  );\n};\n\nexport default ${newItemName.replace(".jsx", "")};`;
      } else if (newItemName.endsWith(".css")) {
        defaultContent = `/* Styles for ${newItemName} */\n`;
      }
      createFile(fullPath, defaultContent);
    } else {
      createFolder(fullPath);
    }

    setShowCreateModal(false);
    setNewItemName("");
    setCreateModalPath("");
  };

  // Render file tree
  const renderFileTree = (node, path = "", depth = 0) => {
    const elements = [];

    Object.keys(node.folders)
      .sort()
      .forEach((folderName) => {
        const folderPath = path ? `${path}/${folderName}` : folderName;
        const isExpanded = expandedFolders[folderPath];

        elements.push(
          <div key={folderPath}>
            <div
              className={`flex items-center gap-2 rounded-md px-2 py-1 text-xs cursor-pointer ${isExpanded ? "bg-white/5 text-slate-100" : "text-slate-300 hover:bg-white/5"}`}
              style={{ paddingLeft: `${12 + depth * 16}px` }}
              onClick={() => toggleFolder(folderPath)}
              onContextMenu={(e) => handleContextMenu(e, folderPath, "folder")}
            >
              {isExpanded ? (
                <FaChevronDown className="text-slate-500" />
              ) : (
                <FaChevronRight className="text-slate-500" />
              )}
              {isExpanded ? (
                <FaFolderOpen className="text-amber-300" />
              ) : (
                <FaFolder className="text-amber-300" />
              )}
              <span>{folderName}</span>
            </div>
            {isExpanded &&
              renderFileTree(node.folders[folderName], folderPath, depth + 1)}
          </div>,
        );
      });

    node.files.sort().forEach((fileName) => {
      const filePath = path ? `${path}/${fileName}` : fileName;

      elements.push(
        <div
          key={filePath}
          className={`flex items-center gap-2 rounded-md px-2 py-1 text-xs cursor-pointer ${activeFile === filePath ? "bg-purple-500/20 text-purple-200" : "text-slate-300 hover:bg-white/5"}`}
          style={{ paddingLeft: `${28 + depth * 16}px` }}
          onClick={() => openFile(filePath)}
          onContextMenu={(e) => handleContextMenu(e, filePath, "file")}
        >
          {getFileIcon(fileName)}
          <span className="truncate">{fileName}</span>
        </div>,
      );
    });

    return elements;
  };

  // Render console output
  const renderConsole = (logs) => (
    <div className="font-mono text-xs space-y-1 p-2">
      {logs.length === 0 ? (
        <p className="text-slate-500 italic">
          No output yet. Run the game to see logs.
        </p>
      ) : (
        logs.map((log) => (
          <div
            key={log.id}
            className={consoleStyles[log.level] || consoleStyles.log}
          >
            <span className="text-slate-500">[{log.timestamp}]</span>{" "}
            {log.message}
          </div>
        ))
      )}
    </div>
  );

  const fileTree = buildFileTree();

  // Determine packages to display
  const displayPackages = (() => {
    if (packageSearch.trim() && npmSearchResults.length > 0) {
      return npmSearchResults;
    }
    if (packageSearch.trim()) {
      return Object.entries(AVAILABLE_PACKAGES)
        .filter(([name]) =>
          name.toLowerCase().includes(packageSearch.toLowerCase()),
        )
        .map(([name, info]) => ({ name, ...info }));
    }
    return Object.entries(AVAILABLE_PACKAGES).map(([name, info]) => ({
      name,
      ...info,
    }));
  })();

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Header – primary actions + grouped menus */}
      <header className="flex items-center justify-between gap-4 px-4 py-2 border-b border-white/10 bg-slate-900/80 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-sm hover:bg-white/10 transition shrink-0"
          >
            <FaArrowLeft />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center bg-white/5 shrink-0">
              <FaUsers className="text-slate-400 text-sm" />
            </div>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-transparent text-sm font-semibold text-white outline-none border-b border-transparent hover:border-white/30 focus:border-purple-500 transition min-w-0 max-w-[180px] sm:max-w-[240px]"
              placeholder="Project name"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300">
            <span className="flex items-center gap-1" title="Edits">
              <FaCode className="text-purple-400" /> {sessionStats.edits}
            </span>
            <span className="flex items-center gap-1" title="Runs">
              <FaPlay className="text-green-400" /> {sessionStats.runs}
            </span>
            <span className="flex items-center gap-1" title="Points">
              <FaStar className="text-amber-400" /> {points}
            </span>
          </div>

          <div className="flex items-center gap-1.5 border-l border-white/10 pl-2">
            <button
              onClick={runGame}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-sm font-medium hover:bg-green-500/30 transition"
              title="Run both player previews"
            >
              <FaPlay /> <span className="hidden sm:inline">Run</span>
            </button>
            <button
              onClick={saveProject}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 text-sm font-medium hover:bg-purple-500/30 transition"
              title="Save project"
            >
              <FaSave /> <span className="hidden sm:inline">Save</span>
            </button>

            <DropdownMenu
              open={openToolbarMenu === "project"}
              onOpenChange={(v) => setOpenToolbarMenu(v ? "project" : null)}
              align="right"
              trigger={
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition text-sm"
                  title="Project"
                >
                  <span className="hidden sm:inline">Project</span>
                  <FaChevronDown className="text-[10px] opacity-70" />
                </button>
              }
            >
              <DropdownItem
                icon={FaFolderOpen}
                label="Open project..."
                onClick={() => {
                  setShowProjectsModal(true);
                  setOpenToolbarMenu(null);
                }}
              />
              <DropdownItem
                icon={FaDownload}
                label="Export project"
                onClick={() => {
                  exportProject();
                  setOpenToolbarMenu(null);
                }}
              />
              <DropdownDivider />
              <DropdownItem
                icon={FaSyncAlt}
                label="Reset to template"
                danger
                onClick={() => {
                  setOpenToolbarMenu(null);
                  resetProject();
                }}
              />
            </DropdownMenu>

            <DropdownMenu
              open={openToolbarMenu === "tools"}
              onOpenChange={(v) => setOpenToolbarMenu(v ? "tools" : null)}
              align="right"
              trigger={
                <button
                  type="button"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-sm transition ${showAICompanion ? "bg-purple-500/20 border-purple-500/40 text-purple-300" : "bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10"}`}
                  title="Tools"
                >
                  <FaEllipsisV className="text-sm" />
                </button>
              }
            >
              <DropdownItem
                icon={FaRobot}
                label={showAICompanion ? "Hide AI Companion" : "AI Companion"}
                onClick={() => {
                  setShowAICompanion(!showAICompanion);
                  setOpenToolbarMenu(null);
                }}
              />
              <DropdownItem
                icon={FaCube}
                label="Packages"
                onClick={() => {
                  setShowPackageModal(true);
                  setOpenToolbarMenu(null);
                }}
              />
              <DropdownDivider />
              <DropdownItem
                icon={FaTerminal}
                label={showTerminal ? "Hide Terminal" : "Show Terminal"}
                onClick={() => {
                  setShowTerminal(!showTerminal);
                  setOpenToolbarMenu(null);
                }}
              />
              <DropdownItem
                icon={FaTerminal}
                label={showConsole ? "Hide Console" : "Show Console"}
                onClick={() => {
                  setShowConsole(!showConsole);
                  setOpenToolbarMenu(null);
                }}
              />
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer */}
        <aside className="w-56 border-r border-white/10 bg-slate-900/50 flex flex-col">
          <div className="p-3 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Explorer
            </h3>
            <DropdownMenu
              align="right"
              trigger={
                <button
                  type="button"
                  className="flex items-center gap-1 px-2 py-1 rounded text-slate-400 hover:bg-white/10 hover:text-white transition text-xs"
                  title="Add"
                >
                  <FaPlus size={10} />
                  <span>Add</span>
                </button>
              }
            >
              <DropdownItem
                icon={FaFileMedical}
                label="New File"
                onClick={() => {
                  setCreateModalType("file");
                  setCreateModalPath("");
                  setShowCreateModal(true);
                }}
              />
              <DropdownItem
                icon={FaFolderPlus}
                label="New Folder"
                onClick={() => {
                  setCreateModalType("folder");
                  setCreateModalPath("");
                  setShowCreateModal(true);
                }}
              />
            </DropdownMenu>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {renderFileTree(fileTree.root)}
          </div>

          {/* Packages Section */}
          <div className="border-t border-white/10">
            <div
              className="p-3 flex items-center justify-between cursor-pointer hover:bg-white/5"
              onClick={() => setShowPackageModal(true)}
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Packages
              </h3>
              <button className="p-1 rounded hover:bg-white/10 text-slate-400">
                <FaPlus size={10} />
              </button>
            </div>
            <div className="px-3 pb-3 space-y-1 max-h-32 overflow-y-auto">
              {installedPackages.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  No packages installed
                </p>
              ) : (
                installedPackages.map((pkg) => (
                  <div
                    key={pkg}
                    className="flex items-center justify-between text-xs text-slate-400 group"
                  >
                    <span className="flex items-center gap-1">
                      <FaNpm className="text-red-400" />
                      {pkg}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setInstalledPackages((prev) =>
                          prev.filter((p) => p !== pkg),
                        );
                        toast.success(`Removed ${pkg}`);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300"
                    >
                      <FaTimes size={10} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Code Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-1 px-2 py-1 border-b border-white/10 bg-slate-900/50 overflow-x-auto">
            {openFiles.map((file) => (
              <div
                key={file}
                onClick={() => setActiveFile(file)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-t text-xs cursor-pointer whitespace-nowrap ${activeFile === file ? "bg-slate-800 text-white border-t-2 border-purple-500" : "text-slate-400 hover:bg-slate-800/50"}`}
              >
                {getFileIcon(file.split("/").pop())}
                <span>{file.split("/").pop()}</span>
                <button
                  onClick={(e) => closeFile(file, e)}
                  className="ml-1 opacity-50 hover:opacity-100"
                >
                  <FaTimes size={10} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex-1">
            {activeFile ? (
              <Editor
                height="100%"
                language={getLanguage(activeFile)}
                value={files[activeFile] || ""}
                onChange={handleEditorChange}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  automaticLayout: true,
                  padding: { top: 10 },
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                Select a file to edit
              </div>
            )}
          </div>

          {/* Terminal */}
          {showTerminal && (
            <div className="h-48 border-t border-white/10 bg-slate-900/80 flex flex-col">
              <div className="flex items-center justify-between px-3 py-1 border-b border-white/10">
                <div className="flex items-center gap-2">
                  {terminals.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTerminal(t.id)}
                      className={`flex items-center gap-1 px-2 py-1 text-xs rounded ${activeTerminal === t.id ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}
                    >
                      <FaTerminal size={10} />
                      {t.name}
                      {terminals.length > 1 && (
                        <FaTimes
                          size={8}
                          className="ml-1 opacity-50 hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            closeTerminal(t.id);
                          }}
                        />
                      )}
                    </button>
                  ))}
                  <button
                    onClick={addNewTerminal}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <FaPlus size={10} />
                  </button>
                </div>
                <button
                  onClick={() => setShowTerminal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <FaTimes size={12} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 font-mono text-xs">
                {terminals
                  .find((t) => t.id === activeTerminal)
                  ?.history.map((line, i) => (
                    <div
                      key={i}
                      className={consoleStyles[line.type] || "text-slate-300"}
                    >
                      {line.text}
                    </div>
                  ))}
              </div>
              <div className="flex items-center gap-2 px-2 py-1 border-t border-white/10">
                <span className="text-green-400 text-xs">$</span>
                <input
                  ref={terminalInputRef}
                  type="text"
                  value={
                    terminals.find((t) => t.id === activeTerminal)
                      ?.currentInput || ""
                  }
                  onChange={(e) =>
                    updateTerminalInput(activeTerminal, e.target.value)
                  }
                  onKeyDown={(e) => handleTerminalKeyDown(e, activeTerminal)}
                  className="flex-1 bg-transparent text-xs text-white outline-none"
                  placeholder="Type a command..."
                />
              </div>
            </div>
          )}

          {!showTerminal && (
            <button
              onClick={() => setShowTerminal(true)}
              className="flex items-center justify-center gap-2 py-1 border-t border-white/10 bg-slate-900/50 text-xs text-slate-400 hover:text-white"
            >
              <FaTerminal /> Show Terminal
            </button>
          )}
        </div>

        {/* Preview Panel */}
        <div className="w-[500px] flex flex-col border-l border-white/10">
          <div className="flex border-b border-white/10 bg-slate-900/50">
            <button
              onClick={() => setActivePreviewTab("player1")}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium transition ${activePreviewTab === "player1" ? "bg-red-500/20 text-red-400 border-b-2 border-red-400" : "text-slate-400 hover:text-white"}`}
            >
              <FaUser /> Player 1
            </button>
            <button
              onClick={() => setActivePreviewTab("player2")}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium transition ${activePreviewTab === "player2" ? "bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-400" : "text-slate-400 hover:text-white"}`}
            >
              <FaUser /> Player 2
            </button>
            <button
              onClick={() => setActivePreviewTab("split")}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium transition ${activePreviewTab === "split" ? "bg-purple-500/20 text-purple-400 border-b-2 border-purple-400" : "text-slate-400 hover:text-white"}`}
            >
              <FaColumns /> Split
            </button>
          </div>

          <div className="flex-1 bg-gray-900 overflow-hidden">
            {activePreviewTab === "split" ? (
              <div className="grid grid-cols-2 h-full">
                <div className="border-r border-slate-300 flex flex-col">
                  <div className="px-2 py-1 bg-red-500/10 text-red-500 text-xs font-bold text-center">
                    Player 1 (X)
                  </div>
                  <iframe
                    key={`p1-${player1PreviewKey}`}
                    ref={player1FrameRef}
                    srcDoc={generatePreviewHTML("player1")}
                    className="flex-1 border-0"
                    sandbox="allow-scripts"
                    title="Player 1"
                  />
                </div>
                <div className="flex flex-col">
                  <div className="px-2 py-1 bg-cyan-500/10 text-cyan-500 text-xs font-bold text-center">
                    Player 2 (O)
                  </div>
                  <iframe
                    key={`p2-${player2PreviewKey}`}
                    ref={player2FrameRef}
                    srcDoc={generatePreviewHTML("player2")}
                    className="flex-1 border-0"
                    sandbox="allow-scripts"
                    title="Player 2"
                  />
                </div>
              </div>
            ) : (
              <iframe
                key={
                  activePreviewTab === "player1"
                    ? `p1-${player1PreviewKey}`
                    : `p2-${player2PreviewKey}`
                }
                ref={
                  activePreviewTab === "player1"
                    ? player1FrameRef
                    : player2FrameRef
                }
                srcDoc={generatePreviewHTML(activePreviewTab)}
                className="w-full h-full border-0"
                sandbox="allow-scripts"
                title={`${activePreviewTab} Preview`}
              />
            )}
          </div>

          {showConsole && (
            <div className="h-40 border-t border-white/10 bg-slate-900/90 flex flex-col">
              <div className="flex border-b border-white/10">
                <button
                  onClick={() => setActiveConsoleTab("player1")}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition ${activeConsoleTab === "player1" ? "bg-red-500/20 text-red-400" : "text-slate-400 hover:text-white"}`}
                >
                  <FaTerminal size={10} /> P1 ({player1Console.length})
                </button>
                <button
                  onClick={() => setActiveConsoleTab("player2")}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition ${activeConsoleTab === "player2" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400 hover:text-white"}`}
                >
                  <FaTerminal size={10} /> P2 ({player2Console.length})
                </button>
                <button
                  onClick={() => {
                    setPlayer1Console([]);
                    setPlayer2Console([]);
                  }}
                  className="ml-auto px-2 text-xs text-slate-500 hover:text-white"
                >
                  Clear
                </button>
                <button
                  onClick={() => setShowConsole(false)}
                  className="px-2 text-xs text-slate-500 hover:text-white"
                >
                  <FaTimes />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {activeConsoleTab === "player1"
                  ? renderConsole(player1Console)
                  : renderConsole(player2Console)}
              </div>
            </div>
          )}

          {!showConsole && (
            <button
              onClick={() => setShowConsole(true)}
              className="flex items-center justify-center gap-2 py-1.5 border-t border-white/10 bg-slate-900/50 text-xs text-slate-400 hover:text-white"
            >
              <FaTerminal /> Show Console
            </button>
          )}
        </div>

        {/* AI Companion */}
        {showAICompanion && (
          <aside className="w-80 border-l border-white/10 bg-slate-900/80 flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FaRobot className="text-purple-400" />
                <span className="text-sm font-medium">AI Companion</span>
              </div>
              <button
                onClick={() => setShowAICompanion(false)}
                className="text-slate-400 hover:text-white"
              >
                <FaTimes />
              </button>
            </div>
            <div
              ref={aiChatRef}
              className="flex-1 overflow-y-auto p-3 space-y-3"
            >
              {aiChat.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg text-sm ${msg.role === "user" ? "bg-purple-500/20 ml-4" : "bg-slate-800 mr-4"}`}
                >
                  {msg.role === "user" ? (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  ) : (
                    <MarkdownContent content={msg.content} />
                  )}
                </div>
              ))}
              {aiLoading && (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <div className="animate-spin">⚙️</div>Thinking...
                </div>
              )}
            </div>
            <div className="p-3 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAIChat()}
                  placeholder="Ask anything about multiplayer games or code..."
                  className="flex-1 px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleAIChat}
                  disabled={aiLoading || !aiInput.trim()}
                  className="px-3 py-2 bg-purple-500 text-white rounded-lg disabled:opacity-50"
                >
                  <FaRocket />
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu.show && (
        <div
          className="fixed bg-gray-900 border border-gray-700 py-1 z-50 min-w-40 rounded"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextMenu.type === "folder" && (
            <>
              <button
                onClick={() => {
                  setCreateModalType("file");
                  setCreateModalPath(contextMenu.target);
                  setShowCreateModal(true);
                  setContextMenu({
                    show: false,
                    x: 0,
                    y: 0,
                    target: null,
                    type: null,
                  });
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2 rounded"
              >
                <FaFileMedical /> New File
              </button>
              <button
                onClick={() => {
                  setCreateModalType("folder");
                  setCreateModalPath(contextMenu.target);
                  setShowCreateModal(true);
                  setContextMenu({
                    show: false,
                    x: 0,
                    y: 0,
                    target: null,
                    type: null,
                  });
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2 rounded"
              >
                <FaFolderPlus /> New Folder
              </button>
              <hr className="border-white/10 my-1" />
              <button
                onClick={() => {
                  deleteFolder(contextMenu.target);
                  setContextMenu({
                    show: false,
                    x: 0,
                    y: 0,
                    target: null,
                    type: null,
                  });
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-red-500/20 text-red-400 flex items-center gap-2"
              >
                <FaTrash /> Delete Folder
              </button>
            </>
          )}
          {contextMenu.type === "file" && (
            <button
              onClick={() => {
                deleteFile(contextMenu.target);
                setContextMenu({
                  show: false,
                  x: 0,
                  y: 0,
                  target: null,
                  type: null,
                });
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-red-500/20 text-red-400 flex items-center gap-2"
            >
              <FaTrash /> Delete File
            </button>
          )}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-slate-800 border border-white/10 rounded-xl p-6 w-96"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4">
                Create New {createModalType === "file" ? "File" : "Folder"}
              </h3>
              {createModalPath && (
                <p className="text-sm text-slate-400 mb-2">
                  In: {createModalPath}/
                </p>
              )}
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleCreateModalSubmit()
                }
                placeholder={
                  createModalType === "file" ? "filename.jsx" : "folder-name"
                }
                className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-sm outline-none focus:border-purple-500 mb-4"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateModalSubmit}
                  className="px-4 py-2 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600"
                >
                  Create
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Package Manager Modal */}
      <AnimatePresence>
        {showPackageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowPackageModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-800 border border-white/10 rounded-xl p-4 w-[800px] h-[80vh] flex overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left: Search, Tabs, Package List */}
              <div className="w-1/2 pr-4 border-r border-white/10 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <FaNpm className="text-red-500" /> Package Manager
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowPackageModal(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => {
                      setPackageTab("browse");
                      setPackageCategoryFilter("all");
                    }}
                    className={`px-3 py-1 rounded ${packageTab === "browse" ? "bg-white/5 text-white" : "text-slate-400 hover:bg-white/5"}`}
                  >
                    Browse
                  </button>
                  <button
                    onClick={() => setPackageTab("installed")}
                    className={`px-3 py-1 rounded ${packageTab === "installed" ? "bg-white/5 text-white" : "text-slate-400 hover:bg-white/5"}`}
                  >
                    Installed
                  </button>
                  <button
                    onClick={() => setPackageTab("search")}
                    className={`px-3 py-1 rounded ${packageTab === "search" ? "bg-white/5 text-white" : "text-slate-400 hover:bg-white/5"}`}
                  >
                    Search
                  </button>
                  <button
                    onClick={() => setPackageTab("recommended")}
                    className={`px-3 py-1 rounded ${packageTab === "recommended" ? "bg-white/5 text-white" : "text-slate-400 hover:bg-white/5"}`}
                  >
                    Recommended
                  </button>
                </div>

                <div className="relative mb-3">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={packageSearch}
                    onChange={(e) => {
                      setPackageSearch(e.target.value);
                      setPackageTab(
                        e.target.value.trim() ? "search" : "browse",
                      );
                    }}
                    placeholder="Search npm packages..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-sm outline-none focus:border-purple-500"
                  />
                  {npmSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mb-3 flex-nowrap overflow-x-auto pb-1">
                  {[
                    "all",
                    ...Array.from(
                      new Set(
                        Object.values(AVAILABLE_PACKAGES).map(
                          (p) => p.category,
                        ),
                      ),
                    ),
                  ].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setPackageCategoryFilter(cat);
                        setPackageTab("browse");
                      }}
                      className={`px-2 py-1 rounded text-xs ${packageCategoryFilter === cat ? "bg-purple-600 text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
                  {displayPackages.length === 0 ? (
                    <div className="text-sm text-slate-400 italic p-4">
                      No packages found.
                    </div>
                  ) : (
                    displayPackages.map((pkg) => (
                      <div
                        key={pkg.name}
                        onClick={() => setSelectedPackage(pkg)}
                        className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition ${selectedPackage?.name === pkg.name ? "bg-white/5" : "hover:bg-white/5"}`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{pkg.name}</span>
                            <span className="text-xs text-slate-500">
                              v{pkg.version}
                            </span>
                            {installedPackages.includes(pkg.name) && (
                              <span className="text-xs ml-2 px-2 py-0.5 rounded bg-green-500/20 text-green-300">
                                Installed
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            {pkg.description}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(pkg.name);
                            }}
                            className={`text-xs px-2 py-1 rounded ${favoritePackages.includes(pkg.name) ? "bg-yellow-400 text-slate-900" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}
                            title="Favorite"
                          >
                            {favoritePackages.includes(pkg.name) ? (
                              <FaStar />
                            ) : (
                              <FaStar />
                            )}
                          </button>
                          {installedPackages.includes(pkg.name) ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removePackageUI(pkg.name);
                              }}
                              className="px-3 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                            >
                              Remove
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                installPackageUI(pkg.name);
                              }}
                              className="px-3 py-1 text-xs bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"
                            >
                              Install
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right: Package Detail Panel */}
              <div className="w-1/2 pl-4 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold">Details</h4>
                  <div className="text-xs text-slate-400">
                    {displayPackages.length} packages
                  </div>
                </div>

                {!selectedPackage ? (
                  <div className="p-4 rounded-lg bg-slate-900/50 text-slate-400">
                    Select a package to see details and quick actions. You can
                    also switch to <strong>Installed</strong> or{" "}
                    <strong>Recommended</strong> tabs.
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-slate-900/50 flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold">
                            {selectedPackage.name}
                          </h3>
                          <span className="text-xs text-slate-400">
                            v{selectedPackage.version}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300 mt-2">
                          {selectedPackage.description}
                        </p>
                        <div className="mt-3 text-xs text-slate-400">
                          Category:{" "}
                          <strong className="text-white">
                            {selectedPackage.category || "misc"}
                          </strong>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-2">
                          {!installedPackages.includes(selectedPackage.name) ? (
                            <button
                              onClick={() =>
                                installPackageUI(selectedPackage.name)
                              }
                              className="px-4 py-2 bg-green-500 text-white rounded"
                            >
                              Install
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                removePackageUI(selectedPackage.name)
                              }
                              className="px-4 py-2 bg-red-500 text-white rounded"
                            >
                              Remove
                            </button>
                          )}
                          <button
                            onClick={() =>
                              copyInstallCommand(selectedPackage.name)
                            }
                            className="px-3 py-2 bg-white/5 text-slate-200 rounded"
                          >
                            Copy Cmd
                          </button>
                        </div>
                        <div className="text-xs text-slate-400">
                          Open on{" "}
                          <a
                            className="text-purple-300 hover:underline"
                            href={`https://www.npmjs.com/package/${selectedPackage.name}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            npm
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h5 className="text-xs text-slate-400 mb-2">
                        README / Info
                      </h5>
                      <div className="flex-1 overflow-y-auto text-sm text-slate-300 bg-slate-900/40 p-3 rounded">
                        {selectedPackage.description ||
                          "No description available."}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <button
                        onClick={() => {
                          toggleFavorite(selectedPackage.name);
                        }}
                        className={`px-3 py-1 text-xs rounded ${favoritePackages.includes(selectedPackage.name) ? "bg-yellow-400 text-slate-900" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}
                      >
                        {favoritePackages.includes(selectedPackage.name)
                          ? "Favorited"
                          : "Add to favorites"}
                      </button>
                      <button
                        onClick={() => {
                          setPackageSearch("");
                          setPackageTab("installed");
                          setSelectedPackage(null);
                        }}
                        className="px-3 py-1 text-xs bg-white/5 text-slate-300 rounded"
                      >
                        View Installed
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MultiplayerGameStudio;
