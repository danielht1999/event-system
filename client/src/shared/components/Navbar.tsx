// client/src/shared/components/Navbar.tsx

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useReservations } from '../../features/reservations/hooks/useReservations';

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // ✅ Obtener reservas solo si está autenticado
  const { reservas } = useReservations(isAuthenticated ? {} : {});
  const reservasCount = reservas?.length || 0;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="logo">
        <NavLink to="/">Eventify</NavLink>
      </div>

      <div className="nav-menu">
        <nav className="nav-links">
          <NavLink
            to="/"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            end
          >
            Explorar
          </NavLink>

          {isAuthenticated && (
            <NavLink
              to="/reservations"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              Mis Reservas ({reservasCount})
            </NavLink>
          )}

          {user?.rol === 'ORGANIZADOR' && (
            <NavLink
              to="/events/create"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              Crear Evento
            </NavLink>
          )}

          {isAuthenticated && (
            <NavLink
              to="/profile"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              Mi Perfil
            </NavLink>
          )}
        </nav>

        <div className="nav-user-zone">
          {isAuthenticated && user ? (
            <>
              <div className="nav-role-pill">
                <span className="nav-role-led"></span>
                {user.rol}
              </div>

              <span className="user-name">
                {user.nombre}
              </span>

              <button onClick={handleLogout} className="btn-logout">
                Cerrar Sesión
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                Iniciar Sesión
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                Registrarse
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;