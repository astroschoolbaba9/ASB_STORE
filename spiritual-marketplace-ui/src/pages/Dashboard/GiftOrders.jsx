// src/pages/Dashboard/GiftOrders.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./GiftOrders.module.css";
import { api } from "../../lib/api";
import { getFriendlyMessage } from "../../utils/errorMapping";
import useRequireAuth from "../../hooks/useRequireAuth";

function fmtDate(d) {
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  } catch {
    return "";
  }
}

function money(n) {
  const x = Number(n || 0);
  return `₹${x.toFixed(0)}`;
}

function pickFirstGiftItem(items = []) {
  const arr = Array.isArray(items) ? items : [];
  return arr.find((it) => it?.isGift === true) || null;
}

export default function GiftOrders() {
  const requireAuth = useRequireAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    await requireAuth(async () => {
      try {
        setLoading(true);
        setError("");

        const res = await api.get("/api/orders", { query: { page: 1, limit: 50 } });
        setOrders(Array.isArray(res?.items) ? res.items : []);
      } catch (e) {
        setError(getFriendlyMessage(e));
        setOrders([]);
      } finally {
        setLoading(false);
      }
    });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const giftOrders = useMemo(() => {
    return (orders || [])
      .map((o) => {
        const giftItem = pickFirstGiftItem(o.items);
        if (!giftItem) return null;

        return {
          _id: o._id,
          createdAt: o.createdAt,
          fulfilmentStatus: o.fulfilmentStatus || "PLACED",
          total: o.total || 0,
          // gift meta (stored flat in your order item snapshot)
          recipient: giftItem.recipientName || "Recipient",
          occasion: giftItem.giftOccasion || "Occasion",
          giftWrap: !!giftItem.giftWrap
        };
      })
      .filter(Boolean);
  }, [orders]);

  return (
    <div className={styles.page}>
      <div className={styles.title}>Gift Orders</div>
      <p className={styles.sub}>
        Gifted items with recipient details (from your backend order items).
      </p>

      {loading ? (
        <div className={styles.muted}>Loading gift orders...</div>
      ) : error ? (
        <div className={styles.muted}>{error}</div>
      ) : giftOrders.length === 0 ? (
        <div className={styles.muted}>No gift orders yet.</div>
      ) : (
        <div className={styles.table}>
          <div className={styles.thead}>
            <div>Order</div>
            <div>Date</div>
            <div>Recipient</div>
            <div>Occasion</div>
            <div>Wrap</div>
            <div>Status</div>
            <div>Total</div>
            <div></div>
          </div>

          {giftOrders.map((o) => {
            const s = String(o.fulfilmentStatus || "PLACED").toUpperCase();
            const statusClass =
              s === "DELIVERED"
                ? styles.statusDelivered
                : s === "SHIPPED"
                  ? styles.statusShipped
                  : s === "CONFIRMED"
                    ? styles.statusProcessing
                    : styles.statusProcessing;

            return (
              <div key={o._id} className={styles.row}>
                <div className={styles.bold}>#{String(o._id).slice(-6)}</div>
                <div className={styles.muted}>{fmtDate(o.createdAt)}</div>

                <div className={styles.bold}>{o.recipient}</div>
                <div className={styles.muted}>{o.occasion}</div>
                <div className={styles.muted}>{o.giftWrap ? "Yes" : "No"}</div>

                <div>
                  <span className={`${styles.status} ${statusClass}`}>{s}</span>
                </div>

                <div className={styles.bold}>{money(o.total)}</div>

                <div className={styles.actions}>
                  <button
                    className="btn-outline"
                    type="button"
                    onClick={() => navigate(`/dashboard/orders/${o._id}`)}
                  >
                    View
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.note}>
        Gift message + recipient phone are stored per item in the order snapshot.
      </div>
    </div>
  );
}
