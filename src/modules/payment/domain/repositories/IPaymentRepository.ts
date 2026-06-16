import { Payment } from '../entities/Payment';

export interface IPaymentRepository {

  /**
   * Guarda o sincroniza el estado del pago.
   */
  save(payment: Payment): Promise<Payment>;

  /**
   * Busca un pago por su identificador.
   */
  findById(id: string): Promise<Payment | null>;

  /**
   * Busca el pago asociado a una reserva.
   */
  findByReservationId(
    reservationId: string
  ): Promise<Payment | null>;

}