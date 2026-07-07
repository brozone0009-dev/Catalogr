import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { OwnerShell } from "@/components/owner-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listProducts, createOrder, type OrderItem, type Product } from "@/lib/api";

export const Route = createFileRoute("/_owner/make-orders")({
  head: () => ({ meta: [{ title: "Make Orders — Catalogr" }] }),
  component: MakeOrdersPage,
});

function MakeOrdersPage() {
  const qc = useQueryClient();
  const search = useSearch({ from: "/_owner/make-orders" }) as { productId?: string };
  const products = useQuery({ queryKey: ["products"], queryFn: listProducts });
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [salesmanName, setSalesmanName] = useState("");
  const [advance, setAdvance] = useState("0");
  // items: list of order lines (product + variant + quantity)
  const [items, setItems] = useState(() => [{
    id: `${Date.now()}-0`,
    productId: search.productId ?? "",
    variantId: "",
    quantity: "1",
  }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // helpers to get product/variant for an item
  const getProductFor = (item: { productId?: string } | null) => products.data?.find((p) => p._id === item?.productId) ?? null;
  const getVariantFor = (product: Product | null, variantId?: string) => {
    if (!product) return null;
    return product.variants.find((v) => v._id === variantId) ?? product.variants[0] ?? null;
  };

  

  function submit() {
    if (!items.length) return toast.error("Add at least one item");
    const orderItems: OrderItem[] = [];
    for (const it of items) {
      const prod = getProductFor(it as any);
      if (!prod) return toast.error("Pick a product for every item");
      const varnt = getVariantFor(prod, it.variantId);
      if (!varnt) return toast.error(`Product ${prod.name} needs at least one variant`);
      const qty = Number(it.quantity) || 1;
      if (varnt.stock < qty) return toast.error(`Only ${varnt.stock} unit(s) available for ${prod.name}`);
      orderItems.push({
        productId: prod._id,
        variantId: varnt._id,
        productName: prod.name,
        variantLabel: `${varnt.color} / ${varnt.size}`,
        quantity: qty,
        price: prod.price,
      });
    }
    const advanceVal = Number(advance) || 0;
    setIsSubmitting(true);
    createOrder({ customerName, customerPhone, salesmanName, items: orderItems, advancePaid: advanceVal })
      .then(() => {
        toast.success("Order created");
        setCustomerName(""); setCustomerPhone(""); setSalesmanName(""); setAdvance("0");
        setItems([{ id: `${Date.now()}-0`, productId: "", variantId: "", quantity: "1" }]);
        qc.invalidateQueries({ queryKey: ["orders"] });
        qc.invalidateQueries({ queryKey: ["customers"] });
      }).catch((err) => toast.error((err as Error).message)).finally(() => setIsSubmitting(false));
  }

  function addItem() {
    setItems((s) => [...s, { id: `${Date.now()}-${Math.random()}`, productId: "", variantId: "", quantity: "1" }]);
  }
  function removeItem(id: string) {
    setItems((s) => s.filter((it) => it.id !== id));
  }
  function updateItem(id: string, patch: Partial<{ productId: string; variantId: string; quantity: string }>) {
    setItems((s) => s.map((it) => it.id === id ? { ...it, ...patch } : it));
  }

  return (
    <OwnerShell title="Make Orders" action={<Button onClick={submit} disabled={isSubmitting}><ShoppingCart className="mr-2 h-4 w-4" /> Create order</Button>}>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="shadow-soft">
          <CardContent className="space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Customer name</Label><Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Customer phone</Label><Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Salesman name</Label><Input value={salesmanName} onChange={(e) => setSalesmanName(e.target.value)} /></div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Items</div>
                <Button size="sm" variant="ghost" onClick={addItem}><Plus className="mr-2 h-3 w-3"/> Add item</Button>
              </div>
              {items.map((it) => {
                const prod = getProductFor(it as any);
                const varnt = getVariantFor(prod, it.variantId);
                return (
                  <div key={it.id} className="grid gap-3 sm:grid-cols-3 items-end">
                    <div className="space-y-1.5 sm:col-span-1">
                      <Label>Product</Label>
                      <Select value={it.productId} onValueChange={(v) => updateItem(it.id, { productId: v, variantId: "", quantity: it.quantity })}>
                        <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                        <SelectContent>
                          {(products.data ?? []).map((product) => <SelectItem key={product._id} value={product._id}>{product.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Variant</Label>
                      <Select value={it.variantId ?? ""} onValueChange={(v) => updateItem(it.id, { variantId: v })}>
                        <SelectTrigger><SelectValue placeholder="Select variant" /></SelectTrigger>
                        <SelectContent>
                          {(prod?.variants ?? []).map((v) => <SelectItem key={v._id} value={v._id}>{`${v.color} / ${v.size} — ${v.stock} in stock`}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Quantity</Label>
                      <div className="flex items-center gap-2">
                        <Input type="number" min={1} value={it.quantity} onChange={(e) => updateItem(it.id, { quantity: e.target.value })} />
                        <Button variant="destructive" onClick={() => removeItem(it.id)}><Minus /></Button>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="space-y-1.5">
                <Label>Advance payment</Label>
                <Input type="number" min={0} value={advance} onChange={(e) => setAdvance(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="space-y-3 p-5">
            <div className="text-sm font-medium text-muted-foreground">Order summary</div>
            {items.length ? (
              <>
                <div className="space-y-2">
                  {items.map((it) => {
                    const prod = getProductFor(it as any);
                    const varnt = getVariantFor(prod, it.variantId);
                    const qty = Number(it.quantity) || 1;
                    const price = prod?.price ?? 0;
                    return (
                      <div key={it.id} className="border-b border-border pb-2">
                        <div className="font-semibold">{prod?.name ?? "-"}</div>
                        <div className="text-sm text-muted-foreground">{varnt ? `${varnt.color} / ${varnt.size}` : "-"}</div>
                        <div className="flex items-center justify-between text-sm pt-1"><span>Unit price</span><span>₹{price.toFixed(2)}</span></div>
                        <div className="flex items-center justify-between text-sm"><span>Quantity</span><span>{qty}</span></div>
                        <div className="flex items-center justify-between text-sm font-semibold"><span>Line total</span><span>₹{(price * qty).toFixed(2)}</span></div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3 text-sm"><span>Subtotal</span><span>₹{items.reduce((acc, it) => {
                  const prod = getProductFor(it as any);
                  const qty = Number(it.quantity) || 1;
                  return acc + (prod?.price ?? 0) * qty;
                }, 0).toFixed(2)}</span></div>
                <div className="flex items-center justify-between text-sm"><span>Advance</span><span>₹{(Number(advance) || 0).toFixed(2)}</span></div>
                <div className="flex items-center justify-between text-base font-semibold"><span>Remaining</span><span>₹{(items.reduce((acc, it) => {
                  const prod = getProductFor(it as any);
                  const qty = Number(it.quantity) || 1;
                  return acc + (prod?.price ?? 0) * qty;
                }, 0) - (Number(advance) || 0)).toFixed(2)}</span></div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Add items to preview the order.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </OwnerShell>
  );
}