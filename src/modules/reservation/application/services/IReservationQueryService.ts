// src/modules/reservation/application/services/IReservationQueryService.ts

export interface ReservationDTO {
  id: string
  eventoId: string
  eventoTitulo: string
  eventoFecha: Date
  eventoLugar: string
  cantidadTickets: number
  estado: string
  codigoTicket: string
  reservadoEn: Date
  pagadoEn?: Date
}

export interface TicketEmailDTO {
  to: string;
  clientName: string;
  eventName: string;
  eventDate: Date;
  eventLocation: string;
  ticketCode: string;
  ticketQuantity: number;
  totalAmount: number;
}

export interface IReservationQueryService {
  findByUser(userId: string): Promise<ReservationDTO[]>;
  findTicketEmailData(reservationId: string): Promise<TicketEmailDTO | null>;
}