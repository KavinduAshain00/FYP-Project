const jwt = require("jsonwebtoken");

/**
 * Generate a JWT token for the given user id
 * @param {string} userId - MongoDB user _id
 * @returns {string} JWT token
 */
function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

const PASSWORD_RESET_EXPIRY = "1h";

/**
 * Sign a password-reset token (stored on frontend, not in DB).
 * @param {string} email
 * @returns {string} JWT
 */
function signPasswordResetToken(email) {
  return jwt.sign(
    { email: email.toLowerCase(), purpose: "password-reset" },
    process.env.JWT_SECRET,
    { expiresIn: PASSWORD_RESET_EXPIRY },
  );
}

/**
 * Verify a password-reset token and return the email.
 * @param {string} token
 * @returns {{ email: string }} payload
 * @throws if invalid or expired
 */
function verifyPasswordResetToken(token) {
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  if (payload.purpose !== "password-reset" || !payload.email) {
    throw new Error("Invalid reset token");
  }
  return { email: payload.email };
}

module.exports = {
  generateToken,
  signPasswordResetToken,
  verifyPasswordResetToken,
};
