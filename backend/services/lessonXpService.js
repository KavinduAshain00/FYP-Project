/**
 * Unified XP / level pipeline for Gamilearn.
 *
 * - **Lifetime XP** lives in `User.totalPoints`; **level** is always `computeLevelFromTotalPoints(totalPoints)`.
 * - **Keyed grants** (`grantKeyedXp`, step / MCQ / module-complete) use `User.lessonXpKeys` so rewards are idempotent.
 * - **Achievements** add points in application code, then call `syncStoredLevelFromPoints(user)` before `save()`.
 * - **API payloads** use `getLevelInfo(totalPoints)` for rank + progress bars (wraps `utils/levelSystem.buildLevelInfo`).
 */
const mongoose = require('mongoose');
const User = require('../models/User');
const {
  XP_PER_LEVEL,
  MODULE_COMPLETION_XP,
  STEP_VERIFY_XP,
  MCQ_CORRECT_XP,
} = require('../constants/levelRanks');
const {
  buildLevelInfo,
  computeLevelFromTotalPoints,
} = require('../utils/levelSystem');

// ─── Public: level / display (no DB) ─────────────────────────────────────────

function getLevelInfo(totalPoints) {
  const tp = Number(totalPoints) || 0;
  return buildLevelInfo(tp);
}

/** Keep User.level in sync with totalPoints after in-memory XP changes (achievements, etc.). */
function syncStoredLevelFromPoints(user) {
  if (!user) return;
  user.level = computeLevelFromTotalPoints(user.totalPoints);
}

// ─── Internal: grant result shape ─────────────────────────────────────────────

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

/**
 * Grant XP once per dedupe key (lesson step, MCQ slot, module completion).
 * Wrong MCQ / failed verify never write a key; a later success can still grant.
 */
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

async function grantStepVerifyXp(userId, moduleId, stepIndex) {
  if (!mongoose.Types.ObjectId.isValid(String(moduleId))) return emptySnapshot();
  if (!Number.isFinite(stepIndex) || stepIndex < 0) return emptySnapshot();
  const key = `${String(moduleId)}:step:${stepIndex}`;
  return grantKeyedXp(userId, key, STEP_VERIFY_XP);
}

async function grantMcqCorrectXp(userId, moduleId, stepIndex, questionIndex) {
  if (!mongoose.Types.ObjectId.isValid(String(moduleId))) return emptySnapshot();
  if (!Number.isFinite(stepIndex) || stepIndex < 0) return emptySnapshot();
  if (!Number.isFinite(questionIndex) || questionIndex < 0) return emptySnapshot();
  const key = `${String(moduleId)}:mcq:${stepIndex}:${questionIndex}`;
  return grantKeyedXp(userId, key, MCQ_CORRECT_XP);
}

async function grantModuleCompletionXp(userId, moduleId) {
  if (!mongoose.Types.ObjectId.isValid(String(moduleId))) return emptySnapshot();
  const key = `${String(moduleId)}:complete`;
  return grantKeyedXp(userId, key, MODULE_COMPLETION_XP);
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
  XP_PER_LEVEL,
};
