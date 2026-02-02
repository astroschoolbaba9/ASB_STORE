// scripts/seedAdmin.js
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const User = require("../models/User");
const { hashPassword } = require("../utils/password");

async function run() {
  console.log("USING DB:", process.env.MONGODB_URI);

  await mongoose.connect(process.env.MONGODB_URI);

  const email = "admin@asb.com";
  const phone = "9999999999";
  const password = "Admin@12345";

  // HARD DELETE (no ambiguity)
  await User.deleteMany({ $or: [{ email }, { phone }] });

  const passwordHash = await hashPassword(password);

  const user = await User.create({
    role: "admin",
    name: "ASB Admin",
    email,
    phone,
    passwordHash,
    isBlocked: false
  });

  console.log("SEEDED USER:", user);

  process.exit(0);
}

run().catch(console.error);
