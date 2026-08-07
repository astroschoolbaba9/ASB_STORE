// asb-backend/src/utils/expoPush.js
// 100% Free Expo Push Notification HTTP Gateway

const axios = require("axios");

async function sendExpoPushNotification({ pushToken, title, body, data }) {
  if (!pushToken || typeof pushToken !== "string" || !pushToken.startsWith("ExponentPushToken")) {
    return false;
  }
  try {
    await axios.post(
      "https://exp.host/--/api/v2/push/send",
      {
        to: pushToken,
        sound: "default",
        title,
        body,
        data: data || {},
      },
      {
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
      }
    );
    return true;
  } catch (e) {
    console.warn("[EXPO PUSH API] Failed to send push notification:", e?.message);
    return false;
  }
}

async function sendExpoPushMultiple({ pushTokens, title, body, data }) {
  const validTokens = (pushTokens || []).filter((t) => typeof t === "string" && t.startsWith("ExponentPushToken"));
  if (!validTokens.length) return false;

  const messages = validTokens.map((to) => ({
    to,
    sound: "default",
    title,
    body,
    data: data || {},
  }));

  try {
    await axios.post("https://exp.host/--/api/v2/push/send", messages, {
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
    });
    return true;
  } catch (e) {
    console.warn("[EXPO PUSH API] Failed to send broadcast push notifications:", e?.message);
    return false;
  }
}

module.exports = { sendExpoPushNotification, sendExpoPushMultiple };
