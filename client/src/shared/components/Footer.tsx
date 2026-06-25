import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';

const Footer: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const isOrganizer = user?.rol === 'ORGANIZADOR';

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <h3>Eventify</h3>
          <p>
            La plataforma ideal para descubrir
            y gestionar tus eventos favoritos.
          </p>
        </div>

        <div className="footer-column">
          <h4>Explorar</h4>
          <ul className="footer-links">
            <li><Link to="/">Todos los eventos</Link></li>
          </ul>
        </div>

        {isAuthenticated && (
          <div className="footer-column">
            <h4>Mi Cuenta</h4>
            <ul className="footer-links">
              <li><Link to="/profile">Mi Perfil</Link></li>
              <li><Link to="/reservations">Mis Reservas</Link></li>
              {isOrganizer && (
                <li><Link to="/events/create">Crear Evento</Link></li>
              )}
            </ul>
          </div>
        )}

        <div className="footer-column">
          <h4>Legal</h4>
          <ul className="footer-links">
            <li><Link to="/terms">Términos y Condiciones</Link></li>
            <li><Link to="/privacy">Política de Privacidad</Link></li>
            <li><Link to="/contact">Contacto</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;