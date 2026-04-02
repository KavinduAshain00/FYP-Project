import { motion } from "framer-motion";
import { FaShieldAlt } from "react-icons/fa";

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
  const safeMax = Math.max(1, Number(max) || 1);
  const safeCurrent = Math.max(0, Number(current) || 0);
  const percentage = Math.min((safeCurrent / safeMax) * 100, 100);

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
          <span className="text-blue-200 font-medium">{label}</span>
          <span className="text-neon-gold font-bold">
            {safeCurrent} / {safeMax}
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
          <div className="w-full h-full rounded-xl bg-blue-800 flex items-center justify-center">
            <FaShieldAlt className="text-neon-cyan text-2xl" />
          </div>
        )}
      </div>
      {level && (
        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-neon-gold flex items-center justify-center text-black font-bold text-xs shadow-lg shadow-black/40">
          {level}
        </div>
      )}
      {online && (
        <div className="absolute top-0 right-0 w-3 h-3 rounded-full bg-neon-green shadow-md shadow-black/50 animate-pulse" />
      )}
    </div>
  );
};
