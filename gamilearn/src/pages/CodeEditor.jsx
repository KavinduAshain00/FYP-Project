import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";
import {
  modulesAPI,
  userAPI,
  tutorAPI,
  achievementsAPI,
  invalidateUserCaches,
} from "../api/api";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import {
  FaBookOpen,
  FaUndo,
  FaCheck,
  FaStar,
  FaCode,
  FaBolt,
  FaUsers,
  FaChevronRight,
  FaChevronDown,
  FaChevronUp,
  FaTimes,
  FaMagic,
  FaArrowLeft,
  FaFire,
  FaLightbulb,
  FaExclamationTriangle,
  FaCheckCircle,
} from "react-icons/fa";
import { toast } from "react-toastify";
import ConfirmModal from "../components/ui/ConfirmModal";
import ModuleCompleteResultsModal from "../components/ui/ModuleCompleteResultsModal";
import LoadingScreen from "../components/ui/LoadingScreen";
import MarkdownContent from "../components/ui/MarkdownContent";
import {
  clearEditorDraft,
  loadEditorDraft,
  saveEditorDraft,
} from "../utils/draftStorage";
import { toModuleId } from "../utils/ids";
import { getModuleImageUrl } from "../utils/moduleImageUrl";
import {
  buildServerPreviewHtml,
  buildClientPreviewHtml,
} from "../utils/multiplayerRuntime";
import { buildSinglePlayerPreviewHtml } from "../utils/singlePlayerPreviewHtml";
import CodeEditorFileTabs from "./codeEditor/CodeEditorFileTabs";
import CodeEditorMirrors from "./codeEditor/CodeEditorMirrors";
import CodeEditorMultiplayerPreviewPanel from "./codeEditor/CodeEditorMultiplayerPreviewPanel";
import CodeEditorSinglePlayerPreviewPanel from "./codeEditor/CodeEditorSinglePlayerPreviewPanel";
import CodeEditorConsoleBody from "./codeEditor/CodeEditorConsoleBody";
import LectureOverviewPopup from "./codeEditor/LectureOverviewPopup";
import CodeEditorTutorSidebar from "./codeEditor/CodeEditorTutorSidebar";
import { useLectureOverview } from "./codeEditor/functions/useLectureOverview";
import {
  buildTutorAskOptions,
  sanitizeTutorAnswer,
} from "./codeEditor/functions/tutorAskPayload";

// Module type configurations (multiplayer: server + HTML/CSS/JS clients)
const MODULE_TYPES = {
  "javascript-basics": { tabs: ["html", "css", "js"], defaultTab: "html" },
  "game-development": { tabs: ["html", "css", "js"], defaultTab: "js" },
  "multiplayer": { tabs: ["server", "html", "css", "js"], defaultTab: "server" },
  "advanced-concepts": { tabs: ["html", "css", "js"], defaultTab: "js" },
  "react-basics": { tabs: ["html", "css", "js"], defaultTab: "html" },
};

