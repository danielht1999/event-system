import { apiGet, apiPatch } from '../../../shared/services/apiClient';
import type { ApiResponse } from '../../../shared/services/apiClient';

export interface Profile {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateProfileData {
  nombre?: string;
  email?: string;
  password?: string;
}

/**
 * Servicio de perfil
 * Maneja todas las operaciones relacionadas con el perfil del usuario
 */
export const profileApi = {
  /**
   * Obtener perfil del usuario autenticado
   */
  getProfile: async (): Promise<ApiResponse<Profile>> => {
    return apiGet<Profile>('/auth/profile');
  },

  /**
   * Actualizar perfil del usuario
   */
  updateProfile: async (data: UpdateProfileData): Promise<ApiResponse<Profile>> => {
    return apiPatch<Profile>('/auth/profile', data);
  },
};