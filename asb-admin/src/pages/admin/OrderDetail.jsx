import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import styles from "./OrderDetail.module.css";

function money(n) {
  const x = Number(n || 0);
  return `₹${x.toFixed(0)}`;
}

const FSTAT = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

export default function OrderDetail() {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [order, setOrder] = useState(null);

  // ✅ admin controls
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingTracking, setSavingTracking] = useState(false);

  const [nextStatus, setNextStatus] = useState("PLACED");
  const [statusNote, setStatusNote] = useState("");

  const [courier, setCourier] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [trackingNote, setTrackingNote] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get(`/api/admin/orders/${id}`);
      const o = res?.order || null;
      setOrder(o);

      const fs = String(o?.fulfilmentStatus || "PLACED").toUpperCase();
      setNextStatus(FSTAT.includes(fs) ? fs : "PLACED");

      setCourier(o?.tracking?.courier || "");
      setTrackingId(o?.tracking?.trackingId || "");
      setTrackingUrl(o?.tracking?.trackingUrl || "");
    } catch (e) {
      setErr(e?.response?.message || e?.message || "Failed to load order");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const items = useMemo(() => (Array.isArray(order?.items) ? order.items : []), [order?.items]);
  const giftWrapTotal = Number(order?.giftWrapTotal || 0);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.head}>
          <Link to="/admin/orders" className={styles.back}>← Back</Link>
        </div>
        <div className={styles.state}>Loading…</div>
      </div>
    );
  }

  if (err || !order) {
    return (
      <div className={styles.page}>
        <div className={styles.head}>
          <Link to="/admin/orders" className={styles.back}>← Back</Link>
        </div>
        <div className={styles.errorBox}>
          <div className={styles.errorTitle}>Couldn’t load order</div>
          <div className={styles.errorMsg}>{err || "Order not found."}</div>
        </div>
      </div>
    );
  }

  const ship = order.shippingAddress || {};
  const pay = order.payment || {};
  const paymentStatus = String(pay.status || order.status || "PENDING").toUpperCase();
  const fulfilmentStatus = String(order.fulfilmentStatus || "PLACED").toUpperCase();

  const saveFulfilment = async () => {
    setSavingStatus(true);
    try {
      const res = await api.patch(`/api/admin/orders/${order._id}/fulfilment`, {
        fulfilmentStatus: nextStatus,
        note: statusNote
      });
      setOrder(res?.order || order);
      setStatusNote("");
      alert("Status updated");
    } catch (e) {
      alert(e?.response?.message || e?.message || "Failed to update status");
    } finally {
      setSavingStatus(false);
    }
  };

  const saveTracking = async () => {
    setSavingTracking(true);
    try {
      const res = await api.patch(`/api/admin/orders/${order._id}/tracking`, {
        courier,
        trackingId,
        trackingUrl,
        note: trackingNote
      });
      setOrder(res?.order || order);
      setTrackingNote("");
      alert("Tracking updated");
    } catch (e) {
      alert(e?.response?.message || e?.message || "Failed to update tracking");
    } finally {
      setSavingTracking(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <Link to="/admin/orders" className={styles.back}>← Back to Orders</Link>

        <div className={styles.titleRow}>
          <h1 className={styles.h1}>Order</h1>
          <span className={styles.statusPill} data-status={String(order.status || "").toUpperCase()}>
            {String(order.status || "").toUpperCase()}
          </span>
        </div>

        <div className={styles.muted}>
          {order._id} • {order.createdAt ? new Date(order.createdAt).toLocaleString() : "-"}
        </div>

        <div className={styles.muted}>
          Payment: {(pay.method || "COD")} • {paymentStatus} • Fulfilment: {fulfilmentStatus}
          {pay.transactionId ? ` • Txn: ${pay.transactionId}` : ""}
        </div>
      </div>

      <div className={styles.grid}>
        {/* Shipping */}
        <section className={styles.card}>
          <div className={styles.cardTitle}>Shipping Address</div>
          <div className={styles.row}><span className={styles.k}>Name</span><span className={styles.v}>{ship.fullName || "-"}</span></div>
          <div className={styles.row}><span className={styles.k}>Phone</span><span className={styles.v}>{ship.phone || "-"}</span></div>
          <div className={styles.row}><span className={styles.k}>Email</span><span className={styles.v}>{ship.email || "—"}</span></div>
          <div className={styles.row}><span className={styles.k}>Line 1</span><span className={styles.v}>{ship.line1 || "-"}</span></div>
          <div className={styles.row}><span className={styles.k}>Line 2</span><span className={styles.v}>{ship.line2 || "—"}</span></div>
          <div className={styles.row}><span className={styles.k}>City</span><span className={styles.v}>{ship.city || "-"}</span></div>
          <div className={styles.row}><span className={styles.k}>State</span><span className={styles.v}>{ship.state || "-"}</span></div>
          <div className={styles.row}><span className={styles.k}>Pincode</span><span className={styles.v}>{ship.pincode || "-"}</span></div>
          <div className={styles.rowStrong}><span className={styles.k}>Landmark</span><span className={styles.v}>{ship.landmark || "—"}</span></div>
        </section>

        {/* Admin Controls */}
<section className={styles.card}>
  <div className={styles.cardTitle}>Admin Controls</div>

  <div className={styles.controlsGrid}>
    {/* Fulfilment */}
    <div className={styles.ctrlBlock}>
      <div className={styles.ctrlRow}>
        <div className={styles.ctrlLabel}>Fulfilment Status</div>

        <select
          className={styles.ctrlSelect}
          value={nextStatus}
          onChange={(e) => setNextStatus(e.target.value)}
        >
          {FSTAT.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginTop: 10 }}>
        <input
          className={styles.ctrlInput}
          value={statusNote}
          onChange={(e) => setStatusNote(e.target.value)}
          placeholder="Note (optional) e.g. packed & confirmed"
        />
      </div>

      <div className={styles.ctrlActions}>
        <button
          className={styles.ctrlBtnPrimary}
          type="button"
          onClick={saveFulfilment}
          disabled={savingStatus}
        >
          {savingStatus ? "Saving..." : "Update Status"}
        </button>
      </div>

      <div className={styles.ctrlHint}>
        Tip: Use CONFIRMED → SHIPPED → DELIVERED. Use CANCELLED only if needed.
      </div>
    </div>

    {/* Tracking */}
    <div className={styles.ctrlBlock}>
      <div className={styles.ctrlLabel}>Tracking</div>

      <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
        <input
          className={styles.ctrlInput}
          value={courier}
          onChange={(e) => setCourier(e.target.value)}
          placeholder="Courier (e.g. DTDC)"
        />
        <input
          className={styles.ctrlInput}
          value={trackingId}
          onChange={(e) => setTrackingId(e.target.value)}
          placeholder="Tracking ID"
        />
        <input
          className={styles.ctrlInput}
          value={trackingUrl}
          onChange={(e) => setTrackingUrl(e.target.value)}
          placeholder="Tracking URL (optional)"
        />
        <input
          className={styles.ctrlInput}
          value={trackingNote}
          onChange={(e) => setTrackingNote(e.target.value)}
          placeholder="Tracking note (optional)"
        />
      </div>

      <div className={styles.ctrlActions}>
        <button
          className={styles.ctrlBtnPrimary}
          type="button"
          onClick={saveTracking}
          disabled={savingTracking}
        >
          {savingTracking ? "Saving..." : "Save Tracking"}
        </button>
      </div>

      <div className={styles.ctrlHint}>
        If tracking URL is present, user dashboard can show “Track Package”.
      </div>
    </div>
  </div>
</section>


        {/* Items + totals */}
        <section className={styles.cardWide}>
          <div className={styles.cardTitle}>Totals</div>
          <div className={styles.row}><span className={styles.k}>Subtotal</span><span className={styles.v}>{money(order.subtotal)}</span></div>
          <div className={styles.row}><span className={styles.k}>Discount</span><span className={styles.v}>{money(order.discount)}</span></div>
          {giftWrapTotal > 0 ? (
            <div className={styles.row}><span className={styles.k}>Gift Wrap</span><span className={styles.v}>{money(giftWrapTotal)}</span></div>
          ) : null}
          <div className={styles.row}><span className={styles.k}>Shipping</span><span className={styles.v}>{money(order.shipping)}</span></div>
          <div className={styles.rowStrong}><span className={styles.k}>Total</span><span className={styles.v}>{money(order.total)} {order.currency || "INR"}</span></div>

          <div className={styles.cardTitle} style={{ marginTop: 14 }}>Items</div>

          <div className={styles.items}>
            {items.map((it, idx) => (
              <div key={`${it.productId}-${idx}`} className={styles.itemRow}>
                <div className={styles.itemLeft}>
                  <div className={styles.itemTitle}>
                    {it.title || "Item"} <span className={styles.qty}>×{it.qty}</span>
                  </div>

                  <div className={styles.mutedSmall}>
                    Product: {String(it.productId || "-")} • Category: {it.categoryName || "-"}
                  </div>

                  {it.isGift ? (
                    <div className={styles.giftBox}>
                      <div className={styles.giftTitle}>🎁 Gift Details</div>
                      <div className={styles.giftRow}><b>Occasion:</b> {it.giftOccasion || "-"}</div>
                      <div className={styles.giftRow}><b>Gift Wrap:</b> {it.giftWrap ? "Yes" : "No"}</div>
                      {it.giftWrap ? (
                        <div className={styles.giftRow}><b>Wrap Price (unit):</b> {money(it.giftWrapPrice)}</div>
                      ) : null}
                      <div className={styles.giftRow}><b>Recipient:</b> {it.recipientName || "-"}</div>
                      <div className={styles.giftRow}><b>Recipient Phone:</b> {it.recipientPhone || "-"}</div>
                      <div className={styles.giftRow}><b>Message:</b> {it.giftMessage || "-"}</div>
                    </div>
                  ) : null}
                </div>

                <div className={styles.itemRight}>
                  <div className={styles.price}>{money(it.price)}</div>
                  <div className={styles.mutedSmall}>MRP: {money(it.mrp)}</div>
                  <div className={styles.mutedSmall}>
                    Line: {money(Number(it.price || 0) * Number(it.qty || 0))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {order.notes ? (
            <div className={styles.note}>
              <div className={styles.cardTitle}>Order Notes</div>
              <div className={styles.noteText}>{order.notes}</div>
            </div>
          ) : null}

          {/* ✅ History */}
          <div className={styles.note}>
            <div className={styles.cardTitle}>Status History</div>
            {(Array.isArray(order.statusHistory) ? order.statusHistory : []).length === 0 ? (
              <div className={styles.mutedSmall}>No history yet.</div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {order.statusHistory.slice().reverse().map((h, i) => (
                  <div key={i} className={styles.mutedSmall}>
                    <b>{h.action || "UPDATE"}</b> • {h.fulfilmentStatus || ""} •{" "}
                    {h.at ? new Date(h.at).toLocaleString() : ""}{" "}
                    {h.note ? `• ${h.note}` : ""}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
