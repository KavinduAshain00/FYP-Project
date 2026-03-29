const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const DEFAULT_CORS_ORIGINS = [
  "http://localhost:5173",
  "https://gamilearnapp.netlify.app",
];

function parseCorsOrigins() {
  const raw = process.env.CORS_ORIGINS;
  if (!raw || !String(raw).trim()) return DEFAULT_CORS_ORIGINS;
  return String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function validateEnv() {
  const missing = ["MONGODB_URI", "JWT_SECRET", "PORT"].filter(
    (k) => !process.env[k] || String(process.env[k]).trim() === "",
  );
  if (missing.length) {
    console.error(`FATAL: missing required env: ${missing.join(", ")}`);
    process.exit(1);
  }
  const secret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production" && secret.length < 32) {
    console.error(
      "FATAL: JWT_SECRET must be at least 32 characters in production",
    );
    process.exit(1);
  }
}

validateEnv();

const PORT = process.env.PORT;

const app = express();

if (process.env.TRUST_PROXY === "1") {
  app.set("trust proxy", 1);
}

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use(
  cors({
    origin: parseCorsOrigins(),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  }),
);

const JSON_BODY_LIMIT = process.env.JSON_BODY_LIMIT || "512kb";
app.use(express.json({ limit: JSON_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: JSON_BODY_LIMIT }));

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Routes
// Authentication routes
app.use("/api/auth", require("./routes/auth"));

// Modules routes
app.use("/api/modules", require("./routes/modules"));

// User routes
app.use("/api/user", require("./routes/user"));

// Achievements routes
app.use("/api/achievements", require("./routes/achievements"));

// Tutor routes
app.use("/api/tutor", require("./routes/tutor"));

// Admin (user management, etc.) – requires auth
app.use("/api/admin", require("./routes/admin"));

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
