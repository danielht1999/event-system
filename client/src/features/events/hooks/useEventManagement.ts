// client/src/features/events/hooks/useEventManagement.ts

import { useState, useEffect, useCallback } from 'react';
import { eventApi } from '../services/eventApi';
import type { EventManagementDTO } from '../types/Event';

export const useEventManagement = () => {
  const [eventos, setEventos] = useState<EventManagementDTO[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarEventos = useCallback(async () => {
    setCargando(true);
    setError(null);

    try {
      const response = await eventApi.getEventosManagement();
      
      console.log('📦 Eventos Management:', response);

      if (response.success && response.data) {
        setEventos(response.data);
      } else {
        setError(response.message || 'Error al cargar eventos');
        setEventos([]);
      }
    } catch (err) {
      setError('Error de conexión');
      setEventos([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarEventos();
  }, [cargarEventos]);

  return {
    eventos,
    cargando,
    error,
    recargar: cargarEventos,
  };
};