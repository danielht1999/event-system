// client/src/shared/config/api.ts

export const API_CONFIG = {
  /**
   * URL base de la API
   */
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1',

  /**
   * Tiempo máximo de espera para una petición (ms)
   */
  timeout: 30000,

  /**
   * Headers por defecto
   */
  defaultHeaders: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },

  /**
   * Opciones de paginación por defecto
   */
  pagination: {
    defaultPage: 1,
    defaultLimit: 10,
    maxLimit: 100,
  },

  /**
   * Endpoints por feature
   */
  endpoints: {
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      profile: '/auth/profile',
    },
    events: {
      list: '/events',
      detail: (id: string) => `/events/${id}`,
      availability: (id: string) => `/events/${id}/availability`,
      publish: (id: string) => `/events/${id}/publish`,
    },
    reservations: {
      list: '/reservations',
      detail: (id: string) => `/reservations/${id}`,
      confirm: (id: string) => `/reservations/${id}/confirm`,
    },
  },
} as const;

export type ApiConfig = typeof API_CONFIG;