const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const { logError } = require('./utils/logger');

// Log unhandled promise rejections and uncaught exceptions
process.on('unhandledRejection', (reason, promise) => {
  logError(reason instanceof Error ? reason : new Error(String(reason)), 'UnhandledRejection');
});
process.on('uncaughtException', (err) => {
  logError(err, 'UncaughtException');
  process.exit(1);
});

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

const User = require('./models/User');

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected successfully');
    // One-time migration: copy old Admin collection emails to User.role = 'admin' (if Admin collection exists)
    try {
      const legacyCount = await mongoose.connection.db.collection('admins').countDocuments();
      if (legacyCount > 0) {
        const legacyAdmins = await mongoose.connection.db.collection('admins').find({}).toArray();
        for (const doc of legacyAdmins) {
          const email = (doc && doc.email || '').toString().toLowerCase();
          if (email) await User.updateOne({ email }, { role: 'admin' });
        }
        console.log('[Admin] Migrated', legacyAdmins.length, 'admin(s) to User.role');
      }
    } catch {
      // No legacy admins collection
    }
    // Optional bootstrap: set first admin from env when no admins exist
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount === 0 && process.env.ADMIN_BOOTSTRAP_EMAIL) {
      const email = process.env.ADMIN_BOOTSTRAP_EMAIL.trim().toLowerCase();
      if (email && email.includes('@')) {
        const updated = await User.findOneAndUpdate({ email }, { role: 'admin' }, { new: true });
        if (updated) {
          console.log('[Admin] Bootstrap: first admin set from ADMIN_BOOTSTRAP_EMAIL');
        }
      }
    }
  })
  .catch((err) => {
    logError(err, 'MongoDB');
  });

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
// Admin (user management, etc.) – requires auth + admin email
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
