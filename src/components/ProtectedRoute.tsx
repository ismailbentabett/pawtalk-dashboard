import { PUBLIC_ROUTES } from "@/constants/routes";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet } from "react-router-dom";


export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <Navigate to={PUBLIC_ROUTES.LOGIN} replace />;
  }

  return <Outlet />;
}