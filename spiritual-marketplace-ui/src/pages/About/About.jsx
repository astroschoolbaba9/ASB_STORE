import { useNavigate } from "react-router-dom";
import styles from "./About.module.css";

export default function About() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.tag}>About ASB-Ages of AGPK Academy</div>

        <h1 className={styles.h1}>A calm, premium spiritual marketplace</h1>

        <p className={styles.sub}>
          ASB is a trusted spiritual store for premium, handpicked products — from healing crystals and incense to puja essentials
          and gifting-ready items. Shop peacefully with clean categories, clear pricing, and a smooth checkout experience.
        </p>

        <div className={styles.actions}>
          <button className="btn-primary" type="button" onClick={() => navigate("/shop")}>
            Explore Shop
          </button>

          <button className="btn-outline" type="button" onClick={() => navigate("/contact")}>
            Contact
          </button>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Our Promise</div>
          <p className={styles.muted}>
            Premium quality, calm browsing, clear categories, and a simple checkout — designed to feel peaceful from start to finish.
          </p>
        </div>

        {/* ✅ SEO-friendly shop section (replaces “Gifting Focus”) */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>Shop Authentic Spiritual Products</div>
          <p className={styles.muted}>
            Explore authentic spiritual products curated for daily rituals and mindful living — including healing stones, incense,
            pooja items, vastu essentials, and gift-ready collections. Every item is selected to feel premium, clean, and reliable.
          </p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>Trainings</div>
          <p className={styles.muted}>
            Learn with calm, beginner-friendly trainings designed for clarity and consistency. Courses are presented like products so
            it feels familiar to browse and access.
          </p>
        </div>
      </div>

     
    </div>
  );
}
