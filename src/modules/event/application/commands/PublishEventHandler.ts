// src/modules/event/application/commands/PublishEventHandler.ts

import { PublishEventCommand } from './PublishEventCommand';
import { IUnitOfWork } from '@shared/domain/IUnitOfWork';
import { IEventRepository } from '../../domain/repositories/IEventRepository';
import { EventNotFoundError} from '../../domain/errors'; 
import { ForbiddenError } from '@shared/domain/errors';
import { logger } from '@shared/infrastructure/logging/winston';

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

      // 1. Obtener y bloquear el evento de forma pesimista con telemetría
      const startLock = performance.now();
      const event = await this.eventRepository.findByIdForUpdate(command.eventId, tx);
      const lockDurationMs = performance.now() - startLock;

      if (lockDurationMs > 1000) {
        logger.error('LOCK CRÍTICO EVENT (PUBLISH)', { eventId: command.eventId, durationMs: lockDurationMs.toFixed(2) });
      } else if (lockDurationMs > 100) {
        logger.warn('LOCK LENTO EVENT (PUBLISH)', { eventId: command.eventId, durationMs: lockDurationMs.toFixed(2) });
      }

      if (!event) throw new EventNotFoundError(command.eventId);

      // 2. Validar que el organizador sea el dueño del evento
      if (event.organizadorId !== command.organizerId) {
        throw new ForbiddenError('No tienes permisos para modificar este evento');
      }

      // 3. Ejecutar comportamiento del dominio
      event.publicar();

      // 4. Persistir mutaciones
      await this.eventRepository.save(event, tx);

      // 5. Recolección explícita de eventos de dominio
      const events = [...event.pullDomainEvents()];
      this.uow.collectEvents(events);

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