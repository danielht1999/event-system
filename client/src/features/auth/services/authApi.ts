import { apiPost, apiGet, apiPatch } from '../../../shared/services/apiClient';
import type { ApiResponse } from '../../../shared/services/apiClient';

export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  nombre: string;
  email: string;
  password: string;
  rol?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ProfileUpdateData {
  nombre?: string;
  email?: string;
}

/**
 * Servicio de autenticación
 * Maneja todas las operaciones relacionadas con auth
 */
export const authApi = {
  /**
   * Iniciar sesión
   */
  login: async (credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> => {
    return apiPost<LoginResponse>('/auth/login', credentials, {
      requireAuth: false, // No requiere token para login
    });
  },

  /**
   * Registrar usuario
   */
  register: async (data: RegisterData): Promise<ApiResponse<LoginResponse>> => {
    return apiPost<LoginResponse>('/auth/register', data, {
      requireAuth: false, // No requiere token para registro
    });
  },

  /**
   * Obtener perfil del usuario autenticado
   */
  getProfile: async (): Promise<ApiResponse<User>> => {
    return apiGet<User>('/auth/profile');
  },

  /**
   * Actualizar perfil del usuario
   */
  updateProfile: async (data: ProfileUpdateData): Promise<ApiResponse<User>> => {
    return apiPatch<User>('/auth/profile', data);
  }
};