import { Routes, Route, Navigate } from "react-router-dom";

import Home from "../pages/Home/Home";
import Shop from "../pages/Shop/Shop";
import ProductDetail from "../pages/ProductDetail/ProductDetail";
import Cart from "../pages/Cart/Cart";
import Checkout from "../pages/Checkout/Checkout";

import Courses from "../pages/Courses/Course";
import CourseDetail from "../pages/Courses/CourseDetail";
import CourseViewer from "../pages/Courses/CourseViewer";

import DashboardLayout from "../pages/Dashboard/DashboardLayout";
import Profile from "../pages/Dashboard/Profile";
import Orders from "../pages/Dashboard/Orders";
import OrderDetail from "../pages/Dashboard/OrderDetail";
import GiftOrders from "../pages/Dashboard/GiftOrders";
import MyCourses from "../pages/Dashboard/MyCourses";

import Login from "../components/Auth/Login";
import Register from "../components/Auth/Register";
import ForgotPassword from "../components/Auth/ForgotPassword";

import About from "../pages/About/About";
import Contact from "../pages/Contact/Contact";
import Services from "../pages/Services/Services";
import SectionPage from "../pages/Section/SectionPage";

import NotFound from "../pages/NotFound/NotFound";
import { RequireAuth, RequireGuest } from "./guards";

// ✅ Payment pages (top level)
import PaymentSuccess from "../pages/Payment/PaymentSuccess";
import PaymentFailed from "../pages/Payment/PaymentFailed";
import PaymentRedirect from "../pages/Payment/PaymentRedirect";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Home */}
      <Route path="/" element={<Home />} />

      {/* ✅ Payment routes must be TOP LEVEL (NOT inside /dashboard) */}
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/payment/failed" element={<PaymentFailed />} />
      <Route path="/payment/redirect" element={<PaymentRedirect />} />

      {/* Core shop flow */}
      <Route path="/shop" element={<Shop />} />
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="/cart" element={<Cart />} />

      {/* ✅ Checkout should be logged-in */}
      <Route element={<RequireAuth />}>
        <Route path="/checkout" element={<Checkout />} />
      </Route>

      {/* Courses / Trainings */}
      <Route path="/courses" element={<Courses />} />
      <Route path="/courses/:id" element={<CourseDetail />} />
      <Route path="/viewer/:id" element={<CourseViewer />} />
      <Route path="/trainings" element={<Courses />} />

      {/* Static pages */}
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/services" element={<Services />} />

      {/* Section-based navigation */}
      <Route path="/section/:key" element={<SectionPage />} />

      {/* ✅ Dashboard requires auth */}
      <Route element={<RequireAuth />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Navigate to="profile" replace />} />
          <Route path="profile" element={<Profile />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="gift-orders" element={<GiftOrders />} />
          <Route path="courses" element={<MyCourses />} />
        </Route>
      </Route>

      {/* ✅ Auth pages should be guest-only */}
      <Route element={<RequireGuest />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
