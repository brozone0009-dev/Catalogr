import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listProducts, listCategories, listCompanies } from "@/lib/api";

export const Route = createFileRoute("/_salesman/browse")({
  head: () => ({ meta: [{ title: "Browse catalog — Catalogr Sales" }] }),
  component: BrowsePage,
});

function BrowsePage() {
  const products = useQuery({ queryKey: ["products"], queryFn: listProducts });
  const categories = useQuery({ queryKey: ["categories"], queryFn: listCategories });
  const companies = useQuery({ queryKey: ["companies"], queryFn: listCompanies });

  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [companyId, setCompanyId] = useState("all");

  const filtered = useMemo(() => {
    const list = products.data ?? [];
    const term = q.trim().toLowerCase();
    return list.filter((p) => {
      if (p.status !== "active") return false;
      if (categoryId !== "all" && p.categoryId !== categoryId) return false;
      if (companyId !== "all" && p.companyId !== companyId) return false;
      if (term && !p.name.toLowerCase().includes(term) && !p.description?.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [products.data, q, categoryId, companyId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">Catalog</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live inventory from your owner. Tap a product to build an order.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {products.isLoading ? "Loading…" : `${filtered.length} of ${products.data?.length ?? 0} products`}
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-card p-3 shadow-soft sm:grid-cols-[1fr_180px_180px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className="pl-9" />
        </div>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {(categories.data ?? []).map((c) => (
              <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={companyId} onValueChange={setCompanyId}>
          <SelectTrigger><SelectValue placeholder="Company" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All companies</SelectItem>
            {(companies.data ?? []).map((c) => (
              <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {products.isError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Couldn't load products: {(products.error as Error).message}
        </div>
      )}

      {!products.isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <Package className="h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No products match your filters.</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => {
          const inStock = p.variants.reduce((s, v) => s + (v.stock || 0), 0);
          return (
            <Link
              key={p._id}
              to="/product/$id"
              params={{ id: p._id }}
              className="group overflow-hidden rounded-xl border border-border bg-card shadow-soft transition hover:shadow-lift"
            >
              <div className="aspect-square overflow-hidden bg-muted">
                {p.image ? (
                  <img
                    src={p.image}
                    alt={p.name}
                    className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <Package className="h-10 w-10" />
                  </div>
                )}
              </div>
              <div className="space-y-1 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-medium leading-tight">{p.name}</h3>
                  <div className="whitespace-nowrap font-display font-semibold">₹{p.price}</div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{p.variants.length} variant{p.variants.length === 1 ? "" : "s"}</span>
                  <span className={inStock > 0 ? "text-success" : "text-destructive"}>
                    {inStock > 0 ? `${inStock} in stock` : "Out of stock"}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
