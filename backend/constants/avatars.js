/**
 * Preset avatars with unlock rules. Users can select one by index or set a custom URL.
 * unlock: 'default' | { type: 'level', level } | { type: 'achievement', achievementId }
 */
const AVATAR_LIST = [
  // Default (always unlocked)
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default', unlock: { type: 'default' } },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=happy', unlock: { type: 'default' } },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=smiley', unlock: { type: 'default' } },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sunny', unlock: { type: 'default' } },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=joy', unlock: { type: 'default' } },
  // Level unlocks 2–9
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cheerful', unlock: { type: 'level', level: 2 } },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=party', unlock: { type: 'level', level: 3 } },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rainbow', unlock: { type: 'level', level: 4 } },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=confetti', unlock: { type: 'level', level: 5 } },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bubble', unlock: { type: 'level', level: 6 } },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=disco', unlock: { type: 'level', level: 7 } },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=star', unlock: { type: 'level', level: 8 } },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=comet', unlock: { type: 'level', level: 9 } },
  // Level 10–20
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pudding', unlock: { type: 'level', level: 10 } },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sparkle', unlock: { type: 'level', level: 12 } },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=peachy', unlock: { type: 'level', level: 15 } },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marshmallow', unlock: { type: 'level', level: 18 } },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cotton', unlock: { type: 'level', level: 20 } },
  // Achievements: learning (1–7)
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=felix', unlock: { type: 'achievement', achievementId: 1 } },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ginger', unlock: { type: 'achievement', achievementId: 2 } },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=luna', unlock: { type: 'achievement', achievementId: 3 } },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=whiskers', unlock: { type: 'achievement', achievementId: 4 } },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=smudge', unlock: { type: 'achievement', achievementId: 5 } },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cookie', unlock: { type: 'achievement', achievementId: 6 } },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=waffle', unlock: { type: 'achievement', achievementId: 7 } },
  // Achievements: coding (8–16)
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chip', unlock: { type: 'achievement', achievementId: 8 } },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=byte', unlock: { type: 'achievement', achievementId: 9 } },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=code', unlock: { type: 'achievement', achievementId: 10 } },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=flash', unlock: { type: 'achievement', achievementId: 11 } },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zen', unlock: { type: 'achievement', achievementId: 12 } },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=runner', unlock: { type: 'achievement', achievementId: 13 } },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bug', unlock: { type: 'achievement', achievementId: 14 } },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=save', unlock: { type: 'achievement', achievementId: 15 } },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sleuth', unlock: { type: 'achievement', achievementId: 16 } },
  // Achievements: general/special (17–24)
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=owl', unlock: { type: 'achievement', achievementId: 17 } },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=century', unlock: { type: 'achievement', achievementId: 18 } },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=builder', unlock: { type: 'achievement', achievementId: 19 } },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=legend', unlock: { type: 'achievement', achievementId: 20 } },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=architect', unlock: { type: 'achievement', achievementId: 21 } },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mythic', unlock: { type: 'achievement', achievementId: 22 } },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rocket', unlock: { type: 'achievement', achievementId: 23 } },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=launch', unlock: { type: 'achievement', achievementId: 24 } },
  // Achievements: multiplayer (25–28)
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=online', unlock: { type: 'achievement', achievementId: 25 } },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=socket', unlock: { type: 'achievement', achievementId: 26 } },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=room', unlock: { type: 'achievement', achievementId: 27 } },
  { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=partyhost', unlock: { type: 'achievement', achievementId: 28 } },
];

/** Flat array of URLs for backward compatibility (updateProfile by index). */
const AVATAR_PRESETS = AVATAR_LIST.map((a) => a.url);

module.exports = {
  AVATAR_LIST,
  AVATAR_PRESETS,
};
