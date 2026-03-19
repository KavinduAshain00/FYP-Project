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

  // Floating step guide (auto-shows on step change)
  const [showStepGuide, setShowStepGuide] = useState(true);
  const prevStepIndexRef = useRef(null);

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
      if (codeChangeTimerRef.current) clearTimeout(codeChangeTimerRef.current);
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
      if (runFeedbackTidRef.current) clearTimeout(runFeedbackTidRef.current);
      if (runFeedbackClearTidRef.current) clearTimeout(runFeedbackClearTidRef.current);
      if (lastVerifiedStepClearTidRef.current) clearTimeout(lastVerifiedStepClearTidRef.current);
    },
    []
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
    startX: 0,
    startY: 0,
    startLeft: 0,
    startRight: 0,
    startConsole: 0,
  });
  const [tutorQuestion, setTutorQuestion] = useState('');
  const [tutorLoading, setTutorLoading] = useState(false);
  const [hintStyle, setHintStyle] = useState('general');
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

  const addFloatingMessage = useCallback((type, text, points = null) => {
    const id = Date.now() + Math.random();
    setFloatingMessages((prev) => [...prev, { id, type, text, points }]);
    const tid = setTimeout(() => {
      if (isMountedRef.current) setFloatingMessages((prev) => prev.filter((m) => m.id !== id));
    }, 2600);
    return () => clearTimeout(tid);
  }, []);

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
    beginner: 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40',
    intermediate: 'bg-amber-500/20 text-amber-200 border border-amber-400/40',
    advanced: 'bg-rose-500/20 text-rose-200 border border-rose-400/40',
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
        navigate('/dashboard');
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

  // Auto-show floating step guide on step change
  useEffect(() => {
    if (prevStepIndexRef.current !== null && prevStepIndexRef.current !== currentStepIndex) {
      setShowStepGuide(true);
    }
    prevStepIndexRef.current = currentStepIndex;
  }, [currentStepIndex]);

  // Resize handlers for draggable panels
  const handleResizeLeftStart = useCallback(
    (e) => {
      e.preventDefault();
      resizeRef.current = { active: 'left', startX: e.clientX, startLeft: leftPanelWidth };
    },
    [leftPanelWidth]
  );
  const handleResizeRightStart = useCallback(
    (e) => {
      e.preventDefault();
      resizeRef.current = { active: 'right', startX: e.clientX, startRight: rightPanelWidth };
    },
    [rightPanelWidth]
  );
  const handleResizeConsoleStart = useCallback(
    (e) => {
      e.preventDefault();
      resizeRef.current = { active: 'console', startY: e.clientY, startConsole: consoleHeight };
    },
    [consoleHeight]
  );

  useEffect(() => {
    const move = (e) => {
      const { active, startX, startLeft, startRight, startY, startConsole } = resizeRef.current;
      if (active === 'left') {
        const delta = e.clientX - startX;
        setLeftPanelWidth(Math.min(500, Math.max(240, startLeft + delta)));
      } else if (active === 'right') {
        const delta = e.clientX - startX;
        setRightPanelWidth(Math.min(800, Math.max(320, startRight - delta)));
      } else if (active === 'console') {
        const delta = e.clientY - startY;
        setConsoleHeight(Math.min(500, Math.max(80, startConsole - delta)));
      }
    };
    const up = () => {
      resizeRef.current.active = null;
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
    return () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    };
  }, []);

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
    const progressData = {
      totalEdits: codeChanges,
      totalRuns: streak,
      totalPoints: points,
      streak,
      completedModules: 0,
    };
    achievementsAPI
      .checkAchievements(progressData)
      .then((res) => {
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
    setPointFloater({ id: Date.now(), amount });
    const tid = setTimeout(() => {
      if (isMountedRef.current) setPointFloater(null);
    }, 1200);
    return () => clearTimeout(tid);
  }, []);

  // Stable extension arrays so CodeMirror doesn't reconfigure on every render
  const extHtml = useMemo(() => [html()], []);
  const extCss = useMemo(() => [css()], []);
  const extJs = useMemo(() => [javascript()], []);
  const extJsx = useMemo(() => [javascript({ jsx: true })], []);
  const extServer = useMemo(() => [javascript()], []);

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
        setTimeout(() => isMountedRef.current && setPointsJustEarned(false), 600);
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
      console.error('Verify error', err);
      const msg = 'Verification failed. Check the hint and try again.';
      setVerifyFeedback(msg);
      setVerifyPassed(false);
      setStepFailureFeedback((prev) => ({ ...prev, [currentStepIndex]: msg }));
      toast.error('Not quite yet—check the hint and try again.');
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
      setMcqErrorsByQuestion({});
      if (questions.length === 0) {
        setMcqGateForStep(null);
      }
    } catch {
      setMcqQuestions([]);
      setMcqGateForStep(null);
      toast.error("We couldn't load the quiz. You can skip to the next step or try again.");
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
          setTimeout(() => isMountedRef.current && setPointsJustEarned(false), 600);
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
      const explanation = 'Verification failed. Try again.';
      setMcqResult({ correct: false, explanation });
      setMcqErrorsByQuestion((prev) => ({ ...prev, [mcqCurrentIndex]: explanation }));
    } finally {
      setMcqVerifyLoading(false);
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
        '<div style="color:#ff6b6b;padding:20px;font-family:monospace;background:#1a1a2e;border-radius:8px;margin:20px;">' +
        '<h3>Error</h3><pre style="color:#ffa07a;white-space:pre-wrap;">' +
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
          'color:#fc4a1a;padding:20px;font-family:monospace;background:#132f4c;border-radius:8px;margin:20px;';
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
      navigate('/dashboard');
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
      setTimeout(() => isMountedRef.current && setPointsJustEarned(false), 600);
    }
    const runFeedbackTid = setTimeout(() => {
      if (!isMountedRef.current) return;
      if (editedSinceLastRun && hadErrorsBeforeRun && errorCountRef.current === 0) {
        setPoints((p) => p + 10);
        setPointsJustEarned(true);
        setTimeout(() => isMountedRef.current && setPointsJustEarned(false), 600);
        showPointFloater(10);
        addFloatingMessage('success', 'Errors fixed!', 10);
        setShowAllClear(true);
        const clearTid = setTimeout(() => {
          if (isMountedRef.current) setShowAllClear(false);
        }, 2500);
        runFeedbackClearTidRef.current = clearTid;
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
        className="min-h-screen bg-game-void text-slate-100 flex flex-col items-center justify-center gap-4"
        role="status"
        aria-live="polite"
      >
        <div
          className="h-12 w-12 animate-spin rounded-full border-2 border-neon-cyan border-t-transparent"
          aria-hidden
        />
        <p className="text-sm font-medium text-slate-300">
          {loading ? 'Preparing your lesson…' : 'Restoring your progress…'}
        </p>
        <p className="text-xs text-slate-500">
          {loading ? 'Fetching content and steps' : 'Loading your last saved code'}
        </p>
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
    <div className="h-screen overflow-hidden bg-game-void text-slate-100 flex flex-col">
      {/* Lecture Slide Popup – presentation-style */}
      <AnimatePresence>
        {showOverviewPopup && module && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 bg-black/85 z-[100]"
              onClick={() => setShowOverviewPopup(false)}
              aria-hidden
            />
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
              {/* Slide container – 16:9 presentation aspect */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="w-[92vw] max-w-[1200px] h-[88vh] flex flex-col bg-[#0f1419] border border-white/15 shadow-[0_0_80px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.05)] pointer-events-auto overflow-hidden"
              >
                {/* Close button – top right */}
                <button
                  onClick={() => setShowOverviewPopup(false)}
                  className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close"
                >
                  <FaTimes className="text-sm" />
                </button>

                {lectureNotesLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-12">
                    <div className="h-12 w-12 rounded-full border-2 border-neon-cyan/50 border-t-neon-cyan animate-spin" />
                    <p className="text-base font-semibold text-slate-200 mt-6">Generating lecture slides…</p>
                    <p className="text-xs text-slate-500 mt-1">Mistral AI</p>
                  </div>
                ) : lectureNotesError ? (
                  <div className="flex-1 flex flex-col p-8">
                    <div className="flex items-start gap-2 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-4">
                      <FaExclamationTriangle className="text-amber-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-amber-200/90">{lectureNotesError}</p>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">Showing original overview:</p>
                    <div className="text-slate-300 leading-relaxed overflow-y-auto flex-1 [&_.markdown-content]:[&_h2]:text-lg">
                      <MarkdownContent content={module.content} />
                    </div>
                    <button
                      onClick={() => setShowOverviewPopup(false)}
                      className="mt-6 w-full py-3 rounded-lg bg-neon-cyan text-game-void font-bold hover:brightness-110 transition"
                    >
                      Got it
                    </button>
                  </div>
                ) : hasSlides ? (
                  /* ─── SLIDE MODE ─── */
                  <>
                    {/* Full-bleed hero image */}
                    <div className="relative h-[32%] min-h-[140px] shrink-0">
                      <img
                        src={getSlideImage(
                          lectureSlides[lectureSlideIndex],
                          module.title,
                          module.category
                        )}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
                      <div className="absolute bottom-0 left-0 right-0 px-8 py-4">
                        <h2 className="text-xl font-bold text-white drop-shadow-lg">{module.title}</h2>
                        <p className="text-xs text-white/80 mt-0.5">
                          Slide {lectureSlideIndex + 1} of {lectureSlides.length}
                        </p>
                      </div>
                    </div>

                    {/* Slide content body */}
                    <div className="flex-1 min-h-0 overflow-y-auto px-8 py-6 scrollbar-hide flex flex-col">
                      <div className="text-slate-200 [&_.markdown-content_h2]:text-lg [&_.markdown-content_h2]:mb-2 [&_.markdown-content_h3]:text-base [&_.markdown-content_p]:text-[15px] [&_.markdown-content_ul]:space-y-1 [&_.markdown-content_ol]:space-y-1">
                        <MarkdownContent
                          content={lectureSlides[lectureSlideIndex] || lectureSlides[0]}
                          className="[&_ul]:list-disc [&_ol]:list-decimal"
                        />
                      </div>
                      {module.hints?.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-neon-cyan/80 mb-1.5">Hints</p>
                          <ul className="list-disc list-inside text-xs text-slate-400 space-y-0.5">
                            {module.hints.map((h, i) => (
                              <li key={i}>{h}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Slide footer – nav + progress */}
                    <div className="shrink-0 flex items-center justify-between px-8 py-3 bg-black/40 border-t border-white/10">
                      <button
                        onClick={() => setLectureSlideIndex((i) => Math.max(0, i - 1))}
                        disabled={lectureSlideIndex === 0}
                        className="flex items-center gap-1 px-4 py-2 rounded text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
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
                                ? 'w-6 bg-neon-cyan'
                                : 'w-1.5 bg-white/25 hover:bg-white/40'
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
                        className="flex items-center gap-1 px-4 py-2 rounded text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      >
                        Next <FaChevronRight className="text-xs" />
                      </button>
                    </div>

                    {/* Start / Dismiss */}
                    <div className="shrink-0 px-8 pb-4">
                      <button
                        onClick={() => setShowOverviewPopup(false)}
                        className="w-full py-2.5 rounded-lg bg-neon-cyan text-game-void text-sm font-bold hover:brightness-110 transition"
                      >
                        Let's go
                      </button>
                    </div>
                  </>
                ) : (
                  /* ─── SINGLE SLIDE (no multi-slide) ─── */
                  <>
                    <div className="relative h-[28%] min-h-[120px] shrink-0">
                      <img
                        src={getSlideImage(lectureNotes || module.content, module.title, module.category)}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />
                      <div className="absolute bottom-0 left-0 right-0 px-8 py-4">
                        <h2 className="text-xl font-bold text-white drop-shadow-lg">{module.title}</h2>
                        <p className="text-xs text-white/80 mt-0.5">Learning Overview</p>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto px-8 py-6 scrollbar-hide">
                      <div className="text-slate-200 [&_.markdown-content_h2]:text-lg [&_.markdown-content_p]:text-[15px]">
                        {lectureNotes ? (
                          <MarkdownContent content={lectureNotes} />
                        ) : (
                          <MarkdownContent content={module.content} />
                        )}
                      </div>
                      {module.hints?.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-neon-cyan/80 mb-1.5">Hints</p>
                          <ul className="list-disc list-inside text-xs text-slate-400 space-y-0.5">
                            {module.hints.map((h, i) => (
                              <li key={i}>{h}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 px-8 pb-6">
                      <button
                        onClick={() => setShowOverviewPopup(false)}
                        className="w-full py-2.5 rounded-lg bg-neon-cyan text-game-void text-sm font-bold hover:brightness-110 transition"
                      >
                        Let's go
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ─── HEADER ─── */}
      <motion.header
        className="flex items-center justify-between px-4 h-12 border-b border-white/10 bg-game-night/90 backdrop-blur shrink-0 relative z-10"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
      >
        {/* Left: back + title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/dashboard')}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition"
            title="Back to Dashboard"
          >
            <FaArrowLeft className="text-xs" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="shrink-0 w-7 h-7 rounded-md bg-neon-cyan/10 border border-white/10 flex items-center justify-center">
              {isMultiplayerModule ? (
                <FaUsers className="text-neon-purple text-xs" />
              ) : (
                <FaCode className="text-neon-cyan text-xs" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-white truncate leading-tight">
                {module.title}
              </h1>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-semibold uppercase ${difficultyStyles[module.difficulty]} px-1.5 py-0 rounded`}
                >
                  {module.difficulty}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: step progress bar */}
        <div className="hidden md:flex items-center gap-2.5 absolute left-1/2 -translate-x-1/2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
            {verifiedCount}/{steps.length}
          </span>
          <div className="flex items-center gap-0.5">
            {steps.map((_, i) => {
              const justVerified = i === lastVerifiedStepIndex;
              return (
                <motion.div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    steps.length <= 6 ? 'w-8' : 'w-5'
                  } ${
                    stepsVerified[i]
                      ? 'bg-neon-green shadow-glow-green/30'
                      : i === currentStepIndex
                        ? 'bg-neon-cyan animate-pulse'
                        : 'bg-white/10'
                  } ${justVerified ? 'shadow-[0_0_12px_rgba(74,222,128,0.6)]' : ''}`}
                  animate={justVerified ? { scale: [1, 1.25, 1] } : {}}
                  transition={{ duration: 0.4 }}
                />
              );
            })}
          </div>
        </div>

        {/* Right: stats + actions */}
        <div className="flex items-center gap-2">
          {/* Gamification pills */}
          <div className="hidden sm:flex items-center gap-1.5">
            <motion.span
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-neon-gold/10 border border-neon-gold/20 text-neon-gold text-[11px] font-bold"
              animate={pointsJustEarned ? { scale: [1, 1.12, 1] } : {}}
              transition={{ duration: 0.35 }}
            >
              <FaStar className="text-[9px]" /> {points}
            </motion.span>
            <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-neon-pink/10 border border-neon-pink/20 text-neon-pink text-[11px] font-bold">
              <FaFire className="text-[9px]" /> {streak}
            </span>
            <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-[11px] font-bold">
              <FaCode className="text-[9px]" /> {codeChanges}
            </span>
          </div>

          {/* Point floater */}
          <AnimatePresence>
            {pointFloater && (
              <motion.span
                key={pointFloater.id}
                initial={{ opacity: 1, y: 0, scale: 1.1 }}
                animate={{ opacity: 0, y: -48, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="absolute right-48 top-1 flex items-center gap-1 text-neon-gold font-bold text-sm pointer-events-none drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]"
              >
                <FaStar className="text-[10px]" /> +{pointFloater.amount}
              </motion.span>
            )}
          </AnimatePresence>

          {/* Action buttons */}
          <div className="flex items-center rounded-lg border border-white/10 overflow-hidden">
            <button
              onClick={handleRunCode}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 transition border-r border-white/10"
            >
              <FaPlay className="text-[9px]" /> Run
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition"
            >
              <FaUndo className="text-[9px]" />
            </button>
          </div>
          <button
            onClick={() => setShowTutorSidebar(!showTutorSidebar)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              showTutorSidebar
                ? 'bg-violet-500/25 text-violet-300 border border-violet-400/40 shadow-glow-purple/20'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/10'
            }`}
          >
            <FaMagic className="text-[9px]" /> AI
          </button>
          <button
            onClick={handleCompleteModule}
            disabled={!allStepsVerified}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-neon-gold text-game-void text-xs font-bold hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
          >
            <FaCheck className="text-[9px]" /> Complete
          </button>
        </div>
      </motion.header>

      {/* Floating gamified messages (errors fixed, etc.) */}
      <div className="fixed left-1/2 -translate-x-1/2 top-20 z-[100] flex flex-col items-center gap-2 pointer-events-none">
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
                  ? 'bg-emerald-500/95 text-white border-2 border-emerald-300/50 shadow-emerald-500/30'
                  : m.type === 'error'
                    ? 'bg-red-500/95 text-white border-2 border-red-300/50'
                    : 'bg-neon-cyan/95 text-game-void border-2 border-neon-cyan/50'
              }`}
            >
              {m.type === 'success' && <FaCheckCircle className="text-base shrink-0" />}
              {m.type === 'error' && <FaExclamationTriangle className="text-base shrink-0" />}
              <span>{m.text}</span>
              {m.points != null && (
                <span className="shrink-0 flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-xs">
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
          className="flex flex-col shrink-0 min-h-0 border-r border-white/10 bg-game-night/60"
          style={{ width: leftPanelWidth }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
        >
          {/* Lesson overview (collapsible) – clear, readable block */}
          <motion.div
            className="border-b border-white/10 shrink-0 bg-game-abyss/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
          >
            <button
              onClick={() => setShowOverview(!showOverview)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-white/5 transition"
            >
              <span className="flex items-center gap-2">
                <FaBookOpen className="text-neon-cyan" /> Lesson Overview
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
                  <div className="px-4 pb-4 max-h-[400px] overflow-y-auto scrollbar-hide">
                    <button
                      onClick={() => {
                        setLectureSlideIndex(0);
                        setShowOverviewPopup(true);
                      }}
                      className="w-full mb-3 flex items-center justify-center gap-2 py-2 rounded-lg bg-neon-cyan/15 border border-neon-cyan/30 text-neon-cyan text-xs font-semibold hover:bg-neon-cyan/25 transition"
                    >
                      <FaBookOpen className="text-xs" /> Open Lecture
                    </button>
                    <div className="text-sm text-slate-200 leading-relaxed tracking-tight">
                      <MarkdownContent content={module.content} />
                    </div>
                    {module.hints?.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-white/10">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                          Hints
                        </p>
                        <ul className="list-disc pl-4 space-y-1.5 text-sm text-slate-300">
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
            <div className="px-4 py-3">
              <motion.h3
                className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-3"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                Steps
              </motion.h3>
              <div className="space-y-1">
                {steps.map((step, i) => {
                  const verified = stepsVerified[i];
                  const isCurrent = i === currentStepIndex;
                  const justVerified = i === lastVerifiedStepIndex;
                  const locked = i > currentStepIndex && !verified;
                  const failedFeedback = stepFailureFeedback[i];
                  return (
                    <motion.div
                      key={step.id}
                      className={`flex gap-2.5 items-start rounded-md transition-colors duration-300 ${justVerified ? 'bg-neon-green/15' : ''}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.12 + i * 0.04 }}
                    >
                      {/* Vertical line + circle */}
                      <div className="flex flex-col items-center shrink-0 pt-0.5">
                        <motion.div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-colors ${
                            verified
                              ? 'border-neon-green bg-neon-green/20 text-neon-green'
                              : isCurrent
                                ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan shadow-glow-cyan/20'
                                : failedFeedback
                                  ? 'border-red-400 bg-red-500/10 text-red-400'
                                  : 'border-white/20 bg-white/5 text-slate-500'
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
                            className={`w-0.5 h-4 mt-1 rounded-full ${verified ? 'bg-neon-green/40' : 'bg-white/10'}`}
                          />
                        )}
                      </div>
                      {/* Step content */}
                      <button
                        onClick={() => !locked && goToStep(i)}
                        disabled={locked}
                        className={`flex-1 text-left pb-2 min-w-0 transition ${
                          locked ? 'cursor-not-allowed opacity-40' : 'hover:opacity-80'
                        }`}
                      >
                        <p
                          className={`text-xs font-medium leading-tight truncate ${
                            isCurrent
                              ? 'text-neon-cyan'
                              : verified
                                ? 'text-neon-green'
                                : failedFeedback
                                  ? 'text-red-300'
                                  : 'text-slate-300'
                          } ${failedFeedback && !isCurrent ? 'line-through' : ''}`}
                        >
                          {step.title}
                        </p>
                        {failedFeedback && (
                          <p className="text-[10px] text-red-300/80 mt-0.5 line-clamp-2">
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
                className="w-full flex items-center justify-between py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
              >
                <span className="flex items-center gap-2">
                  <FaTrophy className="text-neon-gold/70" />
                  Achievements
                  <span className="text-[10px] font-bold text-neon-gold/80">
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
                          className={`rounded-lg border p-2 flex flex-col items-center text-center gap-1 transition ${
                            ach.earned
                              ? 'border-neon-gold/30 bg-neon-gold/5'
                              : 'border-white/10 bg-white/[0.02] opacity-50'
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${ach.earned ? 'bg-neon-gold/15' : 'bg-white/5'}`}
                          >
                            {ach.earned ? (
                              renderAchievementIcon(ach.icon, ach.name, 'w-4 h-4 text-neon-gold')
                            ) : (
                              <FaLock className="text-[10px] text-slate-500" />
                            )}
                          </div>
                          <p
                            className={`text-[10px] font-semibold leading-tight line-clamp-2 ${ach.earned ? 'text-slate-200' : 'text-slate-500'}`}
                          >
                            {ach.name}
                          </p>
                          {ach.earned && ach.points && (
                            <span className="text-[9px] text-neon-gold/70">+{ach.points} pts</span>
                          )}
                        </motion.div>
                      ))}
                      {achievements.length === 0 && (
                        <p className="col-span-2 text-[11px] text-slate-500 italic py-2">
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
          <div className="border-t border-white/10 bg-game-night/80 px-4 py-3 shrink-0 space-y-2 min-h-0">
            <AnimatePresence mode="wait">
              {mcqGateForStep !== null ? (
                <motion.div
                  key="mcq-bottom"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                  className="rounded-xl border-2 border-amber-400/30 bg-amber-500/10 p-3 space-y-2"
                >
                  <h4 className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                    <FaBolt className="text-amber-400" /> Concept Check
                  </h4>
                  {mcqLoading ? (
                    <div
                      className="flex items-center gap-2 text-[11px] text-slate-400"
                      role="status"
                      aria-label="Preparing quiz"
                    >
                      <div
                        className="h-3 w-3 rounded-full border-2 border-amber-400 border-t-transparent animate-spin"
                        aria-hidden
                      />
                      Preparing your quiz…
                    </div>
                  ) : mcqQuestions.length > 0 ? (
                    <>
                      <p className="text-[11px] text-slate-200 leading-relaxed">
                        <span className="text-amber-300 font-semibold">
                          Q{mcqCurrentIndex + 1}/{mcqQuestions.length}:
                        </span>{' '}
                        {mcqQuestions[mcqCurrentIndex]?.question}
                      </p>
                      {mcqErrorsByQuestion[mcqCurrentIndex] && (
                        <div className="rounded-lg border border-red-400/30 bg-red-500/10 text-red-200 p-2 text-[11px]">
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
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] border transition ${
                              mcqSelectedIndex === idx
                                ? 'border-amber-400 bg-amber-500/20 text-amber-100'
                                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
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
                            className={`overflow-hidden rounded-lg p-2 text-[11px] ${mcqResult.correct ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/30' : 'bg-red-500/15 text-red-200 border border-red-400/30'}`}
                          >
                            {mcqResult.explanation}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleMCQSubmit}
                          disabled={mcqVerifyLoading || mcqSelectedIndex == null}
                          className="flex-1 py-1.5 rounded-lg bg-amber-500 text-game-void text-xs font-bold hover:bg-amber-400 disabled:opacity-50 transition"
                        >
                          {mcqVerifyLoading ? 'Checking your answer…' : 'Check answer'}
                        </button>
                        {mcqPassedCount === mcqQuestions.length && mcqQuestions.length > 0 && (
                          <button
                            type="button"
                            onClick={handleMCQNextStep}
                            className="flex-1 py-1.5 rounded-lg bg-neon-green text-game-void text-xs font-bold hover:brightness-110 transition flex items-center justify-center gap-1"
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
                      className="w-full py-1.5 rounded-lg bg-white/10 text-slate-300 text-xs hover:bg-white/15 transition"
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
                  <div className="rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 p-3">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-neon-cyan/80 mb-1 font-bold">
                      Step {currentStepIndex + 1} of {steps.length}
                    </p>
                    {currentStep?.title && (
                      <p className="text-xs font-semibold text-white mb-1">{currentStep.title}</p>
                    )}
                    <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-3">
                      {currentStep?.instruction ?? currentStep?.title ?? 'Complete this step.'}
                    </p>
                    {currentStep?.concept && (
                      <p className="text-[10px] text-neon-cyan/70 mt-1.5 italic border-l-2 border-neon-cyan/30 pl-2 line-clamp-2">
                        {currentStep.concept}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    disabled={verifyLoading}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-neon-cyan text-game-void text-xs font-bold hover:brightness-110 disabled:opacity-50 transition shadow-sm"
                  >
                    {verifyLoading ? (
                      <>
                        <div
                          className="h-3 w-3 rounded-full border-2 border-game-void border-t-transparent animate-spin"
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
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-neon-green text-game-void text-xs font-bold hover:brightness-110 transition"
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
                            ? 'bg-neon-green/10 text-emerald-200 border border-neon-green/20'
                            : 'bg-amber-500/10 text-amber-200 border border-amber-400/20'
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

        {/* Left panel resize handle */}
        <div
          role="separator"
          aria-orientation="vertical"
          onMouseDown={handleResizeLeftStart}
          className="w-1 flex-shrink-0 cursor-col-resize hover:bg-neon-cyan/20 active:bg-neon-cyan/30 transition-colors group"
          title="Drag to resize"
        >
          <div className="w-0.5 h-full mx-auto bg-white/10 group-hover:bg-neon-cyan/50 transition-colors" />
        </div>

        {/* ─── CENTER: CODE EDITOR ─── */}
        <motion.div
          className="flex-1 flex flex-col min-w-0 min-h-0 border-r border-white/10"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300, delay: 0.06 }}
        >
          {/* File tabs */}
          <motion.div
            className="flex items-center border-b border-white/10 bg-game-night/50 shrink-0"
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
                className={`px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition border-b-2 ${
                  activeTab === tab
                    ? 'border-neon-cyan text-neon-cyan bg-neon-cyan/5'
                    : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'jsx' && <FaReact className="text-cyan-400 text-xs" />}
                {tab === 'server' && <FaServer className="text-amber-400 text-xs" />}
                {tab === 'server' ? 'SERVER.JS' : tab.toUpperCase()}
              </motion.button>
            ))}
            {isReactModule && (
              <span className="ml-auto mr-3 flex items-center gap-1 text-[10px] text-cyan-400/60">
                <FaReact /> React
              </span>
            )}
            {isMultiplayerModule && (
              <span className="ml-auto mr-3 flex items-center gap-1 text-[10px] text-purple-400/60">
                <FaUsers /> Multiplayer
              </span>
            )}
          </motion.div>
          {/* Editor + floating step guide */}
          <motion.div
            className="flex-1 overflow-hidden bg-game-void relative"
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
                  className="absolute bottom-2 left-2 right-2 z-30 rounded-xl border border-neon-cyan/25 bg-game-night/95 backdrop-blur-lg shadow-xl shadow-neon-cyan/5 overflow-hidden"
                >
                  <div className="flex items-start gap-3 p-3">
                    <div className="shrink-0 mt-0.5 w-7 h-7 rounded-lg bg-neon-cyan/15 flex items-center justify-center">
                      <FaLightbulb className="text-neon-cyan text-xs" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="rounded-full bg-neon-cyan/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-neon-cyan">
                          Step {currentStepIndex + 1}/{steps.length}
                        </span>
                        <span className="text-xs font-semibold text-white truncate">
                          {currentStep.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed mb-1.5">
                        {currentStep.instruction || currentStep.title}
                      </p>
                      {currentStep.concept && (
                        <p className="text-[10px] text-neon-cyan/70 italic border-l-2 border-neon-cyan/30 pl-2">
                          {currentStep.concept}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setShowStepGuide(false)}
                      className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition"
                    >
                      <FaTimes className="text-[9px]" />
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
                className="absolute bottom-2 right-2 z-30 flex items-center gap-1.5 rounded-lg border border-neon-cyan/20 bg-game-night/80 backdrop-blur px-2.5 py-1.5 text-[10px] font-semibold text-neon-cyan/80 hover:text-neon-cyan hover:bg-game-night/95 transition shadow-sm"
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

          {/* Code errors panel — shows runtime/console errors below the editor; "All clear!" when fixed */}
          <AnimatePresence mode="wait">
            {showAllClear ? (
              <motion.div
                key="all-clear"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ type: 'spring', damping: 20 }}
                className="shrink-0 border-t border-emerald-400/30 bg-emerald-950/50 px-3 py-3 flex items-center gap-3"
              >
                <span className="w-8 h-8 rounded-full bg-emerald-500/30 flex items-center justify-center shrink-0">
                  <FaCheckCircle className="text-emerald-400 text-sm" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-emerald-200">All clear!</p>
                  <p className="text-[10px] text-emerald-300/80">
                    No errors in this run. Keep going!
                  </p>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                  +10
                </span>
              </motion.div>
            ) : recentErrors.length > 0 ? (
              <div className="shrink-0 border-t border-red-400/20 bg-red-950/40">
                <div className="flex items-center justify-between px-3 py-2 border-b border-red-400/10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-300 flex items-center gap-1.5">
                    <FaExclamationTriangle className="text-red-400" /> Errors ({recentErrors.length}
                    )
                  </span>
                  <button
                    type="button"
                    onClick={clearConsole}
                    className="text-[9px] font-semibold text-red-300/80 hover:text-red-200 transition"
                  >
                    Clear
                  </button>
                </div>
                <ul className="max-h-24 overflow-y-auto scrollbar-hide px-3 py-2 space-y-1.5">
                  {recentErrors.map((msg, i) => (
                    <li
                      key={`editor-err-${i}`}
                      className="flex items-start gap-2 text-[11px] rounded-lg border border-red-400/20 bg-red-500/10 px-2 py-1.5"
                    >
                      <span className="shrink-0 w-5 h-5 rounded bg-red-500/40 text-red-100 flex items-center justify-center text-[10px] font-bold">
                        !
                      </span>
                      <span className="text-red-200/95 break-words flex-1 min-w-0 font-medium">
                        {msg}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleExplainErrorClick(msg)}
                        disabled={explainErrorLoading}
                        className="shrink-0 rounded-md px-2 py-0.5 text-[9px] font-bold bg-red-500/40 text-red-100 hover:bg-red-500/60 disabled:opacity-50 transition border border-red-400/30"
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

        {/* Right panel resize handle */}
        <div
          role="separator"
          aria-orientation="vertical"
          onMouseDown={handleResizeRightStart}
          className="w-1 flex-shrink-0 cursor-col-resize hover:bg-neon-cyan/20 active:bg-neon-cyan/30 transition-colors group"
          title="Drag to resize"
        >
          <div className="w-0.5 h-full mx-auto bg-white/10 group-hover:bg-neon-cyan/50 transition-colors" />
        </div>

        {/* ─── RIGHT: PREVIEW + CONSOLE (resizable) ─── */}
        <motion.div
          className="flex flex-col bg-game-abyss shrink-0 min-h-0"
          style={{ width: rightPanelWidth }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300, delay: 0.1 }}
        >
          {isMultiplayerModule ? (
            <>
              {/* Multiplayer preview tabs */}
              <motion.div
                className="flex border-b border-white/10 bg-game-night/50 shrink-0"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
              >
                {[
                  { key: 'server', label: 'Server', color: 'amber' },
                  { key: 'player1', label: 'Client 1', color: 'red', icon: FaUser },
                  { key: 'player2', label: 'Client 2', color: 'cyan', icon: FaUser },
                ].map(({ key, label, color, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActivePreviewTab(key)}
                    className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 text-[10px] font-semibold transition border-b-2 ${
                      activePreviewTab === key
                        ? `border-${color}-400 text-${color}-400 bg-${color}-500/10`
                        : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {Icon && <Icon className="text-[8px]" />} {label}
                  </button>
                ))}
              </motion.div>
              <div className="flex-1 flex flex-col bg-gray-900 overflow-hidden min-h-0 relative">
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
                  <div className="px-2 py-1 bg-red-500/10 text-red-500 text-[10px] font-bold text-center shrink-0">
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
                  <div className="px-2 py-1 bg-cyan-500/10 text-cyan-500 text-[10px] font-bold text-center shrink-0">
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
                className="flex items-center justify-between border-b border-white/10 bg-game-night/50 px-3 py-2 shrink-0"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
              >
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FaPlay className="text-[8px] text-neon-green" /> Preview
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-neon-green/60 font-medium">Auto-refresh</span>
                  <button
                    onClick={openLivePreviewInNewTab}
                    className="text-slate-500 hover:text-white text-[10px] transition"
                    title="Open in new tab"
                  >
                    <FaExternalLinkAlt />
                  </button>
                </div>
              </motion.div>
              <iframe
                key={previewKey}
                className="flex-1 border-0 bg-gray-900 w-full min-h-0"
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
              onMouseDown={handleResizeConsoleStart}
              className="h-1.5 shrink-0 cursor-row-resize hover:bg-neon-cyan/20 active:bg-neon-cyan/30 transition-colors flex items-center justify-center border-t border-white/10 group"
              title="Drag to resize console"
            >
              <div className="w-12 h-0.5 rounded-full bg-white/10 group-hover:bg-neon-cyan/50 transition-colors" />
            </div>
          )}
          {/* Console (resizable height when open); separate Server / Clients for multiplayer */}
          <div
            className="border-t border-white/10 bg-game-void flex flex-col shrink-0"
            style={{ height: consoleOpen ? consoleHeight : 32 }}
          >
            <button
              onClick={() => setConsoleOpen(!consoleOpen)}
              className="flex items-center justify-between w-full px-3 py-1.5 text-[11px] font-bold text-slate-400 hover:bg-white/5 transition shrink-0"
            >
              <span className="flex items-center gap-2">
                Console
                {consoleLogs.length > 0 && (
                  <span className="rounded-full bg-white/10 px-1.5 py-0 text-[9px] font-semibold text-slate-300">
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
                    className="text-[10px] text-slate-500 hover:text-slate-300 cursor-pointer"
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
                  <div className="flex-1 flex flex-col min-w-0 border-r border-white/10">
                    <div className="flex items-center justify-between px-2 py-1 bg-amber-500/10 border-b border-amber-500/20 shrink-0">
                      <span className="text-[10px] font-bold text-amber-400">Server</span>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          clearServerConsole();
                        }}
                        className="text-[10px] text-slate-500 hover:text-amber-300 cursor-pointer"
                      >
                        Clear
                      </span>
                    </div>
                    <div className="overflow-y-auto scrollbar-hide flex-1 min-h-0 px-2 py-1 font-mono text-[11px] space-y-0.5">
                      {serverLogs.length === 0 ? (
                        <p className="text-slate-600 italic text-[10px] px-1">
                          No server output yet.
                        </p>
                      ) : (
                        serverLogs.map((entry, i) => (
                          <div
                            key={`s-${entry.timestamp}-${i}`}
                            className={`flex gap-1.5 py-0.5 px-1.5 rounded ${
                              entry.level === 'error'
                                ? 'text-red-400 bg-red-500/10'
                                : entry.level === 'warn'
                                  ? 'text-amber-400 bg-amber-500/10'
                                  : entry.level === 'info'
                                    ? 'text-cyan-400 bg-cyan-500/10'
                                    : 'text-slate-400 bg-white/[0.03]'
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
                    <div className="flex items-center justify-between px-2 py-1 bg-slate-500/10 border-b border-white/10 shrink-0">
                      <span className="text-[10px] font-bold text-slate-300">Clients</span>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          clearClientConsole();
                        }}
                        className="text-[10px] text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        Clear
                      </span>
                    </div>
                    <div className="overflow-y-auto scrollbar-hide flex-1 min-h-0 px-2 py-1 font-mono text-[11px] space-y-0.5">
                      {clientLogs.length === 0 ? (
                        <p className="text-slate-600 italic text-[10px] px-1">
                          No client output yet.
                        </p>
                      ) : (
                        clientLogs.map((entry, i) => (
                          <div
                            key={`c-${entry.timestamp}-${i}`}
                            className={`flex gap-1.5 py-0.5 px-1.5 rounded ${
                              entry.level === 'error'
                                ? 'text-red-400 bg-red-500/10'
                                : entry.level === 'warn'
                                  ? 'text-amber-400 bg-amber-500/10'
                                  : entry.level === 'info'
                                    ? 'text-cyan-400 bg-cyan-500/10'
                                    : 'text-slate-400 bg-white/[0.03]'
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
                    <p className="text-slate-600 italic text-[10px] px-1">No console output yet.</p>
                  ) : (
                    consoleLogs.map((entry, i) => (
                      <div
                        key={`${entry.timestamp}-${i}`}
                        className={`flex gap-1.5 py-0.5 px-1.5 rounded ${
                          entry.level === 'error'
                            ? 'text-red-400 bg-red-500/10'
                            : entry.level === 'warn'
                              ? 'text-amber-400 bg-amber-500/10'
                              : entry.level === 'info'
                                ? 'text-cyan-400 bg-cyan-500/10'
                                : 'text-slate-400 bg-white/[0.03]'
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
              className="fixed top-12 right-0 bottom-0 w-80 max-w-[90vw] z-50 flex flex-col border-l border-violet-500/20 bg-game-night/95 backdrop-blur-xl shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 shrink-0">
                <h2 className="text-xs font-bold text-white flex items-center gap-2">
                  <FaMagic className="text-violet-400" /> AI Companion
                </h2>
                <button
                  onClick={() => setShowTutorSidebar(false)}
                  className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition"
                >
                  <FaTimes className="text-[10px]" />
                </button>
              </div>
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                {/* Recent errors — gamified highlight */}
                {recentErrors.length > 0 && (
                  <div className="mx-3 mt-2 p-2.5 rounded-xl border-2 border-red-400/30 bg-red-500/15 shrink-0 shadow-lg shadow-red-500/5">
                    <p className="text-[9px] uppercase tracking-wider text-red-300 font-bold mb-1.5 flex items-center gap-1.5">
                      <FaExclamationTriangle className="text-red-400" /> Errors
                    </p>
                    <ul className="space-y-1.5">
                      {recentErrors.slice(-3).map((msg, i) => (
                        <li
                          key={`err-${i}`}
                          className="flex items-start gap-1.5 rounded-lg border border-red-400/20 bg-red-500/10 px-2 py-1.5"
                        >
                          <span className="text-[10px] text-red-200 break-words flex-1 min-w-0 line-clamp-2 font-medium">
                            {msg}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleExplainErrorClick(msg)}
                            disabled={explainErrorLoading}
                            className="shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold bg-red-500/40 text-red-100 hover:bg-red-500/60 disabled:opacity-50 transition border border-red-400/30"
                          >
                            Explain
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* Message thread — highlighted code vs error explanations */}
                <div className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-2">
                  {companionMessages.length === 0 &&
                    !explainCodeLoading &&
                    !tutorLoading &&
                    !explainErrorLoading && (
                      <p className="text-[11px] text-slate-500 italic leading-relaxed">
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
                        className={`rounded-xl overflow-hidden border-2 ${
                          isErrorExplanation
                            ? 'border-red-400/40 bg-red-950/40 shadow-lg shadow-red-500/5'
                            : isCodeExplanation
                              ? 'border-violet-400/30 bg-violet-950/30 shadow-lg shadow-violet-500/5'
                              : 'border-white/10 bg-game-void/60'
                        }`}
                      >
                        <div
                          className={`px-3 py-1.5 border-b flex items-center justify-between gap-2 ${
                            isErrorExplanation
                              ? 'border-red-400/20 text-red-200'
                              : isCodeExplanation
                                ? 'border-violet-400/20 text-violet-200'
                                : 'border-white/[0.06] text-slate-500'
                          } text-[10px] font-semibold`}
                        >
                          <span className="flex items-center gap-1.5">
                            {isErrorExplanation && (
                              <FaExclamationTriangle className="text-red-400 shrink-0" />
                            )}
                            {isCodeExplanation && <FaMagic className="text-violet-400 shrink-0" />}
                            {isErrorExplanation
                              ? 'Error explanation'
                              : isCodeExplanation
                                ? 'Code explanation'
                                : 'You'}
                            {msg.type === 'hint' && msg.userLabel !== 'Step help' && (
                              <span
                                className="text-slate-600 truncate max-w-[80px]"
                                title={msg.userLabel}
                              >
                                : {msg.userLabel}
                              </span>
                            )}
                          </span>
                          <span className="shrink-0 opacity-70">{msg.timestamp}</span>
                        </div>
                        <div className="p-3 text-xs leading-relaxed text-slate-200">
                          <MarkdownContent content={msg.content} />
                        </div>
                        {msg.confidence != null && msg.type === 'hint' && (
                          <div className="px-3 pb-2">
                            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] text-slate-500">
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
                      className="rounded-xl border border-violet-400/20 bg-violet-500/10 p-3 flex items-center gap-2 text-violet-200"
                      role="status"
                    >
                      <div
                        className="h-3.5 w-3.5 rounded-full border-2 border-violet-400 border-t-transparent animate-spin"
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
                <div className="border-t border-white/10 p-3 space-y-2 shrink-0 bg-game-night/60">
                  <div className="flex gap-1.5">
                    {lastError && (
                      <button
                        type="button"
                        onClick={handleExplainLastError}
                        disabled={explainErrorLoading}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border border-red-400/30 bg-red-500/15 text-red-200 text-[10px] font-semibold hover:bg-red-500/25 disabled:opacity-50 transition"
                      >
                        Explain error
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleExplainSelection}
                      disabled={explainCodeLoading}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border border-violet-400/30 bg-violet-500/15 text-violet-200 text-[10px] font-semibold hover:bg-violet-500/25 disabled:opacity-50 transition"
                    >
                      <FaMagic className="text-[8px]" /> Explain code
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {HINT_STYLES.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold transition ${
                          hintStyle === s.value
                            ? 'border-violet-400/40 bg-violet-500/15 text-violet-200'
                            : 'border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/5'
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
                      className="flex-1 min-h-[36px] max-h-[80px] rounded-lg border border-white/10 bg-game-void/70 p-2 text-[11px] text-slate-100 outline-none focus:ring-1 focus:ring-violet-400/40 resize-none"
                      value={tutorQuestion}
                      onChange={(e) => setTutorQuestion(e.target.value)}
                      placeholder="Ask a question about this step…"
                      rows={1}
                    />
                    <button
                      type="submit"
                      disabled={tutorLoading || !tutorQuestion.trim()}
                      className="shrink-0 w-9 h-9 rounded-lg bg-violet-500/80 text-white flex items-center justify-center hover:bg-violet-400 disabled:opacity-40 transition"
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
