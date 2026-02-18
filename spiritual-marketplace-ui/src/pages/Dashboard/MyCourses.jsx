import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./MyCourses.module.css";
import useRequireAuth from "../../hooks/useRequireAuth";
import { api } from "../../lib/api";
import { getFriendlyMessage } from "../../utils/errorMapping";

export default function MyCourses() {
  const requireAuth = useRequireAuth();

  const [courses, setCourses] = useState([]); // normalized purchases
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    requireAuth(async () => {
      try {
        setLoading(true);
        setError("");

        const res = await api.get("/api/me/courses");

        // backend returns { success:true, items:[{purchaseId, course:{id,title,...}}] }
        const items = Array.isArray(res?.items) ? res.items : [];

        const normalized = items.map((p) => ({
          purchaseId: p.purchaseId || p._id,
          purchasedAt: p.purchasedAt,
          amountPaid: p.amountPaid,
          status: p.status,
          // flatten course for UI
          _id: p?.course?.id || p?.course?._id,
          title: p?.course?.title || "Course",
          thumbnail: p?.course?.thumbnail || "",
          price: p?.course?.price || 0,
          mrp: p?.course?.mrp || 0,
          slug: p?.course?.slug || ""
        }));

        setCourses(normalized);
      } catch (e) {
        setError(getFriendlyMessage(e));
        setCourses([]);
      } finally {
        setLoading(false);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <div>
          <div className={styles.title}>My Courses</div>
          <p className={styles.sub}>Continue your trainings anytime.</p>
        </div>

        <Link to="/courses" className="btn-outline">
          Browse Courses
        </Link>
      </div>

      {loading ? (
        <div className={styles.sub}>Loading...</div>
      ) : error ? (
        <div className={styles.sub}>{error}</div>
      ) : courses.length === 0 ? (
        <div className={styles.sub}>No courses purchased yet.</div>
      ) : (
        <div className={styles.grid}>
          {courses.map((c) => {
            const id = c._id;
            const title = c.title || "Course";

            return (
              <div key={c.purchaseId || id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.level}>Purchased</div>
                  <div className={styles.progressText}>—</div>
                </div>

                <div className={styles.name}>{title}</div>

                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `0%` }} />
                </div>

                <div className={styles.actions}>
                  <Link to={`/courses/${id}`} className="btn-outline">
                    View
                  </Link>
                  <Link to={`/viewer/${id}`} className="btn-primary">
                    Continue
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
