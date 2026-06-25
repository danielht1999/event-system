// client/src/features/reservations/hooks/useReservations.ts

import { useState, useEffect, useCallback } from 'react';
import { reservationApi } from '../services/reservationApi';
import type { Reservation, CreateReservationDto } from '../types/Reservation';
import type { ReservationsQueryParams } from '../../../shared/hooks/useQueryParams';
import { useAuth } from '../../auth/hooks/useAuth';

export const useReservations = (params: ReservationsQueryParams = {}) => {
  const { token, isAuthenticated } = useAuth();
  const [reservas, setReservas] = useState<Reservation[]>([]);
  const [cargando, setCargando] = useState(true);
  const [total, setTotal] = useState(0);

  const page = params.page || 1;
  const limit = params.limit || 20;

  const cargarReservas = useCallback(async () => {
    // Si no está autenticado, no hacer la llamada
    if (!isAuthenticated || !token) {
      setReservas([]);
      setCargando(false);
      return;
    }

    setCargando(true);

    // Construir query string con los parámetros
    const queryParams = new URLSearchParams();
    queryParams.set('page', String(page));
    queryParams.set('limit', String(limit));

    if (params.status) queryParams.set('status', params.status);
    if (params.eventId) queryParams.set('eventId', params.eventId);
    if (params.userId) queryParams.set('userId', params.userId);
    if (params.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    const response = await reservationApi.getMisReservas(queryString);

    if (response.success && response.data) {
      setReservas(response.data);
      setTotal(response.meta?.total || response.data.length);
    }
    setCargando(false);
  }, [isAuthenticated, token, page, limit, params.status, params.eventId, params.userId, params.sortBy, params.sortOrder]);

  useEffect(() => {
    cargarReservas();
  }, [cargarReservas]);

  const recargar = () => {
    cargarReservas();
  };

  return { reservas, cargando, total, recargar };
};

export const useCrearReserva = () => {
  const [cargando, setCargando] = useState(false);

  const crearReserva = async (data: CreateReservationDto) => {
    setCargando(true);
    const response = await reservationApi.crearReserva(data);
    setCargando(false);
    return response;
  };

  return { crearReserva, cargando };
};

export const usePagarReserva = () => {
  const [cargando, setCargando] = useState(false);

  const pagarReserva = async (reservaId: string) => {
    setCargando(true);
    const response = await reservationApi.pagarReserva(reservaId);
    setCargando(false);
    return response;
  };

  return { pagarReserva, cargando };
};

export const useCancelarReserva = () => {
  const [cargando, setCargando] = useState(false);

  const cancelarReserva = async (reservaId: string) => {
    setCargando(true);
    const response = await reservationApi.cancelarReserva(reservaId);
    setCargando(false);
    return response;
  };

  return { cancelarReserva, cargando };
};