// src/modules/event/application/queries/GetEventByIdHandler.ts
import { IEventRepository } from '../../domain/repositories/IEventRepository';
import { EventNotFoundError } from '../../domain/errors';

export class GetEventByIdHandler {
  constructor(private readonly eventRepository: IEventRepository) {}

  async execute(eventId: string) {
    const event = await this.eventRepository.findById(eventId);
    if (!event) throw new EventNotFoundError(eventId);

    return {
      id: event.id,
      titulo: event.titulo,
      descripcion: event.descripcion,
      fecha: event.fecha.value.toISOString(),
      lugar: event.lugar,
      organizadorId: event.organizadorId,
      estado: event.estado
    };
  }
}