/**
 * Experience ranks for level tiers (gaming progression theme) – 15 level tags
 */
const EXPERIENCE_RANKS = [
  { min: 1, max: 2, name: 'Amateur', title: 'Code Amateur', color: 'text-slate-400', bgColor: 'bg-slate-500/20', borderColor: 'border-slate-400/40', description: 'Just starting your coding journey' },
  { min: 3, max: 4, name: 'Beginner', title: 'Digital Beginner', color: 'text-green-400', bgColor: 'bg-green-500/20', borderColor: 'border-green-400/40', description: 'Learning the basics of code' },
  { min: 5, max: 7, name: 'Apprentice', title: 'Code Apprentice', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', borderColor: 'border-emerald-400/40', description: 'Beginning to understand patterns' },
  { min: 8, max: 10, name: 'Novice', title: 'Digital Novice', color: 'text-teal-400', bgColor: 'bg-teal-500/20', borderColor: 'border-teal-400/40', description: 'Building foundational skills' },
  { min: 11, max: 14, name: 'Initiate', title: 'Code Initiate', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20', borderColor: 'border-cyan-400/40', description: 'Gaining confidence in coding' },
  { min: 15, max: 20, name: 'Journeyman', title: 'Digital Journeyman', color: 'text-blue-400', bgColor: 'bg-blue-500/20', borderColor: 'border-blue-400/40', description: 'Mastering core concepts' },
  { min: 21, max: 28, name: 'Adept', title: 'Code Adept', color: 'text-indigo-400', bgColor: 'bg-indigo-500/20', borderColor: 'border-indigo-400/40', description: 'Experienced and skilled coder' },
  { min: 29, max: 38, name: 'Expert', title: 'Digital Expert', color: 'text-purple-400', bgColor: 'bg-purple-500/20', borderColor: 'border-purple-400/40', description: 'Top-tier programming skills' },
  { min: 39, max: 50, name: 'Veteran', title: 'Code Veteran', color: 'text-pink-400', bgColor: 'bg-pink-500/20', borderColor: 'border-pink-400/40', description: 'Among the best developers' },
  { min: 51, max: 65, name: 'Elite', title: 'Digital Elite', color: 'text-amber-400', bgColor: 'bg-amber-500/20', borderColor: 'border-amber-400/40', description: 'Master of the digital arts' },
  { min: 66, max: 80, name: 'Champion', title: 'Code Champion', color: 'text-orange-400', bgColor: 'bg-orange-500/20', borderColor: 'border-orange-400/40', description: 'Legendary status achieved' },
  { min: 81, max: 95, name: 'Master', title: 'Digital Master', color: 'text-red-400', bgColor: 'bg-red-500/20', borderColor: 'border-red-400/40', description: 'Transcended mortal coding limits' },
  { min: 96, max: 110, name: 'Legendary', title: 'Code Legend', color: 'text-rose-400', bgColor: 'bg-rose-500/20', borderColor: 'border-rose-400/40', description: 'Legend among developers' },
  { min: 111, max: 130, name: 'Grandmaster', title: 'Digital Grandmaster', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', borderColor: 'border-yellow-400/40', description: 'Elite grandmaster coder' },
  { min: 131, max: Infinity, name: 'Mythic', title: 'Digital Mythic', color: 'text-yellow-300', bgColor: 'bg-yellow-500/20', borderColor: 'border-yellow-400/40', description: 'Transcended mortal coding limits' },
];

const XP_PER_LEVEL = 200;

module.exports = {
  EXPERIENCE_RANKS,
  XP_PER_LEVEL,
};
