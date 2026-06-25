// client/src/features/events/services/eventApi.ts

import {
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
} from '../../../shared/services/apiClient';

import type { ApiResponse } from '../../../shared/services/apiClient';
import type { Evento, CrearEventoData } from '../types/Event';
import type { EventAvailability } from '../types/EventAvailability';

/**
 * Normaliza un evento del backend al formato esperado por el frontend
 * Extrae precio y cupos disponibles del primer ticket
 */
const normalizeEvento = (rawEvento: any): Evento => {
  const firstTicket = rawEvento.tickets?.[0];

  return {
    id: rawEvento.id,
    titulo: rawEvento.titulo,
    lugar: rawEvento.lugar,
    descripcion: rawEvento.descripcion,
    fecha: rawEvento.fecha,
    organizadorId: rawEvento.organizadorId,
    estado: rawEvento.estado,
    precio: firstTicket?.precio ?? 0,
    cuposDisponibles: firstTicket?.cuposDisponibles ?? 0,
    tickets: rawEvento.tickets || [],
  };
};

export const eventApi = {
  /**
   * GET /events?page=&limit=&status=&owner=&sortBy=&sortOrder=
   * Pública - No requiere autenticación
   */
  getEventos: async (queryString?: string): Promise<ApiResponse<Evento[]>> => {
    const endpoint = queryString ? `/events?${queryString}` : '/events';
    const response = await apiGet<any[]>(endpoint, {
      requireAuth: false,
    });

    if (response.success && response.data) {
      return {
        ...response,
        data: response.data.map(normalizeEvento),
      };
    }

    return response;
  },

  /**
   * GET /events?owner=me
   * ✅ Requiere autenticación
   */
  getMisEventos: async (queryString?: string): Promise<ApiResponse<Evento[]>> => {
    const params = new URLSearchParams(queryString || '');
    params.set('owner', 'me');
    const endpoint = `/events?${params.toString()}`;
    const response = await apiGet<any[]>(endpoint, {
      requireAuth: true, // ✅ Agregado
    });

    if (response.success && response.data) {
      return {
        ...response,
        data: response.data.map(normalizeEvento),
      };
    }

    return response;
  },

  /**
   * GET /events/:id
   * Pública - No requiere autenticación
   */
  getEvento: async (id: string): Promise<ApiResponse<Evento>> => {
    const response = await apiGet<any>(`/events/${id}`, {
      requireAuth: false,
    });

    if (response.success && response.data) {
      return {
        ...response,
        data: normalizeEvento(response.data),
      };
    }

    return response;
  },

  /**
   * GET /events/:id/availability
   * Pública - No requiere autenticación
   */
  getAvailability: async (id: string): Promise<ApiResponse<EventAvailability>> => {
    return apiGet<EventAvailability>(`/events/${id}/availability`, {
      requireAuth: false,
    });
  },

  /**
   * POST /events
   * ✅ Requiere autenticación + rol ORGANIZADOR
   */
  crearEvento: async (data: CrearEventoData): Promise<ApiResponse<Evento>> => {
    return apiPost<Evento>('/events', data, {
      requireAuth: true, // ✅ Agregado
    });
  },

  /**
   * PUT /events/:id
   * ✅ Requiere autenticación + rol ORGANIZADOR
   */
  actualizarEvento: async (id: string, data: Partial<CrearEventoData>): Promise<ApiResponse<Evento>> => {
    return apiPut<Evento>(`/events/${id}`, data, {
      requireAuth: true, // ✅ Agregado
    });
  },

  /**
   * PATCH /events/:id/publish
   * ✅ Requiere autenticación + rol ORGANIZADOR
   */
  publicarEvento: async (id: string): Promise<ApiResponse<Evento>> => {
    return apiPatch<Evento>(`/events/${id}/publish`, {
      requireAuth: true, // ✅ Agregado
    });
  },

  /**
   * DELETE /events/:id
   * ✅ Requiere autenticación + rol ORGANIZADOR
   */
  cancelarEvento: async (id: string): Promise<ApiResponse<void>> => {
    return apiDelete<void>(`/events/${id}`, {
      requireAuth: true, // ✅ Agregado
    });
  },
};