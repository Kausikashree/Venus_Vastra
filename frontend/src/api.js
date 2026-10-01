const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? "http://localhost:8000" : "");

function errorMessage(detail, fallback) {
  if (typeof detail === "string" && detail.trim()) return detail;

  if (Array.isArray(detail)) {
    const messages = detail.map((item) => {
      if (typeof item === "string") return item;
      if (!item || typeof item !== "object") return "";

      const location = Array.isArray(item.loc)
        ? item.loc.filter((part) => !["body", "query", "path"].includes(part)).join(".")
        : "";
      const message = typeof item.msg === "string" ? item.msg : "Invalid value";
      return location ? `${location}: ${message}` : message;
    }).filter(Boolean);

    if (messages.length) return messages.join("; ");
  }

  if (detail && typeof detail === "object" && typeof detail.message === "string") {
    return detail.message;
  }

  return fallback;
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(errorMessage(data.detail, "Something went wrong"));
  return data;
}

export const api = {
  register: (payload) => request("/api/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) => request("/api/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  me: (token) => request("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } }),
  contact: (payload) => request("/api/contact", { method: "POST", body: JSON.stringify(payload) }),
  products: () => request("/api/products"),
  adminProducts: (token) => request("/api/admin/products", { headers: { Authorization: `Bearer ${token}` } }),
  createProduct: (token, payload) => request("/api/admin/products", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) }),
  updateProduct: (token, id, payload) => request(`/api/admin/products/${id}`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) }),
  deleteProduct: (token, id) => request(`/api/admin/products/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }),
  uploadProductImage: async (token, file) => {
    const formData = new FormData();
    formData.append("image", file);
    const response = await fetch(`${API_BASE}/api/admin/uploads`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(errorMessage(data.detail, "Unable to upload image"));
    return data;
  },
};
