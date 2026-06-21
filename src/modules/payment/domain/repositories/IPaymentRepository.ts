import { Payment } from '../entities/Payment';

export interface IPaymentRepository {
  /**
   * Guarda o sincroniza el estado del pago. Soporta contexto transaccional opcional.
   */
  save(payment: Payment, transactionContext?: unknown): Promise<Payment>;

  /**
   * Busca un pago por su identificador.
   */
  findById(id: string, transactionContext?: unknown): Promise<Payment | null>;

  /**
   * Busca el pago asociado a una reserva.
   */
  findByReservationId(reservationId: string, transactionContext?: unknown): Promise<Payment | null>;
}