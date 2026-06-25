// src/modules/event/application/commands/IncreaseTicketCapacityHandler.ts

import { IncreaseTicketCapacityCommand } from './IncreaseTicketCapacityCommand';
import { IUnitOfWork } from '@shared/domain/IUnitOfWork';
import { IEventRepository } from '../../domain/repositories/IEventRepository';
import { ITicketTypeRepository } from '../../domain/repositories/ITicketTypeRepository';
import { EventNotFoundError, TicketTypeNotFoundError } from '../../domain/errors';
import { ForbiddenError } from '@shared/domain/errors';
import { logger } from '@shared/infrastructure/logging/winston';
import { DomainEventNames } from '@shared/domain/DomainEventNames';
import { TicketTypeUpdatedPayload } from '@shared/domain/DomainEventPayloads';

export class IncreaseTicketCapacityHandler {
  constructor(
    private readonly uow: IUnitOfWork,
    private readonly eventRepository: IEventRepository,
    private readonly ticketTypeRepository: ITicketTypeRepository
  ) {}

  async execute(command: IncreaseTicketCapacityCommand): Promise<{ ticketTypeId: string }> {
    await this.uow.begin();

    try {
      const tx = this.uow.getTransactionContext();

      const startLock = performance.now();
      const event = await this.eventRepository.findByIdForUpdate(command.eventId, tx);
      if (!event) throw new EventNotFoundError(command.eventId);

      if (event.organizadorId !== command.organizadorId) {
        throw new ForbiddenError('No eres el dueño de este evento');
      }

      if (event.estado === 'CANCELADA') {
        throw new Error('No puedes aumentar aforo en un evento cancelado');
      }

      const ticketType = await this.ticketTypeRepository.findByIdForUpdate(command.ticketTypeId, tx);
      const duration = performance.now() - startLock;

      if (duration > 500) logger.warn('LOCK LENTO EN CAPACITY INCREASE', { durationMs: duration.toFixed(2) });

      if (!ticketType || ticketType.eventId !== event.id) {
        throw new TicketTypeNotFoundError(command.ticketTypeId);
      }

      const todosLosTickets = await this.ticketTypeRepository.findByEventId(event.id, tx);
      const aforosOtrosTickets = todosLosTickets
        .filter(t => t.id !== ticketType.id)
        .map(t => t.capacidadMaxima.value);

      event.validarAforoTotal(aforosOtrosTickets, command.nuevaCapacidad);

      ticketType.incrementarCapacidad(command.nuevaCapacidad);

      await this.ticketTypeRepository.save(ticketType, tx);
      
      // ✅ RECOLECTAR Y TIPAR EVENTOS
      const rawEvents = ticketType.pullDomainEvents();
      const typedEvents = rawEvents.map(e => {
        if (e.eventName === DomainEventNames.TICKET_TYPE.UPDATED) {
          return { ...e, data: e.data as TicketTypeUpdatedPayload };
        }
        return e;
      });

      this.uow.collectEvents(typedEvents);
      await this.uow.commit();

      return { ticketTypeId: ticketType.id };
    } catch (error) {
      await this.uow.rollback();
      throw error;
    }
  }
}