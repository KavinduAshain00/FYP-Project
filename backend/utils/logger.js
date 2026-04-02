// Logs when not production, or when API_DEBUG=1 in production.
const verbose =
  process.env.NODE_ENV === 'dev';

function debug(...args) {
  if (verbose) console.log(...args);
}

module.exports = { debug };
