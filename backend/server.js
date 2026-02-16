const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.error('Fatal: JWT_SECRET environment variable is not set.');
  process.exit(1);
}

const { ALLOWED_ORIGINS } = require('./constants/cors');
const app = express();

app.use(cors({
  origin: (origin, cb) => (origin && !ALLOWED_ORIGINS.includes(origin) ? cb(new Error('CORS not allowed')) : cb(null, true)),
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes (JWT auth: send Authorization: Bearer <token> for protected routes)
// Authentication routes (no token required)
app.use('/api/auth', require('./routes/auth'));
// Modules routes (all require auth; create/update/delete require admin)
app.use('/api/modules', require('./routes/modules'));
// User routes
app.use('/api/user', require('./routes/user'));
// Achievements routes
app.use('/api/achievements', require('./routes/achievements'));
// Tutor routes
app.use('/api/tutor', require('./routes/tutor'));
// Config (studio level, etc.)
app.use('/api/config', require('./routes/config'));
// Admin (user management, etc.) – requires auth + admin role
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
