import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { OwnerShell } from "@/components/owner-shell";
import { listCustomers } from "@/lib/api";

export const Route = createFileRoute("/_owner/customers")({
  head: () => ({ meta: [{ title: "Customers — Catalogr" }] }),
  component: CustomersPage,
});

function CustomersPage() {
  const q = useQuery({ queryKey: ["customers"], queryFn: listCustomers });

  return (
    <OwnerShell title="Customers">
      {q.data && q.data.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {q.data.map((customer) => (
            <Card key={customer._id} className="shadow-soft">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{customer.name}</h3>
                    <p className="text-xs text-muted-foreground">{customer.phone || "No phone"}</p>
                  </div>
                  <Badge variant="secondary">Customer</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md border border-border p-3">
                    <div className="text-xs text-muted-foreground">Total credit</div>
                    <div className="font-semibold text-black">₹{customer.totalCredit.toFixed(2)}</div>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <div className="text-xs text-muted-foreground">Total debit</div>
                    <div className="font-semibold text-black">₹{customer.totalDebit.toFixed(2)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center shadow-soft">
          <p className="text-muted-foreground">No customers yet. Orders will add customers automatically.</p>
        </Card>
      )}
    </OwnerShell>
  );
}