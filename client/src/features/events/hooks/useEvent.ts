import { useState, useEffect } from 'react';

import { eventApi } from '../services/eventApi';
import type {
  Evento,
  CrearEventoData,
} from '../types/Event';

export const useEvent = (id: string) => {
  const [evento, setEvento] = useState<Evento | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!id) return;

    const cargarEvento = async () => {
      setCargando(true);

      const response = await eventApi.getEvento(id);

      if (response.success && response.data) {
        setEvento(response.data);
      }

      setCargando(false);
    };

    cargarEvento();
  }, [id]);

  return {
    evento,
    cargando,
  };
};

export const useCrearEvento = () => {
  const [cargando, setCargando] = useState(false);

  const crearEvento = async (data: CrearEventoData) => {
    setCargando(true);

    const response = await eventApi.crearEvento(data);

    setCargando(false);

    return response;
  };

  return {
    crearEvento,
    cargando,
  };
};

export const useActualizarEvento = () => {
  const [cargando, setCargando] = useState(false);

  const actualizarEvento = async (
    id: string,
    data: Partial<CrearEventoData>
  ) => {
    setCargando(true);

    const response = await eventApi.actualizarEvento(
      id,
      data
    );

    setCargando(false);

    return response;
  };

  return {
    actualizarEvento,
    cargando,
  };
};

export const usePublicarEvento = () => {
  const [cargando, setCargando] = useState(false);

  const publicarEvento = async (id: string) => {
    setCargando(true);

    const response = await eventApi.publicarEvento(id);

    setCargando(false);

    return response;
  };

  return {
    publicarEvento,
    cargando,
  };
};

export const useCancelarEvento = () => {
  const [cargando, setCargando] = useState(false);

  const cancelarEvento = async (id: string) => {
    setCargando(true);

    const response = await eventApi.cancelarEvento(id);

    setCargando(false);

    return response;
  };

  return {
    cancelarEvento,
    cargando,
  };
};