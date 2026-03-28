import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { modulesAPI, userAPI, tutorAPI, achievementsAPI, invalidateUserCaches } from '../api/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
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
  FaChevronLeft,
  FaChevronDown,
  FaChevronUp,
  FaTimes,
  FaExternalLinkAlt,
  FaUser,
  FaMagic,
  FaServer,
  FaLock,
  FaArrowLeft,
  FaFire,
  FaLightbulb,
  FaExclamationTriangle,
  FaCheckCircle,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import ConfirmModal from '../components/ui/ConfirmModal';
import LoadingScreen from '../components/ui/LoadingScreen';
import MarkdownContent from '../components/ui/MarkdownContent';
import { loadEditorDraft, saveEditorDraft } from '../utils/draftStorage';
import { buildServerPreviewHtml, buildClientPreviewHtml } from '../utils/multiplayerRuntime';

// Module type configurations (multiplayer uses HTML/CSS/JS only, no React)
const MODULE_TYPES = {
  'javascript-basics': { tabs: ['html', 'css', 'js'], defaultTab: 'html' },
  'game-development': { tabs: ['html', 'css', 'js'], defaultTab: 'js' },
  'react-basics': { tabs: ['jsx', 'css'], defaultTab: 'jsx' },
  multiplayer: { tabs: ['server', 'html', 'css', 'js'], defaultTab: 'server' },
  'advanced-concepts': { tabs: ['jsx', 'css', 'js'], defaultTab: 'jsx' },
};

