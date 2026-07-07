// client/src/features/events/services/eventApi.ts

import {
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
} from '../../../shared/services/apiClient';

import type { ApiResponse } from '../../../shared/services/apiClient';
import type { Evento, CrearEventoData, EventManagementDTO } from '../types/Event';
import type { EventAvailability } from '../types/EventAvailability';

/**
 * Normaliza un evento del backend al formato esperado por el frontend
 * ✅ AHORA GUARDA LOS TICKETS COMPLETOS
 */
const normalizeEvento = (rawEvento: any): Evento => {
  const tickets = rawEvento.tickets || [];
  const precioMinimo = rawEvento.precioMinimo !== undefined 
    ? Number(rawEvento.precioMinimo) 
    : (tickets.length > 0 ? Math.min(...tickets.map((t: any) => t.precio)) : 0);
  const cuposDisponibles = rawEvento.cuposDisponibles !== undefined
    ? Number(rawEvento.cuposDisponibles)
    : (tickets.length > 0 ? tickets.reduce((sum: number, t: any) => sum + t.cuposDisponibles, 0) : 0);

  return {
    id: rawEvento.id,
    titulo: rawEvento.titulo,
    lugar: rawEvento.lugar,
    descripcion: rawEvento.descripcion,
    fecha: rawEvento.fecha,
    organizadorId: rawEvento.organizadorId,
    estado: rawEvento.estado,
    // ✅ Guardar tickets completos (si vienen del backend)
    tickets: tickets.map((t: any) => ({
      id: t.id,
      nombre: t.nombre,
      precio: t.precio,
      capacidadMaxima: t.capacidadMaxima || t.capacidad,
      cuposDisponibles: t.cuposDisponibles,
      reservasPendientes: t.reservasPendientes || 0,
      reservasConfirmadas: t.reservasConfirmadas || 0,
      estado: t.estado || 'ACTIVO',
    })),
    precioMinimo,
    cuposDisponibles,
  };
};

// ============================================
// NORMALIZADOR PARA EVENT MANAGEMENT DTO
// ============================================

const normalizeManagementDTO = (raw: any): EventManagementDTO => {
  const tickets = raw.tickets || [];
  
  return {
    id: raw.id,
    titulo: raw.titulo,
    lugar: raw.lugar,
    descripcion: raw.descripcion,
    fecha: raw.fecha,
    organizadorId: raw.organizadorId,
    estado: raw.estado || 'BORRADOR',
    
    // Campos obligatorios para management
    precioMinimo: raw.precioMinimo ?? (tickets.length > 0 ? Math.min(...tickets.map((t: any) => t.precio)) : 0),
    cuposDisponibles: raw.cuposDisponibles ?? tickets.reduce((sum: number, t: any) => sum + t.cuposDisponibles, 0),
    
    tickets: tickets.map((t: any) => ({
      id: t.id,
      nombre: t.nombre,
      precio: t.precio,
      capacidadMaxima: t.capacidadMaxima || t.capacidad || 0,
      cuposDisponibles: t.cuposDisponibles || 0,
      reservasPendientes: t.reservasPendientes || 0,
      reservasConfirmadas: t.reservasConfirmadas || 0,
      estado: t.estado || 'ACTIVO',
    })),
  };
};


export const eventApi = {
  getEventos: async (queryString?: string): Promise<ApiResponse<Evento[]>> => {
    const endpoint = queryString ? `/events?${queryString}` : '/events';
    const response = await apiGet<any>(endpoint, {
      requireAuth: false,
    });

    const rawResponse = response as any;
    
    if (response.success && rawResponse.items) {
      return {
        success: true,
        data: rawResponse.items.map(normalizeEvento),
        meta: {
          total: rawResponse.totalItems || 0,
          page: rawResponse.page || 1,
          limit: rawResponse.limit || 20,
        },
      };
    }

    if (response.success && response.data) {
      const items = Array.isArray(response.data) ? response.data : [];
      return {
        success: true,
        data: items.map(normalizeEvento),
        meta: response.meta,
      };
    }

    return response;
  },

  getMisEventos: async (queryString?: string): Promise<ApiResponse<Evento[]>> => {
    const params = new URLSearchParams(queryString || '');
    params.set('owner', 'me');
    const endpoint = `/events?${params.toString()}`;
    const response = await apiGet<any>(endpoint, {
      requireAuth: true,
    });

    const rawResponse = response as any;

    if (response.success && rawResponse.items) {
      return {
        success: true,
        data: rawResponse.items.map(normalizeEvento),
        meta: {
          total: rawResponse.totalItems || 0,
          page: rawResponse.page || 1,
          limit: rawResponse.limit || 20,
        },
      };
    }

    if (response.success && response.data) {
      const items = Array.isArray(response.data) ? response.data : [];
      return {
        success: true,
        data: items.map(normalizeEvento),
        meta: response.meta,
      };
    }

    return response;
  },
  getEventosManagement: async (): Promise<ApiResponse<EventManagementDTO[]>> => {
    const response = await apiGet<any>('/events/management', {
      requireAuth: true,
    });

    if (response.success && response.data) {
      const items = Array.isArray(response.data) ? response.data : [];
      return {
        success: true,
        data: items.map(normalizeManagementDTO),
        meta: response.meta,
      };
    }

    return response;
  },

  getEvento: async (id: string): Promise<ApiResponse<Evento>> => {
    const response = await apiGet<any>(`/events/${id}`, {
      requireAuth: false,
    });

    if (response.success && response.data) {
      return {
        success: true,
        data: normalizeEvento(response.data),
      };
    }

    return response;
  },

  getAvailability: async (id: string): Promise<ApiResponse<EventAvailability>> => {
    return apiGet<EventAvailability>(`/events/${id}/availability`, {
      requireAuth: false,
    });
  },

  crearEvento: async (data: CrearEventoData): Promise<ApiResponse<Evento>> => {
    return apiPost<Evento>('/events', data, {
      requireAuth: true,
    });
  },

  actualizarEvento: async (id: string, data: Partial<CrearEventoData>): Promise<ApiResponse<Evento>> => {
    return apiPut<Evento>(`/events/${id}`, data, {
      requireAuth: true,
    });
  },

  publicarEvento: async (id: string): Promise<ApiResponse<Evento>> => {
    return apiPatch<Evento>(`/events/${id}/publish`, {}, {
      requireAuth: true,
    });
  },

  cancelarEvento: async (id: string): Promise<ApiResponse<void>> => {
    return apiDelete<void>(`/events/${id}`, {
      requireAuth: true,
    });
  },
};