import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import styles from "./DashboardLayout.module.css";

const NAV = [
  { label: "Profile", to: "/dashboard/profile", icon: "👤" },
  { label: "Orders", to: "/dashboard/orders", icon: "📦" },
  { label: "Gift Orders", to: "/dashboard/gift-orders", icon: "🎁" },
  { label: "My Courses", to: "/dashboard/courses", icon: "🎓" },
];

function titleFromPath(pathname) {
  if (pathname.includes("/dashboard/profile")) return "Profile";
  if (pathname.includes("/dashboard/orders")) return "Orders";
  if (pathname.includes("/dashboard/gift-orders")) return "Gift Orders";
  if (pathname.includes("/dashboard/courses")) return "My Courses";
  return "Dashboard";
}

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const pageTitle = useMemo(() => titleFromPath(location.pathname), [location.pathname]);

  // ✅ Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // ✅ ESC to close drawer
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    if (mobileOpen) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  // ✅ Lock background scroll when drawer open
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const Sidebar = ({ compact = false }) => (
    <aside className={`${styles.sidebar} ${compact ? styles.sidebarCompact : ""}`}>
      <div className={styles.brand}>
        <div className={styles.brandMark}>ASB</div>
        <div className={styles.brandSub}>Account</div>
      </div>

      <nav className={styles.nav}>
        {NAV.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.navItemActive : ""}`
            }
            onClick={() => setMobileOpen(false)}
          >
            <span className={styles.navIcon} aria-hidden="true">
              {it.icon}
            </span>
            <span className={styles.navLabel}>{it.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.sideFoot}>
        <div className={styles.smallHint}>Manage your account.</div>
      </div>
    </aside>
  );

  return (
    <div className={styles.wrap}>
      {/* Desktop sidebar */}
      <div className={styles.sidebarDesk}>
        <Sidebar />
      </div>

      {/* Main */}
      <main className={styles.main}>
        <div className={styles.topbar}>
          <button
            type="button"
            className={styles.hamburger}
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>

          <div className={styles.titleBlock}>
            <div className={styles.title}>{pageTitle}</div>
            <div className={styles.subtitle}>Manage your orders, gifts, and courses.</div>
          </div>

          <div className={styles.topActions}>
            <NavLink to="/shop" className={`btn-outline ${styles.topBtn}`}>
              Shop
            </NavLink>
          </div>
        </div>

        <div className={styles.content}>
          <Outlet />
        </div>
      </main>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className={styles.mobileBackdrop} role="dialog" aria-modal="true">
          <div className={styles.mobilePanel}>
            <div className={styles.mobileTop}>
              <div className={styles.mobileTitle}>Menu</div>
              <button
                type="button"
                className={styles.mobileClose}
                onClick={() => setMobileOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

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
