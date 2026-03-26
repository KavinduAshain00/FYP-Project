import { useState, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPlay,
  FaCheck,
  FaLock,
  FaStar,
  FaGem,
  FaCrown,
  FaRocket,
  FaCode,
  FaJs,
  FaReact,
  FaGamepad,
  FaUsers,
  FaBolt,
  FaShieldAlt,
  FaChevronLeft,
  FaChevronRight,
  FaExpand,
  FaCompress,
  FaMapMarkerAlt,
} from "react-icons/fa";

// Category configuration with colors and icons
const CATEGORY_CONFIG = {
  "javascript-basics": {
    color: "#f7df1e",
    bgGradient: "from-yellow-500/20 to-amber-500/20",
    borderColor: "border-yellow-400/50",
    icon: FaJs,
    label: "JavaScript",
  },
  "game-development": {
    color: "#00f5ff",
    bgGradient: "from-cyan-500/20 to-teal-500/20",
    borderColor: "border-cyan-400/50",
    icon: FaGamepad,
    label: "Game Dev",
  },
  "react-basics": {
    color: "#61dafb",
    bgGradient: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-400/50",
    icon: FaReact,
    label: "React",
  },
  multiplayer: {
    color: "#b94fff",
    bgGradient: "from-purple-500/20 to-pink-500/20",
    borderColor: "border-purple-400/50",
    icon: FaUsers,
    label: "Multiplayer",
  },
  "advanced-concepts": {
    color: "#ff6b9d",
    bgGradient: "from-pink-500/20 to-rose-500/20",
    borderColor: "border-pink-400/50",
    icon: FaRocket,
    label: "Advanced",
  },
};

// Difficulty configuration
const DIFFICULTY_CONFIG = {
  beginner: {
    color: "text-emerald-400",
    bg: "bg-emerald-500/20",
    border: "border-emerald-400/50",
    icon: FaStar,
  },
  intermediate: {
    color: "text-amber-400",
    bg: "bg-amber-500/20",
    border: "border-amber-400/50",
    icon: FaGem,
  },
  advanced: {
    color: "text-rose-400",
    bg: "bg-rose-500/20",
    border: "border-rose-400/50",
    icon: FaCrown,
  },
};

