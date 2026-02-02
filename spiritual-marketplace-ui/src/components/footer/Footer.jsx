import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./Footer.module.css";
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

/* Simple inline icons (no deps) */
function IconMail(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5L4 8V6l8 5 8-5v2Z"
      />
    </svg>
  );
}

function IconInstagram(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3Zm-5 4a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.5-.9a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z"
      />
    </svg>
  );
}

function IconWhatsApp(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M12.04 2C6.56 2 2.13 6.43 2.13 11.9c0 1.93.56 3.82 1.62 5.45L2 22l4.78-1.67a9.84 9.84 0 0 0 5.26 1.51h.01c5.48 0 9.91-4.43 9.91-9.9C21.96 6.43 17.53 2 12.04 2Zm5.74 14.2c-.24.7-1.4 1.35-1.93 1.42-.49.06-1.1.09-1.78-.11-.41-.13-.95-.31-1.64-.6-2.88-1.24-4.76-4.1-4.9-4.28-.13-.18-1.17-1.56-1.17-2.98 0-1.42.74-2.12 1-2.41.26-.29.58-.36.78-.36h.56c.18 0 .42-.07.66.5.24.58.82 2 0 2.2-.2.05-.34.13-.5.32-.16.2-.25.36-.11.61.13.24.58.95 1.25 1.54.86.77 1.58 1 1.82 1.1.24.1.39.08.53-.08.15-.16.61-.7.77-.95.16-.24.32-.2.53-.13.21.08 1.36.64 1.59.76.24.12.39.18.45.28.06.1.06.58-.18 1.28Z"
      />
    </svg>
  );
}

export default function Footer() {
  const [shopCats, setShopCats] = useState([]);
  const [giftCats, setGiftCats] = useState([]);

  const SUPPORT_EMAIL = "astroschoolbaba9@gmail.com";
  const SUPPORT_ADDRESS = "S7, 2nd floor, RPS Savana, Sector 88, Faridabad, Haryana-121002";
  const INSTAGRAM_URL = "https://www.instagram.com/astroschoolbaba/";

  // ✅ Your required WhatsApp number
  const WHATSAPP_NUMBER = "9919912996";

  const mapsUrl = useMemo(() => {
    const q = encodeURIComponent(SUPPORT_ADDRESS);
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }, [SUPPORT_ADDRESS]);

  const whatsappUrl = useMemo(() => {
    // WhatsApp recommended: https://wa.me/<number> (country code optional; works for many numbers)
    const digits = String(WHATSAPP_NUMBER).replace(/[^\d]/g, "");
    return digits ? `https://wa.me/${digits}` : "";
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const resShop = await api.get("/api/categories", { query: { group: "shop" } });
        const arrShop = normalizeList(resShop, ["categories", "items", "data"]);
        const shop = (arrShop || [])
          .map(normCat)
          .filter((c) => c._id && c.name && c.slug)
          .filter((c) => c.isActive !== false)
          .sort((a, b) => (a.sortOrder - b.sortOrder) || a.name.localeCompare(b.name))
          .slice(0, 4);

        const resGifts = await api.get("/api/categories", { query: { group: "gifts" } });
        const arrGifts = normalizeList(resGifts, ["categories", "items", "data"]);
        const gifts = (arrGifts || [])
          .map(normCat)
          .filter((c) => c._id && c.name && c.slug)
          .filter((c) => c.isActive !== false)
          .sort((a, b) => (a.sortOrder - b.sortOrder) || a.name.localeCompare(b.name))
          .slice(0, 4);

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

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        {/* Brand + Connect */}
        <div className={styles.brand}>
          <div className={styles.logo}>ASB-Ages Of AGPK Academy</div>
          <p className={styles.tagline}>Spiritual Store &amp; Gifting</p>
          <p className={styles.note}>
            Sacred gifts, healing tools, and mindful trainings curated for calm living and positive energy.
          </p>

          <div className={styles.connect}>
            <div className={styles.connectTitle}>Connect</div>

            <a className={styles.contactRow} href={mapsUrl} target="_blank" rel="noreferrer" title="Open in Google Maps">
              <span className={styles.contactLabel}>Address</span>
              <span className={styles.contactValue}>{SUPPORT_ADDRESS}</span>
            </a>

            <a className={styles.contactRow} href={`mailto:${SUPPORT_EMAIL}`} title="Email us">
              <span className={styles.contactLabel}>Email</span>
              <span className={styles.contactValue}>{SUPPORT_EMAIL}</span>
            </a>

            <div className={styles.iconRow} aria-label="Quick links">
              <a className={styles.iconBtn} href={`mailto:${SUPPORT_EMAIL}`} title="Email">
                <IconMail />
              </a>

              <a className={styles.iconBtn} href={INSTAGRAM_URL} target="_blank" rel="noreferrer" title="Instagram">
                <IconInstagram />
              </a>

              <a className={styles.iconBtn} href={whatsappUrl} target="_blank" rel="noreferrer" title="WhatsApp">
                <IconWhatsApp />
              </a>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className={styles.cols}>
          <div className={styles.col}>
            <h4>Shop</h4>
            <Link to="/shop">All Products</Link>

            {/* ✅ Dynamic shop categories */}
            {shopCats.map((c) => (
              <Link key={c._id} to={`/shop?cat=${encodeURIComponent(c.slug)}`}>
                {c.name}
              </Link>
            ))}

            {/* ✅ Add Trainings under Shop */}
            <Link to="/courses">Trainings</Link>

            {/* Fallback if no categories loaded */}
            {shopCats.length === 0 ? <Link to="/shop?group=gifts">Gifts</Link> : null}
          </div>

          <div className={styles.col}>
            <h4>Gifts</h4>
            <Link to="/shop?group=gifts">All Gifts</Link>

            {/* ✅ Dynamic gift categories */}
            {giftCats.map((c) => (
              <Link key={c._id} to={`/shop?group=gifts&cat=${encodeURIComponent(c.slug)}`}>
                {c.name}
              </Link>
            ))}

            {/* ✅ Add Services below Gifts */}
            <Link to="/services">Services</Link>
          </div>

          <div className={styles.col}>
            <h4>Company</h4>
            <Link to="/about">About Us</Link>
            <Link to="/services">Our Services</Link>
            <Link to="/contact">Contact</Link>

            <a className={styles.extLink} href="https://asb-ui.onrender.com/" target="_blank" rel="noreferrer">
              Calculator / Tools
            </a>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <span>© {new Date().getFullYear()} ASB. All rights reserved.</span>
        <div className={styles.legal}>
          <span>Privacy</span>
          <span>Terms</span>
          <span>Refunds</span>
        </div>
      </div>
    </footer>
  );
}
