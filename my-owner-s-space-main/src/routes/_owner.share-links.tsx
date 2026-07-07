import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Copy, Plus, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { OwnerShell } from "@/components/owner-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { listShareLinks, createShareLink, deleteShareLink, listProducts, type ShareLink } from "@/lib/api";

export const Route = createFileRoute("/_owner/share-links")({
  head: () => ({ meta: [{ title: "Share Links — Catalogr" }] }),
  component: ShareLinksPage,
});

function ShareLinksPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["share-links"], queryFn: listShareLinks });
  const products = useQuery({ queryKey: ["products"], queryFn: listProducts });
  const [open, setOpen] = useState(false);

  const create = useMutation({
    mutationFn: createShareLink,
    onSuccess: () => { toast.success("Share link created"); setOpen(false); qc.invalidateQueries({ queryKey: ["share-links"] }); },
  });
  const del = useMutation({
    mutationFn: deleteShareLink,
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["share-links"] }); },
  });

  return (
    <OwnerShell
      title="Share Links"
      action={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> New link</Button></DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Create share link</DialogTitle></DialogHeader>
            <CreateForm products={products.data ?? []} onSubmit={(v) => create.mutate(v)} />
          </DialogContent>
        </Dialog>
      }
    >
      <p className="mb-4 text-sm text-muted-foreground">
        Generate a temporary link to share products, a category, a company, or a custom list.
        Send it to buyers via WhatsApp, email, or SMS.
      </p>

      {q.data && q.data.length > 0 ? (
        <div className="space-y-3">
          {q.data.map((l) => {
            const url = `${typeof window !== "undefined" ? window.location.origin : ""}/s/${l.shareCode}`;
            const expired = new Date(l.expiresAt) < new Date();
            return (
              <Card key={l._id} className="shadow-soft">
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <Share2 className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{l.label}</span>
                      <Badge variant="secondary" className="capitalize">{l.shareType}</Badge>
                      {expired && <Badge className="border-0 bg-destructive/15 text-destructive-foreground">Expired</Badge>}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {l.productIds.length} product{l.productIds.length === 1 ? "" : "s"} · Expires {new Date(l.expiresAt).toLocaleDateString()}
                    </div>
                    <code className="mt-2 inline-block rounded bg-muted px-2 py-1 text-xs">{url}</code>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(url); toast.success("Link copied"); }}>
                      <Copy className="mr-1 h-3 w-3" /> Copy
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => del.mutate(l._id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center shadow-soft"><p className="text-muted-foreground">No share links yet.</p></Card>
      )}
    </OwnerShell>
  );
}

function CreateForm({ products, onSubmit }: { products: { _id: string; name: string }[]; onSubmit: (v: Parameters<typeof createShareLink>[0]) => void }) {
  const [label, setLabel] = useState("");
  const [shareType, setShareType] = useState<ShareLink["shareType"]>("custom");
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [selected, setSelected] = useState<string[]>([]);

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ label, shareType, expiresInDays, productIds: selected }); }} className="space-y-4">
      <div className="space-y-1.5"><Label>Label</Label><Input value={label} onChange={(e) => setLabel(e.target.value)} required /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={shareType} onValueChange={(v) => setShareType(v as ShareLink["shareType"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">Custom list</SelectItem>
              <SelectItem value="product">Single product</SelectItem>
              <SelectItem value="category">Category</SelectItem>
              <SelectItem value="company">Company</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Expires in (days)</Label>
          <Input type="number" min={1} value={expiresInDays} onChange={(e) => setExpiresInDays(Number(e.target.value) || 1)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Products</Label>
        <div className="max-h-48 overflow-y-auto rounded-md border border-border p-2">
          {products.length === 0 ? (
            <p className="p-2 text-sm text-muted-foreground">No products available.</p>
          ) : products.map((p) => (
            <label key={p._id} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted">
              <input
                type="checkbox"
                checked={selected.includes(p._id)}
                onChange={(e) => setSelected((s) => e.target.checked ? [...s, p._id] : s.filter((x) => x !== p._id))}
              />
              {p.name}
            </label>
          ))}
        </div>
      </div>
      <DialogFooter><Button type="submit">Create link</Button></DialogFooter>
    </form>
  );
}
