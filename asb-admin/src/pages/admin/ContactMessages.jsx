import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./ContactMessages.module.css";
import Table from "../../components/Table";
import { api, API_BASE } from "../../lib/api";
import { getFriendlyMessage } from "../../utils/errorMapping";

function fmtDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso || "";
  }
}

function clip(s, n = 120) {
  const t = String(s || "");
  if (t.length <= n) return t;
  return t.slice(0, n) + "…";
}

async function downloadExcel(url) {
  const token = localStorage.getItem("asb_access_token") || "";

  const res = await fetch(url, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
  });

  console.log("Export status:", res.status, "content-type:", res.headers.get("content-type")); // ✅ HERE


  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Export failed");
  }

  const blob = await res.blob();

  const disposition = res.headers.get("content-disposition") || "";
  const match = disposition.match(/filename="(.+?)"/i);
  const filename = match?.[1] || "contact-leads.xlsx";

  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(link.href);
}


export default function ContactMessages() {
  const [status, setStatus] = useState("NEW"); // ALL | NEW | READ
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [data, setData] = useState({ items: [], total: 0, pages: 1 });

  const [viewing, setViewing] = useState(null); // message object for modal

  const statusParam = useMemo(() => {
    if (status === "ALL") return "";
    return status;
  }, [status]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/api/admin/contact-messages", {
        query: {
          page,
          limit,
          status: statusParam || undefined,
        },
      });

      setData({
        items: Array.isArray(res?.items) ? res.items : [],
        total: Number(res?.total || 0),
        pages: Number(res?.pages || 1),
      });
    } catch (e) {
      setErr(getFriendlyMessage(e));
      setData({ items: [], total: 0, pages: 1 });
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusParam]);

  useEffect(() => {
    load();
  }, [load]);


  const onExport = useCallback(async () => {
    try {
      const q = status === "ALL" ? "" : `?status=${encodeURIComponent(status)}`;
      const url = `${API_BASE}/api/admin/contact-messages/export${q}`;

      console.log("Export URL:", url);

      await downloadExcel(url);
    } catch (e) {
      setErr(getFriendlyMessage(e));
    }
  }, [status]);



  const markRead = useCallback(
    async (id) => {
      if (!id) return;

      // optimistic update
      setData((prev) => ({
        ...prev,
        items: prev.items.map((x) => (x._id === id ? { ...x, status: "READ" } : x)),
      }));

      try {
        await api.patch(`/api/admin/contact-messages/${id}`, { status: "READ" });

        // if filtering by NEW, remove it from list for cleaner UX
        if (status === "NEW") {
          setData((prev) => ({
            ...prev,
            items: prev.items.filter((x) => x._id !== id),
          }));
        }
      } catch (e) {
        setErr(getFriendlyMessage(e));
        await load();
      }
    },
    [status, load]
  );

  const copyToClipboard = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(String(text || ""));
    } catch {
      // ignore
    }
  }, []);

  const columns = useMemo(
    () => [
      {
        key: "status",
        title: "Status",
        render: (r) => (
          <span className={`${styles.badge} ${r.status === "NEW" ? styles.badgeNew : styles.badgeRead}`}>
            {r.status || "NEW"}
          </span>
        ),
      },
      { key: "name", title: "Name" },
      {
        key: "phone",
        title: "Mobile",
        render: (r) => (
          <div className={styles.cellStack}>
            <a className={styles.cellLink} href={`tel:${r.phone || ""}`}>
              {r.phone || "-"}
            </a>
            <button className={styles.miniBtn} type="button" onClick={() => copyToClipboard(r.phone)}>
              Copy
            </button>
          </div>
        ),
      },
      {
        key: "email",
        title: "Email",
        render: (r) => (
          <div className={styles.cellStack}>
            <a className={styles.cellLink} href={`mailto:${r.email || ""}`}>
              {r.email || "-"}
            </a>
            <button className={styles.miniBtn} type="button" onClick={() => copyToClipboard(r.email)}>
              Copy
            </button>
          </div>
        ),
      },
      {
        key: "message",
        title: "Message",
        render: (r) => (
          <div className={styles.msgCell}>
            <div className={styles.msgPreview}>{clip(r.message, 140)}</div>
            <button className={styles.miniBtn} type="button" onClick={() => setViewing(r)}>
              View
            </button>
          </div>
        ),
      },
      {
        key: "createdAt",
        title: "Date",
        render: (r) => <span className={styles.muted}>{fmtDate(r.createdAt)}</span>,
      },
      {
        key: "actions",
        title: "Actions",
        render: (r) => (
          <div className={styles.actions}>
            {String(r.status || "NEW") === "NEW" ? (
              <button className={`btn-outline ${styles.actionBtn}`} type="button" onClick={() => markRead(r._id)}>
                Mark READ
              </button>
            ) : (
              <span className={styles.muted}>—</span>
            )}
          </div>
        ),
      },
    ],
    [copyToClipboard, markRead]
  );

  const canPrev = page > 1;
  const canNext = page < (data.pages || 1);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.h1}>Contact Messages</h1>
          <div className={styles.sub}>Leads submitted from your website contact form.</div>
        </div>

        <div className={styles.headerRight}>
          <button className={styles.refreshBtn} type="button" onClick={load} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <button className={styles.exportBtn} type="button" onClick={onExport} disabled={loading}>
            Export
          </button>
        </div>

      </div>

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <button
            type="button"
            className={`${styles.filterBtn} ${status === "ALL" ? styles.filterActive : ""}`}
            onClick={() => {
              setPage(1);
              setStatus("ALL");
            }}
          >
            All
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${status === "NEW" ? styles.filterActive : ""}`}
            onClick={() => {
              setPage(1);
              setStatus("NEW");
            }}
          >
            New
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${status === "READ" ? styles.filterActive : ""}`}
            onClick={() => {
              setPage(1);
              setStatus("READ");
            }}
          >
            Read
          </button>
        </div>

        <div className={styles.pager}>
          <span className={styles.muted}>
            Total: <b className={styles.strong}>{data.total}</b>
          </span>

          <div className={styles.pagerBtns}>
            <button
              className={styles.pagerBtn}
              type="button"
              disabled={!canPrev || loading}
              onClick={() => setPage((p) => p - 1)}
            >
              Prev
            </button>
            <span className={styles.pageNum}>
              Page <b className={styles.strong}>{page}</b> / {data.pages || 1}
            </span>
            <button
              className={styles.pagerBtn}
              type="button"
              disabled={!canNext || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {err ? (
        <div className={styles.errorBox}>
          <div className={styles.errorTitle}>Couldn’t load messages</div>
          <div className={styles.errorMsg}>{err}</div>
          <div className={styles.smallHint}>
            Verify endpoint:
            <code> /api/admin/contact-messages</code>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className={styles.state}>Loading messages…</div>
      ) : (
        <Table columns={columns} rows={data.items} emptyText="No contact messages yet." />
      )}

      {viewing ? (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Message details">
          <div className={styles.modalCard}>
            <div className={styles.modalHead}>
              <div>
                <div className={styles.modalTitle}>{viewing.name || "Message"}</div>
                <div className={styles.modalMeta}>
                  <span className={styles.muted}>{viewing.email}</span>
                  <span className={styles.dot}>•</span>
                  <span className={styles.muted}>{viewing.phone}</span>
                  <span className={styles.dot}>•</span>
                  <span className={styles.muted}>{fmtDate(viewing.createdAt)}</span>
                </div>
              </div>

              <button className={styles.closeBtn} type="button" onClick={() => setViewing(null)} aria-label="Close">
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.modalLabel}>Message</div>
              <div className={styles.modalMsg}>{viewing.message}</div>
            </div>

            <div className={styles.modalActions}>
              {String(viewing.status || "NEW") === "NEW" ? (
                <button
                  className="btn-primary"
                  type="button"
                  onClick={() => {
                    markRead(viewing._id);
                    setViewing(null);
                  }}
                >
                  Mark READ
                </button>
              ) : null}

              <button className="btn-outline" type="button" onClick={() => setViewing(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
