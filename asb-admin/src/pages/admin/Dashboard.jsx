import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { getFriendlyMessage } from "../../utils/errorMapping";
import styles from "./Dashboard.module.css";

function money(n) {
  const x = Number(n || 0);
  return `₹${x.toFixed(0)}`;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [stats, setStats] = useState(null);

  async function loadDashboard() {
    setLoading(true);
    setErr("");

    try {
      // ✅ Uses your new endpoint
      const res = await api.get("/api/admin/dashboard-stats");
      setStats(res?.stats || null);
    } catch (e) {
      setErr(getFriendlyMessage(e));
      setStats(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.h1}>Dashboard</h1>
          <div className={styles.sub}>Revenue, orders, gifts, users & last 7 days</div>
        </div>

        <button className={styles.refreshBtn} onClick={loadDashboard} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {loading ? (
        <div className={styles.state}>Loading dashboard…</div>
      ) : err ? (
        <div className={styles.errorBox}>
          <div className={styles.errorTitle}>Couldn’t load dashboard</div>
          <div className={styles.errorMsg}>{err}</div>
          <div className={styles.smallHint}>
            Verify endpoint:
            <code> /api/admin/dashboard-stats</code>
          </div>
        </div>
      ) : !stats ? (
        <div className={styles.state}>No stats found.</div>
      ) : (
        <>
          {/* TOP STATS */}
          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.cardLabel}>Revenue (PAID)</div>
              <div className={styles.cardValue}>{money(stats.revenue)}</div>
              <div className={styles.cardHint}>Total revenue from paid orders</div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardLabel}>Total Orders</div>
              <div className={styles.cardValue}>{stats.totalOrders}</div>
              <div className={styles.cardHint}>All statuses</div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardLabel}>Paid Orders</div>
              <div className={styles.cardValue}>{stats.paidOrders}</div>
              <div className={styles.cardHint}>Successful payments</div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardLabel}>Pending</div>
              <div className={styles.cardValue}>{stats.pendingOrders}</div>
              <div className={styles.cardHint}>Waiting payment / processing</div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardLabel}>Failed</div>
              <div className={styles.cardValue}>{stats.failedOrders}</div>
              <div className={styles.cardHint}>Payment failed</div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardLabel}>Cancelled</div>
              <div className={styles.cardValue}>{stats.cancelledOrders}</div>
              <div className={styles.cardHint}>Cancelled by user/admin</div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardLabel}>Gift Orders</div>
              <div className={styles.cardValue}>{stats.giftOrders}</div>
              <div className={styles.cardHint}>Any item marked gift</div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardLabel}>Total Users</div>
              <div className={styles.cardValue}>{stats.totalUsers}</div>
              <div className={styles.cardHint}>Registered users</div>
            </div>
          </div>

          {/* LAST 7 DAYS TABLE */}
          <div className={styles.tableCard}>
            <div className={styles.tableTitle}>Last 7 Days (PAID)</div>

            <div className={styles.table}>
              <div className={styles.thead}>
                <div>Date</div>
                <div>Orders</div>
                <div>Revenue</div>
              </div>

              {(Array.isArray(stats.last7d) ? stats.last7d : []).length === 0 ? (
                <div className={styles.trow}>
                  <div className={styles.muted}>No paid orders in last 7 days</div>
                  <div />
                  <div />
                </div>
              ) : (
                stats.last7d.map((r) => (
                  <div key={r.date} className={styles.trow}>
                    <div>{r.date}</div>
                    <div>{r.orders}</div>
                    <div>{money(r.revenue)}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* QUICK LINKS */}
          <div className={styles.links}>
            <a className={styles.linkCard} href="/admin/orders">
              <div className={styles.linkTitle}>Manage Orders</div>
              <div className={styles.linkSub}>View customer orders + gift info</div>
            </a>

            <a className={styles.linkCard} href="/admin/categories">
              <div className={styles.linkTitle}>Manage Categories</div>
              <div className={styles.linkSub}>Create / Edit / Delete</div>
            </a>

            <a className={styles.linkCard} href="/admin/products">
              <div className={styles.linkTitle}>Manage Products</div>
              <div className={styles.linkSub}>Search / Filter / CRUD</div>
            </a>

            <a className={styles.linkCard} href="/admin/courses">
              <div className={styles.linkTitle}>Manage Courses</div>
              <div className={styles.linkSub}>Price / Lessons / Videos</div>
            </a>

            <a className={styles.linkCard} href="/admin/gift">
              <div className={styles.linkTitle}>Gift Settings</div>
              <div className={styles.linkSub}>Banner / Wrap / Presets</div>
            </a>
          </div>
        </>
      )}
    </div>
  );
}
