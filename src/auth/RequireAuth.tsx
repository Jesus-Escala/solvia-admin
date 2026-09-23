import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from './AuthContext';

/** Redirects to the login page (remembering where the admin wanted to go) when signed out. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return children;
}
