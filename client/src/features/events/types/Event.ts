// client/src/features/events/types/Event.ts

// ============================================
// TIPOS EXISTENTES
// ============================================

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
  tickets: TicketType[];
  // ============================================================
  // CAMPOS DEL DTO DE LISTADO (opcionales)
  // Vienen del backend cuando se usa EventoListDTO
  // ============================================================
  precioMinimo?: number;     // Precio más barato de todos los tickets
  cuposDisponibles?: number; // Suma de cupos disponibles de todos los tickets
}

export interface CrearEventoData {
  titulo: string;
  lugar: string;
  capacidadTotal: number;
  descripcion?: string;
  fecha?: string;
  tickets: Omit<TicketInput, 'id'>[];
}

// ============================================
// DTO PARA PANEL DE ORGANIZADOR
// ============================================

/**
 * DTO específico para el panel de gestión del organizador
 * Contiene toda la información necesaria incluyendo tickets completos
 * y métricas agregadas para la gestión
 */
export interface EventManagementDTO extends Omit<Evento, 'precioMinimo' | 'cuposDisponibles'> {
  // Re-definimos estos campos como obligatorios para el management
  precioMinimo: number;
  cuposDisponibles: number;
  // Aseguramos que los tickets estén completos
  tickets: TicketType[];
}

// ============================================
// NUEVOS TIPOS PARA EL FORMULARIO
// ============================================

export interface TicketInput {
  id: string;           // Temporal para React
  nombre: string;
  precio: number;
  capacidad: number;
}

export interface EventFormData {
  titulo: string;
  descripcion?: string;
  lugar: string;
  fecha?: string;
  capacidadTotal: number;
  tickets: Omit<TicketInput, 'id'>[];
}

export interface TicketItemProps {
  ticket: TicketInput;
  index: number;
  isOnlyTicket: boolean;
  capacidadTotal: number;
  onUpdate: (index: number, field: keyof TicketInput, value: string | number) => void;
  onRemove: (index: number) => void;
  onBlur?: () => void;
  disabled?: boolean;
}

export interface TicketSectionProps {
  tickets: TicketInput[];
  capacidadTotal: number;
  onTicketsChange: (tickets: TicketInput[]) => void;
  onCapacidadTotalChange: (value: number) => void;
  disabled?: boolean;
}

// ============================================
// CONSTANTES
// ============================================

export const LIMITES = {
  CAPACIDAD_TOTAL: {
    MIN: 1,
    MAX: 10000
  },
  TICKET: {
    CAPACIDAD_MIN: 1,
    PRECIO_MIN: 0,
    NOMBRE_MAX: 100,
    MINIMO_TICKETS: 1
  }
} as const;

// ============================================
// FUNCIONES HELPER
// ============================================

export const crearTicketVacio = (): TicketInput => ({
  id: crypto.randomUUID(),
  nombre: '',
  precio: 0,
  capacidad: 0
});

export const calcularCapacidadAsignada = (tickets: TicketInput[]): number => {
  return tickets.reduce((sum, ticket) => sum + ticket.capacidad, 0);
};

export const excedeCapacidadTotal = (tickets: TicketInput[], capacidadTotal: number): boolean => {
  return calcularCapacidadAsignada(tickets) > capacidadTotal;
};

export const obtenerCuposDisponibles = (tickets: TicketInput[], capacidadTotal: number): number => {
  return capacidadTotal - calcularCapacidadAsignada(tickets);
};

export const ticketInputToApi = (ticket: TicketInput): Omit<TicketInput, 'id'> => {
  const { id, ...rest } = ticket;
  return rest;
};

export const ticketTypeToInput = (ticket: TicketType): TicketInput => ({
  id: crypto.randomUUID(),
  nombre: ticket.nombre,
  precio: ticket.precio,
  capacidad: ticket.capacidadMaxima
});

export const eventoToFormData = (evento: Evento): EventFormData => {
  const capacidadTotal = evento.tickets.reduce(
    (sum, t) => sum + t.capacidadMaxima, 
    0
  );
  
  return {
    titulo: evento.titulo,
    descripcion: evento.descripcion,
    lugar: evento.lugar,
    fecha: evento.fecha,
    capacidadTotal,
    tickets: evento.tickets.map(ticketTypeToInput)
  };
};

// ============================================
// HELPER PARA CONVERTIR ManagementDTO a Evento
// ============================================

export const managementDTOToEvento = (dto: EventManagementDTO): Evento => {
  return {
    ...dto,
    // Ya tiene todos los campos requeridos
  };
};

// ============================================
// CONSTANTES DE TICKETS
// ============================================

export const DEFAULT_TICKET_NAMES = [
  "General",
  "VIP",
  "Preferente",
  "Estudiante",
  "Early Bird"
] as const;

export type TicketName = typeof DEFAULT_TICKET_NAMES[number];

// Opción "Otro" para valores personalizados
export const TICKET_NAME_OPTIONS = [
  ...DEFAULT_TICKET_NAMES,
  "Otro"
] as const;