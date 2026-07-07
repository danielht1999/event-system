// client/src/shared/components/Navbar.tsx

import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated, reservationsCount } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Brand */}
        <NavLink to="/" className="navbar-brand">
          <span className="navbar-brand-icon">🎫</span>
          Eventify
        </NavLink>

        {/* Desktop Menu */}
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
                Mis Reservas ({reservationsCount})
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

          <div className="nav-actions">
            {isAuthenticated && user ? (
              <>
                <div className="pill-led info">
                  <span className="led"></span>
                  {user.rol}
                </div>

                <span className="navbar-username">
                  {user.nombre}
                </span>

                <button onClick={handleLogout} className="btn btn-danger btn-sm">
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

        {/* Mobile Toggle */}
        <button 
          className={`navbar-mobile-toggle ${mobileMenuOpen ? 'open' : ''}`}
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Mobile Menu */}
        <div className={`navbar-mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <nav className="nav-links">
            <NavLink
              to="/"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              end
              onClick={() => setMobileMenuOpen(false)}
            >
              Explorar
            </NavLink>

            {isAuthenticated && (
              <NavLink
                to="/reservations"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Mis Reservas ({reservationsCount})
              </NavLink>
            )}

            {user?.rol === 'ORGANIZADOR' && (
              <NavLink
                to="/events/create"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Crear Evento
              </NavLink>
            )}

            {isAuthenticated && (
              <NavLink
                to="/profile"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Mi Perfil
              </NavLink>
            )}
          </nav>

          <div className="nav-actions">
            {isAuthenticated && user ? (
              <>
                <div className="pill-led info">
                  <span className="led"></span>
                  {user.rol}
                </div>

                <span className="navbar-username">
                  {user.nombre}
                </span>

                <button onClick={handleLogout} className="btn btn-danger btn-sm">
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className="nav-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Iniciar Sesión
                </NavLink>
                <NavLink
                  to="/register"
                  className="nav-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Registrarse
                </NavLink>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;