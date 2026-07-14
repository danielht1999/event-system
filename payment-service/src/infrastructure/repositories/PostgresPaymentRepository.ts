import { IPaymentRepository } from '../../domain/repositories/IPaymentRepository';
import { Payment, PaymentStatus } from '../../domain/entities/Payment';
import { Money } from '../../domain/entities/Money';
import { asClient } from '../database/connection';

interface PaymentRow {
  id: string;
  reservation_id: string;
  usuario_id: string;
  monto_centavos: number;
  moneda: string;
  estado: PaymentStatus;
  provider: 'stripe';
  provider_reference: string | null;
  idempotency_key: string;
  creado_en: Date;
  actualizado_en: Date;
}

function toEntity(row: PaymentRow): Payment {
  return Payment.reconstitute({
    id: row.id,
    reservationId: row.reservation_id,
    usuarioId: row.usuario_id,
    money: Money.fromCents(row.monto_centavos, row.moneda),
    estado: row.estado,
    provider: row.provider,
    providerReference: row.provider_reference ?? undefined,
    idempotencyKey: row.idempotency_key,
    creadoEn: row.creado_en,
    actualizadoEn: row.actualizado_en,
  });
}

export class PostgresPaymentRepository implements IPaymentRepository {
  async save(payment: Payment, tx?: unknown): Promise<Payment> {
    const client = asClient(tx);
    await client.query(
      `INSERT INTO payments
         (id, reservation_id, usuario_id, monto_centavos, moneda, estado, provider, provider_reference, idempotency_key, creado_en, actualizado_en)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO UPDATE SET
         estado = EXCLUDED.estado,
         provider_reference = EXCLUDED.provider_reference,
         actualizado_en = EXCLUDED.actualizado_en`,
      [
        payment.id,
        payment.reservationId,
        payment.usuarioId,
        payment.money.amountCents,
        payment.money.currency,
        payment.estado,
        payment.provider,
        payment.providerReference ?? null,
        payment.idempotencyKey,
        payment.creadoEn,
        payment.actualizadoEn,
      ],
    );
    return payment;
  }

  async findById(id: string, tx?: unknown): Promise<Payment | null> {
    const client = asClient(tx);
    const { rows } = await client.query<PaymentRow>('SELECT * FROM payments WHERE id = $1', [id]);
    return rows[0] ? toEntity(rows[0]) : null;
  }

  async findByReservationId(reservationId: string, tx?: unknown): Promise<Payment | null> {
    const client = asClient(tx);
    const { rows } = await client.query<PaymentRow>(
      'SELECT * FROM payments WHERE reservation_id = $1',
      [reservationId],
    );
    return rows[0] ? toEntity(rows[0]) : null;
  }

  async findByIdempotencyKey(idempotencyKey: string, tx?: unknown): Promise<Payment | null> {
    const client = asClient(tx);
    const { rows } = await client.query<PaymentRow>(
      'SELECT * FROM payments WHERE idempotency_key = $1',
      [idempotencyKey],
    );
    return rows[0] ? toEntity(rows[0]) : null;
  }

  async findByProviderReference(providerReference: string, tx?: unknown): Promise<Payment | null> {
    const client = asClient(tx);
    const { rows } = await client.query<PaymentRow>(
      'SELECT * FROM payments WHERE provider_reference = $1',
      [providerReference],
    );
    return rows[0] ? toEntity(rows[0]) : null;
  }
}