// Context-relevant images for lecture slides: { keywords, url }
const SLIDE_IMAGES = [
  { keywords: ['console', 'log', 'print', 'output', 'debug'], url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop' },
  { keywords: ['variable', 'const', 'let', 'var', 'assign', 'data type'], url: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&h=400&fit=crop' },
  { keywords: ['loop', 'for', 'while', 'iterate', 'array'], url: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&h=400&fit=crop' },
  { keywords: ['function', 'call', 'return', 'parameter'], url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=400&fit=crop' },
  { keywords: ['game', 'canvas', 'sprite', 'player', 'score'], url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=400&fit=crop' },
  { keywords: ['react', 'component', 'jsx', 'hook'], url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop' },
  { keywords: ['state', 'usestate', 'event', 'click'], url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop' },
  { keywords: ['multiplayer', 'server', 'socket', 'network'], url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop' },
  { keywords: ['condition', 'if', 'else', 'switch'], url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=400&fit=crop' },
  { keywords: ['html', 'css', 'dom', 'element'], url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=400&fit=crop' },
];
const DEFAULT_SLIDE_IMAGE = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=400&fit=crop';

function getSlideImage(slideContent, moduleTitle, category) {
  const text = `${(slideContent || '').toLowerCase()} ${(moduleTitle || '').toLowerCase()} ${(category || '').toLowerCase()}`;
  let best = { score: 0, url: DEFAULT_SLIDE_IMAGE };
  for (const { keywords, url } of SLIDE_IMAGES) {
    let score = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) score += 1;
    }
    if (score > best.score) best = { score, url };
  }
  return best.url;
}

const CodeEditor = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();

  const [module, setModule] = useState(null);
  const [activeTab, setActiveTab] = useState('html');
  const [loading, setLoading] = useState(true);
  const [previewKey, setPreviewKey] = useState(0);
  const [editorKey, setEditorKey] = useState(0); // Force editor remount when needed
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);

  // Step-by-step: use module.steps (4-5 small steps) when present, else objectives
  const steps = useMemo(() => {
    if (module?.steps?.length) {
      return module.steps.map((s, i) => ({
        id: i,
        title: s.title,
        instruction: s.instruction || s.title,
        concept: s.concept || '',
        verified: false,
      }));
    }
    if (!module?.objectives?.length)
      return [
        {
          id: 0,
          title: 'Complete the lesson',
          instruction: 'Complete the lesson',
          concept: '',
          verified: false,
        },
      ];
    return module.objectives.map((obj, i) => ({
      id: i,
      title: obj,
      instruction: obj,
      concept: '',
      verified: false,
    }));
  }, [module]);
  const [stepsVerified, setStepsVerified] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyFeedback, setVerifyFeedback] = useState(null);
  const [verifyPassed, setVerifyPassed] = useState(false);
  /** When user fails a step: show step crossed and this explanation (key = step index) */
  const [stepFailureFeedback, setStepFailureFeedback] = useState({});

  /** Step guide card is opt-in (pill button) so the editor stays clear; steps stay in the left rail */
  const [showStepGuide, setShowStepGuide] = useState(false);

  // MCQ between steps (1-2 questions, generated/verified by qwen3-coder)
  const [mcqGateForStep, setMcqGateForStep] = useState(null);
  const [mcqQuestions, setMcqQuestions] = useState([]);
  const [mcqCurrentIndex, setMcqCurrentIndex] = useState(0);
  const [mcqSelectedIndex, setMcqSelectedIndex] = useState(null);
  const [mcqLoading, setMcqLoading] = useState(false);
  const [mcqVerifyLoading, setMcqVerifyLoading] = useState(false);
  const [mcqResult, setMcqResult] = useState(null);
  const [mcqErrorsByQuestion, setMcqErrorsByQuestion] = useState({});
  const [mcqPassedCount, setMcqPassedCount] = useState(0);

  // Refs for live code (avoids re-render on every keystroke; state only on load/draft/reset)
  const codeRefs = useRef({
    html: '',
    css: '',
    js: '',
    jsx: '',
    server: '',
  });
  const CODE_REF_KEYS = { html: 'html', css: 'css', js: 'js', jsx: 'jsx', server: 'server' };

  // Stable timer refs (avoid window globals that leak across hot-reloads)
  const codeChangeTimerRef = useRef(null);
  const previewTimerRef = useRef(null);
  const isLoadingDraftRef = useRef(false);
  const isMountedRef = useRef(true);
  /** Cleared on unmount — avoids orphaned timers after leaving the editor */
  const trackedTimeoutsRef = useRef(new Set());
  const pointFloaterTidRef = useRef(null);
  /** Incremented when moduleId changes (cleanup) or on unmount — drop stale async MCQ/verify results */
  const asyncUiGenRef = useRef(0);
  const saveInProgressRef = useRef(false);
  const stepsVerifiedRef = useRef(stepsVerified);
  const currentStepIndexRef = useRef(currentStepIndex);
  const runFeedbackTidRef = useRef(null);
  const runFeedbackClearTidRef = useRef(null);
  /** Tracks codeChanges so handleRunCode can read current value; used to avoid awarding Run points when spamming Run without editing */
  const codeChangesRef = useRef(0);
  /** Code change count at time of last Run; Run awards points only when codeChanges > this (i.e. user edited since last run) */
  const lastRunCodeChangeCountRef = useRef(0);
  useEffect(() => {
    isLoadingDraftRef.current = isLoadingDraft;
  }, [isLoadingDraft]);
  useEffect(() => {
    stepsVerifiedRef.current = stepsVerified;
    currentStepIndexRef.current = currentStepIndex;
  }, [stepsVerified, currentStepIndex]);

  useEffect(() => {
    return () => {
      asyncUiGenRef.current += 1;
    };
  }, [moduleId]);

  const trackTimeout = useCallback((fn, delay) => {
    const id = setTimeout(() => {
      trackedTimeoutsRef.current.delete(id);
      fn();
    }, delay);
    trackedTimeoutsRef.current.add(id);
    return id;
  }, []);

  const clearTrackedTimeout = useCallback((id) => {
    if (id == null) return;
    clearTimeout(id);
    trackedTimeoutsRef.current.delete(id);
  }, []);

  // Persist "current step" to backend so Dashboard/Modules can resume accurately.
  useEffect(() => {
    if (!moduleId || !module || isLoadingDraft) return;
    const tid = setTimeout(() => {
      userAPI.setCurrentModule(moduleId, currentStepIndex).catch(() => {});
    }, 600);
    return () => clearTimeout(tid);
  }, [moduleId, module, currentStepIndex, isLoadingDraft]);
  useEffect(
    () => () => {
      isMountedRef.current = false;
      asyncUiGenRef.current += 1;
      trackedTimeoutsRef.current.forEach(clearTimeout);
      trackedTimeoutsRef.current.clear();
      if (pointFloaterTidRef.current) {
        clearTrackedTimeout(pointFloaterTidRef.current);
        pointFloaterTidRef.current = null;
      }
      if (codeChangeTimerRef.current) clearTimeout(codeChangeTimerRef.current);
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
      if (runFeedbackTidRef.current) clearTimeout(runFeedbackTidRef.current);
      clearTrackedTimeout(runFeedbackClearTidRef.current);
      runFeedbackClearTidRef.current = null;
      if (lastVerifiedStepClearTidRef.current) clearTimeout(lastVerifiedStepClearTidRef.current);
    },
    [clearTrackedTimeout]
  );

  // Explain selection (highlight code → ask for explanation)
  const editorViewRef = useRef(null);
  const [explainCodeLoading, setExplainCodeLoading] = useState(false);
  const [explainErrorLoading, setExplainErrorLoading] = useState(false);

  // Gamification states
  const [points, setPoints] = useState(0);
  const [codeChanges, setCodeChanges] = useState(0);
  const completionBonus = 100;
  const [streak, setStreak] = useState(0);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    codeChangesRef.current = codeChanges;
  }, [codeChanges]);

  // Achievements
  const [achievements, setAchievements] = useState([]);
  const [showAchievements, setShowAchievements] = useState(false);
  const [pointFloater, setPointFloater] = useState(null);
  /** Step just verified (for celebration animation); cleared after delay */
  const [lastVerifiedStepIndex, setLastVerifiedStepIndex] = useState(null);
  /** Points pill pulse when user earns points */
  const [pointsJustEarned, setPointsJustEarned] = useState(false);
  const lastVerifiedStepClearTidRef = useRef(null);

  // Left panel sections (overview expanded by default so it's clearly visible)
  const [showOverview, setShowOverview] = useState(true);
  const [showOverviewPopup, setShowOverviewPopup] = useState(false);
  const shownOverviewPopupRef = useRef({});
  /** AI-generated lecture notes for Learning Overview popup; cached in localStorage per module */
  const [lectureNotes, setLectureNotes] = useState(null);
  const [lectureNotesLoading, setLectureNotesLoading] = useState(false);
  const [lectureNotesError, setLectureNotesError] = useState(null);
  const LECTURE_NOTES_STORAGE_KEY = 'gamilearn_lecture_notes';
  const [showTutorSidebar, setShowTutorSidebar] = useState(false);
  /** Current slide index in lecture popup (0-based); reset when popup opens */
  const [lectureSlideIndex, setLectureSlideIndex] = useState(0);

  // Resizable panel dimensions (px)
  const [leftPanelWidth, setLeftPanelWidth] = useState(320);
  const [rightPanelWidth, setRightPanelWidth] = useState(480);
  const [consoleHeight, setConsoleHeight] = useState(180);
  const resizeRef = useRef({
    active: null,
    pointerId: null,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startRight: 0,
    startConsole: 0,
  });
  const [tutorQuestion, setTutorQuestion] = useState('');
  const [tutorLoading, setTutorLoading] = useState(false);
  const [hintStyle, setHintStyle] = useState('general');
  const aiCompanionUsesRef = useRef(0);
  const aiHintRequestsRef = useRef(0);
  const aiExplainCodeUsesRef = useRef(0);
  const aiExplainErrorUsesRef = useRef(0);
  // Unified thread: explain + hint Q&A in one list
  const [companionMessages, setCompanionMessages] = useState([]);

  // Multiplayer: dual preview state
  const [player1PreviewKey, setPlayer1PreviewKey] = useState(0);
  const [player2PreviewKey, setPlayer2PreviewKey] = useState(0);
  const [serverPreviewKey, setServerPreviewKey] = useState(0);
  const [activePreviewTab, setActivePreviewTab] = useState('server');
  /** Multiplayer: frozen preview HTML so iframes don't reload on every code change (only on Run/Reset) */
  const [multiplayerSnapshot, setMultiplayerSnapshot] = useState(null);
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [consoleOpen, setConsoleOpen] = useState(true);
  /** Ref synced with error count for "errors fixed" detection after Run */
  const errorCountRef = useRef(0);
  /** Floating gamified messages (e.g. "Errors fixed! +10") */
  const [floatingMessages, setFloatingMessages] = useState([]);
  /** Brief "All clear!" state when errors go to zero after a run (replaces error panel) */
  const [showAllClear, setShowAllClear] = useState(false);

  const recentErrors = useMemo(
    () =>
      consoleLogs
        .filter((e) => e.level === 'error')
        .slice(-5)
        .map((e) => e.message),
    [consoleLogs]
  );
  const lastError = recentErrors.length > 0 ? recentErrors[recentErrors.length - 1] : null;

  useEffect(() => {
    errorCountRef.current = consoleLogs.filter((e) => e.level === 'error').length;
  }, [consoleLogs]);

  const addFloatingMessage = useCallback(
    (type, text, points = null) => {
      const id = Date.now() + Math.random();
      setFloatingMessages((prev) => [...prev, { id, type, text, points }]);
      trackTimeout(() => {
        if (isMountedRef.current) setFloatingMessages((prev) => prev.filter((m) => m.id !== id));
      }, 2600);
    },
    [trackTimeout]
  );

  const { user, refreshProfile } = useAuth();

  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === 'console') {
        const source = e.data.source || null; // 'server' | 'player1' | 'player2' | null (preview)
        const message = source
          ? (source === 'server' ? '[Server] ' : '[' + source + '] ') + (e.data.message || '')
          : e.data.message;
        setConsoleLogs((prev) => [
          ...prev.slice(-199),
          { source, level: e.data.level, message, timestamp: e.data.timestamp || Date.now() },
        ]);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const clearConsole = () => setConsoleLogs([]);
  const serverLogs = useMemo(() => consoleLogs.filter((e) => e.source === 'server'), [consoleLogs]);
  const clientLogs = useMemo(
    () => consoleLogs.filter((e) => e.source === 'player1' || e.source === 'player2'),
    [consoleLogs]
  );
  const clearServerConsole = () =>
    setConsoleLogs((prev) => prev.filter((e) => e.source !== 'server'));
  const clearClientConsole = () =>
    setConsoleLogs((prev) => prev.filter((e) => e.source !== 'player1' && e.source !== 'player2'));

  const moduleConfig = useMemo(() => {
    if (!module) return MODULE_TYPES['javascript-basics'];
    return MODULE_TYPES[module.category] || MODULE_TYPES['javascript-basics'];
  }, [module]);

  const isReactModule = useMemo(
    () => module?.category !== 'multiplayer' && moduleConfig.tabs.includes('jsx'),
    [moduleConfig, module?.category]
  );
  const isMultiplayerModule = useMemo(() => module?.category === 'multiplayer', [module]);

  const multiplayerSnapshotSetRef = useRef(false);
  useEffect(() => {
    setMultiplayerSnapshot(null);
    multiplayerSnapshotSetRef.current = false;
  }, [moduleId]);
  useEffect(() => {
    if (!module || !isMultiplayerModule || isLoadingDraft) return;
    if (multiplayerSnapshotSetRef.current) return;
    multiplayerSnapshotSetRef.current = true;
    setMultiplayerSnapshot({
      server: getPreviewContent('server'),
      player1: getPreviewContent('player1'),
      player2: getPreviewContent('player2'),
    });
  }, [module?.id, isMultiplayerModule, isLoadingDraft]); // eslint-disable-line react-hooks/exhaustive-deps -- snapshot set once per module when draft ready

  useEffect(() => {
    if (!isMultiplayerModule) setMultiplayerSnapshot(null);
  }, [isMultiplayerModule]);

  const difficultyStyles = {
    beginner: 'bg-blue-900 text-blue-100',
    intermediate: 'bg-blue-800 text-blue-100',
    advanced: 'bg-blue-900 text-blue-200',
  };

  const HINT_STYLES = [
    { value: 'general', label: 'General Hint', description: 'Get a helpful nudge' },
    {
      value: 'error-explanation',
      label: 'Explain Error',
      description: 'Understand error messages',
    },
    { value: 'logic-guidance', label: 'Logic Help', description: 'Trace through code' },
    { value: 'concept-reminder', label: 'Concept Recap', description: 'Review a concept' },
    { value: 'visual-gameloop', label: 'Game/Animation', description: 'Game loops and animations' },
  ];

  const STORAGE_KEY = `codeEditorProgress_${moduleId}`;

  const draftLoadTimeoutRef = useRef(null);
  const fetchAbortedRef = useRef(false);
  useEffect(() => {
    fetchAbortedRef.current = false;
    const fetchModule = async () => {
      try {
        const response = await modulesAPI.getById(moduleId);
        if (fetchAbortedRef.current) return;
        const moduleData = response.data.module;
        setModule(moduleData);
        const initialHtml = moduleData.starterCode?.html || '';
        const initialCss = moduleData.starterCode?.css || '';
        const initialJs = moduleData.starterCode?.javascript || '';
        const initialJsx = moduleData.starterCode?.jsx || moduleData.starterCode?.javascript || '';
        const initialServer = moduleData.starterCode?.serverJs || '';
        codeRefs.current = {
          html: initialHtml,
          css: initialCss,
          js: initialJs,
          jsx: initialJsx,
          server: initialServer,
        };
        const config = MODULE_TYPES[moduleData.category] || MODULE_TYPES['javascript-basics'];
        setActiveTab(config.defaultTab);
        setVerifyFeedback(null);
        setVerifyPassed(false);
        setStepFailureFeedback({});
        setMcqGateForStep(null);
        setMcqQuestions([]);
        setCompanionMessages([]);
        const stepCount = moduleData.steps?.length || moduleData.objectives?.length || 1;
        let usedSession = false;
        setIsLoadingDraft(true);
        try {
          const saved = sessionStorage.getItem(STORAGE_KEY);
          if (saved) {
            const { stepsVerified: savedVerified, currentStepIndex: savedStep } = JSON.parse(saved);
            if (
              Array.isArray(savedVerified) &&
              savedVerified.length === stepCount &&
              typeof savedStep === 'number'
            ) {
              setStepsVerified(savedVerified);
              setCurrentStepIndex(Math.min(savedStep, stepCount - 1));
              usedSession = true;
            }
          }
          if (fetchAbortedRef.current) return;
          draftLoadTimeoutRef.current = setTimeout(async () => {
            try {
              if (fetchAbortedRef.current) return;
              const draft = await loadEditorDraft(moduleId);
              if (fetchAbortedRef.current) return;
              if (!usedSession) {
                if (
                  draft?.stepsVerified?.length === stepCount &&
                  typeof draft.currentStepIndex === 'number'
                ) {
                  setStepsVerified(draft.stepsVerified);
                  setCurrentStepIndex(Math.min(draft.currentStepIndex, stepCount - 1));
                } else {
                  setStepsVerified([]);
                  setCurrentStepIndex(0);
                }
                if (draft?.code && typeof draft.code === 'object') {
                  const c = draft.code;
                  codeRefs.current = {
                    html: c.html != null ? c.html : initialHtml,
                    css: c.css != null ? c.css : initialCss,
                    js: c.javascript != null ? c.javascript : initialJs,
                    jsx: c.jsx != null ? c.jsx : initialJsx,
                    server: c.serverJs != null ? c.serverJs : initialServer,
                  };
                  setEditorKey((prev) => prev + 1);
                }
              } else {
                if (draft?.code && typeof draft.code === 'object') {
                  const c = draft.code;
                  codeRefs.current = {
                    html: c.html != null ? c.html : '',
                    css: c.css != null ? c.css : '',
                    js: c.javascript != null ? c.javascript : '',
                    jsx: c.jsx != null ? c.jsx : '',
                    server: c.serverJs != null ? c.serverJs : '',
                  };
                  setEditorKey((prev) => prev + 1);
                }
              }
            } catch (draftError) {
              console.warn('Could not load draft:', draftError);
            } finally {
              if (!fetchAbortedRef.current) setIsLoadingDraft(false);
            }
          }, 200);
        } catch {
          if (!fetchAbortedRef.current) {
            setStepsVerified([]);
            setCurrentStepIndex(0);
            setIsLoadingDraft(false);
          }
        }
        if (!fetchAbortedRef.current) setLoading(false);
      } catch (error) {
        if (fetchAbortedRef.current) return;
        console.error('Error fetching module:', error);
        toast.error("We couldn't load this lesson. Please try again from your dashboard.");
        navigate('/dashboard', { state: { direction: 'back' } });
      }
    };
    fetchModule();
    return () => {
      fetchAbortedRef.current = true;
      if (draftLoadTimeoutRef.current) {
        clearTimeout(draftLoadTimeoutRef.current);
        draftLoadTimeoutRef.current = null;
      }
    };
  }, [moduleId, navigate, STORAGE_KEY]);

  useEffect(() => {
    if (!module || steps.length === 0) return;
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ stepsVerified, currentStepIndex, moduleId })
    );
  }, [STORAGE_KEY, module, steps.length, stepsVerified, currentStepIndex, moduleId]);

  // Show floating overview popup when module has just finished loading (once per module)
  useEffect(() => {
    if (!module || loading || isLoadingDraft) return;
    if (!shownOverviewPopupRef.current[moduleId]) {
      shownOverviewPopupRef.current[moduleId] = true;
      setShowOverviewPopup(true);
      setLectureSlideIndex(0);
    }
  }, [module, moduleId, loading, isLoadingDraft]);

  /** Split lecture/overview content into 2–4 slides by ## sections or by paragraphs */
  const lectureSlides = useMemo(() => {
    const raw = lectureNotes || module?.content || '';
    if (!raw.trim()) return [];
    let parts = raw.split(/(?=^##\s+.+$)/gm).filter((p) => p.trim());
    const minSlides = 2;
    const maxSlides = 4;
    if (parts.length < minSlides) {
      // No ## headings: split by double newline into ~3 chunks
      parts = raw.split(/\n{2,}/).filter((p) => p.trim());
    }
    if (parts.length <= maxSlides && parts.length >= minSlides) {
      return parts.map((p) => p.trim()).filter(Boolean);
    }
    if (parts.length > maxSlides) {
      const slides = [];
      const chunkSize = Math.ceil(parts.length / maxSlides);
      for (let i = 0; i < maxSlides; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, parts.length);
        const merged = parts.slice(start, end).join('\n\n').trim();
        if (merged) slides.push(merged);
      }
      return slides;
    }
    if (parts.length === 1) {
      // Single block: split by rough char length into 2-3 slides
      const len = parts[0].length;
      const targetSlides = 3;
      const chunkLen = Math.ceil(len / targetSlides);
      const slides = [];
      let pos = 0;
      while (pos < len && slides.length < maxSlides) {
        let end = Math.min(pos + chunkLen, len);
        if (end < len) {
          const nextNewline = parts[0].indexOf('\n\n', end);
          end = nextNewline > end ? nextNewline + 2 : end;
        }
        slides.push(parts[0].slice(pos, end).trim());
        pos = end;
      }
      return slides.filter(Boolean);
    }
    return [raw.trim()];
  }, [lectureNotes, module?.content]);

  const hasSlides = lectureSlides.length >= 2;

  // Reset lecture notes when switching modules
  useEffect(() => {
    if (!moduleId) return;
    setLectureNotes(null);
    setLectureNotesError(null);
  }, [moduleId]);

  // Generate or load lecture notes when Learning Overview popup opens
  useEffect(() => {
    if (!showOverviewPopup || !module || !moduleId) return;

    const loadFromStorage = () => {
      try {
        const raw = localStorage.getItem(LECTURE_NOTES_STORAGE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        return data?.[moduleId] ?? null;
      } catch {
        return null;
      }
    };

    const saveToStorage = (notes) => {
      try {
        const raw = localStorage.getItem(LECTURE_NOTES_STORAGE_KEY) || '{}';
        const data = JSON.parse(raw);
        data[moduleId] = notes;
        localStorage.setItem(LECTURE_NOTES_STORAGE_KEY, JSON.stringify(data));
      } catch {
        /* ignore */
      }
    };

    const cached = loadFromStorage();
    if (cached && typeof cached === 'string' && cached.trim()) {
      setLectureNotes(cached);
      setLectureNotesLoading(false);
      setLectureNotesError(null);
      return;
    }

    let cancelled = false;
    setLectureNotesLoading(true);
    setLectureNotesError(null);

    const payload = {
      overview: module.content || '',
      moduleTitle: module.title || '',
      difficulty: module.difficulty || 'beginner',
      category: module.category || '',
      steps: module.steps?.length
        ? module.steps.map((s) => ({
            title: s.title,
            instruction: s.instruction || s.title,
            concept: s.concept || '',
          }))
        : undefined,
      objectives: !module.steps?.length && module.objectives?.length ? module.objectives : undefined,
      userLevel: user?.level ? `Level ${user.level}` : user?.levelInfo?.rank?.name || '',
    };

    tutorAPI
      .generateLectureNotes(payload)
      .then((res) => {
        const notes = res.data?.lectureNotes;
        if (cancelled) return;
        if (notes && typeof notes === 'string' && notes.trim()) {
          setLectureNotes(notes.trim());
          saveToStorage(notes.trim());
          setLectureNotesError(null);
        } else {
          setLectureNotesError('Could not generate lecture notes');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = err.response?.data?.error || err.message || 'Generation failed';
        setLectureNotesError(msg);
        setLectureNotes(null);
      })
      .finally(() => {
        if (!cancelled) setLectureNotesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [showOverviewPopup, module, moduleId, user?.level, user?.levelInfo?.rank?.name]);

  // Resize: pointer capture keeps drag alive over preview iframes (document mousemove does not).
  const clearResizeChrome = useCallback(() => {
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    resizeRef.current.active = null;
    resizeRef.current.pointerId = null;
  }, []);

  const handleResizeLostCapture = useCallback(() => {
    clearResizeChrome();
  }, [clearResizeChrome]);

  const handleLeftResizePointerDown = useCallback(
    (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      resizeRef.current = {
        ...resizeRef.current,
        active: 'left',
        pointerId: e.pointerId,
        startX: e.clientX,
        startLeft: leftPanelWidth,
      };
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    },
    [leftPanelWidth]
  );
  const handleLeftResizePointerMove = useCallback((e) => {
    const r = resizeRef.current;
    if (r.active !== 'left' || r.pointerId !== e.pointerId) return;
    const delta = e.clientX - r.startX;
    setLeftPanelWidth(Math.min(520, Math.max(200, r.startLeft + delta)));
  }, []);
  const handleLeftResizePointerUp = useCallback((e) => {
    const r = resizeRef.current;
    if (r.active !== 'left' || r.pointerId !== e.pointerId) return;
    clearResizeChrome();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  }, [clearResizeChrome]);

  const handleRightResizePointerDown = useCallback(
    (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      resizeRef.current = {
        ...resizeRef.current,
        active: 'right',
        pointerId: e.pointerId,
        startX: e.clientX,
        startRight: rightPanelWidth,
      };
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    },
    [rightPanelWidth]
  );
  const handleRightResizePointerMove = useCallback((e) => {
    const r = resizeRef.current;
    if (r.active !== 'right' || r.pointerId !== e.pointerId) return;
    const delta = e.clientX - r.startX;
    setRightPanelWidth(Math.min(900, Math.max(260, r.startRight - delta)));
  }, []);
  const handleRightResizePointerUp = useCallback(
    (e) => {
      const r = resizeRef.current;
      if (r.active !== 'right' || r.pointerId !== e.pointerId) return;
      clearResizeChrome();
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    },
    [clearResizeChrome]
  );

  const handleConsoleResizePointerDown = useCallback(
    (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      resizeRef.current = {
        ...resizeRef.current,
        active: 'console',
        pointerId: e.pointerId,
        startY: e.clientY,
        startConsole: consoleHeight,
      };
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'row-resize';
    },
    [consoleHeight]
  );
  const handleConsoleResizePointerMove = useCallback((e) => {
    const r = resizeRef.current;
    if (r.active !== 'console' || r.pointerId !== e.pointerId) return;
    const delta = e.clientY - r.startY;
    setConsoleHeight(Math.min(520, Math.max(72, r.startConsole - delta)));
  }, []);
  const handleConsoleResizePointerUp = useCallback(
    (e) => {
      const r = resizeRef.current;
      if (r.active !== 'console' || r.pointerId !== e.pointerId) return;
      clearResizeChrome();
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    },
    [clearResizeChrome]
  );

  // Fetch achievements on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await achievementsAPI.getUserAchievements();
        const data = res.data?.achievements || res.data;
        if (mounted && Array.isArray(data)) setAchievements(data);
      } catch (err) {
        console.error('Error loading achievements:', err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Check achievements after step verification
  useEffect(() => {
    if (!module || stepsVerified.length === 0) return;
    let cancelled = false;
    const progressData = {
      totalEdits: codeChanges,
      totalRuns: streak,
      totalPoints: points,
      streak,
      completedModules: 0,
      aiCompanionUses: aiCompanionUsesRef.current,
      aiHintRequests: aiHintRequestsRef.current,
      aiExplainCodeUses: aiExplainCodeUsesRef.current,
      aiExplainErrorUses: aiExplainErrorUsesRef.current,
    };
    achievementsAPI
      .checkAchievements(progressData)
      .then((res) => {
        if (cancelled) return;
        const { newlyEarned = [] } = res.data;
        if (newlyEarned.length > 0) {
          invalidateUserCaches();
          setAchievements((prev) =>
            prev.map((a) => (newlyEarned.some((n) => n.id === a.id) ? { ...a, earned: true } : a))
          );
          newlyEarned.forEach((ach) =>
            toast.success(
              <div>
                <strong>Achievement Unlocked!</strong>
                <div>{ach.name}</div>
              </div>
            )
          );
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [stepsVerified, module, codeChanges, streak, points]);

  // IndexedDB draft auto-save (every 10s) from refs to avoid stale closure and race with typing
  useEffect(() => {
    if (!moduleId || !module || isLoadingDraft) return;
    const interval = setInterval(async () => {
      if (!isMountedRef.current) return;
      if (codeChangeTimerRef.current || previewTimerRef.current || isLoadingDraftRef.current)
        return;
      if (saveInProgressRef.current) return;
      saveInProgressRef.current = true;
      try {
        const r = codeRefs.current;
        await saveEditorDraft(moduleId, {
          stepsVerified: stepsVerifiedRef.current,
          currentStepIndex: currentStepIndexRef.current,
          code: { html: r.html, css: r.css, javascript: r.js, jsx: r.jsx, serverJs: r.server },
        });
      } finally {
        if (isMountedRef.current) saveInProgressRef.current = false;
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [moduleId, module, isLoadingDraft]);

  const allStepsVerified = useMemo(() => {
    if (!steps.length) return false;
    return steps.every((_, i) => stepsVerified[i]);
  }, [steps, stepsVerified]);

  const earnedAchievements = useMemo(() => achievements.filter((a) => a.earned), [achievements]);
  const verifiedCount = useMemo(() => stepsVerified.filter(Boolean).length, [stepsVerified]);

  const showPointFloater = useCallback((amount) => {
    if (pointFloaterTidRef.current) {
      clearTrackedTimeout(pointFloaterTidRef.current);
      pointFloaterTidRef.current = null;
    }
    setPointFloater({ id: Date.now(), amount });
    pointFloaterTidRef.current = trackTimeout(() => {
      pointFloaterTidRef.current = null;
      if (isMountedRef.current) setPointFloater(null);
    }, 1200);
  }, [clearTrackedTimeout, trackTimeout]);

  // Stable extension arrays so CodeMirror doesn't reconfigure on every render
  const extHtml = useMemo(() => [html()], []);
  const extCss = useMemo(() => [css()], []);
  const extJs = useMemo(() => [javascript()], []);
  const extJsx = useMemo(() => [javascript({ jsx: true })], []);
  const extServer = useMemo(() => [javascript()], []);

  const handleVerifyCode = async () => {
    if (currentStepIndex >= steps.length) return;
    const verifyGen = asyncUiGenRef.current;
    setVerifyLoading(true);
    setVerifyFeedback(null);
    setVerifyPassed(false);
    setStepFailureFeedback((prev) => {
      const next = { ...prev };
      delete next[currentStepIndex];
      return next;
    });
    try {
      const r = codeRefs.current;
      const stepMeta = module?.steps?.[currentStepIndex];
      const verifyType = stepMeta?.verifyType || 'code';
      const payload = {
        stepIndex: currentStepIndex,
        stepDescription: steps[currentStepIndex].title,
        stepInstruction: steps[currentStepIndex].instruction || '',
        stepConcept: steps[currentStepIndex].concept || '',
        code: { html: r.html, css: r.css, javascript: r.js, jsx: r.jsx, serverJs: r.server },
        moduleTitle: module?.title,
        objectives: module?.objectives,
        verifyType,
        expectedConsole: stepMeta?.expectedConsole ?? null,
      };
      if (verifyType === 'checkConsole') {
        payload.consoleOutput = consoleLogs.map((e) => ({ level: e.level, message: e.message }));
      }
      const resp = await tutorAPI.verifyStep(payload);
      if (verifyGen !== asyncUiGenRef.current) return;
      const data = resp.data;
      const correct = !!data.correct;
      const feedback =
        data.feedback || (correct ? 'Looks good!' : 'Not quite yet. Check the hint and try again.');
      setVerifyFeedback(feedback);
      setVerifyPassed(correct);
      if (correct) {
        setStepsVerified((prev) => {
          const next = [...prev];
          next[currentStepIndex] = true;
          return next;
        });
        setPoints((p) => p + 15);
        setLastVerifiedStepIndex(currentStepIndex);
        if (lastVerifiedStepClearTidRef.current) clearTimeout(lastVerifiedStepClearTidRef.current);
        lastVerifiedStepClearTidRef.current = setTimeout(() => {
          lastVerifiedStepClearTidRef.current = null;
          if (isMountedRef.current) setLastVerifiedStepIndex(null);
        }, 2000);
        setPointsJustEarned(true);
        trackTimeout(() => isMountedRef.current && setPointsJustEarned(false), 600);
        showPointFloater(15);
        toast.success('Step complete!');
        // Open MCQ gate: 1-2 questions before next step (only if step has concept / we want MCQ)
        const step = steps[currentStepIndex];
        if (step?.concept && currentStepIndex < steps.length - 1) {
          setMcqGateForStep(currentStepIndex);
          setMcqQuestions([]);
          setMcqCurrentIndex(0);
          setMcqSelectedIndex(null);
          setMcqResult(null);
          setMcqErrorsByQuestion({});
          setMcqPassedCount(0);
          fetchMCQsForStep(step);
        }
      } else {
        setStepFailureFeedback((prev) => ({ ...prev, [currentStepIndex]: feedback }));
        toast.warning('Not quite yet. See the explanation below.');
        setShowTutorSidebar(true);
        const step = steps[currentStepIndex];
        const instructionBlock = [
          step?.title ? `**This step**\n\n${step.title}` : '',
          step?.instruction ? `**What you need to do**\n\n${step.instruction}` : '',
          step?.concept ? `**Concept**\n\n${step.concept}` : '',
        ]
          .filter(Boolean)
          .join('\n\n');
        const codeHelp =
          '**Need help with your code?**\n\nAsk below for a hint or use **Explain selected code** in this panel.';
        const content = instructionBlock ? `${instructionBlock}\n\n---\n\n${codeHelp}` : codeHelp;
        setCompanionMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: 'hint',
            userLabel: 'Step help',
            content,
            timestamp: new Date().toLocaleTimeString(),
            confidence: 0.5,
          },
        ]);
      }
    } catch (err) {
      if (verifyGen !== asyncUiGenRef.current) return;
      console.error('Verify error', err);
      const msg = 'Verification failed. Check the hint and try again.';
      setVerifyFeedback(msg);
      setVerifyPassed(false);
      setStepFailureFeedback((prev) => ({ ...prev, [currentStepIndex]: msg }));
      toast.error('Not quite yet-check the hint and try again.');
      setShowTutorSidebar(true);
      const step = steps[currentStepIndex];
      const instructionBlock = [
        step?.title ? `**This step**\n\n${step.title}` : '',
        step?.instruction ? `**What you need to do**\n\n${step.instruction}` : '',
        step?.concept ? `**Concept**\n\n${step.concept}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');
      const codeHelp =
        '**Need help with your code?**\n\nAsk below for a hint or use **Explain selected code** in this panel.';
      const content = instructionBlock ? `${instructionBlock}\n\n---\n\n${codeHelp}` : codeHelp;
      setCompanionMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: 'hint',
          userLabel: 'Step help',
          content,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      if (verifyGen === asyncUiGenRef.current) setVerifyLoading(false);
    }
  };

  const fetchMCQsForStep = async (step) => {
    const mcqGen = asyncUiGenRef.current;
    setMcqLoading(true);
    setMcqResult(null);
    try {
      const resp = await tutorAPI.generateMCQs({
        stepTitle: step.title,
        stepConcept: step.concept,
        moduleTitle: module?.title,
        count: 2,
      });
      if (mcqGen !== asyncUiGenRef.current) return;
      const questions = resp.data?.questions || [];
      setMcqQuestions(questions);
      setMcqCurrentIndex(0);
      setMcqSelectedIndex(null);
      setMcqErrorsByQuestion({});
      if (questions.length === 0) {
        setMcqGateForStep(null);
      }
    } catch {
      if (mcqGen !== asyncUiGenRef.current) return;
      setMcqQuestions([]);
      setMcqGateForStep(null);
      toast.error("We couldn't load the quiz. You can skip to the next step or try again.");
    } finally {
      if (mcqGen === asyncUiGenRef.current) setMcqLoading(false);
    }
  };

  const handleMCQSubmit = async () => {
    if (mcqQuestions.length === 0 || mcqSelectedIndex == null) return;
    const mcqSubmitGen = asyncUiGenRef.current;
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
      if (mcqSubmitGen !== asyncUiGenRef.current) return;
      const { correct, explanation } = resp.data;
      setMcqResult({ correct, explanation });
      if (correct) {
        setMcqErrorsByQuestion((prev) => {
          const next = { ...prev };
          delete next[mcqCurrentIndex];
          return next;
        });
        setMcqPassedCount((c) => c + 1);
        if (mcqCurrentIndex < mcqQuestions.length - 1) {
          setMcqCurrentIndex((i) => i + 1);
          setMcqSelectedIndex(null);
          setMcqResult(null);
        } else {
          setPoints((p) => p + 10);
          setPointsJustEarned(true);
          trackTimeout(() => isMountedRef.current && setPointsJustEarned(false), 600);
          showPointFloater(10);
          toast.success('Quiz passed! You can continue to the next step.');
        }
      } else {
        setMcqErrorsByQuestion((prev) => ({
          ...prev,
          [mcqCurrentIndex]: explanation || 'Wrong answer. Try again.',
        }));
        toast.warning('Wrong answer. Read the explanation below.');
      }
    } catch {
      if (mcqSubmitGen !== asyncUiGenRef.current) return;
      const explanation = 'Verification failed. Try again.';
      setMcqResult({ correct: false, explanation });
      setMcqErrorsByQuestion((prev) => ({ ...prev, [mcqCurrentIndex]: explanation }));
    } finally {
      if (mcqSubmitGen === asyncUiGenRef.current) setMcqVerifyLoading(false);
    }
  };

  const handleMCQNextStep = () => {
    setMcqGateForStep(null);
    setMcqQuestions([]);
    setMcqResult(null);
    setMcqErrorsByQuestion({});
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
      toast.info('Select some code in the editor first, then click Explain.');
      return;
    }
    const { from, to } = view.state.selection.main;
    const selected = view.state.sliceDoc(from, to).trim();
    if (!selected) {
      toast.info('Select some code in the editor first, then click Explain.');
      return;
    }
    setShowTutorSidebar(true);
    setExplainCodeLoading(true);
    try {
      const lang =
        activeTab === 'jsx'
          ? 'javascript'
          : activeTab === 'js'
            ? 'javascript'
            : activeTab === 'server'
              ? 'javascript'
              : activeTab;
      const resp = await tutorAPI.explainCode(selected, lang);
      const explanation = resp.data?.explanation || 'No explanation available.';
      setCompanionMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: 'explain',
          userLabel: 'Explanation of selection',
          content: explanation,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      aiCompanionUsesRef.current += 1;
      aiExplainCodeUsesRef.current += 1;
    } catch (err) {
      console.error('Explain code error', err);
      toast.error("We couldn't get an explanation right now. Please try again.");
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
      const r = codeRefs.current;
      const channelName = `gamilearn-mp-${moduleId}`;

      if (isMultiplayerModule && playerRole === 'server') {
        return buildServerPreviewHtml(channelName, r.server);
      }

      if (isMultiplayerModule && (playerRole === 'player1' || playerRole === 'player2')) {
        return buildClientPreviewHtml(channelName, playerRole, r.html, r.css, r.js);
      }

      if (isReactModule) {
        const jsx = playerRole
          ? r.jsx.replace(/playerRole\s*=\s*['"]?player\d?['"]?/i, `playerRole="${playerRole}"`)
          : r.jsx;
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>${r.css}</style>
  <style>html, body, #root { margin: 0; padding: 0; min-height: 100%; } body { font-family: system-ui, sans-serif; }</style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const originalConsole = { ...console };
    ['log', 'info', 'warn', 'error'].forEach(level => {
      console[level] = (...args) => {
        originalConsole[level](...args);
        const message = args
          .map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
          .join(' ');
        window.parent.postMessage(
          { type: 'console', level, message, timestamp: Date.now() },
          '*'
        );
      };
    });
    try {
      ${jsx}
      if (typeof App !== 'undefined') {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App ${playerRole ? `playerRole="${playerRole}"` : ''} />);
      }
    } catch (e) {
      console.error('Runtime Error:', e.message);
      document.getElementById('root').innerHTML =
        '<div style="color:#527CB0;padding:20px;font-family:monospace;background:#0e1c36;border-radius:8px;margin:20px;">' +
        '<h3>Error</h3><pre style="color:#9AB6D8;white-space:pre-wrap;">' +
        e.message +
        '</pre></div>';
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
  <style>${r.css}</style>
</head>
<body>
  ${r.html}
  <script>
    (function () {
      var originalConsole = {
        log: console.log,
        info: console.info,
        warn: console.warn,
        error: console.error,
      };
      function sendToParent(level, message) {
        try {
          if (window.parent && window.parent !== window) {
            window.parent.postMessage(
              { type: 'console', level: level, message: message, timestamp: Date.now() },
              '*'
            );
          }
        } catch (err) {}
      }
      ['log', 'info', 'warn', 'error'].forEach(function (level) {
        var fn = function () {
          originalConsole[level].apply(console, arguments);
          var message = Array.prototype.map
            .call(arguments, function (a) {
              return typeof a === 'object' ? JSON.stringify(a) : String(a);
            })
            .join(' ');
          sendToParent(level, message);
        };
        try {
          console[level] = fn;
        } catch (e) {}
      });
      window.__capturedConsole = console;
    })();
    function runUserCode() {
      var con = window.__capturedConsole || console;
      try {
        (function (console) {
          ${r.js}
        })(con);
      } catch (e) {
        con.error('Runtime error: ' + (e && e.message ? e.message : String(e)));
        var errDiv = document.createElement('div');
        errDiv.style.cssText =
          'color:#527CB0;padding:20px;font-family:monospace;background:#16284c;border-radius:8px;margin:20px;';
        errDiv.innerHTML =
          '<h3>Error:</h3><pre>' + (e && e.message ? e.message : String(e)) + '</pre>';
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
    [isReactModule, isMultiplayerModule, moduleId]
  );

  const handleCompleteModule = async () => {
    if (!allStepsVerified) return;
    try {
      const sessionStats = {
        totalEdits: codeChanges,
        streak,
        totalRuns: 0,
        sessionTime: 0,
        saveCount: 0,
      };
      const resp = await userAPI.completeModule(moduleId, sessionStats);
      if (refreshProfile) await refreshProfile();
      const totalPointsEarned = points + completionBonus;
      const newlyEarned = resp.data?.newlyEarned || [];
      let message = `Lesson complete! You earned ${points} points + ${completionBonus} bonus = ${totalPointsEarned} total.`;
      if (newlyEarned.length > 0) message += ` ${newlyEarned.length} new achievement(s)!`;
      toast.success(message, { autoClose: 5000 });
      navigate('/dashboard', { state: { direction: 'back' } });
    } catch (error) {
      console.error('Error completing module:', error);
    }
  };

  const handleCodeChange = useCallback((value, tabKey) => {
    if (isLoadingDraftRef.current) return;
    codeRefs.current[tabKey] = value;
    // Auto-clear console when user edits and there were errors, so errors disappear once they fix the code
    setConsoleLogs((prev) => {
      const hadErrors = prev.some((e) => e.level === 'error');
      return hadErrors ? [] : prev;
    });
    setShowAllClear(false);
    if (codeChangeTimerRef.current) clearTimeout(codeChangeTimerRef.current);
    codeChangeTimerRef.current = setTimeout(() => {
      codeChangeTimerRef.current = null;
      setCodeChanges((prev) => prev + 1);
    }, 500);
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    previewTimerRef.current = setTimeout(() => {
      previewTimerRef.current = null;
      setPreviewKey((k) => k + 1);
    }, 1500);
  }, []);

  const onChangeHtml = useCallback((v) => handleCodeChange(v, 'html'), [handleCodeChange]);
  const onChangeCss = useCallback((v) => handleCodeChange(v, 'css'), [handleCodeChange]);
  const onChangeJs = useCallback((v) => handleCodeChange(v, 'js'), [handleCodeChange]);
  const onChangeJsx = useCallback((v) => handleCodeChange(v, 'jsx'), [handleCodeChange]);
  const onChangeServer = useCallback((v) => handleCodeChange(v, 'server'), [handleCodeChange]);
  const onEditorCreate = useCallback((view) => {
    editorViewRef.current = view;
  }, []);

  const handleRunCode = () => {
    const hadErrorsBeforeRun = errorCountRef.current > 0;
    const currentCodeChanges = codeChangesRef.current;
    const editedSinceLastRun = currentCodeChanges > lastRunCodeChangeCountRef.current;
    lastRunCodeChangeCountRef.current = currentCodeChanges;

    setConsoleLogs([]);
    setShowAllClear(false);
    setPreviewKey((k) => k + 1);
    if (isMultiplayerModule) {
      setMultiplayerSnapshot({
        server: getPreviewContent('server'),
        player1: getPreviewContent('player1'),
        player2: getPreviewContent('player2'),
      });
      setPlayer1PreviewKey((k) => k + 1);
      setPlayer2PreviewKey((k) => k + 1);
      setServerPreviewKey((k) => k + 1);
    }
    if (editedSinceLastRun) {
      setPoints((p) => p + 5);
      setStreak((s) => s + 1);
      setPointsJustEarned(true);
      trackTimeout(() => isMountedRef.current && setPointsJustEarned(false), 600);
    }
    const runFeedbackTid = setTimeout(() => {
      if (!isMountedRef.current) return;
      if (editedSinceLastRun && hadErrorsBeforeRun && errorCountRef.current === 0) {
        setPoints((p) => p + 10);
        setPointsJustEarned(true);
        trackTimeout(() => isMountedRef.current && setPointsJustEarned(false), 600);
        showPointFloater(10);
        addFloatingMessage('success', 'Errors fixed!', 10);
        setShowAllClear(true);
        clearTrackedTimeout(runFeedbackClearTidRef.current);
        runFeedbackClearTidRef.current = trackTimeout(() => {
          if (isMountedRef.current) setShowAllClear(false);
        }, 2500);
      }
    }, 1500);
    runFeedbackTidRef.current = runFeedbackTid;
  };

  const handleReset = () => setShowResetConfirm(true);
  const confirmReset = () => {
    const h = module.starterCode?.html || '';
    const c = module.starterCode?.css || '';
    const j = module.starterCode?.javascript || '';
    const jx = module.starterCode?.jsx || module.starterCode?.javascript || '';
    const s = module.starterCode?.serverJs || '';
    codeRefs.current = { html: h, css: c, js: j, jsx: jx, server: s };
    if (lastVerifiedStepClearTidRef.current) clearTimeout(lastVerifiedStepClearTidRef.current);
    lastVerifiedStepClearTidRef.current = null;
    lastRunCodeChangeCountRef.current = 0;
    setLastVerifiedStepIndex(null);
    setPointsJustEarned(false);
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
    setEditorKey((k) => k + 1); // Force editor remount
    if (module?.category === 'multiplayer') {
      setMultiplayerSnapshot({
        server: getPreviewContent('server'),
        player1: getPreviewContent('player1'),
        player2: getPreviewContent('player2'),
      });
      setServerPreviewKey((k) => k + 1);
      setPlayer1PreviewKey((k) => k + 1);
      setPlayer2PreviewKey((k) => k + 1);
    }
    setShowResetConfirm(false);
    sessionStorage.removeItem(STORAGE_KEY);
    toast.info('Code reset to starter template.');
  };

  const handleExplainErrorClick = async (errorMessage) => {
    if (!errorMessage || explainErrorLoading) return;
    setShowTutorSidebar(true);
    setExplainErrorLoading(true);
    try {
      const r = codeRefs.current;
      const lang =
        activeTab === 'jsx' || activeTab === 'js' || activeTab === 'server'
          ? 'javascript'
          : activeTab;
      const codeSnippet =
        r[activeTab === 'server' ? 'server' : activeTab === 'js' ? 'js' : activeTab] || '';
      const resp = await tutorAPI.explainError(errorMessage, codeSnippet, lang);
      const explanation = resp.data?.explanation || 'Could not get explanation.';
      setCompanionMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: 'explain',
          userLabel: 'Error explanation',
          content: explanation,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      aiCompanionUsesRef.current += 1;
      aiExplainErrorUsesRef.current += 1;
    } catch (err) {
      console.error('Explain error', err);
      toast.error("We couldn't explain that error right now. Please try again.");
    } finally {
      setExplainErrorLoading(false);
    }
  };

  const handleExplainLastError = () => {
    if (lastError) handleExplainErrorClick(lastError);
  };

  const handleTutorSubmit = async (e) => {
    e.preventDefault();
    if (!tutorQuestion.trim()) return;
    const question = tutorQuestion.trim();
    setTutorLoading(true);
    setTutorQuestion('');
    try {
      const r = codeRefs.current;
      const errorFromQuestion = question.match(/error:?\s*(.+)/i)?.[1]?.trim() || null;
      const resp = await tutorAPI.ask(question, {
        type: 'hint-mode',
        hintStyle,
        moduleTitle: module?.title,
        objectives: module?.objectives,
        currentStepIndex: currentStepIndex,
        currentStepDescription: steps[currentStepIndex]?.title ?? null,
        code: { html: r.html, css: r.css, javascript: r.js, jsx: r.jsx, serverJs: r.server },
        currentFile: `${activeTab}.${activeTab === 'js' ? 'js' : activeTab}`,
        recentErrors,
        errorMessage: errorFromQuestion || (recentErrors.length > 0 ? recentErrors[0] : null),
      });
      let answer =
        resp.data.answer ||
        "We couldn't generate a hint right now. Try rephrasing your question or try again.";
      // Never show raw API internals (thinking, model, eval_count, etc.)
      if (
        typeof answer === 'string' &&
        (answer.includes('"thinking"') ||
          answer.includes('"eval_count"') ||
          answer.includes('"model":'))
      ) {
        answer = 'Something went wrong on our side. Please try your question again in a moment.';
      }
      setCompanionMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: 'hint',
          userLabel: question,
          content: answer,
          timestamp: new Date().toLocaleTimeString(),
          confidence: resp.data.confidence,
        },
      ]);
      aiCompanionUsesRef.current += 1;
      aiHintRequestsRef.current += 1;
    } catch (err) {
      console.error('Tutor error', err);
      setCompanionMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: 'hint',
          userLabel: question,
          content: "We couldn't get a response right now. Please try asking again.",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setTutorLoading(false);
    }
  };

  const openLivePreviewInNewTab = () => {
    const html = getPreviewContent();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener');
  };

  if (loading || isLoadingDraft) {
    return (
      <div
        className="min-h-screen bg-neutral-900 text-blue-100 flex flex-col items-center justify-center px-4 py-12"
        role="status"
        aria-live="polite"
      >
        <LoadingScreen
          message={loading ? 'Preparing your lesson…' : 'Restoring your progress…'}
          subMessage={
            loading ? 'Fetching content and steps' : 'Loading your last saved code'
          }
          className="!min-h-0"
        />
      </div>
    );
  }

  const currentStep = steps[currentStepIndex];
  const defaultAchievementIcon =
    'https://cdn.jsdelivr.net/npm/@tabler/icons@2.47.0/icons/award.svg';
  const renderAchievementIcon = (icon, alt, cls) => {
    const isUrl = typeof icon === 'string' && icon.startsWith('http');
    if (isUrl)
      return (
        <img
          src={icon}
          alt={alt}
          className={cls}
          onError={(e) => {
            if (!e.target.dataset.fb) {
              e.target.dataset.fb = '1';
              e.target.src = defaultAchievementIcon;
            }
          }}
        />
      );
    return <FaTrophy className={cls} />;
  };

  return (
    <div className="h-screen overflow-hidden bg-neutral-900 text-blue-100 flex flex-col">
      {/* Lecture Slide Popup */}
      <AnimatePresence>
        {showOverviewPopup && module && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 bg-neutral-900/70 backdrop-blur-sm z-[100]"
              onClick={() => setShowOverviewPopup(false)}
              aria-hidden
            />
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="w-[94vw] max-w-[1080px] h-[88vh] rounded-3xl flex flex-col bg-neutral-900 shadow-2xl shadow-black pointer-events-auto overflow-hidden"
              >
                <div className="shrink-0 px-5 sm:px-6 py-4 bg-neutral-900">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-200">
                        Learning Overview
                      </p>
                      <h2 className="mt-1 text-lg sm:text-xl font-bold text-blue-50 truncate">
                        {module.title}
                      </h2>
                      <p className="mt-1 text-xs text-blue-300">
                        {hasSlides
                          ? `Slide ${lectureSlideIndex + 1} of ${lectureSlides.length}`
                          : 'Quick intro before you start coding'}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowOverviewPopup(false)}
                      className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-blue-300 hover:text-blue-50 hover:bg-blue-800 transition-colors"
                      aria-label="Close"
                    >
                      <FaTimes className="text-sm" />
                    </button>
                  </div>
                </div>

                {lectureNotesLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-12 px-6 bg-neutral-900">
                    <div className="h-12 w-12 rounded-full border-2 border-blue-200/40 border-t-blue-200 animate-spin" />
                    <p className="text-base font-semibold text-blue-50 mt-6">Generating lecture slides...</p>
                    <p className="text-xs text-blue-300 mt-1">This usually takes a few seconds</p>
                  </div>
                ) : lectureNotesError ? (
                  <div className="flex-1 flex flex-col p-5 sm:p-6 bg-neutral-900">
                    <div className="flex items-start gap-2 p-4 rounded-2xl bg-neutral-900 mb-4">
                      <FaExclamationTriangle className="text-blue-200 mt-0.5 shrink-0" />
                      <p className="text-sm text-blue-50">{lectureNotesError}</p>
                    </div>
                    <p className="text-xs text-blue-300 mb-3">Showing original overview instead:</p>
                    <div className="text-blue-100 leading-relaxed overflow-y-auto flex-1 [&_.markdown-content]:[&_h2]:text-lg">
                      <MarkdownContent content={module.content} />
                    </div>
                    <button
                      onClick={() => setShowOverviewPopup(false)}
                      className="mt-6 w-full py-3 rounded-2xl bg-blue-600 text-black font-semibold shadow-md shadow-black/30 hover:bg-blue-500 transition-all"
                    >
                      Continue to editor
                    </button>
                  </div>
                ) : hasSlides ? (
                  <>
                    <div className="relative h-[30%] min-h-[140px] shrink-0">
                      <img
                        src={getSlideImage(
                          lectureSlides[lectureSlideIndex],
                          module.title,
                          module.category
                        )}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div
                        className="absolute inset-0 bg-neutral-900/55 pointer-events-none"
                        aria-hidden
                      />
                      <div className="absolute bottom-0 left-0 right-0 px-5 sm:px-6 py-4">
                        <h3 className="text-lg sm:text-xl font-bold text-blue-50 drop-shadow-lg">{module.title}</h3>
                        <p className="text-xs text-blue-50 mt-0.5">
                          Focus on one step, then move to the next.
                        </p>
                      </div>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-5 scrollbar-hide flex flex-col bg-neutral-900">
                      <div className="text-blue-50 [&_.markdown-content_h2]:text-lg [&_.markdown-content_h2]:mb-2 [&_.markdown-content_h3]:text-base [&_.markdown-content_p]:text-[15px] [&_.markdown-content_ul]:space-y-1 [&_.markdown-content_ol]:space-y-1">
                        <MarkdownContent
                          content={lectureSlides[lectureSlideIndex] || lectureSlides[0]}
                          className="[&_ul]:list-disc [&_ol]:list-decimal"
                        />
                      </div>
                      {module.hints?.length > 0 && (
                        <div className="mt-4 pt-4">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200 mb-1.5">Hints</p>
                          <ul className="list-disc list-inside text-xs text-blue-200 space-y-0.5">
                            {module.hints.map((h, i) => (
                              <li key={i}>{h}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center justify-between px-5 sm:px-6 py-3 bg-neutral-900">
                      <button
                        onClick={() => setLectureSlideIndex((i) => Math.max(0, i - 1))}
                        disabled={lectureSlideIndex === 0}
                        className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium text-blue-200 hover:text-blue-50 hover:bg-blue-700 disabled:text-blue-300 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
                      >
                        <FaChevronLeft className="text-xs" /> Previous
                      </button>
                      <div className="flex items-center gap-2">
                        {lectureSlides.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setLectureSlideIndex(i)}
                            className={`h-1.5 rounded-full transition-all ${
                              i === lectureSlideIndex
                                ? 'w-6 bg-blue-200'
                                : 'w-1.5 bg-blue-700 hover:bg-blue-300'
                            }`}
                            aria-label={`Go to slide ${i + 1}`}
                          />
                        ))}
                      </div>
                      <button
                        onClick={() =>
                          setLectureSlideIndex((i) => Math.min(lectureSlides.length - 1, i + 1))
                        }
                        disabled={lectureSlideIndex >= lectureSlides.length - 1}
                        className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium text-blue-200 hover:text-blue-50 hover:bg-blue-700 disabled:text-blue-300 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
                      >
                        Next <FaChevronRight className="text-xs" />
                      </button>
                    </div>

                    <div className="shrink-0 px-5 sm:px-6 pb-5 bg-neutral-900">
                      <button
                        onClick={() => setShowOverviewPopup(false)}
                        className="w-full py-2.5 rounded-2xl bg-blue-600 text-black text-sm font-semibold shadow-md shadow-black/30 hover:bg-blue-500 transition-all"
                      >
                        Start coding
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="relative h-[28%] min-h-[120px] shrink-0">
                      <img
                        src={getSlideImage(lectureNotes || module.content, module.title, module.category)}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div
                        className="absolute inset-0 bg-neutral-900/55 pointer-events-none"
                        aria-hidden
                      />
                      <div className="absolute bottom-0 left-0 right-0 px-5 sm:px-6 py-4">
                        <h3 className="text-lg sm:text-xl font-bold text-blue-50 drop-shadow-lg">{module.title}</h3>
                        <p className="text-xs text-blue-50 mt-0.5">Learning overview</p>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 scrollbar-hide bg-neutral-900">
                      <div className="text-blue-50 [&_.markdown-content_h2]:text-lg [&_.markdown-content_p]:text-[15px]">
                        {lectureNotes ? (
                          <MarkdownContent content={lectureNotes} />
                        ) : (
                          <MarkdownContent content={module.content} />
                        )}
                      </div>
                      {module.hints?.length > 0 && (
                        <div className="mt-4 pt-4">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200 mb-1.5">Hints</p>
                          <ul className="list-disc list-inside text-xs text-blue-200 space-y-0.5">
                            {module.hints.map((h, i) => (
                              <li key={i}>{h}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 px-5 sm:px-6 pb-5 bg-neutral-900">
                      <button
                        onClick={() => setShowOverviewPopup(false)}
                        className="w-full py-2.5 rounded-2xl bg-blue-600 text-black text-sm font-semibold shadow-md shadow-black/30 hover:bg-blue-500 transition-all"
                      >
                        Start coding
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ─── HEADER: calm title row + progress strip (stats live here, not on title row) ─── */}
      <motion.header
        className="shrink-0 relative z-10 bg-neutral-900 border-b border-neutral-800/80"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
      >
        {/* Row 1 — lesson identity + toolbar only */}
        <div className="px-4 sm:px-6 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => navigate('/dashboard', { state: { direction: 'back' } })}
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-blue-800 text-blue-200 hover:text-blue-50 hover:bg-blue-700 transition-colors"
              title="Back to Dashboard"
            >
              <FaArrowLeft className="text-xs" />
            </button>
            <div className="min-w-0 flex-1 flex items-start gap-3">
              <span className="hidden sm:flex shrink-0 w-9 h-9 rounded-lg bg-neutral-900 items-center justify-center text-blue-400">
                {isMultiplayerModule ? <FaUsers className="text-sm" /> : <FaCode className="text-sm" />}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <h1 className="text-lg sm:text-xl font-semibold text-blue-100 tracking-tight leading-tight truncate max-w-[min(100%,28rem)]">
                    {module.title}
                  </h1>
                  <span
                    className={`shrink-0 text-[10px] font-bold uppercase tracking-wide ${difficultyStyles[module.difficulty]} px-2 py-0.5 rounded-md`}
                  >
                    {module.difficulty}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-blue-400/90 hidden sm:block">Code editor</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 justify-end lg:shrink-0">
            <div className="flex items-center gap-1.5 rounded-2xl bg-neutral-900/90 p-1">
              <button
                type="button"
                onClick={handleRunCode}
                className="inline-flex items-center justify-center gap-2 min-h-9 px-4 rounded-xl bg-blue-800/90 text-blue-100 text-xs font-semibold hover:bg-blue-700 transition-colors"
              >
                <FaPlay className="text-[9px]" /> Run
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-blue-900 text-blue-200 hover:bg-blue-800 transition-colors"
                title="Reset code"
              >
                <FaUndo className="text-xs" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowTutorSidebar(!showTutorSidebar)}
              className={`min-h-9 inline-flex items-center justify-center gap-2 px-4 rounded-xl text-xs font-semibold transition-colors ${
                showTutorSidebar
                  ? 'bg-blue-600 text-black'
                  : 'bg-blue-900 text-blue-200 hover:text-blue-50 hover:bg-blue-800'
              }`}
            >
              <FaMagic className="text-[9px]" /> AI
            </button>
            <button
              type="button"
              onClick={handleCompleteModule}
              disabled={!allStepsVerified}
              className="min-h-9 inline-flex items-center justify-center gap-2 px-5 rounded-xl bg-blue-600 text-black text-xs font-bold hover:bg-blue-500 transition-colors disabled:bg-neutral-800 disabled:text-blue-500 disabled:cursor-not-allowed"
            >
              <FaCheck className="text-[9px]" /> Complete
            </button>
          </div>
        </div>

        <AnimatePresence>
          {pointFloater && (
            <motion.span
              key={pointFloater.id}
              initial={{ opacity: 1, y: 0, scale: 1.1 }}
              animate={{ opacity: 0, y: -48, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="absolute right-6 sm:right-10 top-4 flex items-center gap-1 text-amber-400/90 font-bold text-sm pointer-events-none"
            >
              <FaStar className="text-[10px]" /> +{pointFloater.amount}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Row 2 — progress + session stats (mobile: stats scroll below segments) */}
        <div className="px-4 sm:px-6 py-3 border-t border-neutral-800/80 bg-neutral-900/40">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5 min-w-0">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="shrink-0 text-[10px] font-semibold text-blue-500 uppercase tracking-[0.2em]">
                Progress
              </span>
              <span className="shrink-0 text-sm font-semibold text-blue-100 tabular-nums">
                {verifiedCount}/{steps.length}
              </span>
              <div className="flex-1 min-w-0 overflow-x-auto scrollbar-hide">
                <div className="flex items-center gap-1.5 justify-start min-w-max sm:justify-center py-0.5">
                  {steps.map((_, i) => {
                    const justVerified = i === lastVerifiedStepIndex;
                    return (
                      <motion.div
                        key={i}
                        className={`h-2.5 rounded-full transition-all duration-300 shrink-0 ${
                          steps.length <= 6 ? 'w-9' : 'w-5'
                        } ${
                          stepsVerified[i]
                            ? 'bg-emerald-700'
                            : i === currentStepIndex
                              ? 'bg-blue-600'
                              : 'bg-neutral-800'
                        } ${justVerified ? 'shadow-[0_0_10px_rgba(16,185,129,0.25)]' : ''}`}
                        animate={justVerified ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 0.4 }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 shrink-0 overflow-x-auto scrollbar-hide pb-0.5 sm:pb-0 sm:pl-4 sm:border-l border-neutral-800">
              <motion.span
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-200 whitespace-nowrap"
                animate={pointsJustEarned ? { scale: [1, 1.06, 1] } : {}}
                transition={{ duration: 0.35 }}
              >
                <FaStar className="text-amber-500/80 text-[11px]" /> {points}
              </motion.span>
              <span className="text-neutral-700 hidden sm:inline" aria-hidden>
                |
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-300 whitespace-nowrap">
                <FaFire className="text-orange-400 text-[11px]" /> {streak}
              </span>
              <span className="text-neutral-700 hidden sm:inline" aria-hidden>
                |
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-300 whitespace-nowrap">
                <FaCode className="text-blue-400 text-[11px]" /> {codeChanges}
              </span>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Floating gamified messages (errors fixed, etc.) */}
      <div className="fixed left-1/2 -translate-x-1/2 top-28 sm:top-32 z-[100] flex flex-col items-center gap-2 pointer-events-none">
        <AnimatePresence>
          {floatingMessages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 0, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -24, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg ${
                m.type === 'success'
                  ? 'bg-blue-950 text-blue-100 shadow-md shadow-black/40'
                  : m.type === 'error'
                    ? 'bg-red-900/90 text-red-100 shadow-md shadow-black/40'
                    : 'bg-blue-900/90 text-blue-100 shadow-md shadow-black/40'
              }`}
            >
              {m.type === 'success' && <FaCheckCircle className="text-base shrink-0" />}
              {m.type === 'error' && <FaExclamationTriangle className="text-base shrink-0" />}
              <span>{m.text}</span>
              {m.points != null && (
                <span className="shrink-0 flex items-center gap-1 bg-neutral-900 px-2 py-0.5 rounded-full text-xs">
                  <FaStar className="text-[10px]" /> +{m.points}
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <motion.div
        className="flex-1 flex overflow-hidden min-h-0 relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        {/* ─── LEFT PANEL (resizable) ─── */}
        <motion.aside
          className="flex flex-col shrink-0 min-h-0 max-h-full overflow-y-auto overflow-x-hidden scrollbar-hide bg-neutral-900 border-r border-neutral-800/60"
          style={{ width: leftPanelWidth }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
        >
          {/* Lesson overview (collapsible) – clear, readable block */}
          <motion.div
            className="shrink-0 bg-neutral-900"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
          >
            <button
              onClick={() => setShowOverview(!showOverview)}
              className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-semibold text-blue-100 hover:bg-neutral-900/80 transition-colors"
            >
              <span className="flex items-center gap-2">
                <FaBookOpen className="text-blue-200" /> Lesson Overview
              </span>
              {showOverview ? (
                <FaChevronUp className="text-xs" />
              ) : (
                <FaChevronDown className="text-xs" />
              )}
            </button>
            <AnimatePresence>
              {showOverview && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 max-h-[400px] overflow-y-auto scrollbar-hide">
                    <button
                      onClick={() => {
                        setLectureSlideIndex(0);
                        setShowOverviewPopup(true);
                      }}
                      className="w-full mb-3 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-black text-xs font-semibold hover:bg-blue-500 transition-colors"
                    >
                      <FaBookOpen className="text-xs" /> Open Lecture
                    </button>
                    <div className="text-sm text-blue-100 leading-relaxed tracking-tight">
                      <MarkdownContent content={module.content} />
                    </div>
                    {module.hints?.length > 0 && (
                      <div className="mt-4 pt-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-blue-300 mb-2">
                          Hints
                        </p>
                        <ul className="list-disc pl-4 space-y-1.5 text-sm text-blue-200">
                          {module.hints.map((h, i) => (
                            <li key={i}>{h}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Step-by-step tracker */}
          <motion.div
            className="flex-1 overflow-y-auto scrollbar-hide min-h-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.08 }}
          >
            <div className="px-5 py-4">
              <motion.h3
                className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-500 mb-4"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                Steps
              </motion.h3>
              <div className="space-y-2">
                {steps.map((step, i) => {
                  const verified = stepsVerified[i];
                  const isCurrent = i === currentStepIndex;
                  const justVerified = i === lastVerifiedStepIndex;
                  const locked = i > currentStepIndex && !verified;
                  const failedFeedback = stepFailureFeedback[i];
                  return (
                    <motion.div
                      key={step.id}
                      className={`flex gap-2.5 items-start rounded-md transition-colors duration-300 ${justVerified ? 'bg-emerald-800/90' : ''}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.12 + i * 0.04 }}
                    >
                      {/* Vertical line + circle */}
                      <div className="flex flex-col items-center shrink-0 pt-0.5">
                        <motion.div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                            verified
                              ? 'bg-emerald-800/90 text-emerald-50 shadow-sm shadow-black/30'
                              : isCurrent
                                ? 'bg-blue-600 text-black shadow-sm shadow-black/30'
                                : failedFeedback
                                  ? 'bg-blue-700 text-blue-100'
                                  : 'bg-neutral-900 text-blue-400'
                          } ${justVerified ? 'shadow-[0_0_10px_rgba(74,222,128,0.5)]' : ''}`}
                          animate={justVerified ? { scale: [1, 1.35, 1] } : {}}
                          transition={{ duration: 0.35 }}
                        >
                          {verified ? (
                            <FaCheck className="text-[8px]" />
                          ) : failedFeedback ? (
                            <FaTimes className="text-[8px]" />
                          ) : (
                            i + 1
                          )}
                        </motion.div>
                        {i < steps.length - 1 && (
                          <div
                            className={`w-0.5 h-4 mt-1 rounded-full ${verified ? 'bg-emerald-800/90' : 'bg-neutral-800'}`}
                          />
                        )}
                      </div>
                      {/* Step content */}
                      <button
                        onClick={() => !locked && goToStep(i)}
                        disabled={locked}
                        className={`flex-1 text-left pb-2 min-w-0 transition-colors ${
                          locked ? 'cursor-not-allowed text-blue-400' : 'hover:text-blue-50'
                        }`}
                      >
                        <p
                          className={`text-xs font-medium leading-tight truncate ${
                            isCurrent
                              ? 'text-blue-300'
                              : verified
                                ? 'text-emerald-400/90'
                                : failedFeedback
                                  ? 'text-blue-200'
                                  : 'text-blue-200'
                          } ${failedFeedback && !isCurrent ? 'line-through' : ''}`}
                        >
                          {step.title}
                        </p>
                        {failedFeedback && (
                          <p className="text-[10px] text-blue-200 mt-0.5 line-clamp-2">
                            {failedFeedback}
                          </p>
                        )}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Achievements panel (collapsible) */}
            <motion.div
              className="mx-4 mb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <button
                onClick={() => setShowAchievements(!showAchievements)}
                className="w-full flex items-center justify-between py-2 text-xs font-semibold text-blue-300 hover:text-blue-100 transition"
              >
                <span className="flex items-center gap-2">
                  <FaTrophy className="text-neon-gold" />
                  Achievements
                  <span className="text-[10px] font-bold text-neon-gold">
                    {earnedAchievements.length}/{achievements.length}
                  </span>
                </span>
                {showAchievements ? (
                  <FaChevronUp className="text-[10px]" />
                ) : (
                  <FaChevronDown className="text-[10px]" />
                )}
              </button>
              <AnimatePresence>
                {showAchievements && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-2 pb-3 max-h-[240px] overflow-y-auto scrollbar-hide">
                      {achievements.map((ach, idx) => (
                        <motion.div
                          key={ach.id}
                          initial={{ opacity: 0, scale: 0.92 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.05 + idx * 0.04 }}
                          className={`rounded-xl p-2 flex flex-col items-center text-center gap-1 transition-colors ${
                            ach.earned
                              ? 'bg-blue-900'
                              : 'bg-blue-900'
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${ach.earned ? 'bg-neon-gold' : 'bg-neutral-900'}`}
                          >
                            {ach.earned ? (
                              renderAchievementIcon(ach.icon, ach.name, 'w-4 h-4 text-neon-gold')
                            ) : (
                              <FaLock className="text-[10px] text-blue-400" />
                            )}
                          </div>
                          <p
                            className={`text-[10px] font-semibold leading-tight line-clamp-2 ${ach.earned ? 'text-blue-100' : 'text-blue-400'}`}
                          >
                            {ach.name}
                          </p>
                          {ach.earned && ach.points && (
                            <span className="text-[9px] text-neon-gold">+{ach.points} pts</span>
                          )}
                        </motion.div>
                      ))}
                      {achievements.length === 0 && (
                        <p className="col-span-2 text-[11px] text-blue-400 italic py-2">
                          Complete steps to earn achievements
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* Left bottom: MCQ (when active) OR Step card + Check my code */}
          <div
            className={`bg-neutral-900 border-t border-neutral-900 px-5 py-4 min-h-0 space-y-3 ${
              mcqGateForStep !== null
                ? 'shrink-0 min-h-0 max-h-[38vh] flex flex-col overflow-hidden'
                : 'shrink-0'
            }`}
          >
            <AnimatePresence mode="wait">
              {mcqGateForStep !== null ? (
                <motion.div
                  key="mcq-bottom"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                  className="rounded-xl bg-neutral-900 p-3 flex flex-col min-h-0 flex-1 max-h-full overflow-hidden gap-2 shadow-inner shadow-black"
                >
                  <h4 className="text-xs font-bold text-blue-100 flex items-center gap-1.5 shrink-0">
                    <FaBolt className="text-blue-400" /> Concept Check
                  </h4>
                  {mcqLoading ? (
                    <div
                      className="flex items-center gap-2 text-[11px] text-blue-300 shrink-0"
                      role="status"
                      aria-label="Preparing quiz"
                    >
                      <div
                        className="h-3 w-3 rounded-full border-2 border-blue-300 border-t-transparent animate-spin"
                        aria-hidden
                      />
                      Preparing your quiz…
                    </div>
                  ) : mcqQuestions.length > 0 ? (
                    <>
                      <div className="flex-1 min-h-0 max-h-[calc(38vh-8.5rem)] overflow-y-auto overscroll-contain space-y-2 pr-1 scroll-smooth">
                        <p className="text-[11px] text-blue-100 leading-relaxed">
                          <span className="text-blue-200 font-semibold">
                            Q{mcqCurrentIndex + 1}/{mcqQuestions.length}:
                          </span>{' '}
                          {mcqQuestions[mcqCurrentIndex]?.question}
                        </p>
                        {mcqErrorsByQuestion[mcqCurrentIndex] && (
                          <div className="rounded-lg bg-blue-700 text-blue-100 p-2 text-[11px] break-words">
                            {mcqErrorsByQuestion[mcqCurrentIndex]}
                          </div>
                        )}
                        <div className="space-y-1">
                          {mcqQuestions[mcqCurrentIndex]?.options?.map((opt, idx) => (
                            <motion.button
                              key={idx}
                              type="button"
                              onClick={() => setMcqSelectedIndex(idx)}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition ${
                                mcqSelectedIndex === idx
                                  ? 'bg-blue-500 text-black shadow-sm shadow-black'
                                  : 'bg-neutral-900 text-blue-200 hover:bg-neutral-800'
                              }`}
                            >
                              {opt}
                            </motion.button>
                          ))}
                        </div>
                        <AnimatePresence mode="wait">
                          {mcqResult && mcqResult.correct && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className={`overflow-hidden rounded-lg p-2 text-[11px] break-words ${mcqResult.correct ? 'bg-blue-500 text-black' : 'bg-blue-700 text-black'}`}
                            >
                              {mcqResult.explanation}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <div className="flex gap-2 shrink-0 pt-2 border-t border-neutral-800/70 bg-neutral-900">
                        <button
                          type="button"
                          onClick={handleMCQSubmit}
                          disabled={mcqVerifyLoading || mcqSelectedIndex == null}
                          className="flex-1 py-1.5 rounded-xl bg-blue-600 text-black text-xs font-bold shadow-md shadow-black/30 hover:bg-blue-500 disabled:opacity-45 disabled:saturate-50 disabled:cursor-not-allowed disabled:shadow-none transition-all"
                        >
                          {mcqVerifyLoading ? 'Checking your answer…' : 'Check answer'}
                        </button>
                        {mcqPassedCount === mcqQuestions.length && mcqQuestions.length > 0 && (
                          <button
                            type="button"
                            onClick={handleMCQNextStep}
                            className="flex-1 py-1.5 rounded-lg bg-emerald-800/90 text-emerald-50 text-xs font-bold hover:bg-emerald-700/90 transition flex items-center justify-center gap-1"
                          >
                            Next <FaChevronRight className="text-[8px]" />
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleMCQNextStep}
                      className="w-full py-1.5 rounded-lg bg-neutral-800 text-blue-200 text-xs hover:bg-neutral-700 transition"
                    >
                      Skip to next step
                    </button>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="step-card-bottom"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                  className="space-y-2"
                >
                  <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-blue-400/90 mb-1.5 font-bold">
                      Step {currentStepIndex + 1} of {steps.length}
                    </p>
                    {currentStep?.title && (
                      <p className="text-sm font-medium text-blue-100 mb-2 leading-snug">{currentStep.title}</p>
                    )}
                    <p className="text-[13px] text-blue-300 leading-relaxed line-clamp-4">
                      {currentStep?.instruction ?? currentStep?.title ?? 'Complete this step.'}
                    </p>
                    {currentStep?.concept && (
                      <p className="text-[10px] text-blue-300 mt-1.5 italic pl-2 line-clamp-2 bg-neutral-900 rounded-md py-0.5">
                        {currentStep.concept}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    disabled={verifyLoading}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-600 text-black text-xs font-bold shadow-md shadow-black/30 hover:bg-blue-500 disabled:opacity-45 disabled:saturate-50 disabled:cursor-not-allowed disabled:shadow-none transition-all"
                  >
                    {verifyLoading ? (
                      <>
                        <div
                          className="h-3 w-3 rounded-full border-2 border-blue-400/50 border-t-blue-200 animate-spin"
                          aria-hidden
                        />
                        Checking your code…
                      </>
                    ) : (
                      <>
                        <FaCheck className="text-[9px]" /> Check my code
                      </>
                    )}
                  </button>
                  {(verifyPassed || stepsVerified[currentStepIndex]) &&
                    currentStepIndex < steps.length - 1 && (
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-800 text-blue-200 text-xs font-bold hover:bg-blue-700 transition-colors"
                      >
                        Next step <FaChevronRight className="text-[8px]" />
                      </button>
                    )}
                  <AnimatePresence>
                    {verifyFeedback && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`rounded-lg p-2 text-[11px] leading-relaxed ${
                          verifyPassed
                            ? 'bg-emerald-800/90 text-emerald-50'
                            : 'bg-blue-600 text-black'
                        }`}
                      >
                        {verifyFeedback}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.aside>

        {/* Left panel resize handle — wide hit target + pointer capture for smooth shrink/expand over editor */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-valuemin={200}
          aria-valuemax={520}
          aria-valuenow={leftPanelWidth}
          onPointerDown={handleLeftResizePointerDown}
          onPointerMove={handleLeftResizePointerMove}
          onPointerUp={handleLeftResizePointerUp}
          onPointerCancel={handleLeftResizePointerUp}
          onLostPointerCapture={handleResizeLostCapture}
          className="relative z-20 flex w-3 shrink-0 cursor-col-resize touch-none select-none justify-center hover:[&>div]:bg-blue-600 active:[&>div]:bg-blue-600"
          title="Drag to resize lesson panel"
        >
          <div className="pointer-events-none w-px h-full bg-neutral-700 transition-colors" />
        </div>

        {/* ─── CENTER: CODE EDITOR ─── */}
        <motion.div
          className="flex-1 flex flex-col min-w-0 min-h-0 bg-neutral-900"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300, delay: 0.06 }}
        >
          {/* File tabs */}
          <motion.div
            className="flex items-center bg-neutral-900 border-b border-neutral-800/60 shrink-0 px-1 pt-1 gap-0.5"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {moduleConfig.tabs.map((tab, idx) => (
              <motion.button
                key={tab}
                initial={{ opacity: 0, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + idx * 0.03 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition rounded-t-lg ${
                  activeTab === tab
                    ? 'text-black bg-blue-600'
                    : 'text-blue-400/85 hover:text-blue-100 hover:bg-neutral-900/80'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'jsx' && <FaReact className="text-blue-400 text-xs" />}
                {tab === 'server' && <FaServer className="text-blue-400 text-xs" />}
                {tab === 'server' ? 'SERVER.JS' : tab.toUpperCase()}
              </motion.button>
            ))}
            {isReactModule && (
              <span className="ml-auto mr-3 flex items-center gap-1 text-[10px] text-blue-400">
                <FaReact /> React
              </span>
            )}
            {isMultiplayerModule && (
              <span className="ml-auto mr-3 flex items-center gap-1 text-[10px] text-blue-500">
                <FaUsers /> Multiplayer
              </span>
            )}
          </motion.div>
          {/* Editor + floating step guide */}
          <motion.div
            className="flex-1 overflow-hidden bg-neutral-900/35 relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            {/* Floating step guide */}
            <AnimatePresence>
              {showStepGuide && currentStep && (
                <motion.div
                  key={`guide-${currentStepIndex}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                  className="absolute bottom-4 right-4 left-4 sm:left-auto z-30 w-auto max-w-full sm:max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl shadow-black overflow-hidden"
                >
                  <div className="flex items-start gap-3 p-4">
                    <div className="shrink-0 w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                      <FaLightbulb className="text-black text-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="rounded-full bg-neutral-900 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-300">
                          Step {currentStepIndex + 1}/{steps.length}
                        </span>
                        <span className="text-sm font-medium text-blue-50 leading-snug">
                          {currentStep.title}
                        </span>
                      </div>
                      <p className="text-[13px] text-blue-300 leading-relaxed mb-2">
                        {currentStep.instruction || currentStep.title}
                      </p>
                      {currentStep.concept && (
                        <p className="text-xs text-blue-300 bg-neutral-900 rounded-lg px-3 py-2 leading-relaxed">
                          {currentStep.concept}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setShowStepGuide(false)}
                      className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-blue-500 hover:text-blue-100 hover:bg-neutral-900 transition"
                      aria-label="Close step guide"
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Re-show guide button (when dismissed) */}
            {!showStepGuide && currentStep && !allStepsVerified && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 20 }}
                onClick={() => setShowStepGuide(true)}
                className="absolute bottom-4 right-4 z-30 flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-semibold text-blue-300 hover:bg-neutral-900 transition shadow-lg shadow-black"
                title="Show step guide"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <FaLightbulb className="text-[9px]" /> Step {currentStepIndex + 1}
              </motion.button>
            )}
            {activeTab === 'html' && (
              <CodeMirror
                key={`html-${editorKey}`}
                value={codeRefs.current.html}
                height="100%"
                theme={vscodeDark}
                extensions={extHtml}
                onCreateEditor={onEditorCreate}
                onChange={onChangeHtml}
                basicSetup={{ lineNumbers: true, completionKeymap: true }}
              />
            )}
            {activeTab === 'css' && (
              <CodeMirror
                key={`css-${editorKey}`}
                value={codeRefs.current.css}
                height="100%"
                theme={vscodeDark}
                extensions={extCss}
                onCreateEditor={onEditorCreate}
                onChange={onChangeCss}
                basicSetup={{ lineNumbers: true, completionKeymap: true }}
              />
            )}
            {activeTab === 'js' && (
              <CodeMirror
                key={`js-${editorKey}`}
                value={codeRefs.current.js}
                height="100%"
                theme={vscodeDark}
                extensions={extJs}
                onCreateEditor={onEditorCreate}
                onChange={onChangeJs}
                basicSetup={{ lineNumbers: true, completionKeymap: true }}
              />
            )}
            {activeTab === 'jsx' && (
              <CodeMirror
                key={`jsx-${editorKey}`}
                value={codeRefs.current.jsx}
                height="100%"
                theme={vscodeDark}
                extensions={extJsx}
                onCreateEditor={onEditorCreate}
                onChange={onChangeJsx}
                basicSetup={{ lineNumbers: true, completionKeymap: true }}
              />
            )}
            {activeTab === 'server' && (
              <CodeMirror
                key={`server-${editorKey}`}
                value={codeRefs.current.server}
                height="100%"
                theme={vscodeDark}
                extensions={extServer}
                onCreateEditor={onEditorCreate}
                onChange={onChangeServer}
                basicSetup={{ lineNumbers: true, completionKeymap: true }}
              />
            )}
          </motion.div>

          {/* Code errors panel - shows runtime/console errors below the editor; "All clear!" when fixed */}
          <AnimatePresence mode="wait">
            {showAllClear ? (
              <motion.div
                key="all-clear"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ type: 'spring', damping: 20 }}
                className="shrink-0 bg-neutral-900 px-3 py-3 flex items-center gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.2)]"
              >
                <span className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                  <FaCheckCircle className="text-blue-400 text-sm" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-blue-100">All clear!</p>
                  <p className="text-[10px] text-blue-200">
                    No errors in this run. Keep going!
                  </p>
                </div>
                <span className="text-[10px] font-bold text-black bg-blue-400 px-2 py-0.5 rounded-full">
                  +10
                </span>
              </motion.div>
            ) : recentErrors.length > 0 ? (
              <div className="shrink-0 bg-neutral-900 shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 flex items-center gap-1.5">
                    <FaExclamationTriangle className="text-blue-300" /> Errors ({recentErrors.length}
                    )
                  </span>
                  <button
                    type="button"
                    onClick={clearConsole}
                    className="text-[9px] font-semibold text-blue-200 hover:text-blue-100 transition"
                  >
                    Clear
                  </button>
                </div>
                <ul className="max-h-24 overflow-y-auto scrollbar-hide px-3 py-2 space-y-1.5">
                  {recentErrors.map((msg, i) => (
                    <li
                      key={`editor-err-${i}`}
                      className="flex items-start gap-2 text-[11px] rounded-lg bg-blue-700 px-2 py-1.5"
                    >
                      <span className="shrink-0 w-5 h-5 rounded bg-blue-600 text-black flex items-center justify-center text-[10px] font-bold">
                        !
                      </span>
                      <span className="text-blue-100 break-words flex-1 min-w-0 font-medium">
                        {msg}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleExplainErrorClick(msg)}
                        disabled={explainErrorLoading}
                        className="shrink-0 rounded-md px-2 py-0.5 text-[9px] font-bold bg-blue-600 text-black hover:bg-blue-500 disabled:bg-blue-700 disabled:text-blue-300 disabled:cursor-not-allowed transition-colors"
                      >
                        Explain
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </AnimatePresence>
        </motion.div>

        {/* Right panel resize handle — pointer capture so dragging across preview iframe still works */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-valuemin={260}
          aria-valuemax={900}
          aria-valuenow={rightPanelWidth}
          onPointerDown={handleRightResizePointerDown}
          onPointerMove={handleRightResizePointerMove}
          onPointerUp={handleRightResizePointerUp}
          onPointerCancel={handleRightResizePointerUp}
          onLostPointerCapture={handleResizeLostCapture}
          className="relative z-20 flex w-3 shrink-0 cursor-col-resize touch-none select-none justify-center hover:[&>div]:bg-blue-600 active:[&>div]:bg-blue-600"
          title="Drag to resize preview panel"
        >
          <div className="pointer-events-none w-px h-full bg-neutral-700 transition-colors" />
        </div>

        {/* ─── RIGHT: PREVIEW + CONSOLE (resizable) ─── */}
        <motion.div
          className="flex flex-col bg-neutral-900 border-l border-neutral-800/60 shrink-0 min-h-0"
          style={{ width: rightPanelWidth }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300, delay: 0.1 }}
        >
          {isMultiplayerModule ? (
            <>
              {/* Multiplayer preview tabs */}
              <motion.div
                className="flex bg-neutral-900 border-b border-neutral-800 shrink-0"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
              >
                {[
                  {
                    key: 'server',
                    label: 'Server',
                    activeClass: 'text-black bg-blue-600',
                  },
                  {
                    key: 'player1',
                    label: 'Client 1',
                    activeClass: 'text-black bg-blue-300',
                    icon: FaUser,
                  },
                  {
                    key: 'player2',
                    label: 'Client 2',
                    activeClass: 'text-black bg-blue-200',
                    icon: FaUser,
                  },
                ].map(({ key, label, activeClass, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActivePreviewTab(key)}
                    className={`flex-1 flex items-center justify-center gap-1 px-2 py-2.5 text-[10px] font-semibold transition rounded-t-md ${
                      activePreviewTab === key ? activeClass : 'text-blue-500 hover:text-blue-200 hover:bg-neutral-800'
                    }`}
                  >
                    {Icon && <Icon className="text-[8px]" />} {label}
                  </button>
                ))}
              </motion.div>
              <div className="flex-1 flex flex-col bg-neutral-900 overflow-hidden min-h-0 relative">
                {/* Keep all iframes mounted; use snapshot so code changes don't reload (new socket). Only Run/Reset update snapshot. */}
                <iframe
                  key={`server-${serverPreviewKey}`}
                  srcDoc={multiplayerSnapshot?.server ?? getPreviewContent('server')}
                  className={
                    activePreviewTab === 'server'
                      ? 'w-full flex-1 min-h-0 border-0'
                      : 'absolute w-px h-px opacity-0 pointer-events-none overflow-hidden'
                  }
                  sandbox="allow-scripts allow-same-origin"
                  title="Server"
                />
                <div
                  className={
                    activePreviewTab === 'player1'
                      ? 'flex flex-col flex-1 min-h-0'
                      : 'absolute w-px h-px opacity-0 pointer-events-none overflow-hidden'
                  }
                >
                  <div className="px-2 py-1 bg-blue-700 text-blue-100 text-[10px] font-bold text-center shrink-0">
                    Client 1
                  </div>
                  <iframe
                    key={`p1-${player1PreviewKey}`}
                    srcDoc={multiplayerSnapshot?.player1 ?? getPreviewContent('player1')}
                    className="flex-1 w-full min-h-0 border-0"
                    sandbox="allow-scripts allow-same-origin"
                    title="Client 1"
                  />
                </div>
                <div
                  className={
                    activePreviewTab === 'player2'
                      ? 'flex flex-col flex-1 min-h-0'
                      : 'absolute w-px h-px opacity-0 pointer-events-none overflow-hidden'
                  }
                >
                  <div className="px-2 py-1 bg-blue-600 text-black text-[10px] font-bold text-center shrink-0">
                    Client 2
                  </div>
                  <iframe
                    key={`p2-${player2PreviewKey}`}
                    srcDoc={multiplayerSnapshot?.player2 ?? getPreviewContent('player2')}
                    className="flex-1 w-full min-h-0 border-0"
                    sandbox="allow-scripts allow-same-origin"
                    title="Client 2"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Standard preview */}
              <motion.div
                className="flex items-center justify-between bg-neutral-900 border-b border-neutral-800 px-4 py-2.5 shrink-0"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
              >
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FaPlay className="text-[8px] text-emerald-400/90" /> Preview
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-emerald-400/90 font-medium">Auto-refresh</span>
                  <button
                    onClick={openLivePreviewInNewTab}
                    className="text-blue-400 hover:text-blue-100 text-[10px] transition"
                    title="Open in new tab"
                  >
                    <FaExternalLinkAlt />
                  </button>
                </div>
              </motion.div>
              <iframe
                key={previewKey}
                className="flex-1 border-0 bg-neutral-900 w-full min-h-0"
                title="preview"
                srcDoc={getPreviewContent()}
                sandbox="allow-scripts allow-same-origin"
              />
            </>
          )}
          {/* Console resize handle (when open) */}
          {consoleOpen && (
            <div
              role="separator"
              aria-orientation="horizontal"
              aria-valuemin={72}
              aria-valuemax={520}
              aria-valuenow={consoleHeight}
              onPointerDown={handleConsoleResizePointerDown}
              onPointerMove={handleConsoleResizePointerMove}
              onPointerUp={handleConsoleResizePointerUp}
              onPointerCancel={handleConsoleResizePointerUp}
              onLostPointerCapture={handleResizeLostCapture}
              className="relative z-20 h-3 shrink-0 cursor-row-resize touch-none select-none flex items-center justify-center hover:[&>div]:bg-blue-600 active:[&>div]:bg-blue-600"
              title="Drag to resize console"
            >
              <div className="pointer-events-none w-14 h-0.5 rounded-full bg-neutral-700 transition-colors" />
            </div>
          )}
          {/* Console (resizable height when open); separate Server / Clients for multiplayer */}
          <div
            className="bg-neutral-900 flex flex-col shrink-0 shadow-[0_-4px_24px_rgba(0,0,0,0.25)]"
            style={{ height: consoleOpen ? consoleHeight : 32 }}
          >
            <button
              onClick={() => setConsoleOpen(!consoleOpen)}
              className="flex items-center justify-between w-full px-3 py-1.5 text-[11px] font-bold text-blue-300 hover:bg-neutral-800 transition shrink-0"
            >
              <span className="flex items-center gap-2">
                Console
                {consoleLogs.length > 0 && (
                  <span className="rounded-full bg-neutral-800 px-1.5 py-0 text-[9px] font-semibold text-blue-200">
                    {consoleLogs.length}
                  </span>
                )}
              </span>
              <div className="flex items-center gap-2">
                {consoleOpen && !isMultiplayerModule && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      clearConsole();
                    }}
                    className="text-[10px] text-blue-400 hover:text-blue-200 cursor-pointer"
                  >
                    Clear
                  </span>
                )}
                {consoleOpen ? (
                  <FaChevronDown className="text-[8px]" />
                ) : (
                  <FaChevronRight className="text-[8px]" />
                )}
              </div>
            </button>
            {consoleOpen &&
              (isMultiplayerModule ? (
                <div className="flex-1 flex min-h-0 overflow-hidden">
                  <div className="flex-1 flex flex-col min-w-0 shadow-[inset_-1px_0_0_rgba(255,255,255,0.04)]">
                    <div className="flex items-center justify-between px-2 py-1 bg-blue-700 shrink-0">
                      <span className="text-[10px] font-bold text-blue-400">Server</span>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          clearServerConsole();
                        }}
                        className="text-[10px] text-blue-400 hover:text-blue-200 cursor-pointer"
                      >
                        Clear
                      </span>
                    </div>
                    <div className="overflow-y-auto scrollbar-hide flex-1 min-h-0 px-2 py-1 font-mono text-[11px] space-y-0.5">
                      {serverLogs.length === 0 ? (
                        <p className="text-blue-500 italic text-[10px] px-1">
                          No server output yet.
                        </p>
                      ) : (
                        serverLogs.map((entry, i) => (
                          <div
                            key={`s-${entry.timestamp}-${i}`}
                            className={`flex gap-1.5 py-0.5 px-1.5 rounded ${
                              entry.level === 'error'
                                ? 'text-blue-100 bg-blue-700'
                                : entry.level === 'warn'
                                  ? 'text-black bg-blue-600'
                                  : entry.level === 'info'
                                    ? 'text-black bg-blue-400'
                                    : 'text-blue-300 bg-white/[0.03]'
                            }`}
                          >
                            <span className="shrink-0 opacity-50 text-[10px]">[{entry.level}]</span>
                            <span className="break-all flex-1">{entry.message}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex items-center justify-between px-2 py-1 bg-blue-800 shrink-0">
                      <span className="text-[10px] font-bold text-blue-200">Clients</span>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          clearClientConsole();
                        }}
                        className="text-[10px] text-blue-400 hover:text-blue-200 cursor-pointer"
                      >
                        Clear
                      </span>
                    </div>
                    <div className="overflow-y-auto scrollbar-hide flex-1 min-h-0 px-2 py-1 font-mono text-[11px] space-y-0.5">
                      {clientLogs.length === 0 ? (
                        <p className="text-blue-500 italic text-[10px] px-1">
                          No client output yet.
                        </p>
                      ) : (
                        clientLogs.map((entry, i) => (
                          <div
                            key={`c-${entry.timestamp}-${i}`}
                            className={`flex gap-1.5 py-0.5 px-1.5 rounded ${
                              entry.level === 'error'
                                ? 'text-blue-100 bg-blue-700'
                                : entry.level === 'warn'
                                  ? 'text-black bg-blue-600'
                                  : entry.level === 'info'
                                    ? 'text-black bg-blue-400'
                                    : 'text-blue-300 bg-white/[0.03]'
                            }`}
                          >
                            <span className="shrink-0 opacity-50 text-[10px]">[{entry.level}]</span>
                            <span className="break-all flex-1">{entry.message}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="overflow-y-auto scrollbar-hide flex-1 min-h-0 px-2 pb-2 font-mono text-[11px] space-y-0.5">
                  {consoleLogs.length === 0 ? (
                    <p className="text-blue-500 italic text-[10px] px-1">No console output yet.</p>
                  ) : (
                    consoleLogs.map((entry, i) => (
                      <div
                        key={`${entry.timestamp}-${i}`}
                        className={`flex gap-1.5 py-0.5 px-1.5 rounded ${
                          entry.level === 'error'
                            ? 'text-blue-100 bg-blue-700'
                            : entry.level === 'warn'
                              ? 'text-black bg-blue-600'
                              : entry.level === 'info'
                                ? 'text-black bg-blue-400'
                                : 'text-blue-300 bg-white/[0.03]'
                        }`}
                      >
                        <span className="shrink-0 opacity-50 text-[10px]">[{entry.level}]</span>
                        <span className="break-all flex-1">{entry.message}</span>
                      </div>
                    ))
                  )}
                </div>
              ))}
          </div>
        </motion.div>

        {/* ─── AI COMPANION SLIDE-OUT ─── */}
        <AnimatePresence>
          {showTutorSidebar && (
            <motion.aside
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-28 sm:top-32 right-0 bottom-0 w-80 max-w-[90vw] z-50 flex flex-col bg-neutral-900 shadow-[-8px_0_32px_rgba(0,0,0,0.45)]"
            >
              <div className="flex items-center justify-between px-4 py-2.5 shrink-0 bg-neutral-900">
                <h2 className="text-xs font-bold text-blue-50 flex items-center gap-2">
                  <FaMagic className="text-blue-400" /> AI Companion
                </h2>
                <button
                  onClick={() => setShowTutorSidebar(false)}
                  className="w-6 h-6 rounded-md flex items-center justify-center text-blue-300 hover:text-blue-50 hover:bg-neutral-800 transition"
                >
                  <FaTimes className="text-[10px]" />
                </button>
              </div>
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                {/* Recent errors - gamified highlight */}
                {recentErrors.length > 0 && (
                  <div className="mx-3 mt-2 p-2.5 rounded-xl bg-blue-800 shrink-0 shadow-lg shadow-black">
                    <p className="text-[9px] uppercase tracking-wider text-blue-200 font-bold mb-1.5 flex items-center gap-1.5">
                      <FaExclamationTriangle className="text-blue-300" /> Errors
                    </p>
                    <ul className="space-y-1.5">
                      {recentErrors.slice(-3).map((msg, i) => (
                        <li
                          key={`err-${i}`}
                          className="flex items-start gap-1.5 rounded-lg bg-blue-700 px-2 py-1.5"
                        >
                          <span className="text-[10px] text-blue-100 break-words flex-1 min-w-0 line-clamp-2 font-medium">
                            {msg}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleExplainErrorClick(msg)}
                            disabled={explainErrorLoading}
                            className="shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold bg-blue-600 text-black hover:bg-blue-500 disabled:bg-blue-700 disabled:text-blue-300 disabled:cursor-not-allowed transition-colors"
                          >
                            Explain
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* Message thread - highlighted code vs error explanations */}
                <div className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-2">
                  {companionMessages.length === 0 &&
                    !explainCodeLoading &&
                    !tutorLoading &&
                    !explainErrorLoading && (
                      <p className="text-[11px] text-blue-400 italic leading-relaxed">
                        Ask a question, select code and click &quot;Explain&quot;, or paste an error
                        message.
                      </p>
                    )}
                  {companionMessages.map((msg) => {
                    const isErrorExplanation =
                      msg.type === 'explain' && msg.userLabel === 'Error explanation';
                    const isCodeExplanation = msg.type === 'explain' && !isErrorExplanation;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-xl overflow-hidden ${
                          isErrorExplanation
                            ? 'bg-neutral-900 shadow-lg shadow-black'
                            : isCodeExplanation
                              ? 'bg-neutral-900 shadow-lg shadow-black'
                              : 'bg-neutral-900 shadow-md shadow-black'
                        }`}
                      >
                        <div
                          className={`px-3 py-1.5 flex items-center justify-between gap-2 ${
                            isErrorExplanation
                              ? 'text-blue-100 bg-blue-900'
                              : isCodeExplanation
                                ? 'text-blue-200 bg-blue-800'
                                : 'text-blue-400 bg-white/[0.03]'
                          } text-[10px] font-semibold`}
                        >
                          <span className="flex items-center gap-1.5">
                            {isErrorExplanation && (
                              <FaExclamationTriangle className="text-blue-300 shrink-0" />
                            )}
                            {isCodeExplanation && <FaMagic className="text-blue-400 shrink-0" />}
                            {isErrorExplanation
                              ? 'Error explanation'
                              : isCodeExplanation
                                ? 'Code explanation'
                                : 'You'}
                            {msg.type === 'hint' && msg.userLabel !== 'Step help' && (
                              <span
                                className="text-blue-500 truncate max-w-[80px]"
                                title={msg.userLabel}
                              >
                                : {msg.userLabel}
                              </span>
                            )}
                          </span>
                          <span className="shrink-0 opacity-70">{msg.timestamp}</span>
                        </div>
                        <div className="p-3 text-xs leading-relaxed text-blue-100">
                          <MarkdownContent content={msg.content} />
                        </div>
                        {msg.confidence != null && msg.type === 'hint' && (
                          <div className="px-3 pb-2">
                            <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[9px] text-blue-400">
                              {msg.confidence >= 0.6
                                ? 'Targeted'
                                : msg.confidence >= 0.4
                                  ? 'General'
                                  : 'Needs context'}
                            </span>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                  {(explainCodeLoading || tutorLoading || explainErrorLoading) && (
                    <div
                      className="rounded-xl bg-blue-800 p-3 flex items-center gap-2 text-blue-200 shadow-inner shadow-black"
                      role="status"
                    >
                      <div
                        className="h-3.5 w-3.5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin"
                        aria-hidden
                      />
                      <span className="text-[11px]">
                        {explainCodeLoading
                          ? 'Explaining your code…'
                          : tutorLoading
                            ? 'Thinking of a hint…'
                            : 'Explaining this error…'}
                      </span>
                    </div>
                  )}
                </div>
                {/* Quick actions + form */}
                <div className="p-3 space-y-2 shrink-0 bg-neutral-900 shadow-[0_-6px_24px_rgba(0,0,0,0.3)]">
                  <div className="flex gap-1.5">
                    {lastError && (
                      <button
                        type="button"
                        onClick={handleExplainLastError}
                        disabled={explainErrorLoading}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl bg-blue-800 text-blue-200 text-[10px] font-semibold hover:bg-blue-700 disabled:bg-blue-900 disabled:text-blue-400 disabled:cursor-not-allowed transition-colors"
                      >
                        Explain error
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleExplainSelection}
                      disabled={explainCodeLoading}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl bg-blue-700 text-black text-[10px] font-semibold hover:bg-blue-600 disabled:bg-blue-900 disabled:text-blue-400 disabled:cursor-not-allowed transition-colors"
                    >
                      <FaMagic className="text-[8px]" /> Explain code
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {HINT_STYLES.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        className={`rounded-full px-2 py-0.5 text-[9px] font-semibold transition ${
                          hintStyle === s.value
                            ? 'bg-blue-500 text-black'
                            : 'bg-neutral-900 text-blue-300 hover:bg-neutral-800'
                        }`}
                        onClick={() => setHintStyle(s.value)}
                        title={s.description}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <form onSubmit={handleTutorSubmit} className="flex gap-1.5">
                    <textarea
                      className="flex-1 min-h-[36px] max-h-[80px] rounded-lg bg-neutral-900 p-2 text-[11px] text-blue-50 outline-none focus:ring-2 focus:ring-blue-400 resize-none shadow-inner shadow-black"
                      value={tutorQuestion}
                      onChange={(e) => setTutorQuestion(e.target.value)}
                      placeholder="Ask a question about this step…"
                      rows={1}
                    />
                    <button
                      type="submit"
                      disabled={tutorLoading || !tutorQuestion.trim()}
                      className="shrink-0 w-9 h-9 rounded-xl bg-blue-600 text-black flex items-center justify-center shadow-md shadow-black/30 hover:bg-blue-500 disabled:opacity-45 disabled:saturate-50 disabled:cursor-not-allowed transition-all"
                    >
                      <FaChevronRight className="text-xs" />
                    </button>
                  </form>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </motion.div>

      <ConfirmModal
        open={showResetConfirm}
        title="Reset your code?"
        message="This will restore the starter template. Your step progress and points for this session will be cleared. You can continue from the dashboard later."
        onConfirm={confirmReset}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};

export default CodeEditor;
