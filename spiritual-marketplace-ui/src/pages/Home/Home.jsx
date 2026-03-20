// src/pages/Home/Home.jsx
import { useEffect, useMemo, useState } from "react";
import styles from "./Home.module.css";
import { Link, useNavigate } from "react-router-dom";
import { api, API_BASE } from "../../lib/api";
import useRequireAuth from "../../hooks/useRequireAuth";
import { useCart } from "../../context/CartContext";
import Toast from "../../components/ui/Toast";
import { buildSsoUrl } from "../../utils/ssoUrl";
import JsonLd from "../../components/common/JsonLd";

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
  if (u.startsWith("/banners/") || u.startsWith("/assets/")) return u;
  if (u === "/navratri-poster.jpg") return `${process.env.PUBLIC_URL}/navratri-poster.jpg`;
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
  const [toastOpen, setToastOpen] = useState(false);

  const { addItem } = useCart();
  const requireAuth = useRequireAuth();
  const navigate = useNavigate();

  const showToast = () => {
    setToastOpen(true);
    window.clearTimeout(window.__asb_toast);
    window.__asb_toast = window.setTimeout(() => setToastOpen(false), 1200);
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        let prodRes;
        try {
          prodRes = await api.get("/api/products", {
            query: { page: 1, limit: 60, featured: true },
          });
        } catch (err) {
          // Fallback if backend doesn't support limit > 50
          if (err.status === 400) {
            prodRes = await api.get("/api/products", {
              query: { page: 1, limit: 50, featured: true },
            });
          } else {
            throw err;
          }
        }

        let courseRes = null;
        try {
          try {
            courseRes = await api.get("/api/courses", {
              query: { page: 1, limit: 60, featured: true },
            });
          } catch (err) {
            if (err.status === 400) {
              courseRes = await api.get("/api/courses", {
                query: { page: 1, limit: 50, featured: true },
              });
            } else {
              throw err;
            }
          }
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
      <JsonLd
        id="home-schema"
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": "https://asbcrystal.in/#organization",
              "name": "ASB Crystal Store",
              "url": "https://asbcrystal.in/",
              "logo": {
                "@type": "ImageObject",
                "url": "https://asbcrystal.in/logo.png"
              },
              "sameAs": [
                "https://www.instagram.com/",
                "https://www.facebook.com/"
              ]
            },
            {
              "@type": "WebSite",
              "@id": "https://asbcrystal.in/#website",
              "url": "https://asbcrystal.in/",
              "name": "ASB Crystal Store",
              "publisher": {
                "@id": "https://asbcrystal.in/#organization"
              },
              "inLanguage": "en"
            },
            {
              "@type": "WebPage",
              "@id": "https://asbcrystal.in/#webpage",
              "url": "https://asbcrystal.in/",
              "name": "ASB Crystal Store - Healing Crystals & Spiritual Products",
              "isPartOf": {
                "@id": "https://asbcrystal.in/#website"
              },
              "about": {
                "@id": "https://asbcrystal.in/#organization"
              },
              "description": "Buy healing crystals, spiritual products, and energy tools for positivity, clarity, and peaceful living.",
              "inLanguage": "en"
            },
            {
              "@type": "BreadcrumbList",
              "@id": "https://asbcrystal.in/#breadcrumb",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": "https://asbcrystal.in/"
                }
              ]
            }
          ]
        }}
      />
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

      {/* HERO SECTION - REDESIGNED FOR IMPACT */}
      <section className={styles.heroOuter}>
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <div className={styles.brandBadge}>ASB CRYSTAL • SACRED ENERGY</div>
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
              <span className={styles.trustPill}>✨ Premium Curation</span>
              <span className={styles.trustPill}>🎁 Gift-Ready</span>
              <span className={styles.trustPill}>🛡️ Secure Checkout</span>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.visualCard}>
              <div className={styles.visualTitle}>Why Shop With Us</div>

              <div className={styles.visualGrid}>
                <div className={styles.visualItem}>
                  <span className={styles.visualLabel}>✨ Sacred</span>
                  <strong>Blessed Products</strong>
                </div>
                <div className={styles.visualItem}>
                  <span className={styles.visualLabel}>🔮 High-Vibe</span>
                  <strong>Energized Crystals</strong>
                </div>
                <div className={styles.visualItem}>
                  <span className={styles.visualLabel}>🎁 Gifting</span>
                  <strong>Sacred Packaging</strong>
                </div>
                <div className={styles.visualItem}>
                  <span className={styles.visualLabel}>🚚 Delivery</span>
                  <strong>Pan-India Shipping</strong>
                </div>
              </div>

              <p className={styles.visualNote}>Authentic spiritual tools delivered with care to support your healing journey.</p>
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

            // --- CAMPAIGN OVERRIDE FOR KUBER POTLI (Consistency) ---
            const isPotli = String(p.slug || "").toLowerCase() === "kuber-potli-healing" || (p.title || p.name || "").toLowerCase().includes("kuber potli");
            const finalName = isPotli ? "Kuber Potli — Infused With Sacred Blessings" : name;
            const finalPrice = isPotli ? 2100 : price;
            const finalImg = isPotli ? `${process.env.PUBLIC_URL}/navratri-poster.jpg` : img;

            return (
              <div key={id} className={styles.card}>
                <div className={styles.cardMedia}>
                  {finalImg ? (
                    <img
                      src={finalImg}
                      alt={finalName}
                      style={{ width: "100%", height: "180px", objectFit: "cover", display: "block" }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : null}

                  <span className={styles.badge}>{category}</span>
                </div>

                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{finalName}</h3>

                  <div className={styles.cardMeta}>
                    <span className={styles.price}>₹{finalPrice}</span>
                    <span className={styles.rating}>★ {Number(rating).toFixed(1)}</span>
                  </div>

                  <div className={styles.cardActions}>
                    <Link to={`/product/${id}`} className="btn-outline">
                      View
                    </Link>
                    <button
                      className="btn-primary"
                      type="button"
                      onClick={() => {
                        requireAuth(async () => {
                          await addItem({ productId: id, qty: 1 });
                          showToast();
                          navigate("/cart");
                        });
                      }}
                    >
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

      <Toast open={toastOpen} message="Added to cart" />
    </div>
  );
}
