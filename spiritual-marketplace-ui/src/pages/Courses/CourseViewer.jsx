import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import styles from "./CourseViewer.module.css";
import useRequireAuth from "../../hooks/useRequireAuth";
import { api } from "../../lib/api";

function toEmbedUrl(url) {
  const u = String(url || "").trim();
  if (!u) return "";

  const ytMatch =
    u.match(/youtu\.be\/([^?]+)/) ||
    u.match(/youtube\.com\/watch\?v=([^&]+)/) ||
    u.match(/youtube\.com\/embed\/([^?]+)/);

  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;
  }

  return u;
}

function isDirectVideo(url) {
  const u = String(url || "").toLowerCase();
  return u.endsWith(".mp4") || u.endsWith(".webm") || u.endsWith(".ogg");
}

function formatDuration(sec) {
  const s = Number(sec || 0);
  if (!Number.isFinite(s) || s <= 0) return "—";
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function noteKey(userId, courseId, lessonId) {
  return `asb_notes:${userId || "guest"}:${courseId}:${lessonId}`;
}

// ✅ helper: ensure PayU customer details exist (email/phone)
function ensurePayuCustomerFromMe(me) {
  const firstname = String(me?.name || "Customer").trim() || "Customer";

  let email = String(me?.email || "").trim();
  if (!email) email = String(window.prompt("Enter your email for payment:") || "").trim();

  let phone = String(me?.phone || "").trim();
  if (!phone) phone = String(window.prompt("Enter your phone for payment:") || "").trim();

  if (!email || !phone) return null;
  return { firstname, email, phone };
}

export default function CourseViewer() {
  const { id: courseId } = useParams();
  const requireAuth = useRequireAuth();

  const [course, setCourse] = useState(null); // { title, lessons:[...] }
  const [accessMeta, setAccessMeta] = useState({ purchased: false, previewOnly: false, price: 0 });

  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState("");

  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeLessonId, setActiveLessonId] = useState("");
  const [completed, setCompleted] = useState(() => new Set());

  // notes
  const [me, setMe] = useState(null);
  const [notesText, setNotesText] = useState("");

  // load me (for notes + payment customer)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get("/api/auth/me");
        if (!alive) return;
        setMe(res?.user || res || null);
      } catch {
        setMe(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const loadContent = useCallback(async () => {
    await requireAuth(async () => {
      try {
        setLoading(true);
        setError("");
        setDenied(false);

        const res = await api.get(`/api/courses/${courseId}/content`);

        const content = res?.content || res?.data?.content || res;

        const title = content?.title || "Course Viewer";
        const rawLessons = content?.lessons || content?.course?.lessons || [];

        const normalizedLessons = Array.isArray(rawLessons)
          ? rawLessons.map((l, idx) => ({
              id: l?._id || l?.id || `l${idx + 1}`,
              title: l?.title || (typeof l === "string" ? l : `Lesson ${idx + 1}`),
              durationSec: typeof l?.durationSec === "number" ? l.durationSec : Number(l?.durationSec || 0),
              videoUrl: l?.videoUrl || "",
              notes: l?.notes || "",
              isFreePreview: !!l?.isFreePreview,
            }))
          : [];

        setCourse({ title, lessons: normalizedLessons });

        setActiveLessonId((prev) => {
          const still = normalizedLessons.find((x) => x.id === prev);
          return still ? prev : normalizedLessons?.[0]?.id || "";
        });

        setAccessMeta({
          purchased: !!content?.purchased,
          previewOnly: !!content?.previewOnly,
          price: typeof content?.price === "number" ? content.price : Number(content?.price || 0),
        });
      } catch (e) {
        console.error("Viewer load failed:", e);
        const code = e?.code || e?.response?.code;
        const status = e?.status || e?.response?.status;

        if (status === 403 || code === "COURSE_NOT_PURCHASED") {
          setDenied(true);
        } else {
          setError(e?.response?.message || e?.message || "Failed to load course content");
        }
      } finally {
        setLoading(false);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  useEffect(() => {
    if (courseId) loadContent();
  }, [courseId, loadContent]);

  const activeIndex = useMemo(() => {
    if (!course) return 0;
    return course.lessons.findIndex((l) => l.id === activeLessonId);
  }, [course, activeLessonId]);

  const activeLesson = useMemo(() => {
    if (!course) return null;
    return course.lessons[activeIndex] || course.lessons[0] || null;
  }, [course, activeIndex]);

  // Load notes when lesson changes
  useEffect(() => {
    const lid = activeLesson?.id;
    if (!lid) return;

    const key = noteKey(me?._id, courseId, lid);
    const saved = localStorage.getItem(key) || "";
    setNotesText(saved);
  }, [activeLesson?.id, me?._id, courseId]);

  // Auto-save notes
  useEffect(() => {
    const lid = activeLesson?.id;
    if (!lid) return;

    const key = noteKey(me?._id, courseId, lid);
    const t = window.setTimeout(() => {
      try {
        localStorage.setItem(key, notesText || "");
      } catch {
        // ignore quota errors
      }
    }, 300);

    return () => window.clearTimeout(t);
  }, [notesText, activeLesson?.id, me?._id, courseId]);

  const toggleComplete = () => {
    setCompleted((prev) => {
      const copy = new Set(prev);
      if (copy.has(activeLessonId)) copy.delete(activeLessonId);
      else copy.add(activeLessonId);
      return copy;
    });
  };

  // ✅ FIXED: Start PayU payment (no /courses/:id/buy here)
  async function startPayuCoursePayment() {
    await requireAuth(async () => {
      try {
        // If course is free, just reload content (backend should allow)
        if (Number(accessMeta.price || 0) <= 0) {
          await loadContent();
          return;
        }

        const customer = ensurePayuCustomerFromMe(me);
        if (!customer) {
          alert("Email and phone are required for online payment.");
          return;
        }

        const payuRes = await api.post("/api/payments/payu/initiate", {
          purpose: "COURSE_BUY",
          courseId,
          customer,
        });

        if (!payuRes?.actionUrl || !payuRes?.fields) {
          throw new Error(payuRes?.message || "PayU initiate failed");
        }

        sessionStorage.setItem(
          "asb_payu",
          JSON.stringify({ actionUrl: payuRes.actionUrl, fields: payuRes.fields })
        );

        // Go to redirect page (auto submits form)
        window.location.assign("/payment/redirect");
      } catch (e) {
        console.error("Payment start failed:", e);
        alert(e?.response?.message || e?.message || "Failed to start payment");
      }
    });
  }

  const nextLesson = async () => {
    if (!course) return;

    const isLast = activeIndex >= course.lessons.length - 1;

    // ✅ If preview-only and user is at end => prompt buy
    if (accessMeta.previewOnly && isLast) {
      const ok = window.confirm("Preview ended. Buy this course to unlock all lessons?");
      if (!ok) return;
      await startPayuCoursePayment();
      return;
    }

    const next = Math.min(course.lessons.length - 1, activeIndex + 1);
    const nextId = course.lessons[next]?.id;
    if (nextId) setActiveLessonId(nextId);
  };

  const Sidebar = ({ compact = false }) => (
    <aside className={`${styles.sidebar} ${compact ? styles.sidebarCompact : ""}`}>
      <div className={styles.sideTop}>
        <div>
          <div className={styles.courseTitle}>{course?.title || "Course Viewer"}</div>
          <div className={styles.courseSub}>Lessons {accessMeta.previewOnly ? "• Preview" : ""}</div>
        </div>

        {compact ? (
          <button className={styles.closeBtn} type="button" onClick={() => setMobileOpen(false)}>
            ✕
          </button>
        ) : null}
      </div>

      <div className={styles.lessonList}>
        {(course?.lessons || []).map((l) => {
          const isActive = l.id === activeLessonId;
          const isDone = completed.has(l.id);

          return (
            <button
              key={l.id}
              type="button"
              className={`${styles.lessonItem} ${isActive ? styles.lessonItemActive : ""}`}
              onClick={() => {
                setActiveLessonId(l.id);
                setMobileOpen(false);
              }}
            >
              <div className={styles.lessonLeft}>
                <div className={styles.lessonName}>
                  {l.title}
                  {l.isFreePreview ? (
                    <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 900, opacity: 0.75 }}>(Preview)</span>
                  ) : null}
                </div>
                <div className={styles.lessonMeta}>
                  <span className={styles.lessonTime}>{formatDuration(l.durationSec)}</span>
                  {isDone ? <span className={styles.donePill}>Done</span> : null}
                </div>
              </div>
              <div className={styles.lessonChevron}>›</div>
            </button>
          );
        })}
      </div>

      <div className={styles.sideFoot}>
        {accessMeta.previewOnly ? (
          <button
            className="btn-primary"
            type="button"
            style={{ width: "100%", marginBottom: 10 }}
            onClick={startPayuCoursePayment}
          >
            Buy & Unlock (₹{Number(accessMeta.price || 0)})
          </button>
        ) : null}

        <Link to="/courses" className={`btn-outline ${styles.backBtn}`}>
          Back to Courses
        </Link>
      </div>
    </aside>
  );

  if (loading) {
    return (
      <div className={styles.notFound}>
        <h1>Loading...</h1>
        <p className={styles.muted}>Fetching your course access.</p>
      </div>
    );
  }

  if (denied) {
    return (
      <div className={styles.notFound}>
        <h1>Access Locked</h1>
        <p className={styles.muted}>You need to buy this course to access the viewer.</p>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn-primary" type="button" onClick={startPayuCoursePayment}>
            Buy / Unlock
          </button>
          <Link to={`/courses/${courseId}`} className="btn-outline">
            View Details
          </Link>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className={styles.notFound}>
        <h1>Course not found</h1>
        <p className={styles.muted}>{error || "Unable to load course viewer."}</p>
        <Link to="/courses" className="btn-primary">
          Back to Courses
        </Link>
      </div>
    );
  }

  const video = toEmbedUrl(activeLesson?.videoUrl || "");

  return (
    <div className={styles.wrap}>
      <div className={styles.sidebarDesk}>
        <Sidebar />
      </div>

      <main className={styles.main}>
        <div className={styles.topbar}>
          <button
            className={styles.hamburger}
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open lessons"
          >
            ☰
          </button>

          <div className={styles.topTitle}>
            <div className={styles.lessonTitle}>{activeLesson?.title}</div>
            <div className={styles.lessonSub}>
              Lesson {activeIndex + 1} of {course.lessons.length} • {formatDuration(activeLesson?.durationSec)}
              {accessMeta.previewOnly ? " • Preview Access" : ""}
            </div>
          </div>

          <div className={styles.topActions}>
            <button className="btn-outline" type="button" onClick={toggleComplete}>
              {completed.has(activeLessonId) ? "Mark Incomplete" : "Mark Complete"}
            </button>

            <button className="btn-primary" type="button" onClick={nextLesson}>
              Next Lesson
            </button>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.videoCard}>
            <div className={styles.videoBox} style={{ padding: 0, overflow: "hidden" }}>
              {!video ? (
                <div style={{ display: "grid", placeItems: "center", height: "100%" }}>
                  <div className={styles.playIcon}>▶</div>
                  <div className={styles.videoText}>Video not available</div>
                  <div className={styles.videoHint}>Admin didn’t add videoUrl for this lesson.</div>
                </div>
              ) : isDirectVideo(video) ? (
                <video controls style={{ width: "100%", height: "100%", objectFit: "cover" }} src={video} />
              ) : (
                <iframe
                  title={activeLesson?.title || "lesson-video"}
                  src={video}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              )}
            </div>
          </div>

          <div className={styles.textCard}>
            <div className={styles.sectionTitle}>My Notes</div>

            <textarea
              style={{
                width: "100%",
                minHeight: 180,
                borderRadius: 14,
                border: "1px solid var(--border)",
                padding: 12,
                fontWeight: 700,
                outline: "none",
                resize: "vertical",
              }}
              placeholder="Write your personal notes for this lesson..."
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
            />

            <div className={styles.videoHint} style={{ marginTop: 10 }}>
              Notes auto-save for this lesson (stored locally).
            </div>
          </div>
        </div>
      </main>

      {mobileOpen ? (
        <div className={styles.mobileBackdrop} role="dialog" aria-modal="true">
          <div className={styles.mobilePanel}>
            <Sidebar compact />
          </div>

          <button
            type="button"
            className={styles.backdropClose}
            onClick={() => setMobileOpen(false)}
            aria-label="Close"
          />
        </div>
      ) : null}
    </div>
  );
}
