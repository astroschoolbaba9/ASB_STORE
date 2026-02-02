import { useEffect, useRef, useState } from "react";
import styles from "./WhatsAppFloat.module.css";

export default function WhatsAppFloat() {
  // ✅ Replace with your WhatsApp number (countrycode + number, no +, no spaces)
  const phone = "919919912996";
  const message = "Hi ASB, I want to know more about your products / services.";
  const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  // Auto-hide on scroll down, show on scroll up / stop
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastY.current = window.scrollY || 0;

    const onScroll = () => {
      const y = window.scrollY || 0;

      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const delta = y - lastY.current;

          // small threshold avoids flicker
          if (delta > 8) setHidden(true);       // scrolling down -> hide
          else if (delta < -8) setHidden(false); // scrolling up -> show

          // if near top, always show
          if (y < 120) setHidden(false);

          lastY.current = y;
          ticking.current = false;
        });

        ticking.current = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <a
      href={waLink}
      className={`${styles.fab} ${hidden ? styles.hidden : ""}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      title="Chat on WhatsApp"
    >
      <span className={styles.tooltip} role="tooltip">
        Need help?
      </span>

      <span className={styles.icon} aria-hidden="true">
        {/* Minimal WhatsApp-like bubble icon (emoji) */}
        💬
      </span>
    </a>
  );
}
