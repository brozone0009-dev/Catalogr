/**
 * Salesman-side API client for the Catalogr backend.
 *
 * Talks to the Express/Mongo backend at VITE_API_URL.
 * Falls back to the current origin's /api path in the browser and localhost in Node.
 * Requires the backend salesman routes to be available under /api/salesman-auth/* and /api/salesman/*.
 */

const DEFAULT_API_BASE = "http://localhost:5000/api";
function isBrowser() {
  return typeof window !== "undefined";
}

function resolveApiBase() {
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
  const isCapacitor = typeof window !== "undefined" && 
    (window.location.protocol === "capacitor:" || !!(window as any).Capacitor);

  if (apiUrl) {
    if (isCapacitor && (apiUrl.includes("localhost") || apiUrl.includes("127.0.0.1"))) {
      console.warn("WARNING: Running in Capacitor but VITE_API_URL points to localhost. It may fail to connect to your live backend.");
    }
    return apiUrl.replace(/\/$/, "");
  }
  if (isBrowser()) {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      if (isCapacitor) {
        console.warn("WARNING: resolveApiBase fallback to local API base inside Capacitor. Configure VITE_API_URL.");
      }
      return DEFAULT_API_BASE;
    }
    return `${window.location.origin}/api`;
  }
  return DEFAULT_API_BASE;
}

const API_BASE = resolveApiBase();

const TOKEN_KEY = "salesman_token";
const SESSION_KEY = "salesman_session";

export type Salesman = {
  _id: string;
  ownerId: string;
  name: string;
  email: string;
  phone?: string;
  status: "active" | "disabled";
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
  salesmanId?: string;
  customerName: string;
  customerPhone?: string;
  salesmanName: string;
  items: OrderItem[];
  totalAmount: number;
  status: "pending" | "accepted" | "rejected";
  orderDate: string;
  createdAt: string;
};

function authHeaders(extra: Record<string, string> = {}) {
  const token = isBrowser() ? localStorage.getItem(TOKEN_KEY) : null;
  return token ? { Authorization: `Bearer ${token}`, ...extra } : extra;
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const body = await res.json();
      msg = body?.error || msg;
    } catch { /* noop */ }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

// ---------- session ----------
export function getSession(): Salesman | null {
  if (!isBrowser()) return null;
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null"); } catch { return null; }
}

export function logout() {
  if (!isBrowser()) return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/salesman-auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await handle<{ salesman: Salesman; token: string }>(res);
  if (isBrowser()) {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(SESSION_KEY, JSON.stringify(data.salesman));
  }
  return data.salesman;
}

// ---------- catalog (salesman-scoped, resolves to their owner) ----------
export async function listProducts() {
  return handle<Product[]>(await fetch(`${API_BASE}/salesman/products`, { headers: authHeaders() }));
}
export async function getProduct(id: string) {
  const res = await fetch(`${API_BASE}/salesman/products/${id}`, { headers: authHeaders() });
  if (res.status === 404) return null;
  return handle<Product>(res);
}
export async function listCategories() {
  return handle<Category[]>(await fetch(`${API_BASE}/salesman/categories`, { headers: authHeaders() }));
}
export async function listCompanies() {
  return handle<Company[]>(await fetch(`${API_BASE}/salesman/companies`, { headers: authHeaders() }));
}

// ---------- orders ----------
export async function listMyOrders() {
  return handle<Order[]>(await fetch(`${API_BASE}/salesman/orders`, { headers: authHeaders() }));
}

export async function createOrder(input: {
  customerName: string;
  customerPhone?: string;
  items: OrderItem[];
  advancePaid?: number;
}) {
  const res = await fetch(`${API_BASE}/salesman/orders`, {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders() },
    body: JSON.stringify(input),
  });
  return handle<Order>(res);
}
