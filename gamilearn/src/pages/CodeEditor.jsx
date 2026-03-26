import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { modulesAPI, userAPI, tutorAPI } from "../api/api";
import { useAuth } from "../context/AuthContext";
import {
  FaBookOpen,
  FaPlay,
  FaUndo,
  FaCheck,
  FaStar,
  FaCode,
  FaTrophy,
  FaBolt,
  FaReact,
  FaUsers,
  FaChevronRight,
  FaChevronDown,
  FaTimes,
  FaExternalLinkAlt,
  FaUser,
  FaColumns,
  FaMagic,
} from "react-icons/fa";
import { toast } from "react-toastify";
import ConfirmModal from "../components/ui/ConfirmModal";
import MarkdownContent from "../components/ui/MarkdownContent";
import { loadEditorDraft, saveEditorDraft } from "../utils/draftStorage";

// Module type configurations (multiplayer uses HTML/CSS/JS only, no React)
const MODULE_TYPES = {
  "javascript-basics": { tabs: ["html", "css", "js"], defaultTab: "html" },
  "game-development": { tabs: ["html", "css", "js"], defaultTab: "js" },
  "react-basics": { tabs: ["jsx", "css"], defaultTab: "jsx" },
  multiplayer: { tabs: ["html", "css", "js"], defaultTab: "html" },
  "advanced-concepts": { tabs: ["jsx", "css", "js"], defaultTab: "jsx" },
};

