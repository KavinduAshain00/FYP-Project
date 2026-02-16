import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ConfirmModal from "../ui/ConfirmModal";
import { AnimatePresence, motion as Motion } from "framer-motion";
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
} from "react-icons/fa";

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
    setMobileMenuOpen(false);
    navigate(path);
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
                  onClick={() => handleNavClick(link.path)}
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

export const GameLayout = ({
  children,
  showNavbar = true,
  className = "",
}) => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5]">
      {showNavbar && <GameNavbar />}
      <main>
        <div className={className}>{children}</div>
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
  GameLayout,
  PageHeader,
};
