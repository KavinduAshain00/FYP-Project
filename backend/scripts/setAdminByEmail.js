#!/usr/bin/env node
/**
 * Bootstrap script: set a user's role to admin by email.
 * Usage: node scripts/setAdminByEmail.js <email>
 * Requires MONGODB_URI (e.g. from .env in backend directory).
 */
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const User = require("../models/User");

const email = process.argv[2];
if (!email || !email.includes("@")) {
  console.error("Usage: node scripts/setAdminByEmail.js <email>");
  process.exit(1);
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set (e.g. in backend/.env)");
    process.exit(1);
  }
  await mongoose.connect(uri);
  const normalized = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalized });
  if (!user) {
    console.error("No user found with email:", normalized);
    await mongoose.disconnect();
    process.exit(1);
  }
  if (user.role === "admin") {
    console.log("User already has role admin:", normalized);
    await mongoose.disconnect();
    process.exit(0);
  }
  user.role = "admin";
  await user.save();
  console.log("Set role to admin for:", normalized);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
