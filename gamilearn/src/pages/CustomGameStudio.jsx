import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { achievementsAPI } from '../api/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaFolder, FaFolderOpen, FaFile, FaReact, FaHtml5, FaCss3Alt, FaJs,
  FaPlay, FaSave, FaTrophy, FaSearch, FaCode, FaTimes, FaChevronDown, 
  FaChevronRight, FaDesktop, FaMobileAlt, FaPlus, FaDownload, FaUpload,
  FaStar, FaBolt, FaFire, FaGem
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import './CustomGameStudio.css';

const CustomGameStudio = () => {
  const navigate = useNavigate();
  const iframeRef = useRef(null);

  // File system state
  const [files, setFiles] = useState({
    'src/App.jsx': `import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);
  const [score, setScore] = useState(0);

  const handleClick = () => {
    setCount(count + 1);
    setScore(score + 10);
  };

  return (
    <div className="game-container">
      <h1>🎮 Click Quest</h1>
      <div className="score-display">
        <h2>Score: {score}</h2>
        <p>Clicks: {count}</p>
      </div>
      <button className="game-button" onClick={handleClick}>
        🎯 Click Me!
      </button>
      <div className="achievements">
        {score >= 100 && <div className="achievement">🏆 Century!</div>}
        {score >= 500 && <div className="achievement">⭐ Champion!</div>}
      </div>
    </div>
  );
}

export default App;`,
    'src/App.css': `.game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: white;
  padding: 20px;
}

h1 {
  font-size: 3rem;
  margin: 0 0 20px 0;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.score-display {
  background: rgba(255,255,255,0.2);
  padding: 30px;
  border-radius: 20px;
  margin: 20px 0;
  backdrop-filter: blur(10px);
  text-align: center;
}

.score-display h2 {
  font-size: 2.5rem;
  margin: 0;
  color: #FFD700;
}

.score-display p {
  font-size: 1.2rem;
  margin: 10px 0 0 0;
  opacity: 0.9;
}

.game-button {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
  border: none;
  padding: 20px 40px;
  font-size: 1.5rem;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 20px rgba(0,0,0,0.3);
  font-weight: bold;
}

.game-button:hover {
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 12px 30px rgba(0,0,0,0.4);
}

.game-button:active {
  transform: translateY(-2px) scale(1.02);
}

.achievements {
  display: flex;
  gap: 15px;
  margin-top: 30px;
  flex-wrap: wrap;
  justify-content: center;
}

.achievement {
  background: rgba(255,215,0,0.3);
  padding: 15px 25px;
  border-radius: 15px;
  font-size: 1.2rem;
  border: 2px solid rgba(255,215,0,0.5);
  animation: bounce 0.5s ease;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}`,
    'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My Game</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`
  });

  const [openFiles, setOpenFiles] = useState(['src/App.jsx']);
  const [activeFile, setActiveFile] = useState('src/App.jsx');
  const [expandedFolders, setExpandedFolders] = useState({ 'src': true });
  const [previewKey, setPreviewKey] = useState(0);
  const [previewMode, setPreviewMode] = useState('desktop'); // desktop or mobile
  
  // Gamification
  const [points, setPoints] = useState(0);
  const [sessionStats, setSessionStats] = useState({
    edits: 0,
    runs: 0,
    saves: 0,
    streak: 0,
    sessionTime: 0
  });
  const [achievements, setAchievements] = useState([]);
  const [showAchievements, setShowAchievements] = useState(false);
  const defaultAchievementIcon = 'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/award.svg';
  const renderAchievementIcon = (icon, alt, className) => {
    const isUrl = typeof icon === 'string' && icon.startsWith('http');
    if (isUrl) {
      return (
        <img
          src={icon}
          alt={alt}
          className={className}
          onError={(e) => {
            if (e.target.dataset.fallback) return;
            e.target.dataset.fallback = '1';
            e.target.src = defaultAchievementIcon;
          }}
        />
      );
    }
    return <span className={className}>{icon || '🏆'}</span>;
  };
  
  // Projects
  const [projectName, setProjectName] = useState('My Game');
  const [savedProjects, setSavedProjects] = useState([]);
  const [showProjectsModal, setShowProjectsModal] = useState(false);

  const fileStructure = {
    'src': ['App.jsx', 'App.css'],
    'root': ['index.html']
  };

  // Load achievements and saved projects
  useEffect(() => {
    loadAchievements();
    loadSavedProjects();
    loadLastProject();
    
    // Session timer
    const timer = setInterval(() => {
      setSessionStats(prev => ({
        ...prev,
        sessionTime: prev.sessionTime + 1
      }));
    }, 60000); // Every minute

    return () => clearInterval(timer);
  }, []);

  // Auto-check achievements
  useEffect(() => {
    checkAchievements();
  }, [sessionStats, points]);

  const loadAchievements = async () => {
    try {
      const response = await achievementsAPI.getUserAchievements();
      const codingAchievements = response.data.achievements.filter(
        a => a.category === 'coding' || a.category === 'general' || a.category === 'special'
      );
      setAchievements(codingAchievements);
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  };

  const loadSavedProjects = () => {
    const projects = localStorage.getItem('savedGameProjects');
    if (projects) {
      setSavedProjects(JSON.parse(projects));
    }
  };

  const loadLastProject = () => {
    const lastProject = localStorage.getItem('lastGameProject');
    if (lastProject) {
      const project = JSON.parse(lastProject);
      setFiles(project.files);
      setProjectName(project.name);
    }
  };

  const saveProject = () => {
    const project = {
      name: projectName,
      files: files,
      timestamp: new Date().toISOString()
    };
    
    // Save to projects list
    const projects = savedProjects.filter(p => p.name !== projectName);
    projects.unshift(project);
    localStorage.setItem('savedGameProjects', JSON.stringify(projects.slice(0, 10))); // Keep last 10
    setSavedProjects(projects.slice(0, 10));
    
    // Save as last project
    localStorage.setItem('lastGameProject', JSON.stringify(project));
    
    awardPoints(10, 'Save Project');
    setSessionStats(prev => ({ ...prev, saves: prev.saves + 1 }));
    toast.success(`💾 Project "${projectName}" saved!`);
  };

  const loadProject = (project) => {
    setFiles(project.files);
    setProjectName(project.name);
    setOpenFiles(['src/App.jsx']);
    setActiveFile('src/App.jsx');
    setShowProjectsModal(false);
    toast.success(`📂 Loaded "${project.name}"`);
  };

  const exportProject = () => {
    const project = {
      name: projectName,
      files: files,
      timestamp: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(project, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName.replace(/\s+/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('📥 Project exported!');
  };

  const importProject = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const project = JSON.parse(event.target.result);
        setFiles(project.files);
        setProjectName(project.name);
        setOpenFiles(['src/App.jsx']);
        setActiveFile('src/App.jsx');
        toast.success(`📤 Imported "${project.name}"`);
      } catch (error) {
        toast.error('Failed to import project');
      }
    };
    reader.readAsText(file);
  };

  const getFileIcon = (filename) => {
    if (filename.endsWith('.jsx')) return <FaReact className="file-icon react" />;
    if (filename.endsWith('.html')) return <FaHtml5 className="file-icon html" />;
    if (filename.endsWith('.css')) return <FaCss3Alt className="file-icon css" />;
    if (filename.endsWith('.js')) return <FaJs className="file-icon js" />;
    return <FaFile className="file-icon" />;
  };

  const getLanguage = (filename) => {
    if (filename.endsWith('.jsx') || filename.endsWith('.js')) return 'javascript';
    if (filename.endsWith('.css')) return 'css';
    if (filename.endsWith('.html')) return 'html';
    return 'plaintext';
  };

  const toggleFolder = (folder) => {
    setExpandedFolders(prev => ({ ...prev, [folder]: !prev[folder] }));
  };

  const openFile = (filePath) => {
    setActiveFile(filePath);
    if (!openFiles.includes(filePath)) {
      setOpenFiles([...openFiles, filePath]);
    }
  };

  const closeFile = (filePath, e) => {
    e.stopPropagation();
    const newOpenFiles = openFiles.filter(f => f !== filePath);
    setOpenFiles(newOpenFiles);
    if (activeFile === filePath && newOpenFiles.length > 0) {
      setActiveFile(newOpenFiles[newOpenFiles.length - 1]);
    }
  };

  const handleEditorChange = (value) => {
    if (value !== files[activeFile]) {
      setFiles({ ...files, [activeFile]: value });
      awardPoints(1, 'Code Edit');
      setSessionStats(prev => ({ 
        ...prev, 
        edits: prev.edits + 1,
        streak: prev.streak + 1 
      }));
    }
  };

  const runCode = () => {
    setPreviewKey(prev => prev + 1);
    awardPoints(5, 'Run Code');
    setSessionStats(prev => ({ ...prev, runs: prev.runs + 1 }));
    toast.success('⚡ Running code...');
  };

  const awardPoints = (amount, reason) => {
    setPoints(prev => prev + amount);
  };

  const checkAchievements = async () => {
    for (const achievement of achievements) {
      if (achievement.earned) continue;

      let shouldEarn = false;
      const req = achievement.requirement;
      const hour = new Date().getHours();

      if (req === 'edit_1_time' && sessionStats.edits >= 1) shouldEarn = true;
      else if (req === 'edit_10_times' && sessionStats.edits >= 10) shouldEarn = true;
      else if (req === 'edit_50_times' && sessionStats.edits >= 50) shouldEarn = true;
      else if (req === 'streak_5' && sessionStats.streak >= 5) shouldEarn = true;
      else if (req === 'session_10_min' && sessionStats.sessionTime >= 10) shouldEarn = true;
      else if (req === 'session_30_min' && sessionStats.sessionTime >= 30) shouldEarn = true;
      else if (req === 'run_10_times' && sessionStats.runs >= 10) shouldEarn = true;
      else if (req === 'code_night' && hour >= 0 && hour < 6 && sessionStats.edits > 0) shouldEarn = true;
      else if (req === 'points_100' && points >= 100) shouldEarn = true;
      else if (req === 'points_250' && points >= 250) shouldEarn = true;
      else if (req === 'points_500' && points >= 500) shouldEarn = true;
      else if (req === 'save_5_times' && sessionStats.saves >= 5) shouldEarn = true;

      if (shouldEarn) {
        try {
          await achievementsAPI.earnAchievement(achievement.id);
          setAchievements(prev => prev.map(a => 
            a.id === achievement.id ? { ...a, earned: true } : a
          ));
          setPoints(prev => prev + achievement.points);
          showAchievementNotification(achievement);
        } catch (error) {
          console.error('Error earning achievement:', error);
        }
      }
    }
  };

  const showAchievementNotification = (achievement) => {
    toast.success(
      <div>
        <strong>🎉 Achievement Unlocked!</strong>
        <div>{achievement.icon} {achievement.name}</div>
        <small>+{achievement.points} points</small>
      </div>,
      { autoClose: 4000 }
    );
  };

  const generatePreviewContent = () => {
    try {
      const appJsx = files['src/App.jsx'] || '';
      const appCss = files['src/App.css'] || '';

      // Remove ALL import statements (including CSS, React, etc.) and export statements
      const cleanedJsx = appJsx
        .replace(/import\s+.*?from\s+['"].*?['"];?/g, '')
        .replace(/import\s+['"].*?['"];?/g, '') // Remove CSS imports like: import './App.css'
        .replace(/export\s+default\s+/g, '')
        .replace(/export\s+/g, '')
        .split('\n')
        .filter(line => line.trim() !== '')
        .join('\n')
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
  
  <script type="text/babel">
    window.onerror = function(msg, url, lineNo, columnNo, error) {
      const errorStack = error && error.stack ? error.stack : '';
      document.body.innerHTML = \`
        <div style="padding: 20px; background: #1e1e1e; color: #cccccc; font-family: 'Consolas', 'Monaco', monospace; min-height: 100vh;">
          <div style="background: #2d2d30; padding: 20px; border-radius: 8px; border-left: 4px solid #f48771;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
              <span style="font-size: 24px;">❌</span>
              <h2 style="margin: 0; color: #f48771;">Runtime Error</h2>
            </div>
            <div style="background: #1e1e1e; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
              <div style="color: #f48771; font-weight: bold; margin-bottom: 8px;">Error:</div>
              <pre style="margin: 0; color: #cccccc; white-space: pre-wrap; word-wrap: break-word;">\${msg}</pre>
            </div>
            <div style="background: #252526; padding: 12px; border-radius: 5px; font-size: 12px;">
              <div style="color: #858585; margin-bottom: 4px;">Line: <span style="color: #4EC9B0;">\${lineNo}</span> | Column: <span style="color: #4EC9B0;">\${columnNo}</span></div>
            </div>
            \${errorStack ? \`
              <details style="margin-top: 15px; cursor: pointer;">
                <summary style="color: #858585; padding: 8px; background: #252526; border-radius: 4px;">Stack Trace</summary>
                <pre style="margin: 10px 0 0 0; padding: 10px; background: #1e1e1e; border-radius: 4px; font-size: 11px; color: #858585; overflow-x: auto;">\${errorStack}</pre>
              </details>
            \` : ''}
          </div>
          <div style="margin-top: 20px; padding: 15px; background: #252526; border-radius: 8px; border-left: 4px solid #4EC9B0;">
            <div style="color: #4EC9B0; font-weight: bold; margin-bottom: 10px;">💡 Common Fixes:</div>
            <ul style="margin: 0; padding-left: 20px; color: #cccccc; line-height: 1.8;">
              <li>Check for syntax errors (missing brackets, parentheses, quotes)</li>
              <li>Ensure all variables are declared before use</li>
              <li>Verify function names are spelled correctly</li>
              <li>Make sure JSX elements are properly closed</li>
              <li>Check that useState, useEffect are used correctly</li>
            </ul>
          </div>
        </div>
      \`;
      return true;
    };

    try {
      const { useState, useEffect, useReducer, useCallback, useMemo, useRef } = React;
      
      ${cleanedJsx}
      
      if (typeof App === 'undefined') {
        throw new Error('App component is not defined. Make sure you have a function or const named "App".');
      }
      
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(App));
      
    } catch (error) {
      const errorMessage = error.message || 'Unknown error';
      const errorStack = error.stack || '';
      
      // Try to extract line number from error
      const lineMatch = errorStack.match(/:([0-9]+):([0-9]+)/);
      const lineNo = lineMatch ? lineMatch[1] : 'unknown';
      const colNo = lineMatch ? lineMatch[2] : 'unknown';
      
      document.body.innerHTML = \`
        <div style="padding: 20px; background: #1e1e1e; color: #cccccc; font-family: 'Consolas', 'Monaco', monospace; min-height: 100vh;">
          <div style="background: #2d2d30; padding: 20px; border-radius: 8px; border-left: 4px solid #f48771;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
              <span style="font-size: 24px;">⚠️</span>
              <h2 style="margin: 0; color: #f48771;">Compilation Error</h2>
            </div>
            <div style="background: #1e1e1e; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
              <div style="color: #f48771; font-weight: bold; margin-bottom: 8px;">src/App.jsx</div>
              <pre style="margin: 0; color: #cccccc; white-space: pre-wrap; word-wrap: break-word;">\${errorMessage}</pre>
            </div>
            <div style="background: #252526; padding: 12px; border-radius: 5px; font-size: 12px; margin-bottom: 15px;">
              <div style="color: #858585;">Approximate Location: Line <span style="color: #4EC9B0;">\${lineNo}</span>, Column <span style="color: #4EC9B0;">\${colNo}</span></div>
            </div>
            \${errorStack ? \`
              <details style="cursor: pointer;">
                <summary style="color: #858585; padding: 8px; background: #252526; border-radius: 4px;">Error Details</summary>
                <pre style="margin: 10px 0 0 0; padding: 10px; background: #1e1e1e; border-radius: 4px; font-size: 11px; color: #858585; overflow-x: auto; white-space: pre-wrap;">\${errorStack}</pre>
              </details>
            \` : ''}
          </div>
          <div style="margin-top: 20px; padding: 15px; background: #252526; border-radius: 8px; border-left: 4px solid #4EC9B0;">
            <div style="color: #4EC9B0; font-weight: bold; margin-bottom: 10px;">💡 ESLint-Style Hints:</div>
            <ul style="margin: 0; padding-left: 20px; color: #cccccc; line-height: 1.8;">
              <li><strong>SyntaxError:</strong> Check for missing or extra brackets { } [ ] ( )</li>
              <li><strong>ReferenceError:</strong> Variable used before declaration</li>
              <li><strong>TypeError:</strong> Calling undefined as a function or accessing property of null</li>
              <li><strong>JSX:</strong> All tags must be closed, use camelCase for attributes</li>
              <li><strong>Hooks:</strong> useState/useEffect must be at top level of component</li>
              <li><strong>Missing export:</strong> Component must be named "App"</li>
            </ul>
          </div>
        </div>
      \`;
    }
  </script>
</body>
</html>`;
    } catch (error) {
      return `<!DOCTYPE html><body><h2>Error generating preview</h2></body></html>`;
    }
  };

  const earnedAchievements = achievements.filter(a => a.earned);
  const levelInfo = getLevel(points);

  function getLevel(pts) {
    if (pts < 50) return { level: 1, title: 'Novice', color: '#11998e', icon: '🌱' };
    if (pts < 150) return { level: 2, title: 'Apprentice', color: '#38ef7d', icon: '🔧' };
    if (pts < 300) return { level: 3, title: 'Developer', color: '#f7b733', icon: '💻' };
    if (pts < 500) return { level: 4, title: 'Expert', color: '#fc4a1a', icon: '🔥' };
    if (pts < 800) return { level: 5, title: 'Master', color: '#ee0979', icon: '⚡' };
    return { level: 6, title: 'Legend', color: '#FFD700', icon: '👑' };
  }

  return (
    <div className="custom-game-studio">
      {/* Top Bar */}
      <div className="studio-topbar">
        <div className="topbar-left">
          <button onClick={() => navigate('/dashboard')} className="btn-back-studio">
            ← Dashboard
          </button>
          <div className="project-name-section">
            <FaReact className="react-icon-pulse" />
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="project-name-input"
              placeholder="Project Name"
            />
          </div>
        </div>
        
        <div className="topbar-center">
          <motion.div 
            className="level-badge"
            whileHover={{ scale: 1.1 }}
            style={{ borderColor: levelInfo.color }}
          >
            <span className="level-icon">{levelInfo.icon}</span>
            <div>
              <div className="level-text">Level {levelInfo.level}</div>
              <div className="level-title">{levelInfo.title}</div>
            </div>
          </motion.div>
          
          <div className="points-display">
            <FaStar className="star-icon" />
            <span>{points} pts</span>
          </div>
          
          <div className="stats-mini">
            <span><FaBolt /> {sessionStats.runs}</span>
            <span><FaCode /> {sessionStats.edits}</span>
          </div>
        </div>

        <div className="topbar-right">
          <button onClick={() => setShowAchievements(!showAchievements)} className="btn-achievements">
            <FaTrophy /> {earnedAchievements.length}/{achievements.length}
          </button>
          <button onClick={runCode} className="btn-run-studio">
            <FaPlay /> Run
          </button>
          <button onClick={saveProject} className="btn-save-studio">
            <FaSave /> Save
          </button>
          <div className="btn-group">
            <button onClick={exportProject} className="btn-icon" title="Export">
              <FaDownload />
            </button>
            <label className="btn-icon" title="Import">
              <FaUpload />
              <input type="file" accept=".json" onChange={importProject} style={{ display: 'none' }} />
            </label>
            <button onClick={() => setShowProjectsModal(true)} className="btn-icon" title="Projects">
              <FaFolder />
            </button>
          </div>
        </div>
      </div>

      <div className="studio-main">
        {/* Sidebar - File Explorer */}
        <div className="studio-sidebar">
          <div className="sidebar-header">
            <span>FILES</span>
          </div>
          <div className="file-tree">
            {/* src folder */}
            <div className="folder-item" onClick={() => toggleFolder('src')}>
              {expandedFolders['src'] ? <FaChevronDown className="chevron" /> : <FaChevronRight className="chevron" />}
              {expandedFolders['src'] ? <FaFolderOpen className="folder-icon-open" /> : <FaFolder className="folder-icon-closed" />}
              <span>src</span>
            </div>
            {expandedFolders['src'] && (
              <div className="folder-contents">
                {fileStructure.src.map(file => (
                  <div
                    key={`src/${file}`}
                    className={`file-item ${activeFile === `src/${file}` ? 'active' : ''}`}
                    onClick={() => openFile(`src/${file}`)}
                  >
                    {getFileIcon(file)}
                    <span>{file}</span>
                  </div>
                ))}
              </div>
            )}
            {/* root files */}
            {fileStructure.root.map(file => (
              <div
                key={file}
                className={`file-item root-file ${activeFile === file ? 'active' : ''}`}
                onClick={() => openFile(file)}
              >
                {getFileIcon(file)}
                <span>{file}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="studio-editor-section">
          <div className="editor-tabs">
            {openFiles.map(file => (
              <div
                key={file}
                className={`editor-tab ${activeFile === file ? 'active' : ''}`}
                onClick={() => setActiveFile(file)}
              >
                {getFileIcon(file)}
                <span>{file.split('/').pop()}</span>
                {openFiles.length > 1 && (
                  <FaTimes className="close-tab" onClick={(e) => closeFile(file, e)} />
                )}
              </div>
            ))}
          </div>
          
          <div className="editor-container">
            <Editor
              height="100%"
              language={getLanguage(activeFile)}
              value={files[activeFile] || ''}
              theme="vs-dark"
              onChange={handleEditorChange}
              options={{
                fontSize: 14,
                fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                lineNumbers: 'on',
                folding: true,
                bracketPairColorization: { enabled: true },
              }}
            />
          </div>
        </div>

        {/* Preview Panel */}
        <div className="studio-preview-section">
          <div className="preview-header">
            <span>LIVE PREVIEW</span>
            <div className="preview-mode-toggle">
              <button
                className={previewMode === 'desktop' ? 'active' : ''}
                onClick={() => setPreviewMode('desktop')}
                title="Desktop View"
              >
                <FaDesktop />
              </button>
              <button
                className={previewMode === 'mobile' ? 'active' : ''}
                onClick={() => setPreviewMode('mobile')}
                title="Mobile View"
              >
                <FaMobileAlt />
              </button>
            </div>
          </div>
          
          <div className="preview-container">
            <div className={`preview-wrapper ${previewMode === 'mobile' ? 'mobile-view' : 'desktop-view'}`}>
              <iframe
                key={previewKey}
                ref={iframeRef}
                className="preview-iframe"
                title="preview"
                srcDoc={generatePreviewContent()}
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Achievements Panel */}
      <AnimatePresence>
        {showAchievements && (
          <motion.div
            className="achievements-panel"
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="panel-header">
              <h3><FaTrophy /> Achievements</h3>
              <button onClick={() => setShowAchievements(false)} className="btn-close-panel">
                <FaTimes />
              </button>
            </div>
            
            <div className="panel-stats">
              <div className="stat-item">
                <FaStar className="stat-icon-gold" />
                <div>
                  <div className="stat-value">{points}</div>
                  <div className="stat-label">Total Points</div>
                </div>
              </div>
              <div className="stat-item">
                <FaTrophy className="stat-icon-trophy" />
                <div>
                  <div className="stat-value">{earnedAchievements.length}/{achievements.length}</div>
                  <div className="stat-label">Unlocked</div>
                </div>
              </div>
            </div>

            <div className="achievements-grid">
              {achievements.map((ach) => (
                <motion.div
                  key={ach.id}
                  className={`achievement-card ${ach.earned ? 'earned' : 'locked'}`}
                  whileHover={ach.earned ? { scale: 1.05 } : {}}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {renderAchievementIcon(ach.icon, ach.name, 'achievement-icon-large')}
                  <div className="achievement-info">
                    <h4>{ach.name}</h4>
                    <p>{ach.description}</p>
                    <div className="achievement-points">
                      <FaGem className="gem-icon" /> {ach.points} pts
                    </div>
                  </div>
                  {ach.earned && <div className="earned-badge">✓</div>}
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
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowProjectsModal(false)}
          >
            <motion.div
              className="projects-modal"
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3><FaFolder /> Saved Projects</h3>
                <button onClick={() => setShowProjectsModal(false)}>
                  <FaTimes />
                </button>
              </div>
              
              <div className="projects-list">
                {savedProjects.length === 0 ? (
                  <div className="empty-state">
                    <p>No saved projects yet. Create and save your first game!</p>
                  </div>
                ) : (
                  savedProjects.map((project, index) => (
                    <div key={index} className="project-item" onClick={() => loadProject(project)}>
                      <FaReact className="project-icon" />
                      <div className="project-details">
                        <h4>{project.name}</h4>
                        <p>{new Date(project.timestamp).toLocaleString()}</p>
                      </div>
                      <button className="btn-load">Load</button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomGameStudio;
