import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_owner")({
  component: OwnerLayout,
});

function OwnerLayout() {
  const { owner, loading } = useAuth();
  if (loading) return null;
  if (!owner) return <Navigate to="/auth" />;
  return <Outlet />;
}
