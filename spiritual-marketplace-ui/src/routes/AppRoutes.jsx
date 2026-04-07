import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { RequireAuth, RequireGuest } from "./guards";
import Skeleton from "../components/ui/Skeleton";

// ✅ Lazy load all pages for better performance
const Home = lazy(() => import("../pages/Home/Home"));
const Shop = lazy(() => import("../pages/Shop/Shop"));
const ProductDetail = lazy(() => import("../pages/ProductDetail/ProductDetail"));
const Cart = lazy(() => import("../pages/Cart/Cart"));
const Checkout = lazy(() => import("../pages/Checkout/Checkout"));

const Courses = lazy(() => import("../pages/Courses/Course"));
const CourseDetail = lazy(() => import("../pages/Courses/CourseDetail"));
const CourseViewer = lazy(() => import("../pages/Courses/CourseViewer"));

const DashboardLayout = lazy(() => import("../pages/Dashboard/DashboardLayout"));
const Profile = lazy(() => import("../pages/Dashboard/Profile"));
const Orders = lazy(() => import("../pages/Dashboard/Orders"));
const OrderDetail = lazy(() => import("../pages/Dashboard/OrderDetail"));
const GiftOrders = lazy(() => import("../pages/Dashboard/GiftOrders"));
const MyCourses = lazy(() => import("../pages/Dashboard/MyCourses"));

const Login = lazy(() => import("../components/Auth/Login"));
const Register = lazy(() => import("../components/Auth/Register"));
const ForgotPassword = lazy(() => import("../components/Auth/ForgotPassword"));

const About = lazy(() => import("../pages/About/About"));
const Contact = lazy(() => import("../pages/Contact/Contact"));
const Services = lazy(() => import("../pages/Services/Services"));
const SectionPage = lazy(() => import("../pages/Section/SectionPage"));

const NotFound = lazy(() => import("../pages/NotFound/NotFound"));

// ✅ Policy pages (lazy)
const TermsAndConditions = lazy(() => import("../pages/Policies/TermsAndConditions"));
const PrivacyPolicy = lazy(() => import("../pages/Policies/PrivacyPolicy"));
const ShippingPolicy = lazy(() => import("../pages/Policies/ShippingPolicy"));
const RefundPolicy = lazy(() => import("../pages/Policies/RefundPolicy"));

// ✅ Payment pages (lazy)
const PaymentSuccess = lazy(() => import("../pages/Payment/PaymentSuccess"));
const PaymentFailed = lazy(() => import("../pages/Payment/PaymentFailed"));
const PaymentRedirect = lazy(() => import("../pages/Payment/PaymentRedirect"));

export default function AppRoutes() {
  return (
    <Suspense fallback={<Skeleton />}>
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

        {/* Policy pages */}
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/shipping-policy" element={<ShippingPolicy />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />

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
    </Suspense>
  );
}
