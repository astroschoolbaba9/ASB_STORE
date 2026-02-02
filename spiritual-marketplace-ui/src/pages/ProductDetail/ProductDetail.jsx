// src/pages/ProductDetail/ProductDetail.jsx
import { useMemo, useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import styles from "./ProductDetail.module.css";
import useRequireAuth from "../../hooks/useRequireAuth";
import { useCart } from "../../context/CartContext";
import Toast from "../../components/ui/Toast";
import { api } from "../../lib/api";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";

function absUrl(u) {
  const s = String(u || "").trim();
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  const withSlash = s.startsWith("/") ? s : `/${s}`;
  return `${API_BASE}${withSlash}`;
}

function StarRow({ value = 0 }) {
  const full = Math.round(value);
  return (
    <span aria-label={`Rating ${value} out of 5`}>
      {"★★★★★".split("").map((s, i) => (
        <span key={i} style={{ opacity: i < full ? 1 : 0.25 }}>
          ★
        </span>
      ))}
    </span>
  );
}

function pct(count, total) {
  if (!total) return 0;
  return Math.round((count / total) * 100);
}

export default function ProductDetail() {
  const { id } = useParams();
  const requireAuth = useRequireAuth();
  const navigate = useNavigate();
  const cart = useCart();
  const addItem = cart.addItem || cart.addToCart;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // gallery
  const [imgIndex, setImgIndex] = useState(0);

  // cart
  const [qty, setQty] = useState(1);

  // 🎁 gift fields
  const [gift, setGift] = useState(false);
  const [giftWrap, setGiftWrap] = useState(false);

  const [recipient, setRecipient] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");

  const [occasion, setOccasion] = useState("Birthday");
  const [message, setMessage] = useState("");

  // optional: show wrap price (if you add /api/gift-config/public)
  const [giftWrapPrice, setGiftWrapPrice] = useState(0);
  const [giftEnabled, setGiftEnabled] = useState(true);
  const [giftWrapEnabled, setGiftWrapEnabled] = useState(true);

  const [toastOpen, setToastOpen] = useState(false);
  const showToast = () => {
    setToastOpen(true);
    window.clearTimeout(window.__asb_toast_pd);
    window.__asb_toast_pd = window.setTimeout(() => setToastOpen(false), 1200);
  };

  // reviews
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsErr, setReviewsErr] = useState("");
  const [reviews, setReviews] = useState([]);
  const [reviewsSummary, setReviewsSummary] = useState({
    avg: 0,
    total: 0,
    counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);

  const [reviewSort, setReviewSort] = useState("latest"); // latest | helpful
  const [reviewWithPhotos, setReviewWithPhotos] = useState(false);
  const [reviewRatingFilter, setReviewRatingFilter] = useState(0); // 0=all, 5,4,3...

  // Load product
  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/api/products/${id}`);
        if (!alive) return;
        setProduct(res.product || null);
        setImgIndex(0);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || "Failed to load product");
        setProduct(null);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [id]);

  // Load GiftConfig (public)
  useEffect(() => {
    let alive = true;
    const loadGiftConfig = async () => {
      try {
        const res = await api.get("/api/gift-config/public");
        const cfg = res?.config || {};
        if (!alive) return;

        setGiftEnabled(cfg.enabled !== false);
        setGiftWrapEnabled(cfg.giftWrapEnabled !== false);
        setGiftWrapPrice(Number(cfg.giftWrapPrice || 0));

        if (cfg.giftWrapEnabled === false) setGiftWrap(false);
        if (cfg.enabled === false) {
          setGift(false);
          setGiftWrap(false);
        }
      } catch {
        // optional
      }
    };
    loadGiftConfig();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load reviews
  const loadReviews = async () => {
    if (!id) return;
    setReviewsLoading(true);
    setReviewsErr("");
    try {
      const query = {
        sort: reviewSort,
        withPhotos: reviewWithPhotos ? "true" : "false"
      };
      if (reviewRatingFilter) query.rating = reviewRatingFilter;

      const res = await api.get(`/api/products/${id}/reviews`, { query });

      const items = Array.isArray(res?.items) ? res.items : [];
      const s = res?.summary || {};
      setReviewsSummary({
        avg: Number(s.avgRating || 0),
        total: Number(s.totalRatings || 0),
        counts: s.countsByRating || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      });

      setReviews(items);
    } catch (e) {
      setReviewsErr(e?.message || "Failed to load reviews");
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, reviewSort, reviewWithPhotos, reviewRatingFilter]);

  const ratingSummary = useMemo(() => {
    const avg = Number(reviewsSummary?.avg || product?.ratingAvg || 0);
    const total = Number(reviewsSummary?.total || product?.ratingCount || 0);
    const counts = reviewsSummary?.counts || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    return { avg, total, counts };
  }, [reviewsSummary, product]);

  if (loading) {
    return (
      <div className={styles.notFound}>
        <h1>Loading...</h1>
        <p className={styles.muted}>Please wait</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.notFound}>
        <h1>Something went wrong</h1>
        <p className={styles.muted}>{error}</p>
        <Link to="/shop" className="btn-primary">
          Back to Shop
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={styles.notFound}>
        <h1>Product not found</h1>
        <p className={styles.muted}>This product ID doesn’t exist.</p>
        <Link to="/shop" className="btn-primary">
          Back to Shop
        </Link>
      </div>
    );
  }

  const productId = product._id || product.id;
  const name = product.title || product.name || "Product";
  const price = product.price ?? 0;
  const rating = product.ratingAvg ?? product.rating ?? 0;
  const categoryLabel = product.categoryId?.name || product.category?.name || product.category || "General";

  // ✅ make absolute URLs
  const imagesRaw = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
  const images = imagesRaw.map(absUrl).filter(Boolean);

  const mainImg = images[imgIndex] || images[0] || "";

  const spiritualUse = product.spiritualUse || "";
  const careHandling = product.careHandling || "";
  const shippingReturns = product.shippingReturns || "";

  const addToCartHandler = async (goTo) => {
    await requireAuth(async () => {
      const payload = {
        productId,
        qty
      };

      if (gift && giftEnabled) {
        payload.isGift = true;
        payload.giftWrap = !!(giftWrap && giftWrapEnabled);
        payload.giftOccasion = occasion || "";
        payload.giftMessage = message || "";
        payload.recipientName = recipient || "";
        payload.recipientPhone = recipientPhone || "";
      }

      await addItem(payload);
      showToast();
      navigate(goTo);
    });
  };

  const submitReview = async () => {
    if (!reviewText.trim()) return;

    setReviewSaving(true);
    try {
      await requireAuth(async () => {
        await api.post(`/api/products/${productId}/reviews`, {
          rating: reviewRating,
          title: reviewTitle,
          comment: reviewText
        });
      });

      setReviewOpen(false);
      setReviewTitle("");
      setReviewText("");
      setReviewRating(5);

      await loadReviews();
    } catch (e) {
      alert(e?.message || "Failed to submit review");
    } finally {
      setReviewSaving(false);
    }
  };

  const markHelpful = async (reviewId) => {
    try {
      await api.post(`/api/reviews/${reviewId}/helpful`, {});
      await loadReviews();
    } catch {
      // ignore
    }
  };

  return (
    <>
      <div className={styles.page}>
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link to="/" className={styles.bcrumbLink}>Home</Link>
          <span className={styles.dot}>•</span>
          <Link to="/shop" className={styles.bcrumbLink}>Shop</Link>
          <span className={styles.dot}>•</span>
          <span className={styles.bcrumbCurrent}>{name}</span>
        </div>

        <div className={styles.main}>
          {/* Gallery */}
          <section className={styles.gallery}>
            <div
              className={styles.mainImg}
              style={
                mainImg
                  ? { backgroundImage: `url(${mainImg})`, backgroundSize: "cover", backgroundPosition: "center" }
                  : {}
              }
            >
              <div className={styles.badge}>{categoryLabel}</div>
            </div>

            <div className={styles.thumbRow}>
              {(images.length ? images : ["", "", "", ""]).slice(0, 4).map((u, i) => (
                <button
                  key={`${u}-${i}`}
                  type="button"
                  className={styles.thumb}
                  onClick={() => setImgIndex(i)}
                  style={u ? { backgroundImage: `url(${u})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
                  aria-label={`Image ${i + 1}`}
                />
              ))}
            </div>

            <div className={styles.note}>
              {images.length ? "Images loaded from backend." : "No images yet. Upload in admin to see here."}
            </div>
          </section>

          {/* Info */}
          <section className={styles.info}>
            <h1 className={styles.h1}>{name}</h1>

            <div className={styles.metaRow}>
              <div className={styles.price}>₹{price}</div>
              <div className={styles.rating}>
                <span className={styles.starsInline}><StarRow value={rating} /></span>
                <span className={styles.ratingNum}>({Number(ratingSummary.total || 0)})</span>
              </div>
            </div>

            <p className={styles.sub}>{product.description || "—"}</p>

            {/* Qty + CTAs */}
            <div className={styles.buyRow}>
              <div className={styles.qty}>
                <button type="button" className={styles.qtyBtn} onClick={() => setQty((q) => Math.max(1, q - 1))}>
                  −
                </button>
                <div className={styles.qtyVal}>{qty}</div>
                <button type="button" className={styles.qtyBtn} onClick={() => setQty((q) => q + 1)}>
                  +
                </button>
              </div>

              <button className="btn-outline" type="button" onClick={() => addToCartHandler("/cart")}>
                Add to Cart
              </button>

              <button className="btn-primary" type="button" onClick={() => addToCartHandler("/checkout")}>
                Buy Now
              </button>
            </div>

            {/* Gift toggle */}
            {giftEnabled ? (
              <div className={styles.giftToggle}>
                <label className={styles.checkRow}>
                  <input
                    type="checkbox"
                    checked={gift}
                    onChange={(e) => {
                      const v = e.target.checked;
                      setGift(v);
                      if (!v) setGiftWrap(false);
                    }}
                  />
                  <span className={styles.checkText}>Gift This Product</span>
                </label>
                <p className={styles.mutedSmall}>
                  Gift info will be saved inside the cart item → order item and visible to admin.
                </p>
              </div>
            ) : null}

            {/* Gift form */}
            {gift && giftEnabled ? (
              <div className={styles.giftForm}>
                <div className={styles.formGrid}>
                  <div className={styles.field}>
                    <label className={styles.label}>Recipient Name</label>
                    <input
                      className={styles.input}
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="Enter recipient name"
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Recipient Phone</label>
                    <input
                      className={styles.input}
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Occasion</label>
                    <select className={styles.input} value={occasion} onChange={(e) => setOccasion(e.target.value)}>
                      <option>Birthday</option>
                      <option>Anniversary</option>
                      <option>Wedding</option>
                      <option>House Warming</option>
                      <option>Festival</option>
                      <option>Rakhi</option>
                      <option>Other</option>
                    </select>
                  </div>

                  {giftWrapEnabled ? (
                    <div className={styles.field} style={{ display: "flex", alignItems: "end" }}>
                      <label className={styles.checkRow} style={{ margin: 0 }}>
                        <input type="checkbox" checked={giftWrap} onChange={(e) => setGiftWrap(e.target.checked)} />
                        <span className={styles.checkText}>
                          Gift Wrap {giftWrapPrice > 0 ? `(₹${giftWrapPrice})` : ""}
                        </span>
                      </label>
                    </div>
                  ) : null}

                  <div className={styles.fieldFull}>
                    <label className={styles.label}>Message</label>
                    <textarea
                      className={styles.textarea}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Write a calm, heartfelt message..."
                      rows={4}
                    />
                  </div>
                </div>

                <div className={styles.mutedSmall} style={{ marginTop: 8 }}>
                  Wrap total is calculated in Cart/Checkout based on quantity.
                </div>
              </div>
            ) : null}

            {/* Description blocks (Admin-controlled) */}
            <div className={styles.descBlocks}>
              <div className={styles.block}>
                <div className={styles.blockTitle}>Spiritual Use</div>
                <p className={styles.blockText}>
                  {spiritualUse || "Use this product as part of your daily calm routine. Admin can add this content."}
                </p>
              </div>

              <div className={styles.block}>
                <div className={styles.blockTitle}>Care & Handling</div>
                <p className={styles.blockText}>
                  {careHandling || "Keep in a clean, dry place. Admin can add real care instructions."}
                </p>
              </div>

              <div className={styles.block}>
                <div className={styles.blockTitle}>Shipping & Returns</div>
                <p className={styles.blockText}>
                  {shippingReturns || "Admin can add real shipping/returns policy."}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* =========================
          REAL REVIEWS SECTION
         ========================= */}
        <div className={styles.reviewsWrap}>
          <div className={styles.reviewsHead}>
            <div>
              <h2 className={styles.reviewsTitle}>Ratings & Reviews</h2>
              <p className={styles.reviewsSub}>Now powered by backend.</p>
            </div>

            <button type="button" className="btn-primary" onClick={() => requireAuth(() => setReviewOpen(true))}>
              Write a Review
            </button>
          </div>

          <div className={styles.reviewsGrid}>
            {/* Summary card */}
            <div className={styles.summaryCard}>
              <div className={styles.summaryTop}>
                <div className={styles.summaryAvg}>{Number(ratingSummary.avg || 0).toFixed(1)}</div>
                <div className={styles.summaryRight}>
                  <div className={styles.summaryStars}>
                    <StarRow value={ratingSummary.avg} />
                  </div>
                  <div className={styles.summaryCount}>{ratingSummary.total} ratings</div>
                </div>
              </div>

              <div className={styles.dist}>
                {[5, 4, 3, 2, 1].map((n) => {
                  const count = ratingSummary.counts?.[n] || ratingSummary.counts?.[String(n)] || 0;
                  const p = pct(count, ratingSummary.total);
                  return (
                    <div key={n} className={styles.distRow}>
                      <div className={styles.distLabel}>{n}★</div>
                      <div className={styles.distBar}>
                        <div className={styles.distFill} style={{ width: `${p}%` }} />
                      </div>
                      <div className={styles.distPct}>{p}%</div>
                    </div>
                  );
                })}
              </div>

              <div className={styles.reviewFilterRow}>
                <button
                  className={styles.filterPill}
                  type="button"
                  onClick={() => setReviewSort("helpful")}
                  style={reviewSort === "helpful" ? { outline: "2px solid rgba(106,92,255,0.25)" } : {}}
                >
                  Most Helpful
                </button>
                <button
                  className={styles.filterPill}
                  type="button"
                  onClick={() => setReviewSort("latest")}
                  style={reviewSort === "latest" ? { outline: "2px solid rgba(106,92,255,0.25)" } : {}}
                >
                  Latest
                </button>
                <button
                  className={styles.filterPill}
                  type="button"
                  onClick={() => setReviewWithPhotos((v) => !v)}
                  style={reviewWithPhotos ? { outline: "2px solid rgba(106,92,255,0.25)" } : {}}
                >
                  With Photos
                </button>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                <button
                  className={styles.filterPill}
                  type="button"
                  onClick={() => setReviewRatingFilter(0)}
                  style={reviewRatingFilter === 0 ? { outline: "2px solid rgba(106,92,255,0.25)" } : {}}
                >
                  Any
                </button>
                {[5, 4, 3, 2, 1].map((n) => (
                  <button
                    key={n}
                    className={styles.filterPill}
                    type="button"
                    onClick={() => setReviewRatingFilter(n)}
                    style={reviewRatingFilter === n ? { outline: "2px solid rgba(106,92,255,0.25)" } : {}}
                  >
                    {n}★
                  </button>
                ))}
              </div>
            </div>

            {/* Review list */}
            <div className={styles.reviewList}>
              {reviewsLoading ? (
                <div className={styles.muted}>Loading reviews…</div>
              ) : reviewsErr ? (
                <div className={styles.muted}>{reviewsErr}</div>
              ) : reviews.length === 0 ? (
                <div className={styles.muted}>No reviews yet. Be the first!</div>
              ) : (
                reviews.map((r) => {
                  const uname = r?.userId?.name || "User";
                  const date = r?.createdAt ? new Date(r.createdAt).toLocaleDateString() : "";
                  return (
                    <div key={r._id} className={styles.reviewCard}>
                      <div className={styles.reviewTop}>
                        <div className={styles.avatar}>{uname.slice(0, 1).toUpperCase()}</div>
                        <div className={styles.reviewMeta}>
                          <div className={styles.reviewName}>{uname}</div>
                          <div className={styles.reviewMini}>
                            <span className={styles.reviewStars}><StarRow value={r.rating} /></span>
                            <span className={styles.reviewDate}>{date}</span>
                          </div>
                        </div>
                      </div>

                      <div className={styles.reviewTitle}>{r.title || "—"}</div>
                      <div className={styles.reviewText}>{r.comment || "—"}</div>

                      <div className={styles.reviewActions}>
                        <button type="button" className={styles.smallBtn} onClick={() => markHelpful(r._id)}>
                          Helpful ({r.helpfulCount || 0})
                        </button>
                        <button type="button" className={styles.smallBtn} onClick={() => alert("Report feature later")}>
                          Report
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Review modal */}
        {reviewOpen ? (
          <div
            className={styles.modalBackdrop}
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setReviewOpen(false);
            }}
          >
            <div
              className={styles.modalCard}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalTop}>
                <div className={styles.modalTitle}>Write a Review</div>
                <button
                  type="button"
                  className={styles.modalClose}
                  onClick={() => setReviewOpen(false)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className={styles.modalBody}>
                <label className={styles.label}>Rating</label>
                <div className={styles.ratingPick}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`${styles.starBtn} ${reviewRating >= n ? styles.starBtnOn : ""}`}
                      onClick={() => setReviewRating(n)}
                      aria-label={`${n} star`}
                    >
                      ★
                    </button>
                  ))}
                </div>

                <label className={styles.label} htmlFor="review_title">Title</label>
                <input
                  id="review_title"
                  name="review_title"
                  className={styles.input}
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="Short review title"
                  autoComplete="off"
                />

                <label className={styles.label} htmlFor="review_comment">Review</label>
                <textarea
                  id="review_comment"
                  name="review_comment"
                  className={styles.textarea}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Write your experience..."
                  rows={5}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setReviewOpen(false)}
                  disabled={reviewSaving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={submitReview}
                  disabled={reviewSaving || !reviewText.trim()}
                >
                  {reviewSaving ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <Toast message="Added to Cart" open={toastOpen} />
    </>
  );
}
export { absUrl };