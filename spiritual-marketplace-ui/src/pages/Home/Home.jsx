// src/pages/Home/Home.jsx
import { useEffect, useMemo, useState } from "react";
import styles from "./Home.module.css";
import { Link, useNavigate } from "react-router-dom";
import { api, API_BASE } from "../../lib/api";
import useRequireAuth from "../../hooks/useRequireAuth";
import { buildSsoUrl } from "../../utils/ssoUrl";

// Fallback (your current dummy data)
import { FEATURED_PRODUCTS } from "../../data/products";
import { FEATURED_COURSES } from "../../data/courses";

// ---------- helpers ----------
function normalizeList(payload) {
  // supports: {items:[]}, {products:[]}, {courses:[]}, {data:[]}
  const items = payload?.items || payload?.products || payload?.courses || payload?.data || [];
  return Array.isArray(items) ? items : [];
}

// make backend /uploads path absolute so browser can load images
function absUrl(u) {
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return `${API_BASE}${u.startsWith("/") ? "" : "/"}${u}`;
}

function sumDurationSecFromLessons(lessons) {
  if (!Array.isArray(lessons) || !lessons.length) return 0;
  return lessons.reduce((acc, l) => acc + Number(l?.durationSec || 0), 0);
}

function fmtDurationFromSec(sec) {
  const s = Number(sec || 0);
  if (!Number.isFinite(s) || s <= 0) return "";
  const totalMin = Math.round(s / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

// Try to derive duration for a course from backend fields
function getCourseDuration(course) {
  if (course?.duration) return String(course.duration);
  if (course?.totalDuration) return String(course.totalDuration);

  const totalSec = sumDurationSecFromLessons(course?.lessons);
  const pretty = fmtDurationFromSec(totalSec);
  return pretty || "";
}

function getCourseLessonsCount(course) {
  if (course?.lessonsCount != null) return Number(course.lessonsCount);
  if (course?.lessonCount != null) return Number(course.lessonCount);
  if (Array.isArray(course?.lessons)) return course.lessons.length;
  return null;
}

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState(null); // null = loading, [] = loaded empty
  const [featuredCourses, setFeaturedCourses] = useState(null);

  const requireAuth = useRequireAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const prodRes = await api.get("/api/products", {
          query: { page: 1, limit: 8, featured: true },
        });

        let courseRes = null;
        try {
          courseRes = await api.get("/api/courses", {
            query: { page: 1, limit: 4, featured: true },
          });
        } catch {
          try {
            courseRes = await api.get("/api/trainings", {
              query: { page: 1, limit: 4, featured: true },
            });
          } catch {
            courseRes = null;
          }
        }

        if (!mounted) return;

        const products = normalizeList(prodRes);
        const courses = normalizeList(courseRes);

        setFeaturedProducts(products);
        setFeaturedCourses(courses);
      } catch {
        if (!mounted) return;
        setFeaturedProducts([]);
        setFeaturedCourses([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // ✅ fallback to dummy if backend returns empty
  const productsToRender = useMemo(() => {
    if (featuredProducts == null) return FEATURED_PRODUCTS; // loading
    return featuredProducts.length ? featuredProducts : FEATURED_PRODUCTS;
  }, [featuredProducts]);

  const coursesToRender = useMemo(() => {
    if (featuredCourses == null) return FEATURED_COURSES; // loading
    return featuredCourses.length ? featuredCourses : FEATURED_COURSES;
  }, [featuredCourses]);

  async function handleBuyCourse(course) {
    const id = course?._id || course?.id;
    if (!id) return;

    const price = Number(course?.price || 0);

    await requireAuth(async () => {
      // free => direct
      if (price === 0) {
        navigate(`/viewer/${id}`);
        return;
      }

      // paid => backend purchase then viewer
      await api.post(`/api/courses/${id}/buy`, {});
      navigate(`/viewer/${id}`);
    });
  }

  function handleToolCalculation() {
    // same tab => browser back returns to home automatically
    window.location.href = buildSsoUrl("https://asbreports.in/");
  }

  return (
    <div className={styles.page}>
      {/* ✅ Floating pill between banner (slider) and hero */}
      <div className={styles.floatingToolWrap}>
        <button
          type="button"
          className={styles.floatingToolPill}
          onClick={handleToolCalculation}
          aria-label="Open Tool / Calculation"
        >
          Tool / Calculation
        </button>
      </div>

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <h1 className={styles.h1}>Sacred Gifts. Healing Tools. Calm Living.</h1>

            <p className={styles.sub}>
              Discover premium spiritual products and trainings curated for peace, clarity, and positive energy — with a calm,
              trustworthy shopping experience.
            </p>

            <div className={styles.ctas}>
              <Link to="/shop" className="btn-primary">
                Shop Now
              </Link>
              <Link to="/courses" className="btn-outline">
                Explore Trainings
              </Link>
            </div>

            <div className={styles.trustRow}>
              <span className={styles.trustPill}>Premium Curation</span>
              <span className={styles.trustPill}>Gift-Ready Options</span>
              <span className={styles.trustPill}>Calm Checkout</span>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.visualCard}>
              <div className={styles.visualTitle}>Today’s Highlights</div>

              <div className={styles.visualGrid}>
                <div className={styles.visualItem}>
                  <span className={styles.visualLabel}>Featured</span>
                  <strong>Healing Stones</strong>
                </div>
                <div className={styles.visualItem}>
                  <span className={styles.visualLabel}>Gifting</span>
                  <strong>Occasion Ready</strong>
                </div>
                <div className={styles.visualItem}>
                  <span className={styles.visualLabel}>Trainings</span>
                  <strong>Beginner → Advanced</strong>
                </div>
                <div className={styles.visualItem}>
                  <span className={styles.visualLabel}>Mood</span>
                  <strong>Calm & Premium</strong>
                </div>
              </div>

              <p className={styles.visualNote}>A minimal, peaceful space designed for spiritual shopping — across all screens.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.h2}>Featured Products</h2>
          <Link to="/shop" className={styles.link}>
            View all →
          </Link>
        </div>

        <div className={styles.gridProducts}>
          {productsToRender.map((p) => {
            const id = p._id || p.id;
            const name = p.title || p.name;
            const category = p?.categoryId?.name || p.category || "Product";
            const price = p.price;
            const rating = (p.ratingAvg ?? p.rating) || 4.5;

            const img = absUrl(p?.images?.[0]);

            return (
              <div key={id} className={styles.card}>
                <div className={styles.cardMedia}>
                  {img ? (
                    <img
                      src={img}
                      alt={name}
                      style={{ width: "100%", height: "180px", objectFit: "cover", display: "block" }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : null}

                  <span className={styles.badge}>{category}</span>
                </div>

                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{name}</h3>

                  <div className={styles.cardMeta}>
                    <span className={styles.price}>₹{price}</span>
                    <span className={styles.rating}>★ {Number(rating).toFixed(1)}</span>
                  </div>

                  <div className={styles.cardActions}>
                    <Link to={`/product/${id}`} className="btn-outline">
                      View
                    </Link>
                    <button className="btn-outline" type="button">
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* GIFTING */}
      <section className={styles.gifting}>
        <div className={styles.giftInner}>
          <div>
            <h2 className={styles.h2}>Make it a Gift — in one step</h2>
            <p className={styles.sub}>
              Add recipient name, a heartfelt message, and an occasion. Perfect for birthdays, anniversaries, and festivals.
            </p>

            <Link to="/shop" className="btn-primary">
              Shop Gifts
            </Link>
          </div>

          <div className={styles.giftCard}>
            <div>
              <b>Recipient:</b> Priya Sharma
            </div>
            <div>
              <b>Occasion:</b> Birthday
            </div>
            <div>
              <b>Message:</b> Wishing you calm & joy ✨
            </div>
          </div>
        </div>
      </section>

      {/* COURSES / TRAININGS */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.h2}>Featured Trainings</h2>
          <Link to="/courses" className={styles.link}>
            View all →
          </Link>
        </div>

        <div className={styles.gridCourses}>
          {coursesToRender.map((c) => {
            const id = c._id || c.id;
            const title = c.title || c.name;

            const lessonsCount = getCourseLessonsCount(c);
            const durationText = getCourseDuration(c);

            const lessonsText = lessonsCount == null ? "— lessons" : `${lessonsCount} lessons`;
            const durationPart = durationText ? durationText : "—";

            const price = Number(c?.price || 0);
            const img = absUrl(c?.thumbnail);

            return (
              <div key={id} className={styles.courseCard}>
                {img ? (
                  <img
                    src={img}
                    alt={title}
                    style={{
                      width: "100%",
                      height: 140,
                      objectFit: "cover",
                      borderRadius: 14,
                      marginBottom: 10,
                      display: "block",
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : null}

                <span className={styles.courseTag}>Training</span>
                <h3>{title}</h3>
                <p>
                  {durationPart} • {lessonsText}
                </p>

                <div className={styles.cardActions}>
                  <Link to={`/courses/${id}`} className="btn-outline">
                    View
                  </Link>

                  <button
                    className="btn-primary"
                    type="button"
                    onClick={() => handleBuyCourse({ ...c, _id: id, price })}
                  >
                    {price === 0 ? "Start" : "Buy / Access"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
