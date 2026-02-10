const { EXPERIENCE_RANKS, XP_PER_LEVEL } = require('../constants/levelRanks');

function getExperienceRank(level) {
  const lvl = Number(level) || 1;
  for (const rank of EXPERIENCE_RANKS) {
    if (lvl >= rank.min && lvl <= rank.max) return rank;
  }
  return EXPERIENCE_RANKS[EXPERIENCE_RANKS.length - 1];
}

function calculateXPProgress(totalPoints) {
  const xp = Number(totalPoints) || 0;
  const currentXP = xp % XP_PER_LEVEL;
  const xpNeeded = XP_PER_LEVEL;
  const percentage = (currentXP / xpNeeded) * 100;
  const xpToNext = xpNeeded - currentXP;
  return { currentXP, xpNeeded, percentage, xpToNext };
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
 * Level is always derived from totalPoints so display stays correct (e.g. 1280 XP = level 7).
 */
function buildLevelInfo(totalPoints, _level) {
  const total = Number(totalPoints) || 0;
  const lvl = Math.max(1, Math.floor(total / XP_PER_LEVEL) + 1);
  const rank = getExperienceRank(lvl);
  const xpProgress = calculateXPProgress(total);
  const rankProgress = getRankProgress(lvl);
  return {
    level: lvl,
    totalPoints: total,
    rank: { name: rank.name, title: rank.title, color: rank.color, bgColor: rank.bgColor, borderColor: rank.borderColor, description: rank.description },
    xpProgress: { currentXP: xpProgress.currentXP, xpNeeded: xpProgress.xpNeeded, percentage: xpProgress.percentage, xpToNext: xpProgress.xpToNext },
    rankProgress: { currentLevelInRank: rankProgress.currentLevelInRank, levelsInRank: rankProgress.levelsInRank, percentage: rankProgress.percentage },
  };
}

module.exports = {
  getExperienceRank,
  calculateXPProgress,
  getRankProgress,
  buildLevelInfo,
  XP_PER_LEVEL,
};
