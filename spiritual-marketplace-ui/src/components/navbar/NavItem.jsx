import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import styles from "./Navbar.module.css";

function isExternalPath(p) {
  return typeof p === "string" && (p.startsWith("http://") || p.startsWith("https://"));
}

export default function NavItem({ item, onExternalNavigate }) {
  const hasDropdown = Array.isArray(item.dropdown) && item.dropdown.length > 0;
  const [open, setOpen] = useState(false);

  const rootRef = useRef(null);
  const closeTimerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Close dropdown on any navigation change (including hash anchors)
  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setOpen(false), 140);
  };

  const go = (path) => {
    if (!path) return;
    if (isExternalPath(path)) {
      if (typeof onExternalNavigate === "function") onExternalNavigate(path);
      else window.location.assign(path);
      return;
    }
    navigate(path);
  };

  const renderDropItem = (d) => {
    const label = typeof d === "string" ? d : d.label;
    const to = typeof d === "string" ? "#" : d.path;

    if (to === "#") {
      return (
        <button key={label} type="button" className={styles.dropItem} onClick={() => setOpen(false)}>
          {label}
        </button>
      );
    }

    if (isExternalPath(to)) {
      return (
        <button
          key={label}
          type="button"
          className={styles.dropItem}
          onClick={() => {
            setOpen(false);
            go(to);
          }}
        >
          {label}
        </button>
      );
    }

    return (
      <Link key={label} to={to} className={styles.dropItem} onClick={() => setOpen(false)}>
        {label}
      </Link>
    );
  };

  return (
    <div
      className={styles.navItem}
      ref={rootRef}
      onMouseEnter={() => {
        if (!hasDropdown) return;
        clearCloseTimer();
        setOpen(true);
      }}
      onMouseLeave={() => {
        if (!hasDropdown) return;
        scheduleClose();
      }}
    >
      {!hasDropdown ? (
        isExternalPath(item.path) ? (
          <button type="button" className={styles.navLink} onClick={() => go(item.path)}>
            {item.label}
          </button>
        ) : (
          <Link to={item.path} className={styles.navLink}>
            {item.label}
          </Link>
        )
      ) : (
        <>
          <button
            type="button"
            className={styles.navLink}
            onClick={() => {
              if (item.path) go(item.path);
              setOpen((v) => !v);
            }}
            aria-haspopup="menu"
            aria-expanded={open ? "true" : "false"}
          >
            <span className={styles.navLabel}>{item.label}</span>
            <span className={`${styles.caret} ${open ? styles.caretOpen : ""}`} aria-hidden="true">
              ▼
            </span>
          </button>

          {open && (
            <div className={styles.dropdown} role="menu" onMouseEnter={clearCloseTimer} onMouseLeave={scheduleClose}>
              <div className={styles.dropList}>{item.dropdown.map(renderDropItem)}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
