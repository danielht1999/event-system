// src/modules/event/application/commands/UpdateEventHandler.ts

import { UpdateEventCommand } from './UpdateEventCommand';
import { IUnitOfWork } from '@shared/domain/IUnitOfWork';
import { IEventRepository } from '../../domain/repositories/IEventRepository';
import { EventNotFoundError } from '../../domain/errors';
import { ForbiddenError } from '@shared/domain/errors';
import { logger } from '@shared/infrastructure/logging/winston';
import { DomainEventNames } from '@shared/domain/DomainEventNames';
import { EventUpdatedPayload } from '@shared/domain/DomainEventPayloads';

export interface EventResult {
  eventId: string;
  estado: string;
}

export class UpdateEventHandler {
  constructor(
    private readonly uow: IUnitOfWork,
    private readonly eventRepository: IEventRepository
  ) {}

  async execute(command: UpdateEventCommand): Promise<EventResult> {
    await this.uow.begin();

    try {
      const tx = this.uow.getTransactionContext();

      const startLock = performance.now();
      const event = await this.eventRepository.findByIdForUpdate(command.eventId, tx);
      const lockDurationMs = performance.now() - startLock;

      if (lockDurationMs > 1000) {
        logger.error('LOCK CRÍTICO EVENT (UPDATE)', { 
          eventId: command.eventId, 
          durationMs: lockDurationMs.toFixed(2) 
        });
      } else if (lockDurationMs > 100) {
        logger.warn('LOCK LENTO EVENT (UPDATE)', { 
          eventId: command.eventId, 
          durationMs: lockDurationMs.toFixed(2) 
        });
      }

      if (!event) {
        throw new EventNotFoundError(command.eventId);
      }

      if (event.organizadorId !== command.organizadorId) {
        throw new ForbiddenError('No tienes permisos para modificar este evento');
      }

      event.cambiarDetalles({
        titulo: command.titulo,
        descripcion: command.descripcion,
        lugar: command.lugar,
        fecha: command.fecha ? new Date(command.fecha) : undefined,
        capacidadTotal: command.capacidadTotal 
      });

      await this.eventRepository.save(event, tx);

      // ✅ RECOLECTAR Y TIPAR EVENTOS
      const rawEvents = [...event.pullDomainEvents()];
      const typedEvents = rawEvents.map(e => {
        if (e.eventName === DomainEventNames.EVENT.UPDATED) {
          return { ...e, data: e.data as EventUpdatedPayload };
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