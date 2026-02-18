/**
 * Script to promote a user to admin by phone number.
 * Creates the user if they don't exist yet.
 * Usage: node src/scripts/makeAdmin.js <phoneNumber>
 * Example: node src/scripts/makeAdmin.js 9911500291
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });

const mongoose = require("mongoose");
const User = require("../models/User");

async function makeAdmin(phone) {
    if (!phone) {
        console.error("❌ Usage: node src/scripts/makeAdmin.js <phoneNumber>");
        process.exit(1);
    }

    // Normalize: strip non-digits, take last 10
    const normalized = String(phone).replace(/\D/g, "").slice(-10);
    if (normalized.length !== 10) {
        console.error("❌ Invalid phone number. Must be 10 digits.");
        process.exit(1);
    }

    console.log(`🔍 Upserting admin user with phone: ${normalized}`);

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected");

    // findOneAndUpdate with upsert=true will CREATE the user if not found
    const user = await User.findOneAndUpdate(
        { phone: normalized },
        { $set: { role: "admin", phone: normalized } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    console.log(`✅ Admin user ready!`);
    console.log(`   ID:    ${user._id}`);
    console.log(`   Phone: ${user.phone}`);
    console.log(`   Email: ${user.email || "(none)"}`);
    console.log(`   Role:  ${user.role}`);
    console.log(`\n🎉 You can now login at the admin panel using OTP to phone: ${normalized}`);

    await mongoose.disconnect();
    process.exit(0);
}

makeAdmin(process.argv[2]).catch((err) => {
    console.error("💥 Script failed:", err.message);
    process.exit(1);
});
