import { NavLink } from "react-router-dom";
import styles from "./Sidebar.module.css";

export default function Sidebar() {
  const linkClass = ({ isActive }) => (isActive ? styles.active : styles.link);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.logo}>ASB</div>
        <div>
          <div className={styles.title}>Admin Panel</div>
          <div className={styles.sub}>Manage content</div>
        </div>
      </div>

      <nav className={styles.nav}>
        <NavLink to="/admin/dashboard" className={linkClass}>
          Dashboard
        </NavLink>

        <NavLink to="/admin/categories" className={linkClass}>
          Categories
        </NavLink>

        <NavLink to="/admin/products" className={linkClass}>
          Products
        </NavLink>

        <NavLink to="/admin/courses" className={linkClass}>
          Courses
        </NavLink>

        <NavLink to="/admin/banners" className={linkClass}>
          Banners
        </NavLink>

        <NavLink to="/admin/orders" className={linkClass}>
          Orders
        </NavLink>

        <NavLink to="/admin/gift" className={linkClass}>
          Gift CMS
        </NavLink>
        <NavLink to="/admin/audit-logs" className={linkClass}>
  Admin Audit Logs
</NavLink>

        {/* ✅ NEW */}
        <NavLink to="/admin/contact-messages" className={linkClass}>
          Contact Messages
        </NavLink>
      </nav>

      <div className={styles.footer}>
        <div className={styles.hint}>Role-based access</div>
      </div>
    </aside>
  );
}
