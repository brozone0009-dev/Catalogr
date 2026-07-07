import { createFileRoute, Outlet, Navigate, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Briefcase, LogOut, Package, ClipboardList, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";

export const Route = createFileRoute("/_salesman")({
  component: SalesmanLayout,
});

function SalesmanLayout() {
  const { salesman, loading, signOut } = useAuth();
  const { count } = useCart();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  if (loading) return null;
  if (!salesman) return <Navigate to="/auth" />;

  const links = [
    { to: "/browse", label: "Browse", icon: Package },
    { to: "/orders", label: "My orders", icon: ClipboardList },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/browse" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Briefcase className="h-4 w-4" />
            </div>
            <span className="font-display text-lg font-semibold">Catalogr Sales</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => {
              const active = pathname.startsWith(l.to);
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  }`}
                >
                  <l.icon className="h-4 w-4" />
                  {l.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/cart"
              className="relative inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium hover:bg-secondary/60"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Cart</span>
              {count > 0 && (
                <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-semibold text-accent-foreground">
                  {count}
                </span>
              )}
            </Link>
            <div className="hidden text-right text-xs leading-tight sm:block">
              <div className="font-medium">{salesman.name}</div>
              <div className="text-muted-foreground">{salesman.email}</div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { signOut(); navigate({ to: "/auth" }); }}
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <nav className="mx-auto flex max-w-6xl gap-1 border-t border-border/60 px-4 py-2 md:hidden">
          {links.map((l) => {
            const active = pathname.startsWith(l.to);
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`inline-flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium ${
                  active ? "bg-secondary text-secondary-foreground" : "text-muted-foreground"
                }`}
              >
                <l.icon className="h-4 w-4" /> {l.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
