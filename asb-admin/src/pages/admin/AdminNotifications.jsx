// crystal/asb-admin/src/pages/admin/AdminNotifications.jsx
// Admin Push Notification Broadcast Center

import React, { useState } from "react";
import { api } from "../../lib/api";
import styles from "./Products.module.css";

export default function AdminNotifications() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("broadcast");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setErrorMsg("Please enter both Title and Message content.");
      return;
    }

    setLoading(true);
    setStatusMsg("");
    setErrorMsg("");

    try {
      const res = await api.post("/api/notifications/admin/broadcast", {
        title: title.trim(),
        message: message.trim(),
        type,
        link: link.trim(),
      });

      if (res?.success) {
        setStatusMsg(`✨ Success! Notification sent to ${res.recipientsCount || 0} mobile devices & in-app centers.`);
        setTitle("");
        setMessage("");
        setLink("");
      } else {
        setErrorMsg(res?.message || "Failed to send notification broadcast.");
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to connect to backend service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "800px" }}>
      <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#1A0B2E", marginBottom: "8px" }}>
        📢 Push Notification Broadcast Center
      </h2>
      <p style={{ color: "#666", fontSize: "14px", marginBottom: "24px" }}>
        Send instant push notifications to all ASB mobile app users' lockscreens & in-app Notification Centers.
      </p>

      {statusMsg && (
        <div style={{ backgroundColor: "#D1FAE5", color: "#065F46", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", fontSize: "14px", fontWeight: "600" }}>
          {statusMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ backgroundColor: "#FEE2E2", color: "#991B1B", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", fontSize: "14px", fontWeight: "600" }}>
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSendBroadcast} style={{ backgroundColor: "#FFFFFF", padding: "24px", borderRadius: "12px", border: "1px solid #E9D5FF", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#1A0B2E", letterSpacing: "1px", marginBottom: "6px" }}>
            NOTIFICATION TITLE *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. ✨ Akshaya Tritiya Offer: 25% Off Energised Crystals!"
            style={{ width: "100%", padding: "10px 14px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "14px", outline: "none" }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#1A0B2E", letterSpacing: "1px", marginBottom: "6px" }}>
            MESSAGE CONTENT *
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Enter full broadcast message..."
            style={{ width: "100%", padding: "10px 14px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "14px", outline: "none" }}
          />
        </div>

        <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#1A0B2E", letterSpacing: "1px", marginBottom: "6px" }}>
              CATEGORY TYPE
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "14px", outline: "none" }}
            >
              <option value="broadcast">📢 General Broadcast / Announcement</option>
              <option value="cosmic">✨ Cosmic & Numerology Insight</option>
              <option value="course">📚 Course Launch / Workshop</option>
              <option value="order">📦 Store & Remedies Offer</option>
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#1A0B2E", letterSpacing: "1px", marginBottom: "6px" }}>
              TARGET ACTION LINK (OPTIONAL)
            </label>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="e.g. /shop/marketplace or /shop/courses"
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "14px", outline: "none" }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            backgroundColor: "#6B21A8",
            color: "#FFFFFF",
            padding: "12px 24px",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "700",
            cursor: loading ? "not-allowed" : "pointer",
            width: "100%",
          }}
        >
          {loading ? "Sending Push Notification..." : "🚀 Send Broadcast to All Mobile App Users"}
        </button>
      </form>
    </div>
  );
}
