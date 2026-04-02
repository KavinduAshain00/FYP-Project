const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const PORT = process.env.PORT;

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://gamilearnapp.netlify.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

/**
 * Mount - GET|POST /api/auth/* (see routes/auth.js).
 */
app.use("/api/auth", require("./routes/auth"));

/**
 * Mount - GET /api/modules/* learner catalog (see routes/modules.js).
 */
app.use("/api/modules", require("./routes/modules"));

/**
 * Mount - /api/user/* profile, dashboard, module progress (see routes/user.js).
 */
app.use("/api/user", require("./routes/user"));

/**
 * Mount - /api/achievements/* catalog and checks (see routes/achievements.js).
 */
app.use("/api/achievements", require("./routes/achievements"));

/**
 * Mount - /api/tutor/* AI tutor (see routes/tutor.js).
 */
app.use("/api/tutor", require("./routes/tutor"));

/**
 * Mount - /api/admin/* staff routes (see routes/admin.js).
 */
app.use("/api/admin", require("./routes/admin"));

/**
 * GET / - Process health (not under /api).
 */
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
