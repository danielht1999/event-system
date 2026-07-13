import { IPaymentRepository } from '../../src/domain/repositories/IPaymentRepository';
import { Payment } from '../../src/domain/entities/Payment';

/**
 * Implementación in-memory de IPaymentRepository — mismo contrato que
 * PostgresPaymentRepository, para poder testear application/ sin Postgres.
 * `tx` se ignora (no hay transacciones reales en memoria).
 */
export class InMemoryPaymentRepository implements IPaymentRepository {
  private readonly rows = new Map<string, Payment>();

  async save(payment: Payment): Promise<Payment> {
    this.rows.set(payment.id, payment);
    return payment;
  }

  async findById(id: string): Promise<Payment | null> {
    return this.rows.get(id) ?? null;
  }

  async findByReservationId(reservationId: string): Promise<Payment | null> {
    for (const p of this.rows.values()) {
      if (p.reservationId === reservationId) return p;
    }
    return null;
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<Payment | null> {
    for (const p of this.rows.values()) {
      if (p.idempotencyKey === idempotencyKey) return p;
    }
    return null;
  }

  async findByProviderReference(providerReference: string): Promise<Payment | null> {
    for (const p of this.rows.values()) {
      if (p.providerReference === providerReference) return p;
    }
    return null;
  }

  /** Solo para asserts en los tests. */
  count(): number {
    return this.rows.size;
  }
}