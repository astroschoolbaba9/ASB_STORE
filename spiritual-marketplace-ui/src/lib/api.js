// src/lib/api.js
import { getFriendlyMessage } from "../utils/errorMapping";
const API_BASE = (() => {
  const base = process.env.REACT_APP_API_BASE || "https://api.asbcrystal.in";
  if (base.includes("asbcrystal.in") && base.startsWith("http://")) {
    return base.replace("http://", "https://");
  }
  return base;
})();

function getToken() {
  return localStorage.getItem("asb_access_token") || "";
}

function buildQuery(query = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    params.append(k, String(v));
  });
  const s = params.toString();
  return s ? `?${s}` : "";
}

async function request(path, { method = "GET", body, token, query, headers } = {}) {
  const url = `${API_BASE}${path}${buildQuery(query)}`;

  const authToken = token ?? getToken();

  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  const finalHeaders = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(headers || {}),
  };

  if (authToken) finalHeaders.Authorization = `Bearer ${authToken}`;

  let res;
  try {
    res = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
      credentials: "include",
    });
  } catch (e) {
    const err = new Error(e?.message || "Network error");
    err.status = 0;
    err.code = "NETWORK_ERROR";
    err.friendlyMessage = getFriendlyMessage(err);
    throw err;
  }

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { success: false, message: text };
  }

  if (!res.ok) {
    const err = new Error(data?.message || "Request failed");
    err.status = res.status;
    // Map backend code if available
    err.code = data?.code || data?.errorCode || (res.status === 429 ? "RATE_LIMITED" : "REQUEST_FAILED");
    err.details = data?.details || null;
    err.friendlyMessage = getFriendlyMessage(err);

    // ✅ important: keep raw response for UI decisions
    err.response = data;

    throw err;
  }

  return data;
}

export const api = {
  get: (path, { query, headers } = {}) => request(path, { method: "GET", query, headers }),
  post: (path, body, { query, headers } = {}) => request(path, { method: "POST", body, query, headers }),
  put: (path, body, { query, headers } = {}) => request(path, { method: "PUT", body, query, headers }),
  patch: (path, body, { query, headers } = {}) => request(path, { method: "PATCH", body, query, headers }),
  del: (path, { query, headers } = {}) => request(path, { method: "DELETE", query, headers }),
};
export { API_BASE };

