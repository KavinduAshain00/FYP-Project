import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import ConfirmModal from "../ui/ConfirmModal";
import { useAuth } from "../../context/AuthContext";
import {
  FaBars,
  FaBolt,
  FaCrown,
  FaDoorOpen,
  FaGamepad,
  FaHome,
  FaLayerGroup,
  FaShieldAlt,
  FaTimes,
  FaUser,
  FaUserCircle,
} from "react-icons/fa";

const ROUTE_ORDER = ["/dashboard", "/modules", "/profile", "/admin", "/editor"];

const getRouteDepth = (pathname) => {
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) return 0;
  if (
    pathname === "/modules" ||
    pathname === "/profile" ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/")
  )
    return 1;
  return 2;
};

const getRouteOrderIndex = (pathname) => {
  const base = pathname.split("/").slice(0, 2).join("/") || pathname;
  const idx = ROUTE_ORDER.findIndex(
    (p2) => base === p2 || pathname.startsWith(p2 + "/"),
  );
  return idx >= 0 ? idx : ROUTE_ORDER.length;
};

const getNavigationDirection = (currentPath, targetPath) => {
  const currentDepth = getRouteDepth(currentPath);
  const targetDepth = getRouteDepth(targetPath);
  if (targetDepth < currentDepth) return "back";
  if (targetDepth > currentDepth) return "forward";
  const currentOrder = getRouteOrderIndex(currentPath);
  const targetOrder = getRouteOrderIndex(targetPath);
  return targetOrder < currentOrder ? "back" : "forward";
};

const sidebarEase = [0.25, 0.1, 0.25, 1];

const navItemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.03 * i, duration: 0.3, ease: sidebarEase },
  }),
};

function LogoutControl({ onNavigate, compact = false }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    onNavigate?.();
    navigate("/login");
  };

  return (
    <>
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        whileHover={{ scale: 1.01 }}
        onClick={() => setShowLogoutConfirm(true)}
        className={`w-full rounded-2xl text-sm font-semibold transition-colors shadow-md shadow-blue-950/25 ${
          compact
            ? "px-3 py-2.5 bg-blue-700/95 text-black hover:bg-blue-600"
            : "px-4 py-3 bg-blue-700/95 text-black hover:bg-blue-600"
        }`}
      >
        <span className="inline-flex items-center gap-2">
          <FaDoorOpen className="text-xs" /> Log out
        </span>
      </motion.button>
      <ConfirmModal
        open={showLogoutConfirm}
        title="Log out?"
        message="Are you sure you want to log out?"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
}

