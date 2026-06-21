// src/modules/event/application/queries/GetEventAvailabilityHandler.ts
import { ITicketTypeRepository } from '../../domain/repositories/ITicketTypeRepository';

export class GetEventAvailabilityHandler {
  constructor(private readonly ticketTypeRepository: ITicketTypeRepository) {}

  async execute(eventId: string) {
    const tickets = await this.ticketTypeRepository.findByEventId(eventId);

    const desgloseAvailability = tickets.map(t => ({
      ticketTypeId: t.id,
      nombre: t.nombre,
      estado: t.estado,
      totalAforo: t.capacidadMaxima.value,
      disponibles: t.cuposDisponibles,
      agotado: t.estaLleno()
    }));

    const totalDisponiblesGlobal = desgloseAvailability.reduce((acc, t) => acc + t.disponibles, 0);

    return {
      eventId,
      tieneCuposDisponibles: totalDisponiblesGlobal > 0,
      tickets: desgloseAvailability
    };
  }
}