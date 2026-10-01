import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth", search: { next: window.location.pathname } });
    }
  }, [loading, navigate, user]);

  if (loading || !user) {
    return <main className="grid min-h-screen place-items-center bg-background"><LoaderCircle className="size-8 animate-spin text-maple" aria-label="Checking your account" /></main>;
  }

  return <Outlet />;
}
