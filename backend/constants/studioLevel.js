/**
 * Studio (Game Studio) display level tiers by points (in-editor points, not user XP).
 * Used by CustomGameStudio and MultiplayerGameStudio for UI badge.
 */
const STUDIO_LEVEL_TIERS = [
  { min: 0, level: 1, title: 'Novice', color: '#11998e' },
  { min: 50, level: 2, title: 'Apprentice', color: '#38ef7d' },
  { min: 150, level: 3, title: 'Developer', color: '#f7b733' },
  { min: 300, level: 4, title: 'Expert', color: '#fc4a1a' },
  { min: 500, level: 5, title: 'Master', color: '#ee0979' },
  { min: 800, level: 6, title: 'Legend', color: '#FFD700' },
];

function getStudioLevel(points) {
  const pts = Number(points) || 0;
  let tier = STUDIO_LEVEL_TIERS[0];
  for (let i = STUDIO_LEVEL_TIERS.length - 1; i >= 0; i--) {
    if (pts >= STUDIO_LEVEL_TIERS[i].min) {
      tier = STUDIO_LEVEL_TIERS[i];
      break;
    }
  }
  return tier;
}

module.exports = { getStudioLevel, STUDIO_LEVEL_TIERS };
