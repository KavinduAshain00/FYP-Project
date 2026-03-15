/**
 * Admin is determined by User.role === 'admin' (stored in User collection).
 */

function isAdmin(user) {
  return user && user.role === 'admin';
}

module.exports = {
  isAdmin,
};
