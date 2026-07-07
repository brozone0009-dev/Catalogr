import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/s/$shareCode")({
  head: () => ({ meta: [{ title: "Shared products — Catalogr" }] }),
  component: SharePublicPage,
});

function SharePublicPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const { shareCode } = Route.useParams();

  useEffect(() => {
    if (!shareCode) {
      setError("Invalid share link");
      setLoading(false);
      return;
    }
    const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
    const url = apiBase ? `${apiBase}/public/s/${shareCode}` : `/api/public/s/${shareCode}`;
    fetch(url)
      .then(async (res) => {
        if (res.status === 404) throw new Error("Not found");
        if (res.status === 410) throw new Error("Expired");
        if (!res.ok) throw new Error(await res.text());
        const body = await res.json();
        setLink(body.link);
        setProducts(body.products ?? []);
      })
      .catch((err) => setError((err && err.message) || String(err)))
      .finally(() => setLoading(false));
  }, [shareCode]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-sm text-destructive">{error}</div>;

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">{link?.label ?? "Shared products"}</h1>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {products.map((p) => (
          <Card key={p._id} className="overflow-hidden shadow-soft">
            <div className="aspect-video w-full overflow-hidden bg-muted">
              {p.image ? (
                <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  No image
                </div>
              )}
            </div>
            <CardContent className="p-5">
              <div className="font-semibold">{p.name}</div>
              <div className="text-sm text-muted-foreground mt-1">{p.description}</div>
              <div className="mt-3 text-sm">Price: ₹{p.price?.toFixed?.(2) ?? p.price}</div>
              <div className="mt-3 flex gap-2">
                <Button onClick={() => setSelectedProduct(p)}>
                  View
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">{selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4 pt-2">
              {selectedProduct.image && (
                <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
                  <img src={selectedProduct.image} alt={selectedProduct.name} className="h-full w-full object-cover" />
                </div>
              )}
              
              <div className="text-2xl font-bold text-primary">
                Price: ₹{selectedProduct.price?.toFixed?.(2) ?? selectedProduct.price}
              </div>

              {selectedProduct.description && (
                <p className="text-sm text-muted-foreground leading-relaxed bg-muted/40 p-3 rounded-lg border border-border/40">
                  {selectedProduct.description}
                </p>
              )}

              {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Available Variants</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {selectedProduct.variants.map((v: any) => {
                      const isOutOfStock = v.stock <= 0;
                      const label = [v.color, v.size].filter(Boolean).join(" / ") || "Default";
                      return (
                        <div
                          key={v._id}
                          className={`rounded-lg border border-border/60 bg-card p-3 flex flex-col text-left transition-all ${
                            isOutOfStock ? "opacity-50 bg-muted/30" : ""
                          }`}
                        >
                          <span className="font-medium text-sm text-foreground">{label}</span>
                          <span className={`mt-1 text-xs font-semibold ${isOutOfStock ? "text-destructive" : "text-emerald-600 dark:text-emerald-500"}`}>
                            {isOutOfStock ? "Out of stock" : `${v.stock} in stock`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
