import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ConfirmModal from "../ui/ConfirmModal";
import { AnimatePresence, motion as Motion } from "framer-motion";

/** Route order for transition direction: lower index = "back" when navigating to it */
const ROUTE_ORDER = ["/dashboard", "/modules", "/profile", "/admin", "/editor", "/custom-game", "/game-planning", "/multiplayer-studio"];

const getRouteDepth = (pathname) => {
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) return 0;
  if (pathname === "/modules" || pathname === "/profile" || pathname === "/admin") return 1;
  return 2; // editor, custom-game, game-planning, multiplayer-studio
};

const getRouteOrderIndex = (pathname) => {
  const base = pathname.split("/").slice(0, 2).join("/") || pathname;
  const idx = ROUTE_ORDER.findIndex((p) => base === p || pathname.startsWith(p + "/"));
  return idx >= 0 ? idx : ROUTE_ORDER.length;
};

/** Returns "back" or "forward" for page transition direction when navigating from currentPath to targetPath */
const getNavigationDirection = (currentPath, targetPath) => {
  const currentDepth = getRouteDepth(currentPath);
  const targetDepth = getRouteDepth(targetPath);
  if (targetDepth < currentDepth) return "back";
  if (targetDepth > currentDepth) return "forward";
  const currentOrder = getRouteOrderIndex(currentPath);
  const targetOrder = getRouteOrderIndex(targetPath);
  return targetOrder < currentOrder ? "back" : "forward";
};
import { useAuth } from "../../context/AuthContext";
import {
  FaBars,
  FaBolt,
  FaCrown,
  FaDoorOpen,
  FaGamepad,
  FaHome,
  FaLayerGroup,
  FaMap,
  FaShieldAlt,
  FaTimes,
  FaTrophy,
  FaUser,
} from "react-icons/fa";
import {
  ParticleBackground,
  XPBar,
  GameAvatar,
} from "../ui/GameUI";

/* ========================================
   NAVBAR – minimal bar, flat colors
   ======================================== */
