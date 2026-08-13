// asb-backend/src/utils/expoPush.js
// 100% Free Expo Push Notification Gateway (Native Node.js https - Zero Dependencies)

const https = require("https");

function isExpoPushToken(token) {
  return typeof token === "string" && (token.startsWith("ExponentPushToken") || token.startsWith("ExpoPushToken"));
}

function sendExpoPushNotification({ pushToken, title, body, data }) {
  if (!isExpoPushToken(pushToken)) {
    return Promise.resolve(false);
  }

  const payload = JSON.stringify({
    to: pushToken,
    sound: "default",
    priority: "high",
    channelId: "default",
    title,
    body,
    data: data || {},
  });

  return new Promise((resolve) => {
    const req = https.request(
      "https://exp.host/--/api/v2/push/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        resolve(res.statusCode >= 200 && res.statusCode < 300);
      }
    );

    req.on("error", (err) => {
      console.warn("[EXPO PUSH API] Push request error:", err?.message);
      resolve(false);
    });

    req.write(payload);
    req.end();
  });
}

function sendExpoPushMultiple({ pushTokens, title, body, data }) {
  const validTokens = (pushTokens || []).filter(isExpoPushToken);
  if (!validTokens.length) return Promise.resolve(false);

  const messages = validTokens.map((to) => ({
    to,
    sound: "default",
    priority: "high",
    channelId: "default",
    title,
    body,
    data: data || {},
  }));

  const payload = JSON.stringify(messages);

  return new Promise((resolve) => {
    const req = https.request(
      "https://exp.host/--/api/v2/push/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        resolve(res.statusCode >= 200 && res.statusCode < 300);
      }
    );

    req.on("error", (err) => {
      console.warn("[EXPO PUSH API] Broadcast push error:", err?.message);
      resolve(false);
    });

    req.write(payload);
    req.end();
  });
}

module.exports = { sendExpoPushNotification, sendExpoPushMultiple, isExpoPushToken };

