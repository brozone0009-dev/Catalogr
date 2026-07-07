import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search as SearchIcon, Share2, Copy } from "lucide-react";
import { toast } from "sonner";
import { OwnerShell } from "@/components/owner-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listProducts, listCategories, listCompanies, createShareLink } from "@/lib/api";

export const Route = createFileRoute("/_owner/search")({
  head: () => ({ meta: [{ title: "Search — Catalogr" }] }),
  component: SearchPage,
});

function SearchPage() {
  const qc = useQueryClient();
  const products = useQuery({ queryKey: ["products"], queryFn: listProducts });
  const categories = useQuery({ queryKey: ["categories"], queryFn: listCategories });
  const companies = useQuery({ queryKey: ["companies"], queryFn: listCompanies });

  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [companyId, setCompanyId] = useState("all");
  const [status, setStatus] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);

  const filtered = useMemo(() => {
    const all = products.data ?? [];
    return all.filter((p) => {
      if (q && !`${p.name} ${p.description}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (categoryId !== "all" && p.categoryId !== categoryId) return false;
      if (companyId !== "all" && p.companyId !== companyId) return false;
      if (status !== "all" && p.status !== status) return false;
      if (minPrice && p.price < Number(minPrice)) return false;
      if (maxPrice && p.price > Number(maxPrice)) return false;
      if (inStockOnly && !p.variants.some((v) => v.stock > 0)) return false;
      return true;
    });
  }, [products.data, q, categoryId, companyId, status, minPrice, maxPrice, inStockOnly]);

  const share = useMutation({
    mutationFn: createShareLink,
    onSuccess: (link) => {
      const url = `${window.location.origin}/s/${link.shareCode}`;
      navigator.clipboard.writeText(url).catch(() => {});
      toast.success("Share link created and copied to clipboard");
      qc.invalidateQueries({ queryKey: ["share-links"] });
    },
  });

  function shareResults() {
    if (filtered.length === 0) { toast.error("No results to share"); return; }
    share.mutate({
      shareType: "search",
      productIds: filtered.map((p) => p._id),
      label: q ? `Search: ${q}` : `Filtered results (${filtered.length})`,
      expiresInDays: 7,
    });
  }

  return (
    <OwnerShell
      title="Search & filter"
      action={
        <Button onClick={shareResults} disabled={share.isPending}>
          <Share2 className="mr-2 h-4 w-4" /> Share results
        </Button>
      }
    >
      <Card className="mb-6 shadow-soft">
        <CardContent className="grid gap-4 p-5 lg:grid-cols-4">
          <div className="lg:col-span-4">
            <Label>Search</Label>
            <div className="relative mt-1.5">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search by name or description…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>

          <FilterSelect label="Category" value={categoryId} onChange={setCategoryId}
            options={[{ value: "all", label: "All categories" }, ...(categories.data ?? []).map((c) => ({ value: c._id, label: c.name }))]} />
          <FilterSelect label="Company" value={companyId} onChange={setCompanyId}
            options={[{ value: "all", label: "All companies" }, ...(companies.data ?? []).map((c) => ({ value: c._id, label: c.name }))]} />
          <FilterSelect label="Status" value={status} onChange={setStatus}
            options={[{ value: "all", label: "Any" }, { value: "active", label: "Active" }, { value: "draft", label: "Draft" }, { value: "archived", label: "Archived" }]} />

          <div className="grid grid-cols-2 gap-2">
            <div><Label>Min $</Label><Input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} /></div>
            <div><Label>Max $</Label><Input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} /></div>
          </div>

          <label className="col-span-full flex items-center gap-2 text-sm">
            <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} />
            In-stock variants only
          </label>
        </CardContent>
      </Card>

      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filtered.length} result{filtered.length === 1 ? "" : "s"}
        </p>
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <Card key={p._id} className="overflow-hidden shadow-soft">
              <div className="aspect-video w-full overflow-hidden bg-muted">
                {p.image ? <img src={p.image} alt={p.name} className="h-full w-full object-cover" /> :
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>}
              </div>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{p.name}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                  </div>
                  <Badge variant="secondary" className="capitalize">{p.status}</Badge>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-display text-lg font-semibold">₹{p.price.toFixed(2)}</span>
                  <span className="text-xs text-muted-foreground">
                    {p.variants.reduce((s, v) => s + v.stock, 0)} in stock
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center shadow-soft"><p className="text-muted-foreground">No products match these filters.</p></Card>
      )}
    </OwnerShell>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
        <SelectContent>{options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}
