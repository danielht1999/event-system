// src/modules/event/application/commands/UpdateTicketTypeHandler.ts

import { UpdateTicketTypeCommand } from './UpdateTicketTypeCommand';
import { IUnitOfWork } from '@shared/domain/IUnitOfWork';
import { IEventRepository } from '../../domain/repositories/IEventRepository';
import { ITicketTypeRepository } from '../../domain/repositories/ITicketTypeRepository';
import { EventNotFoundError, TicketTypeNotFoundError } from '../../domain/errors';
import { ForbiddenError } from '@shared/domain/errors';

export class UpdateTicketTypeHandler {
  constructor(
    private readonly uow: IUnitOfWork,
    private readonly eventRepository: IEventRepository,
    private readonly ticketTypeRepository: ITicketTypeRepository
  ) {}

  async execute(command: UpdateTicketTypeCommand): Promise<void> {
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

      // Aplicar la REGLA DE LA MATRIZ DE DECISIONES: Modificar Precio SOLO en BORRADOR
      if (command.precio !== undefined && event.estado !== 'BORRADOR') {
        throw new Error('No se puede modificar el precio de un ticket si el evento ya está publicado o cerrado');
      }

      // Mutación controlada a través del método semántico
      ticketType.actualizarDatosComerciales(command.nombre, command.precio);

      await this.ticketTypeRepository.save(ticketType, tx);
      
      this.uow.collectEvents(ticketType.pullDomainEvents());
      await this.uow.commit();
    } catch (error) {
      await this.uow.rollback();
      throw error;
    }
  }
}