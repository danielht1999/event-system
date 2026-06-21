// src/modules/event/application/commands/DeactivateTicketTypeHandler.ts
import { DeactivateTicketTypeCommand } from './DeactivateTicketTypeCommand';
import { IUnitOfWork } from '@shared/domain/IUnitOfWork';
import { IEventRepository } from '../../domain/repositories/IEventRepository';
import { ITicketTypeRepository } from '../../domain/repositories/ITicketTypeRepository';
import { EventNotFoundError, TicketTypeNotFoundError } from '../../domain/errors';
import { ForbiddenError } from '@shared/domain/errors';

export class DeactivateTicketTypeHandler {
  constructor(
    private readonly uow: IUnitOfWork,
    private readonly eventRepository: IEventRepository,
    private readonly ticketTypeRepository: ITicketTypeRepository
  ) {}

  async execute(command: DeactivateTicketTypeCommand): Promise<void> {
    await this.uow.begin();
    try {
      const tx = this.uow.getTransactionContext();

      const event = await this.eventRepository.findByIdForUpdate(command.eventId, tx);
      if (!event) throw new EventNotFoundError(command.eventId);
      if (event.organizadorId !== command.organizadorId) {
        throw new ForbiddenError('No tienes permisos sobre este evento');
      }

      const ticketType = await this.ticketTypeRepository.findByIdForUpdate(command.ticketTypeId, tx);
      if (!ticketType || ticketType.eventId !== event.id) {
        throw new TicketTypeNotFoundError(command.ticketTypeId);
      }

      // Ejecuta el método semántico del dominio que muta el estado a 'DESACTIVADO'
      ticketType.desactivar();

      await this.ticketTypeRepository.save(ticketType, tx);
      await this.uow.commit();
    } catch (error) {
      await this.uow.rollback();
      throw error;
    }
  }
}