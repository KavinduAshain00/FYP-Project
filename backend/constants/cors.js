/**
 * CORS configuration constants
 */
const ALLOWED_ORIGINS = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', "https://gamilearnapp.netlify.app"];

const CORS_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
const CORS_HEADERS = ['Content-Type', 'Authorization', 'Accept'];

module.exports = {
  ALLOWED_ORIGINS,
  CORS_METHODS,
  CORS_HEADERS,
};
