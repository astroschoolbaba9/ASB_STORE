import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";

import { api } from "../lib/api";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

const API_BASE = process.env.REACT_APP_API_BASE || "http://api.asbcrystal.in";

function absUrl(u) {
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("/banners/") || u.startsWith("/assets/")) return u;
  return `${API_BASE}${u.startsWith("/") ? "" : "/"}${u}`;
}

const DUMMY_SLIDES = [
  {
    title: "Crystal Healing & Reiki",
    subtitle: "High-vibe crystals for peace, focus, and protection.",
    img: "/banners/banner1.jpg",
    clickUrl: "https://asbcrystal.in/product/69b1149a5b647aa77137a9e5",
    ctaPrimaryText: "Book Consultation",
    ctaPrimaryLink: "/contact",
    ctaSecondaryText: "Explore Products",
    ctaSecondaryLink: "/shop",
  },
  {
    title: "Numerology Guidance",
    subtitle: "Your Numbers Speak — Your Life Has Patterns.",
    img: "/banners/banner2.jpg",
    clickUrl: "https://asbcrystal.in/product/69b1149a5b647aa77137a9e5",
    ctaPrimaryText: "Book Consultation",
    ctaPrimaryLink: "/contact",
    ctaSecondaryText: "Explore Products",
    ctaSecondaryLink: "/shop",
  },
  {
    title: "Vastu & Energy Balancing",
    subtitle: "Align your space. Elevate your energy.",
    img: "/banners/banner3.jpg",
    clickUrl: "https://asbcrystal.in/product/69b1149a5b647aa77137a9e5",
    ctaPrimaryText: "Book Consultation",
    ctaPrimaryLink: "/contact",
    ctaSecondaryText: "Explore Products",
    ctaSecondaryLink: "/shop",
  },
];

function normalizeAdminBanner(b) {
  return {
    title: b?.title || "",
    subtitle: b?.subtitle || "",
    img: absUrl(b?.imageUrl || ""), // admin banner image
    clickUrl: b?.clickUrl || "https://asbcrystal.in/product/69b1149a5b647aa77137a9e5",
    ctaPrimaryText: b?.ctaPrimaryText || "Book Consultation",
    ctaPrimaryLink: b?.ctaPrimaryLink || "/contact",
    ctaSecondaryText: b?.ctaSecondaryText || "Explore Products",
    ctaSecondaryLink: b?.ctaSecondaryLink || "/shop",
  };
}

