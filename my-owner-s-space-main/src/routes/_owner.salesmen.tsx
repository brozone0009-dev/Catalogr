import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Eye, EyeOff, MoreVertical, Plus, Search, ShieldAlert, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { OwnerShell } from "@/components/owner-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSalesman, deleteSalesman, listSalesmen, updateSalesman } from "@/lib/salesmenApi";

type SalesmanRow = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  status: "active" | "disabled";
  createdAt?: string;
};

type SalesmanForm = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

const emptyForm = (): SalesmanForm => ({ name: "", email: "", phone: "", password: "" });

export const Route = createFileRoute("/_owner/salesmen")({
  head: () => ({ meta: [{ title: "Salesmen — Catalogr" }] }),
  component: SalesmenPage,
});

function SalesmenPage() {
  const queryClient = useQueryClient();
  const salesmenQuery = useQuery({ queryKey: ["salesmen"], queryFn: listSalesmen });
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [current, setCurrent] = useState<SalesmanRow | null>(null);
  const [createForm, setCreateForm] = useState<SalesmanForm>(emptyForm());
  const [editForm, setEditForm] = useState<SalesmanForm>(emptyForm());

  const rows = useMemo(() => {
    const list = (salesmenQuery.data ?? []) as SalesmanRow[];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((row) => [row.name, row.email, row.phone ?? "", row.status].some((value) => value.toLowerCase().includes(q)));
  }, [salesmenQuery.data, search]);

  const createMutation = useMutation({
    mutationFn: createSalesman,
    onSuccess: async () => {
      toast.success("Salesman created");
      setCreateForm(emptyForm());
      setCreateOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["salesmen"] });
    },
    onError: (error) => toast.error((error as Error).message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => updateSalesman(id, payload),
    onSuccess: async () => {
      toast.success("Salesman updated");
      setEditOpen(false);
      setCurrent(null);
      await queryClient.invalidateQueries({ queryKey: ["salesmen"] });
    },
    onError: (error) => toast.error((error as Error).message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSalesman,
    onSuccess: async () => {
      toast.success("Salesman deleted");
      await queryClient.invalidateQueries({ queryKey: ["salesmen"] });
    },
    onError: (error) => toast.error((error as Error).message),
  });

  const activeCount = (salesmenQuery.data ?? []).filter((row: SalesmanRow) => row.status === "active").length;
  const disabledCount = (salesmenQuery.data ?? []).filter((row: SalesmanRow) => row.status === "disabled").length;

  function openEdit(row: SalesmanRow) {
    setCurrent(row);
    setEditForm({ name: row.name, email: row.email, phone: row.phone ?? "", password: "" });
    setEditOpen(true);
  }

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    createMutation.mutate({
      name: createForm.name.trim(),
      email: createForm.email.trim(),
      phone: createForm.phone.trim() || undefined,
      password: createForm.password,
    });
  }

  function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!current) return;
    updateMutation.mutate({
      id: current._id,
      payload: {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim() || undefined,
        ...(editForm.password ? { password: editForm.password } : {}),
      },
    });
  }

  return (
    <OwnerShell
      title="Salesmen"
      action={
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add salesman
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total salesmen" value={String((salesmenQuery.data ?? []).length)} description="Accounts linked to your owner profile" />
        <StatCard label="Active" value={String(activeCount)} description="Can log in and create orders" />
        <StatCard label="Disabled" value={String(disabledCount)} description="Temporarily blocked from access" />
      </div>

      <Card className="mt-6 shadow-soft">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Salesman management</CardTitle>
              <CardDescription>Add, update, disable, or delete salesman accounts.</CardDescription>
            </div>
            <div className="relative w-full md:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search salesmen" className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {salesmenQuery.isLoading ? (
            <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Loading salesmen...</div>
          ) : salesmenQuery.isError ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">{(salesmenQuery.error as Error)?.message || "Failed to load salesmen"}</div>
          ) : rows.length === 0 ? (
            <EmptyState hasSearch={Boolean(search.trim())} onCreate={() => setCreateOpen(true)} />
          ) : (
            <div className="overflow-hidden rounded-xl border">
              <div className="hidden grid-cols-[1.4fr_1.6fr_1fr_0.8fr_0.7fr] gap-4 border-b bg-muted/40 px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid">
                <div>Name</div>
                <div>Email</div>
                <div>Phone</div>
                <div>Status</div>
                <div className="text-right">Actions</div>
              </div>
              <div className="divide-y">
                {rows.map((row) => (
                  <div key={row._id} className="grid gap-3 px-4 py-4 md:grid-cols-[1.4fr_1.6fr_1fr_0.8fr_0.7fr] md:items-center">
                    <div>
                      <div className="font-medium">{row.name}</div>
                      <div className="text-xs text-muted-foreground">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : ""}</div>
                    </div>
                    <div className="break-all text-sm text-muted-foreground">{row.email}</div>
                    <div className="text-sm text-muted-foreground">{row.phone || "—"}</div>
                    <div><StatusBadge status={row.status} /></div>
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Open actions"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(row)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateMutation.mutate({ id: row._id, payload: { status: row.status === "active" ? "disabled" : "active" } })}>
                            {row.status === "active" ? <><EyeOff className="mr-2 h-4 w-4" /> Disable</> : <><Eye className="mr-2 h-4 w-4" /> Enable</>}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => { if (!confirm(`Delete salesman ${row.name}?`)) return; deleteMutation.mutate(row._id); }}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Add salesman</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={handleCreate}>
            <Field label="Name" value={createForm.name} onChange={(value) => setCreateForm((prev) => ({ ...prev, name: value }))} required />
            <Field label="Email" type="email" value={createForm.email} onChange={(value) => setCreateForm((prev) => ({ ...prev, email: value }))} required />
            <Field label="Phone" value={createForm.phone} onChange={(value) => setCreateForm((prev) => ({ ...prev, phone: value }))} />
            <Field label="Password" type="password" value={createForm.password} onChange={(value) => setCreateForm((prev) => ({ ...prev, password: value }))} required minLength={6} />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? "Creating..." : "Create salesman"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Edit salesman</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={handleEdit}>
            <Field label="Name" value={editForm.name} onChange={(value) => setEditForm((prev) => ({ ...prev, name: value }))} required />
            <Field label="Email" type="email" value={editForm.email} onChange={(value) => setEditForm((prev) => ({ ...prev, email: value }))} required />
            <Field label="Phone" value={editForm.phone} onChange={(value) => setEditForm((prev) => ({ ...prev, phone: value }))} />
            <Field label="New password" type="password" value={editForm.password} onChange={(value) => setEditForm((prev) => ({ ...prev, password: value }))} placeholder="Leave blank to keep current password" />
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-900">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              Disabling a salesman prevents login immediately.
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>{updateMutation.isPending ? "Saving..." : "Save changes"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </OwnerShell>
  );
}

function StatCard({ label, value, description }: { label: string; value: string; description: string }) {
  return (
    <Card className="shadow-soft">
      <CardContent className="p-6">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-2 font-display text-3xl font-semibold">{value}</div>
        <div className="mt-1 text-sm text-muted-foreground">{description}</div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: "active" | "disabled" }) {
  return (
    <Badge className={status === "active" ? "border-0 bg-success/15 text-success-foreground" : "border-0 bg-muted text-muted-foreground"}>
      {status === "active" ? <><ShieldCheck className="mr-1 h-3 w-3" /> Active</> : <><ShieldAlert className="mr-1 h-3 w-3" /> Disabled</>}
    </Badge>
  );
}

function EmptyState({ hasSearch, onCreate }: { hasSearch: boolean; onCreate: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-10 text-center">
      <h3 className="font-semibold">{hasSearch ? "No matching salesmen" : "No salesmen yet"}</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {hasSearch ? "Try a different search term." : "Create the first salesman account for your team."}
      </p>
      <Button className="mt-5" onClick={onCreate}><Plus className="mr-2 h-4 w-4" /> Add salesman</Button>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required, minLength, placeholder }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} type={type} required={required} minLength={minLength} placeholder={placeholder} />
    </div>
  );
}