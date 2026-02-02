const express = require("express");
const ContactMessage = require("../models/ContactMessage");

const router = express.Router();

function badRequest(res, message, details) {
  return res.status(400).json({
    success: false,
    code: "VALIDATION_ERROR",
    message,
    details: details || null,
  });
}

router.post("/contact", async (req, res, next) => {
  try {
    const name = String(req.body?.name || "").trim();
    const phone = String(req.body?.phone || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const message = String(req.body?.message || "").trim();
    const source = String(req.body?.source || "contact_page").trim();

    if (!name) return badRequest(res, "Name is required", { field: "name" });
    if (!phone) return badRequest(res, "Mobile number is required", { field: "phone" });
    if (!email) return badRequest(res, "Email is required", { field: "email" });
    if (!message) return badRequest(res, "Message is required", { field: "message" });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return badRequest(res, "Invalid email", { field: "email" });
    }

    const digits = phone.replace(/[^\d]/g, "");
    if (digits.length < 10) {
      return badRequest(res, "Invalid mobile number", { field: "phone" });
    }

    if (message.length < 10) return badRequest(res, "Message is too short", { min: 10 });
    if (message.length > 2000) return badRequest(res, "Message is too long", { max: 2000 });

    const doc = await ContactMessage.create({
      name,
      phone,
      email,
      message,
      source,
      status: "NEW",
    });

    return res.json({
      success: true,
      message: "Received",
      id: doc._id,
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
