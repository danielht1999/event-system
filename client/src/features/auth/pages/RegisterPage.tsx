// client/src/features/auth/pages/RegisterPage.tsx

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '..//hooks/useAuth';
import { authApi } from '../services/authApi';

export const RegisterPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError(null);

    try {
      const registerResponse = await authApi.register({
        nombre,
        email,
        password,
        rol: rol || undefined,
      });

      if (!registerResponse.success) {
        throw new Error(registerResponse.message || 'Error al registrarse');
      }

      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse');
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
          <h2>Registrarse</h2>
          {error && <p className="error">{error}</p>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <div className="input-container">
                <span className="icon-wrapper">👤</span>
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>
            </div>
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
            <div className="form-group">
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                required
              >
                <option value="">Selecciona un rol</option>
                <option value="ASISTENTE">Asistente</option>
                <option value="ORGANIZADOR">Organizador</option>
              </select>
            </div>
            <button type="submit" className="btn-primary" disabled={cargando}>
              {cargando ? 'Cargando...' : 'Registrarse'}
            </button>
          </form>
          <p className="auth-link">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
};