// 3D Node Component with isometric styling
const QuestNode = ({
  module,
  index,
  isCompleted,
  isCurrent,
  isNext,
  isLocked,
  onClick,
  position,
  isHovered,
  onHover,
  onLeave,
}) => {
  const categoryConfig =
    CATEGORY_CONFIG[module.category] || CATEGORY_CONFIG["javascript-basics"];
  const difficultyConfig =
    DIFFICULTY_CONFIG[module.difficulty] || DIFFICULTY_CONFIG.beginner;
  const CategoryIcon = categoryConfig.icon;

  const getNodeStyle = () => {
    if (isCompleted)
      return "from-emerald-500/30 to-green-600/30 border-emerald-400/60";
    if (isCurrent)
      return "from-cyan-500/40 to-blue-600/40 border-cyan-400/70 animate-pulse";
    if (isNext) return "from-amber-500/30 to-yellow-600/30 border-amber-400/60";
    if (isLocked)
      return "from-slate-700/50 to-slate-800/50 border-slate-600/40 opacity-50";
    return `${categoryConfig.bgGradient} ${categoryConfig.borderColor}`;
  };

  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: "translate(-50%, -50%)",
        zIndex: isHovered ? 100 : 10 + index,
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
        y: isHovered ? -10 : 0,
      }}
      transition={{
        delay: index * 0.05,
        type: "spring",
        stiffness: 200,
        damping: 15,
      }}
      whileHover={{ scale: 1.1 }}
      onClick={() => !isLocked && onClick(module._id)}
      onMouseEnter={() => onHover(module._id)}
      onMouseLeave={onLeave}
    >
      {/* 3D Platform Effect */}
      <div className="relative">
        {/* Shadow/depth layer */}
        <div
          className="absolute inset-0 rounded-2xl bg-black/40 blur-sm"
          style={{ transform: "translate(4px, 6px)" }}
        />

        {/* Main node */}
        <div
          className={`
          relative w-24 h-24 rounded-2xl border-2 
          bg-gradient-to-br ${getNodeStyle()}
          backdrop-blur-sm
          flex flex-col items-center justify-center gap-1
          transition-all duration-300
          ${isLocked ? "cursor-not-allowed" : "hover:shadow-lg hover:shadow-current/20"}
        `}
          style={{
            boxShadow: isCompleted
              ? "0 0 20px rgba(34, 197, 94, 0.3)"
              : isCurrent
                ? "0 0 25px rgba(34, 211, 238, 0.4)"
                : isNext
                  ? "0 0 20px rgba(251, 191, 36, 0.3)"
                  : "none",
          }}
        >
          {/* Status icon */}
          <div
            className={`
            w-10 h-10 rounded-xl flex items-center justify-center
            ${isCompleted ? "bg-emerald-500/30" : isCurrent ? "bg-cyan-500/30" : isNext ? "bg-amber-500/30" : "bg-white/10"}
          `}
          >
            {isCompleted ? (
              <FaCheck className="text-emerald-400 text-lg" />
            ) : isLocked ? (
              <FaLock className="text-slate-500 text-lg" />
            ) : isCurrent ? (
              <FaPlay className="text-cyan-400 text-lg" />
            ) : isNext ? (
              <FaBolt className="text-amber-400 text-lg" />
            ) : (
              <CategoryIcon
                className="text-lg"
                style={{ color: categoryConfig.color }}
              />
            )}
          </div>

          {/* Level number */}
          <span
            className={`
            text-xs font-bold px-2 py-0.5 rounded-full
            ${difficultyConfig.bg} ${difficultyConfig.color}
          `}
          >
            {index + 1}
          </span>
        </div>

        {/* Connecting lines to next nodes */}
        {!isCompleted && index % 3 !== 2 && (
          <div
            className="absolute top-1/2 -right-8 w-8 h-0.5 bg-gradient-to-r from-white/30 to-transparent"
            style={{ transform: "translateY(-50%)" }}
          />
        )}
      </div>

      {/* Tooltip on hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50"
          >
            <div className="bg-slate-900/95 backdrop-blur-md border border-white/20 rounded-xl p-3 min-w-[200px] shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <CategoryIcon style={{ color: categoryConfig.color }} />
                <span className="text-xs text-slate-400">
                  {categoryConfig.label}
                </span>
              </div>
              <h4 className="font-bold text-white text-sm mb-1">
                {module.title}
              </h4>
              <p className="text-xs text-slate-400 line-clamp-2">
                {module.description}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${difficultyConfig.bg} ${difficultyConfig.color}`}
                >
                  {module.difficulty}
                </span>
                <span className="text-xs text-amber-400 flex items-center gap-1">
                  <FaStar /> {module.xpReward || 50} XP
                </span>
              </div>
              {isCompleted && (
                <div className="mt-2 flex items-center gap-1 text-emerald-400 text-xs">
                  <FaCheck /> Completed
                </div>
              )}
            </div>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900/95" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Path connector component
const PathConnector = ({ from, to, isCompleted }) => {
  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      <defs>
        <linearGradient
          id={`gradient-${from.x}-${to.x}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop
            offset="0%"
            stopColor={isCompleted ? "#22c55e" : "#ffffff"}
            stopOpacity="0.5"
          />
          <stop
            offset="100%"
            stopColor={isCompleted ? "#22c55e" : "#ffffff"}
            stopOpacity="0.1"
          />
        </linearGradient>
      </defs>
      <line
        x1={`${from.x}%`}
        y1={`${from.y}%`}
        x2={`${to.x}%`}
        y2={`${to.y}%`}
        stroke={`url(#gradient-${from.x}-${to.x})`}
        strokeWidth="2"
        strokeDasharray={isCompleted ? "0" : "5,5"}
      />
    </svg>
  );
};

// Main Quest Map Component
const QuestMap3D = ({
  modules,
  completedModuleIds = [],
  currentModuleId,
  onModuleSelect,
}) => {
  const containerRef = useRef(null);
  const [hoveredModule, setHoveredModule] = useState(null);
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Generate positions for modules in a winding path
  const modulePositions = useMemo(() => {
    const positions = [];
    const filteredModules =
      selectedCategory === "all"
        ? modules
        : modules.filter((m) => m.category === selectedCategory);

    // Create a winding path layout
    filteredModules.forEach((module, index) => {
      const row = Math.floor(index / 4);
      const col = index % 4;
      const isReversed = row % 2 === 1;

      // Stagger positions for 3D effect
      const x = 15 + (isReversed ? 3 - col : col) * 23;
      const y = 15 + row * 25;

      // Add slight variance for organic feel
      const variance = {
        x: Math.sin(index * 0.7) * 3,
        y: Math.cos(index * 0.5) * 2,
      };

      positions.push({
        module,
        position: {
          x: x + variance.x,
          y: y + variance.y,
        },
        index,
      });
    });

    return positions;
  }, [modules, selectedCategory]);

  // Find next module
  const nextModuleId = useMemo(() => {
    for (const { module } of modulePositions) {
      if (!completedModuleIds.includes(module._id)) {
        return module._id;
      }
    }
    return null;
  }, [modulePositions, completedModuleIds]);

  // Handle pan
  const handlePan = useCallback((direction) => {
    setViewOffset((prev) => ({
      x: prev.x + (direction === "left" ? 50 : direction === "right" ? -50 : 0),
      y: prev.y + (direction === "up" ? 50 : direction === "down" ? -50 : 0),
    }));
  }, []);

  // Get unique categories from modules
  const categories = useMemo(() => {
    const cats = [...new Set(modules.map((m) => m.category))];
    return ["all", ...cats];
  }, [modules]);

  return (
    <div
      className={`
      relative rounded-3xl border border-white/10 overflow-hidden
      bg-gradient-to-br from-slate-900/90 via-slate-950/95 to-slate-900/90
      ${isFullscreen ? "fixed inset-4 z-50" : "h-[600px]"}
    `}
    >
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
            animation: "grid-move 20s linear infinite",
          }}
        />
      </div>

      {/* Glowing orbs for atmosphere */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-neon-purple/10 blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-neon-cyan/10 blur-3xl animate-pulse delay-1000" />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-slate-900/95 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple to-neon-cyan flex items-center justify-center">
              <FaMapMarkerAlt className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">Quest Map</h3>
              <p className="text-xs text-slate-400">
                {completedModuleIds.length}/{modules.length} Completed
              </p>
            </div>
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-2">
            {categories.map((cat) => {
              const config = CATEGORY_CONFIG[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                    ${
                      selectedCategory === cat
                        ? "bg-white/20 text-white border border-white/30"
                        : "bg-white/5 text-slate-400 border border-transparent hover:bg-white/10"
                    }
                  `}
                >
                  {cat === "all" ? "All" : config?.label || cat}
                </button>
              );
            })}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
              className="p-2 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              -
            </button>
            <span className="text-xs text-slate-400 w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
              className="p-2 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              +
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white ml-2"
            >
              {isFullscreen ? <FaCompress /> : <FaExpand />}
            </button>
          </div>
        </div>
      </div>

      {/* Pan controls */}
      <button
        onClick={() => handlePan("left")}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
      >
        <FaChevronLeft />
      </button>
      <button
        onClick={() => handlePan("right")}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
      >
        <FaChevronRight />
      </button>

      {/* Map container */}
      <div
        ref={containerRef}
        className="absolute inset-0 pt-20 pb-20 overflow-hidden"
        style={{
          transform: `scale(${zoom}) translate(${viewOffset.x}px, ${viewOffset.y}px)`,
          transformOrigin: "center center",
          transition: "transform 0.3s ease-out",
        }}
      >
        {/* Path connectors */}
        {modulePositions
          .slice(0, -1)
          .map(({ position: from, module }, index) => {
            const to = modulePositions[index + 1]?.position;
            if (!to) return null;
            return (
              <PathConnector
                key={`path-${index}`}
                from={from}
                to={to}
                isCompleted={completedModuleIds.includes(module._id)}
              />
            );
          })}

        {/* Quest nodes */}
        {modulePositions.map(({ module, position, index }) => {
          const isCompleted = completedModuleIds.includes(module._id);
          const isCurrent = currentModuleId === module._id;
          const isNext = nextModuleId === module._id;
          const isLocked =
            index > 0 &&
            !completedModuleIds.includes(
              modulePositions[index - 1]?.module._id,
            ) &&
            !isCompleted &&
            !isCurrent;

          return (
            <QuestNode
              key={module._id}
              module={module}
              index={index}
              isCompleted={isCompleted}
              isCurrent={isCurrent}
              isNext={isNext}
              isLocked={false} // Allow clicking any module
              onClick={onModuleSelect}
              position={position}
              isHovered={hoveredModule === module._id}
              onHover={setHoveredModule}
              onLeave={() => setHoveredModule(null)}
            />
          );
        })}
      </div>

      {/* Progress indicator */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-slate-900/95 to-transparent p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple rounded-full"
              initial={{ width: 0 }}
              animate={{
                width: `${(completedModuleIds.length / modules.length) * 100}%`,
              }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <span className="text-sm font-bold text-white">
            {Math.round((completedModuleIds.length / modules.length) * 100)}%
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-emerald-500/50 border border-emerald-400" />
            Completed
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-cyan-500/50 border border-cyan-400 animate-pulse" />
            Current
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-amber-500/50 border border-amber-400" />
            Next
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-white/20 border border-white/30" />
            Available
          </div>
        </div>
      </div>

      {/* CSS for grid animation */}
      <style>{`
        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(40px, 40px); }
        }
      `}</style>
    </div>
  );
};

export default QuestMap3D;
