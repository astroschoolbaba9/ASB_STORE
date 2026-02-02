import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./Services.module.css";

const TOOLS_URL = "https://asb-ui.onrender.com/";

function setMetaDescription(content) {
  if (typeof document === "undefined") return;
  const head = document.head || document.getElementsByTagName("head")[0];
  if (!head) return;

  let el = document.querySelector('meta[name="description"]');
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", "description");
    head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export default function Services() {
  const location = useLocation();

  // ✅ SEO-friendly fallback (no extra deps)
  useEffect(() => {
    document.title = "Services | ASB Spiritual Store & Gifting";
    setMetaDescription(
      "Explore ASB services for spiritual gifting: gift wrapping, personalized messages, bulk & corporate orders, order support, trainings, and helpful calculators/tools."
    );
  }, []);

  // ✅ Smooth anchor navigation (/services#gift-wrapping etc.)
  useEffect(() => {
    const hash = (location.hash || "").replace("#", "").trim();
    if (!hash) {
      // If no hash, scroll to top neatly
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Delay to ensure DOM is ready (especially on fresh loads)
    const t = window.setTimeout(() => {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);

    return () => window.clearTimeout(t);
  }, [location.hash]);

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.tag}>Services</div>
        <h1 className={styles.h1}>Supportful services for spiritual gifting & mindful buying</h1>
        <p className={styles.sub}>
          At ASB, we’re a spiritual store focused on puja items, healing, and spiritual products — and we make gifting
          feel calm, personal, and reliable. Explore gift-ready services, order support, trainings, and helpful tools.
        </p>

        <div className={styles.actions}>
          <Link to="/shop?group=gifts" className={`btn-primary ${styles.btnLink}`}>
            Shop Gifts
          </Link>
          <Link to="/contact" className={`btn-outline ${styles.btnLink}`}>
            Contact
          </Link>
        </div>

        <div className={styles.jump} aria-label="Jump to section">
          <a className={styles.jumpBtn} href="#gift-wrapping">
            Gift Wrapping
          </a>
          <a className={styles.jumpBtn} href="#gift-message">
            Gift Message
          </a>
          <a className={styles.jumpBtn} href="#bulk-orders">
            Bulk Orders
          </a>
          <a className={styles.jumpBtn} href="#corporate-gifting">
            Corporate Gifting
          </a>
          <a className={styles.jumpBtn} href="#support">
            Order Support
          </a>
          <a className={styles.jumpBtn} href="#courses">
            Courses
          </a>
          <a className={styles.jumpBtn} href="#tools">
            Tools
          </a>
        </div>
      </header>

      <main className={styles.sections}>
        <section id="gift-wrapping" className={styles.section}>
          <h2 className={styles.h2}>Gift Wrapping</h2>
          <p className={styles.copy}>
            Premium wrapping with protective packaging — ideal for spiritual gifting, puja items, and healing products.
            Neat presentation, safe handling, and a clean unboxing feel for your loved ones.
          </p>
          <div className={styles.ctaRow}>
            <Link to="/shop?group=gifts" className={`btn-primary ${styles.btnLink}`}>
              Shop Gift-Ready Items
            </Link>
          </div>
        </section>

        <section id="gift-message" className={styles.section}>
          <h2 className={styles.h2}>Personalized Gift Message</h2>
          <p className={styles.copy}>
            Add a heartfelt note that matches the occasion — birthday, wedding, housewarming, or a simple blessing.
            Perfect for personalized gifting with spiritual products and curated sets.
          </p>
          <div className={styles.ctaRow}>
            <Link to="/shop?group=gifts" className={`btn-outline ${styles.btnLink}`}>
              Pick a Gift & Add Message
            </Link>
          </div>
        </section>

        <section id="bulk-orders" className={styles.section}>
          <h2 className={styles.h2}>Bulk Orders</h2>
          <p className={styles.copy}>
            Planning an event, temple function, or community gifting? We can help streamline bulk packing and dispatch
            with clear coordination and timelines.
          </p>
          <div className={styles.ctaRow}>
            <Link to="/contact" className={`btn-primary ${styles.btnLink}`}>
              Contact for Bulk Order
            </Link>
          </div>
        </section>

        <section id="corporate-gifting" className={styles.section}>
          <h2 className={styles.h2}>Corporate Gifting</h2>
          <p className={styles.copy}>
            Thoughtful corporate gifting for teams and clients — spiritual store picks that feel premium and meaningful.
            We can align on budget, themes, and delivery batches.
          </p>
          <div className={styles.ctaRow}>
            <Link to="/contact" className={`btn-outline ${styles.btnLink}`}>
              Request Corporate Options
            </Link>
          </div>
        </section>

        <section id="support" className={styles.section}>
          <h2 className={styles.h2}>Order Support</h2>
          <p className={styles.copy}>
            Need help with an order, delivery, or product selection? Our support focuses on clarity and quick resolution,
            so you can shop spiritual products with confidence.
          </p>
          <div className={styles.ctaRow}>
            <Link to="/contact" className={`btn-primary ${styles.btnLink}`}>
              Get Support
            </Link>
          </div>
        </section>

        <section id="courses" className={styles.section}>
          <h2 className={styles.h2}>Courses & Trainings</h2>
          <p className={styles.copy}>
            Learn with structured trainings — from beginner-friendly foundations to deeper practice and certifications.
            Ideal if you’re exploring healing, rituals, or spiritual learning with guidance.
          </p>
          <div className={styles.ctaRow}>
            <Link to="/courses" className={`btn-outline ${styles.btnLink}`}>
              Explore Courses
            </Link>
          </div>
        </section>

        <section id="tools" className={styles.section}>
          <h2 className={styles.h2}>Calculator & Tools</h2>
          <p className={styles.copy}>
            Use our simple tools for quick calculations and planning — made to support your spiritual routines and
            gifting decisions without confusion.
          </p>
          <div className={styles.ctaRow}>
            <a className={`btn-primary ${styles.btnLink}`} href={TOOLS_URL} target="_blank" rel="noreferrer">
              Open Tools
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
