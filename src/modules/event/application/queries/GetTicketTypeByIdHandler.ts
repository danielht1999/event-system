// src/modules/event/application/queries/GetTicketTypeByIdHandler.ts
import { ITicketTypeRepository } from '../../domain/repositories/ITicketTypeRepository';
import { TicketTypeNotFoundError } from '../../domain/errors';

export class GetTicketTypeByIdHandler {
  constructor(private readonly ticketTypeRepository: ITicketTypeRepository) {}

  async execute(ticketTypeId: string) {
    const t = await this.ticketTypeRepository.findById(ticketTypeId);
    if (!t) throw new TicketTypeNotFoundError(ticketTypeId);

    return {
      id: t.id,
      eventId: t.eventId,
      nombre: t.nombre,
      precio: t.precio,
      capacidadMaxima: t.capacidadMaxima.value,
      cuposDisponibles: t.cuposDisponibles,
      estado: t.estado
    };
  }
}