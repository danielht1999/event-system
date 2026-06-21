// src/modules/event/application/queries/GetTicketTypesByEventHandler.ts
import { ITicketTypeRepository } from '../../domain/repositories/ITicketTypeRepository';

export class GetTicketTypesByEventHandler {
  constructor(private readonly ticketTypeRepository: ITicketTypeRepository) {}

  async execute(eventId: string) {
    // Lectura directa sin transacciones ni contextos transaccionales (tx)
    const tickets = await this.ticketTypeRepository.findByEventId(eventId);
    
    return tickets.map(t => ({
      id: t.id,
      nombre: t.nombre,
      precio: t.precio,
      capacidadMaxima: t.capacidadMaxima.value,
      reservasPendientes: t.reservasPendientes,
      reservasConfirmadas: t.reservasConfirmadas,
      cuposDisponibles: t.cuposDisponibles,
      estado: t.estado
    }));
  }
}