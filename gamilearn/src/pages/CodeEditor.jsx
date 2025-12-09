import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { modulesAPI, userAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { FaPlay, FaUndo, FaCheck, FaStar, FaCode, FaTrophy, FaBolt } from 'react-icons/fa';
import './CodeEditor.css';
import { toast } from 'react-toastify';
import ConfirmModal from '../components/ConfirmModal';

const CodeEditor = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  
  const [module, setModule] = useState(null);
  const [htmlCode, setHtmlCode] = useState('');
  const [cssCode, setCssCode] = useState('');
  const [jsCode, setJsCode] = useState('');
  const [activeTab, setActiveTab] = useState('html');
  const [loading, setLoading] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);
  const [previewKey, setPreviewKey] = useState(0);
  
  // Gamification states
  const [points, setPoints] = useState(0);
  const [codeChanges, setCodeChanges] = useState(0);
  const [completionBonus, setCompletionBonus] = useState(100);
  const [streak, setStreak] = useState(0);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const { refreshProfile } = useAuth();

  useEffect(() => {
    const fetchModule = async () => {
      try {
        const response = await modulesAPI.getById(moduleId);
        const moduleData = response.data.module;
        
        setModule(moduleData);
        setHtmlCode(moduleData.starterCode.html);
        setCssCode(moduleData.starterCode.css);
        setJsCode(moduleData.starterCode.javascript);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching module:', error);
        toast.error('Failed to load module');
        navigate('/dashboard');
      }
    };

    fetchModule();
  }, [moduleId, navigate]);

  const getPreviewContent = () => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>${cssCode}</style>
</head>
<body>
  ${htmlCode}
  <script>
    try {
      ${jsCode}
    } catch (error) {
      console.error('Runtime error:', error);
      document.body.innerHTML += '<div style="color: #fc4a1a; padding: 20px; font-family: monospace; background: #132f4c; border-radius: 8px; margin: 20px;"><h3>⚠️ Error:</h3><pre style="color: #f7b733;">' + error.message + '</pre></div>';
    }
  </script>
