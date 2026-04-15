import React, { Suspense, lazy } from "react";
import AppLayout from "./components/layout/AppLayout";
import TopBar from "./components/topbar/TopBar";
import AppRoutes from "./routes/AppRoutes";
import HeroSlider from "./components/HeroSlider";
import Navbar from "./components/navbar/Navbar";
import { useLocation } from "react-router-dom";
import ScrollToTop from "./components/common/ScrollToTop";

// ✅ Lazy load floating/popup components (not needed for first paint)
const WhatsAppFloat = lazy(() => import("./components/whatsapp/WhatsAppFloat"));
const InstagramFloat = lazy(() => import("./components/insta/InstagramFloat"));

export default function App() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <>
      <ScrollToTop />

      {/* ✅ Sticky Header (TopBar + Navbar fixed while scrolling) */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <TopBar />
        <Navbar />
      </div>

      {/* ✅ Slider only on Home route */}
      {isHome && (
        <div style={{ padding: "14px 16px" }}>
          <HeroSlider />
        </div>
      )}

      <AppLayout>
        <AppRoutes />
      </AppLayout>

      <Suspense fallback={null}>
        <InstagramFloat />
        <WhatsAppFloat />
      </Suspense>
    </>
  );
}
