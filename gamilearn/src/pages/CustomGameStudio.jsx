import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { achievementsAPI, tutorAPI, configAPI } from "../api/api";
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
  FaRoute,
  FaSeedling,
  FaTools,
  FaLaptopCode,
  FaFire,
  FaCrown,
  FaAward,
  FaEllipsisV,
} from "react-icons/fa";
import { toast } from "react-toastify";
import MarkdownContent from "../components/ui/MarkdownContent";
import {
  DropdownMenu,
  DropdownItem,
  DropdownDivider,
} from "../components/ui/DropdownMenu";
import { loadGameDraft, saveGameDraft } from "../utils/draftStorage";

// Available NPM packages (simulated)
const AVAILABLE_PACKAGES = {
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
  phaser: {
    version: "3.70.0",
    description: "2D game framework",
    category: "game",
  },
  "pixi.js": {
    version: "7.3.0",
    description: "2D rendering engine",
    category: "game",
  },

  // Styling
  "styled-components": {
    version: "6.1.0",
    description: "CSS-in-JS",
    category: "styling",
  },
};
const CustomGameStudio = () => {
  const navigate = useNavigate();
  const location = useLocation();
  void motion;

  const [files, setFiles] = useState({
    "src/App.jsx": `import { useState, useEffect, useCallback } from 'react';
import './App.css';

function App() {
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'paused', 'gameover'
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [playerPos, setPlayerPos] = useState(50);
  const [bullets, setBullets] = useState([]);
  const [enemies, setEnemies] = useState([]);

  const startGame = useCallback(() => {
    setGameState('playing');
    setScore(0);
    setLevel(1);
    setBullets([]);
    setEnemies([]);
  }, []);

  const gameOver = useCallback(() => {
    if (score > highScore) {
      setHighScore(score);
    }
    setGameState('gameover');
  }, [score, highScore]);

  const shoot = useCallback(() => {
    if (gameState !== 'playing') return;
    const newBullet = { id: Date.now(), x: playerPos, y: 85 };
    setBullets(prev => [...prev, newBullet]);
  }, [gameState, playerPos]);

  const handleKeyDown = useCallback((e) => {
    if (gameState === 'menu' && e.key === 'Enter') startGame();
    if (gameState !== 'playing') return;

    if (e.key === 'ArrowLeft') setPlayerPos(prev => Math.max(prev - 5, 5));
    if (e.key === 'ArrowRight') setPlayerPos(prev => Math.min(prev + 5, 95));
    if (e.key === ' ') shoot();
  }, [gameState, shoot, startGame]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = setInterval(() => {
      setBullets(prev => prev
        .map(b => ({ ...b, y: b.y - 5 }))
        .filter(b => b.y > 0)
      );

      if (Math.random() < 0.02 + level * 0.01) {
        const newEnemy = { id: Date.now(), x: Math.random() * 90 + 5, y: 0 };
        setEnemies(prev => [...prev, newEnemy]);
      }

      setEnemies(prev => {
        const moved = prev.map(e => ({ ...e, y: e.y + 0.5 + level * 0.2 }));
        const hitBottom = moved.filter(e => e.y >= 85);
        if (hitBottom.length > 0) gameOver();
        return moved.filter(e => e.y < 90);
      });
    }, 50);

    return () => clearInterval(gameLoop);
  }, [gameState, level, gameOver]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    bullets.forEach(bullet => {
      enemies.forEach(enemy => {
        const dist = Math.sqrt((bullet.x - enemy.x) ** 2 + (bullet.y - enemy.y) ** 2);
        if (dist < 8) {
          setBullets(prev => prev.filter(b => b.id !== bullet.id));
          setEnemies(prev => prev.filter(e => e.id !== enemy.id));
          setScore(prev => {
            const newScore = prev + 10;
            if (newScore % 100 === 0) {
              setLevel(l => l + 1);
            }
            return newScore;
          });
        }
      });
    });
  }, [bullets, enemies, gameState]);

  return (
    <div className="game-container">
      <div className="game-hud">
        <div className="hud-item">Score: {score}</div>
        <div className="hud-item">High: {highScore}</div>
        <div className="hud-item">Level: {level}</div>
      </div>

      <div className="game-area">
        {gameState === 'menu' && (
          <div className="menu-screen">
            <h1>Space Defender</h1>
            <p>Use ← → to move, SPACE to shoot</p>
            <button onClick={startGame}>Start Game</button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="menu-screen gameover">
            <h1>Game Over</h1>
            <p>Final Score: {score}</p>
            {score === highScore && score > 0 && <p className="new-record">New Record!</p>}
            <button onClick={startGame}>Play Again</button>
          </div>
        )}

        {gameState === 'playing' && (
          <>
            {enemies.map(enemy => (
              <div key={enemy.id} className="enemy" style={{ left: enemy.x + '%', top: enemy.y + '%' }}>▲</div>
            ))}
            {bullets.map(bullet => (
              <div key={bullet.id} className="bullet" style={{ left: bullet.x + '%', top: bullet.y + '%' }} />
            ))}
            <div className="player" style={{ left: playerPos + '%' }}>▲</div>
          </>
        )}
      </div>

      <div className="controls-hint">
        ← → Move | SPACE Shoot
      </div>
    </div>
  );
}

export default App;`,
    "src/App.css": `.game-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #0a0a1a;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: white;
  overflow: hidden;
  user-select: none;
}

.game-hud {
  display: flex;
  justify-content: space-around;
  padding: 15px 20px;
  background: rgba(0, 0, 0, 0.5);
  border-bottom: 2px solid #00ffff;
}

.hud-item {
  font-size: 1.2rem;
  font-weight: bold;
  text-shadow: 0 0 10px #00ffff;
}

.game-area {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #1a1a3a;
}

.menu-screen {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 10;
}

.menu-screen h1 {
  font-size: 3rem;
  margin: 0 0 20px 0;
  text-shadow: 0 0 20px #ff00ff, 0 0 40px #ff00ff;
  animation: glow 2s ease-in-out infinite alternate;
}

@keyframes glow {
  from { text-shadow: 0 0 20px #ff00ff, 0 0 40px #ff00ff; }
  to { text-shadow: 0 0 30px #00ffff, 0 0 60px #00ffff; }
}

.menu-screen p {
  font-size: 1.2rem;
  opacity: 0.8;
  margin-bottom: 30px;
}

.menu-screen button {
  background: #ff00ff;
  color: white;
  border: none;
  padding: 15px 40px;
  font-size: 1.3rem;
  border-radius: 30px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.menu-screen button:hover {
  transform: scale(1.1);
}

.gameover h1 { color: #ff4444; }
.new-record { color: #ffd700; font-size: 1.5rem; }

.player {
  position: absolute;
  bottom: 10%;
  font-size: 2.5rem;
  transform: translateX(-50%);
  transition: left 0.1s ease;
}

.enemy {
  position: absolute;
  font-size: 2rem;
  transform: translate(-50%, -50%);
}

.bullet {
  position: absolute;
  width: 4px;
  height: 15px;
  background: #00ffff;
  border-radius: 2px;
  transform: translateX(-50%);
}

.controls-hint {
  text-align: center;
  padding: 10px;
  background: rgba(0, 0, 0, 0.5);
  font-size: 0.9rem;
  opacity: 0.7;
  border-top: 1px solid #333;
}`,
    "src/components/Button.jsx": `import React from 'react';
import './Button.css';

const Button = ({ children, onClick, variant = 'primary' }) => {
  return (
    <button 
      className={\`custom-btn \${variant}\`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;`,
    "src/components/Button.css": `.custom-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.custom-btn.primary {
  background: #667eea;
  color: white;
}

.custom-btn.secondary {
  background: rgba(255,255,255,0.2);
  color: white;
  border: 2px solid rgba(255,255,255,0.3);
}

.custom-btn:hover {
  transform: translateY(-2px);
}`,
    "src/utils/helpers.js": `// Utility functions for your game

export const formatScore = (score) => {
  return score.toLocaleString();
};

export const calculateLevel = (score) => {
  return Math.floor(score / 100) + 1;
};

export const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};`,
    "index.html": `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My Game</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
    "package.json": `{
  "name": "my-game",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "vite": "^5.0.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}`,
    "README.md": `# My Game

A fun React game built with GamiLearn Game Studio!

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Features

- Click counter with scoring
- Achievement system
- Beautiful UI
`,
  });

  // Folders structure
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
  const [previewKey, setPreviewKey] = useState(0);
  const [previewMode, setPreviewMode] = useState("desktop");
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [consoleFilter, setConsoleFilter] = useState("all");
  const [showConsole, setShowConsole] = useState(true);
  const [showAICompanion, setShowAICompanion] = useState(false);
  const [aiChat, setAiChat] = useState([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTipsEnabled, setAiTipsEnabled] = useState(true);
  const lastTipTimeRef = useRef(null);
  const [recentErrors, setRecentErrors] = useState([]);
  const lastEditedCodeRef = useRef("");
  const terminalInputRef = useRef(null);
  const terminal2InputRef = useRef(null);
  const iframeRef = useRef(null);
  const aiChatRef = useRef(null);

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
  const [terminalHeight, setTerminalHeight] = useState(200);

  // Installed packages
  const [installedPackages, setInstalledPackages] = useState([
    "react",
    "react-dom",
  ]);

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
  const [createModalType, setCreateModalType] = useState("file"); // 'file' or 'folder'
  const [createModalPath, setCreateModalPath] = useState("");
  const [newItemName, setNewItemName] = useState("");

  // Split terminal view
  const [splitTerminal, setSplitTerminal] = useState(false);

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
  const [showAchievements, setShowAchievements] = useState(false);
  const [studioLevelInfo, setStudioLevelInfo] = useState({
    level: 1,
    title: "Novice",
    color: "#11998e",
  });
  const defaultAchievementIcon =
    "https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/award.svg";
  const renderAchievementIcon = (icon, alt, className) => {
    const isUrl = typeof icon === "string" && icon.startsWith("http");
    if (isUrl) {
      return (
        <img
          src={icon}
          alt={alt}
          className={className}
          onError={(e) => {
            if (e.target.dataset.fallback) return;
            e.target.dataset.fallback = "1";
            e.target.src = defaultAchievementIcon;
          }}
        />
      );
    }
    return <FaAward className={className} aria-label={alt} />;
  };

  // Projects
  const [projectName, setProjectName] = useState("My Game");
  const [savedProjects, setSavedProjects] = useState([]);
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [openToolbarMenu, setOpenToolbarMenu] = useState(null); // 'project' | 'tools' | null
  // Planning board state (saved with project so user can load it anytime)
  const [planningBoard, setPlanningBoard] = useState(null);

  // Package manager modal
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [packageSearch, setPackageSearch] = useState("");
  const [npmSearchResults, setNpmSearchResults] = useState([]);
  const [npmSearching, setNpmSearching] = useState(false);
  const npmSearchTimerRef = useRef(null);
  const tipTimerRef = useRef(null);

  // Auto-save state and refs
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const autoSaveTimerRef = useRef(null);
  const filesRef = useRef(files);
  const foldersRef = useRef(folders);
  const installedPackagesRef = useRef(installedPackages);
  const projectNameRef = useRef(projectName);
  const savedProjectsRef = useRef(savedProjects);
  const planningBoardRef = useRef(planningBoard);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);
  useEffect(() => {
    planningBoardRef.current = planningBoard;
  }, [planningBoard]);
  useEffect(() => {
    foldersRef.current = folders;
  }, [folders]);
  useEffect(() => {
    installedPackagesRef.current = installedPackages;
  }, [installedPackages]);
  useEffect(() => {
    projectNameRef.current = projectName;
  }, [projectName]);
  useEffect(() => {
    savedProjectsRef.current = savedProjects;
  }, [savedProjects]);

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
        console.error("npm search effect error:", err);
        setNpmSearchResults([]);
      } finally {
        setNpmSearching(false);
      }
    }, 400);
    return () => {
      if (npmSearchTimerRef.current) clearTimeout(npmSearchTimerRef.current);
    };
  }, [packageSearch]);

  // Sync installedPackages -> package.json when packages change (e.g. npm install/uninstall)
  const prevPackagesRef = useRef(installedPackages);
  useEffect(() => {
    const prev = prevPackagesRef.current;
    prevPackagesRef.current = installedPackages;
    const same =
      prev.length === installedPackages.length &&
      installedPackages.every((p) => prev.includes(p));
    if (same) return;
    const pkgPath = "package.json";
    const content = filesRef.current[pkgPath];
    if (!content || typeof content !== "string") return;
    try {
      const pkg = JSON.parse(content);
      const defaults = {
        react: "^18.2.0",
        "react-dom": "^18.2.0",
        vite: "^5.0.0",
      };
      const deps = {};
      installedPackages.forEach((name) => {
        deps[name] = pkg.dependencies?.[name] || defaults[name] || "^1.0.0";
      });
      const next = { ...pkg, dependencies: deps };
      setFiles((f) => ({ ...f, [pkgPath]: JSON.stringify(next, null, 2) }));
    } catch {
      // leave file as-is on parse error
    }
  }, [installedPackages]);

  // IndexedDB draft auto-save (every 5s) before user saves to system storage
  useEffect(() => {
    const interval = setInterval(() => {
      const id = projectNameRef.current || "default";
      saveGameDraft(id, {
        files: filesRef.current,
        projectName: projectNameRef.current,
        folders: foldersRef.current,
        installedPackages: installedPackagesRef.current,
        planningBoard: planningBoardRef.current,
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Build file tree from files object
  const buildFileTree = useCallback(() => {
    const tree = { root: { folders: {}, files: [] } };

    // Add all folders first
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

    // Add files to their respective folders
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

  // Load achievements and saved projects on mount
  useEffect(() => {
    // Use a flag to prevent state updates after unmount
    let isMounted = true;

    const initializeData = async () => {
      // Load achievements
      try {
        const response = await achievementsAPI.getAll();
        // Handle different API response formats
        const achievementsData = response.data?.achievements || response.data;
        if (isMounted && Array.isArray(achievementsData)) {
          setAchievements(achievementsData);
        }
      } catch (error) {
        console.error("Error loading achievements:", error);
      }

      // Load saved projects
      try {
        const saved = localStorage.getItem("customGameProjects");
        if (saved && isMounted) {
          setSavedProjects(JSON.parse(saved));
        }
      } catch (error) {
        console.error("Error loading saved projects:", error);
      }

      // Check if coming from planning board with game data
      const planData = sessionStorage.getItem("gamePlanData");
      if (planData && isMounted) {
        try {
          const gameData = JSON.parse(planData);
          // Clear the session storage
          sessionStorage.removeItem("gamePlanData");

          if (gameData.name) setProjectName(gameData.name);
          if (gameData.planningBoard) setPlanningBoard(gameData.planningBoard);

          // Use parsed generated code if available and not skipped; else keep default/minimal project
          const parsed = gameData.generatedCodeParsed;
          const hasFiles =
            parsed?.files &&
            typeof parsed.files === "object" &&
            Object.keys(parsed.files).length > 0;
          const hasParsedCode = hasFiles || parsed?.jsx || parsed?.css;
          const useGenerated =
            gameData.generatedCode &&
            !gameData.skipStarterCode &&
            (hasParsedCode || !parsed);

          if (useGenerated) {
            const baseFiles = filesRef.current || {};
            let newFiles;
            if (hasFiles) {
              newFiles = { ...baseFiles, ...parsed.files };
              if (
                parsed.packages &&
                Array.isArray(parsed.packages) &&
                parsed.packages.length > 0
              ) {
                setInstalledPackages(parsed.packages);
              }
              const pkgJson = baseFiles["package.json"];
              if (pkgJson) {
                try {
                  const pkg = JSON.parse(pkgJson);
                  const deps = {};
                  (parsed.packages || ["react", "react-dom"]).forEach(
                    (name) => {
                      deps[name] = pkg.dependencies?.[name] || "^18.2.0";
                    },
                  );
                  newFiles["package.json"] = JSON.stringify(
                    { ...pkg, dependencies: deps },
                    null,
                    2,
                  );
                } catch {
                  // keep existing package.json
                }
              }
            } else {
              const starterAppJsx =
                parsed.jsx ||
                `import { useState, useEffect, useCallback } from 'react';
import './App.css';

// ${gameData.name || "My Game"}
// ${gameData.description || "A fun game"}
// Mechanics: ${gameData.mechanicsText || "Custom"}

function App() {
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'paused', 'gameover'
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    console.log('${gameData.name || "Game"} initialized!');
    console.log('Click START to begin');
  }, []);

  const startGame = useCallback(() => {
    console.log('Game started!');
    setGameState('playing');
    setScore(0);
  }, []);

  const pauseGame = () => {
    if (gameState === 'playing') {
      setGameState('paused');
      console.log('Game paused');
    }
  };

  const resumeGame = () => {
    if (gameState === 'paused') {
      setGameState('playing');
      console.log('Game resumed');
    }
  };

  const gameOver = useCallback(() => {
    console.error('Game Over! Final Score:', score);
    if (score > highScore) {
      setHighScore(score);
      console.warn('New high score!');
    }
    setGameState('gameover');
  }, [score, highScore]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (gameState === 'menu' || gameState === 'gameover') startGame();
        else if (gameState === 'paused') resumeGame();
      }
      if (e.key === 'Escape' && gameState === 'playing') {
        pauseGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, startGame]);

  return (
    <div className="game-container">
      <div className="game-hud">
        <div className="hud-item">Score: {score}</div>
        <div className="hud-item">High: {highScore}</div>
      </div>

      <div className="game-area">
        {gameState === 'menu' && (
          <div className="menu-screen">
            <h1>${gameData.name || "My Game"}</h1>
            <p>Press SPACE or click START to begin</p>
            <button onClick={startGame}>Start Game</button>
          </div>
        )}

        {gameState === 'paused' && (
          <div className="menu-screen paused">
            <h1>Paused</h1>
            <button onClick={resumeGame}>Resume</button>
            <button onClick={() => setGameState('menu')}>Menu</button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="menu-screen gameover">
            <h1>Game Over</h1>
            <p>Final Score: {score}</p>
            {score === highScore && score > 0 && <p className="new-record">New Record!</p>}
            <button onClick={startGame}>Play Again</button>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="game-play-area">
            {/* TODO: Add your game elements here */}
            <p>Game is running! Add your game logic.</p>
            <button onClick={() => setScore(s => s + 10)}>+10 Points</button>
            <button onClick={gameOver}>End Game</button>
          </div>
        )}
      </div>

      <div className="controls-hint">
        SPACE: Start/Resume | ESC: Pause
      </div>
    </div>
  );
}

export default App;`;

              const starterAppCss =
                hasParsedCode && parsed.css
                  ? parsed.css
                  : `.game-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #0a0a1a;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: white;
  overflow: hidden;
  user-select: none;
}

.game-hud {
  display: flex;
  justify-content: space-around;
  padding: 15px 20px;
  background: rgba(0, 0, 0, 0.5);
  border-bottom: 2px solid #00ffff;
}

.hud-item {
  font-size: 1.2rem;
  font-weight: bold;
  text-shadow: 0 0 10px #00ffff;
}

.game-area {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a3a;
}

.menu-screen {
  text-align: center;
  z-index: 10;
}

.menu-screen h1 {
  font-size: 3rem;
  margin: 0 0 20px 0;
}

.menu-screen p {
  font-size: 1.2rem;
  opacity: 0.8;
  margin-bottom: 30px;
}

.menu-screen button {
  background: #ff00ff;
  color: white;
  border: none;
  padding: 15px 40px;
  font-size: 1.3rem;
  border-radius: 30px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
  margin: 10px;
}

.menu-screen button:hover {
  transform: scale(1.1);
}

.gameover h1 { color: #ff4444; }
.paused h1 { color: #ffaa00; }
.new-record { color: #ffd700; font-size: 1.5rem; }

.game-play-area {
  text-align: center;
}

.game-play-area button {
  background: #667eea;
  color: white;
  border: none;
  padding: 10px 25px;
  font-size: 1rem;
  border-radius: 20px;
  cursor: pointer;
  margin: 10px;
  transition: all 0.2s;
}

.game-play-area button:hover {
  transform: scale(1.05);
}

.controls-hint {
  text-align: center;
  padding: 10px;
  background: rgba(0, 0, 0, 0.5);
  font-size: 0.9rem;
  opacity: 0.7;
  border-top: 1px solid #333;
}`;

              newFiles = {
                "src/App.jsx": starterAppJsx,
                "src/App.css": starterAppCss,
                "src/components/Button.jsx":
                  filesRef.current["src/components/Button.jsx"],
                "src/components/Button.css":
                  filesRef.current["src/components/Button.css"],
                "src/utils/helpers.js":
                  filesRef.current["src/utils/helpers.js"],
                "index.html": filesRef.current["index.html"],
                "package.json": filesRef.current["package.json"],
                "README.md": `# ${gameData.name || "My Game"}

${gameData.description || "A fun React game built with GamiLearn Game Studio!"}

## Game Info
- **Description**: ${gameData.description || "Custom"}
- **Mechanics**: ${gameData.mechanicsText || "Custom"}
- **Game loop**: ${gameData.gameLoopText || "—"}

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Game Flow
${gameData.flowchart ? "\n```mermaid\n" + gameData.flowchart + "\n```\n" : ""}

## AI Recommendations
${gameData.recommendations || "No recommendations yet."}
`,
                ...Object.fromEntries(
                  Object.entries(baseFiles).filter(
                    ([k]) =>
                      !["src/App.jsx", "src/App.css", "README.md"].includes(k),
                  ),
                ),
              };
            }
            setFiles(newFiles);
            setOpenFiles(["src/App.jsx"]);
            setActiveFile("src/App.jsx");

            // Award bonus points from planning
            if (gameData.xpEarned) {
              setPoints((prev) => prev + gameData.xpEarned);
              toast.success(
                `Loaded your game plan! +${gameData.xpEarned} XP from planning`,
                { autoClose: 3000 },
              );
            } else {
              toast.success("Game plan loaded! Start coding your game!", {
                autoClose: 3000,
              });
            }

            // Show AI companion with welcome message
            setShowAICompanion(true);
            setAiChat([
              {
                role: "assistant",
                content: `Welcome to your game project: **${gameData.name}**!

I'm here to help you build it. You can ask me about:
• **Game mechanics** — how to implement features
• **Bugs and errors** — fixing issues in your code
• **Best practices** — clean code and structure
• **Ideas** — making your game more fun

Your plan: ${gameData.mechanicsText || "Custom"} · ${gameData.gameLoopText || "—"}

Ask me anything as you go!`,
              },
            ]);
          } else if (gameData.fromPlanning) {
            // Skip starter code: keep default files, still show welcome and plan
            if (gameData.xpEarned) {
              setPoints((prev) => prev + gameData.xpEarned);
              toast.success(
                `Plan loaded! +${gameData.xpEarned} XP from planning`,
                { autoClose: 3000 },
              );
            } else {
              toast.success(
                "Starting with a fresh project. Your plan is saved.",
                { autoClose: 3000 },
              );
            }
            setShowAICompanion(true);
            setAiChat([
              {
                role: "assistant",
                content: `Welcome to **${gameData.name || "My Game"}** (fresh project)!\n\nYour plan is saved. You can build from scratch or ask me for help.`,
              },
            ]);
          }
        } catch (err) {
          console.error("Error loading game plan data:", err);
        }
      } else {
        // Load last project if not coming from planning
        // Load project from Dashboard "Open in Studio" or last saved project
        const loadProjectState = location.state?.loadProject;
        const lastProject =
          loadProjectState ||
          JSON.parse(localStorage.getItem("lastGameProject") || "null");
        if (lastProject && isMounted) {
          if (lastProject.files) setFiles(lastProject.files);
          if (lastProject.folders)
            setFolders(
              lastProject.folders || ["src", "src/components", "src/utils"],
            );
          if (lastProject.projectName) setProjectName(lastProject.projectName);
          if (lastProject.activeFile) setActiveFile(lastProject.activeFile);
          if (lastProject.installedPackages)
            setInstalledPackages(lastProject.installedPackages);
          if (lastProject.planningBoard)
            setPlanningBoard(lastProject.planningBoard);
        } else if (isMounted) {
          // Try IndexedDB draft as fallback
          loadGameDraft("default").then((draft) => {
            if (draft && draft.files) {
              setFiles(draft.files);
              if (draft.projectName) setProjectName(draft.projectName);
              if (draft.folders) setFolders(draft.folders);
              if (draft.installedPackages)
                setInstalledPackages(draft.installedPackages);
              if (draft.planningBoard) setPlanningBoard(draft.planningBoard);
            }
          });
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- init once on mount

  // Listen for console messages from iframe
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === "console") {
        setConsoleLogs((prev) => [
          ...prev.slice(-99),
          {
            id: Date.now(),
            level: event.data.level,
            message: event.data.message,
            timestamp: new Date(event.data.timestamp).toLocaleTimeString(),
          },
        ]);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Clear console when preview refreshes
  const clearConsole = () => {
    setConsoleLogs([]);
  };

  // Server-side achievement check
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
          setPoints(
            (prev) =>
              prev +
              newlyEarned.reduce((sum, ach) => sum + (ach.points || 0), 0),
          );
          newlyEarned.forEach((ach) =>
            toast.success(
              <div>
                <strong>Achievement Unlocked!</strong>
                <div>
                  {ach.icon} {ach.name}
                </div>
                <small>+{ach.points} points</small>
              </div>,
              { autoClose: 4000 },
            ),
          );
        }
      })
      .catch((err) => console.error("Error checking achievements:", err));
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

  // Studio level from server
  useEffect(() => {
    configAPI
      .getStudioLevel(points)
      .then((res) => setStudioLevelInfo(res.data))
      .catch(() => {});
  }, [points]);

  const saveProject = () => {
    const project = {
      name: projectName,
      files: files,
      folders: folders,
      installedPackages: installedPackages,
      planningBoard: planningBoard || undefined,
      timestamp: new Date().toISOString(),
    };

    const projects = savedProjects.filter((p) => p.name !== projectName);
    projects.unshift(project);
    localStorage.setItem(
      "savedGameProjects",
      JSON.stringify(projects.slice(0, 10)),
    );
    setSavedProjects(projects.slice(0, 10));
    localStorage.setItem("lastGameProject", JSON.stringify(project));

    awardPoints(10, "Save Project");
    setSessionStats((prev) => ({ ...prev, saves: prev.saves + 1 }));
    toast.success(`💾 Project "${projectName}" saved!`);

    // Enable autosave after first manual save
    if (!autoSaveEnabled) {
      setAutoSaveEnabled(true);
      toast.info("🟢 Autosave enabled", { autoClose: 2000 });
      // Start autosave interval (15s)
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setInterval(() => {
        performAutoSave();
      }, 15000);
    }
  };

  // Perform an autosave without awarding points or increasing manual save counters
  const performAutoSave = () => {
    try {
      const project = {
        name: projectNameRef.current,
        files: filesRef.current,
        folders: foldersRef.current,
        installedPackages: installedPackagesRef.current,
        planningBoard: planningBoardRef.current ?? undefined,
        timestamp: new Date().toISOString(),
      };
      const projects = (savedProjectsRef.current || []).filter(
        (p) => p.name !== project.name,
      );
      projects.unshift(project);
      localStorage.setItem(
        "savedGameProjects",
        JSON.stringify(projects.slice(0, 10)),
      );
      setSavedProjects(projects.slice(0, 10));
      localStorage.setItem("lastGameProject", JSON.stringify(project));
      toast.info("Autosaved", { autoClose: 1200 });
    } catch (err) {
      console.error("Autosave error:", err);
    }
  };

  // Cleanup autosave on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, []);

  const loadProject = (project) => {
    setFiles(project.files || {});
    setFolders(project.folders || ["src"]);
    setProjectName(project.name);
    setInstalledPackages(project.installedPackages || ["react", "react-dom"]);
    setPlanningBoard(project.planningBoard || null);
    setOpenFiles(["src/App.jsx"]);
    setActiveFile("src/App.jsx");
    setShowProjectsModal(false);
    toast.success(`Loaded "${project.name}"`);
  };

  const exportProject = () => {
    const project = {
      name: projectName,
      files: files,
      folders: folders,
      installedPackages: installedPackages,
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

  const importProject = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const project = JSON.parse(event.target.result);
        setFiles(project.files || {});
        setFolders(project.folders || ["src"]);
        setProjectName(project.name || "Imported Project");
        setInstalledPackages(
          project.installedPackages || ["react", "react-dom"],
        );
        setOpenFiles(["src/App.jsx"]);
        setActiveFile("src/App.jsx");
        toast.success(`📤 Imported "${project.name}"`);
      } catch {
        toast.error(
          "We couldn't import that project. Check the file and try again.",
        );
      }
    };
    reader.readAsText(file);
  };

  // File operations
  const createFile = (path, content = "") => {
    const fullPath = path.startsWith("/") ? path.substring(1) : path;

    if (files[fullPath]) {
      toast.error("A file with this name already exists.");
      return false;
    }

    // Add parent folders if they don't exist
    const parts = fullPath.split("/");
    parts.pop(); // Remove filename
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

    awardPoints(5, "Create File");
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
      toast.error("A folder with this name already exists.");
      return false;
    }

    // Add parent folders if they don't exist
    const parts = fullPath.split("/");
    let currentPath = "";
    parts.forEach((part) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      if (!folders.includes(currentPath)) {
        setFolders((prev) => [...prev, currentPath]);
      }
    });

    // Expand the new folder
    setExpandedFolders((prev) => ({ ...prev, [fullPath]: true }));

    awardPoints(3, "Create Folder");
    toast.success(`Created ${fullPath}`);
    return true;
  };

  const deleteFile = (path) => {
    const newFiles = { ...files };
    delete newFiles[path];
    setFiles(newFiles);

    // Close the file if open
    setOpenFiles((prev) => prev.filter((f) => f !== path));
    if (activeFile === path) {
      const remaining = openFiles.filter((f) => f !== path);
      setActiveFile(remaining[remaining.length - 1] || "");
    }

    toast.success(`Deleted ${path}`);
  };

  const deleteFolder = (path) => {
    // Delete all files in the folder
    const newFiles = { ...files };
    Object.keys(newFiles).forEach((filePath) => {
      if (filePath.startsWith(path + "/")) {
        delete newFiles[filePath];
        setOpenFiles((prev) => prev.filter((f) => f !== filePath));
      }
    });
    setFiles(newFiles);

    // Delete folder and subfolders
    setFolders((prev) =>
      prev.filter((f) => f !== path && !f.startsWith(path + "/")),
    );

    toast.success(`Deleted folder ${path}`);
  };

  const renameFile = (oldPath, newName) => {
    const parts = oldPath.split("/");
    parts.pop();
    const newPath =
      parts.length > 0 ? `${parts.join("/")}/${newName}` : newName;

    if (files[newPath]) {
      toast.error("A file with that name already exists in this folder.");
      return;
    }

    const content = files[oldPath];
    const newFiles = { ...files };
    delete newFiles[oldPath];
    newFiles[newPath] = content;
    setFiles(newFiles);

    // Update open files
    setOpenFiles((prev) => prev.map((f) => (f === oldPath ? newPath : f)));
    if (activeFile === oldPath) {
      setActiveFile(newPath);
    }

    toast.success(`✏️ Renamed to ${newName}`);
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

  const processCommand = async (terminalId, command) => {
    const args = command.trim().split(/\s+/);
    const mainCmd = args[0].toLowerCase();

    addTerminalLine(terminalId, `$ ${command}`, "input");
    setSessionStats((prev) => ({
      ...prev,
      terminalCommands: prev.terminalCommands + 1,
    }));
    awardPoints(2, "Terminal Command");

    // Simulate command processing
    setTerminals((prev) =>
      prev.map((t) => (t.id === terminalId ? { ...t, isRunning: true } : t)),
    );

    await new Promise((resolve) =>
      setTimeout(resolve, 300 + Math.random() * 500),
    );

    if (mainCmd === "npm" || mainCmd === "yarn" || mainCmd === "pnpm") {
      await handlePackageManagerCommand(terminalId, args);
    } else if (mainCmd === "ls" || mainCmd === "dir") {
      handleLsCommand(terminalId, args[1]);
    } else if (mainCmd === "cd") {
      addTerminalLine(
        terminalId,
        `Changed directory to ${args[1] || "~"}`,
        "output",
      );
    } else if (mainCmd === "pwd") {
      addTerminalLine(terminalId, "/home/user/my-game", "output");
    } else if (mainCmd === "clear" || mainCmd === "cls") {
      setTerminals((prev) =>
        prev.map((t) => (t.id === terminalId ? { ...t, history: [] } : t)),
      );
    } else if (mainCmd === "echo") {
      addTerminalLine(terminalId, args.slice(1).join(" "), "output");
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
      if (args[1]) {
        if (files[args[1]]) {
          deleteFile(args[1]);
          addTerminalLine(terminalId, `Removed: ${args[1]}`, "success");
        } else {
          addTerminalLine(terminalId, `File not found: ${args[1]}`, "error");
        }
      } else {
        addTerminalLine(terminalId, "Usage: rm <file>", "error");
      }
    } else if (mainCmd === "help") {
      handleHelpCommand(terminalId);
    } else if (mainCmd === "node" && args[1] === "-v") {
      addTerminalLine(terminalId, "v20.10.0", "output");
    } else if (mainCmd === "git") {
      addTerminalLine(terminalId, "git version 2.42.0", "output");
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

  // Fetch package info from npm registry
  const fetchNpmPackageInfo = async (packageName) => {
    try {
      const response = await fetch(
        `https://registry.npmjs.org/${encodeURIComponent(packageName)}`,
      );
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Failed to fetch");
      }
      const data = await response.json();
      return {
        name: data.name,
        version: data["dist-tags"]?.latest || "1.0.0",
        description: data.description || "No description available",
        homepage: data.homepage,
        keywords: data.keywords || [],
      };
    } catch (error) {
      console.error("npm fetch error:", error);
      return null;
    }
  };

  // Search npm packages
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

  const handlePackageManagerCommand = async (terminalId, args) => {
    const subCmd = args[1];

    if (subCmd === "install" || subCmd === "i" || subCmd === "add") {
      const packageName = args[2];
      if (!packageName) {
        addTerminalLine(
          terminalId,
          "Installing dependencies from package.json...",
          "output",
        );
        await new Promise((resolve) => setTimeout(resolve, 1500));
        addTerminalLine(terminalId, "added 125 packages in 2.3s", "success");
        return;
      }

      addTerminalLine(terminalId, `Resolving ${packageName}...`, "output");

      // Fetch real package info from npm registry
      const npmPkg = await fetchNpmPackageInfo(packageName);

      if (!npmPkg) {
        addTerminalLine(
          terminalId,
          `npm ERR! 404 Not Found - ${packageName}`,
          "error",
        );
        addTerminalLine(
          terminalId,
          `npm ERR! 404 '${packageName}' is not in this registry.`,
          "error",
        );

        // Suggest similar packages
        addTerminalLine(
          terminalId,
          `Searching for similar packages...`,
          "info",
        );
        const suggestions = await searchNpmPackages(packageName);
        if (suggestions.length > 0) {
          addTerminalLine(terminalId, `Did you mean one of these?`, "info");
          suggestions.slice(0, 5).forEach((pkg) => {
            addTerminalLine(
              terminalId,
              `  • ${pkg.name}@${pkg.version} - ${pkg.description.substring(0, 50)}${pkg.description.length > 50 ? "..." : ""}`,
              "output",
            );
          });
        }
        return;
      }

      addTerminalLine(
        terminalId,
        `Installing ${npmPkg.name}@${npmPkg.version}...`,
        "output",
      );
      await new Promise((resolve) =>
        setTimeout(resolve, 600 + Math.random() * 800),
      );

      if (!installedPackages.includes(packageName)) {
        setInstalledPackages((prev) => [...prev, packageName]);
        setSessionStats((prev) => ({
          ...prev,
          packagesInstalled: prev.packagesInstalled + 1,
        }));
        awardPoints(5, "Install Package");
      }

      const depCount = Math.floor(Math.random() * 20) + 3;
      addTerminalLine(
        terminalId,
        `+ ${npmPkg.name}@${npmPkg.version}`,
        "success",
      );
      addTerminalLine(
        terminalId,
        `added ${depCount} packages in ${(Math.random() * 2 + 0.8).toFixed(1)}s`,
        "output",
      );
      addTerminalLine(
        terminalId,
        `${npmPkg.description.substring(0, 80)}${npmPkg.description.length > 80 ? "..." : ""}`,
        "info",
      );
    } else if (subCmd === "search" || subCmd === "s") {
      const query = args.slice(2).join(" ");
      if (!query) {
        addTerminalLine(terminalId, "Usage: npm search <query>", "error");
        return;
      }

      addTerminalLine(terminalId, `Searching npm for "${query}"...`, "output");
      const results = await searchNpmPackages(query);

      if (results.length === 0) {
        addTerminalLine(terminalId, "No packages found.", "output");
      } else {
        addTerminalLine(
          terminalId,
          `Found ${results.length} packages:`,
          "success",
        );
        results.forEach((pkg) => {
          addTerminalLine(terminalId, `${pkg.name}@${pkg.version}`, "output");
          addTerminalLine(
            terminalId,
            `   ${pkg.description.substring(0, 60)}${pkg.description.length > 60 ? "..." : ""}`,
            "info",
          );
        });
      }
    } else if (
      subCmd === "uninstall" ||
      subCmd === "remove" ||
      subCmd === "rm"
    ) {
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
      addTerminalLine(terminalId, `my-game@1.0.0 /home/user/my-game`, "output");
      for (const pkg of installedPackages) {
        // Try to get real version from npm, fallback to cached
        const npmInfo = await fetchNpmPackageInfo(pkg);
        const version =
          npmInfo?.version || AVAILABLE_PACKAGES[pkg]?.version || "latest";
        addTerminalLine(terminalId, `├── ${pkg}@${version}`, "output");
      }
    } else if (subCmd === "info" || subCmd === "view") {
      const packageName = args[2];
      if (!packageName) {
        addTerminalLine(terminalId, "Usage: npm info <package>", "error");
        return;
      }

      addTerminalLine(
        terminalId,
        `Fetching info for ${packageName}...`,
        "output",
      );
      const npmPkg = await fetchNpmPackageInfo(packageName);

      if (!npmPkg) {
        addTerminalLine(
          terminalId,
          `npm ERR! 404 Not Found - ${packageName}`,
          "error",
        );
        return;
      }

      addTerminalLine(terminalId, "", "output");
      addTerminalLine(
        terminalId,
        `${npmPkg.name}@${npmPkg.version}`,
        "success",
      );
      addTerminalLine(terminalId, `${npmPkg.description}`, "output");
      if (npmPkg.homepage) {
        addTerminalLine(terminalId, `Homepage: ${npmPkg.homepage}`, "info");
      }
      if (npmPkg.keywords?.length > 0) {
        addTerminalLine(
          terminalId,
          `Keywords: ${npmPkg.keywords.slice(0, 8).join(", ")}`,
          "info",
        );
      }
    } else if (subCmd === "run") {
      const script = args[2];
      if (script === "dev") {
        addTerminalLine(
          terminalId,
          "vite v5.0.0 dev server running at:",
          "output",
        );
        addTerminalLine(
          terminalId,
          "  ➜  Local:   http://localhost:5173/",
          "success",
        );
        addTerminalLine(
          terminalId,
          "  ➜  Network: http://192.168.1.10:5173/",
          "output",
        );
        runCode();
      } else if (script === "build") {
        addTerminalLine(terminalId, "Building for production...", "output");
        await new Promise((resolve) => setTimeout(resolve, 2000));
        addTerminalLine(terminalId, "✓ built in 1.23s", "success");
      } else {
        addTerminalLine(terminalId, `Missing script: "${script}"`, "error");
      }
    } else if (subCmd === "init") {
      addTerminalLine(
        terminalId,
        "Wrote to /home/user/my-game/package.json",
        "success",
      );
    } else {
      addTerminalLine(terminalId, `Unknown command: npm ${subCmd}`, "error");
    }
  };

  const handleLsCommand = (terminalId, path = "") => {
    const targetPath = path || "";
    const items = [];

    // Get folders at this level
    folders.forEach((folder) => {
      const parts = folder.split("/");
      if (targetPath === "") {
        if (parts.length === 1) items.push({ name: parts[0], type: "folder" });
      } else {
        if (
          folder.startsWith(targetPath + "/") &&
          folder.split("/").length === targetPath.split("/").length + 1
        ) {
          items.push({ name: parts[parts.length - 1], type: "folder" });
        }
      }
    });

    // Get files at this level
    Object.keys(files).forEach((filePath) => {
      const parts = filePath.split("/");
      if (targetPath === "") {
        if (parts.length === 1) items.push({ name: parts[0], type: "file" });
      } else {
        if (
          filePath.startsWith(targetPath + "/") &&
          parts.length === targetPath.split("/").length + 1
        ) {
          items.push({ name: parts[parts.length - 1], type: "file" });
        }
      }
    });

    if (items.length === 0) {
      addTerminalLine(terminalId, "(empty)", "output");
    } else {
      const output = items
        .map((i) => (i.type === "folder" ? `${i.name}/` : `${i.name}`))
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
      const lines = files[filePath].split("\n");
      lines.forEach((line) => addTerminalLine(terminalId, line, "output"));
    } else {
      addTerminalLine(
        terminalId,
        `cat: ${filePath}: No such file or directory`,
        "error",
      );
    }
  };

  const handleHelpCommand = (terminalId) => {
    addTerminalLine(terminalId, "Available Commands:", "info");
    addTerminalLine(terminalId, "", "output");
    addTerminalLine(terminalId, "File Operations:", "info");
    addTerminalLine(
      terminalId,
      "  ls [path]     - List directory contents",
      "output",
    );
    addTerminalLine(
      terminalId,
      "  cat <file>    - Display file contents",
      "output",
    );
    addTerminalLine(
      terminalId,
      "  touch <file>  - Create a new file",
      "output",
    );
    addTerminalLine(
      terminalId,
      "  mkdir <dir>   - Create a new directory",
      "output",
    );
    addTerminalLine(terminalId, "  rm <file>     - Remove a file", "output");
    addTerminalLine(terminalId, "", "output");
    addTerminalLine(terminalId, "Package Management:", "info");
    addTerminalLine(
      terminalId,
      "  npm install <pkg>   - Install a package from npm",
      "output",
    );
    addTerminalLine(
      terminalId,
      "  npm uninstall <pkg> - Remove a package",
      "output",
    );
    addTerminalLine(
      terminalId,
      "  npm list            - List installed packages",
      "output",
    );
    addTerminalLine(
      terminalId,
      "  npm search <query>  - Search npm for packages",
      "output",
    );
    addTerminalLine(
      terminalId,
      "  npm info <pkg>      - View package details",
      "output",
    );
    addTerminalLine(
      terminalId,
      "  npm run dev         - Start development server",
      "output",
    );
    addTerminalLine(
      terminalId,
      "  npm run build       - Build for production",
      "output",
    );
    addTerminalLine(terminalId, "", "output");
    addTerminalLine(terminalId, "Other:", "info");
    addTerminalLine(terminalId, "  clear         - Clear terminal", "output");
    addTerminalLine(
      terminalId,
      "  pwd           - Print working directory",
      "output",
    );
    addTerminalLine(terminalId, "  echo <text>   - Print text", "output");
    addTerminalLine(terminalId, "  help          - Show this help", "output");
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
            text: `Welcome to Terminal ${newId}! Type 'help' for commands.`,
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
    toast.success("New terminal opened!");
  };

  const closeTerminal = (terminalId) => {
    if (terminals.length <= 1) {
      toast.warning("Cannot close the last terminal");
      return;
    }
    setTerminals((prev) => prev.filter((t) => t.id !== terminalId));
    if (activeTerminal === terminalId) {
      setActiveTerminal(terminals.find((t) => t.id !== terminalId)?.id || 1);
    }
    setSplitTerminal(false);
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

  const handleEditorChange = (value) => {
    if (value !== files[activeFile]) {
      setFiles({ ...files, [activeFile]: value });
      awardPoints(1, "Code Edit");
      setSessionStats((prev) => ({
        ...prev,
        edits: prev.edits + 1,
        streak: prev.streak + 1,
      }));
      // Sync package.json -> installedPackages when user edits package.json
      if (activeFile === "package.json") {
        try {
          const pkg = JSON.parse(value || "{}");
          const deps = pkg.dependencies ? Object.keys(pkg.dependencies) : [];
          if (deps.length >= 0) {
            setInstalledPackages((prev) => {
              const same =
                prev.length === deps.length &&
                deps.every((d) => prev.includes(d));
              return same ? prev : deps.length ? deps : ["react", "react-dom"];
            });
          }
        } catch {
          // ignore parse errors
        }
      }
    }
  };

  const runCode = () => {
    setPreviewKey((prev) => prev + 1);
    awardPoints(5, "Run Code");
    setSessionStats((prev) => ({ ...prev, runs: prev.runs + 1 }));
    toast.success("⚡ Running code...");
  };

  const awardPoints = (amount) => {
    setPoints((prev) => prev + amount);
  };

  // AI Chat handler function
  const handleAIChat = async () => {
    if (!aiInput.trim() || aiLoading) return;

    const userMessage = aiInput.trim();
    setAiInput("");
    setAiChat((prev) => [...prev, { role: "user", content: userMessage }]);
    setAiLoading(true);

    try {
      // Include current code context
      const currentCode = files[activeFile] || "";
      const context = {
        type: "game-development",
        currentFile: activeFile,
        codeSnippet: currentCode.substring(0, 1000), // First 1000 chars for context
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

    // Auto-scroll chat
    if (aiChatRef.current) {
      setTimeout(() => {
        aiChatRef.current.scrollTop = aiChatRef.current.scrollHeight;
      }, 100);
    }
  };

  // Generate context-aware AI tip based on current activity
  const generateContextualTip = async () => {
    if (aiLoading || !aiTipsEnabled) return;

    setAiLoading(true);

    try {
      // Gather comprehensive context
      const currentCode = files[activeFile] || "";
      const hasErrors = recentErrors.length > 0;
      const errorSummary = recentErrors
        .slice(-3)
        .map((e) => e.message)
        .join("; ");
      const codePatterns = analyzeCodePatterns(currentCode);
      const sessionContext = {
        edits: sessionStats.edits,
        runs: sessionStats.runs,
        sessionTime: sessionStats.sessionTime,
        filesCount: Object.keys(files).length,
        packagesCount: installedPackages.length,
      };

      // Build intelligent tip request
      let tipPrompt = "";

      if (hasErrors) {
        tipPrompt = `The user has these recent errors in their code: "${errorSummary}". 
        Provide a helpful tip to fix these issues. Be specific and give code examples if needed.`;
      } else if (codePatterns.hasUnusedVariables) {
        tipPrompt = `I noticed there might be unused variables or imports in the code. 
        Provide a tip about keeping code clean and removing unused code.`;
      } else if (codePatterns.missingErrorHandling) {
        tipPrompt = `The code appears to lack error handling (try-catch blocks). 
        Provide a tip about proper error handling in React games.`;
      } else if (codePatterns.noComments && currentCode.length > 500) {
        tipPrompt = `The code has grown but lacks comments. 
        Provide a tip about the importance of code documentation.`;
      } else if (sessionContext.runs === 0 && sessionContext.edits > 5) {
        tipPrompt = `The user has made ${sessionContext.edits} edits but hasn't run the code yet. 
        Encourage them to test their code frequently.`;
      } else if (codePatterns.hasConsoleLog && sessionContext.runs > 5) {
        tipPrompt = `Good use of console.log for debugging! 
        Provide an advanced debugging tip or suggest using the browser DevTools.`;
      } else if (codePatterns.hasUseEffect) {
        tipPrompt = `I see useEffect hooks in the code. 
        Provide a tip about useEffect best practices, cleanup functions, or dependency arrays.`;
      } else if (codePatterns.hasState && sessionContext.sessionTime > 10) {
        tipPrompt = `The user is working with React state. 
        Provide a tip about state management patterns or performance optimization.`;
      } else {
        // General game development tips
        const generalTips = [
          "Provide a tip about optimizing React game performance using useMemo or useCallback.",
          "Share a tip about creating smooth animations in React games.",
          "Explain a game design pattern like the game loop or entity-component system.",
          "Provide a tip about handling keyboard input efficiently in games.",
          "Share advice about organizing game code into reusable components.",
          "Explain how to implement a simple particle system for visual effects.",
          "Provide a tip about managing game audio and sound effects.",
          "Share best practices for handling collision detection.",
        ];
        tipPrompt = generalTips[Math.floor(Math.random() * generalTips.length)];
      }

      const context = {
        type: "contextual-tip",
        currentFile: activeFile,
        codeSnippet: currentCode.substring(0, 1500),
        projectFiles: Object.keys(files),
        sessionStats: sessionContext,
        hasErrors,
        installedPackages,
      };

      const response = await tutorAPI.ask(
        `You are a friendly AI coding companion. ${tipPrompt}
        
        Keep your response concise (2-4 paragraphs max). Use emojis to be engaging.
        If providing code, keep it short and relevant.
        End with an encouraging message.`,
        context,
      );

      setAiChat((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Tip: ${response.data.answer}`,
          isTip: true,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);

      lastTipTimeRef.current = Date.now();

      // Show notification if AI panel is closed
      if (!showAICompanion) {
        toast.info("Your AI assistant has a tip for you!", {
          autoClose: 5000,
          onClick: () => setShowAICompanion(true),
        });
      }

      // Auto-scroll chat
      if (aiChatRef.current) {
        setTimeout(() => {
          aiChatRef.current.scrollTop = aiChatRef.current.scrollHeight;
        }, 100);
      }
    } catch (error) {
      console.error("Failed to generate tip:", error);
    } finally {
      setAiLoading(false);
    }
  };

  // Analyze code patterns for context-aware tips
  const analyzeCodePatterns = (code) => {
    if (!code) return {};

    return {
      hasUseState: /useState\s*\(/.test(code),
      hasUseEffect: /useEffect\s*\(/.test(code),
      hasUseCallback: /useCallback\s*\(/.test(code),
      hasUseMemo: /useMemo\s*\(/.test(code),
      hasConsoleLog: /console\.(log|error|warn)/.test(code),
      hasState: /\[.*,\s*set.*\]\s*=\s*useState/.test(code),
      hasEventListener: /addEventListener|onKey|onClick|onMouse/.test(code),
      hasAnimation: /animation|@keyframes|transition|transform/.test(code),
      hasUnusedVariables: /const\s+\w+\s*=(?!.*\1)/.test(code), // Simplified check
      missingErrorHandling: code.includes("async") && !code.includes("try"),
      noComments: !code.includes("//") && !code.includes("/*"),
      linesOfCode: code.split("\n").length,
    };
  };

  // Periodic tip timer (15-30 minutes random interval)
  useEffect(() => {
    if (!aiTipsEnabled) return;

    const scheduleNextTip = () => {
      // Random interval between 15-30 minutes (900000 - 1800000 ms)
      const minInterval = 15 * 60 * 1000; // 15 minutes
      const maxInterval = 30 * 60 * 1000; // 30 minutes
      const interval =
        Math.floor(Math.random() * (maxInterval - minInterval + 1)) +
        minInterval;

      tipTimerRef.current = setTimeout(() => {
        // Only generate tip if user has been active (made edits or runs)
        if (sessionStats.edits > 0 || sessionStats.runs > 0) {
          generateContextualTip();
        }
        scheduleNextTip(); // Schedule next tip
      }, interval);
    };

    // Initial tip after 5 minutes of activity
    const initialTipTimer = setTimeout(
      () => {
        if (sessionStats.edits > 2) {
          generateContextualTip();
        }
        scheduleNextTip();
      },
      5 * 60 * 1000,
    );

    return () => {
      clearTimeout(initialTipTimer);
      if (tipTimerRef.current) {
        clearTimeout(tipTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiTipsEnabled]);

  // Track errors from console for context-aware tips
  useEffect(() => {
    const errors = consoleLogs.filter((log) => log.level === "error");
    if (errors.length > 0) {
      setRecentErrors(errors.slice(-5));
    }
  }, [consoleLogs]);

  // Track code changes for context awareness
  useEffect(() => {
    if (activeFile && files[activeFile]) {
      lastEditedCodeRef.current = files[activeFile];
    }
  }, [activeFile, files]);

  // Context menu handlers
  const handleContextMenu = (e, target, type) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ show: true, x: e.clientX, y: e.clientY, target, type });
  };

  const handleCreateModalSubmit = () => {
    if (!newItemName.trim()) {
      toast.error("Please enter a file or folder name.");
      return;
    }

    const fullPath = createModalPath
      ? `${createModalPath}/${newItemName}`
      : newItemName;

    if (createModalType === "file") {
      // Determine default content based on extension
      let defaultContent = "";
      if (newItemName.endsWith(".jsx")) {
        defaultContent = `import React from 'react';\n\nconst ${newItemName.replace(".jsx", "")} = () => {\n  return (\n    <div>\n      \n    </div>\n  );\n};\n\nexport default ${newItemName.replace(".jsx", "")};`;
      } else if (newItemName.endsWith(".css")) {
        defaultContent = `/* Styles for ${newItemName} */\n`;
      } else if (newItemName.endsWith(".js")) {
        defaultContent = `// ${newItemName}\n\nexport const example = () => {\n  \n};\n`;
      }
      createFile(fullPath, defaultContent);
    } else {
      createFolder(fullPath);
    }

    setShowCreateModal(false);
    setNewItemName("");
    setCreateModalPath("");
  };

  const generatePreviewContent = () => {
    try {
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
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${projectName}</title>
  <style>
    * { box-sizing: border-box; }
    body { 
      margin: 0; 
      padding: 0; 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    }
    #root { width: 100%; min-height: 100vh; }
    ${appCss}
  </style>
</head>
<body>
  <div id="root"></div>
  
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  
  <script>
    // Override console methods to send messages to parent
    (function() {
      const originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info
      };
      
      function sendToParent(type, args) {
        try {
          const message = args.map(arg => {
            if (typeof arg === 'object') {
              try { return JSON.stringify(arg, null, 2); }
              catch { return String(arg); }
            }
            return String(arg);
          }).join(' ');
          
          window.parent.postMessage({
            type: 'console',
            level: type,
            message: message,
            timestamp: new Date().toISOString()
          }, '*');
        } catch (e) {}
      }
      
      console.log = function(...args) {
        originalConsole.log.apply(console, args);
        sendToParent('log', args);
      };
      
      console.error = function(...args) {
        originalConsole.error.apply(console, args);
        sendToParent('error', args);
      };
      
      console.warn = function(...args) {
        originalConsole.warn.apply(console, args);
        sendToParent('warn', args);
      };
      
      console.info = function(...args) {
        originalConsole.info.apply(console, args);
        sendToParent('info', args);
      };
    })();
  </script>
  
  <script type="text/babel">
    window.onerror = function(msg, url, lineNo, columnNo, error) {
      window.parent.postMessage({
        type: 'console',
        level: 'error',
        message: 'Runtime Error: ' + msg + (lineNo ? ' (line ' + lineNo + ')' : ''),
        timestamp: new Date().toISOString()
      }, '*');
      
      document.body.innerHTML = \`
        <div style="padding: 20px; background: #1e1e1e; color: #cccccc; font-family: 'Consolas', 'Monaco', monospace; min-height: 100vh;">
          <div style="background: #2d2d30; padding: 20px; border-radius: 8px; border-left: 4px solid #f48771;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
              <span style="font-size: 24px;">Error</span>
              <h2 style="margin: 0; color: #f48771;">Runtime Error</h2>
            </div>
            <div style="background: #1e1e1e; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
              <div style="color: #f48771; font-weight: bold; margin-bottom: 8px;">Error:</div>
              <pre style="margin: 0; color: #cccccc; white-space: pre-wrap; word-wrap: break-word;">\${msg}</pre>
            </div>
          </div>
        </div>
      \`;
      return true;
    };

    try {
      const { useState, useEffect, useReducer, useCallback, useMemo, useRef } = React;
      
      ${cleanedJsx}
      
      if (typeof App === 'undefined') {
        throw new Error('App component is not defined.');
      }
      
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(App));
      
    } catch (error) {
      window.parent.postMessage({
        type: 'console',
        level: 'error',
        message: 'Compilation Error: ' + error.message,
        timestamp: new Date().toISOString()
      }, '*');
      
      document.body.innerHTML = \`
        <div style="padding: 20px; background: #1e1e1e; color: #cccccc; font-family: 'Consolas', 'Monaco', monospace; min-height: 100vh;">
          <div style="background: #2d2d30; padding: 20px; border-radius: 8px; border-left: 4px solid #f48771;">
            <h2 style="margin: 0; color: #f48771;">Compilation Error</h2>
            <pre style="margin: 15px 0 0 0; color: #cccccc; white-space: pre-wrap;">\${error.message}</pre>
          </div>
        </div>
      \`;
    }
  </script>
</body>
</html>`;
    } catch {
      return `<!DOCTYPE html><body><h2>Error generating preview</h2></body></html>`;
    }
  };

  // Render file tree recursively
  const renderFileTree = (node, path = "", depth = 0) => {
    const elements = [];

    // Render folders first
    Object.keys(node.folders)
      .sort()
      .forEach((folderName) => {
        const folderPath = path ? `${path}/${folderName}` : folderName;
        const isExpanded = expandedFolders[folderPath];

        elements.push(
          <div key={folderPath}>
            <div
              className={`flex items-center gap-2 rounded-md px-2 py-1 text-xs ${isExpanded ? "bg-white/5 text-slate-100" : "text-slate-300 hover:bg-white/5"}`}
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

    // Render files
    node.files.sort().forEach((fileName) => {
      const filePath = path ? `${path}/${fileName}` : fileName;

      elements.push(
        <div
          key={filePath}
          className={`flex items-center gap-2 rounded-md px-2 py-1 text-xs ${activeFile === filePath ? "bg-emerald-500/10 text-emerald-200" : "text-slate-300 hover:bg-white/5"}`}
          style={{ paddingLeft: `${28 + depth * 16}px` }}
          onClick={() => openFile(filePath)}
          onContextMenu={(e) => handleContextMenu(e, filePath, "file")}
        >
          {getFileIcon(fileName)}
          <span>{fileName}</span>
        </div>,
      );
    });

    return elements;
  };

  const earnedAchievements = Array.isArray(achievements)
    ? achievements.filter((a) => a.earned)
    : [];
  const levelInfo = studioLevelInfo;
  const STUDIO_LEVEL_ICONS = {
    Novice: FaSeedling,
    Apprentice: FaTools,
    Developer: FaLaptopCode,
    Expert: FaFire,
    Master: FaBolt,
    Legend: FaCrown,
  };
  const LevelIcon = STUDIO_LEVEL_ICONS[levelInfo.title] || FaSeedling;
  const fileTree = buildFileTree();

  // Determine packages to display in the Package Manager:
  // - if there's a search query and npmSearchResults exist, show npm results
  // - if there's a query but no npm results, filter local AVAILABLE_PACKAGES
  // - otherwise show all AVAILABLE_PACKAGES
  const displayPackages = (() => {
    const q = packageSearch.trim().toLowerCase();
    if (q) {
      if (Array.isArray(npmSearchResults) && npmSearchResults.length > 0) {
        return npmSearchResults.map((p) => [
          p.name,
          { version: p.version, description: p.description, _source: "npm" },
        ]);
      }
      return Object.entries(AVAILABLE_PACKAGES).filter(
        ([name, info]) =>
          name.toLowerCase().includes(q) ||
          (info.description || "").toLowerCase().includes(q),
      );
    }
    return Object.entries(AVAILABLE_PACKAGES);
  })();

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      <input
        id="custom-studio-import-input"
        type="file"
        accept=".json"
        onChange={importProject}
        className="hidden"
        aria-hidden="true"
      />
      {/* Top Bar – primary actions + grouped menus */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-slate-900/80 px-4 py-2 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10 transition shrink-0"
          >
            <FaChevronLeft />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 min-w-0">
            <FaReact className="text-cyan-300 shrink-0" />
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-transparent text-sm text-white placeholder:text-slate-500 outline-none min-w-0 max-w-[160px] sm:max-w-[220px]"
              placeholder="Project Name"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden md:flex items-center gap-2">
            <motion.div
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs"
              whileHover={{ scale: 1.02 }}
              style={{ borderColor: levelInfo.color }}
            >
              <LevelIcon className="text-base" />
              <span className="text-slate-200">
                {levelInfo.level} · {levelInfo.title}
              </span>
            </motion.div>
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300">
              <FaStar className="text-amber-400" />
              <span>{points} pts</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span title="Runs"><FaBolt /> {sessionStats.runs}</span>
              <span title="Edits"><FaCode /> {sessionStats.edits}</span>
              <span title="Files"><FaFile /> {Object.keys(files).length}</span>
              <span title="Packages"><FaCube /> {installedPackages.length}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 border-l border-white/10 pl-2">
            <button
              onClick={runCode}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-400/40 bg-emerald-400/10 text-emerald-100 text-sm font-medium hover:bg-emerald-400/20 transition"
              title="Run preview"
            >
              <FaPlay /> <span className="hidden sm:inline">Run</span>
            </button>
            <button
              onClick={saveProject}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-slate-200 text-sm font-medium hover:bg-white/10 transition"
              title="Save project"
            >
              <FaSave /> <span className="hidden sm:inline">Save</span>
            </button>
            {autoSaveEnabled && (
              <span
                className="rounded-lg bg-emerald-500/20 px-2 py-1 text-[10px] text-emerald-200"
                title="Autosave is enabled"
              >
                Auto
              </span>
            )}

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
                icon={FaRocket}
                label="New Game"
                onClick={() => {
                  navigate("/game-planning", { state: { fromStudio: true } });
                  setOpenToolbarMenu(null);
                }}
              />
              {planningBoard && (
                <DropdownItem
                  icon={FaRoute}
                  label="View plan"
                  onClick={() => {
                    navigate("/game-planning", { state: { planningBoard } });
                    setOpenToolbarMenu(null);
                  }}
                />
              )}
              <DropdownDivider />
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
              <DropdownItem
                icon={FaUpload}
                label="Import project..."
                onClick={() => {
                  setOpenToolbarMenu(null);
                  setTimeout(
                    () =>
                      document
                        .getElementById("custom-studio-import-input")
                        ?.click(),
                    0,
                  );
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
                label={showAICompanion ? "Hide AI Helper" : "AI Helper"}
                onClick={() => {
                  setShowAICompanion(!showAICompanion);
                  setOpenToolbarMenu(null);
                }}
              />
              <DropdownItem
                icon={FaNpm}
                label="Packages"
                onClick={() => {
                  setShowPackageModal(true);
                  setOpenToolbarMenu(null);
                }}
              />
              <DropdownItem
                icon={FaTrophy}
                label={`Achievements (${earnedAchievements.length}/${achievements.length})`}
                onClick={() => {
                  setShowAchievements(!showAchievements);
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
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - File Explorer */}
        <div className="flex w-72 flex-col border-r border-white/10 bg-slate-900/70">
          <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/90 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            <span>Explorer</span>
            <DropdownMenu
              align="right"
              trigger={
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300 hover:bg-white/10 hover:text-white transition"
                  title="Add"
                >
                  <FaPlus className="text-[10px]" />
                  <span>Add</span>
                </button>
              }
            >
              <DropdownItem
                icon={FaFileMedical}
                label="New File"
                onClick={() => {
                  setCreateModalType("file");
                  setCreateModalPath("src");
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
              <DropdownDivider />
              <DropdownItem
                icon={FaSyncAlt}
                label="Refresh tree"
                onClick={() => toast.info("File tree refreshed")}
              />
            </DropdownMenu>
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-3 text-xs">
            {renderFileTree(fileTree.root)}
          </div>

          {/* Installed Packages */}
          <div className="border-t border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/90 px-3 py-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Packages ({installedPackages.length})
              </span>
              <button
                onClick={() => setShowPackageModal(true)}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/20 transition"
                title="Manage Packages"
              >
                <FaPlus className="text-[10px]" />
              </button>
            </div>
            <div className="max-h-40 overflow-y-auto px-2 py-3 text-xs text-slate-300">
              {installedPackages.length === 0 ? (
                <div className="text-center text-slate-500 py-2">
                  <FaCube className="mx-auto mb-2 text-lg opacity-50" />
                  <p className="text-[10px]">No packages installed</p>
                  <button
                    onClick={() => setShowPackageModal(true)}
                    className="mt-2 text-emerald-400 hover:underline text-[10px]"
                  >
                    + Add packages
                  </button>
                </div>
              ) : (
                installedPackages.map((pkg) => (
                  <div
                    key={pkg}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 mb-2 group"
                  >
                    <div className="flex items-center gap-2">
                      <FaCube className="text-rose-200" />
                      <span>{pkg}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">
                        {AVAILABLE_PACKAGES[pkg]?.version || "latest"}
                      </span>
                      <button
                        onClick={() => {
                          setInstalledPackages((prev) =>
                            prev.filter((p) => p !== pkg),
                          );
                          toast.info(`Removed ${pkg}`);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-300 transition"
                        title="Remove package"
                      >
                        <FaTimes className="text-[10px]" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Editor + Terminal Column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Editor Section */}
          <div
            className="flex min-h-0 flex-1 flex-col bg-slate-950/40"
            style={{ flex: showTerminal ? "1" : "1 1 100%" }}
          >
            <div className="flex items-center gap-1 border-b border-white/10 bg-slate-900/80 px-2">
              {openFiles.map((file) => (
                <div
                  key={file}
                  className={`group flex items-center gap-2 rounded-t-xl border border-transparent px-3 py-2 text-xs text-slate-300 transition ${activeFile === file ? "bg-slate-900 text-white border-white/10" : "hover:bg-white/5"}`}
                  onClick={() => setActiveFile(file)}
                >
                  {getFileIcon(file)}
                  <span>{file.split("/").pop()}</span>
                  {openFiles.length > 1 && (
                    <FaTimes
                      className="text-slate-500 transition group-hover:text-slate-200"
                      onClick={(e) => closeFile(file, e)}
                    />
                  )}
                </div>
              ))}
              <div className="flex-1" />
            </div>

            <div className="flex min-h-0 flex-1">
              {activeFile ? (
                <Editor
                  height="100%"
                  width="100%"
                  language={getLanguage(activeFile)}
                  value={files[activeFile] || ""}
                  theme="vs-dark"
                  onChange={handleEditorChange}
                  options={{
                    fontSize: 14,
                    fontFamily:
                      "'Fira Code', 'Cascadia Code', Consolas, monospace",
                    minimap: { enabled: true },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    lineNumbers: "on",
                    folding: true,
                    bracketPairColorization: { enabled: true },
                    tabSize: 2,
                    wordWrap: "on",
                  }}
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-slate-400">
                  <FaFileCode className="text-3xl" />
                  <p>Select a file to edit</p>
                </div>
              )}
            </div>
          </div>

          {/* Terminal Section */}
          {showTerminal && (
            <div
              className="border-t border-white/10 bg-black/70 text-slate-200 text-xs font-mono"
              style={{ height: `${terminalHeight}px` }}
            >
              <div
                className="h-2 cursor-row-resize bg-white/5"
                onMouseDown={(e) => {
                  const startY = e.clientY;
                  const startHeight = terminalHeight;
                  const onMouseMove = (moveEvent) => {
                    const delta = startY - moveEvent.clientY;
                    setTerminalHeight(
                      Math.min(Math.max(100, startHeight + delta), 500),
                    );
                  };
                  const onMouseUp = () => {
                    document.removeEventListener("mousemove", onMouseMove);
                    document.removeEventListener("mouseup", onMouseUp);
                  };
                  document.addEventListener("mousemove", onMouseMove);
                  document.addEventListener("mouseup", onMouseUp);
                }}
              />
              <div className="flex items-center justify-between border-b border-white/10 bg-black/60 px-3 py-2">
                <div className="flex items-center gap-2">
                  {terminals.map((term) => (
                    <div
                      key={term.id}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-1 text-xs transition ${activeTerminal === term.id ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"}`}
                      onClick={() => setActiveTerminal(term.id)}
                    >
                      <FaTerminal />
                      <span>{term.name}</span>
                      {terminals.length > 1 && (
                        <FaTimes
                          className="text-slate-400 hover:text-slate-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            closeTerminal(term.id);
                          }}
                        />
                      )}
                    </div>
                  ))}
                  {terminals.length < 2 && (
                    <button
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5"
                      onClick={addNewTerminal}
                      title="New Terminal"
                    >
                      <FaPlus />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs transition ${splitTerminal ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"}`}
                    onClick={() => {
                      if (terminals.length < 2) addNewTerminal();
                      else setSplitTerminal(!splitTerminal);
                    }}
                    title="Split Terminal"
                  >
                    <FaColumns />
                  </button>
                  <button
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs text-slate-300 hover:bg-white/10"
                    onClick={() => setShowTerminal(false)}
                    title="Hide Terminal"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>

              <div
                className={`grid gap-2 p-3 ${splitTerminal ? "grid-cols-2" : "grid-cols-1"}`}
              >
                {terminals.map((term) =>
                  !splitTerminal && term.id !== activeTerminal ? null : (
                    <div
                      key={term.id}
                      className="flex flex-col rounded-xl border border-white/10 bg-black/60"
                    >
                      <div className="flex-1 overflow-y-auto px-3 py-2 text-xs">
                        {term.history.length === 0 && (
                          <div className="flex flex-col gap-1 text-slate-400">
                            <span className="text-emerald-300">
                              Welcome to GamiLearn Terminal!
                            </span>
                            <span>
                              Type <code>help</code> for available commands.
                            </span>
                          </div>
                        )}
                        {term.history.map((line, i) => (
                          <div
                            key={i}
                            className={`py-0.5 ${line.type === "error" ? "text-rose-400" : line.type === "warn" ? "text-amber-300" : line.type === "success" ? "text-emerald-300" : "text-slate-200"}`}
                          >
                            {line.text}
                          </div>
                        ))}
                        {term.isRunning && (
                          <div className="flex items-center gap-2 text-emerald-300">
                            <FaSyncAlt className="animate-spin" /> Running...
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 border-t border-white/10 bg-black/70 px-3 py-2">
                        <span className="text-emerald-300">$</span>
                        <input
                          ref={
                            term.id === 1 ? terminalInputRef : terminal2InputRef
                          }
                          type="text"
                          className="flex-1 bg-transparent text-slate-100 placeholder:text-slate-500 outline-none"
                          value={term.currentInput}
                          onChange={(e) =>
                            updateTerminalInput(term.id, e.target.value)
                          }
                          onKeyDown={(e) => handleTerminalKeyDown(e, term.id)}
                          placeholder="Type a command..."
                          disabled={term.isRunning}
                        />
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          {!showTerminal && (
            <button
              className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-200"
              onClick={() => setShowTerminal(true)}
            >
              <FaTerminal /> Terminal
            </button>
          )}
        </div>

        {/* Preview Panel */}
        <div className="flex w-[420px] flex-col border-l border-white/10 bg-slate-900/70">
          <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/90 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            <span>Preview</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
                <button
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs ${previewMode === "desktop" ? "bg-white/10 text-white" : "text-slate-400"}`}
                  onClick={() => setPreviewMode("desktop")}
                  title="Desktop View"
                >
                  <FaDesktop />
                </button>
                <button
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs ${previewMode === "mobile" ? "bg-white/10 text-white" : "text-slate-400"}`}
                  onClick={() => setPreviewMode("mobile")}
                  title="Mobile View"
                >
                  <FaMobileAlt />
                </button>
              </div>
              <button
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs"
                onClick={runCode}
                title="Refresh Preview"
              >
                <FaSyncAlt />
              </button>
            </div>
          </div>

          <div className="flex-1 p-3">
            <div
              className={`h-full rounded-2xl border border-white/10 bg-gray-900 ${previewMode === "mobile" ? "mx-auto w-[280px]" : "w-full"}`}
            >
              <iframe
                key={previewKey}
                ref={iframeRef}
                className="h-full w-full rounded-2xl bg-white"
                title="preview"
                srcDoc={generatePreviewContent()}
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>

          {/* Console Panel */}
          <div
            className={`border-t border-white/10 bg-slate-950/80 ${showConsole ? "max-h-64" : "max-h-12"} transition-all`}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-xs text-slate-300">
              <div className="flex items-center gap-2 font-semibold uppercase tracking-[0.2em] text-[10px]">
                <FaTerminal />
                <span>Console</span>
                {consoleLogs.length > 0 && (
                  <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] text-rose-200">
                    {consoleLogs.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-slate-200"
                  value={consoleFilter}
                  onChange={(e) => setConsoleFilter(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="log">Log</option>
                  <option value="warn">Warn</option>
                  <option value="error">Error</option>
                  <option value="info">Info</option>
                </select>
                <button
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs"
                  onClick={clearConsole}
                  title="Clear Console"
                >
                  <FaTrash />
                </button>
                <button
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs"
                  onClick={() => setShowConsole(!showConsole)}
                  title={showConsole ? "Collapse" : "Expand"}
                >
                  {showConsole ? <FaChevronDown /> : <FaChevronRight />}
                </button>
              </div>
            </div>
            {showConsole && (
              <div className="max-h-48 overflow-y-auto px-3 py-2 text-xs font-mono text-slate-200">
                {consoleLogs.length === 0 ? (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-slate-400">
                    No console output yet. Run your code to see logs here.
                  </div>
                ) : (
                  consoleLogs
                    .filter(
                      (log) =>
                        consoleFilter === "all" || log.level === consoleFilter,
                    )
                    .map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-2 border-b border-white/5 py-2"
                      >
                        <span className="text-[10px] text-slate-500">
                          {log.timestamp}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${log.level === "error" ? "bg-rose-500/20 text-rose-200" : log.level === "warn" ? "bg-amber-500/20 text-amber-200" : log.level === "info" ? "bg-blue-500/20 text-blue-200" : "bg-emerald-500/20 text-emerald-200"}`}
                        >
                          {log.level}
                        </span>
                        <span className="text-slate-200">{log.message}</span>
                      </div>
                    ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu.show && (
        <div
          className="fixed z-50 w-44 rounded-xl border border-white/10 bg-slate-900/95 p-1 text-xs text-slate-200"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === "file" && (
            <>
              <div
                className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-white/5"
                onClick={() => {
                  openFile(contextMenu.target);
                  setContextMenu({
                    show: false,
                    x: 0,
                    y: 0,
                    target: null,
                    type: null,
                  });
                }}
              >
                <FaFileCode /> Open
              </div>
              <div
                className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-white/5"
                onClick={() => {
                  const name = prompt(
                    "Enter new name:",
                    contextMenu.target.split("/").pop(),
                  );
                  if (name) renameFile(contextMenu.target, name);
                  setContextMenu({
                    show: false,
                    x: 0,
                    y: 0,
                    target: null,
                    type: null,
                  });
                }}
              >
                <FaCog /> Rename
              </div>
              <div className="my-1 h-px bg-white/10" />
              <div
                className="flex items-center gap-2 rounded-lg px-2 py-2 text-rose-300 hover:bg-rose-500/10"
                onClick={() => {
                  if (confirm(`Delete ${contextMenu.target}?`)) {
                    deleteFile(contextMenu.target);
                  }
                  setContextMenu({
                    show: false,
                    x: 0,
                    y: 0,
                    target: null,
                    type: null,
                  });
                }}
              >
                <FaTrash /> Delete
              </div>
            </>
          )}
          {contextMenu.type === "folder" && (
            <>
              <div
                className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-white/5"
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
              >
                <FaFileMedical /> New File
              </div>
              <div
                className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-white/5"
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
              >
                <FaFolderPlus /> New Folder
              </div>
              <div className="my-1 h-px bg-white/10" />
              <div
                className="flex items-center gap-2 rounded-lg px-2 py-2 text-rose-300 hover:bg-rose-500/10"
                onClick={() => {
                  if (
                    confirm(
                      `Delete folder ${contextMenu.target} and all its contents?`,
                    )
                  ) {
                    deleteFolder(contextMenu.target);
                  }
                  setContextMenu({
                    show: false,
                    x: 0,
                    y: 0,
                    target: null,
                    type: null,
                  });
                }}
              >
                <FaTrash /> Delete Folder
              </div>
            </>
          )}
        </div>
      )}

      {/* Create File/Folder Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 text-slate-200"
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                  {createModalType === "file" ? (
                    <FaFileMedical />
                  ) : (
                    <FaFolderPlus />
                  )}
                  Create New {createModalType === "file" ? "File" : "Folder"}
                </h3>
                <button
                  className="rounded-full border border-white/10 bg-white/5 p-2 text-xs"
                  onClick={() => setShowCreateModal(false)}
                >
                  <FaTimes />
                </button>
              </div>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">
                    Location
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200">
                    <FaFolder /> {createModalPath || "/ (root)"}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">
                    {createModalType === "file" ? "File Name" : "Folder Name"}
                  </label>
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder={
                      createModalType === "file"
                        ? "e.g., Component.jsx"
                        : "e.g., components"
                    }
                    autoFocus
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleCreateModalSubmit()
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                  />
                </div>
                {createModalType === "file" && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
                      onClick={() => setNewItemName("Component.jsx")}
                    >
                      .jsx
                    </button>
                    <button
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
                      onClick={() => setNewItemName("styles.css")}
                    >
                      .css
                    </button>
                    <button
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
                      onClick={() => setNewItemName("utils.js")}
                    >
                      .js
                    </button>
                    <button
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
                      onClick={() => setNewItemName("data.json")}
                    >
                      .json
                    </button>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 border-t border-white/10 pt-3">
                <button
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-300"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-400/10 px-4 py-2 text-xs text-emerald-100"
                  onClick={handleCreateModalSubmit}
                >
                  <FaCheck /> Create
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPackageModal(false)}
          >
            <motion.div
              className="w-full max-w-4xl rounded-2xl border border-white/10 bg-slate-900 p-6 text-slate-200"
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                  <FaNpm /> Package Manager
                </h3>
                <button
                  className="rounded-full border border-white/10 bg-white/5 p-2 text-xs"
                  onClick={() => setShowPackageModal(false)}
                >
                  <FaTimes />
                </button>
              </div>
              <div className="space-y-6 py-4">
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
                  <FaSearch className="text-slate-400" />
                  <input
                    type="text"
                    value={packageSearch}
                    onChange={(e) => setPackageSearch(e.target.value)}
                    placeholder="Search packages..."
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
                  />
                  {npmSearching ? (
                    <FaSyncAlt
                      className="animate-spin text-slate-400"
                      aria-hidden="true"
                      title="Searching..."
                    />
                  ) : null}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Installed ({installedPackages.length})
                    </h4>
                    <div className="space-y-2">
                      {installedPackages.map((pkg) => (
                        <div
                          key={pkg}
                          className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <FaCube className="text-emerald-300" />
                            <div>
                              <div className="text-sm font-semibold text-white">
                                {pkg}
                              </div>
                              <div className="text-xs text-slate-400">
                                {AVAILABLE_PACKAGES[pkg]?.version || "latest"}
                              </div>
                            </div>
                          </div>
                          <button
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs text-rose-200"
                            onClick={() => {
                              setInstalledPackages((prev) =>
                                prev.filter((p) => p !== pkg),
                              );
                              toast.success(`Removed ${pkg}`);
                            }}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Available
                    </h4>
                    <div className="space-y-2">
                      {displayPackages.map(([name, info]) => (
                        <div
                          key={`${name}-${info._source || "local"}`}
                          className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <FaCube className="text-slate-300" />
                            <div>
                              <div className="text-sm font-semibold text-white">
                                {name}
                              </div>
                              <div className="text-xs text-slate-400">
                                {info.description}
                              </div>
                            </div>
                          </div>
                          <button
                            className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100"
                            onClick={() => {
                              setInstalledPackages((prev) => [...prev, name]);
                              setSessionStats((prev) => ({
                                ...prev,
                                packagesInstalled: prev.packagesInstalled + 1,
                              }));
                              awardPoints(5, "Install Package");
                              toast.success(
                                `Installed ${name}@${info.version}`,
                              );
                            }}
                          >
                            <FaPlus /> Install
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Achievements Panel */}
      <AnimatePresence>
        {showAchievements && (
          <motion.div
            className="fixed right-4 top-20 z-40 w-96 rounded-2xl border border-white/10 bg-slate-900/90 p-4 text-slate-200"
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                <FaTrophy /> Achievements
              </h3>
              <button
                onClick={() => setShowAchievements(false)}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-xs"
              >
                <FaTimes />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 py-4">
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <FaStar className="text-amber-300" />
                <div>
                  <div className="text-lg font-semibold text-white">
                    {points}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                    Total Points
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <FaTrophy className="text-rose-300" />
                <div>
                  <div className="text-lg font-semibold text-white">
                    {earnedAchievements.length}/{achievements.length}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                    Unlocked
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              {achievements.map((ach) => (
                <motion.div
                  key={ach.id}
                  className={`relative rounded-2xl border p-3 ${ach.earned ? "border-emerald-400/40 bg-emerald-400/10" : "border-white/10 bg-white/5 opacity-70"}`}
                  whileHover={ach.earned ? { scale: 1.05 } : {}}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {renderAchievementIcon(
                    ach.icon,
                    ach.name,
                    "h-10 w-10 text-amber-300",
                  )}
                  <div className="mt-2 space-y-1">
                    <h4 className="text-sm font-semibold text-white">
                      {ach.name}
                    </h4>
                    <p className="text-xs text-slate-300">{ach.description}</p>
                    <div className="flex items-center gap-2 text-xs text-emerald-200">
                      <FaGem className="text-emerald-200" /> {ach.points} pts
                    </div>
                  </div>
                  {ach.earned && (
                    <div className="absolute right-3 top-3 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-200">
                      Earned
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Projects Modal */}
      <AnimatePresence>
        {showProjectsModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowProjectsModal(false)}
          >
            <motion.div
              className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 text-slate-200"
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                  <FaFolder /> Saved Projects
                </h3>
                <button
                  className="rounded-full border border-white/10 bg-white/5 p-2 text-xs"
                  onClick={() => setShowProjectsModal(false)}
                >
                  <FaTimes />
                </button>
              </div>

              <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto">
                {savedProjects.length === 0 ? (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                    <p>
                      No saved projects yet. Create and save your first game!
                    </p>
                  </div>
                ) : (
                  savedProjects.map((project, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10"
                      onClick={() => loadProject(project)}
                    >
                      <FaReact className="text-cyan-300" />
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-white">
                          {project.name}
                        </h4>
                        <p className="text-xs text-slate-400">
                          {new Date(project.timestamp).toLocaleString()}
                        </p>
                        <span className="text-xs text-slate-500">
                          {Object.keys(project.files || {}).length} files
                        </span>
                      </div>
                      <button className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100">
                        Load
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Companion Panel */}
      <AnimatePresence>
        {showAICompanion && (
          <motion.div
            className="fixed right-4 top-20 z-40 flex max-h-[70vh] w-[360px] flex-col rounded-2xl border border-white/10 bg-slate-900/90 p-4 text-slate-200"
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                <FaRobot /> AI Companion
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={generateContextualTip}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs"
                  disabled={aiLoading}
                  title="Get a tip now"
                >
                  <FaLightbulb />
                </button>
                <button
                  onClick={() => setAiTipsEnabled(!aiTipsEnabled)}
                  className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${aiTipsEnabled ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300"}`}
                  title={
                    aiTipsEnabled ? "Disable auto-tips" : "Enable auto-tips"
                  }
                >
                  {aiTipsEnabled ? "Auto tips on" : "Auto tips off"}
                </button>
                <button
                  onClick={() => setShowAICompanion(false)}
                  className="rounded-full border border-white/10 bg-white/5 p-2 text-xs"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            {aiTipsEnabled && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">
                <FaLightbulb /> Auto-tips enabled • Next tip in ~15-30 min
              </div>
            )}

            <div
              className="flex-1 space-y-3 overflow-y-auto py-3"
              ref={aiChatRef}
            >
              {aiChat.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300">
                  <FaRobot className="mb-2 text-xl text-cyan-300" />
                  <h4 className="text-sm font-semibold text-white">
                    Hi! I'm your AI Coding Assistant
                  </h4>
                  <p className="mt-2">I can help you with:</p>
                  <ul className="mt-2 space-y-1">
                    <li>Debugging your code</li>
                    <li>Best practices & tips</li>
                    <li>Game mechanics implementation</li>
                    <li>Code explanations</li>
                  </ul>
                  <p className="mt-3 text-[11px] text-slate-400">
                    I'll also give you helpful tips every 15-30 minutes!
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setAiInput("How can I improve my game code?");
                      }}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px]"
                    >
                      Improve my code
                    </button>
                    <button
                      onClick={() => {
                        setAiInput("Explain how to add animations");
                      }}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px]"
                    >
                      Add animations
                    </button>
                    <button
                      onClick={() => {
                        setAiInput(
                          "What are the best practices for React games?",
                        );
                      }}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px]"
                    >
                      Best practices
                    </button>
                  </div>
                </div>
              ) : (
                aiChat.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    className={`flex items-start gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {msg.role === "assistant" &&
                      (msg.isTip ? (
                        <FaLightbulb className="mt-1 text-amber-300" />
                      ) : (
                        <FaRobot className="mt-1 text-cyan-300" />
                      ))}
                    <div
                      className={`rounded-2xl border px-3 py-2 text-xs ${msg.role === "user" ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100" : "border-white/10 bg-white/5 text-slate-200"}`}
                    >
                      {msg.timestamp && (
                        <span className="mb-1 block text-[10px] text-slate-500">
                          {msg.timestamp}
                        </span>
                      )}
                      {msg.role === "user" ? (
                        <span className="whitespace-pre-wrap">
                          {msg.content}
                        </span>
                      ) : (
                        <MarkdownContent content={msg.content} />
                      )}
                    </div>
                  </motion.div>
                ))
              )}
              {aiLoading && (
                <div className="flex items-start gap-2">
                  <FaRobot className="mt-1 text-cyan-300" />
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
                    <span className="inline-flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0.15s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0.3s]" />
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-2 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !aiLoading && aiInput.trim()) {
                    handleAIChat();
                  }
                }}
                placeholder="Ask anything about your game or code..."
                disabled={aiLoading}
                className="flex-1 bg-transparent text-xs text-slate-100 placeholder:text-slate-500 outline-none"
              />
              <button
                onClick={handleAIChat}
                disabled={aiLoading || !aiInput.trim()}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs"
              >
                <FaComments />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomGameStudio;
