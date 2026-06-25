// client/src/features/events/types/Event.ts

export interface TicketType {
  id: string;
  nombre: string;
  precio: number;
  capacidadMaxima: number;
  cuposDisponibles: number;
  reservasPendientes: number;
  reservasConfirmadas: number;
  estado: 'ACTIVO' | 'AGOTADO' | 'DESACTIVADO';
}

export interface Evento {
  id: string;
  titulo: string;
  lugar: string;
  descripcion?: string;
  fecha?: string;
  organizadorId?: string;
  estado?: 'BORRADOR' | 'PUBLICADA' | 'CANCELADA';
  tickets: TicketType[];  // ✅ Obligatorio
  precio?: number;        // ⚠️ Opcional, para compatibilidad
  cuposDisponibles?: number; // ⚠️ Opcional, para compatibilidad
}

export interface CrearEventoData {
  titulo: string;
  lugar: string;
  precio: number;
  capacidadTotal: number
  descripcion?: string;
  fecha?: string;
}