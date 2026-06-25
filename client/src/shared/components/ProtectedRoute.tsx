// client/src/shared/components/ProtectedRoute.tsx

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  requiredRole?: 'ORGANIZADOR' | 'USUARIO';
}

export const ProtectedRoute = ({ requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, isOrganizador, loading } = useAuth();

  // Mostrar loading mientras se verifica autenticación
  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
        <p style={{ color: '#8b949e' }}>Verificando autenticación...</p>
      </div>
    );
  }

  // No autenticado → redirigir a login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Requiere rol ORGANIZADOR pero no lo es → redirigir a home
  if (requiredRole === 'ORGANIZADOR' && !isOrganizador) {
    return <Navigate to="/" replace />;
  }

  // Autenticado y con rol permitido → mostrar contenido
  return <Outlet />;
};