// src/lib/api.js
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";

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

  const res = await fetch(url, {
    method,
    headers: finalHeaders,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    credentials: "include",
  });

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
    err.code = data?.code || "REQUEST_FAILED";
    err.details = data?.details || null;

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

