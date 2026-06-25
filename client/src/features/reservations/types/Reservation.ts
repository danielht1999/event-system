// Definimos los estados válidos exactos que maneja el ciclo de vida en tu Backend
export type ReservationStatus = 'PENDIENTE_PAGO' | 'CONFIRMADA' | 'CANCELADA' | 'EXPIRADA';

export interface Reservation {
  id: string;
  userId: string;
  ticketTypeId: string; // Refleja el nuevo cambio de arquitectura (Reservation -> TicketType)
  cantidadTickets: number;
  estado: ReservationStatus;
  codigoTicket: string;
  createdAt: string;
  
  // Propiedades aplanadas que el QueryService o el BFF inyectan para facilitar la UI
  eventoId: string;
  eventoTitulo: string;
  eventoFecha: string;
}

// Contrato para cuando creas una nueva reservación (payload del POST)
export interface CreateReservationDto {
  eventoId: string; 
  ticketTypeId: string;
  cantidadTickets: number;
}

// Tipo de respuesta esperado por el hook de la feature que incluye la metadata de paginación
export interface ReservationsResponse {
  reservaciones: Reservation[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}