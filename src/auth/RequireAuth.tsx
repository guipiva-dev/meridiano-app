import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "./useAuth";

export function RequireAuth() {
  const { me, carregando } = useAuth();
  const loc = useLocation();
  if (carregando) return null;
  if (!me) return <Navigate to={`/login?voltar=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  return <Outlet />;
}
