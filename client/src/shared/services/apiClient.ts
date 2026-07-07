// src/shared/services/apiClient.ts

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface ApiFetchOptions extends RequestInit {
  requireAuth?: boolean;
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: ApiFetchOptions = {}
): Promise<ApiResponse<T>> {
  const { requireAuth = false, ...fetchOptions } = options;

  const token = localStorage.getItem('token');

  if (requireAuth && !token) {
    return {
      success: false,
      message: 'Se requiere autenticación'
    };
  }

  const headers = new Headers(fetchOptions.headers || {});
  headers.set('Content-Type', 'application/json');

  if (requireAuth && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...fetchOptions,
      headers
    });

    // No borrar el token automáticamente en 401
    if (response.status === 401) {
      return {
        success: false,
        message: 'Sesión expirada o token inválido'
      };
    }

    let payload: any = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      return {
        success: false,
        message:
          payload?.message ??
          payload?.error ??
          `Error ${response.status}: ${response.statusText}`
      };
    }

    if (!payload) {
      return {
        success: false,
        message: 'Respuesta vacía del servidor'
      };
    }

    const responseData = payload.data ?? payload;

    // Formato paginado
    if (responseData?.items && Array.isArray(responseData.items)) {
      return {
        success: true,
        data: responseData.items as T,
        meta: {
          total: responseData.totalItems || 0,
          page: responseData.page || 1,
          limit: responseData.limit || 20,
        },
        message: payload?.message
      };
    }

    // Array plano
    if (Array.isArray(responseData)) {
      return {
        success: true,
        data: responseData as T,
        meta: payload?.meta,
        message: payload?.message
      };
    }

    // Objeto único
    return {
      success: true,
      data: responseData as T,
      message: payload?.message,
      meta: payload?.meta
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Error de conexión con el servidor'
    };
  }
}

// Helpers - requireAuth: true por defecto
export function apiGet<T = unknown>(
  endpoint: string,
  options?: ApiFetchOptions
): Promise<ApiResponse<T>> {
  return apiFetch<T>(endpoint, { 
    ...options, 
    method: 'GET',
    requireAuth: options?.requireAuth ?? true
  });
}

export function apiPost<T = unknown>(
  endpoint: string,
  body?: unknown,
  options?: ApiFetchOptions
): Promise<ApiResponse<T>> {
  return apiFetch<T>(endpoint, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
    requireAuth: options?.requireAuth ?? true
  });
}

export function apiPut<T = unknown>(
  endpoint: string,
  body?: unknown,
  options?: ApiFetchOptions
): Promise<ApiResponse<T>> {
  return apiFetch<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
    requireAuth: options?.requireAuth ?? true
  });
}

export function apiPatch<T = unknown>(
  endpoint: string,
  body?: unknown,
  options?: ApiFetchOptions
): Promise<ApiResponse<T>> {
  return apiFetch<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
    requireAuth: options?.requireAuth ?? true
  });
}

export function apiDelete<T = unknown>(
  endpoint: string,
  options?: ApiFetchOptions
): Promise<ApiResponse<T>> {
  return apiFetch<T>(endpoint, { 
    ...options, 
    method: 'DELETE',
    requireAuth: options?.requireAuth ?? true
  });
}