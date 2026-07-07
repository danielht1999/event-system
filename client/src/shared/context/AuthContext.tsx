// client/src/shared/context/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../../features/auth/services/authApi';
import { reservationApi } from '../../features/reservations/services/reservationApi';
import type { Reservation } from '../../features/reservations/types/Reservation';

interface User {
  id: string;
  email: string;
  nombre: string;
  rol: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isOrganizador: boolean;
  reservations: Reservation[];
  reservationsCount: number;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  refreshReservations: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<Reservation[]>([]);

  // Cargar reservas cuando el usuario está autenticado
  const loadReservations = async () => {
    if (!token || !user) {
      setReservations([]);
      return;
    }

    try {
      const response = await reservationApi.getMisReservas('page=1&limit=100');
      if (response.success && response.data) {
        setReservations(response.data);
      }
    } catch (error) {
      console.error('[AuthContext] Error al cargar reservas:', error);
    }
  };

  // Restaurar sesión
  useEffect(() => {
    try {
      const tokenGuardado = localStorage.getItem('token');
      const userGuardado = localStorage.getItem('user');

      if (tokenGuardado && userGuardado && userGuardado !== 'undefined' && userGuardado !== 'null') {
        const parsedUser = JSON.parse(userGuardado);
        setToken(tokenGuardado);
        setUser(parsedUser);
        console.log('[AuthContext] ✅ Sesión restaurada');
      }
    } catch (error) {
      console.warn('[AuthContext] ⚠️ Error al restaurar sesión');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar reservas cuando la autenticación cambie
  useEffect(() => {
    if (token && user) {
      loadReservations();
    } else {
      setReservations([]);
    }
  }, [token, user]);

  // Login
  const login = async (email: string, password: string): Promise<void> => {
    const response = await authApi.login({ email, password });

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Error al iniciar sesión');
    }

    const { token: nuevoToken, user: nuevoUser } = response.data;

    setToken(nuevoToken);
    setUser(nuevoUser);
    localStorage.setItem('token', nuevoToken);
    localStorage.setItem('user', JSON.stringify(nuevoUser));

    console.log('[AuthContext] ✅ Login exitoso');
  };

  // Logout
  const logout = (): void => {
    setToken(null);
    setUser(null);
    setReservations([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('[AuthContext] 🚪 Sesión cerrada');
  };

  // Refresh reservas
  const refreshReservations = async (): Promise<void> => {
    await loadReservations();
  };

  const isAuthenticated = !!token && !!user;
  const isOrganizador = user?.rol === 'ORGANIZADOR';
  const reservationsCount = reservations.length;

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isOrganizador,
    reservations,
    reservationsCount,
    login,
    logout,
    loading,
    refreshReservations,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};