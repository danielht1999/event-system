// src/modules/event/application/commands/AddTicketTypeToEventHandler.ts

import { AddTicketTypeToEventCommand } from './AddTicketTypeToEventCommand';
import { IUnitOfWork } from '@shared/domain/IUnitOfWork';
import { IEventRepository } from '../../domain/repositories/IEventRepository';
import { ITicketTypeRepository } from '../../domain/repositories/ITicketTypeRepository';
import { TicketType } from '../../domain/entities/TicketType';
import { EventNotFoundError } from '../../domain/errors';
import { ForbiddenError } from '@shared/domain/errors';
import { DomainEventNames } from '@shared/domain/DomainEventNames';
import { TicketTypeCreatedPayload } from '@shared/domain/DomainEventPayloads';

export class AddTicketTypeToEventHandler {
  constructor(
    private readonly uow: IUnitOfWork,
    private readonly eventRepository: IEventRepository,
    private readonly ticketTypeRepository: ITicketTypeRepository
  ) {}

  async execute(command: AddTicketTypeToEventCommand): Promise<{ ticketTypeId: string }> {
    await this.uow.begin();

    try {
      const tx = this.uow.getTransactionContext();

      const event = await this.eventRepository.findByIdForUpdate(command.eventId, tx);
      if (!event) throw new EventNotFoundError(command.eventId);

      if (event.organizadorId !== command.organizadorId) {
        throw new ForbiddenError('No tienes autorización para modificar este evento');
      }

      if (event.estado === 'CANCELADA') {
        throw new Error('No se pueden añadir tipos de ticket a un evento cancelado');
      }

      const ticketsExistentes = await this.ticketTypeRepository.findByEventId(event.id, tx);
      const aforosActuales = ticketsExistentes.map(t => t.capacidadMaxima.value);
      
      event.validarAforoTotal(aforosActuales, command.capacidad);

      const nuevoTicketType = TicketType.create(
        command.ticketTypeId,
        event.id,
        command.nombre,
        command.precio,
        command.capacidad
      );

      await this.ticketTypeRepository.save(nuevoTicketType, tx);

      // ✅ RECOLECTAR Y TIPAR EVENTOS
      const rawEvents = nuevoTicketType.pullDomainEvents();
      const typedEvents = rawEvents.map(e => {
        if (e.eventName === DomainEventNames.TICKET_TYPE.CREATED) {
          return { ...e, data: e.data as TicketTypeCreatedPayload };
        }
        return e;
      });

      this.uow.collectEvents(typedEvents);
      await this.uow.commit();

      return { ticketTypeId: nuevoTicketType.id };
    } catch (error) {
      await this.uow.rollback();
      throw error;
    }
  }
}