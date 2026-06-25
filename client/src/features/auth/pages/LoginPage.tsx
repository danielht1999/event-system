// client/src/features/auth/pages/LoginPage.tsx

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setCargando(true);
  setError(null);

  try {
    console.log('[LoginPage] 🔐 Intentando login con:', { email, password });
    await login(email, password);
    console.log('[LoginPage] ✅ Login exitoso');
    console.log('[LoginPage] 📦 Token en localStorage:', localStorage.getItem('token'));
    navigate('/');
  } catch (err) {
    console.error('[LoginPage] ❌ Error:', err);
    setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
  } finally {
    setCargando(false);
  }
};

  return (
    <div className="auth-page">
      {/* ✅ Hero banner */}
      <div className="hero-banner">
        <div className="hero-text">
          <h2>Encuentra tus próximos eventos favoritos</h2>
          <p>
            Reserva entradas para conciertos, conferencias y talleres exclusivos
            de forma inmediata y segura.
          </p>
        </div>

        <div className="hero-auth-box">
          <h2>Iniciar sesión</h2>
          {error && <p className="error">{error}</p>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <div className="input-container">
                <span className="icon-wrapper">📧</span>
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <div className="input-container">
                <span className="icon-wrapper">🔒</span>
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={cargando}>
              {cargando ? 'Cargando...' : 'Iniciar sesión'}
            </button>
          </form>
          <p className="auth-link">
            ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
          </p>
        </div>
      </div>
    </div>
  );
};