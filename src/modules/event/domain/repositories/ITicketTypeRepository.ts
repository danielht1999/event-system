import { TicketType } from '../entities/TicketType';

export interface ITicketTypeRepository {
  /**
   * Persiste o actualiza un TicketType. Soporta contexto transaccional opcional.
   */
  save(ticketType: TicketType, transactionContext?: unknown): Promise<TicketType>;

  /**
   * Busca un TicketType aplicando un bloqueo pesimista (FOR UPDATE). Requiere transacción mandatoria.
   */
  findByIdForUpdate(id: string, transactionContext: unknown): Promise<TicketType | null>;

  /**
   * Busca un TicketType por su ID único.
   */
  findById(id: string, transactionContext?: unknown): Promise<TicketType | null>;

  /**
   * Obtiene todos los tipos de tickets configurados para un evento específico.
   */
  findByEventId(eventId: string, transactionContext?: unknown): Promise<TicketType[]>;
}