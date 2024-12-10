import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PUBLIC_ROUTES } from "@/constants/routes";
import { ROLE_REQUIREMENTS, UserRole } from "../types/Auth";

interface RoleProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: UserRole[];
}

export function RoleProtectedRoute({
  children,
  requiredRoles,
}: RoleProtectedRouteProps) {
  const location = useLocation();
  const { user, userData, loading, error, hasRequiredRole } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }
  // Redirect to login if not authenticated
  if (!user || !userData || error) {
    return (
      <Navigate to={PUBLIC_ROUTES.LOGIN} state={{ from: location }} replace />
    );
  }

  // Check role requirements for the current path
  const pathRoles = requiredRoles || ROLE_REQUIREMENTS[location.pathname];
  if (pathRoles && !hasRequiredRole(pathRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
