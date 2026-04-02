/* eslint-disable react-refresh/only-export-components -- merged shell: cache context + route components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Navigate,
  Outlet,
  useLocation,
  useNavigationType,
} from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import AppSidebar from "./layout/AppSidebar";

// ─── Shell pages in-memory cache (Dashboard / Modules / Profile / Admin) ─────

const SHELL_PATHS = ["/dashboard", "/modules", "/profile", "/admin"];

function isShellPathname(pathname) {
  const p = (pathname || "").split("?")[0].replace(/\/$/, "") || "/";
  return SHELL_PATHS.some((route) => p === route || p.startsWith(`${route}/`));
}

export const ShellPagesCacheContext = createContext(null);

export function useShellPagesCache() {
  const ctx = useContext(ShellPagesCacheContext);
  if (!ctx) {
    throw new Error(
      "useShellPagesCache must be used inside ShellPagesCacheProvider",
    );
  }
  return ctx;
}

/**
 * In-memory cache for shell routes while the user stays in the app chrome.
 * Cleared when navigating outside those paths (e.g. editor, login).
 */
export function ShellPagesCacheProvider({ children }) {
  const location = useLocation();
  const cacheRef = useRef({
    dashboard: null,
    modules: null,
    profile: null,
    admin: null,
  });
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    const next = location.pathname;
    const prev = prevPathRef.current;
    if (isShellPathname(prev) && !isShellPathname(next)) {
      cacheRef.current = {
        dashboard: null,
        modules: null,
        profile: null,
        admin: null,
      };
    }
    prevPathRef.current = next;
  }, [location.pathname]);

  const peek = useCallback((key) => cacheRef.current[key] ?? null, []);
  const put = useCallback((key, value) => {
    cacheRef.current[key] = value;
  }, []);

  const value = { peek, put, isShellPathname };

  return (
    <ShellPagesCacheContext.Provider value={value}>
      {children}
    </ShellPagesCacheContext.Provider>
  );
}

const contentEase = [0.25, 0.1, 0.25, 1];

// ─── LoadingScreen ───────────────────────────────────────────────────────────

/**
 * Full-page or inline loading state with smooth entrance animation.
 */
export function LoadingScreen({
  message = "Loading…",
  subMessage = null,
  inline = false,
  className = "",
}) {
  const content = (
    <motion.div
      className="flex flex-col items-center"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: contentEase }}
    >
      <motion.div
        className="h-10 w-10 shrink-0 rounded-full border-2 border-blue-400 border-t-transparent"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.85, repeat: Infinity, ease: "linear" }}
        aria-hidden
      />
      <motion.p
        className="text-sm font-medium text-blue-50 mt-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.12, duration: 0.35, ease: contentEase }}
      >
        {message}
      </motion.p>
      {subMessage && (
        <motion.p
          className="text-xs text-blue-300 mt-1 max-w-xs text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.35, ease: contentEase }}
        >
          {subMessage}
        </motion.p>
      )}
    </motion.div>
  );

  if (inline) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-0 py-8 ${className}`}
        role="status"
        aria-live="polite"
        aria-label={message}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      className={`min-h-[50vh] flex flex-col items-center justify-center gap-0 text-center px-4 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      {content}
    </div>
  );
}

// ─── PageTransition ──────────────────────────────────────────────────────────

const MotionDiv = motion.div;
const pageTransitionDuration = 0.42;

const getVariants = (direction, navigationType) => {
  const isReplace = navigationType === "REPLACE";
  if (isReplace) {
    return {
      initial: { opacity: 0, scale: 0.992 },
      in: { opacity: 1, scale: 1 },
      out: { opacity: 0, scale: 0.992 },
    };
  }

  const isBack =
    direction === "back" || (direction == null && navigationType === "POP");
  const enterY = isBack ? -14 : 18;
  const exitY = isBack ? 12 : -14;

  return {
    initial: { opacity: 0, y: enterY },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: exitY },
  };
};

const pageTransitionTween = {
  type: "tween",
  ease: contentEase,
  duration: pageTransitionDuration,
};

/**
 * Smooth route transitions: fade + gentle vertical motion.
 * Respects navigation direction for subtle horizontal nudge (forward vs back).
 */
export function PageTransition({ children }) {
  const location = useLocation();
  const navigationType = useNavigationType();
  const direction = location.state?.direction;
  const variants = getVariants(direction, navigationType);

  return (
    <MotionDiv
      initial="initial"
      animate="in"
      exit="out"
      variants={variants}
      transition={pageTransitionTween}
      className="w-full min-h-screen bg-neutral-900"
      style={{
        width: "100%",
        minHeight: "100vh",
      }}
    >
      {children}
    </MotionDiv>
  );
}

// ─── AppShellLayout ──────────────────────────────────────────────────────────

/**
 * Persistent app chrome: sidebar stays mounted; only the main pane transitions.
 */
export function AppShellLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-neutral-900 text-blue-100">
      <AppSidebar />
      <main className="min-h-screen lg:pl-64 transition-[padding] duration-300 ease-out">
        <ShellPagesCacheProvider>
          <AnimatePresence mode="wait" initial={false}>
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </ShellPagesCacheProvider>
      </main>
    </div>
  );
}

// ─── ProtectedRoute ──────────────────────────────────────────────────────────

export function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <motion.div
        className="min-h-screen flex flex-col items-center justify-center bg-neutral-900 text-blue-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: contentEase }}
      >
        <LoadingScreen
          message="Checking your account…"
          subMessage="Taking you to your content"
          className="!min-h-0"
        />
      </motion.div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !user?.isAdmin) {
    toast.error("You need admin access to view this page.");
    return <Navigate to="/dashboard" replace />;
  }

  return children ?? <Outlet />;
}
