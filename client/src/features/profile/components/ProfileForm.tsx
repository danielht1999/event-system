// client/src/features/profile/components/ProfileForm.tsx

import { useState } from 'react';
import type { Profile } from '../services/profileApi';

interface ProfileFormProps {
  profile: Profile;
  onUpdate: (data: { nombre?: string; email?: string }) => Promise<void>;
}

export const ProfileForm = ({ profile, onUpdate }: ProfileFormProps) => {
  const [editando, setEditando] = useState<'nombre' | 'email' | null>(null);
  const [valorEditado, setValorEditado] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const iniciarEdicion = (campo: 'nombre' | 'email') => {
    setEditando(campo);
    setValorEditado(campo === 'nombre' ? profile.nombre : profile.email);
    setError('');
  };

  const cancelarEdicion = () => {
    setEditando(null);
    setValorEditado('');
    setError('');
    setCargando(false);
  };

  const validarEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    return regex.test(email);
  };

  const guardarCambios = async () => {
    if (!valorEditado.trim()) {
      setError('Este campo no puede estar vacío');
      return;
    }

    if (editando === 'nombre' && valorEditado.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres');
      return;
    }

    if (editando === 'email') {
      if (!validarEmail(valorEditado)) {
        setError('Ingresa un email válido (ejemplo: usuario@correo.com)');
        return;
      }
      if (valorEditado === profile.email) {
        setError('El email es igual al actual');
        return;
      }
    }

    if (editando === 'nombre' && valorEditado === profile.nombre) {
      setError('El nombre es igual al actual');
      return;
    }

    setCargando(true);
    setError('');

    try {
      const data = editando === 'nombre' 
        ? { nombre: valorEditado } 
        : { email: valorEditado };
      
      await onUpdate(data);
      setEditando(null);
      setValorEditado('');
    } catch (err: any) {
      setError(err.message || 'Error al actualizar, intenta de nuevo');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="profile-form">
      {/* FILA: NOMBRE */}
      <div className="profile-row">
        <div className="profile-info">
          <span className="info-label">Nombre</span>
          {editando === 'nombre' ? (
            <div className="edit-container">
              <div className="edit-mode">
                <input
                  type="text"
                  className="edit-input"
                  value={valorEditado}
                  onChange={(e) => setValorEditado(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') guardarCambios();
                    if (e.key === 'Escape') cancelarEdicion();
                  }}
                  autoFocus
                  disabled={cargando}
                />
                <button
                  className="btn-save"
                  onClick={guardarCambios}
                  disabled={cargando}
                >
                  {cargando ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  className="btn-cancel"
                  onClick={cancelarEdicion}
                  disabled={cargando}
                >
                  Cancelar
                </button>
              </div>
              {error && <div className="error-inline">{error}</div>}
            </div>
          ) : (
            <>
              <span className="info-value">{profile.nombre}</span>
              {error && editando === null && (
                <div className="error-inline">{error}</div>
              )}
            </>
          )}
        </div>
        {editando !== 'nombre' && (
          <button
            className="btn-edit-profile"
            onClick={() => iniciarEdicion('nombre')}
            title="Editar nombre"
          >
            ✏️
          </button>
        )}
      </div>

      {/* FILA: EMAIL */}
      <div className="profile-row">
        <div className="profile-info">
          <span className="info-label">Correo electrónico</span>
          {editando === 'email' ? (
            <div className="edit-container">
              <div className="edit-mode">
                <input
                  type="email"
                  className="edit-input"
                  value={valorEditado}
                  onChange={(e) => setValorEditado(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') guardarCambios();
                    if (e.key === 'Escape') cancelarEdicion();
                  }}
                  autoFocus
                  disabled={cargando}
                />
                <button
                  className="btn-save"
                  onClick={guardarCambios}
                  disabled={cargando}
                >
                  {cargando ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  className="btn-cancel"
                  onClick={cancelarEdicion}
                  disabled={cargando}
                >
                  Cancelar
                </button>
              </div>
              {error && <div className="error-inline">{error}</div>}
            </div>
          ) : (
            <>
              <span className="info-value">{profile.email}</span>
              {error && editando === null && (
                <div className="error-inline">{error}</div>
              )}
            </>
          )}
        </div>
        {editando !== 'email' && (
          <button
            className="btn-edit-profile"
            onClick={() => iniciarEdicion('email')}
            title="Editar email"
          >
            ✏️
          </button>
        )}
      </div>

      {/* FILA: ROL (solo lectura) */}
      <div className="profile-row">
        <div className="profile-info">
          <span className="info-label">Rol Asignado</span>
          <div className="pill-led success">
            <span className="led"></span>
            {profile.rol === 'ORGANIZADOR' ? 'Organizador' : 'Usuario'}
          </div>
        </div>
      </div>

      {/* FILA: ID (solo lectura) */}
      <div className="profile-row">
        <div className="profile-info">
          <span className="info-label">ID de Usuario</span>
          <span className="info-value" style={{ fontSize: '0.75rem', color: '#888' }}>
            {profile.id}
          </span>
        </div>
      </div>
    </div>
  );
};