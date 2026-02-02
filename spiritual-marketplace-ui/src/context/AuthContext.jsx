import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalInitial, setAuthModalInitial] = useState("login"); // "login" | "register"

  const openAuthModal = (initial = "login") => {
    setAuthModalInitial(initial);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => setAuthModalOpen(false);

  const setToken = (token) => {
    if (token) localStorage.setItem("asb_access_token", token);
    else localStorage.removeItem("asb_access_token");
  };

  // ✅ This runs the "pending action" after successful login/register/otp verify
  const runPendingAction = () => {
    const fn = window.__asb_pending_action;
    if (typeof fn === "function") {
      window.__asb_pending_action = null;
      Promise.resolve(fn()).catch((e) => console.error("Pending action failed:", e));
    }
  };

  const fetchMe = async () => {
    const token = localStorage.getItem("asb_access_token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get("/api/auth/me");
      setUser(res.user);
    } catch (e) {
      setToken("");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const registerPassword = async ({ name, email, phone, password }) => {
    const res = await api.post("/api/auth/register", { name, email, phone, password });
    setToken(res.accessToken);
    setUser(res.user);
    closeAuthModal();

    // ✅ IMPORTANT: after login/register, run the action (add to cart + navigate)
    runPendingAction();

    return res.user;
  };

  const loginPassword = async ({ identifier, password }) => {
    const res = await api.post("/api/auth/login", { identifier, password });
    setToken(res.accessToken);
    setUser(res.user);
    closeAuthModal();
    runPendingAction();
    return res.user;
  };

  const sendOtp = async ({ identifier }) => {
    return api.post("/api/auth/send-otp", { identifier });
  };

  const verifyOtp = async ({ identifier, otp }) => {
    const res = await api.post("/api/auth/verify-otp", { identifier, otp });
    setToken(res.accessToken);
    setUser(res.user);
    closeAuthModal();
    runPendingAction();
    return res.user;
  };

  const logout = () => {
    setToken("");
    setUser(null);

    // ✅ clear any pending action
    window.__asb_pending_action = null;
  };

  const value = {
    // auth state
    user,
    loading,
    isAuthenticated: !!user,

    // auth actions
    registerPassword,
    loginPassword,
    sendOtp,
    verifyOtp,
    logout,
    refreshMe: fetchMe,

    // modal controls
    authModalOpen,
    authModalInitial,
    openAuthModal,
    closeAuthModal
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
