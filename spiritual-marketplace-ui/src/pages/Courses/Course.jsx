// src/pages/Courses/Course.jsx
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import styles from "./Course.module.css";
import useRequireAuth from "../../hooks/useRequireAuth";
import { api, API_BASE } from "../../lib/api";
import { getFriendlyMessage } from "../../utils/errorMapping";
import { normalizeList, normalizeCourse } from "../../lib/normalize";

const COURSE_CATEGORIES = ["All", "General", "Beginner Programs", "Advanced Programs", "Certifications", "Workshops"];

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function absUrl(u) {
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return `${API_BASE}${u.startsWith("/") ? "" : "/"}${u}`;
}

// ✅ helper: ensure PayU customer details exist
function ensurePayuCustomer(customer) {
  const c = {
    firstname: String(customer?.firstname || "Customer").trim() || "Customer",
    email: String(customer?.email || "").trim(),
    phone: String(customer?.phone || "").trim(),
  };

  if (!c.email) {
    const email = window.prompt("Enter your email for payment:");
    c.email = String(email || "").trim();
  }
  if (!c.phone) {
    const phone = window.prompt("Enter your phone for payment:");
    c.phone = String(phone || "").trim();
  }

  return c;
}

function PayuAutoForm({ actionUrl, fields, onDone }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.submit();
      onDone?.(); // optional: clear state after submit
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!actionUrl || !fields) return null;

  return (
    <form ref={ref} method="POST" action={actionUrl}>
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v ?? ""} />
      ))}
      <noscript>
        <button type="submit" className="btn-primary">
          Continue to PayU
        </button>
      </noscript>
    </form>
  );
}

export default function Course() {
  const [q, setQ] = useState("");
  const requireAuth = useRequireAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const query = useQuery();
  const catFromUrl = query.get("cat") || "";

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // PayU redirect state
  const [payu, setPayu] = useState(null); // { actionUrl, fields }

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const q2 = { page: 1, limit: 50 };
        if (q.trim()) q2.search = q.trim();

        const res = await api.get("/api/courses", { query: q2 });
        if (!alive) return;

        const arr = normalizeList(res, ["courses"]);
        setCourses(arr.map(normalizeCourse).filter((x) => x._id));
      } catch (e) {
        if (!alive) return;
        setError(getFriendlyMessage(e));
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [q]);

  const filtered = useMemo(() => {
    let list = [...courses];

    const s = q.trim().toLowerCase();
    if (s) list = list.filter((c) => (c.title || "").toLowerCase().includes(s));

    if (catFromUrl) {
      list = list.filter((c) => String(c.raw?.category || "General") === catFromUrl);
    }

    return list;
  }, [courses, q, catFromUrl]);

  function setCategory(nextCat) {
    const params = new URLSearchParams(location.search);

    if (!nextCat || nextCat === "All") params.delete("cat");
    else params.set("cat", nextCat);

    navigate({ pathname: "/courses", search: params.toString() ? `?${params.toString()}` : "" });
  }

  const selectedCategory = catFromUrl ? catFromUrl : "All";

  const getMeCustomer = useCallback(async () => {
    let me = null;
    try {
      const r = await api.get("/api/auth/me");
      me = r?.user || r || null;
    } catch {
      me = null;
    }

    const customer = ensurePayuCustomer({
      firstname: me?.name || "Customer",
      email: me?.email || "",
      phone: me?.phone || "",
    });

    if (!customer.email || !customer.phone) {
      throw new Error("Email required for online payment");
    }
    return customer;
  }, []);

  async function handleBuyCourse(courseId, price) {
    await requireAuth(async () => {
      setError("");

      // Free course -> open viewer
      if (Number(price || 0) <= 0) {
        navigate(`/viewer/${courseId}`);
        return;
      }

      // ✅ IMPORTANT: include customer in PayU initiate
      const customer = await getMeCustomer();

      // Optional: if your backend wants to create a pending purchase record first, keep this:
      // await api.post(`/api/courses/${courseId}/buy`, { customer });

      const payuRes = await api.post("/api/payments/payu/initiate", {
        purpose: "COURSE_BUY",
        courseId,
        customer,
      });

      if (!payuRes?.actionUrl || !payuRes?.fields) {
        throw new Error(payuRes?.message || "PayU initiate failed");
      }

      setPayu({ actionUrl: payuRes.actionUrl, fields: payuRes.fields });
    });
  }

  return (
    <div className={styles.page}>
      {/* Auto-submit PayU form */}
      {payu ? (
        <PayuAutoForm
          actionUrl={payu.actionUrl}
          fields={payu.fields}
          onDone={() => {
            // keep if you want, not required
          }}
        />
      ) : null}

      <div className={styles.head}>
        <div>
          <h1 className={styles.h1}>Trainings</h1>
          <p className={styles.sub}>
            Premium spiritual trainings designed for calm learning.
            {catFromUrl ? ` • ${catFromUrl}` : ""}
          </p>
        </div>

        <div className={styles.actions}>
          <div className={styles.searchWrap}>
            <input
              className={styles.search}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search courses..."
            />
          </div>

          <select className={styles.select} value={selectedCategory} onChange={(e) => setCategory(e.target.value)}>
            {COURSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? <div className={styles.sub}>Loading...</div> : null}
      {error ? <div className={styles.sub}>{error}</div> : null}

      {!loading && !error ? (
        <div className={styles.grid}>
          {filtered.map((c) => {
            const id = c._id;
            const title = c.title || "Course";
            const price = c.price ?? 0;
            const rating = c.ratingAvg ?? 0;

            const categoryLabel = String(c.raw?.category || "General");
            const thumb = absUrl(c.thumbnail);

            return (
              <div key={id} className={styles.card}>
                <div className={styles.media}>
                  {thumb ? (
                    <img
                      className={styles.thumb}
                      src={thumb}
                      alt={title}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : null}

                  <div className={styles.badge}>Training</div>
                  <div className={styles.level}>{categoryLabel}</div>
                </div>

                <div className={styles.body}>
                  <div className={styles.title}>{title}</div>

                  <div className={styles.meta}>
                    <span className={styles.price}>₹{price}</span>
                    <span className={styles.rating}>★ {Number(rating || 0).toFixed(1)}</span>
                  </div>

                  <div className={styles.btnRow}>
                    <Link to={`/courses/${id}`} className={`btn-outline ${styles.btnLink}`}>
                      View
                    </Link>

                    <button className="btn-primary" type="button" onClick={() => handleBuyCourse(id, price)}>
                      {Number(price || 0) <= 0 ? "Start" : "Buy / Access"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {!loading && !error && filtered.length === 0 ? (
        <div className={styles.empty}>
          <h3 className={styles.emptyTitle}>No courses found</h3>
          <p className={styles.emptySub}>Try a different search.</p>
        </div>
      ) : null}
    </div>
  );
}
