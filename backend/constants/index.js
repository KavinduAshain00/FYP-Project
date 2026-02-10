/**
 * Central export for all constants
 */
const cors = require('./cors');
const rateLimit = require('./rateLimit');
const tutor = require('./tutor');
const diagrams = require('./diagrams');
const ai = require('./ai');
const levelRanks = require('./levelRanks');
const { AVATAR_PRESETS } = require('./avatars');

module.exports = {
  ...cors,
  ...rateLimit,
  ...tutor,
  ...diagrams,
  ...ai,
  ...levelRanks,
  AVATAR_PRESETS,
};
