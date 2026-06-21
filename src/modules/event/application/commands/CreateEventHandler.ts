import { CreateEventCommand } from './CreateEventCommand';
import { IEventRepository } from '../../domain/repositories/IEventRepository';
import { ITicketTypeRepository } from '../../domain/repositories/ITicketTypeRepository';
import { IUnitOfWork } from '@shared/domain/IUnitOfWork'; 
import { Event } from '../../domain/entities/Event';
import { TicketType } from '../../domain/entities/TicketType';
import { DomainEventNames } from '@shared/domain/DomainEventNames';
import { IDomainEvent } from '@shared/domain/IDomainEvent';
import { v4 as uuidv4 } from 'uuid';

export class CreateEventHandler {
  constructor(
    private readonly uow: IUnitOfWork, //Inyectamos el UoW como dependencia principal
    private readonly eventRepository: IEventRepository,
    private readonly ticketTypeRepository: ITicketTypeRepository
  ) {}

  async execute(command: CreateEventCommand): Promise<Event> {
    // 1. Iniciamos la transacción atómica
    await this.uow.begin();

    try {
      const tx = this.uow.getTransactionContext();

      // 2. Crear la entidad descriptiva del Evento
      const event = Event.create(
      uuidv4(),
      command.titulo,
      command.descripcion,
      new Date(command.fecha),
      command.lugar,
      command.organizadorId
      );

      // Persistir el evento dentro de la transacción
      const savedEvent = await this.eventRepository.save(event, tx);
      
      const totalEventsCollected: IDomainEvent[] = [...event.pullDomainEvents()];

      // 3. Iterar y crear cada uno de los tipos de tickets asociados de manera segura
      for (const ticketInput of command.tickets) {
        const ticketType = TicketType.create(
        uuidv4(),
        savedEvent.id,
        ticketInput.nombre,
        ticketInput.precio,
        ticketInput.capacidadTotal
        );
        // Persistir el tipo de ticket dentro de la misma transacción
        await this.ticketTypeRepository.save(ticketType, tx);
        
        // Sumamos los eventos del ticket al acumulador general
        totalEventsCollected.push(...ticketType.pullDomainEvents());
      }

      // 4. Entregar de manera pasiva los eventos recolectados al Unit of Work
      this.uow.collectEvents(totalEventsCollected);

      // 5. Consolidar cambios en la base de datos y disparar la mensajería de forma segura
      await this.uow.commit();

      return savedEvent;
    } catch (error) {
      // Si algo falla, revertimos el evento y los N tickets creados a la vez. Cero basura.
      await this.uow.rollback();
      throw error;
    }
  }
}