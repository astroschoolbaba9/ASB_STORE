// src/lib/api.js
import { getFriendlyMessage } from "../utils/errorMapping";

const DEFAULT_BASE = "https://api.asbcrystal.in";

// CRA supports REACT_APP_*; user asked VITE_API_BASE too (we'll support both)
const API_BASE =
  process.env.REACT_APP_API_BASE ||
  process.env.VITE_API_BASE ||
  DEFAULT_BASE;

const TOKEN_KEY = "asb_access_token";

function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

function buildQuery(query = {}) {
  const params = new URLSearchParams();
  Object.entries(query || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;

    // arrays => repeat key (e.g. tags=a&tags=b)
    if (Array.isArray(v)) {
      v.forEach((item) => {
        if (item === undefined || item === null || item === "") return;
        params.append(k, String(item));
      });
      return;
    }

    params.append(k, String(v));
  });

  const s = params.toString();
  return s ? `?${s}` : "";
}

/**
 * Creates a consistent error object:
 * err.message, err.status, err.code, err.response
 */
async function toApiError(res, fallbackMessage) {
  let data = null;
  try {
    const text = await res.text();
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  const err = new Error(
    (data && (data.message || data.error)) || fallbackMessage || "Request failed"
  );

  err.status = res.status;
  err.code = (data && (data.code || data.errorCode)) || (res.status === 429 ? "RATE_LIMITED" : "HTTP_ERROR");
  err.friendlyMessage = getFriendlyMessage(err);
  err.response = data;

  return err;
}

async function request(path, { method = "GET", body, query, headers } = {}) {
  const url = `${API_BASE}${path}${buildQuery(query)}`;

  const token = getToken();

  const finalHeaders = {
    ...(headers || {}),
  };

  // Only set JSON header if body is not FormData
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  if (!isFormData) {
    finalHeaders["Content-Type"] = finalHeaders["Content-Type"] || "application/json";
  }

  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body
        ? isFormData
          ? body
          : JSON.stringify(body)
        : undefined,
      // if your backend uses cookies too, keep this:
      credentials: "include",
    });
  } catch (e) {
    const err = new Error(e?.message || "Network error");
    err.status = 0;
    err.code = "NETWORK_ERROR";
    err.friendlyMessage = getFriendlyMessage(err);
    err.response = null;
    throw err;
  }

  // No content
  if (res.status === 204) return null;

  // Parse success
  if (res.ok) {
    const text = await res.text();
    if (!text) return null;

    // Try JSON, fallback to text
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  // Errors
  throw await toApiError(res, `Request failed: ${method} ${path}`);
}

export const api = {
  get: (path, { query, headers } = {}) => request(path, { method: "GET", query, headers }),
  post: (path, body, { query, headers } = {}) => request(path, { method: "POST", body, query, headers }),
  put: (path, body, { query, headers } = {}) => request(path, { method: "PUT", body, query, headers }),
  patch: (path, body, { query, headers } = {}) => request(path, { method: "PATCH", body, query, headers }),
  del: (path, { query, headers } = {}) => request(path, { method: "DELETE", query, headers }),
};

export { API_BASE };