function SidebarContent({ onNavigate, isActive, mobile = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const navLinks = [
    { path: "/dashboard", label: "Dashboard", caption: "Overview", icon: FaHome },
    {
      path: "/modules",
      label: "Modules",
      caption: "All modules",
      icon: FaLayerGroup,
    },
    {
      path: "/profile",
      label: "Profile",
      caption: "Account and achievements",
      icon: FaUser,
    },
    ...(user?.isAdmin
      ? [
          {
            path: "/admin",
            label: "Admin",
            caption: "Manage GamiLearn",
            icon: FaShieldAlt,
          },
        ]
      : []),
  ];

  const handleClick = (path) => {
    const direction = getNavigationDirection(location.pathname, path);
    navigate(path, { state: { direction } });
    onNavigate?.();
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={`shrink-0 ${mobile ? "px-3 pt-3 pb-2" : "px-3 pt-4 pb-3"}`}
      >
        <Link
          to="/dashboard"
          onClick={() => onNavigate?.()}
          className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-blue-900 to-blue-900 px-3 py-3 text-blue-50 transition-colors shadow-lg shadow-black/25"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-700 to-blue-700 text-blue-200">
            <FaGamepad className="text-[17px]" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg leading-tight font-extrabold tracking-tight text-blue-50">
              GamiLearn
            </p>
            <p className="text-[11px] text-blue-200 leading-snug mt-1">
              AI-Guided Game Development Learning Platform
            </p>
          </div>
        </Link>
      </div>

      <div className="px-4 pb-2 shrink-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-300">
          Workspace
        </p>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-1.5 space-y-2">
        {navLinks.map((link, i) => {
          const active = isActive(link.path);
          return (
            <motion.button
              key={link.path}
              type="button"
              custom={i}
              variants={navItemVariants}
              initial="hidden"
              animate="show"
              onClick={() => handleClick(link.path)}
              className={`w-full rounded-2xl px-3 py-3 text-left transition-colors ${
                active
                  ? "bg-blue-400 text-black shadow-md shadow-blue-400/30"
                  : "bg-blue-900 text-blue-200 hover:bg-blue-700 hover:text-blue-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    active ? "bg-neutral-900/40" : "bg-blue-700 text-blue-300"
                  }`}
                >
                  <link.icon className="text-sm" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{link.label}</p>
                  <p
                    className={`truncate text-[11px] ${active ? "text-blue-950" : "text-blue-300"}`}
                  >
                    {link.caption}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </nav>

      <div className="px-3 pb-3 pt-2 mt-auto shrink-0">
        {user && (
          <div className="mb-3 rounded-2xl bg-blue-900 p-3">
            <div className="flex items-center gap-3 min-w-0">
              {user.avatarUrl?.trim() ? (
                <img
                  src={user.avatarUrl.trim()}
                  alt={
                    user.name
                      ? `${user.name} profile photo`
                      : "Your profile photo"
                  }
                  className="h-14 w-14 shrink-0 rounded-xl object-cover object-center"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-blue-100">
                  <FaUserCircle className="text-[2.35rem] -mb-0.5" aria-hidden />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-blue-50">
                  {user.name}
                </p>
                <div className="mt-1 flex items-center gap-2 text-[12px]">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-blue-900 px-2 py-0.5 text-blue-50 font-semibold">
                    <FaBolt className="text-[9px]" />{" "}
                    {user.levelInfo?.totalPoints ?? user.totalPoints ?? 0}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-blue-700 px-2 py-0.5 text-blue-200 font-semibold">
                    <FaCrown className="text-[9px]" /> Lv.
                    {user.levelInfo?.level ?? user.level ?? 1}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <LogoutControl onNavigate={onNavigate} compact={mobile} />
      </div>
    </div>
  );
}

export default function AppSidebar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileOpen]);

  const isActive = (path) =>
    path === "/admin"
      ? location.pathname === "/admin" ||
        location.pathname.startsWith("/admin/")
      : location.pathname === path;
  const closeMobile = () => setMobileOpen(false);

  const drawerVariants = {
    closed: { x: "-100%", transition: { duration: 0.3, ease: sidebarEase } },
    open: { x: 0, transition: { duration: 0.34, ease: sidebarEase } },
  };

  const backdropVariants = {
    closed: { opacity: 0, pointerEvents: "none" },
    open: { opacity: 1, pointerEvents: "auto" },
  };

  return (
    <>
      <header className="lg:hidden sticky top-0 z-30 flex h-14 items-center justify-between px-4 bg-blue-900/95 backdrop-blur-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-blue-200 shrink-0">
            <FaGamepad className="text-sm" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-blue-50 leading-tight">
              GamiLearn
            </p>
            <p className="truncate text-[10px] text-blue-200 leading-tight">
              AI-Guided Game Development
            </p>
          </div>
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          onClick={() => setMobileOpen(true)}
          className="rounded-xl bg-blue-800 p-2.5 text-blue-200 hover:bg-blue-700 hover:text-blue-50 transition-colors"
          aria-label="Open menu"
        >
          <FaBars className="text-lg" />
        </motion.button>
      </header>

      <aside className="hidden lg:block fixed left-0 top-0 z-40 h-screen w-72 bg-blue-900 shadow-2xl shadow-black/40">
        <SidebarContent onNavigate={closeMobile} isActive={isActive} />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              role="presentation"
              variants={backdropVariants}
              initial="closed"
              animate="open"
              exit="closed"
              transition={{ duration: 0.24 }}
              className="fixed inset-0 z-40 bg-neutral-900/70 backdrop-blur-sm lg:hidden"
              onClick={closeMobile}
            />
            <motion.aside
              variants={drawerVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="fixed left-0 top-0 z-50 flex h-full w-[min(22rem,90vw)] flex-col bg-blue-900 shadow-2xl shadow-black/50 lg:hidden"
            >
              <div className="flex items-center justify-between px-3 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-blue-200">
                    <FaGamepad className="text-sm" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-blue-50 leading-tight">
                      GamiLearn
                    </p>
                    <p className="text-[10px] text-blue-200 leading-tight">
                      AI-Guided Game Development
                    </p>
                  </div>
                </div>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  onClick={closeMobile}
                  className="rounded-xl p-2.5 text-blue-300 hover:bg-blue-800 hover:text-blue-50"
                  aria-label="Close menu"
                >
                  <FaTimes className="text-lg" />
                </motion.button>
              </div>
              <div className="flex flex-1 min-h-0 flex-col">
                <SidebarContent
                  onNavigate={closeMobile}
                  isActive={isActive}
                  mobile
                />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
