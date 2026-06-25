// src/modules/event/application/commands/CreateEventHandler.ts

import { CreateEventCommand } from './CreateEventCommand';
import { IEventRepository } from '../../domain/repositories/IEventRepository';
import { ITicketTypeRepository } from '../../domain/repositories/ITicketTypeRepository';
import { IUnitOfWork } from '@shared/domain/IUnitOfWork';
import { Event } from '../../domain/entities/Event';
import { TicketType } from '../../domain/entities/TicketType';
import { IDomainEvent } from '@shared/domain/IDomainEvent';
import { v4 as uuidv4 } from 'uuid';
import { DomainEventNames } from '@shared/domain/DomainEventNames';
import { 
  EventCreatedPayload,
  TicketTypeCreatedPayload
} from '@shared/domain/DomainEventPayloads';

export interface CreateEventResult {
  eventId: string;
  estado: string;
}

export class CreateEventHandler {
  constructor(
    private readonly uow: IUnitOfWork,
    private readonly eventRepository: IEventRepository,
    private readonly ticketTypeRepository: ITicketTypeRepository
  ) {}

  async execute(command: CreateEventCommand): Promise<CreateEventResult> {
    await this.uow.begin();
    try {
      const tx = this.uow.getTransactionContext();

      const event = Event.create(
        uuidv4(),
        command.titulo,
        command.descripcion,
        new Date(command.fecha),
        command.lugar,
        command.capacidadTotal,
        command.organizadorId
      );

      const capacidadAsignada = command.tickets.reduce((sum, ticket) => sum + ticket.capacidad, 0);
      event.validarDistribucionInicial(capacidadAsignada);

      await this.eventRepository.save(event, tx);

      // ✅ Recolectar eventos del Event (incluye EVENT.CREATED)
      const rawEvents: IDomainEvent[] = [...event.pullDomainEvents()];

      for (const ticketInput of command.tickets) {
        const ticketType = TicketType.create(
          uuidv4(),
          event.id,
          ticketInput.nombre,
          ticketInput.precio,
          ticketInput.capacidad
        );

        await this.ticketTypeRepository.save(ticketType, tx);
        // ✅ Recolectar eventos del TicketType (incluye TICKET_TYPE.CREATED)
        rawEvents.push(...ticketType.pullDomainEvents());
      }

      // ✅ TIPAR EVENTOS
      const typedEvents = rawEvents.map(e => {
        if (e.eventName === DomainEventNames.EVENT.CREATED) {
          return { ...e, data: e.data as EventCreatedPayload };
        }
        if (e.eventName === DomainEventNames.TICKET_TYPE.CREATED) {
          return { ...e, data: e.data as TicketTypeCreatedPayload };
        }
        return e;
      });

      this.uow.collectEvents(typedEvents);
      await this.uow.commit();

      return {
        eventId: event.id,
        estado: event.estado
      };
    } catch (error) {
      await this.uow.rollback();
      throw error;
    }
  }
}