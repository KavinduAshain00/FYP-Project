/**
 * Admin role is determined by email. Set ADMIN_EMAILS in .env (comma-separated).
 * Example: ADMIN_EMAILS=admin@example.com,other@example.com
 */

function getAdminEmails() {
  const raw = process.env.ADMIN_EMAILS || '';
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function isAdminEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const admins = getAdminEmails();
  return admins.includes(email.trim().toLowerCase());
}

module.exports = {
  getAdminEmails,
  isAdminEmail,
};
