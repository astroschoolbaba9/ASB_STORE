// src/pages/Dashboard/Orders.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./TablePage.module.css";
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

function fmtMoney(n) {
  const x = Number(n || 0);
  return `₹${x.toFixed(0)}`;
}

function isPaid(order) {
  const a = String(order?.status || "").toUpperCase();
  const b = String(order?.payment?.status || "").toUpperCase();
  return a === "PAID" || b === "PAID";
}

function canPayNow(order) {
  if (!order) return false;
  if (isPaid(order)) return false;
  return String(order?.payment?.method || "") === "ONLINE_PENDING";
}

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

export default function Orders() {
  const requireAuth = useRequireAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // PayU state
  const [payu, setPayu] = useState(null); // { actionUrl, fields }
  const [payingId, setPayingId] = useState("");

  const loadOrders = async (p = 1) => {
    await requireAuth(async () => {
      try {
        setLoading(true);
        setError("");

        const res = await api.get("/api/orders", { query: { page: p, limit: 10 } });

        setOrders(Array.isArray(res?.items) ? res.items : []);
        setPage(Number(res?.page || p));
        setPages(Number(res?.pages || 1));
      } catch (e) {
        setError(getFriendlyMessage(e));
      } finally {
        setLoading(false);
      }
    });
  };

  useEffect(() => {
    loadOrders(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasOrders = useMemo(() => Array.isArray(orders) && orders.length > 0, [orders]);

  const startPayNow = async (orderId) => {
    await requireAuth(async () => {
      try {
        setError("");
        setPayingId(String(orderId || ""));

        const payuRes = await api.post("/api/payments/payu/initiate", {
          purpose: "SHOP_ORDER",
          orderId
        });

        setPayu({
          actionUrl: payuRes?.actionUrl,
          fields: payuRes?.fields
        });
      } catch (e) {
        setError(getFriendlyMessage(e));
      } finally {
        setPayingId("");
      }
    });
  };

  return (
    <div className={styles.page}>
      {/* Auto-submit PayU form */}
      {payu ? <PayuAutoForm actionUrl={payu.actionUrl} fields={payu.fields} /> : null}

      <div className={styles.title}>Orders</div>

      {loading ? (
        <div className={styles.muted}>Loading orders...</div>
      ) : error ? (
        <div className={styles.muted}>{error}</div>
      ) : !hasOrders ? (
        <div className={styles.muted}>You have no orders yet.</div>
      ) : (
        <>
          <div className={styles.table}>
            <div className={styles.thead}>
              <div>Order</div>
              <div>Date</div>
              <div>Payment</div>
              <div>Status</div>
              <div>Total</div>
              <div></div>
            </div>

            {orders.map((o) => {
              const paymentStatus = o?.payment?.status || o.status || "PENDING";
              const fulfilment = (o.fulfilmentStatus || "PLACED").toUpperCase();

              const fulfilmentClass =
                fulfilment === "DELIVERED"
                  ? styles.statusDelivered
                  : fulfilment === "SHIPPED"
                    ? styles.statusShipped
                    : styles.statusProcessing;

              const showPayNow = canPayNow(o);

              return (
                <div key={o._id} className={styles.row}>
                  <div className={styles.bold}>#{String(o._id).slice(-6)}</div>

                  <div className={styles.muted}>{fmtDate(o.createdAt)}</div>

                  <div className={styles.muted}>
                    {(o?.payment?.method || "COD") + " • " + String(paymentStatus).toUpperCase()}
                  </div>

                  <div>
                    <span className={`${styles.status} ${fulfilmentClass}`}>{fulfilment}</span>
                  </div>

                  <div className={styles.bold}>{fmtMoney(o.total)}</div>

                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
                    {showPayNow ? (
                      <button
                        className="btn-primary"
                        type="button"
                        onClick={() => startPayNow(o._id)}
                        disabled={!!payingId && payingId === String(o._id)}
                      >
                        {payingId === String(o._id) ? "Starting..." : "Pay Now"}
                      </button>
                    ) : null}

                    <button className="btn-outline" type="button" onClick={() => navigate(`/dashboard/orders/${o._id}`)}>
                      View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {pages > 1 ? (
            <div className={styles.pager}>
              <button className="btn-outline" type="button" disabled={page <= 1} onClick={() => loadOrders(page - 1)}>
                Prev
              </button>

              <div className={styles.muted}>
                Page {page} / {pages}
              </div>

              <button className="btn-outline" type="button" disabled={page >= pages} onClick={() => loadOrders(page + 1)}>
                Next
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
