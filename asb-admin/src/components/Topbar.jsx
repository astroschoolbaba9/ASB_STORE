import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Topbar.module.css";

export default function Topbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/admin/login", { replace: true });
  }

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <div className={styles.heading}>ASB Admin</div>
        <div className={styles.badge}>{user?.role || "admin"}</div>
      </div>

      <div className={styles.right}>
        <button className={styles.btn} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
