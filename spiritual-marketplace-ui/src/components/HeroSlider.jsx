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
  return `${API_BASE}${u.startsWith("/") ? "" : "/"}${u}`;
}

const DUMMY_SLIDES = [
  {
    title: "Crystal Healing & Reiki",
    subtitle: "High-vibe crystals for peace, focus, and protection.",
    img: "/banners/banner1.jpg",
    clickUrl: "",
    ctaPrimaryText: "Book Consultation",
    ctaPrimaryLink: "/contact",
    ctaSecondaryText: "Explore Products",
    ctaSecondaryLink: "/shop",
  },
  {
    title: "Numerology Guidance",
    subtitle: "Your Numbers Speak — Your Life Has Patterns.",
    img: "/banners/banner2.jpg",
    clickUrl: "",
    ctaPrimaryText: "Book Consultation",
    ctaPrimaryLink: "/contact",
    ctaSecondaryText: "Explore Products",
    ctaSecondaryLink: "/shop",
  },
  {
    title: "Vastu & Energy Balancing",
    subtitle: "Align your space. Elevate your energy.",
    img: "/banners/banner3.jpg",
    clickUrl: "",
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
    clickUrl: b?.clickUrl || "",
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
          --asb-start:#C24DFF;
          --asb-end:#8657FF;
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
          box-shadow: 0 18px 45px rgba(134, 87, 255, 0.18);
          border: 1px solid rgba(194, 77, 255, 0.15);
          cursor: pointer;
        }

        .asb-overlay{
          position:absolute;
          inset:0;
          background:
            linear-gradient(90deg, rgba(194,77,255,0.55), rgba(134,87,255,0.55)),
            radial-gradient(circle at 20% 30%, rgba(255,255,255,0.18), transparent 60%),
            radial-gradient(circle at 80% 70%, rgba(255,255,255,0.12), transparent 60%);
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
          padding: 6px 10px;
          border-radius: 999px;
          font-weight: 800;
          font-size: 12px;
          letter-spacing: .3px;
          background: rgba(255,255,255,0.16);
          border: 1px solid rgba(255,255,255,0.22);
          margin-bottom: 10px;
        }

        .asb-title{
          margin: 0;
          font-size: 34px;
          line-height: 1.05;
          font-weight: 900;
          text-shadow: 0 10px 30px rgba(0,0,0,0.25);
        }

        .asb-subtitle{
          margin: 10px 0 0;
          font-size: 15px;
          font-weight: 600;
          opacity: 0.95;
          max-width: 520px;
          text-shadow: 0 10px 30px rgba(0,0,0,0.25);
        }

        .asb-actions{
          display: flex;
          gap: 10px;
          margin-top: 18px;
          flex-wrap: wrap;
        }

        .asb-btn{
          border: none;
          cursor: pointer;
          border-radius: 12px;
          padding: 10px 14px;
          font-weight: 800;
          font-size: 14px;
          transition: transform 160ms ease;
        }

        .asb-btn:active{ transform: translateY(1px); }

        .asb-btn--primary{
          color: white;
          background: linear-gradient(90deg, var(--asb-start), var(--asb-end));
          box-shadow: 0 12px 28px rgba(134,87,255,0.25);
        }

        .asb-btn--ghost{
          color: white;
          background: rgba(255,255,255,0.16);
          border: 1px solid rgba(255,255,255,0.25);
        }

        .asb-swiper .swiper-pagination-bullet{
          background: rgba(255,255,255,0.55);
          opacity: 1;
        }
        .asb-swiper .swiper-pagination-bullet-active{
          background: #fff;
          box-shadow: 0 0 0 4px rgba(194,77,255,0.25);
        }

        .asb-swiper .swiper-button-prev,
        .asb-swiper .swiper-button-next{
          color: #fff;
        }

        @media (max-width: 640px){
          .asb-slide{ height: 260px; border-radius: 14px; }
          .asb-content{ padding: 18px; }
          .asb-title{ font-size: 24px; }
        }
      `}</style>
    </section>
  );
}
