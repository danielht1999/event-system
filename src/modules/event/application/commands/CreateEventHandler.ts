// src/modules/event/application/commands/CreateEventHandler.ts
import { CreateEventCommand } from './CreateEventCommand';
import { IEventRepository } from '../../domain/repositories/IEventRepository';
import { ITicketTypeRepository } from '../../domain/repositories/ITicketTypeRepository';
import { Event } from '../../domain/entities/Event';
import { TicketType } from '../../domain/entities/TicketType';
import { EventDate } from '../../domain/value-objects/EventDate';
import { Capacity } from '../../domain/value-objects/Capacity'; // Re-incorporado
import { DomainEventNames } from '@shared/domain/DomainEventNames';
import { v4 as uuidv4 } from 'uuid';

export class CreateEventHandler {
  constructor(
    private readonly eventRepository: IEventRepository,
    private readonly ticketTypeRepository: ITicketTypeRepository
  ) {}

  async execute(command: CreateEventCommand) {
    const event = new Event(
      uuidv4(),
      command.titulo,
      command.descripcion,
      EventDate.create(new Date(command.fecha)),
      command.lugar,
      command.organizadorId
    );

    event.recordEvent(
      DomainEventNames.EVENT.CREATED,
      {
        eventId: event.id,
        organizerId: event.organizadorId
      }
    );

    const savedEvent = await this.eventRepository.save(event);
    const generalTicket = new TicketType(
      uuidv4(),
      savedEvent.id,
      'General',
      command.precio,
      new Capacity(command.capacidadTotal), 
      0,
      0,
      'ACTIVO'
    );

    generalTicket.recordEvent(
      DomainEventNames.TICKET_TYPE.CREATED,
      {
        ticketTypeId: generalTicket.id,
        eventId: savedEvent.id
      }
    );

    await this.ticketTypeRepository.save(generalTicket);

    return savedEvent;
  }
}