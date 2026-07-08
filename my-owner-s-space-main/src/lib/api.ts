/**
 * API layer.
 */

export type Owner = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
};

export type Category = { _id: string; ownerId: string; name: string };
export type Company = { _id: string; ownerId: string; name: string };

export type Variant = { _id: string; color: string; size: string; stock: number };
export type Product = {
  _id: string;
  ownerId: string;
  companyId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  status: "active" | "draft" | "archived";
  variants: Variant[];
  createdAt: string;
};

export type Customer = {
  _id: string;
  ownerId: string;
  name: string;
  phone?: string;
  email?: string;
  totalCredit: number;
  totalDebit: number;
  createdAt: string;
};

export type OrderItem = {
  productId: string;
  variantId: string;
  productName: string;
  variantLabel: string;
  quantity: number;
  price: number;
};
export type Order = {
  _id: string;
  ownerId: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  salesmanName: string;
  items: OrderItem[];
  totalAmount: number;
  advancePaid?: number;
  remainingAmount?: number;
  status: "pending" | "accepted" | "rejected";
  orderDate: string;
};

export type ShareLink = {
  _id: string;
  ownerId: string;
  shareCode: string;
  shareType: "product" | "category" | "company" | "custom" | "search";
  productIds: string[];
  label: string;
  expiresAt: string;
  createdAt: string;
};

const K = { session: "owner_session" };

const DEFAULT_API_BASE = "http://localhost:5000/api";

function resolveApiBase() {
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
  const isCapacitor = typeof window !== "undefined" && 
    (window.location.protocol === "capacitor:" || !!(window as any).Capacitor);

  if (apiUrl) {
    return apiUrl.replace(/\/$/, "");
  }

  if (isBrowser()) {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return DEFAULT_API_BASE;
    }
    return DEFAULT_API_BASE;
  }
  return DEFAULT_API_BASE;
}

export const API_BASE = resolveApiBase();

/**
 * Fixes a URL to be absolute and reachable from the app.
 * Forces HTTPS for Cloudinary and handles localhost on mobile.
 */
export function fixUrl(url?: string) {
  if (!url) return url;
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;

  let finalUrl = url;

  // 1. Force HTTPS for Cloudinary to avoid Mixed Content blocks in mobile WebViews
  if (finalUrl.includes("res.cloudinary.com")) {
    finalUrl = finalUrl.replace(/^http:/, "https:");
  }

  // 2. Handle absolute URLs (fix localhost for emulator)
  if (finalUrl.startsWith("http")) {
    const isCapacitor = typeof window !== "undefined" &&
      (window.location.protocol === "capacitor:" || !!(window as any).Capacitor);

    if (isCapacitor && (finalUrl.includes("localhost") || finalUrl.includes("127.0.0.1"))) {
      finalUrl = finalUrl.replace("localhost", "10.0.2.2").replace("127.0.0.1", "10.0.2.2");
    }
    return finalUrl;
  }

  // 3. Prepend API base for relative paths
  const base = API_BASE.replace(/\/api$/, "");
  const normalizedPath = url.startsWith("/") ? url : `/${url}`;
  return `${base}${normalizedPath}`;
}

