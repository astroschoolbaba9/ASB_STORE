import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import styles from "./SectionPage.module.css";
import { api } from "../../lib/api";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function normalizeKey(key) {
  const k = String(key || "").toLowerCase();
  if (k.includes("gift")) return "gifts";
  if (k.includes("remed")) return "remedies";
  if (k.includes("stone") || k.includes("crystal")) return "stones";
  return k || "shop";
}

export default function SectionPage() {
  const { key } = useParams();
  const sectionKey = useMemo(() => normalizeKey(key), [key]);
  const query = useQuery();

  const [categories, setCategories] = useState([]); // backend categories
  const [products, setProducts] = useState([]);     // backend products
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [activeCat, setActiveCat] = useState("All");
  const [sortBy, setSortBy] = useState("popular"); // UI only, maps to backend sortBy if supported

  // ✅ read cat from URL
  useEffect(() => {
    const cat = query.get("cat");
    if (!cat) {
      setActiveCat("All");
      return;
    }
    setActiveCat(decodeURIComponent(cat));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, sectionKey]);

  // ✅ load categories for this section from backend
  useEffect(() => {
    let alive = true;

    const loadCats = async () => {
      try {
        setError("");
        // If your backend supports /api/categories?section=gifts
        const res = await api.get("/api/categories", { query: { section: sectionKey } });
        if (!alive) return;

        const list = res.categories || [];
        // ensure "All" at top
        const names = ["All", ...list.map((c) => c.name).filter((n) => n && n !== "All")];
        setCategories(names);
      } catch (e) {
        console.error("Section categories failed:", e);
        if (!alive) return;
        // fallback to empty but still usable
        setCategories(["All"]);
        setError(e?.message || "Failed to load categories");
      }
    };

    loadCats();
    return () => {
      alive = false;
    };
  }, [sectionKey]);

  // ✅ load products for this section + active category
  useEffect(() => {
    let alive = true;

    const loadProducts = async () => {
      try {
        setLoading(true);
        setError("");

        // Backend query:
        // - section: sectionKey (you will implement filtering in products endpoint OR map via category)
        // - category: activeCat (unless All)
        const q = {
          section: sectionKey,
          sortBy
        };
        if (activeCat && activeCat !== "All") q.category = activeCat;

        const res = await api.get("/api/products", { query: q });
        if (!alive) return;

        setProducts(res.items || []);
      } catch (e) {
        console.error("Section products failed:", e);
        if (!alive) return;
        setProducts([]);
        setError(e?.message || "Failed to load products");
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadProducts();
    return () => {
      alive = false;
    };
  }, [sectionKey, activeCat, sortBy]);

  const title = useMemo(() => {
    if (sectionKey === "gifts") return "Spiritual Gifts";
    if (sectionKey === "remedies") return "Remedies";
    if (sectionKey === "stones") return "Healing Stones";
    return "Section";
  }, [sectionKey]);

  const subtitle = useMemo(() => {
    if (sectionKey === "gifts")
      return "Thoughtfully curated spiritual gifts for every occasion — meaningful, calm, and premium.";
    if (sectionKey === "remedies")
      return "Find remedies for protection, abundance, health and peace.";
    if (sectionKey === "stones")
      return "Crystals and stones for calm, clarity, and energy.";
    return "Browse items.";
  }, [sectionKey]);

  return (
    <div className={styles.page}>
      {/* HERO */}
      <div className={styles.heroCard}>
        <div className={styles.heroPill}>{title}</div>
        <h1 className={styles.h1}>{title}</h1>
        <p className={styles.sub}>{subtitle}</p>

        {/* chips row */}
        <div className={styles.chipsRow}>
          {(categories.length ? categories : ["All"]).slice(0, 9).map((c) => (
            <button
              key={c}
              type="button"
              className={`${styles.chip} ${activeCat === c ? styles.chipActive : ""}`}
              onClick={() => setActiveCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* CATEGORY SCROLL BOX like screenshot */}
      <div className={styles.catBox}>
        <div className={styles.catTitle}>Categories</div>
        <div className={styles.catScroll}>
          {(categories.length ? categories : ["All"]).map((c) => (
            <button
              key={c}
              type="button"
              className={`${styles.catRow} ${activeCat === c ? styles.catRowActive : ""}`}
              onClick={() => setActiveCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* TOOLBAR */}
      <div className={styles.toolbar}>
        <div className={styles.muted}>
          Showing <b>{title}</b> / <b>{activeCat}</b>
        </div>

        <div className={styles.toolsRight}>
          <select
            className={styles.select}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="popular">Sort: Popular</option>
            <option value="featured">Sort: Featured</option>
            <option value="priceLow">Sort: Price (Low)</option>
            <option value="priceHigh">Sort: Price (High)</option>
          </select>

          <button type="button" className={`btn-outline ${styles.filterBtn}`}>
            Filter (UI)
          </button>
        </div>
      </div>

      {error ? <div className={styles.error}>{error}</div> : null}
      {loading ? <div className={styles.empty}>Loading...</div> : null}

      {/* PRODUCTS GRID */}
      <div className={styles.grid}>
        {!loading && products.length === 0 ? (
          <div className={styles.empty}>
            No products found for <b>{activeCat}</b>.
          </div>
        ) : (
          products.map((p) => {
            const id = p._id || p.id;
            const name = p.title || p.name || "Product";
            const price = p.price ?? 0;
            const catLabel = p.category?.name || p.category || "General";

            return (
              <div key={id} className={styles.card}>
                <div className={styles.media}>
                  <div className={styles.badge}>{catLabel}</div>
                </div>

                <div className={styles.body}>
                  <div className={styles.title}>{name}</div>
                  <div className={styles.meta}>
                    <span className={styles.price}>₹{price}</span>
                  </div>

                  <div className={styles.actions}>
                    <Link to={`/product/${id}`} className={`btn-outline ${styles.btnLink}`}>
                      View
                    </Link>
                    <Link to={`/shop?cat=${encodeURIComponent(catLabel)}`} className={`btn-outline ${styles.btnLink}`}>
                      Shop Similar
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
