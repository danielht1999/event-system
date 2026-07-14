import { Payment } from '../entities/Payment';

export interface IPaymentRepository {
  save(payment: Payment, tx?: unknown): Promise<Payment>;
  findById(id: string, tx?: unknown): Promise<Payment | null>;
  findByReservationId(reservationId: string, tx?: unknown): Promise<Payment | null>;
  findByIdempotencyKey(idempotencyKey: string, tx?: unknown): Promise<Payment | null>;
  findByProviderReference(providerReference: string, tx?: unknown): Promise<Payment | null>;
}
