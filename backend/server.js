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
