const smsService = require("../services/sms.service");
const { env } = require("../config/env");

async function testSms() {
    console.log("🧪 STARTING SMS SERVICE TEST");
    console.log("----------------------------");
    console.log("ENV Configuration:");
    console.log("- METAREACH_API_KEY:", env.METAREACH_API_KEY ? "EXISTS" : "MISSING");
    console.log("- METAREACH_SENDER_ID:", env.METAREACH_SENDER_ID || "NOT SET");
    console.log("- OTP_DEV_MODE:", env.OTP_DEV_MODE);

    const testNumber = process.argv[2] || "7906681573";
    const testMessage = "Welcome to AGPK Academy login. Your verification code is 123456. This OTP will expire in 5 minutes";

    if (env.OTP_DEV_MODE) {
        console.log("⚠️  TESTABORT: OTP_DEV_MODE is true. SMS will not be sent to real number.");
        console.log("Please set OTP_DEV_MODE=false in .env to test real SMS sending.");
        return;
    }

    if (!env.METAREACH_API_KEY || !env.METAREACH_SENDER_ID) {
        console.error("❌ ERROR: Missing API Key or Sender ID in .env");
        return;
    }

    console.log(`📡 Sending test SMS to: ${testNumber}`);
    const result = await smsService.sendSms(testNumber, testMessage);

    if (result.success) {
        console.log("✅ SUCCESS: SMS request accepted by MetaReach.");
        console.log("Response:", JSON.stringify(result.data, null, 2));
    } else {
        console.error("❌ FAILURE: SMS request failed.");
        console.error("Error:", result.error);
        console.error("Code:", result.code);
    }
}

testSms().catch(err => console.error("💥 CRASH:", err));
