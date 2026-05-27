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

export interface IReservationQueryService {
  findByUser(userId: string): Promise<ReservationDTO[]>
}