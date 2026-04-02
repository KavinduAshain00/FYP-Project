/**
 * isAdmin - True when user.role === 'admin' (User collection).
 */
function isAdmin(user) {
  return user && user.role === "admin";
}

module.exports = {
  isAdmin,
};
