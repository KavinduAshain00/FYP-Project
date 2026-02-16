import { AnimatePresence, motion } from "framer-motion"; // eslint-disable-line no-unused-vars
import { useState } from "react";
import {
  FaBolt,
  FaCrown,
  FaFire,
  FaGem,
  FaHeart,
  FaLock,
  FaShieldAlt,
  FaStar,
  FaTrophy,
} from "react-icons/fa";

// Helper to generate random particles (called once on mount)
const generateParticles = (count) =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 10,
    duration: 15 + Math.random() * 20,
    size: 2 + Math.random() * 3,
  }));

/* ========================================
   PARTICLE BACKGROUND
   ======================================== */
export const ParticleBackground = ({ count = 30, className = "" }) => {
  // Use lazy state initializer to only generate particles once
  const [particles] = useState(() => generateParticles(count));

  return (
    <div className={`particles-bg ${className}`}>
      {particles.map((p) => (
        <span
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
};

/* ========================================
   XP BAR / PROGRESS BAR
   ======================================== */
export const XPBar = ({
  current,
  max,
  label,
  showLabel = true,
  variant = "xp",
  size = "md",
  animated = true,
  className = "",
}) => {
  const percentage = Math.min((current / max) * 100, 100);

  const sizeClasses = {
    sm: "h-2",
    md: "h-4",
    lg: "h-6",
  };

  const variantClasses = {
    xp: "stat-bar-xp",
    hp: "stat-bar-hp",
    mp: "stat-bar-mp",
    shield: "stat-bar-shield",
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && label && (
        <div className="flex justify-between items-center mb-2 text-sm">
          <span className="text-slate-300 font-medium">{label}</span>
          <span className="text-neon-gold font-bold">
            {current} / {max}
          </span>
        </div>
      )}
      <div
        className={`stat-bar ${variantClasses[variant]} ${sizeClasses[size]}`}
      >
        <motion.div
          className="stat-bar-fill"
          initial={animated ? { width: 0 } : false}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

/* ========================================
   LEVEL BADGE
   ======================================== */
export const LevelBadge = ({
  level,
  size = "md",
  animated = true,
  className = "",
}) => {
  const sizeClasses = {
    sm: "w-10 h-10 text-sm",
    md: "w-14 h-14 text-lg",
    lg: "w-20 h-20 text-2xl",
  };

  return (
    <motion.div
      className={`relative flex items-center justify-center rounded-xl font-bold ${sizeClasses[size]} ${className}`}
      style={{
        background: "rgba(255, 215, 0, 0.2)",
        border: "2px solid rgba(255, 215, 0, 0.5)",
      }}
      animate={animated ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <FaCrown className="absolute -top-3 text-neon-gold text-sm" />
      <span className="text-neon-gold">{level}</span>
    </motion.div>
  );
};

/* ========================================
   STAT CARD
   ======================================== */
export const StatCard = ({
  // eslint-disable-next-line no-unused-vars
  icon: Icon,
  label,
  value,
  subValue,
  color = "cyan",
  className = "",
}) => {
  const colorClasses = {
    cyan: {
      bg: "rgba(0, 245, 255, 0.1)",
      border: "rgba(0, 245, 255, 0.3)",
      text: "text-neon-cyan",
    },
    purple: {
      bg: "rgba(185, 79, 255, 0.1)",
      border: "rgba(185, 79, 255, 0.3)",
      text: "text-neon-purple",
    },
    gold: {
      bg: "rgba(255, 215, 0, 0.1)",
      border: "rgba(255, 215, 0, 0.3)",
      text: "text-neon-gold",
    },
    green: {
      bg: "rgba(0, 255, 136, 0.1)",
      border: "rgba(0, 255, 136, 0.3)",
      text: "text-neon-green",
    },
    orange: {
      bg: "rgba(255, 107, 53, 0.1)",
      border: "rgba(255, 107, 53, 0.3)",
      text: "text-neon-orange",
    },
  };

  const colors = colorClasses[color];

  return (
    <motion.div
      className={`game-card p-4 transition-all duration-300 ${className}`}
      style={{
        background: colors.bg,
        borderColor: colors.border,
      }}
      whileHover={{ scale: 1.02, y: -2 }}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors.text}`}
          style={{ background: colors.bg }}
        >
          <Icon className="text-xl" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <p className={`text-2xl font-bold ${colors.text}`}>{value}</p>
          {subValue && <p className="text-xs text-slate-500">{subValue}</p>}
        </div>
      </div>
    </motion.div>
  );
};

/* ========================================
   ACHIEVEMENT BADGE
   ======================================== */
export const AchievementBadge = ({
  name,
  description,
  icon,
  earned = false,
  rarity = "common",
  size = "md",
  onClick,
  className = "",
}) => {
  const rarityColors = {
    common: { bg: "rgba(148, 163, 184, 0.2)", border: "#94a3b8" },
    uncommon: { bg: "rgba(0, 255, 136, 0.2)", border: "#00ff88" },
    rare: { bg: "rgba(77, 124, 255, 0.2)", border: "#4d7cff" },
    epic: { bg: "rgba(185, 79, 255, 0.2)", border: "#b94fff" },
    legendary: { bg: "rgba(255, 215, 0, 0.2)", border: "#ffd700" },
  };

  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-5",
  };

  const iconSizes = {
    sm: "w-10 h-10 text-lg",
    md: "w-14 h-14 text-2xl",
    lg: "w-18 h-18 text-3xl",
  };

  const colors = rarityColors[rarity];

  const renderIcon = () => {
    if (typeof icon === "string" && icon.startsWith("http")) {
      return (
        <img src={icon} alt={name} className="w-full h-full object-contain" />
      );
    }
    const IconComponent = icon || FaTrophy;
    return <IconComponent />;
  };

  return (
    <motion.div
      className={`achievement-card ${earned ? "unlocked" : "locked"} cursor-pointer ${sizeClasses[size]} ${className}`}
      style={{
        background: earned ? colors.bg : "rgba(30, 41, 59, 0.5)",
        borderColor: earned ? colors.border : "rgba(255, 255, 255, 0.1)",
      }}
      whileHover={{ scale: earned ? 1.05 : 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      <div
        className={`achievement-icon ${iconSizes[size]} ${!earned && "grayscale opacity-50"}`}
        style={{
          background: earned ? colors.bg : "rgba(255, 255, 255, 0.05)",
          borderColor: earned ? colors.border : "rgba(255, 255, 255, 0.1)",
        }}
      >
        {!earned ? <FaLock className="text-slate-500" /> : renderIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`font-bold truncate ${earned ? "text-white" : "text-slate-500"}`}
        >
          {name}
        </p>
        <p
          className={`text-xs truncate ${earned ? "text-slate-300" : "text-slate-600"}`}
        >
          {description}
        </p>
        <span
          className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
          style={{
            background: colors.bg,
            color: colors.border,
            border: `1px solid ${colors.border}`,
          }}
        >
          {rarity}
        </span>
      </div>
    </motion.div>
  );
};

/* ========================================
   QUEST CARD
   ======================================== */
export const QuestCard = ({
  title,
  description,
  difficulty,
  category,
  progress,
  maxProgress,
  xpReward,
  objectives,
  status = "available", // available, active, completed, locked
  onClick,
  className = "",
}) => {
  const difficultyColors = {
    beginner: {
      badge: "bg-neon-green/20 text-neon-green border-neon-green/40",
      icon: FaStar,
    },
    intermediate: {
      badge: "bg-neon-gold/20 text-neon-gold border-neon-gold/40",
      icon: FaFire,
    },
    advanced: {
      badge: "bg-hp-red/20 text-hp-red border-hp-red/40",
      icon: FaGem,
    },
  };

  const statusStyles = {
    available: {
      border: "border-white/20 hover:border-neon-cyan/50",
      bg: "bg-white/5",
    },
    active: {
      border: "border-neon-cyan/50 hover:border-neon-cyan",
      bg: "bg-neon-cyan/10",
    },
    completed: { border: "border-neon-green/50", bg: "bg-neon-green/10" },
    locked: { border: "border-white/10", bg: "bg-white/5 opacity-60" },
  };

  const diff = difficultyColors[difficulty] || difficultyColors.beginner;
  const style = statusStyles[status];
  const progressPercent = maxProgress ? (progress / maxProgress) * 100 : 0;

  return (
    <motion.div
      className={`game-card p-5 rounded-2xl border-2 ${style.border} ${style.bg} cursor-pointer transition-all ${className}`}
      whileHover={status !== "locked" ? { scale: 1.02, y: -4 } : {}}
      whileTap={status !== "locked" ? { scale: 0.98 } : {}}
      onClick={status !== "locked" ? onClick : undefined}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`px-2 py-1 rounded-lg text-xs font-bold border ${diff.badge} flex items-center gap-1`}
          >
            <diff.icon className="text-[10px]" />
            {difficulty}
          </span>
          {category && (
            <span className="px-2 py-1 rounded-lg bg-white/10 text-slate-400 text-xs capitalize">
              {category.replace("-", " ")}
            </span>
          )}
        </div>
        {status === "completed" && (
          <span className="px-2 py-1 rounded-lg bg-neon-green/20 text-neon-green text-xs font-bold border border-neon-green/40">
            ✓ DONE
          </span>
        )}
        {status === "active" && (
          <span className="px-2 py-1 rounded-lg bg-neon-cyan/20 text-neon-cyan text-xs font-bold border border-neon-cyan/40 animate-pulse">
            ACTIVE
          </span>
        )}
      </div>

      {/* Title & Description */}
      <h3
        className={`font-bold text-lg mb-2 ${status === "locked" ? "text-slate-500" : "text-white"}`}
      >
        {title}
      </h3>
      <p
        className={`text-sm line-clamp-2 ${status === "locked" ? "text-slate-600" : "text-slate-400"}`}
      >
        {description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {objectives > 0 && <span>{objectives} tasks</span>}
        </div>
        {xpReward && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-neon-gold/10 border border-neon-gold/30">
            <FaBolt className="text-neon-gold text-xs" />
            <span className="text-neon-gold font-bold text-xs">
              +{xpReward} XP
            </span>
          </div>
        )}
      </div>

      {/* Progress bar for in-progress quests */}
      {(status === "active" || status === "completed") && maxProgress && (
        <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background:
                status === "completed"
                  ? "var(--neon-green)"
                  : "var(--neon-cyan)",
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}
    </motion.div>
  );
};

/* ========================================
   GLOW CARD
   ======================================== */
export const GlowCard = ({
  children,
  color = "cyan",
  hover = true,
  className = "",
  ...props
}) => {
  const colorClasses = {
    cyan: "game-card",
    purple: "game-card-purple",
    gold: "game-card-gold",
  };

  return (
    <motion.div
      className={`${colorClasses[color]} p-6 ${className}`}
      whileHover={hover ? { scale: 1.01, y: -2 } : {}}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/* ========================================
   GAME BUTTON
   ======================================== */
export const GameButton = ({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  className = "",
  ...props
}) => {
  const variantClasses = {
    primary: "game-btn",
    cyan: "game-btn",
    purple: "game-btn-purple",
    gold: "game-btn-gold",
    green: "game-btn-green",
    danger: "game-btn-danger",
    outline: "game-btn-outline",
    ghost: "game-btn-ghost",
    orange: "game-btn-gold", // alias
  };

  const sizeClasses = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
  };

  return (
    <motion.button
      className={`
        ${variantClasses[variant]} 
        ${sizeClasses[size]} 
        ${fullWidth ? "w-full" : ""} 
        ${className}
      `}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      {...props}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {Icon && <Icon className="text-lg" />}
          {children}
        </>
      )}
    </motion.button>
  );
};

/* ========================================
   FLOATING ACTION INDICATOR
   ======================================== */
export const FloatingXP = ({ amount, x, y }) => {
  return (
    <motion.div
      className="fixed pointer-events-none z-50 flex items-center gap-1 px-3 py-1.5 rounded-full bg-neon-gold/20 border border-neon-gold/50"
      style={{ left: x, top: y }}
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 0, y: -50, scale: 1.2 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      <FaStar className="text-neon-gold text-sm" />
      <span className="text-neon-gold font-bold text-sm">+{amount} XP</span>
    </motion.div>
  );
};

/* ========================================
   GAME AVATAR
   ======================================== */
export const GameAvatar = ({
  src,
  alt = "Avatar",
  size = "md",
  level,
  online = false,
  animated = false,
  className = "",
}) => {
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-24 h-24",
    xl: "w-32 h-32",
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <div
        className={`avatar-frame ${animated ? "avatar-frame-animated" : ""} w-full h-full`}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover rounded-xl"
          />
        ) : (
          <div className="w-full h-full rounded-xl bg-game-dusk flex items-center justify-center">
            <FaShieldAlt className="text-neon-cyan text-2xl" />
          </div>
        )}
      </div>
      {level && (
        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-neon-gold flex items-center justify-center text-game-void font-bold text-xs border-2 border-game-void">
          {level}
        </div>
      )}
      {online && (
        <div className="absolute top-0 right-0 w-3 h-3 rounded-full bg-neon-green border-2 border-game-void animate-pulse" />
      )}
    </div>
  );
};

/* ========================================
   MINI STAT DISPLAY
   ======================================== */
// eslint-disable-next-line no-unused-vars
export const MiniStat = ({ icon: Icon, value, label, color = "cyan" }) => {
  const colors = {
    cyan: "text-neon-cyan",
    gold: "text-neon-gold",
    purple: "text-neon-purple",
    green: "text-neon-green",
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
      <Icon className={`text-lg ${colors[color]}`} />
      <div>
        <p className={`font-bold ${colors[color]}`}>{value}</p>
        {label && (
          <p className="text-[10px] uppercase tracking-wider text-slate-500">
            {label}
          </p>
        )}
      </div>
    </div>
  );
};

/* ========================================
   STREAK COUNTER
   ======================================== */
export const StreakCounter = ({ count, label = "Day Streak" }) => {
  return (
    <motion.div
      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-neon-orange/20 border border-neon-orange/30"
      animate={{ scale: [1, 1.02, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <div className="relative">
        <FaFire className="text-2xl text-neon-orange animate-pulse" />
        <FaFire className="absolute inset-0 text-2xl text-hp-red animate-ping opacity-50" />
      </div>
      <div>
        <p className="text-2xl font-bold text-neon-orange">{count}</p>
        <p className="text-xs text-slate-400">{label}</p>
      </div>
    </motion.div>
  );
};

export default {
  ParticleBackground,
  XPBar,
  LevelBadge,
  StatCard,
  AchievementBadge,
  QuestCard,
  GlowCard,
  GameButton,
  FloatingXP,
  GameAvatar,
  MiniStat,
  StreakCounter,
};
