import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./Navbar.module.css";

function isExternalPath(p) {
  return typeof p === "string" && (p.startsWith("http://") || p.startsWith("https://"));
}

export default function MobileMenu({ items, open, onClose, onExternalNavigate }) {
  const location = useLocation();
  const panelRef = useRef(null);

  useEffect(() => {
    if (open) onClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus?.();
  }, [open]);

  if (!open) return null;

  const go = (path) => {
    if (!path) return;
    if (isExternalPath(path)) {
      onClose?.();
      if (typeof onExternalNavigate === "function") onExternalNavigate(path);
      else window.location.assign(path);
      return;
    }
  };

  const renderDropItem = (d) => {
    const label = typeof d === "string" ? d : d.label;
    const to = typeof d === "string" ? "#" : d.path;

    if (to === "#") {
      return (
        <button key={label} type="button" className={styles.mDropItem} onClick={onClose}>
          {label}
        </button>
      );
    }

    if (isExternalPath(to)) {
      return (
        <button
          key={label}
          type="button"
          className={styles.mDropItem}
          onClick={() => go(to)}
        >
          {label}
        </button>
      );
    }

    return (
      <Link key={label} to={to} className={styles.mDropItem} onClick={onClose}>
        {label}
      </Link>
    );
  };

  return (
    <div
      className={styles.mobileBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Mobile menu"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      onTouchStart={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={styles.mobilePanel}
        ref={panelRef}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <div className={styles.mobileTop}>
          <div className={styles.mobileTitle}>Menu</div>
          <button
            className={styles.mobileClose}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className={styles.mobileNav} aria-label="Mobile navigation">
          {items.map((it) => {
            const hasDropdown = Array.isArray(it.dropdown) && it.dropdown.length > 0;

            return (
              <div key={it.label} className={styles.mItem}>
                {isExternalPath(it.path) ? (
                  <button type="button" className={styles.mLink} onClick={() => go(it.path)}>
                    {it.label}
                  </button>
                ) : (
                  <Link to={it.path} className={styles.mLink} onClick={onClose}>
                    {it.label}
                  </Link>
                )}

                {hasDropdown && (
                  <div className={styles.mDropList}>
                    {it.dropdown.map(renderDropItem)}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
