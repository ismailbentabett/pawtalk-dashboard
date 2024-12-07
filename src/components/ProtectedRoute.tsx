import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PUBLIC_ROUTES } from '@/constants/routes';
import { Loader } from 'lucide-react';


interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, userData, loading, error, isAuthorized } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Navigate 
        to={PUBLIC_ROUTES.LOGIN} 
        state={{ 
          from: location,
          error: "Session expired. Please login again."
        }} 
        replace 
      />
    );
  }

  if (!user || !userData) {
    return (
      <Navigate 
        to={PUBLIC_ROUTES.LOGIN} 
        state={{ from: location }} 
        replace 
      />
    );
  }

  if (!isAuthorized(location.pathname)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}