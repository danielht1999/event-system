import pool from '@shared/infrastructure/database/connection';
import { PoolClient, Pool } from 'pg';
import { Payment } from '../../domain/entities/Payment';
import { IPaymentRepository } from '../../domain/repositories/IPaymentRepository';

export class PostgresPaymentRepository implements IPaymentRepository {

  // Método ayudante centralizado para obtener el ejecutor (DRY)
  private getExecutor(transactionContext?: unknown): PoolClient | Pool {
    return (transactionContext as PoolClient) || pool;
  }

  // =========================================================================
  // PERSISTENCIA (UPSERT TRANSACCIONAL)
  // =========================================================================
  async save(payment: Payment, transactionContext?: unknown): Promise<Payment> {
    const executor = this.getExecutor(transactionContext);
    const query = `
      INSERT INTO payments (id, reservation_id, usuario_id, monto, moneda, estado, creado_en)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        estado = EXCLUDED.estado,
        actualizado_en = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const result = await executor.query(query, [
      payment.id,
      payment.reservationId,
      payment.usuarioId,
      payment.monto,
      payment.moneda,
      payment.estado,
      payment.creadoEn
    ]);

    return this.mapToEntity(result.rows[0]);
  } 

  // =========================================================================
  // CONSULTAS DE LECTURA (Adaptadas para usar executor opcional)
  // =========================================================================
  async findById(id: string, transactionContext?: unknown): Promise<Payment | null> {
    const executor = this.getExecutor(transactionContext);

    const result = await executor.query(
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

  async findByReservationId(reservationId: string, transactionContext?: unknown): Promise<Payment | null> {
    const executor = this.getExecutor(transactionContext);

    const result = await executor.query(
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

  // =========================================================================
  // MAPEADOR INTERNO (Fiel a las columnas de tu DDL)
  // =========================================================================
  private mapToEntity(row: any): Payment {
    return new Payment(
      row.id,
      row.reservation_id,       
      row.usuario_id,         
      Number(row.monto),         
      row.moneda,                
      row.estado,                
      new Date(row.creado_en),
      row.actualizado_en ? new Date(row.actualizado_en) : undefined 
    );
  }
}