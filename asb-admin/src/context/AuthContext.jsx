import React, { createContext, useContext, useMemo, useState } from "react";
import { api } from "../lib/api";

const AuthContext = createContext(null);

const TOKEN_KEY = "asb_access_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { _id, name, role, ... }
  const [loading, setLoading] = useState(false);

  const token = useMemo(() => {
    try {
      return localStorage.getItem(TOKEN_KEY) || "";
    } catch {
      return "";
    }
  }, []);

  function setToken(accessToken) {
    if (!accessToken) return;
    localStorage.setItem(TOKEN_KEY, accessToken);
  }

  function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  async function fetchMe() {
    setLoading(true);
    try {
      const me = await api.get("/api/auth/me");
      // backend might return {user:{...}} or direct user object
      const u = me?.user || me;
      setUser(u || null);
      return u;
    } finally {
      setLoading(false);
    }
  }

  async function loginWithPassword({ identifier, password }) {
    setLoading(true);
    try {
      const res = await api.post("/api/auth/login", { identifier, password });

      // backend might return {accessToken} or {token} etc.
      const accessToken = res?.accessToken || res?.token || res?.data?.accessToken;
      if (!accessToken) {
        const err = new Error("Login succeeded but access token missing in response");
        err.status = 500;
        err.code = "TOKEN_MISSING";
        err.response = res;
        throw err;
      }

      setToken(accessToken);

      // load user
      const u = await api.get("/api/auth/me");
      const userObj = u?.user || u;

      setUser(userObj || null);
      return userObj;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  const value = {
    user,
    setUser,
    loading,
    token,
    loginWithPassword,
    fetchMe,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