</body>
</html>
    `;
  };

  const handleCompleteModule = async () => {
    try {
      const resp = await userAPI.completeModule(moduleId);
      // refresh global profile from backend
      if (refreshProfile) await refreshProfile();
      const totalPointsEarned = points + completionBonus;
      toast.success(`🎉 Module Completed!\n✨ Earned: ${points} points • Bonus: +${completionBonus} points • Total: ${totalPointsEarned} points!`, { autoClose: 5000 });
      navigate('/dashboard');
    } catch (error) {
      console.error('Error completing module:', error);
    }
  };

  const handleCodeChange = (value, setter, type) => {
    setter(value);
    setCodeChanges(prev => prev + 1);
    setPoints(prev => prev + 2);
    
    // Auto-refresh preview after code changes
    if (window.previewTimeout) {
      clearTimeout(window.previewTimeout);
    }
    window.previewTimeout = setTimeout(() => {
      setPreviewKey(prev => prev + 1);
    }, 1500);
  };

  const handleRunCode = () => {
    setPreviewKey(prev => prev + 1);
    setPoints(prev => prev + 5);
    setStreak(prev => prev + 1);
  };

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    setHtmlCode(module.starterCode.html);
    setCssCode(module.starterCode.css);
    setJsCode(module.starterCode.javascript);
    setPoints(0);
    setCodeChanges(0);
    setStreak(0);
    setPreviewKey(prev => prev + 1);
    setShowResetConfirm(false);
    toast.info('Editor reset to starter code.');
  };

  const cancelReset = () => {
    setShowResetConfirm(false);
  };

  if (loading) {
    return (
      <div className="editor-loading">
        <div className="spinner"></div>
        <p>Loading module...</p>
      </div>
    );
  }

  return (
    <div className="code-editor">
      <header className="editor-header">
        <div className="header-left">
          <button onClick={() => navigate('/dashboard')} className="btn-back">
            ← Dashboard
          </button>
          <div className="module-title">
            <h1>{module.title}</h1>
            <span className={`difficulty-pill ${module.difficulty}`}>
              {module.difficulty}
            </span>
          </div>
        </div>
        
        <div className="header-center">
          <div className="gamification-stats-editor">
            <div className="stat-badge">
              <FaStar className="badge-icon-star" />
              <div>
                <span className="badge-label">Points</span>
                <span className="badge-value">{points}</span>
              </div>
            </div>
            <div className="stat-badge">
              <FaCode className="badge-icon-code" />
              <div>
                <span className="badge-label">Edits</span>
                <span className="badge-value">{codeChanges}</span>
              </div>
            </div>
            <div className="stat-badge">
              <FaBolt className="badge-icon-bolt" />
              <div>
                <span className="badge-label">Streak</span>
                <span className="badge-value">{streak}</span>
              </div>
            </div>
            <div className="stat-badge bonus">
              <FaTrophy className="badge-icon-trophy" />
              <div>
                <span className="badge-label">Bonus</span>
                <span className="badge-value">+{completionBonus}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="header-right">
          <button onClick={handleRunCode} className="btn-run">
            <FaPlay /> Run
          </button>
          <button onClick={handleReset} className="btn-reset">
            <FaUndo /> Reset
          </button>
          <button onClick={handleCompleteModule} className="btn-complete">
            <FaCheck /> Complete
          </button>
        </div>
      </header>

      <div className="editor-container">
        {/* Left Panel - Instructions */}
        <aside className={`instructions-panel ${showInstructions ? 'open' : 'closed'}`}>
          <div className="panel-header">
            <h2>📚 Instructions</h2>
            <button 
              onClick={() => setShowInstructions(!showInstructions)}
              className="toggle-btn"
            >
              {showInstructions ? '◀' : '▶'}
            </button>
          </div>
          
          {showInstructions && (
            <div className="panel-content">
              <div className="module-info">
                <span className={`difficulty-badge ${module.difficulty}`}>
                  {module.difficulty}
                </span>
                <span className="category-badge">
                  {module.category.replace('-', ' ')}
                </span>
              </div>

              <div className="content-section">
                <div dangerouslySetInnerHTML={{ __html: module.content.replace(/\n/g, '<br/>') }} />
              </div>

              {module.objectives && module.objectives.length > 0 && (
                <div className="objectives">
                  <h3>🎯 Objectives</h3>
                  <ul>
                    {module.objectives.map((obj, index) => (
                      <li key={index}>{obj}</li>
                    ))}
                  </ul>
                </div>
              )}

              {module.hints && module.hints.length > 0 && (
                <div className="hints">
                  <h3>💡 Hints</h3>
                  <ul>
                    {module.hints.map((hint, index) => (
                      <li key={index}>{hint}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* Middle Panel - Code Editor */}
        <div className="editor-panel">
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'html' ? 'active' : ''}`}
              onClick={() => setActiveTab('html')}
            >
              <span className="tab-icon">📄</span> HTML
            </button>
            <button 
              className={`tab ${activeTab === 'css' ? 'active' : ''}`}
              onClick={() => setActiveTab('css')}
            >
              <span className="tab-icon">🎨</span> CSS
            </button>
            <button 
              className={`tab ${activeTab === 'js' ? 'active' : ''}`}
              onClick={() => setActiveTab('js')}
            >
              <span className="tab-icon">⚡</span> JavaScript
            </button>
          </div>

          <div className="code-area">
            {activeTab === 'html' && (
              <CodeMirror
                value={htmlCode}
                height="100%"
                theme={vscodeDark}
                extensions={[html()]}
                onChange={(value) => handleCodeChange(value, setHtmlCode, 'html')}
                options={{
                  lineNumbers: true,
                  lineWrapping: true,
                }}
              />
            )}
            {activeTab === 'css' && (
              <CodeMirror
                value={cssCode}
                height="100%"
                theme={vscodeDark}
                extensions={[css()]}
                onChange={(value) => handleCodeChange(value, setCssCode, 'css')}
                options={{
                  lineNumbers: true,
                  lineWrapping: true,
                }}
              />
            )}
            {activeTab === 'js' && (
              <CodeMirror
                value={jsCode}
                height="100%"
                theme={vscodeDark}
                extensions={[javascript()]}
                onChange={(value) => handleCodeChange(value, setJsCode, 'js')}
                options={{
                  lineNumbers: true,
                  lineWrapping: true,
                }}
              />
            )}
          </div>
        </div>

        {/* Right Panel - Live Preview */}
        <div className="preview-panel">
          <div className="panel-header">
            <h2>🚀 Live Preview</h2>
            <span className="preview-badge">Auto-refresh enabled</span>
          </div>
          <iframe
            key={previewKey}
            className="preview-frame"
            title="preview"
            srcDoc={getPreviewContent()}
            sandbox="allow-scripts"
          />
        </div>
      </div>
      <ConfirmModal
        open={showResetConfirm}
        title="Reset code?"
        message={'⚠️ Reset all code? You will lose your current progress points.'}
        onConfirm={confirmReset}
        onCancel={cancelReset}
      />
    </div>
  );
};

export default CodeEditor;
