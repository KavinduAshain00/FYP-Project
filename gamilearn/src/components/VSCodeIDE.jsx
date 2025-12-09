import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { 
  FaFolder, FaFolderOpen, FaFile, FaReact, FaHtml5, FaCss3Alt, FaJs, 
  FaPlay, FaSave, FaTrophy, FaCopy, FaSearch, FaCodeBranch, FaCode,
  FaExclamationCircle, FaCog, FaTerminal, FaChevronDown, FaChevronRight,
  FaTimes
} from 'react-icons/fa';
import './VSCodeIDE.css';
import { toast } from 'react-toastify';

const VSCodeIDE = ({ onPointsEarned }) => {
  const [files, setFiles] = useState({
    'src/App.jsx': `import { useState } from 'react';
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
        <h1>🎮 Todo Quest</h1>
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
              🗑️
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;`,
    'src/App.css': `.App {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
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
    'src/index.jsx': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
    'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React Game</title>
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
  const [points, setPoints] = useState(0);
  const [achievements, setAchievements] = useState([]);
  const [activeView, setActiveView] = useState('explorer'); // explorer, search, git, extensions
  const [showPanel, setShowPanel] = useState(true);
  const [activePanel, setActivePanel] = useState('preview'); // preview, terminal, problems
  const [previewError, setPreviewError] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const iframeRef = useRef(null);

  const fileStructure = {
    'src': ['App.jsx', 'App.css', 'index.jsx'],
    'root': ['index.html']
  };

  const getFileIcon = (filename) => {
    if (filename.endsWith('.jsx')) return <FaReact className="file-icon react" />;
    if (filename.endsWith('.html')) return <FaHtml5 className="file-icon html" />;
    if (filename.endsWith('.css')) return <FaCss3Alt className="file-icon css" />;
    if (filename.endsWith('.js')) return <FaJs className="file-icon js" />;
    return <FaFile className="file-icon" />;
  };

  const getLanguage = (filename) => {
    if (filename.endsWith('.jsx')) return 'javascript';
    if (filename.endsWith('.js')) return 'javascript';
    if (filename.endsWith('.css')) return 'css';
    if (filename.endsWith('.html')) return 'html';
    return 'plaintext';
  };

  const toggleFolder = (folder) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folder]: !prev[folder]
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
    const newOpenFiles = openFiles.filter(f => f !== filePath);
    setOpenFiles(newOpenFiles);
    if (activeFile === filePath && newOpenFiles.length > 0) {
      setActiveFile(newOpenFiles[newOpenFiles.length - 1]);
    }
  };

  const handleEditorChange = (value) => {
    if (value !== files[activeFile]) {
      // Award points for coding
      awardPoints(1, 'Code Edit');
    }
    
    setFiles({
      ...files,
      [activeFile]: value
    });

    // Auto-update preview after a short delay
    if (window.previewUpdateTimeout) {
      clearTimeout(window.previewUpdateTimeout);
    }
    window.previewUpdateTimeout = setTimeout(() => {
      setPreviewKey(prev => prev + 1);
    }, 1000);
  };

  const awardPoints = (amount, reason) => {
    setPoints(prev => prev + amount);
    if (onPointsEarned) {
      onPointsEarned(amount, reason);
    }

    // Check for achievements
    checkAchievements(amount, reason);
  };

  const checkAchievements = (amount, reason) => {
    const totalPoints = points + amount;
    
    if (totalPoints >= 10 && !achievements.includes('first-steps')) {
      setAchievements([...achievements, 'first-steps']);
      showAchievement('🎯 First Steps', 'Earned 10 points!');
    }
    
    if (totalPoints >= 50 && !achievements.includes('getting-good')) {
      setAchievements([...achievements, 'getting-good']);
      showAchievement('🚀 Getting Good', 'Earned 50 points!');
    }
    
    if (totalPoints >= 100 && !achievements.includes('code-master')) {
      setAchievements([...achievements, 'code-master']);
      showAchievement('👑 Code Master', 'Earned 100 points!');
    }
  };

  const showAchievement = (title, message) => {
    const achievementDiv = document.createElement('div');
    achievementDiv.className = 'achievement-popup';
    achievementDiv.innerHTML = `
      <div class="achievement-content">
        <h3>${title}</h3>
        <p>${message}</p>
      </div>
    `;
    document.body.appendChild(achievementDiv);
    
    setTimeout(() => {
      achievementDiv.remove();
    }, 3000);
  };

  const runCode = () => {
    console.log('Running code...');
    setPreviewError(null);
    setIsPreviewLoading(true);
    setPreviewKey(prev => prev + 1);
    awardPoints(5, 'Run Code');
    
    // Reset loading after iframe loads
    setTimeout(() => {
      setIsPreviewLoading(false);
    }, 1000);
  };

  const saveProject = () => {
    localStorage.setItem('customGameProject', JSON.stringify(files));
    awardPoints(10, 'Save Project');
    toast.success('Project saved! 💾 +10 points');
  };

  const generatePreviewContent = () => {
    try {
      const appJsx = files['src/App.jsx'] || '';
      const appCss = files['src/App.css'] || '';

      console.log('Generating preview content...');
      console.log('App.jsx length:', appJsx.length);
      console.log('App.css length:', appCss.length);

      // Remove import statements from JSX as we're using UMD builds
      const cleanedJsx = appJsx
        .replace(/import\s+.*?from\s+['"].*?['"];?\n?/g, '')
        .replace(/export\s+default\s+/g, '')
        .trim();

      console.log('Cleaned JSX:', cleanedJsx.substring(0, 100) + '...');

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
          <h2 style="color: #f48771; margin-top: 0;">❌ Runtime Error</h2>
          <pre style="background: #1e1e1e; color: #cccccc; padding: 15px; border-radius: 5px; overflow: auto; border-left: 3px solid #f48771;">\${msg}\n\nLine: \${lineNo}\nColumn: \${columnNo}</pre>
          <p style="color: #cccccc; margin-top: 20px;">💡 Tip: Check your code syntax and variable names!</p>
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
          <h2 style="color: #f48771; margin-top: 0;">❌ Compilation Error</h2>
          <pre style="background: #1e1e1e; color: #cccccc; padding: 15px; border-radius: 5px; overflow: auto; border-left: 3px solid #f48771; white-space: pre-wrap;">\${error.message}</pre>
          <div style="margin-top: 20px; padding: 15px; background: #1e1e1e; border-radius: 5px;">
            <p style="color: #4EC9B0; margin: 0 0 10px 0; font-weight: bold;">💡 Common Issues:</p>
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
      console.error('Error generating preview:', error);
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
    const savedProject = localStorage.getItem('customGameProject');
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
    <div className="vscode-ide">
      {/* Title Bar */}
      <div className="title-bar">
        <div className="title-bar-left">
          <FaReact className="app-icon" />
          <span className="app-title">Custom Game Studio - React Project</span>
        </div>
        <div className="title-bar-center">
          <div className="points-badge">
            <FaTrophy /> {points} pts
          </div>
        </div>
      </div>

      <div className="ide-container">
        {/* Activity Bar */}
        <div className="activity-bar">
          <div className="activity-icons">
            <div 
              className={`activity-icon ${activeView === 'explorer' ? 'active' : ''}`}
              onClick={() => setActiveView('explorer')}
              title="Explorer"
            >
              <FaCopy />
            </div>
            <div 
              className={`activity-icon ${activeView === 'search' ? 'active' : ''}`}
              onClick={() => setActiveView('search')}
              title="Search"
            >
              <FaSearch />
            </div>
            <div 
              className={`activity-icon ${activeView === 'git' ? 'active' : ''}`}
              onClick={() => setActiveView('git')}
              title="Source Control"
            >
              <FaCodeBranch />
            </div>
          </div>
          <div className="activity-icons-bottom">
            <div className="activity-icon" title="Settings">
              <FaCog />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="sidebar">
          {activeView === 'explorer' && (
            <div className="sidebar-content">
              <div className="sidebar-header">
                <span className="sidebar-title">EXPLORER</span>
                <div className="sidebar-actions">
                  <FaSave className="action-icon" onClick={saveProject} title="Save All" />
                </div>
              </div>
              <div className="file-tree">
                <div className="tree-section">
                  <div className="tree-section-header">
                    <FaChevronDown className="chevron" />
                    <span>REACT PROJECT</span>
                  </div>
                  <div className="tree-section-content">
                    <div className="folder">
                      <div 
                        className="folder-item"
                        onClick={() => toggleFolder('src')}
                      >
                        {expandedFolders['src'] ? <FaChevronDown className="chevron" /> : <FaChevronRight className="chevron" />}
                        {expandedFolders['src'] ? <FaFolderOpen className="folder-icon" /> : <FaFolder className="folder-icon" />}
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
                    </div>
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
              </div>
            </div>
          )}
          {activeView === 'search' && (
            <div className="sidebar-content">
              <div className="sidebar-header">
                <span className="sidebar-title">SEARCH</span>
              </div>
              <div className="search-placeholder">
                <p>Search functionality coming soon...</p>
              </div>
            </div>
          )}
          {activeView === 'git' && (
            <div className="sidebar-content">
              <div className="sidebar-header">
                <span className="sidebar-title">SOURCE CONTROL</span>
              </div>
              <div className="git-placeholder">
                <p>No source control providers registered.</p>
              </div>
            </div>
          )}
        </div>

        {/* Editor Group */}
        <div className="editor-group">
          <div className="editor-tabs-container">
            <div className="editor-tabs">
              {openFiles.map(file => (
                <div
                  key={file}
                  className={`editor-tab ${activeFile === file ? 'active' : ''}`}
                  onClick={() => setActiveFile(file)}
                >
                  {getFileIcon(file)}
                  <span className="tab-label">{file.split('/').pop()}</span>
                  <div
                    className="close-tab"
                    onClick={(e) => closeFile(file, e)}
                  >
                    <FaTimes />
                  </div>
                </div>
              ))}
            </div>
            <div className="editor-actions">
              <button onClick={runCode} className="action-btn" title="Run Code">
                <FaPlay /> Run
              </button>
            </div>
          </div>
          
          <div className="editor-wrapper">
            <div className="breadcrumb">
              <span className="breadcrumb-item">{activeFile}</span>
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
                  rulers: [],
                  folding: true,
                  bracketPairColorization: { enabled: true },
                }}
              />
            </div>
          </div>

          {/* Bottom Panel */}
          {showPanel && (
            <div className="panel">
              <div className="panel-header">
                <div className="panel-tabs">
                  <div 
                    className={`panel-tab ${activePanel === 'preview' ? 'active' : ''}`}
                    onClick={() => setActivePanel('preview')}
                  >
                    <FaCode /> PREVIEW
                  </div>
                  <div 
                    className={`panel-tab ${activePanel === 'terminal' ? 'active' : ''}`}
                    onClick={() => setActivePanel('terminal')}
                  >
                    <FaTerminal /> TERMINAL
                  </div>
                  <div 
                    className={`panel-tab ${activePanel === 'problems' ? 'active' : ''}`}
                    onClick={() => setActivePanel('problems')}
                  >
                    <FaExclamationCircle /> PROBLEMS
                  </div>
                </div>
                <div className="panel-actions">
                  <FaTimes onClick={() => setShowPanel(false)} className="close-panel" />
                </div>
              </div>
              <div className="panel-content">
                {activePanel === 'preview' && (
                  <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    {isPreviewLoading && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#1e1e1e',
                        color: '#cccccc',
                        zIndex: 10
                      }}>
                        <div>
                          <div style={{ fontSize: '24px', marginBottom: '10px' }}>⚡</div>
                          <div>Loading preview...</div>
                        </div>
                      </div>
                    )}
                    {previewError && (
                      <div style={{
                        padding: '20px',
                        background: '#2d2d30',
                        color: '#f48771',
                        fontFamily: 'monospace',
                        height: '100%',
                        overflow: 'auto'
                      }}>
                        <h3>❌ Preview Error</h3>
                        <pre style={{ background: '#1e1e1e', padding: '15px', borderRadius: '5px' }}>
                          {previewError}
                        </pre>
                      </div>
                    )}
                    <iframe
                      key={previewKey}
                      ref={iframeRef}
                      className="preview-iframe"
                      title="preview"
                      srcDoc={generatePreviewContent()}
                      sandbox="allow-scripts allow-same-origin"
                      onLoad={() => {
                        console.log('Preview iframe loaded');
                        setIsPreviewLoading(false);
                      }}
                      onError={(e) => {
                        console.error('Preview iframe error:', e);
                        setPreviewError('Failed to load preview');
                        setIsPreviewLoading(false);
                      }}
                    />
                  </div>
                )}
                {activePanel === 'terminal' && (
                  <div className="terminal-view">
                    <div className="terminal-output">
                      <p>$ npm run dev</p>
                      <p style={{color: '#4EC9B0'}}>Ready! Development server running...</p>
                      <p style={{color: '#CE9178'}}>Edit your code and see changes live!</p>
                    </div>
                  </div>
                )}
                {activePanel === 'problems' && (
                  <div className="problems-view">
                    {previewError ? (
                      <div style={{ padding: '8px 12px' }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'flex-start',
                          gap: '8px',
                          padding: '8px',
                          background: '#1e1e1e',
                          borderLeft: '3px solid #f48771',
                          marginBottom: '8px'
                        }}>
                          <FaExclamationCircle style={{ color: '#f48771', marginTop: '2px' }} />
                          <div>
                            <div style={{ color: '#cccccc', fontSize: '13px', marginBottom: '4px' }}>
                              <strong>Error in src/App.jsx</strong>
                            </div>
                            <div style={{ color: '#858585', fontSize: '12px' }}>
                              {previewError}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="no-problems">No problems detected! Keep coding! 🎉</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-bar-left">
          <div className="status-item">
            <FaCodeBranch /> main
          </div>
          <div className="status-item">
            <FaExclamationCircle /> 0 ⚠ 0
          </div>
        </div>
        <div className="status-bar-right">
          <div className="status-item">Ln 1, Col 1</div>
          <div className="status-item">Spaces: 2</div>
          <div className="status-item">UTF-8</div>
          <div className="status-item">{getLanguage(activeFile).toUpperCase()}</div>
          <div className="status-item">React {getFileIcon(activeFile)}</div>
        </div>
      </div>
    </div>
  );
};

export default VSCodeIDE;
