import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { salesman, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={salesman ? "/browse" : "/auth"} />;
}
