import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, X, Filter } from "lucide-react";
import { toast } from "sonner";
import { OwnerShell } from "@/components/owner-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listOrders, updateOrderStatus, type Order } from "@/lib/api";

export const Route = createFileRoute("/_owner/orders")({
  head: () => ({ meta: [{ title: "Orders — Catalogr" }] }),
  component: OrdersPage,
});

function OrdersPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["orders"], queryFn: listOrders });
  const [filter, setFilter] = useState<"all" | Order["status"]>("all");

  const mut = useMutation({
    mutationFn: (v: { id: string; status: Order["status"] }) => updateOrderStatus(v.id, v.status),
    onSuccess: (_, v) => {
      toast.success(v.status === "accepted" ? "Order accepted — stock updated" : "Order rejected");
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const orders = (q.data ?? []).filter((o) => filter === "all" || o.status === filter);

  return (
    <OwnerShell
      title="Orders"
      action={
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all"><Filter className="mr-1 h-3 w-3" />All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="accepted">Accepted</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>
      }
    >
      {orders.length > 0 ? (
        <div className="space-y-3">
          {orders.map((o) => (
            <Card key={o._id} className="shadow-soft">
              <CardContent className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{o.salesmanName}</span>
                      <StatusBadge status={o.status} />
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      #{o._id.slice(-6).toUpperCase()} · {new Date(o.orderDate).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-xl font-semibold">₹{o.totalAmount.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">{o.items.length} item{o.items.length === 1 ? "" : "s"}</div>
                  </div>
                </div>
                <ul className="mt-4 divide-y divide-border rounded-md border border-border">
                  {o.items.map((it, i) => (
                    <li key={i} className="flex items-center justify-between px-4 py-2 text-sm">
                      <span>{it.productName} <span className="text-muted-foreground">· {it.variantLabel}</span></span>
                      <span className="text-muted-foreground">{it.quantity} × ₹{it.price.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
                {o.status === "pending" && (
                  <div className="mt-4 flex gap-2">
                    <Button onClick={() => mut.mutate({ id: o._id, status: "accepted" })} className="bg-success text-success-foreground hover:bg-success/90">
                      <Check className="mr-1 h-4 w-4" /> Accept
                    </Button>
                    <Button variant="outline" onClick={() => mut.mutate({ id: o._id, status: "rejected" })}>
                      <X className="mr-1 h-4 w-4" /> Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center shadow-soft"><p className="text-muted-foreground">No orders in this view.</p></Card>
      )}
    </OwnerShell>
  );
}

function StatusBadge({ status }: { status: Order["status"] }) {
  const map = {
    pending: "bg-warning/15 text-warning-foreground",
    accepted: "bg-success/15 text-success-foreground",
    rejected: "bg-destructive/15 text-destructive-foreground",
  } as const;
  return <Badge className={`${map[status]} border-0 capitalize`}>{status}</Badge>;
}
