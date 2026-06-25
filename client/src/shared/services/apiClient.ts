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

  // ✅ LOG: Ver qué se está llamando
  console.log(`[apiClient] 🌐 ${options.method || 'GET'} ${endpoint}`);
  console.log(`[apiClient] 🔑 requireAuth: ${requireAuth}`);

  const token = localStorage.getItem('token');
  console.log(`[apiClient] 🔑 Token en localStorage: ${token ? '✅ Presente' : '❌ No presente'}`);
  console.log(`[apiClient] 🔑 Token (primeros 20 chars): ${token?.substring(0, 20)}...`);

  if (requireAuth && !token) {
    console.log('[apiClient] ⚠️ requireAuth=true pero no hay token');
    return {
      success: false,
      message: 'Se requiere autenticación'
    };
  }

  const headers = new Headers(fetchOptions.headers || {});
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
    console.log('[apiClient] ✅ Header Authorization agregado');
  } else {
    console.log('[apiClient] ⚠️ No hay token, omitiendo header Authorization');
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...fetchOptions,
      headers
    });

    console.log(`[apiClient] 📡 Response status: ${response.status} ${response.statusText}`);

    if (response.status === 401) {
      console.log(`[apiClient] 🔴 401 en ${endpoint}`);
      console.log(`[apiClient] 🔑 Token antes de eliminar: ${localStorage.getItem('token')}`);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      console.log(`[apiClient] 🔑 Token después de eliminar: ${localStorage.getItem('token')}`);
      return {
        success: false,
        message: 'Sesión expirada'
      };
    }

    let payload: any = null;
    try {
      payload = await response.json();
      console.log('[apiClient] 📦 Payload completo:', JSON.stringify(payload, null, 2));
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
    console.log('[apiClient] 🔍 responseData:', responseData);

    const isPaginated = responseData?.items && Array.isArray(responseData.items);

    let normalizedData: any;
    let normalizedMeta: { page: number; limit: number; total: number } | undefined;

    if (isPaginated) {
      normalizedData = responseData.items;
      normalizedMeta = {
        page: responseData.page || 1,
        limit: responseData.limit || 20,
        total: responseData.totalItems || 0
      };
      console.log('[apiClient] ✅ Formato paginado detectado. items:', normalizedData.length);
    } else if (Array.isArray(responseData)) {
      normalizedData = responseData;
      normalizedMeta = payload.meta;
      console.log('[apiClient] ✅ Formato array detectado. length:', normalizedData.length);
    } else if (responseData?.data && Array.isArray(responseData.data)) {
      normalizedData = responseData.data;
      normalizedMeta = responseData.meta;
      console.log('[apiClient] ✅ Formato anidado detectado. length:', normalizedData.length);
    } else {
      normalizedData = responseData;
      normalizedMeta = payload.meta;
      console.log('[apiClient] ✅ Formato objeto único detectado.');
    }

    const result = {
      success: true,
      data: normalizedData,
      message: payload?.message,
      meta: normalizedMeta
    };

    console.log('[apiClient] ✅ Resultado final:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('[apiClient] ❌ Error:', error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Error de conexión con el servidor'
    };
  }
}

// ============================================================================
// HELPERS
// ============================================================================

export function apiGet<T = unknown>(
  endpoint: string,
  options?: ApiFetchOptions
): Promise<ApiResponse<T>> {
  return apiFetch<T>(endpoint, { ...options, method: 'GET' });
}

export function apiPost<T = unknown>(
  endpoint: string,
  body?: unknown,
  options?: ApiFetchOptions
): Promise<ApiResponse<T>> {
  return apiFetch<T>(endpoint, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined
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
    body: body ? JSON.stringify(body) : undefined
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
    body: body ? JSON.stringify(body) : undefined
  });
}

export function apiDelete<T = unknown>(
  endpoint: string,
  options?: ApiFetchOptions
): Promise<ApiResponse<T>> {
  return apiFetch<T>(endpoint, { ...options, method: 'DELETE' });
}