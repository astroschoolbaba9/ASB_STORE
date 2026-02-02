import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Container from "../layout/Container";
import styles from "./Navbar.module.css";
import { NAV_ITEMS } from "../../data/navData";
import NavItem from "./NavItem";
import MobileMenu from "./MobileMenu";
import logo from "../../assets/brand/logo.jpg";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { normalizeList } from "../../lib/normalize";

function normCat(c) {
  return {
    _id: c?._id || c?.id || "",
    name: String(c?.name || c?.title || "").trim(),
    slug: String(c?.slug || "").trim(),
    group: String(c?.group || "shop").trim().toLowerCase(),
    sortOrder: typeof c?.sortOrder === "number" ? c.sortOrder : Number(c?.sortOrder || 0),
    isActive: typeof c?.isActive === "boolean" ? c.isActive : true,
  };
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [redirectTo, setRedirectTo] = useState("");

  const [shopCats, setShopCats] = useState([]);
  const [giftCats, setGiftCats] = useState([]);

  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();

  const handleProfileClick = () => {
    if (user) {
      navigate("/dashboard/profile");
      return;
    }
    openAuthModal("login", () => navigate("/dashboard/profile"));
  };

  const handleExternalNavigate = (url) => {
    if (!url) return;
    setRedirecting(true);
    setRedirectTo(url);
    window.setTimeout(() => window.location.assign(url), 260);
  };

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // ✅ Shop dropdown = "shop" => non-gifts (includes legacy categories)
        const resShop = await api.get("/api/categories", { query: { group: "shop" } });
        const arrShop = normalizeList(resShop, ["categories", "items", "data"]);
        const shop = arrShop
          .map(normCat)
          .filter((c) => c._id && c.name && c.slug)
          .filter((c) => c.isActive !== false)
          .sort((a, b) => (a.sortOrder - b.sortOrder) || a.name.localeCompare(b.name));

        // ✅ Gifts dropdown
        const resGifts = await api.get("/api/categories", { query: { group: "gifts" } });
        const arrGifts = normalizeList(resGifts, ["categories", "items", "data"]);
        const gifts = arrGifts
          .map(normCat)
          .filter((c) => c._id && c.name && c.slug)
          .filter((c) => c.isActive !== false)
          .sort((a, b) => (a.sortOrder - b.sortOrder) || a.name.localeCompare(b.name));

        if (!alive) return;
        setShopCats(shop);
        setGiftCats(gifts);
      } catch {
        if (!alive) return;
        setShopCats([]);
        setGiftCats([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const itemsForNavbar = useMemo(() => {
    const base = Array.isArray(NAV_ITEMS) ? NAV_ITEMS : [];

    return base.map((it) => {
      const label = String(it.label || "");

      if (label === "Shop") {
        return {
          ...it,
          path: "/shop",
          dropdown: shopCats.map((c) => ({
            label: c.name,
            path: `/shop?cat=${encodeURIComponent(c.slug)}`,
          })),
        };
      }

      if (label === "Gifts") {
        return {
          ...it,
          path: "/shop?group=gifts",
          dropdown: giftCats.map((c) => ({
            label: c.name,
            path: `/shop?group=gifts&cat=${encodeURIComponent(c.slug)}`,
          })),
        };
      }

      return it;
    });
  }, [shopCats, giftCats]);

  return (
    <header className={styles.wrap}>
      {redirecting ? (
        <div className={styles.xfade} role="dialog" aria-label="Redirecting">
          <div className={styles.xfadeCard}>
            <div className={styles.xfadeTitle}>Opening…</div>
            <p className={styles.xfadeSub}>Press Back anytime to return.</p>
            <div className={styles.xfadeBar} />
            <span style={{ display: "none" }}>{redirectTo}</span>
          </div>
        </div>
      ) : null}

      <Container>
        <div className={styles.row}>
          <Link to="/" className={styles.brand}>
            <img className={styles.logo} src={logo} alt="ASB logo" />
            <div className={styles.brandText}>
              <div className={styles.brandName}>ASB</div>
              <div className={styles.brandTag}>Spiritual Store &amp; Gifting</div>
            </div>
          </Link>

          <nav className={styles.nav} aria-label="Main navigation">
            {itemsForNavbar.map((item) => (
              <NavItem key={item.label} item={item} onExternalNavigate={handleExternalNavigate} />
            ))}
          </nav>

          <div className={styles.right}>
            <button
              className={`${styles.iconBtn} ${styles.hamburger}`}
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              type="button"
            >
              ☰
            </button>

            <button
              className={styles.iconBtn}
              aria-label="Account"
              type="button"
              onClick={handleProfileClick}
              title={user ? "Profile" : "Login"}
            >
              👤
            </button>

            <Link to="/cart" className={styles.iconLink} aria-label="Cart">
              <span className={styles.iconBtn}>🛒</span>
            </Link>
          </div>
        </div>
      </Container>

      <MobileMenu
        items={itemsForNavbar}
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onExternalNavigate={handleExternalNavigate}
      />
    </header>
  );
}
