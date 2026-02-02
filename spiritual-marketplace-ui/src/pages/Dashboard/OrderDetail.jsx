// src/pages/Dashboard/OrderDetail.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import styles from "./OrderDetail.module.css";
import { api } from "../../lib/api";
import useRequireAuth from "../../hooks/useRequireAuth";

function money(n) {
  const x = Number(n || 0);
  return `₹${x.toFixed(0)}`;
}

function fmtDateTime(d) {
  try {
    return new Date(d).toLocaleString("en-IN");
  } catch {
    return "";
  }
}

// Auto-submit PayU form (kept inline so you don’t need another file)
function PayuAutoForm({ actionUrl, fields }) {
  const formRef = useRef(null);

  useEffect(() => {
    if (formRef.current) formRef.current.submit();
  }, []);

  if (!actionUrl || !fields) return null;

  return (
    <form ref={formRef} method="POST" action={actionUrl}>
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v ?? ""} />
      ))}
      <noscript>
        <button type="submit" className="btn-primary">
          Continue to Payment
        </button>
      </noscript>
    </form>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const requireAuth = useRequireAuth();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [order, setOrder] = useState(null);

  // PayU state
  const [payu, setPayu] = useState(null); // { actionUrl, fields }
  const [paying, setPaying] = useState(false);

  async function load() {
    await requireAuth(async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await api.get(`/api/orders/${id}`);
        setOrder(res?.order || res?.data?.order || null);
      } catch (e) {
        setErr(e?.response?.message || e?.message || "Failed to load order");
        setOrder(null);
      } finally {
        setLoading(false);
      }
    });
  }

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const items = useMemo(() => (Array.isArray(order?.items) ? order.items : []), [order]);

  const fulfilment = String(order?.fulfilmentStatus || "PLACED").toUpperCase();
  const paymentMethod = String(order?.payment?.method || "COD");
  const paymentStatus = String(order?.payment?.status || order?.status || "PENDING");

  const tracking = order?.tracking || null;
  const address = order?.shippingAddress || null;

  const isPaid = useMemo(() => {
    const a = String(order?.status || "").toUpperCase();
    const b = String(order?.payment?.status || "").toUpperCase();
    return a === "PAID" || b === "PAID";
  }, [order]);

  const canPayNow = useMemo(() => {
    if (!order) return false;
    if (isPaid) return false;
    // Only allow "Pay Now" for online pending orders
    return String(order?.payment?.method || "") === "ONLINE_PENDING";
  }, [order, isPaid]);

  async function payNow() {
    await requireAuth(async () => {
      try {
        if (!order?._id) return;
        setErr("");
        setPaying(true);

        // Start PayU for this order (backend builds hash and returns actionUrl + fields)
        const payuRes = await api.post("/api/payments/payu/initiate", {
          purpose: "SHOP_ORDER",
          orderId: order._id
        });

        setPayu({
          actionUrl: payuRes?.actionUrl,
          fields: payuRes?.fields
        });
      } catch (e) {
        setErr(e?.response?.message || e?.message || "Unable to start payment. Please try again.");
      } finally {
        setPaying(false);
      }
    });
  }

  return (
    <div className={styles.page}>
      {/* If PayU is initiated, this form auto-submits to PayU */}
      {payu ? <PayuAutoForm actionUrl={payu.actionUrl} fields={payu.fields} /> : null}

      <div className={styles.head}>
        <Link to="/dashboard/orders" className={styles.back}>
          ← Back to Orders
        </Link>

        <div className={styles.titleRow}>
          <h1 className={styles.h1}>Order</h1>
          <span className={styles.statusPill} data-status={fulfilment}>
            {fulfilment}
          </span>
        </div>

        <div className={styles.muted}>
          #{String(order?._id || "").slice(-8)} • {order?.createdAt ? fmtDateTime(order.createdAt) : "-"}
        </div>
      </div>

      {loading ? (
        <div className={styles.state}>Loading…</div>
      ) : err ? (
        <div className={styles.errorBox}>
          <div className={styles.errorTitle}>Couldn’t load order</div>
          <div className={styles.errorMsg}>{err}</div>
        </div>
      ) : !order ? (
        <div className={styles.state}>Order not found.</div>
      ) : (
        <div className={styles.grid}>
          {/* Summary */}
          <section className={styles.card}>
            <div className={styles.cardTitle}>Summary</div>

            <div className={styles.row}>
              <span className={styles.k}>Payment</span>
              <span className={styles.v}>
                {paymentMethod} • {String(paymentStatus).toUpperCase()}
              </span>
            </div>

            {/* ✅ Pay Now button (only when ONLINE_PENDING + not paid) */}
            {canPayNow ? (
              <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="btn-primary" type="button" onClick={payNow} disabled={paying}>
                  {paying ? "Starting payment..." : `Pay Now (${money(order.total)})`}
                </button>
                <div className={styles.muted} style={{ fontWeight: 800 }}>
                  PayU will open securely. If it fails, you can try again anytime.
                </div>
              </div>
            ) : null}

            <div className={styles.row}>
              <span className={styles.k}>Subtotal</span>
              <span className={styles.v}>{money(order.subtotal)}</span>
            </div>

            {Number(order.giftWrapTotal || 0) > 0 ? (
              <div className={styles.row}>
                <span className={styles.k}>Gift Wrap</span>
                <span className={styles.v}>{money(order.giftWrapTotal)}</span>
              </div>
            ) : null}

            <div className={styles.row}>
              <span className={styles.k}>Shipping</span>
              <span className={styles.v}>{money(order.shipping)}</span>
            </div>

            <div className={styles.rowStrong}>
              <span className={styles.k}>Total</span>
              <span className={styles.v}>
                {money(order.total)} {order.currency || "INR"}
              </span>
            </div>
          </section>

          {/* Shipping Address */}
          <section className={styles.card}>
            <div className={styles.cardTitle}>Delivery Address</div>

            {!address ? (
              <div className={styles.muted}>No address saved.</div>
            ) : (
              <div className={styles.addr}>
                <div className={styles.addrLine}>
                  <b>{address.fullName || "-"}</b>
                </div>
                <div className={styles.addrLine}>{address.phone || "-"}</div>
                <div className={styles.addrLine}>{address.line1 || "-"}</div>
                {address.line2 ? <div className={styles.addrLine}>{address.line2}</div> : null}
                <div className={styles.addrLine}>
                  {(address.city || "-") + ", " + (address.state || "-")}
                </div>
                <div className={styles.addrLine}>{address.pincode || "-"}</div>
                {address.landmark ? <div className={styles.addrLine}>Landmark: {address.landmark}</div> : null}
              </div>
            )}
          </section>

          {/* Tracking */}
          <section className={styles.cardWide}>
            <div className={styles.cardTitle}>Tracking</div>

            {tracking && (tracking.trackingId || tracking.trackingUrl || tracking.courier) ? (
              <div className={styles.trackGrid}>
                <div className={styles.trackRow}>
                  <span className={styles.k}>Courier</span>
                  <span className={styles.v}>{tracking.courier || "-"}</span>
                </div>
                <div className={styles.trackRow}>
                  <span className={styles.k}>Tracking ID</span>
                  <span className={styles.v}>{tracking.trackingId || "-"}</span>
                </div>
                <div className={styles.trackRow}>
                  <span className={styles.k}>Tracking URL</span>
                  {tracking.trackingUrl ? (
                    <a className={styles.trackLink} href={tracking.trackingUrl} target="_blank" rel="noreferrer">
                      Open Tracking
                    </a>
                  ) : (
                    <span className={styles.v}>-</span>
                  )}
                </div>
              </div>
            ) : (
              <div className={styles.muted}>Tracking not added yet.</div>
            )}
          </section>

          {/* Items */}
          <section className={styles.cardWide}>
            <div className={styles.cardTitle}>Items</div>

            <div className={styles.items}>
              {items.map((it, idx) => (
                <div key={`${it.productId}-${idx}`} className={styles.itemRow}>
                  <div className={styles.itemLeft}>
                    <div className={styles.itemTitle}>
                      {it.title || "Item"} <span className={styles.qty}>×{it.qty}</span>
                    </div>
                    <div className={styles.mutedSmall}>{it.categoryName ? `Category: ${it.categoryName}` : ""}</div>

                    {it.isGift ? (
                      <div className={styles.giftBox}>
                        <div className={styles.giftTitle}>🎁 Gift Details</div>
                        <div className={styles.giftRow}>
                          <b>Occasion:</b> {it.giftOccasion || "-"}
                        </div>
                        <div className={styles.giftRow}>
                          <b>Gift Wrap:</b> {it.giftWrap ? "Yes" : "No"}
                        </div>
                        <div className={styles.giftRow}>
                          <b>Recipient:</b> {it.recipientName || "-"}
                        </div>
                        <div className={styles.giftRow}>
                          <b>Recipient Phone:</b> {it.recipientPhone || "-"}
                        </div>
                        <div className={styles.giftRow}>
                          <b>Message:</b> {it.giftMessage || "-"}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className={styles.itemRight}>
                    <div className={styles.price}>{money(it.price)}</div>
                    <div className={styles.mutedSmall}>
                      Line: {money(Number(it.price || 0) * Number(it.qty || 0))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {order.notes ? (
              <div className={styles.note}>
                <div className={styles.cardTitle}>Notes</div>
                <div className={styles.noteText}>{order.notes}</div>
              </div>
            ) : null}
          </section>
        </div>
      )}
    </div>
  );
}