const CodeEditor = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();

  const [module, setModule] = useState(null);
  const [htmlCode, setHtmlCode] = useState("");
  const [cssCode, setCssCode] = useState("");
  const [jsCode, setJsCode] = useState("");
  const [jsxCode, setJsxCode] = useState("");
  const [activeTab, setActiveTab] = useState("html");
  const [loading, setLoading] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);
  const [previewKey, setPreviewKey] = useState(0);

  // Step-by-step: use module.steps (4-5 small steps) when present, else objectives
  const steps = useMemo(() => {
    if (module?.steps?.length) {
      return module.steps.map((s, i) => ({
        id: i,
        title: s.title,
        instruction: s.instruction || s.title,
        concept: s.concept || "",
        verified: false,
      }));
    }
    if (!module?.objectives?.length) return [{ id: 0, title: "Complete the lesson", instruction: "Complete the lesson", concept: "", verified: false }];
    return module.objectives.map((obj, i) => ({ id: i, title: obj, instruction: obj, concept: "", verified: false }));
  }, [module]);
  const [stepsVerified, setStepsVerified] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyFeedback, setVerifyFeedback] = useState(null);
  const [verifyPassed, setVerifyPassed] = useState(false);
  /** When user fails a step: show step crossed and this explanation (key = step index) */
  const [stepFailureFeedback, setStepFailureFeedback] = useState({});

  // MCQ between steps (1-2 questions, generated/verified by qwen3-coder)
  const [mcqGateForStep, setMcqGateForStep] = useState(null);
  const [mcqQuestions, setMcqQuestions] = useState([]);
  const [mcqCurrentIndex, setMcqCurrentIndex] = useState(0);
  const [mcqSelectedIndex, setMcqSelectedIndex] = useState(null);
  const [mcqLoading, setMcqLoading] = useState(false);
  const [mcqVerifyLoading, setMcqVerifyLoading] = useState(false);
  const [mcqResult, setMcqResult] = useState(null);
  const [mcqPassedCount, setMcqPassedCount] = useState(0);

  // Explain selection (highlight code → ask for explanation)
  const editorViewRef = useRef(null);
  const [explainCodeLoading, setExplainCodeLoading] = useState(false);
  const [explainCodeResult, setExplainCodeResult] = useState(null);

  // Main area tab: Editor | Live Preview
  const [mainViewTab, setMainViewTab] = useState("editor");

  // Gamification states
  const [points, setPoints] = useState(0);
  const [codeChanges, setCodeChanges] = useState(0);
  const completionBonus = 100;
  const [streak, setStreak] = useState(0);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showTutorSidebar, setShowTutorSidebar] = useState(false);
  const [tutorQuestion, setTutorQuestion] = useState("");
  const [tutorAnswer, setTutorAnswer] = useState(null);
  const [tutorLoading, setTutorLoading] = useState(false);
  const [hintStyle, setHintStyle] = useState("general");
  const [tutorConfidence, setTutorConfidence] = useState(null);
  const [tutorHistory, setTutorHistory] = useState([]);

  // Multiplayer: dual preview state (like MultiplayerGameStudio)
  const [player1PreviewKey, setPlayer1PreviewKey] = useState(0);
  const [player2PreviewKey, setPlayer2PreviewKey] = useState(0);
  const [serverPreviewKey, setServerPreviewKey] = useState(0);
  const [activePreviewTab, setActivePreviewTab] = useState("split");
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [consoleOpen, setConsoleOpen] = useState(true);

  const { refreshProfile } = useAuth();

  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === "console") {
        setConsoleLogs((prev) => [...prev.slice(-99), { level: e.data.level, message: e.data.message, timestamp: e.data.timestamp || Date.now() }]);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const clearConsole = () => setConsoleLogs([]);

  const moduleConfig = useMemo(() => {
    if (!module) return MODULE_TYPES["javascript-basics"];
    return MODULE_TYPES[module.category] || MODULE_TYPES["javascript-basics"];
  }, [module]);

  const isReactModule = useMemo(
    () => module?.category !== "multiplayer" && moduleConfig.tabs.includes("jsx"),
    [moduleConfig, module?.category]
  );
  const isMultiplayerModule = useMemo(() => module?.category === "multiplayer", [module]);

  const difficultyStyles = {
    beginner: "bg-emerald-500/20 text-emerald-200 border border-emerald-400/40",
    intermediate: "bg-amber-500/20 text-amber-200 border border-amber-400/40",
    advanced: "bg-rose-500/20 text-rose-200 border border-rose-400/40",
  };

  const HINT_STYLES = [
    { value: "general", label: "General Hint", description: "Get a helpful nudge" },
    { value: "error-explanation", label: "Explain Error", description: "Understand error messages" },
    { value: "logic-guidance", label: "Logic Help", description: "Trace through code" },
    { value: "concept-reminder", label: "Concept Recap", description: "Review a concept" },
    { value: "visual-gameloop", label: "Game/Animation", description: "Game loops and animations" },
  ];

  const STORAGE_KEY = `codeEditorProgress_${moduleId}`;

  useEffect(() => {
    const fetchModule = async () => {
      try {
        const response = await modulesAPI.getById(moduleId);
        const moduleData = response.data.module;
        setModule(moduleData);
        setHtmlCode(moduleData.starterCode?.html || "");
        setCssCode(moduleData.starterCode?.css || "");
        setJsCode(moduleData.starterCode?.javascript || "");
        setJsxCode(moduleData.starterCode?.jsx || moduleData.starterCode?.javascript || "");
        const config = MODULE_TYPES[moduleData.category] || MODULE_TYPES["javascript-basics"];
        setActiveTab(config.defaultTab);
        setVerifyFeedback(null);
        setVerifyPassed(false);
        setStepFailureFeedback({});
        setMcqGateForStep(null);
        setMcqQuestions([]);
        setExplainCodeResult(null);
        const stepCount = moduleData.steps?.length || moduleData.objectives?.length || 1;
        let usedSession = false;
        try {
          const saved = sessionStorage.getItem(STORAGE_KEY);
          if (saved) {
            const { stepsVerified: savedVerified, currentStepIndex: savedStep } = JSON.parse(saved);
            if (Array.isArray(savedVerified) && savedVerified.length === stepCount && typeof savedStep === "number") {
              setStepsVerified(savedVerified);
              setCurrentStepIndex(Math.min(savedStep, stepCount - 1));
              usedSession = true;
            }
          }
          if (!usedSession) {
            const draft = await loadEditorDraft(moduleId);
            if (draft?.stepsVerified?.length === stepCount && typeof draft.currentStepIndex === "number") {
              setStepsVerified(draft.stepsVerified);
              setCurrentStepIndex(Math.min(draft.currentStepIndex, stepCount - 1));
            } else {
              setStepsVerified([]);
              setCurrentStepIndex(0);
            }
            if (draft?.code && typeof draft.code === "object") {
              if (draft.code.html != null) setHtmlCode(draft.code.html);
              if (draft.code.css != null) setCssCode(draft.code.css);
              if (draft.code.javascript != null) setJsCode(draft.code.javascript);
              if (draft.code.jsx != null) setJsxCode(draft.code.jsx);
            }
          } else {
            const draft = await loadEditorDraft(moduleId);
            if (draft?.code && typeof draft.code === "object") {
              if (draft.code.html != null) setHtmlCode(draft.code.html);
              if (draft.code.css != null) setCssCode(draft.code.css);
              if (draft.code.javascript != null) setJsCode(draft.code.javascript);
              if (draft.code.jsx != null) setJsxCode(draft.code.jsx);
            }
          }
        } catch {
          setStepsVerified([]);
          setCurrentStepIndex(0);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching module:", error);
        toast.error("We couldn't load this lesson. Try again from the dashboard.");
        navigate("/dashboard");
      }
    };
    fetchModule();
  }, [moduleId, navigate, STORAGE_KEY]);

  useEffect(() => {
    if (!module || steps.length === 0) return;
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ stepsVerified, currentStepIndex, moduleId })
    );
  }, [STORAGE_KEY, module, steps.length, stepsVerified, currentStepIndex, moduleId]);

  // IndexedDB draft auto-save (every 5s) for code and steps before system save
  useEffect(() => {
    if (!moduleId || !module) return;
    const interval = setInterval(() => {
      saveEditorDraft(moduleId, {
        stepsVerified,
        currentStepIndex,
        code: { html: htmlCode, css: cssCode, javascript: jsCode, jsx: jsxCode },
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [moduleId, module, stepsVerified, currentStepIndex, htmlCode, cssCode, jsCode, jsxCode]);

  const allStepsVerified = useMemo(() => {
    if (!steps.length) return false;
    return steps.every((_, i) => stepsVerified[i]);
  }, [steps, stepsVerified]);

  const handleVerifyCode = async () => {
    if (currentStepIndex >= steps.length) return;
    setVerifyLoading(true);
    setVerifyFeedback(null);
    setVerifyPassed(false);
    setStepFailureFeedback((prev) => {
      const next = { ...prev };
      delete next[currentStepIndex];
      return next;
    });
    try {
      const stepMeta = module?.steps?.[currentStepIndex];
      const verifyType = stepMeta?.verifyType || 'code';
      const payload = {
        stepIndex: currentStepIndex,
        stepDescription: steps[currentStepIndex].title,
        code: { html: htmlCode, css: cssCode, javascript: jsCode, jsx: jsxCode },
        moduleTitle: module?.title,
        objectives: module?.objectives,
        verifyType,
        expectedConsole: stepMeta?.expectedConsole ?? null,
      };
      if (verifyType === 'checkConsole') {
        payload.consoleOutput = consoleLogs.map((e) => ({ level: e.level, message: e.message }));
      }
      const resp = await tutorAPI.verifyStep(payload);
      const data = resp.data;
      const correct = !!data.correct;
      const feedback = data.feedback || (correct ? "Looks good!" : "Not quite yet. Check the hint and try again.");
      setVerifyFeedback(feedback);
      setVerifyPassed(correct);
      if (correct) {
        setStepsVerified((prev) => {
          const next = [...prev];
          next[currentStepIndex] = true;
          return next;
        });
        setPoints((p) => p + 15);
        toast.success("Step complete!");
        // Open MCQ gate: 1-2 questions before next step (only if step has concept / we want MCQ)
        const step = steps[currentStepIndex];
        if (step?.concept && currentStepIndex < steps.length - 1) {
          setMcqGateForStep(currentStepIndex);
          setMcqQuestions([]);
          setMcqCurrentIndex(0);
          setMcqSelectedIndex(null);
          setMcqResult(null);
          setMcqPassedCount(0);
          fetchMCQsForStep(step);
        }
      } else {
        setStepFailureFeedback((prev) => ({ ...prev, [currentStepIndex]: feedback }));
        toast.warning("Not quite yet. See the explanation below.");
        // Auto-open companion with instruction explanation + code-help prompt (no generic "why wrong" message)
        setShowTutorSidebar(true);
        const step = steps[currentStepIndex];
        const instructionBlock = [
          step?.title ? `**This step**\n\n${step.title}` : "",
          step?.instruction ? `**What you need to do**\n\n${step.instruction}` : "",
          step?.concept ? `**Concept**\n\n${step.concept}` : "",
        ]
          .filter(Boolean)
          .join("\n\n");
        const codeHelp =
          "**Need help with your code?**\n\nAsk below for a hint (e.g. \"How do I do this step?\") or highlight code in the editor and use **Explain selection**.";
        setTutorAnswer(instructionBlock ? `${instructionBlock}\n\n---\n\n${codeHelp}` : codeHelp);
        setTutorConfidence(0.5);
      }
    } catch (err) {
      console.error("Verify error", err);
      const msg = "Verification failed. Check the hint and try again.";
      setVerifyFeedback(msg);
      setVerifyPassed(false);
      setStepFailureFeedback((prev) => ({ ...prev, [currentStepIndex]: msg }));
      toast.error("Check the hint and try again.");
      setShowTutorSidebar(true);
      const step = steps[currentStepIndex];
      const instructionBlock = [
        step?.title ? `**This step**\n\n${step.title}` : "",
        step?.instruction ? `**What you need to do**\n\n${step.instruction}` : "",
        step?.concept ? `**Concept**\n\n${step.concept}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");
      const codeHelp =
        "**Need help with your code?**\n\nAsk below for a hint or use **Explain selection** on your code.";
      setTutorAnswer(instructionBlock ? `${instructionBlock}\n\n---\n\n${codeHelp}` : codeHelp);
    } finally {
      setVerifyLoading(false);
    }
  };

  const fetchMCQsForStep = async (step) => {
    setMcqLoading(true);
    setMcqResult(null);
    try {
      const resp = await tutorAPI.generateMCQs({
        stepTitle: step.title,
        stepConcept: step.concept,
        moduleTitle: module?.title,
        count: 2,
      });
      const questions = resp.data?.questions || [];
      setMcqQuestions(questions);
      setMcqCurrentIndex(0);
      setMcqSelectedIndex(null);
      if (questions.length === 0) {
        setMcqGateForStep(null);
      }
    } catch {
      setMcqQuestions([]);
      setMcqGateForStep(null);
      toast.error("Could not load quiz. You can continue to the next step.");
    } finally {
      setMcqLoading(false);
    }
  };

  const handleMCQSubmit = async () => {
    if (mcqQuestions.length === 0 || mcqSelectedIndex == null) return;
    const q = mcqQuestions[mcqCurrentIndex];
    setMcqVerifyLoading(true);
    setMcqResult(null);
    try {
      const resp = await tutorAPI.verifyMCQ({
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        selectedIndex: mcqSelectedIndex,
      });
      const { correct, explanation } = resp.data;
      setMcqResult({ correct, explanation });
      if (correct) {
        setMcqPassedCount((c) => c + 1);
        if (mcqCurrentIndex < mcqQuestions.length - 1) {
          setMcqCurrentIndex((i) => i + 1);
          setMcqSelectedIndex(null);
          setMcqResult(null);
        } else {
          setPoints((p) => p + 10);
          toast.success("Quiz passed! You can continue to the next step.");
        }
      } else {
        toast.warning("Wrong answer. Read the explanation below.");
      }
    } catch {
      setMcqResult({ correct: false, explanation: "Verification failed. Try again." });
    } finally {
      setMcqVerifyLoading(false);
    }
  };

  const handleMCQNextStep = () => {
    setMcqGateForStep(null);
    setMcqQuestions([]);
    setMcqResult(null);
    setMcqPassedCount(0);
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((i) => i + 1);
      setVerifyFeedback(null);
      setVerifyPassed(false);
    }
  };

  const handleExplainSelection = async () => {
    const view = editorViewRef.current;
    if (!view) {
      toast.info("Select some code in the editor first, then click Explain.");
      return;
    }
    try {
      const { from, to } = view.state.selection.main;
      const selected = view.state.sliceDoc(from, to).trim();
      if (!selected) {
        toast.info("Select some code in the editor first, then click Explain.");
        return;
      }
      setExplainCodeLoading(true);
      setExplainCodeResult(null);
      setShowTutorSidebar(true);
      const lang = activeTab === "jsx" ? "javascript" : activeTab === "js" ? "javascript" : activeTab;
      const resp = await tutorAPI.explainCode(selected, lang);
      setExplainCodeResult(resp.data?.explanation || "No explanation available.");
    } catch (err) {
      console.error("Explain code error", err);
      toast.error("Could not get explanation. Try again.");
    } finally {
      setExplainCodeLoading(false);
    }
  };

  const handleNextStep = () => {
    if (!verifyPassed && !stepsVerified[currentStepIndex]) return;
    setVerifyFeedback(null);
    setVerifyPassed(false);
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((i) => i + 1);
    }
  };

  const goToStep = (index) => {
    const canGo = index <= currentStepIndex || stepsVerified[index];
    if (canGo) {
      setCurrentStepIndex(index);
      setVerifyFeedback(null);
      setVerifyPassed(stepsVerified[index] || false);
    }
  };

  const getPreviewContent = useCallback(
    (playerRole = null) => {
      // Multiplayer "server" view: placeholder (server runs in Node.js, not in browser)
      if (isMultiplayerModule && playerRole === "server") {
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { margin: 0; padding: 24px; font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100%; display: flex; align-items: center; justify-content: center; }
    .panel { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; max-width: 360px; text-align: center; }
    h2 { color: #94a3b8; font-size: 18px; margin: 0 0 12px; }
    p { color: #64748b; font-size: 14px; line-height: 1.5; margin: 0; }
    code { background: #334155; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="panel">
    <h2>Server (Node.js)</h2>
    <p>Run your server separately with <code>node server.js</code>. This pane shows the server role; the two client panes show what each player sees.</p>
  </div>
</body>
</html>`;
      }
      if (isReactModule) {
        const jsx = playerRole
          ? jsxCode.replace(/playerRole\s*=\s*['"]?player\d?['"]?/i, `playerRole="${playerRole}"`)
          : jsxCode;
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>${cssCode}</style>
  <style>html, body, #root { margin: 0; padding: 0; min-height: 100%; } body { font-family: system-ui, sans-serif; }</style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const originalConsole = { ...console };
    ['log','info','warn','error'].forEach(level => {
      console[level] = (...args) => {
        originalConsole[level](...args);
        window.parent.postMessage({ type: 'console', level, message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), timestamp: Date.now() }, '*');
      };
    });
    try {
      ${jsx}
      if (typeof App !== 'undefined') {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App ${playerRole ? `playerRole="${playerRole}"` : ""} />);
      }
    } catch (e) {
      console.error('Runtime Error:', e.message);
      document.getElementById('root').innerHTML = '<div style="color:#ff6b6b;padding:20px;font-family:monospace;background:#1a1a2e;border-radius:8px;margin:20px;"><h3>Error</h3><pre style="color:#ffa07a;white-space:pre-wrap;">' + e.message + '</pre></div>';
    }
  </script>
</body>
</html>`;
      }
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
    (function() {
      var originalConsole = { log: console.log, info: console.info, warn: console.warn, error: console.error };
      function sendToParent(level, message) {
        try {
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'console', level: level, message: message, timestamp: Date.now() }, '*');
          }
        } catch (err) {}
      }
      ['log','info','warn','error'].forEach(function(level) {
        var fn = function() {
          originalConsole[level].apply(console, arguments);
          var message = Array.prototype.map.call(arguments, function(a) {
            return typeof a === 'object' ? JSON.stringify(a) : String(a);
          }).join(' ');
          sendToParent(level, message);
        };
        try { console[level] = fn; } catch (e) {}
      });
      window.__capturedConsole = console;
    })();
    function runUserCode() {
      var con = window.__capturedConsole || console;
      try {
        (function(console) {
          ${jsCode}
        })(con);
      } catch (e) {
        con.error('Runtime error: ' + (e && e.message ? e.message : String(e)));
        var errDiv = document.createElement('div');
        errDiv.style.cssText = 'color:#fc4a1a;padding:20px;font-family:monospace;background:#132f4c;border-radius:8px;margin:20px;';
        errDiv.innerHTML = '<h3>Error:</h3><pre>' + (e && e.message ? e.message : String(e)) + '</pre>';
        if (document.body) document.body.appendChild(errDiv);
      }
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', runUserCode);
    } else {
      runUserCode();
    }
  </script>
</body>
</html>`;
    },
    [isReactModule, isMultiplayerModule, htmlCode, cssCode, jsCode, jsxCode],
  );

  const handleCompleteModule = async () => {
    if (!allStepsVerified) return;
    try {
      const sessionStats = { totalEdits: codeChanges, streak, totalRuns: 0, sessionTime: 0, saveCount: 0 };
      const resp = await userAPI.completeModule(moduleId, sessionStats);
      if (resp.data.user) refreshProfile?.(resp.data.user);
      const totalPointsEarned = points + completionBonus;
      const newlyEarned = resp.data?.newlyEarned || [];
      let message = `Lesson complete! You earned ${points} points + ${completionBonus} bonus = ${totalPointsEarned} total.`;
      if (newlyEarned.length > 0) message += ` ${newlyEarned.length} new achievement(s)!`;
      toast.success(message, { autoClose: 5000 });
      navigate("/dashboard");
    } catch (error) {
      console.error("Error completing module:", error);
    }
  };

  const handleCodeChange = (value, setter) => {
    setter(value);
    setCodeChanges((prev) => prev + 1);
    setPoints((prev) => prev + 2);
    if (window.previewTimeout) clearTimeout(window.previewTimeout);
    window.previewTimeout = setTimeout(() => setPreviewKey((k) => k + 1), 1500);
  };

  const handleRunCode = () => {
    setPreviewKey((k) => k + 1);
    setPlayer1PreviewKey((k) => k + 1);
    setPlayer2PreviewKey((k) => k + 1);
    setServerPreviewKey((k) => k + 1);
    setPoints((p) => p + 5);
    setStreak((s) => s + 1);
  };

  const handleReset = () => setShowResetConfirm(true);
  const confirmReset = () => {
    setHtmlCode(module.starterCode?.html || "");
    setCssCode(module.starterCode?.css || "");
    setJsCode(module.starterCode?.javascript || "");
    setJsxCode(module.starterCode?.jsx || module.starterCode?.javascript || "");
    setPoints(0);
    setCodeChanges(0);
    setStreak(0);
    setStepsVerified([]);
    setCurrentStepIndex(0);
    setVerifyFeedback(null);
    setVerifyPassed(false);
    setStepFailureFeedback({});
    setMcqGateForStep(null);
    setMcqQuestions([]);
    setMcqResult(null);
    setPreviewKey((k) => k + 1);
    setShowResetConfirm(false);
    sessionStorage.removeItem(STORAGE_KEY);
    toast.info("Code reset to starter template.");
  };

  const handleTutorSubmit = async (e) => {
    e.preventDefault();
    if (!tutorQuestion.trim()) return;
    setTutorLoading(true);
    setTutorAnswer(null);
    setTutorConfidence(null);
    try {
      const resp = await tutorAPI.ask(tutorQuestion, {
        type: "hint-mode",
        hintStyle,
        moduleTitle: module?.title,
        objectives: module?.objectives,
        currentStepIndex: currentStepIndex,
        currentStepDescription: steps[currentStepIndex]?.title ?? null,
        code: { html: htmlCode, css: cssCode, javascript: jsCode, jsx: jsxCode },
        currentFile: `${activeTab}.${activeTab === "js" ? "js" : activeTab}`,
        errorMessage: tutorQuestion.match(/error:?\s*(.+)/i)?.[1] || null,
      });
      let answer = resp.data.answer || "We couldn't get a hint right now.";
      // Never show raw API internals (thinking, model, eval_count, etc.)
      if (typeof answer === "string" && (answer.includes('"thinking"') || answer.includes('"eval_count"') || answer.includes('"model":'))) {
        answer = "Something went wrong. Please try asking again.";
      }
      setTutorAnswer(answer);
      setTutorConfidence(resp.data.confidence);
      setTutorHistory((prev) => [...prev.slice(-4), { question: tutorQuestion, answer, style: hintStyle, timestamp: new Date().toLocaleTimeString() }]);
    } catch (err) {
      console.error("Tutor error", err);
      setTutorAnswer("Something went wrong. Please try again.");
    } finally {
      setTutorLoading(false);
    }
  };

  const openLivePreviewInNewTab = () => {
    const html = getPreviewContent();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        <p className="text-sm text-slate-400">Loading module...</p>
      </div>
    );
  }

  const currentStep = steps[currentStepIndex];

  return (
    <div className="h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col">
      {/* Header - Studio style like CustomGameStudio / MultiplayerGameStudio */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-slate-900/80 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-sm hover:bg-white/10 transition"
          >
            <FaBookOpen />
            Dashboard
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 border border-white/20 rounded flex items-center justify-center">
              {isMultiplayerModule ? <FaUsers className="text-purple-400" /> : <FaCode className="text-cyan-400" />}
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">{module.title}</h1>
              <p className="text-xs text-slate-500">
                {isMultiplayerModule ? "Multiplayer Module" : "Module Tutorial"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs">
            <span className="text-amber-400"><FaStar /> {points}</span>
            <span className="text-cyan-400"><FaCode /> {codeChanges}</span>
            <span className="text-rose-200"><FaBolt /> {streak}</span>
            <span className="text-amber-200"><FaTrophy /> +{completionBonus}</span>
          </div>
          <button
            onClick={handleRunCode}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-sm font-medium hover:bg-green-500/30 transition"
          >
            <FaPlay /> Run
          </button>
          <button
            onClick={handleExplainSelection}
            disabled={explainCodeLoading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-400 text-sm font-medium hover:bg-violet-500/30 transition disabled:opacity-50"
            title="Highlight code in the editor and click to get an explanation"
          >
            {explainCodeLoading ? <span className="animate-pulse">…</span> : <FaMagic />}
            Explain selection
          </button>
          <button onClick={handleReset} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition">
            <FaUndo /> Reset
          </button>
          <button
            onClick={() => setShowTutorSidebar(!showTutorSidebar)}
            className={`p-2 rounded-lg transition ${showTutorSidebar ? "bg-violet-500/30 text-violet-300" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}
            title="Companion"
          >
            <FaBolt />
          </button>
          <button
            onClick={handleCompleteModule}
            disabled={!allStepsVerified}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-400/90 text-slate-950 text-sm font-semibold hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <FaCheck /> Complete
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Left: Instructions (wider panel for readability) */}
        <aside className="w-[420px] border-r border-white/10 bg-slate-900/70 flex flex-col shrink-0 min-h-0">
          <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/90 px-4 py-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
              <FaBookOpen /> Instructions
            </h2>
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="inline-flex h-8 w-8 items-center justify-center rounded border border-white/10 bg-white/5 text-xs"
            >
              {showInstructions ? <FaChevronDown /> : <FaChevronRight />}
            </button>
          </div>

          {showInstructions && (
            <div className="overflow-y-auto scrollbar-hide flex-1 min-h-0 p-4 border-b border-white/10 flex flex-col gap-4">
              <div className="flex flex-wrap gap-2 shrink-0">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase ${difficultyStyles[module.difficulty]}`}>
                  {module.difficulty}
                </span>
                <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  {module.category.replace("-", " ")}
                </span>
              </div>

              {/* 1. Lesson overview first — more space for easy reading */}
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4 shrink-0 min-h-[200px] flex flex-col">
                <h3 className="text-sm font-semibold text-white mb-3">Lesson overview</h3>
                <div className="text-sm text-slate-300 leading-relaxed overflow-y-auto scrollbar-hide flex-1 min-h-[180px] pr-1">
                  <MarkdownContent content={module.content} />
                </div>
              </div>

              {/* 2. Step-by-step: expand only the active step */}
              <div className="shrink-0">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Step-by-step
                </h3>
                <ul className="space-y-2">
                  {steps.map((step, i) => {
                    const verified = stepsVerified[i];
                    const isCurrent = i === currentStepIndex;
                    const locked = i > currentStepIndex && !verified;
                    const failedFeedback = stepFailureFeedback[i];
                    const showExpanded = isCurrent;
                    return (
                      <li
                        key={step.id}
                        className={`rounded-lg border overflow-hidden transition-all ${
                          isCurrent
                            ? "border-cyan-400/40 bg-cyan-500/10"
                            : verified
                              ? "border-emerald-400/30 bg-emerald-500/5"
                              : failedFeedback
                                ? "border-red-400/40 bg-red-500/10"
                                : "border-white/10 bg-slate-950/40"
                        }`}
                      >
                        <button
                          onClick={() => !locked && goToStep(i)}
                          disabled={locked}
                          className={`w-full text-left flex items-center gap-2 px-3 py-2 text-xs transition ${
                            locked ? "cursor-not-allowed text-slate-500" : "hover:bg-white/5"
                          } ${isCurrent ? "text-cyan-200" : verified ? "text-emerald-200" : failedFeedback ? "text-red-200" : "text-slate-300"}`}
                        >
                          <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-white/10">
                            {verified ? <FaCheck className="text-emerald-400" /> : failedFeedback ? <FaTimes className="text-red-400" /> : i + 1}
                          </span>
                          <span className={`flex-1 min-w-0 font-medium truncate ${failedFeedback ? "line-through opacity-90" : ""}`}>
                            {step.title}
                          </span>
                          <span className={`shrink-0 transition-transform ${showExpanded ? "rotate-90" : ""}`}>
                            <FaChevronRight className="text-[10px]" />
                          </span>
                        </button>
                        {showExpanded && (
                          <div className="px-3 pb-3 pt-0 border-t border-white/10 mt-0">
                            <p className="text-xs text-slate-200 leading-relaxed mt-2">
                              {step.instruction ?? step.title}
                            </p>
                            {step.concept && (
                              <p className="text-[11px] text-cyan-300/90 mt-2 italic border-l-2 border-cyan-400/50 pl-2">
                                {step.concept}
                              </p>
                            )}
                          </div>
                        )}
                        {failedFeedback && (
                          <div className="px-3 pb-2 pt-0">
                            <div className="rounded p-1.5 text-[10px] bg-red-500/15 text-red-200 border border-red-400/30">
                              {failedFeedback}
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* 3. Hints last */}
              {module.hints?.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3 shrink-0">
                  <h3 className="text-xs font-semibold text-white mb-2">Hints</h3>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-slate-400">
                    {module.hints.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Actions: MCQ gate + Check / Next */}
          <div className="flex flex-col min-h-0 px-4 pt-3 pb-2 shrink-0">
            {/* MCQ gate: 1-2 questions between steps (qwen3-coder) */}
            {mcqGateForStep !== null && (
              <div className="mt-2 pt-2 border-t border-amber-400/30 space-y-2 shrink-0 rounded-lg bg-amber-500/10 border border-amber-400/30 p-2">
                <h4 className="text-xs font-semibold text-amber-200">Concept check</h4>
                {mcqLoading ? (
                  <p className="text-[11px] text-slate-400">Loading questions…</p>
                ) : mcqQuestions.length > 0 ? (
                  <>
                    <p className="text-[11px] text-slate-300">
                      Question {mcqCurrentIndex + 1} of {mcqQuestions.length}: {mcqQuestions[mcqCurrentIndex]?.question}
                    </p>
                    <div className="space-y-1">
                      {mcqQuestions[mcqCurrentIndex]?.options?.map((opt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setMcqSelectedIndex(idx)}
                          className={`w-full text-left px-2 py-1.5 rounded text-[11px] border transition ${
                            mcqSelectedIndex === idx ? "border-amber-400 bg-amber-500/20 text-amber-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    {mcqResult && (
                      <div className={`rounded p-1.5 text-[11px] ${mcqResult.correct ? "bg-emerald-500/20 text-emerald-200" : "bg-red-500/20 text-red-200"}`}>
                        {mcqResult.explanation}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleMCQSubmit}
                        disabled={mcqVerifyLoading || mcqSelectedIndex == null}
                        className="flex-1 py-1.5 rounded bg-amber-500/90 text-slate-950 text-xs font-semibold hover:bg-amber-400 disabled:opacity-50"
                      >
                        {mcqVerifyLoading ? "Checking…" : "Check answer"}
                      </button>
                      {mcqPassedCount === mcqQuestions.length && mcqQuestions.length > 0 && (
                        <button type="button" onClick={handleMCQNextStep} className="flex-1 py-1.5 rounded bg-emerald-500/90 text-slate-950 text-xs font-semibold hover:bg-emerald-400">
                          Next step <FaChevronRight />
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <button type="button" onClick={handleMCQNextStep} className="w-full py-1.5 rounded bg-slate-500/50 text-slate-200 text-xs">
                    Skip to next step
                  </button>
                )}
              </div>
            )}

            {/* Current step: instruction per step (title + full instruction) */}
            {mcqGateForStep === null && (
              <div className="mt-2 pt-2 border-t border-white/10 space-y-2 shrink-0">
                <div className="rounded-lg bg-cyan-500/10 border border-cyan-400/30 p-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-cyan-400/90 mb-1">
                    Step {currentStepIndex + 1} of {steps.length}
                  </p>
                  {currentStep?.title && (
                    <p className="text-xs font-semibold text-white mb-1.5">{currentStep.title}</p>
                  )}
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {currentStep?.instruction ?? currentStep?.title ?? "Complete this step."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={verifyLoading}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-cyan-500/90 text-slate-950 text-xs font-semibold hover:bg-cyan-400 disabled:opacity-60"
                >
                  {verifyLoading ? "Checking…" : "Check my code"}
                </button>
                {(verifyPassed || stepsVerified[currentStepIndex]) && currentStepIndex < steps.length - 1 && (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-500/90 text-slate-950 text-xs font-semibold hover:bg-emerald-400"
                  >
                    Next step <FaChevronRight />
                  </button>
                )}
                {verifyFeedback && (
                  <div
                    className={`rounded-lg p-1.5 text-[11px] leading-tight ${
                      verifyPassed ? "bg-emerald-500/20 text-emerald-200" : "bg-amber-500/20 text-amber-200"
                    }`}
                  >
                    {verifyFeedback}
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Center + Right: Editor and Preview (Studio layout) */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Tabs: Editor | Live Preview */}
          <div className="flex border-b border-white/10 bg-slate-900/50 shrink-0">
            <button
              onClick={() => setMainViewTab("editor")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-medium transition ${
                mainViewTab === "editor" ? "border-b-2 border-cyan-400 text-cyan-200" : "text-slate-400 hover:text-white"
              }`}
            >
              <FaCode /> Editor
            </button>
            <button
              onClick={() => setMainViewTab("preview")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-medium transition ${
                mainViewTab === "preview" ? "border-b-2 border-cyan-400 text-cyan-200" : "text-slate-400 hover:text-white"
              }`}
            >
              <FaPlay /> Live Preview
            </button>
            {mainViewTab === "preview" && (
              <button
                onClick={openLivePreviewInNewTab}
                className="ml-auto flex items-center gap-1 px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                <FaExternalLinkAlt /> Open in new tab
              </button>
            )}
          </div>

          {mainViewTab === "editor" && (
            <div className="flex-1 flex min-h-0">
              {/* Code editor area - same as Studio */}
              <div className="flex-1 flex flex-col border-r border-white/10 bg-slate-950 min-w-0">
                <div className="flex items-center border-b border-white/10 bg-slate-900/80">
                  {moduleConfig.tabs.map((tab) => (
                    <button
                      key={tab}
                      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${
                        activeTab === tab ? "border-b-2 border-cyan-400 text-cyan-200" : "text-slate-400 hover:text-white"
                      }`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab === "jsx" && <FaReact className="text-cyan-400" />}
                      {tab.toUpperCase()}
                    </button>
                  ))}
                  {isReactModule && (
                    <span className="ml-auto mr-4 flex items-center gap-1 text-xs text-cyan-400">
                      <FaReact /> React
                    </span>
                  )}
                  {isMultiplayerModule && (
                    <span className="ml-auto mr-4 flex items-center gap-1 text-xs text-purple-400">
                      <FaUsers /> Multiplayer
                    </span>
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  {activeTab === "html" && (
                    <CodeMirror
                      value={htmlCode}
                      height="100%"
                      theme={vscodeDark}
                      extensions={[html()]}
                      onCreateEditor={(view) => { editorViewRef.current = view; }}
                      onChange={(v, vu) => {
                        if (vu?.view) editorViewRef.current = vu.view;
                        handleCodeChange(v, setHtmlCode);
                      }}
                      options={{ lineNumbers: true, lineWrapping: true }}
                    />
                  )}
                  {activeTab === "css" && (
                    <CodeMirror
                      value={cssCode}
                      height="100%"
                      theme={vscodeDark}
                      extensions={[css()]}
                      onCreateEditor={(view) => { editorViewRef.current = view; }}
                      onChange={(v, vu) => {
                        if (vu?.view) editorViewRef.current = vu.view;
                        handleCodeChange(v, setCssCode);
                      }}
                      options={{ lineNumbers: true, lineWrapping: true }}
                    />
                  )}
                  {activeTab === "js" && (
                    <CodeMirror
                      value={jsCode}
                      height="100%"
                      theme={vscodeDark}
                      extensions={[javascript()]}
                      onCreateEditor={(view) => { editorViewRef.current = view; }}
                      onChange={(v, vu) => {
                        if (vu?.view) editorViewRef.current = vu.view;
                        handleCodeChange(v, setJsCode);
                      }}
                      options={{ lineNumbers: true, lineWrapping: true }}
                    />
                  )}
                  {activeTab === "jsx" && (
                    <CodeMirror
                      value={jsxCode}
                      height="100%"
                      theme={vscodeDark}
                      extensions={[javascript({ jsx: true })]}
                      onCreateEditor={(view) => { editorViewRef.current = view; }}
                      onChange={(v, vu) => {
                        if (vu?.view) editorViewRef.current = vu.view;
                        handleCodeChange(v, setJsxCode);
                      }}
                      options={{ lineNumbers: true, lineWrapping: true }}
                    />
                  )}
                </div>
              </div>

              {/* Right: Preview panel - single or dual (multiplayer) like MultiplayerGameStudio */}
              <div className="min-w-[420px] w-[min(520px,45%)] flex flex-col border-l border-white/10 bg-slate-900/70 shrink-0 min-h-0">
                {isMultiplayerModule ? (
                  <>
                    <div className="flex border-b border-white/10 bg-slate-900/50">
                      <button
                        onClick={() => setActivePreviewTab("server")}
                        className={`flex-1 flex items-center justify-center gap-2 px-2 py-2 text-xs font-medium ${
                          activePreviewTab === "server" ? "bg-amber-500/20 text-amber-400 border-b-2 border-amber-400" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Server
                      </button>
                      <button
                        onClick={() => setActivePreviewTab("player1")}
                        className={`flex-1 flex items-center justify-center gap-2 px-2 py-2 text-xs font-medium ${
                          activePreviewTab === "player1" ? "bg-red-500/20 text-red-400 border-b-2 border-red-400" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        <FaUser /> Client 1
                      </button>
                      <button
                        onClick={() => setActivePreviewTab("player2")}
                        className={`flex-1 flex items-center justify-center gap-2 px-2 py-2 text-xs font-medium ${
                          activePreviewTab === "player2" ? "bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-400" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        <FaUser /> Client 2
                      </button>
                      <button
                        onClick={() => setActivePreviewTab("split")}
                        className={`flex-1 flex items-center justify-center gap-2 px-2 py-2 text-xs font-medium ${
                          activePreviewTab === "split" ? "bg-purple-500/20 text-purple-400 border-b-2 border-purple-400" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        <FaColumns /> All 3
                      </button>
                    </div>
                    <div className="flex-1 bg-gray-900 overflow-hidden">
                      {activePreviewTab === "split" ? (
                        <div className="grid grid-cols-3 h-full">
                          <div className="border-r border-white/10 flex flex-col">
                            <div className="px-2 py-1 bg-amber-500/10 text-amber-500 text-xs font-bold text-center">Server</div>
                            <iframe
                              key={`server-${serverPreviewKey}`}
                              srcDoc={getPreviewContent("server")}
                              className="flex-1 border-0 w-full h-full min-h-0"
                              sandbox="allow-scripts allow-same-origin"
                              title="Server"
                            />
                          </div>
                          <div className="border-r border-white/10 flex flex-col">
                            <div className="px-2 py-1 bg-red-500/10 text-red-500 text-xs font-bold text-center">Client 1</div>
                            <iframe
                              key={`p1-${player1PreviewKey}`}
                              srcDoc={getPreviewContent("player1")}
                              className="flex-1 border-0 w-full h-full min-h-0"
                              sandbox="allow-scripts allow-same-origin"
                              title="Client 1"
                            />
                          </div>
                          <div className="flex flex-col">
                            <div className="px-2 py-1 bg-cyan-500/10 text-cyan-500 text-xs font-bold text-center">Client 2</div>
                            <iframe
                              key={`p2-${player2PreviewKey}`}
                              srcDoc={getPreviewContent("player2")}
                              className="flex-1 border-0 w-full h-full min-h-0"
                              sandbox="allow-scripts allow-same-origin"
                              title="Client 2"
                            />
                          </div>
                        </div>
                      ) : (
                        <iframe
                          key={
                            activePreviewTab === "server"
                              ? `server-${serverPreviewKey}`
                              : activePreviewTab === "player1"
                                ? `p1-${player1PreviewKey}`
                                : `p2-${player2PreviewKey}`
                          }
                          srcDoc={getPreviewContent(activePreviewTab)}
                          className="w-full h-full border-0"
                          sandbox="allow-scripts allow-same-origin"
                          title={activePreviewTab === "server" ? "Server" : `${activePreviewTab} Preview`}
                        />
                      )}
                    </div>
                    <div className="border-t border-white/10 bg-slate-950 flex flex-col shrink-0" style={{ maxHeight: consoleOpen ? 180 : 36 }}>
                      <button
                        onClick={() => setConsoleOpen(!consoleOpen)}
                        className="flex items-center justify-between w-full px-4 py-2 text-left text-xs font-semibold text-slate-300 hover:bg-white/5 border-b border-white/10"
                      >
                        <span className="flex items-center gap-2">
                          Console
                          {consoleLogs.length > 0 && (
                            <span className="rounded-full bg-slate-600 px-2 py-0.5 text-[10px]">{consoleLogs.length}</span>
                          )}
                        </span>
                        {consoleOpen ? <FaChevronDown className="w-3 h-3" /> : <FaChevronRight className="w-3 h-3" />}
                      </button>
                      {consoleOpen && (
                        <>
                          <div className="flex justify-end px-2 py-1 border-b border-white/10">
                            <button onClick={clearConsole} className="text-[10px] text-slate-500 hover:text-slate-300 px-2 py-0.5 rounded">Clear</button>
                          </div>
                          <div className="overflow-y-auto scrollbar-hide flex-1 min-h-0 p-2 font-mono text-[11px] space-y-1 bg-slate-950">
                            {consoleLogs.length === 0 ? (
                              <p className="text-slate-500 italic">No console output yet.</p>
                            ) : (
                              consoleLogs.map((entry, i) => (
                                <div
                                  key={`${entry.timestamp}-${i}`}
                                  className={`flex gap-2 py-0.5 px-2 rounded ${
                                    entry.level === "error" ? "text-red-400 bg-red-500/10" : entry.level === "warn" ? "text-amber-400 bg-amber-500/10" : entry.level === "info" ? "text-cyan-400 bg-cyan-500/10" : "text-slate-300 bg-white/5"
                                  }`}
                                >
                                  <span className="shrink-0 opacity-70">[{entry.level}]</span>
                                  <span className="break-all flex-1">{entry.message}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/90 px-4 py-3">
                      <h2 className="text-sm font-semibold text-white">Preview</h2>
                      <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200">
                        Auto-refresh
                      </span>
                    </div>
                    <iframe
                      key={previewKey}
                      className="flex-1 border-0 bg-gray-900 w-full min-h-0"
                      title="preview"
                      srcDoc={getPreviewContent()}
                      sandbox="allow-scripts allow-same-origin"
                    />
                    <div className="border-t border-white/10 bg-slate-950 flex flex-col shrink-0" style={{ maxHeight: consoleOpen ? 180 : 36 }}>
                      <button
                        onClick={() => setConsoleOpen(!consoleOpen)}
                        className="flex items-center justify-between w-full px-4 py-2 text-left text-xs font-semibold text-slate-300 hover:bg-white/5 border-b border-white/10"
                      >
                        <span className="flex items-center gap-2">
                          Console
                          {consoleLogs.length > 0 && (
                            <span className="rounded-full bg-slate-600 px-2 py-0.5 text-[10px]">{consoleLogs.length}</span>
                          )}
                        </span>
                        {consoleOpen ? <FaChevronDown className="w-3 h-3" /> : <FaChevronRight className="w-3 h-3" />}
                      </button>
                      {consoleOpen && (
                        <>
                          <div className="flex justify-end px-2 py-1 border-b border-white/10">
                            <button
                              onClick={clearConsole}
                              className="text-[10px] text-slate-500 hover:text-slate-300 px-2 py-0.5 rounded"
                            >
                              Clear
                            </button>
                          </div>
                          <div className="overflow-y-auto scrollbar-hide flex-1 min-h-0 p-2 font-mono text-[11px] space-y-1 bg-slate-950">
                            {consoleLogs.length === 0 ? (
                              <p className="text-slate-500 italic">No console output yet. Use console.log() in your code.</p>
                            ) : (
                              consoleLogs.map((entry, i) => (
                                <div
                                  key={`${entry.timestamp}-${i}`}
                                  className={`flex gap-2 py-0.5 px-2 rounded ${
                                    entry.level === "error"
                                      ? "text-red-400 bg-red-500/10"
                                      : entry.level === "warn"
                                        ? "text-amber-400 bg-amber-500/10"
                                        : entry.level === "info"
                                          ? "text-cyan-400 bg-cyan-500/10"
                                          : "text-slate-300 bg-white/5"
                                  }`}
                                >
                                  <span className="shrink-0 opacity-70">[{entry.level}]</span>
                                  <span className="break-all flex-1">{entry.message}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {mainViewTab === "preview" && (
            <div className="flex-1 flex flex-col bg-slate-900 min-h-0">
              {isMultiplayerModule ? (
                <div className="flex border-b border-white/10">
                  <button
                    onClick={() => setActivePreviewTab("server")}
                    className={`flex-1 py-2 text-xs font-medium ${activePreviewTab === "server" ? "bg-amber-500/20 text-amber-400" : "text-slate-400"}`}
                  >
                    Server
                  </button>
                  <button
                    onClick={() => setActivePreviewTab("player1")}
                    className={`flex-1 py-2 text-xs font-medium ${activePreviewTab === "player1" ? "bg-red-500/20 text-red-400" : "text-slate-400"}`}
                  >
                    Client 1
                  </button>
                  <button
                    onClick={() => setActivePreviewTab("player2")}
                    className={`flex-1 py-2 text-xs font-medium ${activePreviewTab === "player2" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400"}`}
                  >
                    Client 2
                  </button>
                  <button
                    onClick={() => setActivePreviewTab("split")}
                    className={`flex-1 py-2 text-xs font-medium ${activePreviewTab === "split" ? "bg-purple-500/20 text-purple-400" : "text-slate-400"}`}
                  >
                    All 3
                  </button>
                </div>
              ) : null}
              <div className="flex-1 min-h-0">
                {isMultiplayerModule && activePreviewTab === "split" ? (
                  <div className="grid grid-cols-3 h-full">
                    <iframe key={`lp-server-${serverPreviewKey}`} srcDoc={getPreviewContent("server")} className="w-full h-full border-0" sandbox="allow-scripts allow-same-origin" title="Server" />
                    <iframe key={`lp-p1-${player1PreviewKey}`} srcDoc={getPreviewContent("player1")} className="w-full h-full border-0" sandbox="allow-scripts allow-same-origin" title="Client 1" />
                    <iframe key={`lp-p2-${player2PreviewKey}`} srcDoc={getPreviewContent("player2")} className="w-full h-full border-0" sandbox="allow-scripts allow-same-origin" title="Client 2" />
                  </div>
                ) : (
                  <iframe
                    key={`lp-${previewKey}`}
                    className="w-full h-full border-0 bg-gray-900"
                    title="Live Preview"
                    srcDoc={getPreviewContent(isMultiplayerModule ? activePreviewTab : null)}
                    sandbox="allow-scripts allow-same-origin"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Companion – overlay on top, does not cramp layout */}
        {showTutorSidebar && (
          <aside className="fixed top-14 right-0 bottom-0 w-80 max-w-[90vw] z-50 flex flex-col border-l border-white/20 bg-slate-900/95 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 shrink-0">
              <h2 className="text-sm font-semibold text-white">Companion</h2>
              <button onClick={() => setShowTutorSidebar(false)} className="p-2 rounded text-slate-400 hover:text-white hover:bg-white/10">
                <FaTimes />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide p-4 text-sm text-slate-300 space-y-4">
              {/* Code explanation (highlight → Explain selection) */}
              {(explainCodeResult || explainCodeLoading) && (
                <div className="rounded-xl border border-violet-400/30 bg-violet-500/10 p-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-violet-200 mb-2">
                    <FaMagic /> Code explanation
                  </div>
                  {explainCodeLoading ? (
                    <div className="flex items-center gap-2 text-violet-200">
                      <div className="h-4 w-4 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
                      <span className="text-xs">Explaining selected code…</span>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-200 leading-relaxed">
                      <MarkdownContent content={explainCodeResult} />
                    </div>
                  )}
                </div>
              )}
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Help mode</p>
                <div className="flex flex-wrap gap-2">
                  {HINT_STYLES.map((s) => (
                    <button
                      key={s.value}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        hintStyle === s.value ? "border-violet-400/50 bg-violet-500/10 text-violet-200" : "border-white/10 bg-slate-950/60 text-slate-300"
                      }`}
                      onClick={() => setHintStyle(s.value)}
                      title={s.description}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <form onSubmit={handleTutorSubmit} className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-wider text-slate-400">Your question</label>
                <textarea
                  className="min-h-[100px] rounded-xl border border-white/10 bg-slate-950/70 p-3 text-xs text-slate-100 outline-none"
                  value={tutorQuestion}
                  onChange={(e) => setTutorQuestion(e.target.value)}
                  placeholder="Describe your problem or ask for a hint..."
                />
                <button
                  type="submit"
                  disabled={tutorLoading || !tutorQuestion.trim()}
                  className="rounded-full bg-violet-500/90 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-violet-400 disabled:opacity-60"
                >
                  {tutorLoading ? "Thinking…" : "Ask companion"}
                </button>
              </form>
              {tutorLoading && (
                <div className="rounded-xl border border-violet-400/30 bg-violet-500/10 p-3 flex items-center gap-3 text-violet-200">
                  <div className="h-5 w-5 shrink-0 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
                  <span className="text-xs font-medium">Getting a hint…</span>
                </div>
              )}
              {tutorAnswer && !tutorLoading && (
                <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-xs text-emerald-100">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-200 mb-2">
                    Companion
                    {tutorConfidence != null && (
                      <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[10px]">
                        {tutorConfidence >= 0.6 ? "Targeted" : tutorConfidence >= 0.4 ? "General" : "Needs context"}
                      </span>
                    )}
                  </div>
                  <MarkdownContent content={tutorAnswer} />
                  {tutorHistory.length > 0 && (
                    <details className="mt-2 rounded border border-white/10 bg-slate-950/60 p-2 text-[10px]">
                      <summary className="cursor-pointer">Previous replies ({tutorHistory.length})</summary>
                      <div className="mt-2 space-y-1">
                        {tutorHistory.slice().reverse().map((item, idx) => (
                          <div key={idx} className="rounded px-2 py-1 bg-white/5">
                            <span className="text-slate-500">{item.timestamp}</span>
                            <p className="text-slate-300 truncate">{item.question}</p>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      <ConfirmModal
        open={showResetConfirm}
        title="Reset code?"
        message="Reset to starter template? Step progress and session points will be cleared."
        onConfirm={confirmReset}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};

export default CodeEditor;
