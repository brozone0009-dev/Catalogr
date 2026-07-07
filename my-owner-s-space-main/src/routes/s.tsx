import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/s/:shareCode")({
  head: () => ({ meta: [{ title: "Shared products — Catalogr" }] }),
  component: SharePublicPage,
});

function SharePublicPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const path = typeof window !== "undefined" ? window.location.pathname : "";
    const code = path.split("/s/")[1] ?? "";
    if (!code) { setError("Invalid share link"); setLoading(false); return; }
    const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
    const url = apiBase ? `${apiBase}/public/s/${code}` : `/api/public/s/${code}`;
    fetch(url).then(async (res) => {
      if (res.status === 404) throw new Error("Not found");
      if (res.status === 410) throw new Error("Expired");
      if (!res.ok) throw new Error(await res.text());
      const body = await res.json();
      setLink(body.link);
      setProducts(body.products ?? []);
    }).catch((err) => setError((err && err.message) || String(err))).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-sm text-destructive">{error}</div>;

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">{link?.label ?? "Shared products"}</h1>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {products.map((p) => (
          <Card key={p._id} className="overflow-hidden shadow-soft">
            <div className="aspect-video w-full overflow-hidden bg-muted">{p.image ? <img src={p.image} alt={p.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>}</div>
            <CardContent className="p-5">
              <div className="font-semibold">{p.name}</div>
              <div className="text-sm text-muted-foreground mt-1">{p.description}</div>
              <div className="mt-3 text-sm">Price: ${p.price?.toFixed?.(2) ?? p.price}</div>
              <div className="mt-3 flex gap-2">
                <Button asChild><a href={`/products/${p._id}`}>View</a></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
