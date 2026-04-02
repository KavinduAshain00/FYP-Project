const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { isAdmin } = require("../utils/admin");

/**
 * auth - JWT Bearer middleware; sets req.user or 401 (OPTIONS passes through).
 */
const auth = async (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }
  try {
    const authHeader = req.get("Authorization") || req.get("authorization");
    const token = authHeader ? authHeader.replace("Bearer ", "") : null;

    if (!token) {
      return res
        .status(401)
        .json({ message: "No authentication token, access denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ message: "Token is not valid" });
  }
};

/**
 * requireAdmin - After auth: 403 unless User.role is admin.
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (!isAdmin(req.user)) {
    return res.status(403).json({ message: "Admin access required" });
  }
  return next();
};

module.exports = auth;
module.exports.requireAdmin = requireAdmin;
