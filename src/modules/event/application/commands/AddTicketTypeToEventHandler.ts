// src/modules/event/application/commands/AddTicketTypeToEventHandler.ts

import { AddTicketTypeToEventCommand } from './AddTicketTypeToEventCommand';
import { IUnitOfWork } from '@shared/domain/IUnitOfWork';
import { IEventRepository } from '../../domain/repositories/IEventRepository';
import { ITicketTypeRepository } from '../../domain/repositories/ITicketTypeRepository';
import { TicketType } from '../../domain/entities/TicketType';
import { EventNotFoundError } from '../../domain/errors';
import { ForbiddenError } from '@shared/domain/errors';

export class AddTicketTypeToEventHandler {
  constructor(
    private readonly uow: IUnitOfWork,
    private readonly eventRepository: IEventRepository,
    private readonly ticketTypeRepository: ITicketTypeRepository
  ) {}

  async execute(command: AddTicketTypeToEventCommand): Promise<{ ticketTypeId: string }> {
    // Iniciamos la transacción en la capa de Aplicación
    await this.uow.begin();

    try {
      const tx = this.uow.getTransactionContext();

      // 1. Bloqueo pesimista del evento raíz
      const event = await this.eventRepository.findByIdForUpdate(command.eventId, tx);
      if (!event) throw new EventNotFoundError(command.eventId);

      // 2. Validar propiedad del evento
      if (event.organizadorId !== command.organizadorId) {
        throw new ForbiddenError('No tienes autorización para modificar este evento');
      }

      // 3. Validar estado según la Matriz (No permitido en CANCELADA o FINALIZADA)
      if (event.estado === 'CANCELADA') {
        throw new Error('No se pueden añadir tipos de ticket a un evento cancelado');
      }

      // 4. Obtener los tickets actuales bajo la misma transacción para calcular el aforo neto
      const ticketsExistentes = await this.ticketTypeRepository.findByEventId(event.id, tx);
      const aforosActuales = ticketsExistentes.map(t => t.capacidadMaxima.value);
      
      // 5. El Agregado Raíz ejecuta la validación macro cruzando datos con tu Capacity VO
      event.validarAforoTotal(aforosActuales, command.capacidad);

      // 6. Instanciar la nueva entidad a través de su Factory de Dominio
      const nuevoTicketType = TicketType.create(
        command.ticketTypeId,
        event.id,
        command.nombre,
        command.precio,
        command.capacidad
      );

      // 7. Persistir el nuevo hijo del agregado
      await this.ticketTypeRepository.save(nuevoTicketType, tx);

      // 8. Despachar eventos de dominio y consolidar la transacción
      this.uow.collectEvents(nuevoTicketType.pullDomainEvents());
      await this.uow.commit();

      return { ticketTypeId: nuevoTicketType.id };
    } catch (error) {
      // Si el aforo supera los 10,000 o el evento está cancelado, abortamos todo de forma segura
      await this.uow.rollback();
      throw error;
    }
  }
}