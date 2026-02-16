const { getStudioLevel } = require("../constants/studioLevel");
const { AVATAR_PRESETS } = require("../constants/avatars");

/**
 * GET /api/config/studio-level?points=100
 * Returns { level, title, color } for Game Studio UI badge.
 */
async function getStudioLevelInfo(req, res) {
  try {
    const points = Number(req.query.points) || 0;
    const tier = getStudioLevel(points);
    return res.json({
      level: tier.level,
      title: tier.title,
      color: tier.color,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * GET /api/config/avatars
 * Returns the list of preset avatar URLs. No auth required.
 */
async function getAvatars(req, res) {
  try {
    return res.json({ avatars: AVATAR_PRESETS });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = { getStudioLevelInfo, getAvatars };
