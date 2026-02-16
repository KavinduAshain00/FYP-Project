const jwt = require("jsonwebtoken");

/**
 * Generate a JWT token for the given user id
 * @param {string} userId - MongoDB user _id
 * @returns {string} JWT token
 */
function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

module.exports = {
  generateToken,
};
