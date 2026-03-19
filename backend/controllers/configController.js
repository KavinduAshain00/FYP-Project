const { AVATAR_PRESETS } = require("../constants/avatars");

/**
 * GET /api/config/avatars
 * Returns the list of preset avatar URLs. No auth required.
 */
async function getAvatars(req, res) {
  try {
    return res.json({ avatars: AVATAR_PRESETS });
  } catch (error) {
    console.error("Get avatars error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = { getAvatars };
