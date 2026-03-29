/**
 * Rate limiting configuration
 */
const { ipKeyGenerator } = require("express-rate-limit");

/**
 * Tutor API: use with `auth` before this limiter so `req.user` is set.
 * Each authenticated user gets their own counter; IP fallback covers OPTIONS / edge cases.
 */
const TUTOR_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: { error: "Too many tutor requests. Try again later." },
  keyGenerator(req) {
    if (req.user?.id) {
      return String(req.user.id);
    }
    return ipKeyGenerator(req);
  },
};

/** Auth routes: limit login/signup/forgot-password to reduce brute-force and abuse */
const AUTH_LIMIT = {
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20,
  message: { error: "Too many attempts. Try again later." },
};

module.exports = {
  TUTOR_LIMIT,
  AUTH_LIMIT,
};
