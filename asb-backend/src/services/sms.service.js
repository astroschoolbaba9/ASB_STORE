const { env } = require("../config/env");

/**
 * Service to handle SMS sending via MetaReach API.
 * Documentation: https://sms.metareach.in/vb/apikey.php
 */
class SmsService {
    constructor() {
        this.apiKey = env.METAREACH_API_KEY;
        this.senderId = env.METAREACH_SENDER_ID;
        this.templateId = env.METAREACH_TEMPLATE_ID;
        this.baseUrl = "https://sms.metareach.in/vb/apikey.php";
    }

    /**
     * Sends an SMS message to a single phone number.
     * @param {string} phoneNumber - Destination number (should include 91 for India but API handles it).
     * @param {string} message - URL encoded message text.
     * @returns {Promise<Object>} - API response.
     */
    async sendSms(phoneNumber, message) {
        if (!this.apiKey || !this.senderId) {
            console.warn("⚠️ SMS Service: API Key or Sender ID missing. Skipping SMS send.");
            return { success: false, message: "API credentials missing" };
        }

        try {
            const url = new URL(this.baseUrl);
            url.searchParams.append("apikey", this.apiKey);
            url.searchParams.append("senderid", this.senderId);
            url.searchParams.append("number", phoneNumber);
            url.searchParams.append("message", message);
            url.searchParams.append("format", "json");

            if (this.templateId) {
                url.searchParams.append("templateid", this.templateId);
            }

            console.log(`📡 SMS Service: Sending to ${phoneNumber}...`);

            const response = await fetch(url.toString());
            const data = await response.json();

            if (data.status === "Success" || data.code === "011") {
                console.log(`✅ SMS Service: Sent successfully to ${phoneNumber}. MsgID: ${data.data?.messageid || 'N/A'}`);
                return { success: true, data };
            } else {
                console.error(`❌ SMS Service Error: ${data.description || 'Unknown error'} (Code: ${data.code})`);
                return { success: false, error: data.description, code: data.code };
            }
        } catch (error) {
            console.error("💥 SMS Service Crash:", error.message);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new SmsService();
