// src/modules/event/application/commands/PublishEventHandler.ts

import { PublishEventCommand } from './PublishEventCommand';
import { IUnitOfWork } from '@shared/domain/IUnitOfWork';
import { IEventRepository } from '../../domain/repositories/IEventRepository';
import { EventNotFoundError} from '../../domain/errors'; 
import { ForbiddenError } from '@shared/domain/errors';
import { logger } from '@shared/infrastructure/logging/winston';
import { DomainEventNames } from '@shared/domain/DomainEventNames';
import { EventStatusUpdatedPayload } from '@shared/domain/DomainEventPayloads';

export interface EventResult {
  eventId: string;
  estado: string;
}

export class PublishEventHandler {
  constructor(
    private readonly uow: IUnitOfWork,
    private readonly eventRepository: IEventRepository
  ) {}

  async execute(command: PublishEventCommand): Promise<EventResult> {
    await this.uow.begin();

    try {
      const tx = this.uow.getTransactionContext();

      const startLock = performance.now();
      const event = await this.eventRepository.findByIdForUpdate(command.eventId, tx);
      const lockDurationMs = performance.now() - startLock;

      if (lockDurationMs > 1000) {
        logger.error('LOCK CRÍTICO EVENT (PUBLISH)', { eventId: command.eventId, durationMs: lockDurationMs.toFixed(2) });
      } else if (lockDurationMs > 100) {
        logger.warn('LOCK LENTO EVENT (PUBLISH)', { eventId: command.eventId, durationMs: lockDurationMs.toFixed(2) });
      }

      if (!event) throw new EventNotFoundError(command.eventId);

      if (event.organizadorId !== command.organizerId) {
        throw new ForbiddenError('No tienes permisos para modificar este evento');
      }

      event.publicar();

      await this.eventRepository.save(event, tx);

      // ✅ RECOLECTAR Y TIPAR EVENTOS
      const rawEvents = [...event.pullDomainEvents()];
      const typedEvents = rawEvents.map(e => {
        if (e.eventName === DomainEventNames.EVENT.STATUS_UPDATED) {
          return { ...e, data: e.data as EventStatusUpdatedPayload };
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