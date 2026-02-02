import { Link } from "react-router-dom";
import { useState } from "react";
import styles from "./AuthPage.module.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>ASB</div>
          <div className={styles.brandSub}>Reset your password</div>
        </div>

        {!sent ? (
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

            <button className="btn-primary" type="submit">
              Send Reset Link
            </button>

            <div className={styles.links}>
              <Link to="/login" className={styles.link}>
                Back to login
              </Link>
            </div>
          </form>
        ) : (
          <div className={styles.success}>
            <div className={styles.successTitle}>Reset link sent (UI only)</div>
            <p className={styles.successText}>
              If this were live, we would email a reset link to <b>{email}</b>.
            </p>
            <Link to="/login" className="btn-primary">
              Go to Login
            </Link>
          </div>
        )}

        <div className={styles.note}>
          UI-only forgot password. Backend will email reset link later.
        </div>
      </div>
    </div>
  );
}
