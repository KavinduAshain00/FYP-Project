const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const { ALLOWED_ORIGINS, CORS_METHODS, CORS_HEADERS } = require('./constants/cors');

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      if (ALLOWED_ORIGINS.indexOf(origin) === -1) {
        const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: CORS_METHODS,
    allowedHeaders: CORS_HEADERS,
  })
);

app.use((req, res, next) => {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', CORS_METHODS.join(','));
  res.header('Access-Control-Allow-Headers', CORS_HEADERS.join(','));
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  return next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(
    `Incoming request: ${req.method} ${req.path} - origin: ${req.headers.origin || 'unknown'}`
  );
  next();
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
// Authentication routes
app.use('/api/auth', require('./routes/auth'));
// Modules routes
app.use('/api/modules', require('./routes/modules'));
// User routes
app.use('/api/user', require('./routes/user'));
// Achievements routes
app.use('/api/achievements', require('./routes/achievements'));
// Tutor routes
app.use('/api/tutor', require('./routes/tutor'));
// Diagrams routes
app.use('/api/diagrams', require('./routes/diagrams'));
// Config (studio level, etc.)
app.use('/api/config', require('./routes/config'));
// Admin (user management, etc.) – requires auth + admin email
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
