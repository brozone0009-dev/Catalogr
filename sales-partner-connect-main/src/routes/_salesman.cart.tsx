import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/lib/cart-context";
import { createOrder } from "@/lib/api";

export const Route = createFileRoute("/_salesman/cart")({
  head: () => ({ meta: [{ title: "Cart — Catalogr Sales" }] }),
  component: CartPage,
});

function CartPage() {
  const { items, update, remove, clear, total } = useCart();
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (items.length === 0) return toast.error("Cart is empty");
    if (!customerName.trim()) return toast.error("Customer name is required");
    setBusy(true);
    try {
      await createOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        items,
      });
      clear();
      toast.success("Order placed");
      navigate({ to: "/orders" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
        <ShoppingCart className="h-10 w-10 text-muted-foreground" />
        <h2 className="mt-4 font-display text-xl font-semibold">Your cart is empty</h2>
        <p className="mt-1 text-sm text-muted-foreground">Add products from the catalog to build an order.</p>
        <Button asChild className="mt-6"><Link to="/browse">Browse catalog</Link></Button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-3">
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">Cart</h1>
        <div className="divide-y divide-border rounded-xl border border-border bg-card shadow-soft">
          {items.map((it) => (
            <div key={it.variantId} className="grid grid-cols-[1fr_120px_100px_40px] items-center gap-3 p-4">
              <div>
                <div className="font-medium leading-tight">{it.productName}</div>
                <div className="text-xs text-muted-foreground">{it.variantLabel}</div>
                <div className="mt-1 text-xs text-muted-foreground">₹{it.price} each</div>
              </div>
              <Input
                type="number"
                min={1}
                value={it.quantity}
                onChange={(e) => update(it.variantId, Math.max(1, Number(e.target.value) || 1))}
              />
              <div className="text-right font-medium">₹{it.price * it.quantity}</div>
              <button
                type="button"
                onClick={() => remove(it.variantId)}
                className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label="Remove item"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="h-fit space-y-4 rounded-xl border border-border bg-card p-5 shadow-soft">
        <h2 className="font-display text-lg font-semibold">Customer & checkout</h2>
        <div className="space-y-2">
          <Label htmlFor="cname">Customer name</Label>
          <Input id="cname" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cphone">Phone (optional)</Label>
          <Input id="cphone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
        </div>
        <div className="flex items-center justify-between border-t border-border pt-4 text-sm">
          <span className="text-muted-foreground">Total</span>
          <span className="font-display text-xl font-semibold">₹{total}</span>
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Placing order…" : "Place order"}
        </Button>
        <button
          type="button"
          onClick={clear}
          className="w-full text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          Clear cart
        </button>
      </form>
    </div>
  );
}
