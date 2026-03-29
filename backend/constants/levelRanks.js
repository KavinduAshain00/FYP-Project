/**
 * Named rank tiers vs numeric level.
 *
 * Level curve constants (implementation: utils/levelSystem.js; client mirror: gamilearn/src/utils/levelCurve.js):
 * XP to go from level L → L+1 is XP_PER_LEVEL_BASE + (L - 1) * XP_PER_LEVEL_INCREMENT.
 *
 * Lesson XP (first time only, keyed): MODULE_COMPLETION_XP + STEP_VERIFY_XP per step +
 * MCQ_CORRECT_XP per correct MCQ; achievements add more on top.
 *
 * Bands below are tuned so early ranks last about one module’s worth of levels, then
 * each tier spans more levels so “Expert+” reflects sustained progress, not the first week.
 */
const EXPERIENCE_RANKS = [
  {
    min: 1,
    max: 4,
    name: "Amateur",
    title: "Code Amateur",
    color: "text-slate-400",
    bgColor: "bg-slate-500/20",
    borderColor: "border-slate-400/40",
    description: "Just starting your coding journey",
  },
  {
    min: 5,
    max: 8,
    name: "Beginner",
    title: "Digital Beginner",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    borderColor: "border-green-400/40",
    description: "Learning the basics of code",
  },
  {
    min: 9,
    max: 13,
    name: "Apprentice",
    title: "Code Apprentice",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
    borderColor: "border-emerald-400/40",
    description: "Beginning to understand patterns",
  },
  {
    min: 14,
    max: 19,
    name: "Novice",
    title: "Digital Novice",
    color: "text-teal-400",
    bgColor: "bg-teal-500/20",
    borderColor: "border-teal-400/40",
    description: "Building foundational skills",
  },
  {
    min: 20,
    max: 26,
    name: "Initiate",
    title: "Code Initiate",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
    borderColor: "border-cyan-400/40",
    description: "Gaining confidence in coding",
  },
  {
    min: 27,
    max: 35,
    name: "Journeyman",
    title: "Digital Journeyman",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-400/40",
    description: "Mastering core concepts",
  },
  {
    min: 36,
    max: 45,
    name: "Adept",
    title: "Code Adept",
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/20",
    borderColor: "border-indigo-400/40",
    description: "Experienced and skilled coder",
  },
  {
    min: 46,
    max: 57,
    name: "Expert",
    title: "Digital Expert",
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-400/40",
    description: "Top-tier programming skills",
  },
  {
    min: 58,
    max: 71,
    name: "Veteran",
    title: "Code Veteran",
    color: "text-pink-400",
    bgColor: "bg-pink-500/20",
    borderColor: "border-pink-400/40",
    description: "Among the best developers",
  },
  {
    min: 72,
    max: 86,
    name: "Elite",
    title: "Digital Elite",
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
    borderColor: "border-amber-400/40",
    description: "Master of the digital arts",
  },
  {
    min: 87,
    max: 103,
    name: "Champion",
    title: "Code Champion",
    color: "text-orange-400",
    bgColor: "bg-orange-500/20",
    borderColor: "border-orange-400/40",
    description: "Legendary status achieved",
  },
  {
    min: 104,
    max: 122,
    name: "Master",
    title: "Digital Master",
    color: "text-red-400",
    bgColor: "bg-red-500/20",
    borderColor: "border-red-400/40",
    description: "Transcended mortal coding limits",
  },
  {
    min: 123,
    max: 143,
    name: "Legendary",
    title: "Code Legend",
    color: "text-rose-400",
    bgColor: "bg-rose-500/20",
    borderColor: "border-rose-400/40",
    description: "Legend among developers",
  },
  {
    min: 144,
    max: 167,
    name: "Grandmaster",
    title: "Digital Grandmaster",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
    borderColor: "border-yellow-400/40",
    description: "Elite grandmaster coder",
  },
  {
    min: 168,
    max: Infinity,
    name: "Mythic",
    title: "Digital Mythic",
    color: "text-yellow-300",
    bgColor: "bg-yellow-500/20",
    borderColor: "border-yellow-400/40",
    description: "Beyond the top of the ladder",
  },
];

/** XP for the first level band (level 1 → 2). Each next band adds XP_PER_LEVEL_INCREMENT. */
const XP_PER_LEVEL_BASE = 100;

/** Extra XP added per level for the next band (linear scaling). */
const XP_PER_LEVEL_INCREMENT = 10;

/** @deprecated Use XP_PER_LEVEL_BASE; kept for older requires expecting one constant. */
const XP_PER_LEVEL = XP_PER_LEVEL_BASE;

/** First-time module completion only (see userController.completeModule). */
const MODULE_COMPLETION_XP = 150;

/** Passing step verification (code / console / comments); once per module step (see lessonXpService). */
const STEP_VERIFY_XP = 15;

/** Each MCQ answered correctly; once per (module, step, question index); wrong attempts grant nothing. */
const MCQ_CORRECT_XP = 10;

module.exports = {
  EXPERIENCE_RANKS,
  XP_PER_LEVEL,
  XP_PER_LEVEL_BASE,
  XP_PER_LEVEL_INCREMENT,
  MODULE_COMPLETION_XP,
  STEP_VERIFY_XP,
  MCQ_CORRECT_XP,
};
