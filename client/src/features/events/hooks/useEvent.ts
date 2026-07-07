// client/src/features/events/hooks/useEvent.ts

import { useState, useEffect, useCallback } from 'react';
import { eventApi } from '../services/eventApi';
import type {
  Evento,
  CrearEventoData,
} from '../types/Event';

export const useEvent = (id: string) => {
  const [evento, setEvento] = useState<Evento | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarEvento = useCallback(async () => {
    if (!id) {
      setCargando(false);
      return;
    }

    setCargando(true);
    setError(null);

    try {
      const response = await eventApi.getEvento(id);

      if (response.success && response.data) {
        setEvento(response.data);
      } else {
        setError(response.message || 'Error al cargar el evento');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    cargarEvento();
  }, [cargarEvento]);

  return {
    evento,
    cargando,
    error,
    recargar: cargarEvento,
  };
};

export const useCrearEvento = () => {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const crearEvento = async (data: CrearEventoData) => {
    setCargando(true);
    setError(null);

    try {
      const response = await eventApi.crearEvento(data);
      return response;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al crear el evento';
      setError(errorMsg);
      return {
        success: false,
        message: errorMsg,
      };
    } finally {
      setCargando(false);
    }
  };

  return {
    crearEvento,
    cargando,
    error,
  };
};

export const useActualizarEvento = () => {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actualizarEvento = async (
    id: string,
    data: Partial<CrearEventoData>
  ) => {
    setCargando(true);
    setError(null);

    try {
      const response = await eventApi.actualizarEvento(id, data);
      return response;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al actualizar el evento';
      setError(errorMsg);
      return {
        success: false,
        message: errorMsg,
      };
    } finally {
      setCargando(false);
    }
  };

  return {
    actualizarEvento,
    cargando,
    error,
  };
};

export const usePublicarEvento = () => {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const publicarEvento = async (id: string) => {
    setCargando(true);
    setError(null);

    try {
      const response = await eventApi.publicarEvento(id);
      return response;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al publicar el evento';
      setError(errorMsg);
      return {
        success: false,
        message: errorMsg,
      };
    } finally {
      setCargando(false);
    }
  };

  return {
    publicarEvento,
    cargando,
    error,
  };
};

export const useCancelarEvento = () => {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelarEvento = async (id: string) => {
    setCargando(true);
    setError(null);

    try {
      const response = await eventApi.cancelarEvento(id);
      return response;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cancelar el evento';
      setError(errorMsg);
      return {
        success: false,
        message: errorMsg,
      };
    } finally {
      setCargando(false);
    }
  };

  return {
    cancelarEvento,
    cargando,
    error,
    // ❌ ELIMINADO: recargar no existe aquí
  };
};