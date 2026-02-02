import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import styles from "./Shop.module.css";
import useRequireAuth from "../../hooks/useRequireAuth";
import { useCart } from "../../context/CartContext";
import Toast from "../../components/ui/Toast";
import { api } from "../../lib/api";
import { normalizeList, normalizeCategory, normalizeProduct } from "../../lib/normalize";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";

function absUrl(u) {
  const s = String(u || "").trim();
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  const withSlash = s.startsWith("/") ? s : `/${s}`;
  return `${API_BASE}${withSlash}`;
}

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function getMeta(group) {
  const g = String(group || "shop").toLowerCase();
  if (g === "gifts") {
    return { title: "Gifts", sub: "Browse curated spiritual gifting for every occasion." };
  }
  return { title: "Shop", sub: "Browse premium spiritual products." };
}

export default function Shop() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);

  const [categories, setCategories] = useState([]);
  const [categorySlug, setCategorySlug] = useState(""); // ✅ slug, not name

  const [sortBy, setSortBy] = useState("newest");
  const [search, setSearch] = useState("");
  const [minRating, setMinRating] = useState(0);

  const [page, setPage] = useState(1);
  const limit = 12;

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const requireAuth = useRequireAuth();
  const navigate = useNavigate();
  const query = useQuery();
  const cart = useCart();
  const addItem = cart.addItem || cart.addToCart;

  const groupFromUrl = String(query.get("group") || "shop").toLowerCase();
  const group = groupFromUrl === "gifts" ? "gifts" : "shop";
  const meta = useMemo(() => getMeta(group), [group]);

  const showToast = () => {
    setToastOpen(true);
    window.clearTimeout(window.__asb_toast);
    window.__asb_toast = window.setTimeout(() => setToastOpen(false), 1200);
  };

  // reset when group changes
  useEffect(() => {
    setCategorySlug("");
    setPage(1);
  }, [group]);

  // category from URL (accept cat=name OR cat=slug)
  useEffect(() => {
    const raw = query.get("cat");
    if (!raw) return;
    const decoded = decodeURIComponent(raw);
    const matchBySlug = categories.find((c) => c.slug === decoded);
    if (matchBySlug) setCategorySlug(matchBySlug.slug);
    else {
      const matchByName = categories.find((c) => c.name === decoded);
      if (matchByName) setCategorySlug(matchByName.slug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.get("cat"), categories]);

  // load categories for this group
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get("/api/categories", { query: { group } });
        const arr = normalizeList(res, ["categories", "items", "data"]);
        const normalized = arr
          .map(normalizeCategory)
          .filter((c) => c.isActive !== false)
          .filter((c) => (c.slug || "").trim() && (c.name || "").trim());
        if (!alive) return;
        setCategories(normalized);
      } catch {
        if (!alive) return;
        setCategories([]);
      }
    })();
    return () => { alive = false; };
  }, [group]);

  // reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [categorySlug, sortBy, search, minRating]);

  // load products from backend (backend does group filtering)
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const q = {
          group,
          page,
          limit,
          search: search || "",
        };

        if (categorySlug) q.category = categorySlug;

        if (sortBy === "priceLow") q.sort = "price_asc";
        else if (sortBy === "priceHigh") q.sort = "price_desc";
        else if (sortBy === "ratingHigh") q.sort = "rating_desc";
        else if (sortBy === "featured") q.sort = "featured";
        else q.sort = "newest";

        const res = await api.get("/api/products", { query: q });
        if (!alive) return;

        const arr = normalizeList(res, ["items", "products", "data"]);
        const normalized = arr.map(normalizeProduct).filter((p) => p._id);

        let final = normalized;
        if (minRating > 0) final = final.filter((p) => (p.ratingAvg || 0) >= minRating);

        setProducts(final);
        setTotal(typeof res.total === "number" ? res.total : final.length);
      } catch (e) {
        if (!alive) return;
setError(e?.response?.message || e?.message || "Failed to load products");
        setProducts([]);
        setTotal(0);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [group, page, limit, categorySlug, sortBy, search, minRating]);

  const totalPages = Math.max(1, Math.ceil((total || 0) / limit));

  const resetFilters = () => {
    setCategorySlug("");
    setSortBy("newest");
    setSearch("");
    setMinRating(0);
    setPage(1);
  };

  const categoryChips = useMemo(() => {
    const base = categories.map((c) => ({ label: c.name, slug: c.slug }));
    return [{ label: "All", slug: "" }, ...base];
  }, [categories]);

  const FiltersPanel = ({ compact = false }) => (
    <div className={`${styles.panel} ${compact ? styles.panelCompact : ""}`}>
      <div className={styles.panelTop}>
        <div className={styles.panelTitle}>Filters</div>
        {compact ? (
          <button type="button" className={styles.closeBtn} onClick={() => setFiltersOpen(false)} aria-label="Close filters">
            ✕
          </button>
        ) : null}
      </div>

      <label className={styles.label}>Search</label>
      <input className={styles.input} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." />

      <div className={styles.divider} />

      <label className={styles.label}>Category</label>
      <div className={styles.catList}>
        {categoryChips.map((c) => (
          <button
            key={c.slug || "all"}
            type="button"
            className={`${styles.catChip} ${categorySlug === c.slug ? styles.catChipActive : ""}`}
            onClick={() => setCategorySlug(c.slug)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className={styles.divider} />

      <label className={styles.label}>Minimum Rating</label>
      <div className={styles.ratingRow}>
        {[0, 4.0, 4.5, 4.7].map((r) => (
          <button
            key={r}
            type="button"
            className={`${styles.ratingChip} ${minRating === r ? styles.ratingChipActive : ""}`}
            onClick={() => setMinRating(r)}
          >
            {r === 0 ? "Any" : `★ ${r}+`}
          </button>
        ))}
      </div>

      <div className={styles.divider} />

      <div className={styles.filterActions}>
        <button type="button" className="btn-outline" onClick={resetFilters}>Reset</button>
        {compact ? (
          <button type="button" className="btn-primary" onClick={() => setFiltersOpen(false)}>Apply</button>
        ) : null}
      </div>
    </div>
  );

  return (
    <>
      <div className={styles.page}>
        <div className={styles.head}>
          <div>
            <h1 className={styles.h1}>{meta.title}</h1>
            <p className={styles.sub}>{meta.sub}</p>
          </div>

          <div className={styles.headRight}>
            <button type="button" className={`btn-outline ${styles.filtersBtn}`} onClick={() => setFiltersOpen(true)}>
              Filters
            </button>

            <div className={styles.sortBox}>
              <span className={styles.sortLabel}>Sort</span>
              <select className={styles.select} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="newest">Newest</option>
                <option value="featured">Featured</option>
                <option value="priceLow">Price (Low → High)</option>
                <option value="priceHigh">Price (High → Low)</option>
                <option value="ratingHigh">Rating</option>
              </select>
            </div>
          </div>
        </div>

        <div className={styles.split}>
          <aside className={styles.filters}>
            <FiltersPanel />
          </aside>

          <section className={styles.gridWrap}>
            <div className={styles.gridTop}>
              <div className={styles.count}>
                Showing <b>{products.length}</b> items
              </div>

              <button type="button" className={`btn-outline ${styles.resetTop}`} onClick={resetFilters}>
                Reset
              </button>
            </div>

            {loading ? <div className={styles.empty}>Loading...</div> : null}
            {error ? <div className={styles.empty}>{error}</div> : null}

            <div className={styles.grid}>
              {products.map((p) => {
                const id = p._id;
                const title = p.title || "Product";
                const price = p.price ?? 0;
                const rating = p.ratingAvg ?? 0;
                const catLabel = p.category?.name || "General";
                const imgSrc = absUrl(p.images?.[0]);

                return (
                  <div key={id} className={styles.card}>
                    <div className={styles.media}>
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt={title}
                          className={styles.mediaImg}
                          loading="lazy"
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                      ) : null}
                      <div className={styles.badge}>{catLabel}</div>
                    </div>

                    <div className={styles.body}>
                      <div className={styles.title}>{title}</div>
                      <div className={styles.meta}>
                        <span className={styles.price}>₹{price}</span>
                        <span className={styles.rating}>★ {rating}</span>
                      </div>

                      <div className={styles.actions}>
                        <Link to={`/product/${id}`} className={`btn-outline ${styles.btnLink}`}>
                          View
                        </Link>

                        <button
                          className="btn-primary"
                          type="button"
                          onClick={() =>
                            requireAuth(async () => {
                              await addItem({ productId: id, qty: 1 });
                              showToast();
                              navigate("/cart");
                            })
                          }
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {!loading && !error && products.length === 0 ? (
              <div className={styles.empty}>
                <h3 className={styles.emptyTitle}>No results</h3>
                <p className={styles.emptySub}>Try changing filters or add products from Admin.</p>
              </div>
            ) : null}

            {totalPages > 1 ? (
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
                <button className="btn-outline" type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading}>
                  Prev
                </button>

                <div style={{ alignSelf: "center", fontWeight: 800 }}>
                  Page {page} / {totalPages}
                </div>

                <button className="btn-outline" type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages || loading}>
                  Next
                </button>
              </div>
            ) : null}
          </section>
        </div>

        {filtersOpen ? (
          <div className={styles.filtersBackdrop} role="dialog" aria-modal="true">
            <div className={styles.filtersDrawer}>
              <FiltersPanel compact />
            </div>
            <button className={styles.backdropClose} type="button" onClick={() => setFiltersOpen(false)} aria-label="Close" />
          </div>
        ) : null}
      </div>

      <Toast open={toastOpen} message="Added to cart" />
    </>
  );
}