const CodeEditor = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();

  const [module, setModule] = useState(null);
  const [activeTab, setActiveTab] = useState("html");
  const [loading, setLoading] = useState(true);
  const [previewKey, setPreviewKey] = useState(0);
  /** When false, debounced editor changes do not reload preview; use Refresh in preview bar */
  const [previewAutoRefresh, setPreviewAutoRefresh] = useState(true);
  const [editorKey, setEditorKey] = useState(0); // Force editor remount when needed
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);

  // Step-by-step: driven only by module.steps (define steps in the module editor)
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
    return [
      {
        id: 0,
        title: "Complete the lesson",
        instruction: "Complete the lesson",
        concept: "",
        verified: false,
      },
    ];
  }, [module]);
  const [stepsVerified, setStepsVerified] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyFeedback, setVerifyFeedback] = useState(null);
  const [verifyPassed, setVerifyPassed] = useState(false);
  /** When user fails a step: show step crossed and this explanation (key = step index) */
  const [stepFailureFeedback, setStepFailureFeedback] = useState({});

  /** Step guide: primary place for step list + verify actions (sidebar rail removed) */
  const [showStepGuide, setShowStepGuide] = useState(true);

  // MCQ between steps (1-2 questions, generated/verified by qwen3-coder)
  const [mcqGateForStep, setMcqGateForStep] = useState(null);
  const [mcqQuestions, setMcqQuestions] = useState([]);
  const [mcqCurrentIndex, setMcqCurrentIndex] = useState(0);
  const [mcqSelectedIndex, setMcqSelectedIndex] = useState(null);
  const [mcqLoading, setMcqLoading] = useState(false);
  const [mcqVerifyLoading, setMcqVerifyLoading] = useState(false);
  const [mcqResult, setMcqResult] = useState(null);

  // Refs for live code (avoids re-render on every keystroke; state only on load/draft/reset)
  const codeRefs = useRef({
    html: "",
    css: "",
    js: "",
    server: "",
  });
  // Stable timer refs (avoid window globals that leak across hot-reloads)
  const codeChangeTimerRef = useRef(null);
  const previewTimerRef = useRef(null);
  const previewAutoRefreshRef = useRef(true);
  const applyLivePreviewRefreshRef = useRef(() => {});
  const isLoadingDraftRef = useRef(false);
  const isMountedRef = useRef(true);
  /** Cleared on unmount — avoids orphaned timers after leaving the editor */
  const trackedTimeoutsRef = useRef(new Set());
  const pointFloaterTidRef = useRef(null);
  /** Incremented when moduleId changes (cleanup) or on unmount — drop stale async MCQ/verify results */
  const asyncUiGenRef = useRef(0);
  const saveInProgressRef = useRef(false);
  const moduleIdRef = useRef(moduleId);
  moduleIdRef.current = moduleId;
  const stepsVerifiedRef = useRef(stepsVerified);
  const currentStepIndexRef = useRef(currentStepIndex);
  const runFeedbackTidRef = useRef(null);
  const runFeedbackClearTidRef = useRef(null);
  /** Tracks codeChanges for live preview refresh gamification */
  const codeChangesRef = useRef(0);
  /** codeChanges snapshot at last preview refresh — points only when user edited since last refresh */
  const lastRunCodeChangeCountRef = useRef(0);
  useEffect(() => {
    isLoadingDraftRef.current = isLoadingDraft;
  }, [isLoadingDraft]);
  useEffect(() => {
    stepsVerifiedRef.current = stepsVerified;
    currentStepIndexRef.current = currentStepIndex;
  }, [stepsVerified, currentStepIndex]);

  useEffect(() => {
    previewAutoRefreshRef.current = previewAutoRefresh;
  }, [previewAutoRefresh]);

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

  useEffect(() => {
    setShowStepGuide(true);
  }, [currentStepIndex]);

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
      if (lastVerifiedStepClearTidRef.current)
        clearTimeout(lastVerifiedStepClearTidRef.current);
    },
    [clearTrackedTimeout],
  );

  // Explain selection (highlight code → ask for explanation)
  const editorViewRef = useRef(null);
  const [explainCodeLoading, setExplainCodeLoading] = useState(false);
  const [explainErrorLoading, setExplainErrorLoading] = useState(false);

  // Session-only score in the editor (not your account XP; the server adds XP on module complete + achievements).
  const [points, setPoints] = useState(0);
  const [codeChanges, setCodeChanges] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [moduleCompleteModal, setModuleCompleteModal] = useState(null);

  useEffect(() => {
    codeChangesRef.current = codeChanges;
  }, [codeChanges]);

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
  const [showTutorSidebar, setShowTutorSidebar] = useState(false);

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
  const [tutorQuestion, setTutorQuestion] = useState("");
  const [tutorLoading, setTutorLoading] = useState(false);
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
  const [activePreviewTab, setActivePreviewTab] = useState("server");
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
        .filter((e) => e.level === "error")
        .slice(-5)
        .map((e) => e.message),
    [consoleLogs],
  );
  const lastError =
    recentErrors.length > 0 ? recentErrors[recentErrors.length - 1] : null;

  useEffect(() => {
    errorCountRef.current = consoleLogs.filter(
      (e) => e.level === "error",
    ).length;
  }, [consoleLogs]);

  const addFloatingMessage = useCallback(
    (type, text, points = null) => {
      const id = Date.now() + Math.random();
      setFloatingMessages((prev) => [...prev, { id, type, text, points }]);
      trackTimeout(() => {
        if (isMountedRef.current)
          setFloatingMessages((prev) => prev.filter((m) => m.id !== id));
      }, 2600);
    },
    [trackTimeout],
  );

  const { user, refreshProfile } = useAuth();
  const storageUserId = String(user?.id || user?._id || "").trim() || "guest";
  const STORAGE_KEY = useMemo(
    () => `codeEditorProgress_${storageUserId}_${moduleId}`,
    [storageUserId, moduleId],
  );
  const storageUserIdRef = useRef(storageUserId);
  storageUserIdRef.current = storageUserId;

  const {
    lectureNotes,
    lectureNotesLoading,
    lectureNotesError,
    lectureSlides,
    hasSlides,
    lectureSlideIndex,
    setLectureSlideIndex,
  } = useLectureOverview({
    moduleId,
    module,
    showOverviewPopup,
    user,
  });

  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === "console") {
        const source = e.data.source || null; // 'server' | 'player1' | 'player2' | null (preview)
        const message = source
          ? (source === "server" ? "[Server] " : "[" + source + "] ") +
            (e.data.message || "")
          : e.data.message;
        setConsoleLogs((prev) => [
          ...prev.slice(-199),
          {
            source,
            level: e.data.level,
            message,
            timestamp: e.data.timestamp || Date.now(),
          },
        ]);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const clearConsole = () => setConsoleLogs([]);
  const serverLogs = useMemo(
    () => consoleLogs.filter((e) => e.source === "server"),
    [consoleLogs],
  );
  const clientLogs = useMemo(
    () =>
      consoleLogs.filter(
        (e) => e.source === "player1" || e.source === "player2",
      ),
    [consoleLogs],
  );
  const clearServerConsole = () =>
    setConsoleLogs((prev) => prev.filter((e) => e.source !== "server"));
  const clearClientConsole = () =>
    setConsoleLogs((prev) =>
      prev.filter((e) => e.source !== "player1" && e.source !== "player2"),
    );

  const moduleConfig = useMemo(() => {
    if (!module) return MODULE_TYPES["javascript-basics"];
    return MODULE_TYPES[module.category] || MODULE_TYPES["javascript-basics"];
  }, [module]);

  const isMultiplayerModule = useMemo(
    () => module?.category === "multiplayer",
    [module],
  );

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
      server: getPreviewContent("server"),
      player1: getPreviewContent("player1"),
      player2: getPreviewContent("player2"),
    });
  }, [module?.id, isMultiplayerModule, isLoadingDraft]); // eslint-disable-line react-hooks/exhaustive-deps -- snapshot set once per module when draft ready

  useEffect(() => {
    if (!isMultiplayerModule) setMultiplayerSnapshot(null);
  }, [isMultiplayerModule]);

  const difficultyStyles = {
    beginner: "bg-blue-900 text-blue-100",
    intermediate: "bg-blue-800 text-blue-100",
    advanced: "bg-blue-900 text-blue-200",
  };

  const HINT_STYLES = [
    {
      value: "general",
      label: "General Hint",
      description: "Get a helpful nudge",
    },
    {
      value: "error-explanation",
      label: "Explain Error",
      description: "Understand error messages",
    },
    {
      value: "logic-guidance",
      label: "Logic Help",
      description: "Trace through code",
    },
    {
      value: "concept-reminder",
      label: "Concept Recap",
      description: "Review a concept",
    },
    {
      value: "visual-gameloop",
      label: "Game/Animation",
      description: "Game loops and animations",
    },
  ];

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
        const initialHtml = moduleData.starterCode?.html || "";
        const initialCss = moduleData.starterCode?.css || "";
        const initialJs =
          moduleData.starterCode?.javascript ||
          moduleData.starterCode?.jsx ||
          "";
        const initialServer = moduleData.starterCode?.serverJs || "";
        codeRefs.current = {
          html: initialHtml,
          css: initialCss,
          js: initialJs,
          server: initialServer,
        };
        const config =
          MODULE_TYPES[moduleData.category] ||
          MODULE_TYPES["javascript-basics"];
        setActiveTab(config.defaultTab);
        previewAutoRefreshRef.current = true;
        setPreviewAutoRefresh(true);
        setVerifyFeedback(null);
        setVerifyPassed(false);
        setStepFailureFeedback({});
        setMcqGateForStep(null);
        setMcqQuestions([]);
        setCompanionMessages([]);
        const stepCount = moduleData.steps?.length || 1;
        let usedProgress = false;
        setIsLoadingDraft(true);
        try {
          try {
            const pr = await userAPI.getModuleStepProgress(moduleId);
            const p = pr.data?.progress;
            if (
              p &&
              Array.isArray(p.stepsVerified) &&
              p.stepsVerified.length === stepCount
            ) {
              setStepsVerified(p.stepsVerified.map((x) => !!x));
              setCurrentStepIndex(
                Math.min(
                  Math.max(0, Math.floor(Number(p.currentStepIndex)) || 0),
                  stepCount - 1,
                ),
              );
              usedProgress = true;
            }
          } catch {
            /* offline or first visit */
          }
          if (!usedProgress) {
            const saved = sessionStorage.getItem(STORAGE_KEY);
            if (saved) {
              const parsed = JSON.parse(saved);
              const savedForId =
                parsed.moduleId != null
                  ? String(parsed.moduleId).trim()
                  : null;
              if (
                savedForId != null &&
                savedForId !== String(moduleId).trim()
              ) {
                sessionStorage.removeItem(STORAGE_KEY);
              } else {
                const savedVerified = parsed.stepsVerified;
                const savedStep = parsed.currentStepIndex;
                if (
                  Array.isArray(savedVerified) &&
                  savedVerified.length === stepCount &&
                  typeof savedStep === "number"
                ) {
                  setStepsVerified(savedVerified);
                  setCurrentStepIndex(Math.min(savedStep, stepCount - 1));
                  usedProgress = true;
                }
              }
            }
          }
          if (fetchAbortedRef.current) return;
          draftLoadTimeoutRef.current = setTimeout(async () => {
            try {
              if (fetchAbortedRef.current) return;
              const draft = await loadEditorDraft(storageUserId, moduleId);
              if (fetchAbortedRef.current) return;
              if (!usedProgress) {
                if (
                  draft?.stepsVerified?.length === stepCount &&
                  typeof draft.currentStepIndex === "number"
                ) {
                  setStepsVerified(draft.stepsVerified);
                  setCurrentStepIndex(
                    Math.min(draft.currentStepIndex, stepCount - 1),
                  );
                } else {
                  setStepsVerified([]);
                  setCurrentStepIndex(0);
                }
                if (draft?.code && typeof draft.code === "object") {
                  const c = draft.code;
                  const mergedJs =
                    c.javascript != null
                      ? c.javascript
                      : c.jsx != null
                        ? c.jsx
                        : initialJs;
                  codeRefs.current = {
                    html: c.html != null ? c.html : initialHtml,
                    css: c.css != null ? c.css : initialCss,
                    js: mergedJs,
                    server: c.serverJs != null ? c.serverJs : initialServer,
                  };
                  setEditorKey((prev) => prev + 1);
                }
              } else if (draft?.code && typeof draft.code === "object") {
                  const c = draft.code;
                  const mergedJs =
                    c.javascript != null
                      ? c.javascript
                      : c.jsx != null
                        ? c.jsx
                        : initialJs;
                  codeRefs.current = {
                    html: c.html != null ? c.html : initialHtml,
                    css: c.css != null ? c.css : initialCss,
                    js: mergedJs,
                    server: c.serverJs != null ? c.serverJs : initialServer,
                  };
                  setEditorKey((prev) => prev + 1);
                }
            } catch (draftError) {
              console.warn("Could not load draft:", draftError);
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
        console.error("Error fetching module:", error);
        toast.error(
          "We couldn't load this lesson. Please try again from your dashboard.",
        );
        navigate("/dashboard", { state: { direction: "back" } });
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
  }, [moduleId, navigate, STORAGE_KEY, storageUserId]);

  useEffect(() => {
    if (!module || steps.length === 0) return;
    if (toModuleId(module._id) !== String(moduleId).trim()) return;
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ stepsVerified, currentStepIndex, moduleId }),
    );
  }, [
    STORAGE_KEY,
    module,
    steps.length,
    stepsVerified,
    currentStepIndex,
    moduleId,
  ]);

  // Show floating overview popup when module has just finished loading (once per module)
  useEffect(() => {
    if (!module || loading || isLoadingDraft) return;
    if (!shownOverviewPopupRef.current[moduleId]) {
      shownOverviewPopupRef.current[moduleId] = true;
      setShowOverviewPopup(true);
      setLectureSlideIndex(0);
    }
  }, [module, moduleId, loading, isLoadingDraft, setLectureSlideIndex]);

  // Resize: pointer capture keeps drag alive over preview iframes (document mousemove does not).
  const clearResizeChrome = useCallback(() => {
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
    resizeRef.current.active = null;
    resizeRef.current.pointerId = null;
  }, []);

  const handleResizeLostCapture = useCallback(() => {
    clearResizeChrome();
  }, [clearResizeChrome]);

  const handleLeftResizePointerDown = useCallback(
    (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      resizeRef.current = {
        ...resizeRef.current,
        active: "left",
        pointerId: e.pointerId,
        startX: e.clientX,
        startLeft: leftPanelWidth,
      };
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
    },
    [leftPanelWidth],
  );
  const handleLeftResizePointerMove = useCallback((e) => {
    const r = resizeRef.current;
    if (r.active !== "left" || r.pointerId !== e.pointerId) return;
    const delta = e.clientX - r.startX;
    setLeftPanelWidth(Math.min(520, Math.max(200, r.startLeft + delta)));
  }, []);
  const handleLeftResizePointerUp = useCallback(
    (e) => {
      const r = resizeRef.current;
      if (r.active !== "left" || r.pointerId !== e.pointerId) return;
      clearResizeChrome();
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    },
    [clearResizeChrome],
  );

  const handleRightResizePointerDown = useCallback(
    (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      resizeRef.current = {
        ...resizeRef.current,
        active: "right",
        pointerId: e.pointerId,
        startX: e.clientX,
        startRight: rightPanelWidth,
      };
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
    },
    [rightPanelWidth],
  );
  const handleRightResizePointerMove = useCallback((e) => {
    const r = resizeRef.current;
    if (r.active !== "right" || r.pointerId !== e.pointerId) return;
    const delta = e.clientX - r.startX;
    setRightPanelWidth(Math.min(900, Math.max(260, r.startRight - delta)));
  }, []);
  const handleRightResizePointerUp = useCallback(
    (e) => {
      const r = resizeRef.current;
      if (r.active !== "right" || r.pointerId !== e.pointerId) return;
      clearResizeChrome();
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    },
    [clearResizeChrome],
  );

  const handleConsoleResizePointerDown = useCallback(
    (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      resizeRef.current = {
        ...resizeRef.current,
        active: "console",
        pointerId: e.pointerId,
        startY: e.clientY,
        startConsole: consoleHeight,
      };
      document.body.style.userSelect = "none";
      document.body.style.cursor = "row-resize";
    },
    [consoleHeight],
  );
  const handleConsoleResizePointerMove = useCallback((e) => {
    const r = resizeRef.current;
    if (r.active !== "console" || r.pointerId !== e.pointerId) return;
    const delta = e.clientY - r.startY;
    setConsoleHeight(Math.min(520, Math.max(72, r.startConsole - delta)));
  }, []);
  const handleConsoleResizePointerUp = useCallback(
    (e) => {
      const r = resizeRef.current;
      if (r.active !== "console" || r.pointerId !== e.pointerId) return;
      clearResizeChrome();
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    },
    [clearResizeChrome],
  );

  // Check achievements after step verification (toasts + profile; no list UI here)
  useEffect(() => {
    if (!module || stepsVerified.length === 0) return;
    let cancelled = false;
    const progressData = {
      totalEdits: codeChanges,
      totalRuns: streak,
      totalPoints: user?.totalPoints ?? 0,
      streak,
      completedModules: 0,
      aiCompanionUses: aiCompanionUsesRef.current,
      aiHintRequests: aiHintRequestsRef.current,
      aiExplainCodeUses: aiExplainCodeUsesRef.current,
      aiExplainErrorUses: aiExplainErrorUsesRef.current,
    };
    const levelBefore = user?.levelInfo?.level ?? user?.level ?? 1;
    achievementsAPI
      .checkAchievements(progressData)
      .then(async (res) => {
        if (cancelled) return;
        const { newlyEarned = [] } = res.data;
        if (newlyEarned.length > 0) {
          invalidateUserCaches();
          newlyEarned.forEach((ach) =>
            toast.success(
              <div>
                <strong>Achievement Unlocked!</strong>
                <div>{ach.name}</div>
                {ach.points ? (
                  <div className="text-xs opacity-90 mt-1">+{ach.points} XP</div>
                ) : null}
              </div>,
            ),
          );
          const updated = await refreshProfile?.();
          if (cancelled) return;
          const levelAfter =
            updated?.levelInfo?.level ?? updated?.level ?? levelBefore;
          if (levelAfter > levelBefore) {
            toast.success(`Level up! You reached level ${levelAfter}.`);
          }
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [
    stepsVerified,
    module,
    codeChanges,
    streak,
    points,
    user?.totalPoints,
    user?.level,
    user?.levelInfo?.level,
    refreshProfile,
  ]);

  // IndexedDB draft auto-save (every 8s). codeRefs/refs stay current on every keystroke.
  useEffect(() => {
    if (!moduleId || !module || isLoadingDraft) return;
    if (toModuleId(module._id) !== String(moduleId).trim()) return;
    const interval = setInterval(async () => {
      if (!isMountedRef.current) return;
      if (isLoadingDraftRef.current) return;
      if (saveInProgressRef.current) return;
      saveInProgressRef.current = true;
      try {
        const r = codeRefs.current;
        await saveEditorDraft(storageUserId, moduleId, {
          stepsVerified: stepsVerifiedRef.current,
          currentStepIndex: currentStepIndexRef.current,
          code: {
            html: r.html,
            css: r.css,
            javascript: r.js,
            serverJs: r.server,
          },
        });
      } finally {
        if (isMountedRef.current) saveInProgressRef.current = false;
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [moduleId, module, isLoadingDraft, storageUserId]);

  // Save draft shortly after step progress or code activity (covers quick navigation away).
  useEffect(() => {
    if (!moduleId || !module || isLoadingDraft) return;
    if (toModuleId(module._id) !== String(moduleId).trim()) return;
    const t = setTimeout(() => {
      if (!isMountedRef.current || isLoadingDraftRef.current) return;
      if (saveInProgressRef.current) return;
      saveInProgressRef.current = true;
      const r = codeRefs.current;
      saveEditorDraft(storageUserId, moduleId, {
        stepsVerified: stepsVerifiedRef.current,
        currentStepIndex: currentStepIndexRef.current,
        code: {
          html: r.html,
          css: r.css,
          javascript: r.js,
          serverJs: r.server,
        },
      }).finally(() => {
        if (isMountedRef.current) saveInProgressRef.current = false;
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [
    moduleId,
    module,
    isLoadingDraft,
    storageUserId,
    stepsVerified,
    currentStepIndex,
    codeChanges,
  ]);

  useEffect(() => {
    const flush = () => {
      const id = moduleIdRef.current;
      if (!id || isLoadingDraftRef.current || saveInProgressRef.current) return;
      const r = codeRefs.current;
      saveInProgressRef.current = true;
      saveEditorDraft(storageUserIdRef.current, id, {
        stepsVerified: stepsVerifiedRef.current,
        currentStepIndex: currentStepIndexRef.current,
        code: {
          html: r.html,
          css: r.css,
          javascript: r.js,
          serverJs: r.server,
        },
      }).finally(() => {
        saveInProgressRef.current = false;
      });
    };
    const onVis = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const allStepsVerified = useMemo(() => {
    if (!steps.length) return false;
    return steps.every((_, i) => stepsVerified[i]);
  }, [steps, stepsVerified]);

  const verifiedCount = useMemo(
    () => stepsVerified.filter(Boolean).length,
    [stepsVerified],
  );

  /** First step not yet verified; `steps.length` when all are verified */
  const firstIncompleteStepIndex = useMemo(() => {
    if (!steps.length) return 0;
    const i = steps.findIndex((_, idx) => !stepsVerified[idx]);
    return i === -1 ? steps.length : i;
  }, [steps, stepsVerified]);

  const canVerifyFocusedStep = useMemo(
    () =>
      steps.length > 0 &&
      firstIncompleteStepIndex < steps.length &&
      currentStepIndex === firstIncompleteStepIndex &&
      !stepsVerified[currentStepIndex],
    [
      steps.length,
      firstIncompleteStepIndex,
      currentStepIndex,
      stepsVerified,
    ],
  );

  /** Persisted “how far you are” for dashboard — not the step you’re only browsing */
  const progressStepIndexForSave = useMemo(() => {
    if (!steps.length) return 0;
    if (firstIncompleteStepIndex >= steps.length) return steps.length - 1;
    return firstIncompleteStepIndex;
  }, [steps, firstIncompleteStepIndex]);

  // Persist step progress + current module to the server (per-user in DB)
  useEffect(() => {
    if (!moduleId || !module || isLoadingDraft) return;
    const tid = setTimeout(() => {
      const sv = stepsVerifiedRef.current;
      userAPI
        .setCurrentModule(moduleId, {
          currentStepIndex: progressStepIndexForSave,
          stepsVerified: Array.isArray(sv) ? sv.map((x) => !!x) : [],
        })
        .catch(() => {});
    }, 600);
    return () => clearTimeout(tid);
  }, [moduleId, module, progressStepIndexForSave, isLoadingDraft, stepsVerified]);

  const showPointFloater = useCallback(
    (amount) => {
      if (pointFloaterTidRef.current) {
        clearTrackedTimeout(pointFloaterTidRef.current);
        pointFloaterTidRef.current = null;
      }
      setPointFloater({ id: Date.now(), amount });
      pointFloaterTidRef.current = trackTimeout(() => {
        pointFloaterTidRef.current = null;
        if (isMountedRef.current) setPointFloater(null);
      }, 1200);
    },
    [clearTrackedTimeout, trackTimeout],
  );

  // Stable extension arrays so CodeMirror doesn't reconfigure on every render
  const extHtml = useMemo(() => [html()], []);
  const extCss = useMemo(() => [css()], []);
  const extJs = useMemo(() => [javascript()], []);
  const extServer = useMemo(() => [javascript()], []);

  const handleVerifyCode = async () => {
    if (currentStepIndex >= steps.length) return;
    if (firstIncompleteStepIndex >= steps.length) return;
    if (currentStepIndex !== firstIncompleteStepIndex) {
      toast.info(
        "Open the step that needs verification (highlighted in your step list) to check your code.",
      );
      return;
    }
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
      const verifyType = stepMeta?.verifyType || "code";
      const payload = {
        moduleId,
        stepIndex: currentStepIndex,
        stepDescription: steps[currentStepIndex].title,
        stepInstruction: steps[currentStepIndex].instruction || "",
        stepConcept: steps[currentStepIndex].concept || "",
        code: {
          html: r.html,
          css: r.css,
          javascript: r.js,
          serverJs: r.server,
        },
        moduleTitle: module?.title,
        verifyType,
        expectedConsole: stepMeta?.expectedConsole ?? null,
      };
      if (verifyType === "checkConsole") {
        payload.consoleOutput = consoleLogs.map((e) => ({
          level: e.level,
          message: e.message,
        }));
      }
      const resp = await tutorAPI.verifyStep(payload);
      if (verifyGen !== asyncUiGenRef.current) return;
      const data = resp.data;
      const correct = !!data.correct;
      const feedback =
        data.feedback ||
        (correct
          ? "Looks good!"
          : "Not quite yet. Check the hint and try again.");
      setVerifyFeedback(feedback);
      setVerifyPassed(correct);
      if (correct) {
        setStepsVerified((prev) => {
          const next = [...prev];
          next[currentStepIndex] = true;
          return next;
        });
        const xp = Number(data.xpAwarded) || 0;
        if (xp > 0) {
          setPoints((p) => p + xp);
          setPointsJustEarned(true);
          trackTimeout(
            () => isMountedRef.current && setPointsJustEarned(false),
            600,
          );
          showPointFloater(xp);
          invalidateUserCaches();
          refreshProfile?.();
        }
        setLastVerifiedStepIndex(currentStepIndex);
        if (lastVerifiedStepClearTidRef.current)
          clearTimeout(lastVerifiedStepClearTidRef.current);
        lastVerifiedStepClearTidRef.current = setTimeout(() => {
          lastVerifiedStepClearTidRef.current = null;
          if (isMountedRef.current) setLastVerifiedStepIndex(null);
        }, 2000);
        toast.success(
          xp > 0 ? `Step complete! +${xp} XP` : "Step complete!",
        );
        // Open MCQ gate: 1-2 questions before next step (only if step has concept / we want MCQ)
        const step = steps[currentStepIndex];
        if (step?.concept && currentStepIndex < steps.length - 1) {
          setMcqGateForStep(currentStepIndex);
          setMcqQuestions([]);
          setMcqCurrentIndex(0);
          setMcqSelectedIndex(null);
          setMcqResult(null);
          fetchMCQsForStep(step);
        }
      } else {
        setStepFailureFeedback((prev) => ({
          ...prev,
          [currentStepIndex]: feedback,
        }));
        toast.warning("Not quite yet. See the explanation below.");
        setShowTutorSidebar(true);
        const step = steps[currentStepIndex];
        const instructionBlock = [
          step?.title ? `**This step**\n\n${step.title}` : "",
          step?.instruction
            ? `**What you need to do**\n\n${step.instruction}`
            : "",
          step?.concept ? `**Concept**\n\n${step.concept}` : "",
        ]
          .filter(Boolean)
          .join("\n\n");
        const codeHelp =
          "**Need help with your code?**\n\nAsk below for a hint or use **Explain selected code** in this panel.";
        const content = instructionBlock
          ? `${instructionBlock}\n\n---\n\n${codeHelp}`
          : codeHelp;
        setCompanionMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: "hint",
            userLabel: "Step help",
            content,
            timestamp: new Date().toLocaleTimeString(),
            confidence: 0.5,
          },
        ]);
      }
    } catch (err) {
      if (verifyGen !== asyncUiGenRef.current) return;
      console.error("Verify error", err);
      const msg = "Verification failed. Check the hint and try again.";
      setVerifyFeedback(msg);
      setVerifyPassed(false);
      setStepFailureFeedback((prev) => ({ ...prev, [currentStepIndex]: msg }));
      toast.error("Not quite yet-check the hint and try again.");
      setShowTutorSidebar(true);
      const step = steps[currentStepIndex];
      const instructionBlock = [
        step?.title ? `**This step**\n\n${step.title}` : "",
        step?.instruction
          ? `**What you need to do**\n\n${step.instruction}`
          : "",
        step?.concept ? `**Concept**\n\n${step.concept}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");
      const codeHelp =
        "**Need help with your code?**\n\nAsk below for a hint or use **Explain selected code** in this panel.";
      const content = instructionBlock
        ? `${instructionBlock}\n\n---\n\n${codeHelp}`
        : codeHelp;
      setCompanionMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "hint",
          userLabel: "Step help",
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
      if (questions.length === 0) {
        setMcqGateForStep(null);
      }
    } catch {
      if (mcqGen !== asyncUiGenRef.current) return;
      setMcqQuestions([]);
      setMcqGateForStep(null);
      toast.error(
        "We couldn't load the quiz. You can skip to the next step or try again.",
      );
    } finally {
      if (mcqGen === asyncUiGenRef.current) setMcqLoading(false);
    }
  };

  const handleMCQSubmit = async () => {
    if (mcqQuestions.length === 0 || mcqSelectedIndex == null) return;
    const mcqSubmitGen = asyncUiGenRef.current;
    const q = mcqQuestions[mcqCurrentIndex];
    const correctOptionText = q.options?.[q.correctIndex] ?? "";
    const userChoiceText = q.options?.[mcqSelectedIndex] ?? "";
    setMcqVerifyLoading(true);
    setMcqResult(null);
    try {
      const resp = await tutorAPI.verifyMCQ({
        moduleId,
        stepIndex: mcqGateForStep,
        questionIndex: mcqCurrentIndex,
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        selectedIndex: mcqSelectedIndex,
      });
      if (mcqSubmitGen !== asyncUiGenRef.current) return;
      const { correct, explanation } = resp.data;
      if (correct) {
        const xp = Number(resp.data?.xpAwarded) || 0;
        if (xp > 0) {
          setPoints((p) => p + xp);
          setPointsJustEarned(true);
          trackTimeout(
            () => isMountedRef.current && setPointsJustEarned(false),
            600,
          );
          showPointFloater(xp);
          invalidateUserCaches();
          refreshProfile?.();
        }
        if (mcqCurrentIndex < mcqQuestions.length - 1) {
          setMcqCurrentIndex((i) => i + 1);
          setMcqSelectedIndex(null);
          if (xp > 0) toast.success(`Correct! +${xp} XP`);
        } else {
          setMcqResult({ correct: true, explanation: explanation || "" });
          toast.success(
            xp > 0
              ? `Last question correct! +${xp} XP — tap Next step when ready.`
              : "Last question correct! Tap Next step when you're ready.",
          );
        }
      } else {
        setMcqResult({
          correct: false,
          explanation: explanation || "",
          correctOption: correctOptionText,
          userChoice: userChoiceText,
        });
      }
    } catch {
      if (mcqSubmitGen !== asyncUiGenRef.current) return;
      const explanation = "We couldn't verify that answer. You can still continue.";
      setMcqResult({
        correct: false,
        explanation,
        correctOption: correctOptionText,
        userChoice: userChoiceText,
      });
    } finally {
      if (mcqSubmitGen === asyncUiGenRef.current) setMcqVerifyLoading(false);
    }
  };

  const handleMCQNextStep = () => {
    setMcqGateForStep(null);
    setMcqQuestions([]);
    setMcqResult(null);
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((i) => i + 1);
      setVerifyFeedback(null);
      setVerifyPassed(false);
    }
  };

  /** After a wrong answer (or verify failure): show correct answer, then advance quiz or leave gate */
  const handleMCQContinueAfterIncorrect = () => {
    setMcqResult(null);
    setMcqSelectedIndex(null);
    if (mcqCurrentIndex < mcqQuestions.length - 1) {
      setMcqCurrentIndex((i) => i + 1);
    } else {
      handleMCQNextStep();
    }
  };

  const handleExplainSelection = async () => {
    const view = editorViewRef.current;
    if (!view) {
      toast.info("Select some code in the editor first, then click Explain.");
      return;
    }
    const { from, to } = view.state.selection.main;
    const selected = view.state.sliceDoc(from, to).trim();
    if (!selected) {
      toast.info("Select some code in the editor first, then click Explain.");
      return;
    }
    setShowTutorSidebar(true);
    setExplainCodeLoading(true);
    try {
      const lang =
        activeTab === "js" || activeTab === "server"
          ? "javascript"
          : activeTab;
      const resp = await tutorAPI.explainCode(selected, lang);
      const explanation = resp.data?.explanation || "No explanation available.";
      setCompanionMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "explain",
          userLabel: "Explanation of selection",
          content: explanation,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      aiCompanionUsesRef.current += 1;
      aiExplainCodeUsesRef.current += 1;
    } catch (err) {
      console.error("Explain code error", err);
      toast.error(
        "We couldn't get an explanation right now. Please try again.",
      );
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
    if (index < 0 || index >= steps.length) return;
    setCurrentStepIndex(index);
    setVerifyFeedback(null);
    setVerifyPassed(stepsVerified[index] || false);
  };

  const getPreviewContent = useCallback(
    (playerRole = null) => {
      const r = codeRefs.current;
      const channelName = `gamilearn-mp-${moduleId}`;

      if (isMultiplayerModule && playerRole === "server") {
        return buildServerPreviewHtml(channelName, r.server);
      }

      if (
        isMultiplayerModule &&
        (playerRole === "player1" || playerRole === "player2")
      ) {
        return buildClientPreviewHtml(
          channelName,
          playerRole,
          r.html,
          r.css,
          r.js,
        );
      }

      return buildSinglePlayerPreviewHtml({
        html: r.html,
        css: r.css,
        js: r.js,
      });
    },
    [isMultiplayerModule, moduleId],
  );

  const applyLivePreviewRefresh = useCallback(() => {
    const hadErrorsBeforeRun = errorCountRef.current > 0;
    const currentCodeChanges = codeChangesRef.current;
    const editedSinceLastRun =
      currentCodeChanges > lastRunCodeChangeCountRef.current;
    lastRunCodeChangeCountRef.current = currentCodeChanges;

    setConsoleLogs([]);
    setShowAllClear(false);
    setPreviewKey((k) => k + 1);
    if (isMultiplayerModule) {
      setMultiplayerSnapshot({
        server: getPreviewContent("server"),
        player1: getPreviewContent("player1"),
        player2: getPreviewContent("player2"),
      });
      setPlayer1PreviewKey((k) => k + 1);
      setPlayer2PreviewKey((k) => k + 1);
      setServerPreviewKey((k) => k + 1);
    }
    if (editedSinceLastRun) {
      setPoints((p) => p + 5);
      setStreak((s) => s + 1);
      setPointsJustEarned(true);
      trackTimeout(
        () => isMountedRef.current && setPointsJustEarned(false),
        600,
      );
    }
    const runFeedbackTid = setTimeout(() => {
      if (!isMountedRef.current) return;
      if (
        editedSinceLastRun &&
        hadErrorsBeforeRun &&
        errorCountRef.current === 0
      ) {
        setPoints((p) => p + 10);
        setPointsJustEarned(true);
        trackTimeout(
          () => isMountedRef.current && setPointsJustEarned(false),
          600,
        );
        showPointFloater(10);
        addFloatingMessage("success", "Errors fixed!", 10);
        setShowAllClear(true);
        clearTrackedTimeout(runFeedbackClearTidRef.current);
        runFeedbackClearTidRef.current = trackTimeout(() => {
          if (isMountedRef.current) setShowAllClear(false);
        }, 2500);
      }
    }, 1500);
    runFeedbackTidRef.current = runFeedbackTid;
  }, [
    isMultiplayerModule,
    getPreviewContent,
    showPointFloater,
    trackTimeout,
    addFloatingMessage,
    clearTrackedTimeout,
  ]);

  applyLivePreviewRefreshRef.current = applyLivePreviewRefresh;

  const handlePreviewAutoRefreshChange = useCallback((enabled) => {
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }
    previewAutoRefreshRef.current = enabled;
    setPreviewAutoRefresh(enabled);
    if (enabled) {
      applyLivePreviewRefreshRef.current();
    }
  }, []);

  const onManualPreviewRefresh = useCallback(() => {
    applyLivePreviewRefreshRef.current();
  }, []);

  const handleCompleteModule = async () => {
    if (!allStepsVerified) return;
    try {
      const totalPointsStart = Number(
        user?.totalPoints ?? user?.levelInfo?.totalPoints ?? 0,
      );
      const sessionStats = {
        totalEdits: codeChanges,
        streak,
        totalRuns: 0,
        sessionTime: 0,
        saveCount: 0,
      };
      const resp = await userAPI.completeModule(moduleId, sessionStats);
      const delta = resp.data?.delta || {};
      const xpAwardedModule = Number(resp.data?.xpAwarded) || 0;
      const newlyEarned = resp.data?.newlyEarned || [];

      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      void clearEditorDraft(storageUserId, moduleId);

      const updated = await refreshProfile?.();

      const totalPointsEndRaw =
        delta.totalPoints != null
          ? Number(delta.totalPoints)
          : Number(
              updated?.totalPoints ??
                updated?.levelInfo?.totalPoints ??
                totalPointsStart + xpAwardedModule,
            );
      const totalPointsEnd = Number.isFinite(totalPointsEndRaw)
        ? totalPointsEndRaw
        : totalPointsStart;

      const xpGainedTotal = Math.max(0, totalPointsEnd - totalPointsStart);

      setModuleCompleteModal({
        moduleTitle: module?.title || "",
        moduleCoverImageUrl: module
          ? getModuleImageUrl(module, 720, 1080)
          : "",
        firstTimeComplete: xpAwardedModule > 0,
        xpGainedTotal,
        totalPointsStart,
        totalPointsEnd,
        sessionStats,
        newlyEarnedCount: newlyEarned.length,
        newlyEarned,
        avatarUrl: String(updated?.avatarUrl ?? user?.avatarUrl ?? "").trim(),
      });
    } catch (error) {
      console.error("Error completing module:", error);
    }
  };

  const handleModuleCompleteContinue = useCallback(() => {
    setModuleCompleteModal(null);
    navigate("/dashboard", { state: { direction: "back" } });
  }, [navigate]);

  const persistEditorProgress = useCallback(async () => {
    if (!moduleId || !module) return;
    if (toModuleId(module._id) !== String(moduleId).trim()) return;
    const r = codeRefs.current;
    const sv = stepsVerifiedRef.current;
    const ci = currentStepIndexRef.current;
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ stepsVerified: sv, currentStepIndex: ci, moduleId }),
      );
    } catch {
      /* ignore */
    }
    await saveEditorDraft(storageUserId, moduleId, {
      stepsVerified: sv,
      currentStepIndex: ci,
      code: {
        html: r.html,
        css: r.css,
        javascript: r.js,
        serverJs: r.server,
      },
    });
  }, [moduleId, module, STORAGE_KEY, storageUserId]);

  const confirmNavigateBack = useCallback(async () => {
    await persistEditorProgress();
    setShowBackConfirm(false);
    navigate("/dashboard", { state: { direction: "back" } });
  }, [navigate, persistEditorProgress]);

  const handleCodeChange = useCallback((value, tabKey) => {
    if (isLoadingDraftRef.current) return;
    codeRefs.current[tabKey] = value;
    // Auto-clear console when user edits and there were errors, so errors disappear once they fix the code
    setConsoleLogs((prev) => {
      const hadErrors = prev.some((e) => e.level === "error");
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
      if (!previewAutoRefreshRef.current) return;
      applyLivePreviewRefreshRef.current();
    }, 1500);
  }, []);

  const onChangeHtml = useCallback(
    (v) => handleCodeChange(v, "html"),
    [handleCodeChange],
  );
  const onChangeCss = useCallback(
    (v) => handleCodeChange(v, "css"),
    [handleCodeChange],
  );
  const onChangeJs = useCallback(
    (v) => handleCodeChange(v, "js"),
    [handleCodeChange],
  );
  const onChangeServer = useCallback(
    (v) => handleCodeChange(v, "server"),
    [handleCodeChange],
  );
  const onEditorCreate = useCallback((view) => {
    editorViewRef.current = view;
  }, []);

  const handleReset = () => setShowResetConfirm(true);
  const confirmReset = () => {
    const h = module.starterCode?.html || "";
    const c = module.starterCode?.css || "";
    const j =
      module.starterCode?.javascript || module.starterCode?.jsx || "";
    const s = module.starterCode?.serverJs || "";
    codeRefs.current = { html: h, css: c, js: j, server: s };
    if (lastVerifiedStepClearTidRef.current)
      clearTimeout(lastVerifiedStepClearTidRef.current);
    lastVerifiedStepClearTidRef.current = null;
    lastRunCodeChangeCountRef.current = 0;
    previewAutoRefreshRef.current = true;
    setPreviewAutoRefresh(true);
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
    if (module?.category === "multiplayer") {
      setMultiplayerSnapshot({
        server: getPreviewContent("server"),
        player1: getPreviewContent("player1"),
        player2: getPreviewContent("player2"),
      });
      setServerPreviewKey((k) => k + 1);
      setPlayer1PreviewKey((k) => k + 1);
      setPlayer2PreviewKey((k) => k + 1);
    }
    setShowResetConfirm(false);
    sessionStorage.removeItem(STORAGE_KEY);
    void clearEditorDraft(storageUserId, moduleId);
    toast.info("Code reset to starter template.");
  };

  const handleExplainErrorClick = async (errorMessage) => {
    if (!errorMessage || explainErrorLoading) return;
    setShowTutorSidebar(true);
    setExplainErrorLoading(true);
    try {
      const r = codeRefs.current;
      const lang =
        activeTab === "js" || activeTab === "server"
          ? "javascript"
          : activeTab;
      const codeSnippet =
        r[
          activeTab === "server"
            ? "server"
            : activeTab === "js"
              ? "js"
              : activeTab
        ] || "";
      const resp = await tutorAPI.explainError(errorMessage, codeSnippet, lang);
      const explanation =
        resp.data?.explanation || "Could not get explanation.";
      setCompanionMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "explain",
          userLabel: "Error explanation",
          content: explanation,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      aiCompanionUsesRef.current += 1;
      aiExplainErrorUsesRef.current += 1;
    } catch (err) {
      console.error("Explain error", err);
      toast.error(
        "We couldn't explain that error right now. Please try again.",
      );
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
    setTutorQuestion("");
    try {
      const askOptions = buildTutorAskOptions({
        question,
        codeRefs,
        activeTab,
        module,
        steps,
        currentStepIndex,
        recentErrors,
      });
      const resp = await tutorAPI.ask(question, askOptions);
      let answer =
        resp.data.answer ||
        "We couldn't generate a hint right now. Try rephrasing your question or try again.";
      answer = sanitizeTutorAnswer(answer);
      setCompanionMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "hint",
          userLabel: question,
          content: answer,
          timestamp: new Date().toLocaleTimeString(),
          confidence: resp.data.confidence,
        },
      ]);
      aiCompanionUsesRef.current += 1;
      aiHintRequestsRef.current += 1;
    } catch (err) {
      console.error("Tutor error", err);
      setCompanionMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "hint",
          userLabel: question,
          content:
            "We couldn't get a response right now. Please try asking again.",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
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

  if (loading || isLoadingDraft) {
    return (
      <div
        className="min-h-screen bg-neutral-900 text-blue-100 flex flex-col items-center justify-center px-4 py-12"
        role="status"
        aria-live="polite"
      >
        <LoadingScreen
          message={
            loading ? "Preparing your lesson…" : "Restoring your progress…"
          }
          subMessage={
            loading
              ? "Fetching content and steps"
              : "Loading your last saved code"
          }
          className="!min-h-0"
        />
      </div>
    );
  }

  const currentStep = steps[currentStepIndex];
  return (
    <div className="h-screen overflow-hidden bg-neutral-900 text-blue-100 flex flex-col">
      <LectureOverviewPopup
        open={Boolean(showOverviewPopup && module)}
        onClose={() => setShowOverviewPopup(false)}
        module={module}
        lectureNotes={lectureNotes}
        lectureNotesLoading={lectureNotesLoading}
        lectureNotesError={lectureNotesError}
        lectureSlides={lectureSlides}
        hasSlides={hasSlides}
        lectureSlideIndex={lectureSlideIndex}
        setLectureSlideIndex={setLectureSlideIndex}
      />

      {/* ─── HEADER: calm title row + progress strip (stats live here, not on title row) ─── */}
      <motion.header
        className="shrink-0 relative z-10 bg-neutral-900 border-b border-neutral-800/80"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 300 }}
      >
        {/* Row 1 — lesson identity + toolbar only */}
        <div className="px-4 sm:px-6 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setShowBackConfirm(true)}
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-blue-800 text-blue-200 hover:text-blue-50 hover:bg-blue-700 transition-colors"
              title="Back to Dashboard"
            >
              <FaArrowLeft className="text-xs" />
            </button>
            <div className="min-w-0 flex-1 flex items-start gap-3">
              <span className="hidden sm:flex shrink-0 w-9 h-9 rounded-lg bg-neutral-900 items-center justify-center text-blue-400">
                {isMultiplayerModule ? (
                  <FaUsers className="text-sm" />
                ) : (
                  <FaCode className="text-sm" />
                )}
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
                <p className="mt-0.5 text-xs text-blue-400/90 hidden sm:block">
                  Code editor
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 justify-end lg:shrink-0">
            <button
              type="button"
              onClick={handleReset}
              className="shrink-0 inline-flex min-h-9 w-9 items-center justify-center rounded-xl bg-blue-900 text-blue-200 hover:bg-blue-800 transition-colors"
              title="Reset code"
            >
              <FaUndo className="text-xs" />
            </button>
            <button
              type="button"
              onClick={() => setShowTutorSidebar(!showTutorSidebar)}
              className={`min-h-9 inline-flex items-center justify-center gap-2 px-4 rounded-xl text-xs font-semibold transition-colors ${
                showTutorSidebar
                  ? "bg-blue-600 text-black"
                  : "bg-blue-900 text-blue-200 hover:text-blue-50 hover:bg-blue-800"
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
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="absolute right-6 sm:right-10 top-4 flex items-center gap-1 text-amber-400/90 font-bold text-sm pointer-events-none"
            >
              <FaStar className="text-[10px]" /> +{pointFloater.amount}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Row 2 — progress (tap a segment to preview that step) + Check code + session stats */}
        <div className="px-4 sm:px-6 py-3 border-t border-neutral-800/80 bg-neutral-900/40">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4 min-w-0">
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
                    const taskHere =
                      firstIncompleteStepIndex < steps.length &&
                      i === firstIncompleteStepIndex;
                    const viewing = i === currentStepIndex;
                    const segClass = stepsVerified[i]
                      ? "bg-emerald-700"
                      : taskHere && viewing
                        ? "bg-blue-600"
                        : taskHere
                          ? "bg-amber-600/90 ring-1 ring-amber-400/50"
                          : viewing
                            ? "bg-blue-600"
                            : "bg-neutral-800";
                    return (
                      <motion.button
                        key={i}
                        type="button"
                        onClick={() => goToStep(i)}
                        title={`Step ${i + 1}${taskHere && !stepsVerified[i] ? " — verify here" : ""}`}
                        className={`h-2.5 rounded-full transition-all duration-300 shrink-0 hover:brightness-110 ${
                          steps.length <= 6 ? "w-9" : "w-5"
                        } ${segClass} ${justVerified ? "shadow-[0_0_10px_rgba(16,185,129,0.25)]" : ""}`}
                        animate={justVerified ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 0.4 }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleVerifyCode}
              disabled={verifyLoading || !canVerifyFocusedStep}
              className="shrink-0 inline-flex items-center justify-center gap-1.5 min-h-9 px-4 rounded-xl bg-blue-600 text-black text-xs font-bold shadow-md shadow-black/25 hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-blue-500 disabled:shadow-none disabled:cursor-not-allowed transition-all whitespace-nowrap"
            >
              {verifyLoading ? (
                <>
                  <div
                    className="h-3 w-3 rounded-full border-2 border-blue-400/50 border-t-blue-200 animate-spin"
                    aria-hidden
                  />
                  Checking…
                </>
              ) : (
                <>
                  <FaCheck className="text-[9px]" /> Check my code
                </>
              )}
            </button>
            <div className="flex items-center gap-3 sm:gap-4 shrink-0 overflow-x-auto scrollbar-hide pb-0.5 lg:pb-0 lg:pl-4 lg:border-l border-neutral-800">
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
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg ${
                m.type === "success"
                  ? "bg-blue-950 text-blue-100 shadow-md shadow-black/40"
                  : m.type === "error"
                    ? "bg-red-900/90 text-red-100 shadow-md shadow-black/40"
                    : "bg-blue-900/90 text-blue-100 shadow-md shadow-black/40"
              }`}
            >
              {m.type === "success" && (
                <FaCheckCircle className="text-base shrink-0" />
              )}
              {m.type === "error" && (
                <FaExclamationTriangle className="text-base shrink-0" />
              )}
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
        {/* ─── LEFT PANEL (resizable) — overview, then Steps OR Concept check (same slot) ─── */}
        <motion.aside
          className="flex h-full min-h-0 flex-col shrink-0 overflow-y-auto overflow-x-hidden scrollbar-hide bg-neutral-950/50 border-r border-neutral-800/60"
          style={{ width: leftPanelWidth }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", damping: 24, stiffness: 300 }}
        >
          {/* Lesson overview */}
          <motion.div
            className="shrink-0 mx-3 mt-3 rounded-xl border border-neutral-800/90 bg-neutral-900/60 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
          >
            <button
              type="button"
              onClick={() => setShowOverview(!showOverview)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-blue-100 hover:bg-neutral-800/40 transition-colors"
            >
              <span className="flex items-center gap-2 min-w-0">
                <FaBookOpen className="text-blue-300 shrink-0 text-sm" />
                <span className="truncate">Lesson overview</span>
              </span>
              {showOverview ? (
                <FaChevronUp className="text-xs shrink-0 text-blue-400" />
              ) : (
                <FaChevronDown className="text-xs shrink-0 text-blue-400" />
              )}
            </button>
            <AnimatePresence>
              {showOverview && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t border-neutral-800/60"
                >
                  <div className="px-4 pb-4 pt-2 max-h-[min(52vh,420px)] overflow-y-auto scrollbar-hide">
                    <button
                      type="button"
                      onClick={() => {
                        setLectureSlideIndex(0);
                        setShowOverviewPopup(true);
                      }}
                      className="w-full mb-3 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-600 text-black text-xs font-semibold hover:bg-blue-500 transition-colors"
                    >
                      <FaBookOpen className="text-xs" /> Open lecture
                    </button>
                    <div className="text-[13px] text-blue-100/95 leading-relaxed">
                      <MarkdownContent content={module.content} />
                    </div>
                    {module.hints?.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-neutral-800/50">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-2">
                          Hints
                        </p>
                        <ul className="list-disc pl-4 space-y-1.5 text-[13px] text-blue-200/90">
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

          {/* Concept check replaces the Steps card (same slot — no stacking over the sidebar) */}
          {mcqGateForStep !== null ? (
            <div className="mx-3 mt-3 mb-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-blue-700/45 bg-neutral-900/85 shadow-[0_0_24px_rgba(37,99,235,0.12)]">
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-neutral-800/80 px-3 py-2.5">
                <h4 className="flex items-center gap-1.5 text-xs font-bold text-blue-100">
                  <FaBolt className="text-blue-400" /> Concept check
                </h4>
                <button
                  type="button"
                  onClick={handleMCQNextStep}
                  className="shrink-0 text-[10px] font-semibold text-blue-400 transition hover:text-blue-200"
                >
                  Skip
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2.5 scrollbar-hide">
                {mcqLoading ? (
                  <div
                    className="flex items-center gap-2 text-xs text-blue-300"
                    role="status"
                    aria-label="Preparing quiz"
                  >
                    <div
                      className="h-3 w-3 shrink-0 rounded-full border-2 border-blue-300 border-t-transparent animate-spin"
                      aria-hidden
                    />
                    Preparing your quiz…
                  </div>
                ) : mcqQuestions.length > 0 ? (
                  <div className="space-y-2.5">
                    <p className="text-[12px] leading-relaxed text-blue-100">
                      <span className="font-semibold text-blue-200">
                        Q{mcqCurrentIndex + 1}/{mcqQuestions.length}:
                      </span>{" "}
                      {mcqQuestions[mcqCurrentIndex]?.question}
                    </p>
                    <div className="space-y-1">
                      {mcqQuestions[mcqCurrentIndex]?.options?.map(
                        (opt, idx) => (
                          <motion.button
                            key={idx}
                            type="button"
                            disabled={mcqResult != null}
                            onClick={() => setMcqSelectedIndex(idx)}
                            whileHover={
                              mcqResult == null ? { scale: 1.01 } : undefined
                            }
                            whileTap={
                              mcqResult == null ? { scale: 0.99 } : undefined
                            }
                            className={`w-full rounded-lg px-2.5 py-1.5 text-left text-[12px] transition disabled:cursor-default ${
                              mcqSelectedIndex === idx
                                ? "bg-blue-500 text-black shadow-sm shadow-black/25"
                                : "bg-neutral-800/90 text-blue-200 hover:bg-neutral-800"
                            } ${mcqResult != null ? "opacity-85" : ""}`}
                          >
                            {opt}
                          </motion.button>
                        ),
                      )}
                    </div>
                    <AnimatePresence mode="wait">
                      {mcqResult && mcqResult.correct === false && (
                        <motion.div
                          key="mcq-wrong"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          className="space-y-1.5 rounded-lg border border-blue-700/50 bg-blue-800/40 p-2.5 text-[11px] text-blue-100"
                        >
                          <p>
                            <span className="font-semibold text-emerald-300">
                              Correct:{" "}
                            </span>
                            {mcqResult.correctOption || "—"}
                          </p>
                          {mcqResult.userChoice ? (
                            <p>
                              <span className="font-semibold text-blue-200">
                                Yours:{" "}
                              </span>
                              {mcqResult.userChoice}
                            </p>
                          ) : null}
                          {mcqResult.explanation ? (
                            <p className="leading-relaxed text-blue-200/95">
                              {mcqResult.explanation}
                            </p>
                          ) : null}
                        </motion.div>
                      )}
                      {mcqResult && mcqResult.correct === true && (
                        <motion.div
                          key="mcq-right"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          className="rounded-lg bg-blue-500 p-2.5 text-[11px] leading-relaxed text-black"
                        >
                          {mcqResult.explanation ||
                            "Nice — continue when you’re ready."}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <p className="text-xs text-blue-300">
                    No quiz loaded. Skip to continue.
                  </p>
                )}
              </div>
              <div className="shrink-0 space-y-1.5 border-t border-neutral-800 bg-neutral-900/95 p-3">
                {mcqLoading ? (
                  <p
                    className="py-1 text-center text-[10px] text-blue-400"
                    role="status"
                  >
                    Loading quiz…
                  </p>
                ) : mcqResult && mcqResult.correct === false ? (
                  <button
                    type="button"
                    onClick={handleMCQContinueAfterIncorrect}
                    className="flex w-full items-center justify-center gap-1 rounded-lg bg-emerald-800/90 py-2 text-xs font-bold text-emerald-50 transition hover:bg-emerald-700/90"
                  >
                    {mcqCurrentIndex < mcqQuestions.length - 1 ? (
                      <>
                        Next question{" "}
                        <FaChevronRight className="text-[8px]" />
                      </>
                    ) : (
                      <>
                        Next step <FaChevronRight className="text-[8px]" />
                      </>
                    )}
                  </button>
                ) : mcqResult &&
                  mcqResult.correct === true &&
                  mcqCurrentIndex === mcqQuestions.length - 1 &&
                  mcqQuestions.length > 0 ? (
                  <button
                    type="button"
                    onClick={handleMCQNextStep}
                    className="flex w-full items-center justify-center gap-1 rounded-lg bg-emerald-800/90 py-2 text-xs font-bold text-emerald-50 transition hover:bg-emerald-700/90"
                  >
                    Next step <FaChevronRight className="text-[8px]" />
                  </button>
                ) : mcqQuestions.length === 0 ? (
                  <button
                    type="button"
                    onClick={handleMCQNextStep}
                    className="w-full rounded-lg bg-neutral-800 py-2 text-xs font-semibold text-blue-200 transition hover:bg-neutral-700"
                  >
                    Continue without quiz
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleMCQSubmit}
                    disabled={
                      mcqVerifyLoading ||
                      mcqSelectedIndex == null ||
                      mcqResult != null
                    }
                    className="w-full rounded-lg bg-blue-600 py-2 text-xs font-bold text-black shadow-md shadow-black/25 transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-45 disabled:saturate-50 disabled:shadow-none"
                  >
                    {mcqVerifyLoading
                      ? "Checking…"
                      : "Check answer"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <motion.div
              className="mx-3 mt-3 mb-3 shrink-0 rounded-xl border border-neutral-800/90 bg-neutral-900/60 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.07 }}
            >
              <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2 border-b border-neutral-800/50">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500">
                    Steps
                  </p>
                  <p className="text-xs text-blue-200/90 tabular-nums mt-0.5">
                    {verifiedCount} done · {steps.length} total
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowStepGuide(true)}
                  className="shrink-0 flex items-center gap-1.5 rounded-lg bg-blue-800/80 px-2.5 py-1.5 text-[10px] font-bold text-blue-100 hover:bg-blue-700/90 transition-colors"
                  title="Open step panel on the editor"
                >
                  <FaLightbulb className="text-[9px]" />
                  Panel
                </button>
              </div>
              <div className="max-h-[220px] overflow-y-auto scrollbar-hide px-2 py-2 space-y-0.5">
                {steps.map((step, i) => {
                  const verified = stepsVerified[i];
                  const isViewing = i === currentStepIndex;
                  const isTaskStep =
                    firstIncompleteStepIndex < steps.length &&
                    i === firstIncompleteStepIndex;
                  const failedFb = stepFailureFeedback[i];
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => goToStep(i)}
                      className={`w-full flex items-start gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-neutral-800/70 ${
                        isViewing ? "bg-blue-900/35 ring-1 ring-blue-600/40" : ""
                      } ${
                        isTaskStep && !verified
                          ? "ring-1 ring-amber-500/40 bg-amber-950/20"
                          : ""
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                          verified
                            ? "bg-emerald-800/90 text-emerald-50"
                            : failedFb && isViewing
                              ? "bg-amber-900/80 text-amber-100"
                              : isViewing
                                ? "bg-blue-600 text-black"
                                : "bg-neutral-800 text-blue-400"
                        }`}
                      >
                        {verified ? (
                          <FaCheck className="text-[8px]" />
                        ) : failedFb && isViewing ? (
                          <FaTimes className="text-[8px]" />
                        ) : (
                          i + 1
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block text-[12px] font-medium leading-snug line-clamp-2 ${
                            isViewing ? "text-blue-100" : "text-blue-200/90"
                          }`}
                        >
                          {step.title}
                        </span>
                        {isTaskStep && !verified && (
                          <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-wide text-amber-400/90">
                            Verify here
                          </span>
                        )}
                        {failedFb && isViewing && (
                          <span className="mt-0.5 block text-[10px] text-amber-200/90 line-clamp-2">
                            Needs another try
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="px-4 pb-3 pt-0 text-[10px] text-blue-500/90 leading-snug">
                Tap any step to read it. Use{" "}
                <span className="text-blue-300">Check my code</span> in the
                header (or this panel) on the step marked{" "}
                <span className="text-amber-400/90">Verify here</span>.
              </p>
            </motion.div>
          )}
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
          transition={{
            type: "spring",
            damping: 24,
            stiffness: 300,
            delay: 0.06,
          }}
        >
          <CodeEditorFileTabs
            tabs={moduleConfig.tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isMultiplayerModule={isMultiplayerModule}
          />
          {/* Editor + floating step guide */}
          <motion.div
            className="flex-1 min-h-0 overflow-hidden bg-neutral-900/35 relative flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            {/* Floating panel: task copy only; verify via header */}
            <AnimatePresence>
              {showStepGuide && currentStep && (
                <motion.div
                  key={`guide-${currentStepIndex}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  transition={{ type: "spring", damping: 22, stiffness: 300 }}
                  className="absolute bottom-4 right-4 left-4 sm:left-auto z-40 w-auto max-w-full sm:max-w-md max-h-[min(56vh,480px)] flex flex-col rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl shadow-black overflow-hidden"
                >
                  <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-hide">
                    <div className="flex items-start gap-3 p-4 pb-2">
                      <div className="shrink-0 w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                        <FaLightbulb className="text-black text-sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-blue-50 leading-snug mb-1.5">
                          {currentStep.title}
                        </p>
                        <p className="text-[13px] text-blue-300 leading-relaxed mb-2">
                          {currentStep.instruction || currentStep.title}
                        </p>
                        {currentStep.concept && (
                          <p className="text-xs text-blue-300 bg-neutral-900 rounded-lg px-3 py-2 leading-relaxed mb-2">
                            {currentStep.concept}
                          </p>
                        )}
                        {stepFailureFeedback[currentStepIndex] && (
                          <p className="text-[11px] text-blue-200 rounded-lg bg-blue-800/40 border border-blue-700/50 px-3 py-2 leading-relaxed">
                            {stepFailureFeedback[currentStepIndex]}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowStepGuide(false)}
                        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-blue-500 hover:text-blue-100 hover:bg-neutral-900 transition"
                        aria-label="Close step guide"
                      >
                        <FaTimes className="text-xs" />
                      </button>
                    </div>
                    {(((verifyPassed || stepsVerified[currentStepIndex]) &&
                      currentStepIndex < steps.length - 1) ||
                      verifyFeedback) && (
                      <div className="px-4 pb-4 space-y-2 border-t border-neutral-800/60 pt-3 mt-1">
                        {(verifyPassed || stepsVerified[currentStepIndex]) &&
                          currentStepIndex < steps.length - 1 &&
                          mcqGateForStep === null && (
                            <button
                              type="button"
                              onClick={handleNextStep}
                              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-800 text-blue-200 text-xs font-bold hover:bg-blue-700 transition-colors"
                            >
                              Next step{" "}
                              <FaChevronRight className="text-[8px]" />
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
                                  ? "bg-emerald-800/90 text-emerald-50"
                                  : "bg-blue-600 text-black"
                              }`}
                            >
                              {verifyFeedback}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Collapsed: minimal strip so progress stays obvious (not during concept check) */}
            {!showStepGuide &&
              currentStep &&
              !allStepsVerified &&
              mcqGateForStep === null && (
                <motion.button
                  type="button"
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ type: "spring", damping: 22, stiffness: 320 }}
                  onClick={() => setShowStepGuide(true)}
                  title="Open step panel — instructions & Check my code"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="absolute bottom-4 left-3 right-3 sm:left-auto sm:right-4 z-40 flex w-auto max-w-full sm:max-w-md items-stretch gap-2 rounded-xl border border-neutral-700/90 bg-neutral-900/95 px-3 py-2 shadow-lg shadow-black/40 backdrop-blur-md text-left"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600/90">
                    <FaLightbulb className="text-black text-sm" />
                  </span>
                  <span className="min-w-0 flex-1 py-0.5">
                    <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-blue-500">
                      Step {currentStepIndex + 1}/{steps.length}
                      <span className="font-normal text-blue-400 normal-case tracking-normal">
                        · {verifiedCount} verified
                      </span>
                    </span>
                    <span className="mt-0.5 block text-[12px] font-semibold text-blue-50 leading-snug line-clamp-1">
                      {currentStep.title}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-blue-400 leading-snug line-clamp-2">
                      {stepsVerified[currentStepIndex] || verifyPassed
                        ? currentStepIndex < steps.length - 1
                          ? "Open panel for Next step."
                          : "All steps verified — use Complete in the top bar."
                        : "Open panel for the task & Check my code."}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-center justify-center gap-1 border-l border-neutral-700/80 pl-2">
                    <div className="flex max-w-[3.5rem] flex-wrap justify-center gap-0.5">
                      {steps.map((_, i) => {
                        const v = stepsVerified[i];
                        const cur = i === currentStepIndex;
                        return (
                          <span
                            key={i}
                            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                              v
                                ? "bg-emerald-500"
                                : cur
                                  ? "bg-blue-400"
                                  : "bg-neutral-600"
                            }`}
                            aria-hidden
                          />
                        );
                      })}
                    </div>
                    <FaChevronUp className="text-[10px] text-blue-400" aria-hidden />
                  </span>
                </motion.button>
              )}
            <div className="flex-1 min-h-0 min-w-0 flex flex-col">
              <CodeEditorMirrors
                activeTab={activeTab}
                editorKey={editorKey}
                codeRefs={codeRefs}
                extHtml={extHtml}
                extCss={extCss}
                extJs={extJs}
                extServer={extServer}
                onEditorCreate={onEditorCreate}
                onChangeHtml={onChangeHtml}
                onChangeCss={onChangeCss}
                onChangeJs={onChangeJs}
                onChangeServer={onChangeServer}
              />
            </div>
          </motion.div>

          {/* Code errors panel - shows runtime/console errors below the editor; "All clear!" when fixed */}
          <AnimatePresence mode="wait">
            {showAllClear ? (
              <motion.div
                key="all-clear"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ type: "spring", damping: 20 }}
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
                    <FaExclamationTriangle className="text-blue-300" /> Errors (
                    {recentErrors.length})
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
          transition={{
            type: "spring",
            damping: 24,
            stiffness: 300,
            delay: 0.1,
          }}
        >
          {isMultiplayerModule ? (
            <CodeEditorMultiplayerPreviewPanel
              activePreviewTab={activePreviewTab}
              onPreviewTabChange={setActivePreviewTab}
              serverPreviewKey={serverPreviewKey}
              player1PreviewKey={player1PreviewKey}
              player2PreviewKey={player2PreviewKey}
              multiplayerSnapshot={multiplayerSnapshot}
              getPreviewContent={getPreviewContent}
              previewAutoRefresh={previewAutoRefresh}
              onPreviewAutoRefreshChange={handlePreviewAutoRefreshChange}
              onManualPreviewRefresh={onManualPreviewRefresh}
            />
          ) : (
            <CodeEditorSinglePlayerPreviewPanel
              previewKey={previewKey}
              getPreviewContent={getPreviewContent}
              onOpenInNewTab={openLivePreviewInNewTab}
              previewAutoRefresh={previewAutoRefresh}
              onPreviewAutoRefreshChange={handlePreviewAutoRefreshChange}
              onManualPreviewRefresh={onManualPreviewRefresh}
            />
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
            {consoleOpen && (
              <CodeEditorConsoleBody
                isMultiplayerModule={isMultiplayerModule}
                serverLogs={serverLogs}
                clientLogs={clientLogs}
                consoleLogs={consoleLogs}
                clearServerConsole={clearServerConsole}
                clearClientConsole={clearClientConsole}
              />
            )}
          </div>
        </motion.div>

        <CodeEditorTutorSidebar
          open={showTutorSidebar}
          onClose={() => setShowTutorSidebar(false)}
          recentErrors={recentErrors}
          companionMessages={companionMessages}
          tutorQuestion={tutorQuestion}
          onTutorQuestionChange={setTutorQuestion}
          tutorLoading={tutorLoading}
          explainCodeLoading={explainCodeLoading}
          explainErrorLoading={explainErrorLoading}
          onExplainError={handleExplainErrorClick}
          onExplainLastError={handleExplainLastError}
          lastError={lastError}
          onExplainSelection={handleExplainSelection}
          onSubmitQuestion={handleTutorSubmit}
        />
      </motion.div>

      <ModuleCompleteResultsModal
        key={
          moduleCompleteModal
            ? `${moduleId}-${moduleCompleteModal.totalPointsEnd}-${moduleCompleteModal.xpGainedTotal}`
            : "module-complete-idle"
        }
        open={Boolean(moduleCompleteModal)}
        onContinue={handleModuleCompleteContinue}
        {...(moduleCompleteModal || {})}
      />

      <ConfirmModal
        open={showResetConfirm}
        title="Reset your code?"
        message="This will restore the starter template. Your step progress and points for this session will be cleared. You can continue from the dashboard later."
        onConfirm={confirmReset}
        onCancel={() => setShowResetConfirm(false)}
      />

      <ConfirmModal
        open={showBackConfirm}
        title="Leave this lesson?"
        message="Your step progress and code will be saved so you can pick up where you left off. Continue to the dashboard?"
        confirmLabel="Save & leave"
        cancelLabel="Stay"
        onConfirm={confirmNavigateBack}
        onCancel={() => setShowBackConfirm(false)}
      />
    </div>
  );
};

export default CodeEditor;
