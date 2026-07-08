import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Package, ShoppingCart, Tags, Building2, AlertTriangle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OwnerShell } from "@/components/owner-shell";
import { listProducts, listOrders, listCategories, listCompanies, seedDemoOrder } from "@/lib/api";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

export const Route = createFileRoute("/_owner/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Catalogr" }] }),
  component: Dashboard,
});

function Dashboard() {
  const isMobile = useIsMobile();
  const products = useQuery({ queryKey: ["products"], queryFn: listProducts });
  const orders = useQuery({ queryKey: ["orders"], queryFn: listOrders });
  const categories = useQuery({ queryKey: ["categories"], queryFn: listCategories });
  const companies = useQuery({ queryKey: ["companies"], queryFn: listCompanies });

  const pendingOrders = orders.data?.filter((o) => o.status === "pending") ?? [];
  const revenue = orders.data?.filter((o) => o.status === "accepted").reduce((s, o) => s + o.totalAmount, 0) ?? 0;
  const lowStock = (products.data ?? []).flatMap((p) => p.variants.filter((v) => v.stock < 5).map((v) => ({ p, v })));

  const stats = [
    { label: "Products", value: products.data?.length ?? 0, icon: Package, to: "/products" },
    { label: "Pending orders", value: pendingOrders.length, icon: ShoppingCart, to: "/orders" },
    { label: "Categories", value: categories.data?.length ?? 0, icon: Tags, to: "/categories" },
    { label: "Companies", value: companies.data?.length ?? 0, icon: Building2, to: "/companies" },
  ] as const;

  return (
    <OwnerShell
      title="Dashboard"
      action={
        !isMobile && (
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await seedDemoOrder();
                toast.success("Demo order created");
                orders.refetch();
              } catch (e) {
                toast.error((e as Error).message);
              }
            }}
          >
            Simulate incoming order
          </Button>
        )
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} to={s.to} className="group">
              <Card className="shadow-soft transition-shadow hover:shadow-lift">
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</div>
                    <div className="mt-1 font-display text-3xl font-semibold">{s.value}</div>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent orders</CardTitle>
            <Link to="/orders" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {orders.data && orders.data.length > 0 ? (
              <ul className="divide-y divide-border">
                {orders.data.slice(0, 6).map((o) => (
                  <li key={o._id} className="flex items-center justify-between py-3">
                    <div>
                      <div className="font-medium">{o.salesmanName}</div>
                      <div className="text-xs text-muted-foreground">
                        {o.items.length} item{o.items.length === 1 ? "" : "s"} · {new Date(o.orderDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium">₹{o.totalAmount.toFixed(2)}</div>
                      <StatusBadge status={o.status} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyHint text="No orders yet. Use 'Simulate incoming order' to test the flow." />
            )}
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" /> Low stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStock.length > 0 ? (
              <ul className="space-y-2">
                {lowStock.slice(0, 8).map(({ p, v }) => (
                  <li key={v._id} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
                    <span className="truncate">
                      {p.name} · {v.color}/{v.size}
                    </span>
                    <span className="font-medium text-warning-foreground">{v.stock} left</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyHint text="All stock levels healthy." />
            )}
            <div className="mt-4 rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
              Accepted orders: <span className="font-medium text-foreground">₹{revenue.toFixed(2)}</span> total
            </div>
          </CardContent>
        </Card>
      </div>
    </OwnerShell>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function StatusBadge({ status }: { status: "pending" | "accepted" | "rejected" }) {
  const map = {
    pending: "bg-warning/15 text-warning-foreground",
    accepted: "bg-success/15 text-success-foreground",
    rejected: "bg-destructive/15 text-destructive-foreground",
  } as const;
  return <Badge className={`${map[status]} border-0 capitalize`}>{status}</Badge>;
}
