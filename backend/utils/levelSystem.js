const {
  EXPERIENCE_RANKS,
  XP_PER_LEVEL,
  XP_PER_LEVEL_BASE,
  XP_PER_LEVEL_INCREMENT,
} = require('../constants/levelRanks');

/**
 * Total XP required to advance from `level` to level + 1 (level is 1-based).
 */
function xpToAdvanceFromLevel(level) {
  const L = Math.max(1, Math.floor(Number(level)) || 1);
  return XP_PER_LEVEL_BASE + (L - 1) * XP_PER_LEVEL_INCREMENT;
}

/**
 * Split lifetime totalPoints into current level and progress toward the next level.
 */
function peelTotalPointsToProgress(totalPoints) {
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

/** Single source for stored/display level from lifetime XP (matches User.level updates). */
function computeLevelFromTotalPoints(totalPoints) {
  return peelTotalPointsToProgress(totalPoints).level;
}

function getExperienceRank(level) {
  const lvl = Number(level) || 1;
  for (const rank of EXPERIENCE_RANKS) {
    if (lvl >= rank.min && lvl <= rank.max) return rank;
  }
  return EXPERIENCE_RANKS[EXPERIENCE_RANKS.length - 1];
}

function calculateXPProgress(totalPoints) {
  const p = peelTotalPointsToProgress(totalPoints);
  return {
    currentXP: p.currentXP,
    xpNeeded: p.xpNeeded,
    percentage: p.percentage,
    xpToNext: p.xpToNext,
  };
}

function getRankProgress(level) {
  const lvl = Number(level) || 1;
  const rank = getExperienceRank(lvl);
  const levelsInRank = rank.max === Infinity ? 20 : rank.max - rank.min + 1;
  const currentLevelInRank = lvl - rank.min;
  const percentage = (currentLevelInRank / levelsInRank) * 100;
  return {
    rank,
    currentLevelInRank,
    levelsInRank,
    percentage: Math.min(percentage, 100),
  };
}

/**
 * Build levelInfo for a user (rank, xpProgress, rankProgress).
 * Level and bar progress use XP_PER_LEVEL_BASE / XP_PER_LEVEL_INCREMENT from levelRanks.js.
 */
function buildLevelInfo(totalPoints) {
  const total = Number(totalPoints) || 0;
  const lvl = computeLevelFromTotalPoints(total);
  const rank = getExperienceRank(lvl);
  const xpProgress = calculateXPProgress(total);
  const rankProgress = getRankProgress(lvl);
  return {
    level: lvl,
    totalPoints: total,
    rank: {
      name: rank.name,
      title: rank.title,
      color: rank.color,
      bgColor: rank.bgColor,
      borderColor: rank.borderColor,
      description: rank.description,
    },
    xpProgress: {
      currentXP: xpProgress.currentXP,
      xpNeeded: xpProgress.xpNeeded,
      percentage: xpProgress.percentage,
      xpToNext: xpProgress.xpToNext,
    },
    rankProgress: {
      currentLevelInRank: rankProgress.currentLevelInRank,
      levelsInRank: rankProgress.levelsInRank,
      percentage: rankProgress.percentage,
    },
  };
}

module.exports = {
  xpToAdvanceFromLevel,
  peelTotalPointsToProgress,
  computeLevelFromTotalPoints,
  getExperienceRank,
  calculateXPProgress,
  getRankProgress,
  buildLevelInfo,
  XP_PER_LEVEL,
};
