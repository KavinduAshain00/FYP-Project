/**
 * Simple error logger for the backend. Use for unhandled errors and consistent error output.
 */

/**
 * Log an error with optional context. In development, includes stack trace.
 * @param {Error|unknown} err
 * @param {string} [context] - e.g. 'Auth', 'MongoDB', 'UnhandledRejection'
 */
function logError(err, context = '') {
  const prefix = context ? `[${context}] ` : '';
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  console.error(`${prefix}ERROR:`, message);
  if (stack && process.env.NODE_ENV !== 'production') {
    console.error(stack);
  }
}

module.exports = {
  logError,
};
