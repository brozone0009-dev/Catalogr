import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { owner, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={owner ? "/dashboard" : "/auth"} />;
}
