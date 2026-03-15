import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ConfirmModal from "../ui/ConfirmModal";
import { AnimatePresence, motion as Motion } from "framer-motion";

const ROUTE_ORDER = ["/dashboard", "/modules", "/profile", "/admin", "/editor", "/custom-game", "/game-planning", "/multiplayer-studio"];

const getRouteDepth = (pathname) => {
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) return 0;
  if (pathname === "/modules" || pathname === "/profile" || pathname === "/admin") return 1;
  return 2;
};

const getRouteOrderIndex = (pathname) => {
  const base = pathname.split("/").slice(0, 2).join("/") || pathname;
  const idx = ROUTE_ORDER.findIndex((p) => base === p || pathname.startsWith(p + "/"));
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
    <nav className="bg-[#111620] border-b border-[#252c3a] sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 text-[#d8d0c4] hover:text-white transition-colors"
          >
            <span className="w-8 h-8 flex items-center justify-center bg-[#1c2230] border border-[#2e3648] text-[#9a9080] rounded-lg">
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
                className={`flex items-center gap-2 px-3 py-2 text-[13px] font-medium transition-colors rounded-lg ${
                  isActive(link.path)
                    ? "bg-[#1c2230] text-white"
                    : "text-[#9a9080] hover:text-[#d8d0c4] hover:bg-[#161c28]"
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
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#1c2230] border border-[#2e3648] text-[#c8a040] text-[12px] font-medium rounded-lg">
                  <FaBolt className="text-[10px]" />
                  {user.totalPoints ?? 0}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#1c2230] border border-[#2e3648] text-[#9a9080] text-[12px] font-medium rounded-lg">
                  <FaCrown className="text-[10px]" />
                  Lv.{user.level ?? 1}
                </span>
              </>
            )}
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-[#9a9080] hover:text-white hover:bg-[#161c28] rounded-lg transition-colors"
            >
              <FaDoorOpen className="text-[11px]" />
              Logout
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#9a9080] hover:text-white hover:bg-[#1c2230] rounded-lg transition-colors"
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
            className="md:hidden border-t border-[#252c3a] bg-[#111620]"
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
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-lg text-left ${
                    isActive(link.path)
                      ? "bg-[#1c2230] text-white"
                      : "text-[#9a9080] hover:bg-[#161c28]"
                  }`}
                >
                  <link.icon className="text-[11px] opacity-80" />
                  {link.label}
                </button>
              ))}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium text-[#9a9080] hover:bg-[#161c28] hover:text-white rounded-lg"
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
      <div className="bg-[#111620] border border-[#252c3a] p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <GameAvatar
            src={user?.avatarUrl}
            size="md"
            level={level}
            animated={false}
            className="!rounded-lg border border-[#2e3648]"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#d8d0c4] text-sm truncate">
              {user?.name || "User"}
            </p>
            <p className="text-[11px] text-[#706858] truncate">{user?.email}</p>
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

      <div className="bg-[#111620] border border-[#252c3a] p-4 rounded-xl">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#706858] mb-3">
          Stats
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 bg-[#161c28] border border-[#252c3a] rounded-lg">
            <p className="text-[10px] text-[#706858] uppercase">XP</p>
            <p className="text-sm font-semibold text-[#d8d0c4]">{totalPoints}</p>
          </div>
          <div className="p-2.5 bg-[#161c28] border border-[#252c3a] rounded-lg">
            <p className="text-[10px] text-[#706858] uppercase">Level</p>
            <p className="text-sm font-semibold text-[#d8d0c4]">{level}</p>
          </div>
          <div className="p-2.5 bg-[#161c28] border border-[#252c3a] rounded-lg">
            <p className="text-[10px] text-[#706858] uppercase">Quests</p>
            <p className="text-sm font-semibold text-[#d8d0c4]">
              {stats.completedModules ?? 0}
            </p>
          </div>
          <div className="p-2.5 bg-[#161c28] border border-[#252c3a] rounded-lg">
            <p className="text-[10px] text-[#706858] uppercase">Badges</p>
            <p className="text-sm font-semibold text-[#d8d0c4]">
              {stats.achievements ?? 0}
            </p>
          </div>
        </div>
      </div>

      {showAchievements && achievements.length > 0 && (
        <div className="bg-[#111620] border border-[#252c3a] p-4 rounded-xl">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#706858] mb-3">
            Recent badges
          </p>
          <div className="space-y-2">
            {achievements.slice(0, 3).map((ach, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 p-2 bg-[#161c28] border border-[#252c3a] rounded-lg"
              >
                <span className="w-7 h-7 flex items-center justify-center bg-[#1c2230] border border-[#2e3648] text-[#c8a040] rounded-lg">
                  <FaTrophy className="text-[10px]" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-[#d8d0c4] truncate">
                    {ach.name}
                  </p>
                  <p className="text-[10px] text-[#706858] truncate">
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

export const GameLayout = ({
  children,
  showNavbar = true,
  showParticles = false,
  showSidebar = false,
  sidebarProps = {},
  className = "",
}) => {
  return (
    <div className="min-h-screen bg-[#0d1017] text-[#d8d0c4]">
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
      className={`border-b border-[#252c3a] bg-[#111620] ${className}`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {Icon && (
              <span className="w-10 h-10 flex items-center justify-center bg-[#1c2230] border border-[#2e3648] text-[#9a9080] rounded-xl">
                <Icon className="text-lg" />
              </span>
            )}
            <div>
              {badge && (
                <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-[#706858] mb-1">
                  {badge}
                </span>
              )}
              <h1 className="text-xl font-semibold text-[#d8d0c4] tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-0.5 text-[13px] text-[#706858]">{subtitle}</p>
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
