// client/src/shared/components/Footer.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';

const Footer: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const isOrganizer = user?.rol === 'ORGANIZADOR';

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Brand */}
        <div className="footer-brand">
          <h3>Eventify</h3>
          <p>
            La plataforma ideal para descubrir
            y gestionar tus eventos favoritos.
          </p>
        </div>

        {/* Explorar */}
        <div className="footer-links">
          <h4>Explorar</h4>
          <ul>
            <li><Link to="/" className="footer-link">Todos los eventos</Link></li>
          </ul>
        </div>

        {/* Mi Cuenta */}
        {isAuthenticated && (
          <div className="footer-links">
            <h4>Mi Cuenta</h4>
            <ul>
              <li><Link to="/profile" className="footer-link">Mi Perfil</Link></li>
              <li><Link to="/reservations" className="footer-link">Mis Reservas</Link></li>
              {isOrganizer && (
                <li><Link to="/events/create" className="footer-link">Crear Evento</Link></li>
              )}
            </ul>
          </div>
        )}

        {/* Legal */}
        <div className="footer-links">
          <h4>Legal</h4>
          <ul>
            <li><Link to="/terms" className="footer-link">Términos y Condiciones</Link></li>
            <li><Link to="/privacy" className="footer-link">Política de Privacidad</Link></li>
            <li><Link to="/contact" className="footer-link">Contacto</Link></li>
          </ul>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <span className="footer-copy">
          © {new Date().getFullYear()} Eventify. Todos los derechos reservados.
        </span>
        <div className="footer-legal">
          <a href="/terms" className="footer-link">Términos</a>
          <a href="/privacy" className="footer-link">Privacidad</a>
          <a href="/contact" className="footer-link">Contacto</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;