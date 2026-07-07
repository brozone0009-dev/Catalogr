import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, X, ShoppingCart, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { OwnerShell } from "@/components/owner-shell";
import {
  listProducts, listCategories, listCompanies, upsertProduct, deleteProduct, uploadProductImage,
  type Product, type Variant,
} from "@/lib/api";

export const Route = createFileRoute("/_owner/products")({
  head: () => ({ meta: [{ title: "Products — Catalogr" }] }),
  component: ProductsPage,
});

function ProductsPage() {
  const qc = useQueryClient();
  const products = useQuery({ queryKey: ["products"], queryFn: listProducts });
  const categories = useQuery({ queryKey: ["categories"], queryFn: listCategories });
  const companies = useQuery({ queryKey: ["companies"], queryFn: listCompanies });

  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [detailsProduct, setDetailsProduct] = useState<Product | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const del = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => { toast.success("Product deleted"); qc.invalidateQueries({ queryKey: ["products"] }); },
  });

  return (
    <OwnerShell
      title="Products"
      action={
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> New product
        </Button>
      }
    >
      {products.data && products.data.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products.data.map((p) => (
            <Card key={p._id} className="overflow-hidden shadow-soft cursor-pointer" onClick={() => { setDetailsProduct(p); setDetailsOpen(true); }}>
              <div className="aspect-video w-full overflow-hidden bg-muted">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>
                )}
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
                  <span className="text-xs text-muted-foreground">{p.variants.length} variant{p.variants.length === 1 ? "" : "s"}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setEditing(p); setOpen(true); }}>
                    <Pencil className="mr-1 h-3 w-3" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.location.assign(`/make-orders?productId=${p._id}`)}>
                    <ShoppingCart className="mr-1 h-3 w-3" /> Make order
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => del.mutate(p._id)}>
                    <Trash2 className="mr-1 h-3 w-3" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center shadow-soft">
          <p className="text-muted-foreground">No products yet. Create your first product to get started.</p>
        </Card>
      )}

      <ProductDialog
        key={editing?._id ?? "new"}
        open={open}
        onOpenChange={setOpen}
        product={editing}
        categories={categories.data ?? []}
        companies={companies.data ?? []}
        onSaved={() => qc.invalidateQueries({ queryKey: ["products"] })}
      />
      <ProductDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        product={detailsProduct}
        categories={categories.data ?? []}
        companies={companies.data ?? []}
      />
    </OwnerShell>
  );
}

function ProductDetailsDialog({ open, onOpenChange, product, categories, companies }: {
  open: boolean; onOpenChange: (v: boolean) => void; product: Product | null;
  categories: { _id: string; name: string }[]; companies: { _id: string; name: string }[];
}) {
  if (!product) return null;
  const company = companies.find((c) => c._id === product.companyId);
  const category = categories.find((c) => c._id === product.categoryId);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>Product details</DialogTitle></DialogHeader>
        <div className="space-y-4 p-2">
          <div className="flex items-start gap-4">
            <div className="w-40 h-28 bg-muted overflow-hidden">
              {product.image ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" /> : <div className="p-4 text-xs text-muted-foreground">No image</div>}
            </div>
            <div>
              <div className="font-semibold text-lg">{product.name}</div>
              <div className="text-sm text-muted-foreground">{product.description}</div>
              <div className="mt-2 text-sm">Company: {company?.name ?? "—"}</div>
              <div className="text-sm">Category: {category?.name ?? "—"}</div>
              <div className="mt-2 text-sm font-semibold">Price: ₹{product.price.toFixed(2)}</div>
            </div>
          </div>
          <div>
            <div className="font-medium mb-2">Variants</div>
            <div className="grid gap-2">
              {product.variants.map((v) => (
                <div key={v._id} className="flex items-center justify-between rounded-md border p-3">
                  <div>{v.color} / {v.size}</div>
                  <div className="text-sm text-muted-foreground">Stock: {v.stock}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter><Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProductDialog({
  open, onOpenChange, product, categories, companies, onSaved,
}: {
  open: boolean; onOpenChange: (v: boolean) => void; product: Product | null;
  categories: { _id: string; name: string }[]; companies: { _id: string; name: string }[];
  onSaved: () => void;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(String(product?.price ?? ""));
  const [image, setImage] = useState(product?.image ?? "");
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<Product["status"]>(product?.status ?? "active");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [companyId, setCompanyId] = useState(product?.companyId ?? "");
  const [variants, setVariants] = useState<Variant[]>(
    product?.variants ?? [{ _id: Math.random().toString(36).slice(2), color: "", size: "", stock: 0 }],
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryId || !companyId) { toast.error("Pick a category and company"); return; }
    try {
      await upsertProduct({
        _id: product?._id,
        name, description, image, status, categoryId, companyId,
        price: Number(price) || 0,
        variants: variants.filter((v) => v.color || v.size),
      });
      toast.success(product ? "Product updated" : "Product created");
      onSaved(); onOpenChange(false);
    } catch (err) { toast.error((err as Error).message); }
  }

  async function handleImageUpload(file: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const next = await uploadProductImage(file);
      setImage(next);
      toast.success("Image selected");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{product ? "Edit product" : "New product"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Price (INR)</Label>
              <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Product["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Company</Label>
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {companies.length === 0 && <div className="p-2 text-xs text-muted-foreground">Add a company first</div>}
                  {companies.map((c) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {categories.length === 0 && <div className="p-2 text-xs text-muted-foreground">Add a category first</div>}
                  {categories.map((c) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Image</Label>
              <div className="flex items-center gap-2">
                <Input value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://…" />
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
                  <Upload className="h-4 w-4" />
                  {uploading ? "Uploading…" : "Upload"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Variants (color, size, stock)</Label>
              <Button type="button" variant="ghost" size="sm"
                onClick={() => setVariants((vs) => [...vs, { _id: Math.random().toString(36).slice(2), color: "", size: "", stock: 0 }])}>
                <Plus className="mr-1 h-3 w-3" /> Add variant
              </Button>
            </div>
            <div className="space-y-2">
              {variants.map((v, i) => (
                <div key={v._id} className="grid grid-cols-[1fr_1fr_100px_auto] gap-2">
                  <Input placeholder="Color" value={v.color} onChange={(e) => setVariants((vs) => vs.map((x, j) => j === i ? { ...x, color: e.target.value } : x))} />
                  <Input placeholder="Size" value={v.size} onChange={(e) => setVariants((vs) => vs.map((x, j) => j === i ? { ...x, size: e.target.value } : x))} />
                  <Input type="text" inputMode="numeric" placeholder="Stock" value={String(v.stock)} onChange={(e) => {
                    const val = Number(e.target.value.replace(/[^0-9]/g, '')) || 0;
                    setVariants((vs) => vs.map((x, j) => j === i ? { ...x, stock: val } : x));
                  }} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => setVariants((vs) => vs.filter((_, j) => j !== i))}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{product ? "Save changes" : "Create product"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
