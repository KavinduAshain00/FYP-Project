/**
 * rateLimit.js - express-rate-limit presets for auth and tutor routers.
 */
const { ipKeyGenerator } = require("express-rate-limit");

/**
 * TUTOR_LIMIT - Per-user key when req.user set; else IP (use after auth middleware).
 */
const TUTOR_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  max: 15,
  message: { error: "Too many tutor requests. Try again later." },
  keyGenerator(req) {
    if (req.user?.id) {
      return String(req.user.id);
    }
    return ipKeyGenerator(req);
  },
};

/**
 * AUTH_LIMIT - Login/signup/password routes (brute-force mitigation).
 */
const AUTH_LIMIT = {
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20,
  message: { error: "Too many attempts. Try again later." },
};

module.exports = {
  TUTOR_LIMIT,
  AUTH_LIMIT,
};
