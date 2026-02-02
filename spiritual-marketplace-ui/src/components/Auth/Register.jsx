import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import styles from "./AuthPage.module.css";
import { useAuth } from "../../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    // UI-only: auto-login after register
    login({ name, email });
    navigate("/");
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>ASB</div>
          <div className={styles.brandSub}>Create your account</div>
        </div>

        <form className={styles.form} onSubmit={onSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Full Name</label>
            <input
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
            />
          </div>

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
              placeholder="Create a password"
              type="password"
              required
            />
          </div>

          <button className="btn-primary" type="submit">
            Create Account
          </button>

          <div className={styles.links}>
            <Link to="/login" className={styles.link}>
              Already have an account? Login
            </Link>
          </div>
        </form>

        <div className={styles.note}>
          UI-only register. Backend will create user later.
        </div>
      </div>
    </div>
  );
}