export default function HeroSlider() {
  const navigate = useNavigate();
  const [adminSlides, setAdminSlides] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    api
      .get("/api/banners")
      .then((res) => {
        const arr = Array.isArray(res?.items) ? res.items : [];
        // keep only active banners (in case backend doesn't filter)
        const activeOnly = arr.filter((x) => x?.isActive !== false);

        const normalized = activeOnly
          .map(normalizeAdminBanner)
          .filter((x) => x.img); // must have an image

        if (mounted) setAdminSlides(normalized);
      })
      .catch(() => {
        if (mounted) setAdminSlides([]);
      })
      .finally(() => {
        if (mounted) setLoaded(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // ✅ use admin slides if present, else dummy
  const slides = useMemo(() => {
    if (adminSlides.length > 0) return adminSlides;
    return DUMMY_SLIDES;
  }, [adminSlides]);

  // If admin is still loading, we can still show dummy immediately (better UX)
  // but if you want "wait for admin then decide", change to:
  // if (!loaded) return null;
  // We keep showing dummy while loading.
  const finalSlides = loaded ? slides : DUMMY_SLIDES;

  const onSlideClick = (s) => {
    const url = s?.clickUrl || "";
    if (!url) return;
    if (url.startsWith("http://") || url.startsWith("https://")) {
      window.open(url, "_blank", "noreferrer");
      return;
    }
    navigate(url);
  };

  const go = (url) => {
    if (!url) return;
    if (url.startsWith("http://") || url.startsWith("https://")) {
      window.open(url, "_blank", "noreferrer");
      return;
    }
    navigate(url);
  };

  return (
    <section className="asb-hero" aria-label="ASB Hero Slider">
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        slidesPerView={1}
        loop={finalSlides.length > 1}
        autoplay={{ delay: 3200, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        navigation={finalSlides.length > 1}
        className="asb-swiper"
      >
        {finalSlides.map((s, idx) => (
          <SwiperSlide key={idx}>
            <div
              className="asb-slide"
              style={{ backgroundImage: `url(${s.img})` }}
              onClick={() => onSlideClick(s)}
              role="img"
              aria-label={s.title || "banner"}
            >
              <div className="asb-overlay" />
              <div className="asb-content" onClick={(e) => e.stopPropagation()}>
                <div className="asb-badge">ASB • Premium Guidance</div>
                <h2 className="asb-title">{s.title}</h2>
                <p className="asb-subtitle">{s.subtitle}</p>

                <div className="asb-actions">
                  <button
                    type="button"
                    className="asb-btn asb-btn--primary"
                    onClick={() => go(s.ctaPrimaryLink || "/contact")}
                  >
                    {s.ctaPrimaryText || "Book Consultation"}
                  </button>
                  <button
                    type="button"
                    className="asb-btn asb-btn--ghost"
                    onClick={() => go(s.ctaSecondaryLink || "/shop")}
                  >
                    {s.ctaSecondaryText || "Explore Products"}
                  </button>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <style>{`
        :root{
          --asb-start:#6a5cff;
          --asb-end:#c84cff;
          --asb-white:#fff;
        }

        .asb-hero{ width: 100%; }

        .asb-slide{
          position: relative;
          height: 320px;
          border-radius: 18px;
          overflow: hidden;
          background-size: cover;
          background-position: center;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          border: 1px solid rgba(106, 92, 255, 0.2);
          cursor: pointer;
        }

        .asb-overlay{
          position:absolute;
          inset:0;
          background:
            linear-gradient(90deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 60%, transparent 100%),
            radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1), transparent 60%);
        }

        .asb-content{
          position: relative;
          z-index: 2;
          height: 100%;
          padding: 28px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          max-width: 720px;
          color: var(--asb-white);
        }

        .asb-badge{
          width: fit-content;
          padding: 6px 12px;
          border-radius: 999px;
          font-weight: 800;
          font-size: 12px;
          letter-spacing: .5px;
          background: rgba(106, 92, 255, 0.25);
          border: 1px solid rgba(106, 92, 255, 0.4);
          color: #e0dbff;
          margin-bottom: 12px;
        }

        .asb-title{
          margin: 0;
          font-size: 38px;
          line-height: 1.1;
          font-weight: 900;
          text-shadow: 0 4px 12px rgba(0,0,0,0.4);
        }

        .asb-subtitle{
          margin: 12px 0 0;
          font-size: 16px;
          font-weight: 600;
          opacity: 0.9;
          max-width: 500px;
          text-shadow: 0 2px 8px rgba(0,0,0,0.4);
        }

        .asb-actions{
          display: flex;
          gap: 12px;
          margin-top: 24px;
          flex-wrap: wrap;
        }

        .asb-btn{
          border: none;
          cursor: pointer;
          border-radius: 12px;
          padding: 12px 20px;
          font-weight: 800;
          font-size: 14px;
          transition: all 200ms ease;
        }

        .asb-btn:hover{ transform: translateY(-2px); }
        .asb-btn:active{ transform: translateY(0); }

        .asb-btn--primary{
          color: white;
          background: linear-gradient(135deg, #6a5cff, #c84cff);
          box-shadow: 0 8px 20px rgba(106, 92, 255, 0.3);
        }

        .asb-btn--ghost{
          color: white;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.3);
          backdrop-filter: blur(4px);
        }

        .asb-swiper .swiper-pagination-bullet{
          background: rgba(255,255,255,0.5);
          opacity: 1;
        }
        .asb-swiper .swiper-pagination-bullet-active{
          background: #6a5cff;
          box-shadow: 0 0 0 4px rgba(106, 92, 255, 0.2);
        }

        .asb-swiper .swiper-button-prev,
        .asb-swiper .swiper-button-next{
          color: #fff;
          transform: scale(0.8);
        }

        @media (max-width: 640px){
          .asb-slide{ height: 260px; border-radius: 14px; }
          .asb-content{ padding: 20px; }
          .asb-title{ font-size: 26px; }
          .asb-subtitle{ font-size: 14px; }
        }
      `}</style>
    </section>
  );
}
