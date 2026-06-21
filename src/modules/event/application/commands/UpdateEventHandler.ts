// src/modules/event/application/commands/UpdateEventHandler.ts

import { UpdateEventCommand } from './UpdateEventCommand';
import { IUnitOfWork } from '@shared/domain/IUnitOfWork';
import { IEventRepository } from '../../domain/repositories/IEventRepository';
import { EventNotFoundError } from '../../domain/errors';
import { ForbiddenError } from '@shared/domain/errors';
import { logger } from '@shared/infrastructure/logging/winston'; 

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

      // 1. Obtener y bloquear con telemetría de rendimiento
      const startLock = performance.now();
      const event = await this.eventRepository.findByIdForUpdate(command.eventId, tx);
      const lockDurationMs = performance.now() - startLock;

      if (lockDurationMs > 1000) {
        logger.error('LOCK CRÍTICO EVENT (UPDATE)', { eventId: command.eventId, durationMs: lockDurationMs.toFixed(2) });
      } else if (lockDurationMs > 100) {
        logger.warn('LOCK LENTO EVENT (UPDATE)', { eventId: command.eventId, durationMs: lockDurationMs.toFixed(2) });
      }

      if (!event) throw new EventNotFoundError(command.eventId);

      // 2. Validar propiedad
      if (event.organizadorId !== command.organizadorId) {
        throw new ForbiddenError('No tienes permisos para modificar este evento');
      }

      // 3. Modificación explícita a través de la regla del dominio (Pasando solo tipos nativos)
      event.cambiarDetalles({
        titulo: command.titulo,
        descripcion: command.descripcion,
        lugar: command.lugar,
        fecha: command.fecha ? new Date(command.fecha) : undefined 
      });

      // 4. Persistir cambios
      await this.eventRepository.save(event, tx);

      // 5. Recolección pasiva explícita de eventos
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