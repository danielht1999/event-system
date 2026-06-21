import { Reservation } from '../entities/Reservation';

export interface IReservationRepository {
  /**
   * Sincroniza el estado de una reservación individual (Upsert).
   * Puede participar en una transacción si se provee el contexto.
   */
  save(reservation: Reservation, transactionContext?: unknown): Promise<Reservation>; 

  /**
   * Busca una reservación por su ID.
   */
  findById(id: string, transactionContext?: unknown): Promise<Reservation | null>;

  /**
   * Bloquea de forma pesimista (FOR UPDATE) una reservación dentro de una transacción.
   */
  findByIdForUpdate(id: string, transactionContext: unknown): Promise<Reservation | null>; 

  /**
   * Recupera todas las reservaciones en estado 'PENDIENTE_PAGO' que han superado el límite de 15 minutos.
   * Este método es de solo lectura; la expiración real se procesa en el Handler en memoria.
   */
  findObsoleteReservations(transactionContext?: unknown): Promise<Reservation[]>;

  findByEvent(eventId: string, transactionContext?: unknown): Promise<Reservation[]>;
  findByUser(userId: string, transactionContext?: unknown): Promise<Reservation[]>;
  findByTicketCode(code: string, transactionContext?: unknown): Promise<Reservation | null>;
  delete(id: string, transactionContext?: unknown): Promise<void>;
}