const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  // Allow preflight requests to pass through without authentication
  if (req.method === "OPTIONS") {
    return next();
  }
  try {
    // Get token from header
    const authHeader = req.get("Authorization") || req.get("authorization");
    const token = authHeader ? authHeader.replace("Bearer ", "") : null;

    if (!token) {
      // No token present - client not authorized to access this route
      return res
        .status(401)
        .json({ message: "No authentication token, access denied" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
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

/** Use after auth(); returns 403 if the current user's role is not admin. */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if ((req.user.role || "user") !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  return next();
};

module.exports = auth;
module.exports.requireAdmin = requireAdmin;
