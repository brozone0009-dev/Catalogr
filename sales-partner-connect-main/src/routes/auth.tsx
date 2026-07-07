import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { login } from "@/lib/api";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Catalogr Salesman" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { salesman, setSalesman } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  if (salesman) return <Navigate to="/browse" />;

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const s = await login(String(f.get("email")), String(f.get("password")));
      setSalesman(s);
      toast.success(`Welcome, ${s.name}`);
      navigate({ to: "/browse" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Briefcase className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-semibold text-white">Catalogr Sales</span>
        </div>
        <div className="relative z-10">
          <h2 className="font-display text-4xl font-semibold leading-tight text-white">
            Sell smarter.<br />From anywhere.
          </h2>
          <p className="mt-4 max-w-md text-sidebar-foreground/70">
            Browse your owner's live catalog, build orders on the spot, and submit
            them straight to the back office.
          </p>
        </div>
        <div className="text-xs text-sidebar-foreground/50">© {new Date().getFullYear()} Catalogr</div>
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary/40 blur-3xl" />
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <h1 className="font-display text-3xl font-semibold">Salesman sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Use the credentials your owner shared with you.
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" suppressHydrationWarning />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required autoComplete="current-password" suppressHydrationWarning />
            </div>
            <Button type="submit" className="w-full" disabled={busy} suppressHydrationWarning>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-xs text-muted-foreground">
            Don't have an account? Ask your owner to add you from their dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
