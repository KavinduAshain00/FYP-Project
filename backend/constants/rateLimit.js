/**
 * Rate limiting configuration
 */
const TUTOR_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  max: 15,
  message: { error: 'Too many tutor requests. Try again later.' },
};

const DIAGRAM_LIMIT = {
  windowMs: 60 * 1000,
  max: 15,
  message: { error: 'Too many diagram requests. Try again later.' },
};

module.exports = {
  TUTOR_LIMIT,
  DIAGRAM_LIMIT,
};
