/**
 * Level / XP curve must match backend/utils/levelSystem.js and backend/constants/levelRanks.js.
 * peelTotalPointsToProgress: client-only simulation (e.g. module-complete animation).
 * getXpBarProps: display from API `levelInfo.xpProgress` everywhere else.
 */

export const XP_PER_LEVEL_BASE = 100;
export const XP_PER_LEVEL_INCREMENT = 10;

export function xpToAdvanceFromLevel(level) {
  const L = Math.max(1, Math.floor(Number(level)) || 1);
  return XP_PER_LEVEL_BASE + (L - 1) * XP_PER_LEVEL_INCREMENT;
}

export function peelTotalPointsToProgress(totalPoints) {
  let tp = Math.max(0, Number(totalPoints) || 0);
  let level = 1;
  while (true) {
    const need = xpToAdvanceFromLevel(level);
    if (tp < need) {
      return {
        level,
        currentXP: tp,
        xpNeeded: need,
        percentage: need > 0 ? (tp / need) * 100 : 0,
        xpToNext: need - tp,
      };
    }
    tp -= need;
    level += 1;
  }
}

/**
 * XP bar props from API `user.levelInfo` / dashboard `levelInfo` (no client XP math).
 */
export function getXpBarProps(levelInfo) {
  const p = levelInfo?.xpProgress;
  if (!p) {
    return { current: 0, max: 1, percentage: 0, xpToNext: 0 };
  }
  return {
    current: p.currentXP ?? 0,
    max: Math.max(1, p.xpNeeded ?? 1),
    percentage: p.percentage ?? 0,
    xpToNext: p.xpToNext ?? 0,
  };
}
