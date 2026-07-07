const DEFAULT_API_BASE = "http://localhost:5000/api";
const isBrowser = () => typeof window !== "undefined";

function resolveApiBase() {
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (apiUrl) return apiUrl.replace(/\/$/, "");
  if (isBrowser()) return `${window.location.origin}/api`;
  return DEFAULT_API_BASE;
}

const API_BASE = resolveApiBase();

function authHeaders(extra = {}) {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}`, ...extra } : extra;
}

async function handle(res) {
  if (!res.ok) {
    let msg = res.statusText;
    try { msg = (await res.json())?.error || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export const listSalesmen = async () =>
  handle(await fetch(`${API_BASE}/salesmen`, { headers: authHeaders() }));

export const createSalesman = async (payload) =>
  handle(await fetch(`${API_BASE}/salesmen`, {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  }));

export const updateSalesman = async (id, payload) =>
  handle(await fetch(`${API_BASE}/salesmen/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  }));

export const deleteSalesman = async (id) =>
  handle(await fetch(`${API_BASE}/salesmen/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  }));
