// src/components/auth/AuthModal.jsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import styles from "./AuthModal.module.css";

export default function AuthModal() {
  const {
    authModalOpen,
    authModalInitial,
    closeAuthModal,
    loginPassword,
    registerPassword,
    sendOtp,
    verifyOtp
  } = useAuth();

  // modes: loginOtp | loginPassword | register
  const initialMode = useMemo(() => {
    if (authModalInitial === "register") return "register";
    return "loginOtp"; // default OTP login
  }, [authModalInitial]);

  // ✅ FIX: use initialMode
  const [mode, setMode] = useState(initialMode);

  // OTP step control for OTP login + register
  const [step, setStep] = useState("form"); // "form" | "otp"
  const [target, setTarget] = useState(""); // mobile/email
  const [otp, setOtp] = useState("");

  // password mode
  const [password, setPassword] = useState("");

  // register extra
  const [name, setName] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // UI helpers
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // backend helpers
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authModalOpen) return;

    // reset when opened
    setMode(initialMode);
    setStep("form");
    setTarget("");
    setOtp("");
    setPassword("");
    setName("");
    setRegPassword("");
    setSent(false);
    setCooldown(0);
    setBusy(false);
    setError("");
  }, [authModalOpen, initialMode]);

  // cooldown timer
  useEffect(() => {
    if (!authModalOpen) return;
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown, authModalOpen]);

  if (!authModalOpen) return null;

  const title =
    mode === "loginPassword"
      ? "Sign In"
      : mode === "register"
        ? "Create ASB Account"
        : "Sign In with OTP";

  const isTargetValid = target.trim().length >= 4; // UI-only
  const isOtpValid = otp.trim().length >= 4;

  const identifier = target.trim();

  const onSendOtp = async () => {
    if (!isTargetValid) return;
    setError("");
    setBusy(true);
    try {
      await sendOtp({ identifier });
      setSent(true);
      setStep("otp");
      setOtp("");
      setCooldown(30);
    } catch (e) {
      setError(e?.message || "Failed to send OTP");
      setSent(false);
    } finally {
      setBusy(false);
    }
  };

  const onVerifyOtpAndLogin = async () => {
    if (!isOtpValid) return;
    setError("");
    setBusy(true);
    try {
      await verifyOtp({ identifier, otp: otp.trim() });
      closeAuthModal();
    } catch (e) {
      setError(e?.message || "Invalid OTP");
    } finally {
      setBusy(false);
    }
  };

  const onPasswordLogin = async () => {
    if (!isTargetValid) return;
    if (!password.trim()) return;
    setError("");
    setBusy(true);
    try {
      await loginPassword({ identifier, password: password.trim() });
      closeAuthModal();
    } catch (e) {
      setError(e?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const onRegister = async () => {
    // password-based register
    if (!name.trim()) return;
    if (!isTargetValid) return;
    if (!regPassword.trim()) return;

    setError("");
    setBusy(true);
    try {
      const isEmail = identifier.includes("@");
      await registerPassword({
        name: name.trim(),
        email: isEmail ? identifier : undefined,
        phone: !isEmail ? identifier : undefined,
        password: regPassword.trim()
      });
      closeAuthModal();
    } catch (e) {
      setError(e?.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (next) => {
    setMode(next);
    setStep("form");
    setSent(false);
    setOtp("");
    setPassword("");
    setCooldown(0);
    setError("");
  };

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.top}>
          <div className={styles.title}>{title}</div>
          <button
            className={styles.close}
            type="button"
            onClick={closeAuthModal}
            aria-label="Close"
            disabled={busy}
          >
            ✕
          </button>
        </div>

        <p className={styles.sub}>
          {mode === "register"
            ? "Join AGPK Academy to access your trainings and tools."
            : "Sign in to access your ASB account."}
        </p>

        {/* MODE SWITCH */}
        <div className={styles.modeRow}>
          <button
            className={`${styles.modeBtn} ${mode === "loginOtp" ? styles.modeBtnActive : ""}`}
            type="button"
            onClick={() => switchMode("loginOtp")}
            disabled={busy}
          >
            OTP Login
          </button>
          <button
            className={`${styles.modeBtn} ${mode === "loginPassword" ? styles.modeBtnActive : ""}`}
            type="button"
            onClick={() => switchMode("loginPassword")}
            disabled={busy}
          >
            Password Login
          </button>
          <button
            className={`${styles.modeBtn} ${mode === "register" ? styles.modeBtnActive : ""}`}
            type="button"
            onClick={() => switchMode("register")}
            disabled={busy}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <div className={styles.form}>
          {/* REGISTER: name */}
          {mode === "register" && (
            <>
              <label className={styles.label}>Full Name</label>
              <input
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                disabled={busy}
              />
            </>
          )}

          {/* TARGET */}
          <label className={styles.label}>Mobile or Email</label>
          <input
            className={styles.input}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Enter mobile number or email"
            disabled={busy}
          />

          {/* PASSWORD LOGIN */}
          {mode === "loginPassword" && (
            <>
              <label className={styles.label}>Password</label>
              <input
                className={styles.input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={busy}
              />

              <button
                className="btn-primary"
                type="button"
                onClick={onPasswordLogin}
                disabled={!isTargetValid || !password.trim() || busy}
              >
                {busy ? "Please wait..." : "Login"}
              </button>

              <div className={styles.links}>
                <button
                  className={styles.linkBtn}
                  type="button"
                  onClick={() => switchMode("loginOtp")}
                  disabled={busy}
                >
                  Login with OTP instead
                </button>
              </div>
            </>
          )}

          {/* OTP LOGIN */}
          {mode === "loginOtp" && (
            <>
              {step === "form" ? (
                <>
                  <div className={styles.hint}>
                    We will send a one-time password (OTP) to your mobile/email.
                  </div>

                  <button
                    className="btn-primary"
                    type="button"
                    onClick={onSendOtp}
                    disabled={!isTargetValid || busy}
                  >
                    {busy ? "Sending..." : "Send OTP"}
                  </button>
                </>
              ) : (
                <>
                  <label className={styles.label}>Enter OTP</label>
                  <input
                    className={styles.input}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter OTP"
                    inputMode="numeric"
                    maxLength={6}
                    disabled={busy}
                  />

                  <button
                    className="btn-primary"
                    type="button"
                    onClick={onVerifyOtpAndLogin}
                    disabled={!isTargetValid || !isOtpValid || busy}
                  >
                    {busy ? "Please wait..." : "Verify & Login"}
                  </button>

                  <div className={styles.otpRow}>
                    <button
                      className={styles.linkBtn}
                      type="button"
                      onClick={() => {
                        setStep("form");
                        setOtp("");
                        setSent(false);
                        setCooldown(0);
                        setError("");
                      }}
                      disabled={busy}
                    >
                      Change mobile/email
                    </button>

                    <button
                      className={styles.linkBtn}
                      type="button"
                      onClick={onSendOtp}
                      disabled={!isTargetValid || cooldown > 0 || busy}
                      title={cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
                    >
                      {cooldown > 0 ? `Resend in ${cooldown}s` : busy ? "Sending..." : "Resend OTP"}
                    </button>
                  </div>

                  {sent && !error && (
                    <div className={styles.hint}>
                      OTP sent successfully.
                    </div>
                  )}
                </>
              )}

              {step === "form" && (
                <div className={styles.links}>
                  <button
                    className={styles.linkBtn}
                    type="button"
                    onClick={() => switchMode("register")}
                    disabled={busy}
                  >
                    New here? Create an account
                  </button>
                </div>
              )}
            </>
          )}

          {/* REGISTER (PASSWORD-BASED) */}
          {mode === "register" && (
            <>
              <label className={styles.label}>Set Password</label>
              <input
                className={styles.input}
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Create a password"
                disabled={busy}
              />

              <button
                className="btn-primary"
                type="button"
                onClick={onRegister}
                disabled={!name.trim() || !isTargetValid || !regPassword.trim() || busy}
              >
                {busy ? "Please wait..." : "Create Account"}
              </button>

              <div className={styles.links}>
                <button
                  className={styles.linkBtn}
                  type="button"
                  onClick={() => switchMode("loginOtp")}
                  disabled={busy}
                >
                  Already have account? Login with OTP
                </button>
              </div>
            </>
          )}

          {/* ERROR */}
          {error ? <div className={styles.hint}>{error}</div> : null}

          {/* Close */}
          <button className="btn-outline" type="button" onClick={closeAuthModal} disabled={busy}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
