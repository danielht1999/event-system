// client/src/features/events/hooks/useEvents.ts

import { useState, useEffect, useCallback } from 'react';
import { eventApi } from '../services/eventApi';
import type { Evento } from '../types/Event';
import type { EventsQueryParams } from '../../../shared/hooks/useQueryParams';

export const useEvents = (params: EventsQueryParams = {}) => {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [total, setTotal] = useState(0);

  const page = params.page || 1;
  const limit = params.limit || 20;

  const cargarEventos = useCallback(async () => {
    setCargando(true);

    // ✅ Construir query string con los parámetros
    const queryParams = new URLSearchParams();
    queryParams.set('page', String(page));
    queryParams.set('limit', String(limit));

    if (params.status) queryParams.set('status', params.status);
    if (params.owner) queryParams.set('owner', params.owner);
    if (params.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    const response = await eventApi.getEventos(queryString);

    if (response.success && response.data) {
      setEventos(response.data);
      setTotal(response.meta?.total || 0);
    }

    setCargando(false);
  }, [page, limit, params.status, params.owner, params.sortBy, params.sortOrder]);

  useEffect(() => {
    cargarEventos();
  }, [cargarEventos]);

  return {
    eventos,
    cargando,
    total,
    recargar: cargarEventos,
  };
};

export const useMisEventos = (params: EventsQueryParams = {}) => {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [total, setTotal] = useState(0);

  const page = params.page || 1;
  const limit = params.limit || 20;

  const cargarMisEventos = useCallback(async () => {
    setCargando(true);

    // ✅ Siempre incluir owner=me para obtener los eventos del organizador
    const queryParams = new URLSearchParams();
    queryParams.set('page', String(page));
    queryParams.set('limit', String(limit));
    queryParams.set('owner', 'me');

    if (params.status) queryParams.set('status', params.status);
    if (params.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    const response = await eventApi.getEventos(queryString);

    if (response.success && response.data) {
      setEventos(response.data);
      setTotal(response.meta?.total || 0);
    }

    setCargando(false);
  }, [page, limit, params.status, params.sortBy, params.sortOrder]);

  useEffect(() => {
    cargarMisEventos();
  }, [cargarMisEventos]);

  return {
    eventos,
    cargando,
    total,
    recargar: cargarMisEventos,
  };
};