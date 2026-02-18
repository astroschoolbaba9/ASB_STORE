import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import styles from "./CourseDetail.module.css";
import useRequireAuth from "../../hooks/useRequireAuth";
import { API_BASE, api } from "../../lib/api";
import { getFriendlyMessage } from "../../utils/errorMapping";

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

export default function CourseDetail() {
  const { id } = useParams();
  const requireAuth = useRequireAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError("");

        const res = await api.get(`/api/courses/${id}`);
        if (!alive) return;

        setCourse(res.course || null);
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
  }, [id]);

  const lessons = useMemo(() => {
    const raw = course?.lessons || course?.syllabus || [];
    return Array.isArray(raw) ? raw : [];
  }, [course]);

  const highlights = useMemo(() => {
    const raw = course?.highlights || course?.tags || [];
    return Array.isArray(raw) ? raw : [];
  }, [course]);

  // ✅ FIXED: initiate PayU directly (same as SHOP), do NOT call /courses/:id/buy
  async function handleBuy() {
    await requireAuth(async () => {
      try {
        setBuying(true);
        setError("");

        // Get logged-in user profile (for email/phone)
        let me = null;
        try {
          const r = await api.get("/api/auth/me");
          me = r?.user || r || null;
        } catch {
          me = null;
        }

        // Build customer + prompt if missing
        const customer = ensurePayuCustomer({
          firstname: me?.name || "Customer",
          email: me?.email || "",
          phone: me?.phone || "",
        });

        if (!customer.email || !customer.phone) {
          setError("Email and phone are required for online payment.");
          return;
        }

        // ✅ IMPORTANT: call PayU initiate directly
        const payu = await api.post("/api/payments/payu/initiate", {
          purpose: "COURSE_BUY",
          courseId: id,
          amount: Number(price || 0),
          customer,
        });


        if (!payu?.actionUrl || !payu?.fields) {
          throw new Error(payu?.message || "PayU initiate failed");
        }

        // Store PayU session for redirect page
        sessionStorage.setItem("asb_payu", JSON.stringify({ actionUrl: payu.actionUrl, fields: payu.fields }));

        // Go to redirect page (auto submits form)
        navigate("/payment/redirect");
      } catch (e) {
        setError(getFriendlyMessage(e));
      } finally {
        setBuying(false);
      }
    });
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.muted}>Loading...</div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className={styles.notFound}>
        <h1>Course not found</h1>
        <p className={styles.muted}>{error || "This course ID doesn’t exist."}</p>
        <Link to="/courses" className="btn-primary">
          Back to Trainings
        </Link>
      </div>
    );
  }

  const title = course.title || course.name || "Course";
  const level = course.level || course.difficulty || "Beginner";
  const rating = course.ratingAvg ?? course.rating ?? 0;
  const duration = course.duration || course.durationText || "—";
  const price = course.price ?? 0;

  return (
    <div className={styles.page}>
      <div className={styles.breadcrumb}>
        <Link to="/" className={styles.bcrumbLink}>Home</Link>
        <span className={styles.dot}>•</span>
        <Link to="/courses" className={styles.bcrumbLink}>Trainings</Link>
        <span className={styles.dot}>•</span>
        <span className={styles.bcrumbCurrent}>{title}</span>
      </div>

      <div className={styles.main}>
        {/* Left */}
        <section className={styles.info}>
          <div className={styles.levelRow}>
            <span className={styles.level}>{level}</span>
            <span className={styles.rating}>★ {Number(rating || 0).toFixed(1)}</span>
          </div>

          <h1 className={styles.h1}>{title}</h1>

          {course?.thumbnail ? (
            <div style={{ margin: "10px 0 14px" }}>
              <img
                src={absUrl(course.thumbnail)}
                alt={title}
                style={{
                  width: "100%",
                  maxHeight: 320,
                  objectFit: "cover",
                  borderRadius: 16,
                  border: "1px solid var(--border)",
                }}
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            </div>
          ) : null}

          <p className={styles.sub}>Calm learning experience by ASB.</p>

          <div className={styles.quick}>
            <div className={styles.quickItem}>
              <div className={styles.quickLabel}>Duration</div>
              <div className={styles.quickValue}>{duration}</div>
            </div>
            <div className={styles.quickItem}>
              <div className={styles.quickLabel}>Lessons</div>
              <div className={styles.quickValue}>{lessons.length}</div>
            </div>
            <div className={styles.quickItem}>
              <div className={styles.quickLabel}>Price</div>
              <div className={styles.quickValue}>₹{price}</div>
            </div>
          </div>

          {error ? <div className={styles.muted}>{error}</div> : null}

          <div className={styles.actions}>
            <button type="button" className="btn-primary" onClick={handleBuy} disabled={buying}>
              {buying ? "Redirecting..." : "Buy / Access Course"}
            </button>

            <button
              type="button"
              className="btn-outline"
              onClick={() => navigate("/dashboard/courses")}
              disabled={buying}
            >
              My Courses
            </button>

            <Link to="/courses" className="btn-outline">
              Back to Trainings
            </Link>
          </div>

          {highlights.length > 0 ? (
            <div className={styles.block}>
              <div className={styles.blockTitle}>Highlights</div>
              <ul className={styles.ul}>
                {highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        {/* Right */}
        <aside className={styles.card}>
          <div className={styles.cardTitle}>Syllabus</div>
          <div className={styles.lessonList}>
            {lessons.map((l, i) => {
              const name = typeof l === "string" ? l : l.title || `Lesson ${i + 1}`;
              const preview = typeof l === "object" && l?.isFreePreview;

              return (
                <div key={`${name}-${i}`} className={styles.lessonItem}>
                  <div className={styles.lessonIndex}>{i + 1}</div>
                  <div className={styles.lessonName}>
                    {name} {preview ? <span className={styles.muted}>• Preview</span> : null}
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.note}>
            Viewer is gated by backend: <code>/api/courses/:id/content</code>
          </div>
        </aside>
      </div>
    </div>
  );
}
