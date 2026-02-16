import { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
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
  FaCopy,
  FaSearch,
  FaCodeBranch,
  FaCode,
  FaExclamationCircle,
  FaCog,
  FaTerminal,
  FaChevronDown,
  FaChevronRight,
  FaTimes,
  FaServer,
  FaUser,
  FaUsers,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

const VSCodeIDE = ({ onPointsEarned, isMultiplayer = false }) => {
  const [files, setFiles] = useState({
    "src/App.jsx": `import { useState } from 'react';
import './App.css';

function App() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Learn React', completed: false },
    { id: 2, text: 'Build a project', completed: false }
  ]);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);

  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, { 
        id: Date.now(), 
        text: input, 
        completed: false 
      }]);
      setInput('');
      setScore(score + 10);
    }
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
    setScore(score + 5);
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  return (
    <div className="App">
      <div className="header">
        <h1>Todo Quest</h1>
        <div className="score">Score: {score} pts</div>
      </div>
      
      <div className="input-section">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          placeholder="Add a new quest..."
        />
        <button onClick={addTodo}>Add Quest</button>
      </div>

      <div className="todos-list">
        {todos.map(todo => (
          <div key={todo.id} className={\`todo-item \${todo.completed ? 'completed' : ''}\`}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span>{todo.text}</span>
            <button onClick={() => deleteTodo(todo.id)} className="delete-btn">
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;`,
    "src/App.css": `.App {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #667eea;
  min-height: 100vh;
}

.header {
  text-align: center;
  color: white;
  margin-bottom: 30px;
}

.header h1 {
  font-size: 2.5rem;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
}

.score {
  font-size: 1.2rem;
  background: rgba(255,255,255,0.2);
  padding: 10px 20px;
  border-radius: 20px;
  display: inline-block;
  margin-top: 10px;
  font-weight: bold;
}

.input-section {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.input-section input {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
}

.input-section button {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s;
}

.input-section button:hover {
  background: #45a049;
  transform: scale(1.05);
}

.todos-list {
  background: white;
  border-radius: 12px;
  padding: 20px;
}

.todo-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #eee;
  transition: all 0.3s;
}

.todo-item:last-child {
  border-bottom: none;
}

.todo-item:hover {
  background: #f5f5f5;
}

.todo-item input[type="checkbox"] {
  width: 20px;
  height: 20px;
  margin-right: 15px;
  cursor: pointer;
}

.todo-item span {
  flex: 1;
  font-size: 1.1rem;
  color: #333;
}

.todo-item.completed span {
  text-decoration: line-through;
  color: #999;
}

.delete-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.3s;
}

.delete-btn:hover {
  opacity: 1;
}`,
    "src/index.jsx": `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
    "index.html": `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React Game</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
  });

  const [openFiles, setOpenFiles] = useState(["src/App.jsx"]);
  const [activeFile, setActiveFile] = useState("src/App.jsx");
  const [expandedFolders, setExpandedFolders] = useState({ src: true });
  const [previewKey, setPreviewKey] = useState(0);
  const [points, setPoints] = useState(0);
  const [achievements, setAchievements] = useState([]);
  const [activeView, setActiveView] = useState("explorer"); // explorer, search, git, extensions
  const [showPanel, setShowPanel] = useState(true);
  const [activePanel, setActivePanel] = useState("preview"); // preview, terminal, problems
  const [previewError, setPreviewError] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const iframeRef = useRef(null);
  const iframe2Ref = useRef(null);

  // Multiplayer states
  const [activePreviewTab, setActivePreviewTab] = useState("player1"); // player1, player2
  const [activeLogTab, setActiveLogTab] = useState("server"); // server, client1, client2
  const [serverLogs, setServerLogs] = useState([
    {
      type: "info",
      message: "Server started on port 3001",
      timestamp: new Date().toLocaleTimeString(),
    },
    {
      type: "info",
      message: "Socket.IO initialized",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [client1Logs, setClient1Logs] = useState([
    {
      type: "info",
      message: "Connecting to server...",
      timestamp: new Date().toLocaleTimeString(),
    },
    {
      type: "success",
      message: "Connected as Player 1",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [client2Logs, setClient2Logs] = useState([
    {
      type: "info",
      message: "Connecting to server...",
      timestamp: new Date().toLocaleTimeString(),
    },
    {
      type: "success",
      message: "Connected as Player 2",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const fileStructure = {
    src: ["App.jsx", "App.css", "index.jsx"],
    root: ["index.html"],
  };

  const getFileIcon = (filename) => {
    if (filename.endsWith(".jsx"))
      return <FaReact className="text-base text-[#61dafb]" />;
    if (filename.endsWith(".html"))
      return <FaHtml5 className="text-base text-[#e34c26]" />;
    if (filename.endsWith(".css"))
      return <FaCss3Alt className="text-base text-[#264de4]" />;
    if (filename.endsWith(".js"))
      return <FaJs className="text-base text-[#f7df1e]" />;
    return <FaFile className="text-base text-[#cccccc]" />;
  };

  const getLanguage = (filename) => {
    if (filename.endsWith(".jsx")) return "javascript";
    if (filename.endsWith(".js")) return "javascript";
    if (filename.endsWith(".css")) return "css";
    if (filename.endsWith(".html")) return "html";
    return "plaintext";
  };

  const toggleFolder = (folder) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folder]: !prev[folder],
    }));
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
      // Award points for coding
      awardPoints(1, "Code Edit");
    }

    setFiles({
      ...files,
      [activeFile]: value,
    });

    // Auto-update preview after a short delay
    if (window.previewUpdateTimeout) {
      clearTimeout(window.previewUpdateTimeout);
    }
    window.previewUpdateTimeout = setTimeout(() => {
      setPreviewKey((prev) => prev + 1);
    }, 1000);
  };

  const awardPoints = (amount, reason) => {
    setPoints((prev) => prev + amount);
    if (onPointsEarned) {
      onPointsEarned(amount, reason);
    }

    // Check for achievements
    checkAchievements(amount, reason);
  };

  const checkAchievements = (amount, reason) => {
    const totalPoints = points + amount;

    if (totalPoints >= 10 && !achievements.includes("first-steps")) {
      setAchievements([...achievements, "first-steps"]);
      showAchievement("First Steps", "Earned 10 points!");
    }

    if (totalPoints >= 50 && !achievements.includes("getting-good")) {
      setAchievements([...achievements, "getting-good"]);
      showAchievement("Getting Good", "Earned 50 points!");
    }

    if (totalPoints >= 100 && !achievements.includes("code-master")) {
      setAchievements([...achievements, "code-master"]);
      showAchievement("👑 Code Master", "Earned 100 points!");
    }
  };

  const AchievementToast = ({ title, message }) => (
    <motion.div
      className="fixed left-1/2 top-4 z-[9999] -translate-x-1/2"
      initial={{ y: -20, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-amber-500/10 px-6 py-4 text-amber-100">
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden
        >
          {Array.from({ length: 7 }).map((_, i) => (
            <motion.span
              key={i}
              className="absolute h-2 w-2 rounded-full bg-amber-400"
              initial={{ x: 0, y: 0, scale: 0.4, opacity: 1 }}
              animate={{
                x: Math.cos((i / 7) * Math.PI * 2) * (40 + i * 6),
                y: Math.sin((i / 7) * Math.PI * 2) * (40 + i * 6),
                scale: [0.6, 1, 0],
                opacity: [1, 0.8, 0],
              }}
              transition={{ delay: i * 0.05, duration: 1.1, ease: "easeOut" }}
            />
          ))}
        </div>

        <div className="relative text-center">
          <h3 className="m-0 text-lg font-bold text-amber-200">{title}</h3>
          <p className="mt-1 text-sm text-amber-100/90">{message}</p>
        </div>
      </div>
    </motion.div>
  );

  const showAchievement = (title, message) => {
    toast(<AchievementToast title={title} message={message} />, {
      position: toast.POSITION.TOP_CENTER,
      autoClose: 3500,
      closeButton: false,
      hideProgressBar: true,
      pauseOnHover: true,
    });
  };

  const runCode = () => {
    console.log("Running code...");
    setPreviewError(null);
    setIsPreviewLoading(true);
    setPreviewKey((prev) => prev + 1);
    awardPoints(5, "Run Code");

    // Simulate multiplayer logs if in multiplayer mode
    if (isMultiplayer) {
      const timestamp = new Date().toLocaleTimeString();
      setServerLogs((prev) => [
        ...prev,
        { type: "info", message: "Game state updated", timestamp },
        { type: "event", message: "Broadcasting to all clients...", timestamp },
      ]);
      setClient1Logs((prev) => [
        ...prev,
        { type: "info", message: "📥 Received game state update", timestamp },
      ]);
      setClient2Logs((prev) => [
        ...prev,
        { type: "info", message: "📥 Received game state update", timestamp },
      ]);
    }

    // Reset loading after iframe loads
    setTimeout(() => {
      setIsPreviewLoading(false);
    }, 1000);
  };

  const saveProject = () => {
    localStorage.setItem("customGameProject", JSON.stringify(files));
    awardPoints(10, "Save Project");
    toast.success("Project saved! 💾 +10 points");
  };

  const generatePreviewContent = () => {
    try {
      const appJsx = files["src/App.jsx"] || "";
      const appCss = files["src/App.css"] || "";

      console.log("Generating preview content...");
      console.log("App.jsx length:", appJsx.length);
      console.log("App.css length:", appCss.length);

      // Remove import statements from JSX as we're using UMD builds
      const cleanedJsx = appJsx
        .replace(/import\s+.*?from\s+['"].*?['"];?\n?/g, "")
        .replace(/export\s+default\s+/g, "")
        .trim();

      console.log("Cleaned JSX:", cleanedJsx.substring(0, 100) + "...");

      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>React Preview</title>
  <style>
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
        'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
        sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    #root {
      width: 100%;
      height: 100vh;
    }
    ${appCss}
  </style>
</head>
<body>
  <div id="root"></div>
  
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  
  <script type="text/babel">
    window.onerror = function(msg, url, lineNo, columnNo, error) {
      console.error('Global error:', msg, error);
      document.body.innerHTML = \`
        <div style="padding: 20px; background: #2d2d30; color: #f48771; font-family: 'Consolas', monospace; height: 100vh;">
          <h2 style="color: #f48771; margin-top: 0;">Runtime Error</h2>
          <pre style="background: #1e1e1e; color: #cccccc; padding: 15px; border-radius: 5px; overflow: auto; border-left: 3px solid #f48771;">\${msg}\n\nLine: \${lineNo}\nColumn: \${columnNo}</pre>
          <p style="color: #cccccc; margin-top: 20px;">Tip: Check your code syntax and variable names.</p>
        </div>
      \`;
      return true;
    };

    try {
      const { useState, useEffect } = React;
      
      console.log('React loaded:', typeof React);
      console.log('ReactDOM loaded:', typeof ReactDOM);
      
      ${cleanedJsx}
      
      if (typeof App === 'undefined') {
        throw new Error('App component is not defined. Make sure your component is exported correctly.');
      }
      
      console.log('App component:', typeof App);
      
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(App));
      
      console.log('App rendered successfully!');
      
    } catch (error) {
      console.error('Render error:', error);
      document.body.innerHTML = \`
        <div style="padding: 20px; background: #2d2d30; color: #f48771; font-family: 'Consolas', monospace; height: 100vh;">
          <h2 style="color: #f48771; margin-top: 0;">Compilation Error</h2>
          <pre style="background: #1e1e1e; color: #cccccc; padding: 15px; border-radius: 5px; overflow: auto; border-left: 3px solid #f48771; white-space: pre-wrap;">\${error.message}</pre>
          <div style="margin-top: 20px; padding: 15px; background: #1e1e1e; border-radius: 5px;">
            <p style="color: #4EC9B0; margin: 0 0 10px 0; font-weight: bold;">Common Issues:</p>
            <ul style="color: #cccccc; margin: 0; padding-left: 20px;">
              <li>Check for missing closing tags or brackets</li>
              <li>Ensure all variables are properly defined</li>
              <li>Verify JSX syntax is correct</li>
              <li>Check for typos in function or variable names</li>
            </ul>
          </div>
        </div>
      \`;
    }
  </script>
</body>
</html>`;
    } catch (error) {
      console.error("Error generating preview:", error);
      setPreviewError(error.message);
      return `<!DOCTYPE html>
<html>
<body style="padding: 20px; font-family: monospace;">
  <h2 style="color: red;">Failed to generate preview</h2>
  <p>${error.message}</p>
</body>
</html>`;
    }
  };

  useEffect(() => {
    const savedProject = localStorage.getItem("customGameProject");
    if (savedProject) {
      setFiles(JSON.parse(savedProject));
    }

    // Cleanup timeout on unmount
    return () => {
      if (window.previewUpdateTimeout) {
        clearTimeout(window.previewUpdateTimeout);
      }
    };
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#1e1e1e] text-[#cccccc]">
      {/* Title Bar */}
      <div className="flex h-[35px] select-none items-center justify-between border-b border-[#2b2b2b] bg-[#323233] px-4">
        <div className="flex items-center gap-2">
          <FaReact className="text-base text-[#61dafb]" />
          <span className="text-[13px] text-[#cccccc]">
            Custom Game Studio - React Project
          </span>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-1.5 rounded bg-[#0e639c] px-3 py-1 text-xs font-semibold text-white">
            <FaTrophy className="text-[#ffd700]" /> {points} pts
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar */}
        <div className="flex w-12 flex-col justify-between border-r border-[#2b2b2b] bg-[#333333]">
          <div className="flex flex-col">
            <div
              className={`flex h-12 w-12 cursor-pointer items-center justify-center text-2xl transition-colors ${activeView === "explorer" ? "border-l-2 border-[#0e639c] bg-transparent text-white" : "text-[#858585] hover:text-[#cccccc]"}`}
              onClick={() => setActiveView("explorer")}
              title="Explorer"
            >
              <FaCopy />
            </div>
            <div
              className={`flex h-12 w-12 cursor-pointer items-center justify-center text-2xl transition-colors ${activeView === "search" ? "border-l-2 border-[#0e639c] bg-transparent text-white" : "text-[#858585] hover:text-[#cccccc]"}`}
              onClick={() => setActiveView("search")}
              title="Search"
            >
              <FaSearch />
            </div>
            <div
              className={`flex h-12 w-12 cursor-pointer items-center justify-center text-2xl transition-colors ${activeView === "git" ? "border-l-2 border-[#0e639c] bg-transparent text-white" : "text-[#858585] hover:text-[#cccccc]"}`}
              onClick={() => setActiveView("git")}
              title="Source Control"
            >
              <FaCodeBranch />
            </div>
          </div>
          <div className="pb-2">
            <div
              className="flex h-12 w-12 cursor-pointer items-center justify-center text-2xl text-[#858585] hover:text-[#cccccc]"
              title="Settings"
            >
              <FaCog />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex w-[250px] flex-col overflow-hidden border-r border-[#2b2b2b] bg-[#252526]">
          {activeView === "explorer" && (
            <div className="flex h-full flex-col">
              <div className="flex h-[35px] items-center justify-between border-b border-[#2b2b2b] bg-[#252526] px-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#cccccc]">
                  EXPLORER
                </span>
                <div className="flex gap-2">
                  <FaSave
                    className="cursor-pointer text-base text-[#858585] transition-colors hover:text-[#cccccc]"
                    onClick={saveProject}
                    title="Save All"
                  />
                </div>
              </div>
              <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto py-2">
                <div className="mb-2">
                  <div className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#cccccc]">
                    <FaChevronDown className="text-[10px] text-[#cccccc]" />
                    <span>REACT PROJECT</span>
                  </div>
                  <div className="pl-2">
                    <div className="select-none">
                      <div
                        className="flex cursor-pointer items-center gap-1.5 px-2 py-1 text-[13px] text-[#cccccc] transition-colors hover:bg-[#2a2d2e]"
                        onClick={() => toggleFolder("src")}
                      >
                        {expandedFolders["src"] ? (
                          <FaChevronDown className="text-[10px] text-[#cccccc]" />
                        ) : (
                          <FaChevronRight className="text-[10px] text-[#cccccc]" />
                        )}
                        {expandedFolders["src"] ? (
                          <FaFolderOpen className="text-base text-[#dcb67a]" />
                        ) : (
                          <FaFolder className="text-base text-[#dcb67a]" />
                        )}
                        <span>src</span>
                      </div>
                      {expandedFolders["src"] && (
                        <div className="pl-5">
                          {fileStructure.src.map((file) => (
                            <div
                              key={`src/${file}`}
                              className={`flex cursor-pointer items-center gap-1.5 px-2 py-1 text-[13px] text-[#cccccc] transition-colors hover:bg-[#2a2d2e] ${activeFile === `src/${file}` ? "bg-[#37373d]" : ""}`}
                              onClick={() => openFile(`src/${file}`)}
                            >
                              {getFileIcon(file)}
                              <span>{file}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {fileStructure.root.map((file) => (
                      <div
                        key={file}
                        className={`flex cursor-pointer items-center gap-1.5 pl-6 pr-2 py-1 text-[13px] text-[#cccccc] transition-colors hover:bg-[#2a2d2e] ${activeFile === file ? "bg-[#37373d]" : ""}`}
                        onClick={() => openFile(file)}
                      >
                        {getFileIcon(file)}
                        <span>{file}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeView === "search" && (
            <div className="flex h-full flex-col">
              <div className="flex h-[35px] items-center justify-between border-b border-[#2b2b2b] bg-[#252526] px-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#cccccc]">
                  SEARCH
                </span>
              </div>
              <div className="p-5 text-center text-[13px] text-[#858585]">
                <p>Search functionality coming soon...</p>
              </div>
            </div>
          )}
          {activeView === "git" && (
            <div className="flex h-full flex-col">
              <div className="flex h-[35px] items-center justify-between border-b border-[#2b2b2b] bg-[#252526] px-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#cccccc]">
                  SOURCE CONTROL
                </span>
              </div>
              <div className="p-5 text-center text-[13px] text-[#858585]">
                <p>No source control providers registered.</p>
              </div>
            </div>
          )}
        </div>

        {/* Editor Group */}
        <div className="flex flex-1 flex-col overflow-hidden bg-[#1e1e1e]">
          <div className="flex h-[35px] items-center border-b border-[#2b2b2b] bg-[#252526]">
            <div className="flex flex-1">
              {openFiles.map((file) => (
                <div
                  key={file}
                  className={`flex cursor-pointer items-center gap-2 border-r border-[#2b2b2b] px-3 py-1.5 text-[13px] ${activeFile === file ? "bg-[#1e1e1e] text-white" : "bg-[#252526] text-[#cccccc] hover:bg-[#2a2d2e]"}`}
                  onClick={() => setActiveFile(file)}
                >
                  {getFileIcon(file)}
                  <span>{file.split("/").pop()}</span>
                  <div
                    className="cursor-pointer hover:bg-[#3e3e42] rounded p-0.5"
                    onClick={(e) => closeFile(file, e)}
                  >
                    <FaTimes className="text-[10px]" />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center px-2">
              <button
                onClick={runCode}
                className="flex items-center gap-1.5 rounded bg-[#0e639c] px-2 py-1 text-xs text-white hover:bg-[#1177bb]"
                title="Run Code"
              >
                <FaPlay /> Run
              </button>
            </div>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center border-b border-[#2b2b2b] bg-[#252526] px-3 py-1 text-[12px] text-[#cccccc]">
              <span>{activeFile}</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <Editor
                height="100%"
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
                  rulers: [],
                  folding: true,
                  bracketPairColorization: { enabled: true },
                }}
              />
            </div>
          </div>

          {/* Bottom Panel */}
          {showPanel && (
            <div className="flex flex-col border-t border-[#2b2b2b] bg-[#252526]">
              <div className="flex h-[35px] items-center justify-between border-b border-[#2b2b2b] bg-[#252526] px-2">
                <div className="flex">
                  <div
                    className={`flex cursor-pointer items-center gap-2 border-b-2 px-3 py-2 text-[11px] font-semibold uppercase ${activePanel === "preview" ? "border-[#0e639c] bg-[#252526] text-white" : "border-transparent text-[#858585] hover:text-[#cccccc]"}`}
                    onClick={() => setActivePanel("preview")}
                  >
                    <FaCode /> PREVIEW
                  </div>
                  <div
                    className={`flex cursor-pointer items-center gap-2 border-b-2 px-3 py-2 text-[11px] font-semibold uppercase ${activePanel === "terminal" ? "border-[#0e639c] bg-[#252526] text-white" : "border-transparent text-[#858585] hover:text-[#cccccc]"}`}
                    onClick={() => setActivePanel("terminal")}
                  >
                    <FaTerminal /> {isMultiplayer ? "LOGS" : "TERMINAL"}
                  </div>
                  <div
                    className={`flex cursor-pointer items-center gap-2 border-b-2 px-3 py-2 text-[11px] font-semibold uppercase ${activePanel === "problems" ? "border-[#0e639c] bg-[#252526] text-white" : "border-transparent text-[#858585] hover:text-[#cccccc]"}`}
                    onClick={() => setActivePanel("problems")}
                  >
                    <FaExclamationCircle /> PROBLEMS
                  </div>
                </div>
                <div className="flex items-center">
                  <FaTimes
                    onClick={() => setShowPanel(false)}
                    className="cursor-pointer text-[#858585] hover:text-[#cccccc]"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-auto bg-[#1e1e1e]">
                {activePanel === "preview" && (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {/* Multiplayer Preview Tabs */}
                    {isMultiplayer && (
                      <div className="flex border-b border-[#2b2b2b] bg-[#252526]">
                        <div
                          className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-xs font-semibold ${activePreviewTab === "player1" ? "border-b-2 border-[#0e639c] bg-[#252526] text-white" : "text-[#858585] hover:text-[#cccccc]"}`}
                          onClick={() => setActivePreviewTab("player1")}
                        >
                          <FaUser /> Player 1
                        </div>
                        <div
                          className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-xs font-semibold ${activePreviewTab === "player2" ? "border-b-2 border-[#0e639c] bg-[#252526] text-white" : "text-[#858585] hover:text-[#cccccc]"}`}
                          onClick={() => setActivePreviewTab("player2")}
                        >
                          <FaUser /> Player 2
                        </div>
                      </div>
                    )}
                    {isPreviewLoading && (
                      <div
                        style={{
                          position: "absolute",
                          top: isMultiplayer ? "32px" : 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "#1e1e1e",
                          color: "#cccccc",
                          zIndex: 10,
                        }}
                      >
                        <div>
                          <div
                            style={{ fontSize: "24px", marginBottom: "10px" }}
                          >
                            ⚡
                          </div>
                          <div>
                            Loading preview
                            {isMultiplayer
                              ? ` for ${activePreviewTab === "player1" ? "Player 1" : "Player 2"}`
                              : ""}
                            ...
                          </div>
                        </div>
                      </div>
                    )}
                    {previewError && (
                      <div
                        style={{
                          padding: "20px",
                          background: "#2d2d30",
                          color: "#f48771",
                          fontFamily: "monospace",
                          height: "100%",
                          overflow: "auto",
                        }}
                      >
                        <h3>Preview Error</h3>
                        <pre
                          style={{
                            background: "#1e1e1e",
                            padding: "15px",
                            borderRadius: "5px",
                          }}
                        >
                          {previewError}
                        </pre>
                      </div>
                    )}
                    {/* Player 1 Preview */}
                    <iframe
                      key={`p1-${previewKey}`}
                      ref={iframeRef}
                      className="h-full w-full border-0"
                      title="preview-player1"
                      srcDoc={generatePreviewContent()}
                      sandbox="allow-scripts allow-same-origin"
                      style={{
                        display:
                          !isMultiplayer || activePreviewTab === "player1"
                            ? "block"
                            : "none",
                      }}
                      onLoad={() => {
                        console.log("Preview iframe (Player 1) loaded");
                        setIsPreviewLoading(false);
                      }}
                      onError={(e) => {
                        console.error("Preview iframe error:", e);
                        setPreviewError("Failed to load preview");
                        setIsPreviewLoading(false);
                      }}
                    />
                    {/* Player 2 Preview (Multiplayer only) */}
                    {isMultiplayer && (
                      <iframe
                        key={`p2-${previewKey}`}
                        ref={iframe2Ref}
                        className="h-full w-full border-0"
                        title="preview-player2"
                        srcDoc={generatePreviewContent()}
                        sandbox="allow-scripts allow-same-origin"
                        style={{
                          display:
                            activePreviewTab === "player2" ? "block" : "none",
                        }}
                        onLoad={() => {
                          console.log("Preview iframe (Player 2) loaded");
                        }}
                        onError={(e) => {
                          console.error("Preview iframe error:", e);
                        }}
                      />
                    )}
                  </div>
                )}
                {activePanel === "terminal" && (
                  <div className="flex h-full flex-col overflow-hidden bg-[#1e1e1e] p-2 font-mono text-[13px] text-[#cccccc]">
                    {isMultiplayer ? (
                      <>
                        {/* Log Tabs for Multiplayer */}
                        <div className="flex border-b border-[#2b2b2b]">
                          <div
                            className={`cursor-pointer px-3 py-2 text-xs font-semibold ${activeLogTab === "server" ? "border-b-2 border-[#0e639c] text-white" : "text-[#858585] hover:text-[#cccccc]"}`}
                            onClick={() => setActiveLogTab("server")}
                          >
                            <FaServer /> Server
                          </div>
                          <div
                            className={`cursor-pointer px-3 py-2 text-xs font-semibold ${activeLogTab === "client1" ? "border-b-2 border-[#0e639c] text-white" : "text-[#858585] hover:text-[#cccccc]"}`}
                            onClick={() => setActiveLogTab("client1")}
                          >
                            <FaUser /> Client 1
                          </div>
                          <div
                            className={`cursor-pointer px-3 py-2 text-xs font-semibold ${activeLogTab === "client2" ? "border-b-2 border-[#0e639c] text-white" : "text-[#858585] hover:text-[#cccccc]"}`}
                            onClick={() => setActiveLogTab("client2")}
                          >
                            <FaUser /> Client 2
                          </div>
                        </div>
                        <div className="flex-1 overflow-auto p-2 font-mono text-[12px]">
                          {activeLogTab === "server" &&
                            serverLogs.map((log, i) => (
                              <div
                                key={i}
                                className={`py-0.5 ${log.type === "error" ? "text-red-400" : log.type === "warn" ? "text-amber-400" : "text-[#cccccc]"}`}
                              >
                                <span className="text-[#858585]">
                                  [{log.timestamp}]
                                </span>
                                <span className="ml-2">{log.message}</span>
                              </div>
                            ))}
                          {activeLogTab === "client1" &&
                            client1Logs.map((log, i) => (
                              <div
                                key={i}
                                className={`py-0.5 ${log.type === "error" ? "text-red-400" : log.type === "warn" ? "text-amber-400" : "text-[#cccccc]"}`}
                              >
                                <span className="text-[#858585]">
                                  [{log.timestamp}]
                                </span>
                                <span className="ml-2">{log.message}</span>
                              </div>
                            ))}
                          {activeLogTab === "client2" &&
                            client2Logs.map((log, i) => (
                              <div
                                key={i}
                                className={`py-0.5 ${log.type === "error" ? "text-red-400" : log.type === "warn" ? "text-amber-400" : "text-[#cccccc]"}`}
                              >
                                <span className="text-[#858585]">
                                  [{log.timestamp}]
                                </span>
                                <span className="ml-2">{log.message}</span>
                              </div>
                            ))}
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 overflow-auto p-3 font-mono text-[13px] text-[#cccccc]">
                        <p>$ npm run dev</p>
                        <p style={{ color: "#4EC9B0" }}>
                          Ready! Development server running...
                        </p>
                        <p style={{ color: "#CE9178" }}>
                          Edit your code and see changes live!
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {activePanel === "problems" && (
                  <div className="flex-1 overflow-auto p-3 text-[13px] text-[#cccccc]">
                    {previewError ? (
                      <div style={{ padding: "8px 12px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "8px",
                            padding: "8px",
                            background: "#1e1e1e",
                            borderLeft: "3px solid #f48771",
                            marginBottom: "8px",
                          }}
                        >
                          <FaExclamationCircle
                            style={{ color: "#f48771", marginTop: "2px" }}
                          />
                          <div>
                            <div
                              style={{
                                color: "#cccccc",
                                fontSize: "13px",
                                marginBottom: "4px",
                              }}
                            >
                              <strong>Error in src/App.jsx</strong>
                            </div>
                            <div style={{ color: "#858585", fontSize: "12px" }}>
                              {previewError}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-center text-[#858585]">
                        No problems detected! Keep coding!
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex h-6 items-center justify-between border-t border-[#2b2b2b] bg-[#007acc] px-3 text-[12px] text-white">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <FaCodeBranch /> main
          </div>
          <div className="flex items-center gap-1.5">
            <FaExclamationCircle /> 0 ⚠ 0
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span>Ln 1, Col 1</span>
          <span>Spaces: 2</span>
          <span>UTF-8</span>
          <span>{getLanguage(activeFile).toUpperCase()}</span>
          <span className="flex items-center gap-1">
            React {getFileIcon(activeFile)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VSCodeIDE;
