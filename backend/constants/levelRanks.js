// Level bands (last tier max = Infinity). XP curve lives in utils/levelSystem.js — keep in sync with gamilearn/src/utils/levelCurve.js.
const EXPERIENCE_RANKS = [
  { min: 1, max: 4, name: "Amateur", title: "Code Amateur" },
  { min: 5, max: 8, name: "Beginner", title: "Digital Beginner" },
  { min: 9, max: 13, name: "Apprentice", title: "Code Apprentice" },
  { min: 14, max: 19, name: "Novice", title: "Digital Novice" },
  { min: 20, max: 26, name: "Initiate", title: "Code Initiate" },
  { min: 27, max: 35, name: "Journeyman", title: "Digital Journeyman" },
  { min: 36, max: 45, name: "Adept", title: "Code Adept" },
  { min: 46, max: 57, name: "Expert", title: "Digital Expert" },
  { min: 58, max: 71, name: "Veteran", title: "Code Veteran" },
  { min: 72, max: 86, name: "Elite", title: "Digital Elite" },
  { min: 87, max: 103, name: "Champion", title: "Code Champion" },
  { min: 104, max: 122, name: "Master", title: "Digital Master" },
  { min: 123, max: 143, name: "Legendary", title: "Code Legend" },
  { min: 144, max: 167, name: "Grandmaster", title: "Digital Grandmaster" },
  { min: 168, max: Infinity, name: "Mythic", title: "Digital Mythic" },
];

const XP_PER_LEVEL_BASE = 100;
const XP_PER_LEVEL_INCREMENT = 10;

const MODULE_COMPLETION_XP = 150;
const STEP_VERIFY_XP = 15;
const MCQ_CORRECT_XP = 10;

/** Applied to step verify, MCQ correct, and module completion XP (matches Module.difficulty). */
const MODULE_DIFFICULTY_XP_MULTIPLIER = {
  beginner: 1,
  intermediate: 1.25,
  advanced: 1.5,
};

function applyModuleDifficultyXpMultiplier(baseXp, difficulty) {
  const mult =
    MODULE_DIFFICULTY_XP_MULTIPLIER[difficulty] ??
    MODULE_DIFFICULTY_XP_MULTIPLIER.beginner;
  return Math.max(1, Math.round(Number(baseXp) * mult));
}

module.exports = {
  EXPERIENCE_RANKS,
  XP_PER_LEVEL_BASE,
  XP_PER_LEVEL_INCREMENT,
  MODULE_COMPLETION_XP,
  STEP_VERIFY_XP,
  MCQ_CORRECT_XP,
  MODULE_DIFFICULTY_XP_MULTIPLIER,
  applyModuleDifficultyXpMultiplier,
};
