import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Package, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getProduct } from "@/lib/api";
import { useCart } from "@/lib/cart-context";

export const Route = createFileRoute("/_salesman/product/$id")({
  head: () => ({ meta: [{ title: "Product — Catalogr Sales" }] }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProduct(id),
  });

  const [variantId, setVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (isError) return <div className="text-sm text-destructive">{(error as Error).message}</div>;
  if (!data) return <div className="text-sm text-muted-foreground">Product not found.</div>;

  const selected = data.variants.find((v) => v._id === variantId) ?? null;

  function handleAdd() {
    if (!selected) return toast.error("Pick a variant first");
    if (quantity < 1) return toast.error("Quantity must be at least 1");
    if (quantity > selected.stock) return toast.error(`Only ${selected.stock} in stock`);
    add({
      productId: data!._id,
      variantId: selected._id,
      productName: data!.name,
      variantLabel: [selected.color, selected.size].filter(Boolean).join(" / ") || "Default",
      quantity,
      price: data!.price,
    });
    toast.success("Added to cart");
    navigate({ to: "/browse" });
  }

  return (
    <div className="space-y-6">
      <Link to="/browse" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to catalog
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-xl border border-border bg-muted">
          {data.image ? (
            <img src={data.image} alt={data.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Package className="h-12 w-12" />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="font-display text-3xl font-semibold">{data.name}</h1>
            <div className="mt-2 font-display text-2xl font-semibold text-primary">₹{data.price}</div>
            {data.description && (
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{data.description}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label>Choose variant</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {data.variants.map((v) => {
                const disabled = v.stock <= 0;
                const active = v._id === variantId;
                const label = [v.color, v.size].filter(Boolean).join(" / ") || "Default";
                return (
                  <button
                    key={v._id}
                    type="button"
                    disabled={disabled}
                    onClick={() => setVariantId(v._id)}
                    className={`rounded-lg border px-4 py-3 text-left text-sm transition ${
                      active
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border bg-card hover:border-primary/40"
                    } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    <div className="font-medium">{label}</div>
                    <div className={`mt-0.5 text-xs ${v.stock > 0 ? "text-muted-foreground" : "text-destructive"}`}>
                      {v.stock > 0 ? `${v.stock} in stock` : "Out of stock"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
            <div className="space-y-2">
              <Label htmlFor="qty">Quantity</Label>
              <Input
                id="qty"
                type="number"
                min={1}
                max={selected?.stock ?? undefined}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
            <div className="flex items-end">
              <Button className="w-full" onClick={handleAdd} disabled={!selected}>
                <ShoppingCart className="mr-2 h-4 w-4" /> Add to cart
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
