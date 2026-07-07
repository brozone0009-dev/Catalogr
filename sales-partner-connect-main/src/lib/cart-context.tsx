import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { OrderItem } from "./api";

const KEY = "salesman_cart";

type CartCtx = {
  items: OrderItem[];
  add: (item: OrderItem) => void;
  update: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  total: number;
  count: number;
};

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(KEY) ?? "[]")); } catch { /* noop */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const add = (item: OrderItem) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.variantId === item.variantId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + item.quantity };
        return copy;
      }
      return [...prev, item];
    });
  };

  const update = (variantId: string, quantity: number) =>
    setItems((prev) => prev.map((i) => (i.variantId === variantId ? { ...i, quantity } : i)));

  const remove = (variantId: string) =>
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));

  const clear = () => setItems([]);

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <Ctx.Provider value={{ items, add, update, remove, clear, total, count }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used within CartProvider");
  return c;
}
