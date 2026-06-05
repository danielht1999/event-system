// src/modules/event/application/commands/CreateEventHandler.ts
import { CreateEventCommand } from './CreateEventCommand';
import { IEventRepository } from '../../domain/repositories/IEventRepository';
import { Event } from '../../domain/entities/Event';
import { v4 as uuidv4 } from 'uuid';
import { EventDate } from '../../domain/value-objects/EventDate';
import { Capacity } from '../../domain/value-objects/Capacity';

export class CreateEventHandler {
  constructor(private eventRepository: IEventRepository) {}

  async execute(command: CreateEventCommand) {
    const event = new Event(
      uuidv4(),
      command.titulo,
      command.descripcion,
      EventDate.create(new Date(command.fecha)),
      command.lugar,
      new Capacity(command.capacidadTotal),
      command.precio,
      command.organizadorId,
      0,  // reservasConfirmadas
      0   // reservasPendientes
    );

    // Apuntamos en la entidad que el evento ha sido creado/actualizado.
    // Esto guardará 'EventStatusUpdated' en la bolsa interna de la entidad.
    event.recordEvent('EventStatusUpdated', {
      eventId: event.id,
      organizerId: event.organizadorId
    });

    // Guardamos en la base de datos. 
    // El método save() de PostgresEventRepository se encargará de vaciar la bolsa y avisar al Bus.
    const result = await this.eventRepository.save(event);

    return result;
  }
}