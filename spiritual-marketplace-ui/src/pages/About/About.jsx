import { useNavigate } from "react-router-dom";
import styles from "./About.module.css";
import JsonLd from "../../components/common/JsonLd";

export default function About() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <JsonLd
        id="about-schema"
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "AboutPage",
              "@id": "https://asbcrystal.in/about#webpage",
              "url": "https://asbcrystal.in/about",
              "name": "About ASB Crystal Store",
              "description": "Learn about ASB Crystal Store, a trusted destination for crystal products including crystal bracelets, anklets, pyrite, pyramids, healing stones, and crystal tumblers for positive energy and spiritual growth.",
              "inLanguage": "en",
              "isPartOf": {
                "@id": "https://asbcrystal.in/#website"
              },
              "about": {
                "@id": "https://asbcrystal.in/#organization"
              }
            },
            {
              "@type": "Organization",
              "@id": "https://asbcrystal.in/#organization",
              "name": "ASB Crystal Store",
              "url": "https://asbcrystal.in/",
              "logo": {
                "@type": "ImageObject",
                "url": "https://asbcrystal.in/logo.png"
              },
              "description": "ASB Crystal Store specializes in crystal products such as crystal bracelets, anklets, pyrite, pyramids, healing stones, and crystal tumblers designed for positivity, clarity, and spiritual well-being.",
              "sameAs": [
                "https://www.instagram.com/",
                "https://www.facebook.com/"
              ]
            },
            {
              "@type": "WebSite",
              "@id": "https://asbcrystal.in/#website",
              "url": "https://asbcrystal.in/",
              "name": "ASB Crystal Store"
            },
            {
              "@type": "BreadcrumbList",
              "@id": "https://asbcrystal.in/about#breadcrumb",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": "https://asbcrystal.in/"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "About Us",
                  "item": "https://asbcrystal.in/about"
                }
              ]
            }
          ]
        }}
      />
      <div className={styles.hero}>
        <div className={styles.tag}>About ASB - AGPK Academy</div>

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
