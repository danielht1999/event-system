// src/modules/event/domain/repositories/ITicketTypeRepository.ts

import { TicketType } from '../entities/TicketType';

export interface ITicketTypeRepository {
  /**
   * Persiste o sincroniza un TicketType.
   */
  save(ticketType: TicketType): Promise<TicketType>;

  /**
   * Recupera un TicketType por su identificador.
   */
  findById(id: string): Promise<TicketType | null>;

  /**
   * Recupera un TicketType aplicando bloqueo FOR UPDATE.
   * Utilizado durante procesos de reserva concurrente.
   */
  findByIdForUpdate(id: string): Promise<TicketType | null>;

  /**
   * Obtiene todos los TicketTypes pertenecientes a un evento.
   */
  findByEventId(eventId: string): Promise<TicketType[]>;
}