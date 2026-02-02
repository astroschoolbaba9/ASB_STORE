// src/hooks/useRequireAuth.js
import { useAuth } from "../context/AuthContext";

export default function useRequireAuth() {
  const { isAuthenticated, openAuthModal } = useAuth();

  /**
   * Usage:
   * requireAuth(() => { ... })
   * If not logged in -> open modal and run action AFTER successful login/OTP verify.
   */
  const requireAuth = (action) => {
    if (isAuthenticated) {
      return action?.();
    }

    // ✅ Save the action so we can run it after successful login
    window.__asb_pending_action = action;

    // open login modal
    openAuthModal("login");
    return null;
  };

  return requireAuth;
}
