/**
 * Level / XP display helpers. All numbers come from the API (`user.levelInfo` on profile
 * and auth; dashboard `levelInfo`; tutor `levelInfo` on XP responses). No client-side XP formulas.
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
