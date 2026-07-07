import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth-context";
import { login, signup } from "@/lib/api";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Catalogr" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { owner, setOwner } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  if (owner) return <Navigate to="/dashboard" />;

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const o = await login(String(f.get("email")), String(f.get("password")));
      setOwner(o); toast.success(`Welcome back, ${o.name}`);
      navigate({ to: "/dashboard" });
    } catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
  }

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const o = await signup({
        name: String(f.get("name")),
        email: String(f.get("email")),
        password: String(f.get("password")),
        phone: String(f.get("phone") || ""),
        companyName: String(f.get("companyName") || ""),
      });
      setOwner(o); toast.success("Account created");
      navigate({ to: "/dashboard" });
    } catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Store className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-semibold text-white">Catalogr</span>
        </div>
        <div className="relative z-10">
          <h2 className="font-display text-4xl font-semibold leading-tight text-white">
            Your catalog.<br />Your customers.<br />One console.
          </h2>
          <p className="mt-4 max-w-md text-sidebar-foreground/70">
            Upload products with variants, manage incoming orders from your salesmen, and share
            curated catalogs via time-limited links.
          </p>
        </div>
        <div className="text-xs text-sidebar-foreground/50">© {new Date().getFullYear()} Catalogr</div>
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary/40 blur-3xl" />
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <h1 className="font-display text-3xl font-semibold">Owner sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Access your product catalog and order queue.
          </p>

          <Tabs defaultValue="login" className="mt-8">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="mt-6 space-y-4">
                <Field name="email" label="Email" type="email" required />
                <Field name="password" label="Password" type="password" required />
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="mt-6 space-y-4">
                <Field name="name" label="Your name" required />
                <Field name="companyName" label="Company name" />
                <Field name="email" label="Email" type="email" required />
                <Field name="phone" label="Phone" />
                <Field name="password" label="Password" type="password" required minLength={6} />
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Creating account…" : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function Field({ name, label, type = "text", required, minLength }: { name: string; label: string; type?: string; required?: boolean; minLength?: number }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={required} minLength={minLength} />
    </div>
  );
}
