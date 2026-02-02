import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminGuard({ children }) {
  const { user, fetchMe } = useAuth();
  const location = useLocation();
  const token = localStorage.getItem("asb_access_token") || "";

  const [checking, setChecking] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let alive = true;

    async function run() {
      if (!token) {
        if (alive) setChecking(false);
        return;
      }

      try {
        const me = user || (await fetchMe());
        const role = (me?.role || me?.user?.role || "").toLowerCase();


        if (role !== "admin") {
          if (alive) setDenied(true);
        }
      } catch (e) {
        // token invalid / expired → force login
        localStorage.removeItem("asb_access_token");
      } finally {
        if (alive) setChecking(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // No token → login
  if (!token) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (checking) {
    return (
      <div style={{ padding: 18 }}>
        <div style={{ fontWeight: 800 }}>Checking admin access…</div>
        <div style={{ opacity: 0.8, marginTop: 6 }}>Validating token and role</div>
      </div>
    );
  }

  if (denied) {
    return <Navigate to="/admin/access-denied" replace />;
  }

  return children;
}
