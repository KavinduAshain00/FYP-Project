// Lesson XP: totalPoints is canonical; lessonXpKeys stops double-paying the same step/mcq/complete.
const mongoose = require('mongoose');
const User = require('../models/User');
const Module = require('../models/Module');
const {
  MODULE_COMPLETION_XP,
  STEP_VERIFY_XP,
  MCQ_CORRECT_XP,
  MODULE_DIFFICULTY_XP_MULTIPLIER,
  applyModuleDifficultyXpMultiplier,
} = require('../constants/levelRanks');
const {
  buildLevelInfo,
  computeLevelFromTotalPoints,
} = require('../utils/levelSystem');

function getLevelInfo(totalPoints) {
  const tp = Number(totalPoints) || 0;
  return buildLevelInfo(tp);
}

function syncStoredLevelFromPoints(user) {
  if (!user) return;
  user.level = computeLevelFromTotalPoints(user.totalPoints);
}

function grantSnapshot(totalPoints, awarded, xpAwarded) {
  const tp = Number(totalPoints) || 0;
  const lv = computeLevelFromTotalPoints(tp);
  return {
    awarded,
    xpAwarded,
    totalPoints: tp,
    level: lv,
    levelInfo: buildLevelInfo(tp),
  };
}

function emptySnapshot(totalPoints = 0) {
  const tp = Number(totalPoints) || 0;
  return grantSnapshot(tp, false, 0);
}

async function resolveModuleDifficulty(moduleId, explicitDifficulty) {
  if (
    explicitDifficulty &&
    MODULE_DIFFICULTY_XP_MULTIPLIER[explicitDifficulty]
  ) {
    return explicitDifficulty;
  }
  const mod = await Module.findById(moduleId).select('difficulty').lean();
  const d = mod?.difficulty;
  if (d && MODULE_DIFFICULTY_XP_MULTIPLIER[d]) return d;
  return 'beginner';
}

async function grantKeyedXp(userId, key, amount) {
  if (!userId || !key || !amount || amount <= 0) {
    return emptySnapshot();
  }

  const existing = await User.findById(userId).select('lessonXpKeys totalPoints level').lean();
  if (!existing) return emptySnapshot();

  if ((existing.lessonXpKeys || []).includes(key)) {
    return emptySnapshot(existing.totalPoints || 0);
  }

  const update = await User.updateOne(
    { _id: userId, $nor: [{ lessonXpKeys: key }] },
    { $push: { lessonXpKeys: key }, $inc: { totalPoints: amount } },
  );

  const refreshed = await User.findById(userId);
  if (!refreshed) return emptySnapshot(existing.totalPoints || 0);

  if (update.modifiedCount === 0) {
    return emptySnapshot(refreshed.totalPoints || 0);
  }

  refreshed.level = computeLevelFromTotalPoints(refreshed.totalPoints);
  await refreshed.save();

  return grantSnapshot(refreshed.totalPoints || 0, true, amount);
}

async function grantStepVerifyXp(userId, moduleId, stepIndex, moduleDifficulty) {
  if (!mongoose.Types.ObjectId.isValid(String(moduleId))) return emptySnapshot();
  if (!Number.isFinite(stepIndex) || stepIndex < 0) return emptySnapshot();
  const key = `${String(moduleId)}:step:${stepIndex}`;
  const difficulty = await resolveModuleDifficulty(moduleId, moduleDifficulty);
  const amount = applyModuleDifficultyXpMultiplier(STEP_VERIFY_XP, difficulty);
  return grantKeyedXp(userId, key, amount);
}

async function grantMcqCorrectXp(
  userId,
  moduleId,
  stepIndex,
  questionIndex,
  moduleDifficulty,
) {
  if (!mongoose.Types.ObjectId.isValid(String(moduleId))) return emptySnapshot();
  if (!Number.isFinite(stepIndex) || stepIndex < 0) return emptySnapshot();
  if (!Number.isFinite(questionIndex) || questionIndex < 0) return emptySnapshot();
  const key = `${String(moduleId)}:mcq:${stepIndex}:${questionIndex}`;
  const difficulty = await resolveModuleDifficulty(moduleId, moduleDifficulty);
  const amount = applyModuleDifficultyXpMultiplier(MCQ_CORRECT_XP, difficulty);
  return grantKeyedXp(userId, key, amount);
}

async function grantModuleCompletionXp(userId, moduleId, moduleDifficulty) {
  if (!mongoose.Types.ObjectId.isValid(String(moduleId))) return emptySnapshot();
  const key = `${String(moduleId)}:complete`;
  const difficulty = await resolveModuleDifficulty(moduleId, moduleDifficulty);
  const amount = applyModuleDifficultyXpMultiplier(MODULE_COMPLETION_XP, difficulty);
  return grantKeyedXp(userId, key, amount);
}

module.exports = {
  computeLevelFromTotalPoints,
  getLevelInfo,
  syncStoredLevelFromPoints,
  grantKeyedXp,
  grantStepVerifyXp,
  grantMcqCorrectXp,
  grantModuleCompletionXp,
  MODULE_COMPLETION_XP,
  STEP_VERIFY_XP,
  MCQ_CORRECT_XP,
  MODULE_DIFFICULTY_XP_MULTIPLIER,
  applyModuleDifficultyXpMultiplier,
};
