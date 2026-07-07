import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ClipboardList } from "lucide-react";
import { listMyOrders, type Order } from "@/lib/api";

export const Route = createFileRoute("/_salesman/orders")({
  head: () => ({ meta: [{ title: "My orders — Catalogr Sales" }] }),
  component: OrdersPage,
});

const STATUS_STYLE: Record<Order["status"], string> = {
  pending: "bg-warning/15 text-warning-foreground border-warning/30",
  accepted: "bg-success/15 text-success border-success/30",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
};

function OrdersPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["my-orders"],
    queryFn: listMyOrders,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">My orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">Every order you've submitted.</p>
      </div>

      {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {isError && <div className="text-sm text-destructive">{(error as Error).message}</div>}

      {!isLoading && (data?.length ?? 0) === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <ClipboardList className="h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">You haven't placed any orders yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {(data ?? []).map((o) => (
          <div key={o._id} className="rounded-xl border border-border bg-card p-4 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-medium">{o.customerName}</div>
                {o.customerPhone && <div className="text-xs text-muted-foreground">{o.customerPhone}</div>}
                <div className="mt-1 text-xs text-muted-foreground">
                  {format(new Date(o.createdAt || o.orderDate), "PPp")}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[o.status]}`}>
                  {o.status}
                </span>
                <div className="font-display text-lg font-semibold">₹{o.totalAmount}</div>
              </div>
            </div>
            <div className="mt-3 divide-y divide-border/70 border-t border-border/70 text-sm">
              {o.items.map((it, idx) => (
                <div key={idx} className="flex items-center justify-between py-2">
                  <div>
                    <div>{it.productName}</div>
                    <div className="text-xs text-muted-foreground">{it.variantLabel} · qty {it.quantity}</div>
                  </div>
                  <div className="text-muted-foreground">₹{it.price * it.quantity}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