export const GameNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navLinks = [
    { path: "/dashboard", label: "Dashboard", icon: FaHome },
    { path: "/modules", label: "Quests", icon: FaLayerGroup },
    { path: "/profile", label: "Profile", icon: FaUser },
    ...(user?.isAdmin ? [{ path: "/admin", label: "Admin", icon: FaShieldAlt }] : []),
  ];

  const isActive = (path) => location.pathname === path;

  const handleNavClick = (path) => {
    const direction = getNavigationDirection(location.pathname, path);
    navigate(path, { state: { direction } });
  };

  const handleLogout = () => setShowLogoutConfirm(true);
  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    setMobileMenuOpen(false);
    navigate("/login");
  };

  return (
    <nav className="bg-[#0c0c0c] border-b border-[#1f1f1f] sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 text-[#e5e5e5] hover:text-white transition-colors"
          >
            <span className="w-8 h-8 flex items-center justify-center bg-[#1a1a1a] border border-[#2a2a2a] text-[#a3a3a3]">
              <FaGamepad className="text-sm" />
            </span>
            <span className="font-semibold text-[15px] tracking-tight">
              GamiLearn
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <button
                key={link.path}
                type="button"
                onClick={() => handleNavClick(link.path)}
                className={`flex items-center gap-2 px-3 py-2 text-[13px] font-medium transition-colors rounded ${
                  isActive(link.path)
                    ? "bg-[#1a1a1a] text-white"
                    : "text-[#a3a3a3] hover:text-[#e5e5e5] hover:bg-[#141414]"
                }`}
              >
                <link.icon className="text-[11px] opacity-80" />
                {link.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {user && (
              <>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#141414] border border-[#262626] text-[#a3a3a3] text-[12px] font-medium">
                  <FaBolt className="text-[10px]" />
                  {user.totalPoints ?? 0}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#141414] border border-[#262626] text-[#a3a3a3] text-[12px] font-medium">
                  <FaCrown className="text-[10px]" />
                  Lv.{user.level ?? 1}
                </span>
              </>
            )}
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-[#a3a3a3] hover:text-white hover:bg-[#141414] rounded transition-colors"
            >
              <FaDoorOpen className="text-[11px]" />
              Logout
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#a3a3a3] hover:text-white hover:bg-[#1a1a1a] rounded transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <Motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-[#1f1f1f] bg-[#0c0c0c]"
          >
            <div className="px-4 py-3 space-y-0.5">
              {navLinks.map((link) => (
                <button
                  key={link.path}
                  type="button"
                  onClick={() => {
                    handleNavClick(link.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded text-left ${
                    isActive(link.path)
                      ? "bg-[#1a1a1a] text-white"
                      : "text-[#a3a3a3] hover:bg-[#141414]"
                  }`}
                >
                  <link.icon className="text-[11px] opacity-80" />
                  {link.label}
                </button>
              ))}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium text-[#a3a3a3] hover:bg-[#141414] hover:text-white rounded"
              >
                <FaDoorOpen className="text-[11px]" />
                Logout
              </button>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
      <ConfirmModal
        open={showLogoutConfirm}
        title="Log out?"
        message="Are you sure you want to log out?"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </nav>
  );
};

/* ========================================
   SIDEBAR – flat panels, no neon
   ======================================== */
export const GameSidebar = ({
  user,
  stats = {},
  showXPBar = true,
  showAchievements = false,
  achievements = [],
}) => {
  const totalPoints = user?.totalPoints || 0;
  const level = user?.level || 1;

  return (
    <aside className="w-64 shrink-0 space-y-4">
      <div className="bg-[#0c0c0c] border border-[#1f1f1f] p-4">
        <div className="flex items-center gap-3">
          <GameAvatar
            src={user?.avatarUrl}
            size="md"
            level={level}
            animated={false}
            className="!rounded border border-[#262626]"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#e5e5e5] text-sm truncate">
              {user?.name || "User"}
            </p>
            <p className="text-[11px] text-[#737373] truncate">{user?.email}</p>
          </div>
        </div>
        {showXPBar && (
          <div className="mt-4">
            <XPBar
              current={totalPoints % 200}
              max={200}
              label={`XP to Lv.${level + 1}`}
              variant="xp"
              size="sm"
            />
          </div>
        )}
      </div>

      <div className="bg-[#0c0c0c] border border-[#1f1f1f] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#737373] mb-3">
          Stats
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 bg-[#141414] border border-[#262626]">
            <p className="text-[10px] text-[#737373] uppercase">XP</p>
            <p className="text-sm font-semibold text-[#e5e5e5]">{totalPoints}</p>
          </div>
          <div className="p-2.5 bg-[#141414] border border-[#262626]">
            <p className="text-[10px] text-[#737373] uppercase">Level</p>
            <p className="text-sm font-semibold text-[#e5e5e5]">{level}</p>
          </div>
          <div className="p-2.5 bg-[#141414] border border-[#262626]">
            <p className="text-[10px] text-[#737373] uppercase">Quests</p>
            <p className="text-sm font-semibold text-[#e5e5e5]">
              {stats.completedModules ?? 0}
            </p>
          </div>
          <div className="p-2.5 bg-[#141414] border border-[#262626]">
            <p className="text-[10px] text-[#737373] uppercase">Badges</p>
            <p className="text-sm font-semibold text-[#e5e5e5]">
              {stats.achievements ?? 0}
            </p>
          </div>
        </div>
      </div>

      {showAchievements && achievements.length > 0 && (
        <div className="bg-[#0c0c0c] border border-[#1f1f1f] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#737373] mb-3">
            Recent badges
          </p>
          <div className="space-y-2">
            {achievements.slice(0, 3).map((ach, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 p-2 bg-[#141414] border border-[#262626]"
              >
                <span className="w-7 h-7 flex items-center justify-center bg-[#1a1a1a] border border-[#262626] text-[#737373]">
                  <FaTrophy className="text-[10px]" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-[#e5e5e5] truncate">
                    {ach.name}
                  </p>
                  <p className="text-[10px] text-[#737373] truncate">
                    {ach.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};

/* ========================================
   LAYOUT WRAPPER – no particles, no glow
   ======================================== */
export const GameLayout = ({
  children,
  showNavbar = true,
  showParticles = false,
  showSidebar = false,
  sidebarProps = {},
  className = "",
}) => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5]">
      {showParticles && <ParticleBackground count={12} />}
      {showNavbar && <GameNavbar />}
      <main className={showNavbar ? "" : ""}>
        {showSidebar ? (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex gap-6">
              <GameSidebar {...sidebarProps} />
              <div className={`flex-1 min-w-0 ${className}`}>{children}</div>
            </div>
          </div>
        ) : (
          <div className={className}>{children}</div>
        )}
      </main>
    </div>
  );
};

/* ========================================
   PAGE HEADER – simple title block
   ======================================== */
export const PageHeader = ({
  title,
  subtitle,
  icon: Icon,
  badge,
  actions,
  className = "",
}) => {
  return (
    <div
      className={`border-b border-[#1f1f1f] bg-[#0c0c0c] ${className}`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {Icon && (
              <span className="w-10 h-10 flex items-center justify-center bg-[#141414] border border-[#262626] text-[#a3a3a3]">
                <Icon className="text-lg" />
              </span>
            )}
            <div>
              {badge && (
                <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-[#737373] mb-1">
                  {badge}
                </span>
              )}
              <h1 className="text-xl font-semibold text-[#e5e5e5] tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-0.5 text-[13px] text-[#737373]">{subtitle}</p>
              )}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
};

export default {
  GameNavbar,
  GameSidebar,
  GameLayout,
  PageHeader,
};
