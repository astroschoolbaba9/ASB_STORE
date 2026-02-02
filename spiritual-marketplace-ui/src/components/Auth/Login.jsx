import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import styles from "./AuthPage.module.css";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    // UI-only: mark logged in
    login({ email });
    navigate("/"); // you can change to /dashboard/profile
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>ASB</div>
          <div className={styles.brandSub}>Login to continue</div>
        </div>

        <form className={styles.form} onSubmit={onSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              type="email"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <input
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              type="password"
              required
            />
          </div>

          <button className="btn-primary" type="submit">
            Login
          </button>

          <div className={styles.links}>
            <Link to="/forgot-password" className={styles.link}>
              Forgot password?
            </Link>
            <Link to="/register" className={styles.link}>
              Create account
            </Link>
          </div>
        </form>

        <div className={styles.note}>
          UI-only auth. Backend will validate credentials later.
        </div>
      </div>
    </div>
  );
}
