/**
 * Must match backend/utils/levelSystem.js (xpToAdvanceFromLevel, peelTotalPointsToProgress) and
 * backend/constants/levelRanks.js (XP_PER_LEVEL_BASE, XP_PER_LEVEL_INCREMENT).
 * Used only where the client must simulate the curve (e.g. module-complete animation). Prefer API levelInfo elsewhere.
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

export function levelFromTotalPoints(totalPoints) {
  return peelTotalPointsToProgress(totalPoints).level;
}
