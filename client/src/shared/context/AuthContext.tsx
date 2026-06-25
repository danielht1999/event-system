// client/src/shared/context/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../../features/auth/services/authApi';

// ============================================================
// TIPOS SEGÚN CONTRATO
// ============================================================

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
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

// ============================================================
// CONTEXTO
// ============================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ============================================================
  // RESTAURAR SESIÓN DESDE LOCALSTORAGE
  // ============================================================

  useEffect(() => {
    console.log('[AuthContext] 🔄 Iniciando restauración de sesión...');
    try {
      const tokenGuardado = localStorage.getItem('token');
      const userGuardado = localStorage.getItem('user');
      
      console.log('[AuthContext] 📦 tokenGuardado:', tokenGuardado ? '✅ Presente' : '❌ No presente');
      console.log('[AuthContext] 📦 userGuardado:', userGuardado ? '✅ Presente' : '❌ No presente');

      if (tokenGuardado && userGuardado && userGuardado !== 'undefined' && userGuardado !== 'null') {
        const parsedUser = JSON.parse(userGuardado);
        console.log('[AuthContext] 👤 Usuario restaurado:', parsedUser);
        setToken(tokenGuardado);
        setUser(parsedUser);
      } else {
        console.log('[AuthContext] ⚠️ No hay sesión guardada en localStorage');
      }
    } catch (error) {
      console.warn('[AuthContext] ❌ Error al restaurar sesión:', error);
    } finally {
      setLoading(false);
      console.log('[AuthContext] 🔓 loading = false');
      console.log('[AuthContext] 📊 Estado final - token:', !!token, 'user:', !!user);
      console.log('[AuthContext] 📊 isAuthenticated:', !!token && !!user);
    }
  }, []);

  // ============================================================
  // LOGIN SEGÚN CONTRATO: (email, password) => Promise<void>
  // ============================================================

  const login = async (email: string, password: string): Promise<void> => {
  console.log('[AuthContext] 🔐 Intentando login...');
  const response = await authApi.login({ email, password });
  
  console.log('[AuthContext] 📦 Respuesta completa:', JSON.stringify(response, null, 2));

  if (!response.success || !response.data) {
    console.log('[AuthContext] ❌ Login falló:', response.message);
    throw new Error(response.message || 'Error al iniciar sesión');
  }

  const { token: nuevoToken, user: nuevoUser } = response.data;
  
  console.log('[AuthContext] 🎫 Token recibido:', nuevoToken);
  console.log('[AuthContext] 👤 Usuario recibido:', nuevoUser);

  setToken(nuevoToken);
  setUser(nuevoUser);
  localStorage.setItem('token', nuevoToken);
  localStorage.setItem('user', JSON.stringify(nuevoUser));
  
  console.log('[AuthContext] ✅ Token guardado en localStorage');
  console.log('[AuthContext] 🔍 Verificar localStorage:', localStorage.getItem('token'));
};

  // ============================================================
  // LOGOUT
  // ============================================================

  const logout = (): void => {
    console.log('[AuthContext] 🚪 Cerrando sesión...');
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // ============================================================
  // VALOR DEL CONTEXTO
  // ============================================================

  const isAuthenticated = !!token && !!user;
  const isOrganizador = user?.rol === 'ORGANIZADOR';

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isOrganizador,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ============================================================
// HOOK useAuth
// ============================================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }

  return context;
};