import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import Table from "../../components/Table";
import styles from "./Orders.module.css";

function money(n) {
  const x = Number(n || 0);
  return `₹${x.toFixed(0)}`;
}

function shortId(id) {
  const s = String(id || "");
  if (s.length <= 8) return s;
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}

function paymentLabel(o) {
  const method = o?.payment?.method || "COD";
  const status = o?.payment?.status || o?.status || "PENDING";
  return `${method} • ${String(status).toUpperCase()}`;
}

function fulfilmentLabel(o) {
  return String(o?.fulfilmentStatus || "PLACED").toUpperCase();
}

function giftCount(items) {
  const arr = Array.isArray(items) ? items : [];
  return arr.reduce((acc, it) => acc + (it?.isGift ? 1 : 0), 0);
}

export default function Orders() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState(""); // server + local
  const [status, setStatus] = useState("ALL"); // ALL | PENDING | PAID | FAILED | CANCELLED

  async function load(nextPage = page, q = search) {
    setLoading(true);
    setErr("");
    try {
      // ✅ server-side search supported: q
      const res = await api.get("/api/admin/orders", {
        query: { page: nextPage, limit, q: (q || "").trim() }
      });

      const arr = Array.isArray(res?.items) ? res.items : [];
      setItems(arr);

      setTotal(Number(res?.total || 0));
      setPages(Number(res?.pages || 1));
    } catch (e) {
      setErr(e?.response?.message || e?.message || "Failed to load orders");
      setItems([]);
      setPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(page, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const filtered = useMemo(() => {
    let arr = [...items];

    // ✅ Payment status filter uses o.status (your order payment status enum)
    if (status !== "ALL") {
      arr = arr.filter((o) => String(o.status || "").toUpperCase() === status);
    }

    // local filter (fast) - also helps even if backend q is empty
    const s = search.trim().toLowerCase();
    if (s) {
      arr = arr.filter((o) => {
        const id = String(o._id || "").toLowerCase();
        const ship = o.shippingAddress || {};
        return (
          id.includes(s) ||
          String(ship.fullName || "").toLowerCase().includes(s) ||
          String(ship.phone || "").toLowerCase().includes(s) ||
          String(ship.email || "").toLowerCase().includes(s)
        );
      });
    }

    return arr;
  }, [items, search, status]);

  const columns = [
    {
      key: "id",
      title: "Order",
      render: (o) => (
        <div className={styles.idCell}>
          <div className={styles.idTop}>
            <Link className={styles.idLink} to={`/admin/orders/${o._id}`}>
              {shortId(o._id)}
            </Link>

            {/* ✅ Payment status pill */}
            <span className={styles.statusPill} data-status={String(o.status || "").toUpperCase()}>
              {String(o.status || "").toUpperCase()}
            </span>
          </div>

          <div className={styles.muted}>
            {o.createdAt ? new Date(o.createdAt).toLocaleString() : "-"}
          </div>

          {/* ✅ show payment method/status and fulfilment */}
          <div className={styles.muted}>
            {paymentLabel(o)} • {fulfilmentLabel(o)}
          </div>
        </div>
      )
    },
    {
      key: "customer",
      title: "Customer",
      render: (o) => {
        const ship = o.shippingAddress || {};
        return (
          <div className={styles.userCell}>
            <div className={styles.userName}>{ship.fullName || "-"}</div>
            <div className={styles.muted}>{ship.email || "—"}</div>
            <div className={styles.muted}>{ship.phone || "—"}</div>
          </div>
        );
      }
    },
    {
      key: "items",
      title: "Items",
      render: (o) => {
        const count = Array.isArray(o.items) ? o.items.length : 0;
        const g = giftCount(o.items);
        return (
          <div className={styles.itemsCell}>
            <div className={styles.itemsNum}>{count}</div>
            {g > 0 ? <div className={styles.giftTag}>🎁 {g} gift</div> : <div className={styles.muted}>—</div>}
          </div>
        );
      }
    },
    {
      key: "total",
      title: "Total",
      render: (o) => (
        <div className={styles.totalCell}>
          <div className={styles.total}>{money(o.total)}</div>
          <div className={styles.muted}>{o.currency || "INR"}</div>
        </div>
      )
    },
    {
      key: "actions",
      title: "Actions",
      render: (o) => (
        <div className={styles.actions}>
          <Link className={styles.btnGhost} to={`/admin/orders/${o._id}`}>
            View
          </Link>
        </div>
      )
    }
  ];

  return (
    <div className={styles.wrap}>
      <div className={styles.top}>
        <div>
          <h1 className={styles.h1}>Orders</h1>
          <div className={styles.sub}>
            View customer orders + payment + address • Total: <b>{total}</b>
          </div>
        </div>

        <button className={styles.btnGhost} onClick={() => load(page, search)} disabled={loading}>
          Refresh
        </button>
      </div>

      <div className={styles.tools}>
        <input
          className={styles.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order id / name / phone / email…"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setPage(1);
              load(1, search);
            }
          }}
        />

        <select className={styles.select} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="ALL">All Payment Status</option>
          <option value="PENDING">PENDING</option>
          <option value="PAID">PAID</option>
          <option value="FAILED">FAILED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>

        <div className={styles.pager}>
          <button
            className={styles.btnGhost}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={loading || page <= 1}
          >
            ← Prev
          </button>

          <div className={styles.pageText}>
            Page <b>{page}</b> / {pages}
          </div>

          <button
            className={styles.btnGhost}
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={loading || page >= pages}
          >
            Next →
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.state}>Loading…</div>
      ) : err ? (
        <div className={styles.errorBox}>
          <div className={styles.errorTitle}>Couldn’t load orders</div>
          <div className={styles.errorMsg}>{err}</div>
        </div>
      ) : (
        <Table columns={columns} rows={filtered} keyField="_id" emptyText="No orders found." />
      )}
    </div>
  );
}
