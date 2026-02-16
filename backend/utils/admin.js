/**
 * Admin is determined by the user's role in the database (user.role === 'admin').
 * Set or change admin via PUT /api/admin/users/:id with { role: 'admin' },
 * or use the bootstrap script: node scripts/setAdminByEmail.js <email>
 */

function isAdmin(user) {
  return user && user.role === "admin";
}

module.exports = { isAdmin };
