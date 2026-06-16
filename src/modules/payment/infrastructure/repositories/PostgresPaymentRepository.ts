import pool from '@shared/infrastructure/database/connection';
import { Payment } from '../../domain/entities/Payment';
import { IPaymentRepository } from '../../domain/repositories/IPaymentRepository';
import { domainEventBus } from '@shared/infrastructure/messaging/DomainEventBus';

export class PostgresPaymentRepository implements IPaymentRepository {

  async save(payment: Payment): Promise<Payment> {
    const query = `
      INSERT INTO payments (
        id,
        reservation_id,
        usuario_id,
        monto,
        moneda,
        estado,
        creado_en,
        actualizado_en
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)

      ON CONFLICT (id)
      DO UPDATE SET
        estado = EXCLUDED.estado,
        actualizado_en = EXCLUDED.actualizado_en

      RETURNING *
    `;

    const result = await pool.query(query, [
      payment.id,
      payment.reservationId,
      payment.usuarioId,          // $3 - Mapeado correctamente
      payment.monto,              // $4
      payment.moneda,             // $5
      payment.estado,             // $6
      payment.creadoEn,           // $7
      payment.actualizadoEn       // $8
    ]);

    const domainEvents = payment.pullDomainEvents();

    domainEvents.forEach(event => {
      domainEventBus.publish(
        event.eventName,
        event
      );
    });

    return this.mapToEntity(result.rows[0]);
  }

  async findById(id: string): Promise<Payment | null> {
    const result = await pool.query(
      `
      SELECT id, reservation_id, usuario_id, monto, moneda, estado, creado_en, actualizado_en
      FROM payments
      WHERE id = $1
      `,
      [id]
    );

    if (!result.rows[0]) {
      return null;
    }

    return this.mapToEntity(result.rows[0]);
  }

  async findByReservationId(reservationId: string): Promise<Payment | null> {
    const result = await pool.query(
      `
      SELECT id, reservation_id, usuario_id, monto, moneda, estado, creado_en, actualizado_en
      FROM payments
      WHERE reservation_id = $1
      `,
      [reservationId]
    );

    if (!result.rows[0]) {
      return null;
    }

    return this.mapToEntity(result.rows[0]);
  }

  private mapToEntity(row: any): Payment {
    return new Payment(
      row.id,
      row.reservation_id,
      row.usuario_id,             // Posición 3: usuarioId
      Number(row.monto),          // Posición 4: monto
      row.moneda,                 // Posición 5: moneda
      row.estado,                 // Posición 6: estado
      new Date(row.creado_en),    // Posición 7: creadoEn
      new Date(row.actualizado_en)// Posición 8: actualizadoEn
    );
  }
}