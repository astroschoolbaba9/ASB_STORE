import { useMemo, useState } from "react";
import styles from "./Contact.module.css";
import { CONTACT_INFO } from "../../data/contact";
import { api } from "../../lib/api";

const SUPPORT_EMAIL = "astroschoolbaba9@gmail.com";
const SUPPORT_ADDRESS = "S7, 2nd floor, RPS Savana, Sector 88, Faridabad, Haryana-121002";

export default function Contact() {
  const mapsUrl = useMemo(() => {
    const q = encodeURIComponent(SUPPORT_ADDRESS);
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }, []);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState({ type: "", text: "" }); // type: "ok" | "err"

  const setField = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
  };

  const validate = () => {
    const name = String(form.name || "").trim();
    const phone = String(form.phone || "").trim();
    const email = String(form.email || "").trim();
    const message = String(form.message || "").trim();

    if (!name) return "Please enter your full name.";
    if (!phone) return "Please enter your mobile number.";
    if (!email) return "Please enter your email.";
    if (!message) return "Please write a short message.";

    // basic email check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email address.";

    // basic phone length check (India + general)
    const digits = phone.replace(/[^\d]/g, "");
    if (digits.length < 10) return "Please enter a valid mobile number (at least 10 digits).";

    if (message.length < 10) return "Message is too short. Please add a little more detail.";
    if (message.length > 2000) return "Message is too long (max 2000 characters).";

    return "";
  };

  const onSubmit = async () => {
    setNotice({ type: "", text: "" });

    const err = validate();
    if (err) {
      setNotice({ type: "err", text: err });
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/api/contact", {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
        source: "contact_page",
      });

      setNotice({ type: "ok", text: "Thanks! Your message has been received. We’ll get back to you soon." });
      setForm({ name: "", phone: "", email: "", message: "" });
    } catch (e) {
      setNotice({
        type: "err",
        text: e?.response?.message || e?.message || "Something went wrong. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.tag}>Contact</div>
        <h1 className={styles.h1}>We’re here to help</h1>
        <p className={styles.sub}>Reach out for product support, shipping help, or gifting guidance (no consultations).</p>
      </div>

      <div className={styles.split}>
        <section className={styles.formCard}>
          <div className={styles.cardTitle}>Send a message</div>

          <div className={styles.grid}>
            <div className={styles.field}>
              <label className={styles.label}>Full Name</label>
              <input
                className={styles.input}
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                autoComplete="name"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Mobile Number</label>
              <input
                className={styles.input}
                placeholder="+91 99XXXXXXXX"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                autoComplete="tel"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input
                className={styles.input}
                placeholder="you@email.com"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className={styles.fieldFull}>
              <label className={styles.label}>Message</label>
              <textarea
                className={styles.textarea}
                rows={5}
                placeholder="Write your message..."
                value={form.message}
                onChange={(e) => setField("message", e.target.value)}
              />
            </div>
          </div>

          {notice?.text ? (
            <div className={`${styles.notice} ${notice.type === "ok" ? styles.ok : styles.err}`} role="status">
              {notice.text}
            </div>
          ) : null}

          <button className="btn-primary" type="button" onClick={onSubmit} disabled={submitting}>
            {submitting ? "Sending..." : "Send"}
          </button>
        </section>

        <aside className={styles.infoCard}>
          <div className={styles.cardTitle}>ASB Support</div>

          <div className={styles.infoRow}>
            <span className={styles.muted}>Email</span>
            <a className={styles.link} href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.muted}>Phone</span>
            <span className={styles.bold}>{CONTACT_INFO.phone}</span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.muted}>Address</span>
            <a className={styles.link} href={mapsUrl} target="_blank" rel="noreferrer" title="Open in Google Maps">
              {SUPPORT_ADDRESS}
            </a>
          </div>

          <div className={styles.divider} />

          <div className={styles.cardTitle}>Hours</div>
          <ul className={styles.ul}>
            {CONTACT_INFO.hours.map((h) => (
              <li key={h} className={styles.li}>
                {h}
              </li>
            ))}
          </ul>

          <a className={styles.map} href={mapsUrl} target="_blank" rel="noreferrer">
            Open in Google Maps
          </a>
        </aside>
      </div>
    </div>
  );
}