function authHeaders(extra: Record<string, string> = {}) {
  const token = isBrowser() ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}`, ...extra } : extra;
}

function ensureAuthOrRedirect() {
  const token = isBrowser() ? localStorage.getItem("token") : null;
  if (!token) {
    if (isBrowser()) {
      localStorage.removeItem("token");
      localStorage.removeItem("owner_session");
      window.location.replace("/auth");
    }
    throw new Error("Unauthorized");
  }
  return token;
}

function isBrowser() {
  return typeof window !== "undefined";
}
const read = <T,>(k: string, fallback: T): T => {
  if (!isBrowser()) return fallback;
  try { return JSON.parse(localStorage.getItem(k) ?? "") as T; } catch { return fallback; }
};
const write = (k: string, v: unknown) => { if (isBrowser()) localStorage.setItem(k, JSON.stringify(v)); };
const delay = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 120));

// ---------- session ----------
export const getSession = (): Owner | null => read<Owner | null>(K.session, null);
export const requireSession = (): Owner => {
  const s = getSession();
  if (!s) throw new Error("Not authenticated");
  return s;
};

export async function signup(input: { name: string; email: string; password: string; phone?: string; companyName?: string }) {
  const res = await fetch(`${API_BASE}/auth/signup`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  const data = await res.json();
  if (isBrowser()) { localStorage.setItem("token", data.token); write(K.session, data.owner); }
  return data.owner as Owner;
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  const data = await res.json();
  if (isBrowser()) { localStorage.setItem("token", data.token); write(K.session, data.owner); }
  return data.owner as Owner;
}

export function logout() { if (isBrowser()) localStorage.removeItem(K.session); }

// ---------- categories ----------
export async function listCategories() {
  ensureAuthOrRedirect();
  const res = await fetch(`${API_BASE}/categories`, { headers: authHeaders() });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json() as Promise<Category[]>;
}
export async function createCategory(name: string) {
  const res = await fetch(`${API_BASE}/categories`, { method: "POST", headers: { "content-type": "application/json", ...authHeaders() }, body: JSON.stringify({ name }) });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json() as Promise<Category>;
}
export async function deleteCategory(id: string) {
  const res = await fetch(`${API_BASE}/categories/${id}`, { method: "DELETE", headers: authHeaders() });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return true;
}

// ---------- companies ----------
export async function listCompanies() {
  ensureAuthOrRedirect();
  const res = await fetch(`${API_BASE}/companies`, { headers: authHeaders() });
  if (res.status === 401) { ensureAuthOrRedirect(); }
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json() as Promise<Company[]>;
}
export async function createCompany(name: string) {
  const res = await fetch(`${API_BASE}/companies`, { method: "POST", headers: { "content-type": "application/json", ...authHeaders() }, body: JSON.stringify({ name }) });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json() as Promise<Company>;
}
export async function deleteCompany(id: string) {
  const res = await fetch(`${API_BASE}/companies/${id}`, { method: "DELETE", headers: authHeaders() });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return true;
}

// ---------- products ----------
export async function listProducts() {
  ensureAuthOrRedirect();
  const res = await fetch(`${API_BASE}/products`, { headers: authHeaders() });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json() as Promise<Product[]>;
}
export async function getProduct(id: string) {
  const res = await fetch(`${API_BASE}/products/${id}`, { headers: authHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json() as Promise<Product>;
}
export async function getPublicProduct(id: string) {
  const res = await fetch(`${API_BASE}/public/products/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json() as Promise<Product>;
}
export async function upsertProduct(input: Omit<Product, "_id" | "ownerId" | "createdAt"> & { _id?: string }) {
  if (input._id) {
    const res = await fetch(`${API_BASE}/products/${input._id}`, { method: "PUT", headers: { "content-type": "application/json", ...authHeaders() }, body: JSON.stringify(input) });
    if (!res.ok) throw new Error((await res.json()).error || res.statusText);
    return true;
  }
  const res = await fetch(`${API_BASE}/products`, { method: "POST", headers: { "content-type": "application/json", ...authHeaders() }, body: JSON.stringify(input) });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return true;
}
export async function deleteProduct(id: string) {
  const res = await fetch(`${API_BASE}/products/${id}`, { method: "DELETE", headers: authHeaders() });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return true;
}

export async function uploadProductImage(file: File) {
  const formData = new FormData();
  formData.append("image", file);
  const token = isBrowser() ? localStorage.getItem("token") : null;

  try {
    const response = await fetch(`${API_BASE}/products/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });

    if (response.ok) {
      const data = (await response.json()) as { url: string };
      return data.url;
    }

    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.details || response.statusText);
  } catch (error) {
    console.error("Upload error:", error);
    if (!import.meta.env.VITE_API_URL && isBrowser()) {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });
      return delay(dataUrl);
    }
    throw error;
  }
}

// ---------- orders ----------
export async function listOrders() {
  ensureAuthOrRedirect();
  const res = await fetch(`${API_BASE}/orders`, { headers: authHeaders() });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json() as Promise<Order[]>;
}
export async function listCustomers() {
  ensureAuthOrRedirect();
  const res = await fetch(`${API_BASE}/customers`, { headers: authHeaders() });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json() as Promise<Customer[]>;
}
export async function createOrder(input: {
  customerName: string;
  customerPhone?: string;
  salesmanName: string;
  items: OrderItem[];
  advancePaid?: number;
}) {
  const res = await fetch(`${API_BASE}/orders`, { method: "POST", headers: { "content-type": "application/json", ...authHeaders() }, body: JSON.stringify(input) });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json() as Promise<Order>;
}
export async function updateOrderStatus(id: string, status: Order["status"]) {
  const res = await fetch(`${API_BASE}/orders/${id}/status`, { method: "PATCH", headers: { "content-type": "application/json", ...authHeaders() }, body: JSON.stringify({ status }) });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return true;
}
// used only to demo: seed a sample order
export async function seedDemoOrder() {
  const res = await fetch(`${API_BASE}/orders/seed-demo`, { method: "POST", headers: authHeaders() });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json() as Promise<Order>;
}

// ---------- share links ----------
export async function listShareLinks() {
  ensureAuthOrRedirect();
  const res = await fetch(`${API_BASE}/share-links`, { headers: authHeaders() });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json() as Promise<ShareLink[]>;
}
export async function createShareLink(input: { shareType: ShareLink["shareType"]; productIds: string[]; label: string; expiresInDays: number }) {
  const res = await fetch(`${API_BASE}/share-links`, { method: "POST", headers: { "content-type": "application/json", ...authHeaders() }, body: JSON.stringify(input) });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json() as Promise<ShareLink>;
}
export async function deleteShareLink(id: string) {
  const res = await fetch(`${API_BASE}/share-links/${id}`, { method: "DELETE", headers: authHeaders() });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return true;
}
