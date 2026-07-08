import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Package,
  Tags,
  Building2,
  ShoppingCart,
  Users,
  UsersRound,
  ClipboardPlus,
  Share2,
  Search,
  LogOut,
  Store,
  Menu,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/products", label: "Products", icon: Package },
  { to: "/make-orders", label: "Make Orders", icon: ClipboardPlus },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/salesmen", label: "Salesmen", icon: UsersRound },
  { to: "/categories", label: "Categories", icon: Tags },
  { to: "/companies", label: "Companies", icon: Building2 },
  { to: "/orders", label: "Orders", icon: ShoppingCart },
  { to: "/search", label: "Search", icon: Search },
  { to: "/share-links", label: "Share Links", icon: Share2 },
] as const;

export function OwnerShell({ children, title, action }: { children: ReactNode; title: string; action?: ReactNode }) {
  const { owner, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const NavContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Store className="h-5 w-5" />
        </div>
        <div>
          <div className="font-display text-lg font-semibold text-white">Catalogr</div>
          <div className="text-xs text-sidebar-foreground/60">Owner console</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((n) => {
          const active = pathname === n.to || pathname.startsWith(n.to + "/");
          const Icon = n.icon;
          return (
            <Link
              key={n.to}
              to={n.to}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-4">
        <div className="mb-3">
          <div className="text-sm font-medium text-white">{owner?.name}</div>
          <div className="truncate text-xs text-sidebar-foreground/60">{owner?.email}</div>
        </div>
        <button
          onClick={() => {
            signOut();
            navigate({ to: "/auth" });
          }}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-white"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <NavContent />
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/80 px-6 py-4 backdrop-blur">
          <div className="flex items-center gap-4">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 bg-sidebar p-0 text-sidebar-foreground border-none">
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation Menu</SheetTitle>
                </SheetHeader>
                <NavContent />
              </SheetContent>
            </Sheet>
            <h1 className="font-display text-2xl font-semibold">{title}</h1>
          </div>
          {action}
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
