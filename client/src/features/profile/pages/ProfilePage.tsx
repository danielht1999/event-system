// client/src/features/profile/pages/ProfilePage.tsx

import { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/context/AuthContext';
import { profileApi, type Profile } from '../services/profileApi';
import { ProfileForm } from '../components/ProfileForm';

export const ProfilePage = () => {
  const { token } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarPerfil = async () => {
      if (!token) {
        setCargando(false);
        return;
      }
      setCargando(true);
      setError(null);
      try {
        const response = await profileApi.getProfile();
        if (response.success && response.data) {
          setProfile(response.data);
        } else {
          setError(response.message || 'Error al cargar perfil');
        }
      } catch (err) {
        setError('Error de conexión');
      } finally {
        setCargando(false);
      }
    };
    cargarPerfil();
  }, [token]);

  const handleUpdate = async (data: { nombre?: string; email?: string }) => {
    const response = await profileApi.updateProfile(data);
    if (response.success && response.data) {
      setProfile(response.data);
      window.location.reload();
    } else {
      throw new Error(response.message || 'Error al actualizar');
    }
  };

  if (cargando) {
    return (
      <div className="main-panel">
        <h1 className="panel-title">Mi Perfil</h1>
        <div className="spinner-container">
          <div className="spinner"></div>
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-panel">
        <h1 className="panel-title">Mi Perfil</h1>
        <p className="error">{error}</p>
        <button onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="main-panel">
        <h1 className="panel-title">Mi Perfil</h1>
        <p className="empty">No se pudo cargar el perfil</p>
      </div>
    );
  }

  return (
    <div className="main-panel">
      <h1 className="panel-title">Mi Perfil</h1>
      <ProfileForm profile={profile} onUpdate={handleUpdate} />
    </div>
  );
};