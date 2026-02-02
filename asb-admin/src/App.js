import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import AdminGuard from "./app/AdminGuard";
import AdminLayout from "./app/AdminLayout";

import Categories from "./pages/admin/Categories";
import Products from "./pages/admin/Products";
import Courses from "./pages/admin/Courses";
import AdminBanners from "./pages/admin/AdminBanners";

import Orders from "./pages/admin/Order";
import OrderDetail from "./pages/admin/OrderDetail";
import Gift from "./pages/admin/Gift/Gift";

import ContactMessages from "./pages/admin/ContactMessages"; // ✅ NEW

import { ToastProvider } from "./components/ToastProvider";

import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AccessDenied from "./pages/admin/AccessDenied";
import NotFound from "./pages/admin/NotFound";
import AuditLogs from "./pages/admin/AuditLogs";
export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          {/* default */}
          <Route path="/" element={<Navigate to="/admin/login" replace />} />

          {/* admin auth */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* admin protected area */}
          <Route
            path="/admin"
            element={
              <AdminGuard>
                <AdminLayout />
              </AdminGuard>
            }
          >
            {/* default inside /admin */}
            <Route index element={<Navigate to="dashboard" replace />} />

            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="access-denied" element={<AccessDenied />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="categories" element={<Categories />} />
            <Route path="products" element={<Products />} />
            <Route path="courses" element={<Courses />} />
            <Route path="banners" element={<AdminBanners />} />

            {/* ✅ Orders */}
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetail />} />

            {/* ✅ Gift CMS */}
            <Route path="gift" element={<Gift />} />

            {/* ✅ NEW: Contact form leads */}
            <Route path="contact-messages" element={<ContactMessages />} />
          </Route>

          {/* fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
