// client/src/features/reservations/services/reservationApi.ts

import { apiGet, apiPost, apiDelete } from '../../../shared/services/apiClient';
import type { ApiResponse } from '../../../shared/services/apiClient';
import type { Reservation, CreateReservationDto } from '../types/Reservation';

export type { Reservation, CreateReservationDto };

/**
 * Servicio de reservas
 * Maneja todas las operaciones relacionadas con reservas
 */
export const reservationApi = {
  /**
   * GET /reservations?page=&limit=&status=&eventId=&userId=&sortBy=&sortOrder=
   */
  getMisReservas: async (queryString?: string): Promise<ApiResponse<Reservation[]>> => {
    const endpoint = queryString ? `/reservations?${queryString}` : '/reservations';
    return apiGet<Reservation[]>(endpoint);
  },

  /**
   * POST /reservations
   */
  crearReserva: async (data: CreateReservationDto): Promise<ApiResponse<Reservation>> => {
    return apiPost<Reservation>('/reservations', data);
  },

  /**
   * POST /reservations/:id/confirm
   */
  pagarReserva: async (reservaId: string): Promise<ApiResponse<Reservation>> => {
    return apiPost<Reservation>(`/reservations/${reservaId}/confirm`);
  },

  /**
   * DELETE /reservations/:id
   */
  cancelarReserva: async (reservaId: string): Promise<ApiResponse<void>> => {
    return apiDelete<void>(`/reservations/${reservaId}`);
  },
};