// src/modules/event/application/commands/CreateTicketTypeHandler.ts

import { CreateTicketTypeCommand } from './CreateTicketTypeCommand';
import { IUnitOfWork } from '@shared/domain/IUnitOfWork';
import { IEventRepository } from '../../domain/repositories/IEventRepository';
import { ITicketTypeRepository } from '../../domain/repositories/ITicketTypeRepository';
import { TicketType } from '../../domain/entities/TicketType';
import { Capacity } from '../../domain/value-objects/Capacity';
import { EventNotFoundError } from '../../domain/errors';
import { ForbiddenError } from '@shared/domain/errors';

export class CreateTicketTypeHandler {
  constructor(
    private readonly uow: IUnitOfWork,
    private readonly eventRepository: IEventRepository,
    private readonly ticketTypeRepository: ITicketTypeRepository
  ) {}

  async execute(command: CreateTicketTypeCommand): Promise<{ ticketTypeId: string }> {
    await this.uow.begin();

    try {
      const tx = this.uow.getTransactionContext();

      // 1. Bloqueo del evento para evaluar invariantes de estado de la matriz
      const event = await this.eventRepository.findByIdForUpdate(command.eventId, tx);
      if (!event) throw new EventNotFoundError(command.eventId);

      if (event.organizadorId !== command.organizadorId) {
        throw new ForbiddenError('No autorizado para modificar los tickets de este evento');
      }

      if (event.estado === 'CANCELADA') {
        throw new Error('No se pueden añadir tickets a un evento cancelado');
      }

      // 2. Evaluar aforo acumulado con los tickets preexistentes
      const ticketsExistentes = await this.ticketTypeRepository.findByEventId(event.id, tx);
      const aforosActuales = ticketsExistentes.map(t => t.capacidadMaxima.value);
      
      event.validarAforoTotal(aforosActuales, command.capacidad);

      // 3. Crear el nuevo TicketType usando el Factory del dominio
      const nuevoTicketType = TicketType.create(
        command.ticketTypeId,
        event.id,
        command.nombre,
        command.precio,
        command.capacidad
      );

      // 4. Guardar y recolectar eventos
      await this.ticketTypeRepository.save(nuevoTicketType, tx);

      this.uow.collectEvents(nuevoTicketType.pullDomainEvents());
      await this.uow.commit();

      return { ticketTypeId: nuevoTicketType.id };
    } catch (error) {
      await this.uow.rollback();
      throw error;
    }
  }
}