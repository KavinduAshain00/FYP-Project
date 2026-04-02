import { motion } from "framer-motion";
import { FaTrophy } from "react-icons/fa";
import { getXpBarProps } from "../../utils/levelCurve";
import { XPBar, GameAvatar } from "../ui/GameUI";
const contentEase = [0.25, 0.1, 0.25, 1];

/**
 * Optional right column: player stats (used when showSidebar on layout).
 */
export const GameSidebar = ({
  user,
  levelInfo: levelInfoProp,
  stats = {},
  showXPBar = true,
  showAchievements = false,
  achievements = [],
}) => {
  const levelInfo = levelInfoProp ?? user?.levelInfo;
  const xpBar = getXpBarProps(levelInfo);
  const totalPoints = levelInfo?.totalPoints ?? user?.totalPoints ?? 0;
  const level = levelInfo?.level ?? user?.level ?? 1;

  return (
    <motion.aside
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: contentEase }}
      className="w-64 shrink-0 space-y-4"
    >
      <div className="bg-blue-900 p-4 rounded-2xl shadow-lg shadow-black/30">
        <div className="flex items-center gap-3">
          <GameAvatar
            src={user?.avatarUrl}
            size="md"
            level={level}
            animated={false}
            className="!rounded-xl"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-blue-50 text-sm truncate">
              {user?.name || "User"}
            </p>
            <p className="text-[11px] text-blue-300 truncate">{user?.email}</p>
          </div>
        </div>
        {showXPBar && (
          <div className="mt-4">
            <XPBar
              current={xpBar.current}
              max={xpBar.max}
              label={`XP to Lv.${level + 1}`}
              variant="xp"
              size="sm"
            />
          </div>
        )}
      </div>

      <div className="bg-blue-900 p-4 rounded-2xl shadow-lg shadow-black/30">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-300 mb-3">
          Stats
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            ["XP", totalPoints],
            ["Level", level],
            ["Modules", stats.completedModules ?? 0],
            ["Badges", stats.achievements ?? 0],
          ].map(([k, v]) => (
            <div key={k} className="p-2.5 bg-blue-800 rounded-xl">
              <p className="text-[10px] text-blue-300 uppercase">{k}</p>
              <p className="text-sm font-semibold text-blue-50">{v}</p>
            </div>
          ))}
        </div>
      </div>

      {showAchievements && achievements.length > 0 && (
        <div className="bg-blue-900 p-4 rounded-2xl shadow-lg shadow-black/30">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-300 mb-3">
            Recent badges
          </p>
          <div className="space-y-2">
            {achievements.slice(0, 3).map((ach, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 p-2 bg-blue-800 rounded-xl"
              >
                <span className="w-7 h-7 flex items-center justify-center bg-blue-700 text-black rounded-lg">
                  <FaTrophy className="text-[10px]" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-blue-50 truncate">
                    {ach.name}
                  </p>
                  <p className="text-[10px] text-blue-300 truncate">
                    {ach.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.aside>
  );
};

export const GameLayout = ({
  children,
  showSidebar = false,
  sidebarProps = {},
  className = "",
}) => {
  return (
    <div className="min-h-screen bg-neutral-900 text-blue-100">
      <main className="min-h-screen">
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
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: contentEase }}
      className={`bg-gradient-to-b from-blue-900 to-transparent ${className}`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {Icon && (
              <motion.span
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.05, duration: 0.3, ease: contentEase }}
                className="w-12 h-12 flex items-center justify-center bg-blue-800 text-blue-200 rounded-2xl shadow-lg shadow-black/30"
              >
                <Icon className="text-xl" />
              </motion.span>
            )}
            <div>
              {badge && (
                <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-blue-300 mb-1">
                  {badge}
                </span>
              )}
              <h1 className="text-2xl font-bold text-blue-50 tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1 text-sm text-blue-300">{subtitle}</p>
              )}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </motion.div>
  );
};

export default {
  GameSidebar,
  GameLayout,
  PageHeader,
};
