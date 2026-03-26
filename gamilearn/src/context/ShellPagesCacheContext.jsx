import { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const ShellPagesCacheContext = createContext(null);

const SHELL_PATHS = ['/dashboard', '/modules', '/profile', '/admin'];

function isShellPathname(pathname) {
  const p = (pathname || '').split('?')[0].replace(/\/$/, '') || '/';
  return SHELL_PATHS.some((route) => p === route || p.startsWith(`${route}/`));
}

/**
 * In-memory cache for Dashboard / Modules / Profile / Admin while the user stays in the app shell.
 * Cleared when navigating to any route outside those four (e.g. editor, login).
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
    <ShellPagesCacheContext.Provider value={value}>{children}</ShellPagesCacheContext.Provider>
  );
}

export function useShellPagesCache() {
  const ctx = useContext(ShellPagesCacheContext);
  if (!ctx) {
    throw new Error('useShellPagesCache must be used inside ShellPagesCacheProvider');
  }
  return ctx;
}
