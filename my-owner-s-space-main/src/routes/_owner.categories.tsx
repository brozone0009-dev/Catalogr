import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Tags } from "lucide-react";
import { toast } from "sonner";
import { OwnerShell } from "@/components/owner-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { listCategories, createCategory, deleteCategory } from "@/lib/api";

export const Route = createFileRoute("/_owner/categories")({
  head: () => ({ meta: [{ title: "Categories — Catalogr" }] }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["categories"], queryFn: listCategories });
  const [name, setName] = useState("");
  const create = useMutation({
    mutationFn: (n: string) => createCategory(n),
    onSuccess: () => { toast.success("Category added"); setName(""); qc.invalidateQueries({ queryKey: ["categories"] }); },
  });
  const del = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["categories"] }); },
  });

  return (
    <OwnerShell title="Categories">
      <Card className="mb-6 shadow-soft">
        <CardContent className="flex gap-2 p-5">
          <Input placeholder="e.g. Denim, Footwear" value={name} onChange={(e) => setName(e.target.value)} />
          <Button onClick={() => name.trim() && create.mutate(name.trim())}>
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </CardContent>
      </Card>

      {q.data && q.data.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {q.data.slice().sort((a, b) => a.name.localeCompare(b.name)).map((c) => (
            <Card key={c._id} className="shadow-soft">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary"><Tags className="h-4 w-4" /></div>
                  <span className="font-medium">{c.name}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => del.mutate(c._id)}><Trash2 className="h-4 w-4" /></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center shadow-soft"><p className="text-muted-foreground">No categories yet.</p></Card>
      )}
    </OwnerShell>
  );
}
