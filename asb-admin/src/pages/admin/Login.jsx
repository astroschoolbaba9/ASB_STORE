import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { getFriendlyMessage } from "../../utils/errorMapping";
import styles from "./Login.module.css";

const TOKEN_KEY = "asb_access_token";

function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
function isPhone(v) {
  return /^[0-9]{10,15}$/.test(String(v || "").replace(/\s+/g, ""));
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = useMemo(
    () => location.state?.from || "/admin/dashboard",
    [location.state]
  );

  const [step, setStep] = useState("form"); // form | otp
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSendOtp(e) {
    e.preventDefault();
    setError("");

    const id = identifier.trim();
    if (!id) return setError("Email or mobile is required.");
    if (!(isEmail(id) || isPhone(id))) return setError("Enter a valid email or mobile number.");

    setLoading(true);
    try {
      await api.post("/api/auth/send-otp", { identifier: id });
      setStep("otp");
    } catch (err) {
      setError(getFriendlyMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyOtp(e) {
    e.preventDefault();
    setError("");

    const id = identifier.trim();
    const code = otp.trim();
    if (!code) return setError("OTP is required.");

    setLoading(true);
    try {
      const data = await api.post("/api/auth/verify-otp", { identifier: id, code });

      const accessToken = data?.accessToken || data?.token || "";
      if (!accessToken) {
        throw new Error("No access token returned from backend");
      }

      // ✅ Save token in the SAME key your api.js reads
      localStorage.setItem(TOKEN_KEY, accessToken);

      // ✅ Verify admin using the stored token
      const meData = await api.get("/api/auth/me");

      const role = String(meData?.user?.role || "").toLowerCase();
      if (role !== "admin") {
        localStorage.removeItem(TOKEN_KEY);
        throw { code: "FORBIDDEN", message: "Access denied. Not an admin." };
      }

      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(getFriendlyMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brandRow}>
          <div className={styles.brandDot} />
          <div>
            <div className={styles.title}>Admin Login</div>
            <div className={styles.sub}>Login with OTP to continue.</div>
          </div>
        </div>

        {step === "form" ? (
          <form className={styles.form} onSubmit={onSendOtp}>
            <div className={styles.field}>
              <label className={styles.label}>Email / Mobile</label>
              <input
                className={styles.input}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin@email.com or 9876543210"
              />
            </div>

            {error ? <div className={styles.error}>{error}</div> : null}

            <button className={styles.btn} disabled={loading}>
              {loading ? "Sending..." : "Send OTP"}
            </button>


          </form>
        ) : (
          <form className={styles.form} onSubmit={onVerifyOtp}>
            <div className={styles.field}>
              <label className={styles.label}>Email / Mobile</label>
              <input className={styles.input} value={identifier} disabled />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>OTP</label>
              <input
                className={styles.input}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
              />
            </div>

            {error ? <div className={styles.error}>{error}</div> : null}

            <button className={styles.btn} disabled={loading}>
              {loading ? "Verifying..." : "Verify & Login"}
            </button>

            <button
              type="button"
              className={styles.passBtn}
              onClick={() => {
                setStep("form");
                setOtp("");
                setError("");
              }}
              style={{ marginTop: 10 }}
            >
              Change Email/Mobile
            </button>


          </form>
        )}
      </div>
    </div>
  );
}
