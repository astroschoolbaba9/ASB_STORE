// asb-backend/src/controllers/notification.controller.js
const { asynchandler } = require("../utils/asyncHandler");
const { AppError } = require("../utils/AppError");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendExpoPushMultiple } = require("../utils/expoPush");

// GET /api/notifications
const listMyNotifications = asynchandler(async (req, res) => {
  const userId = req.user._id;

  const [personal, broadcasts] = await Promise.all([
    Notification.find({ userId }).sort({ createdAt: -1 }).limit(50).lean(),
    Notification.find({ isBroadcast: true }).sort({ createdAt: -1 }).limit(20).lean(),
  ]);

  // Combine and mark read flag for broadcasts
  const formattedBroadcasts = broadcasts.map((b) => {
    const isRead = Array.isArray(b.readBy) && b.readBy.some((id) => String(id) === String(userId));
    return { ...b, read: isRead };
  });

  const combined = [...personal, ...formattedBroadcasts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  res.json({ success: true, notifications: combined });
});

// PATCH /api/notifications/:id/read
const markRead = asynchandler(async (req, res) => {
  const userId = req.user._id;
  const notifId = req.params.id;

  const notif = await Notification.findById(notifId);
  if (!notif) throw new AppError("Notification not found", 404, "NOT_FOUND");

  if (notif.isBroadcast) {
    if (!notif.readBy.some((id) => String(id) === String(userId))) {
      notif.readBy.push(userId);
      await notif.save();
    }
  } else {
    if (String(notif.userId) === String(userId)) {
      notif.read = true;
      await notif.save();
    }
  }

  res.json({ success: true, notification: notif });
});

// POST /api/admin/notifications/broadcast
const adminSendBroadcast = asynchandler(async (req, res) => {
  const { title, message, type, link } = req.body || {};

  if (!title || !message) {
    throw new AppError("Title and message are required", 400, "VALIDATION_ERROR");
  }

  // 1. Create Broadcast Notification in Database
  const notification = await Notification.create({
    isBroadcast: true,
    title: title.trim(),
    message: message.trim(),
    type: type || "broadcast",
    link: link || "",
  });

  // 2. Fetch all User Push Tokens for lockscreen push notifications
  const usersWithTokens = await User.find({ pushToken: { $exists: true, $ne: "" } }).select("pushToken").lean();
  const pushTokens = usersWithTokens.map((u) => u.pushToken).filter(Boolean);

  if (pushTokens.length > 0) {
    // 3. Trigger 100% Free Expo Push Notification for Closed Apps
    sendExpoPushMultiple({
      pushTokens,
      title: title.trim(),
      body: message.trim(),
      data: { type: type || "broadcast", link: link || "" },
    }).catch((err) => console.warn("Background push dispatch error:", err));
  }

  res.status(201).json({
    success: true,
    message: `Broadcast notification sent to ${pushTokens.length} devices!`,
    notification,
    recipientsCount: pushTokens.length,
  });
});

module.exports = {
  listMyNotifications,
  markRead,
  adminSendBroadcast,
};
