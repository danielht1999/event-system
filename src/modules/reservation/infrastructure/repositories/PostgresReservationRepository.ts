import pool from '@shared/infrastructure/database/connection';
import { PoolClient, Pool } from 'pg'; 
import { IReservationRepository } from '../../domain/repositories/IReservationRepository';
import { Reservation } from '../../domain/entities/Reservation';

export class PostgresReservationRepository implements IReservationRepository {

  // Método ayudante centralizado para obtener el ejecutor
  private getExecutor(transactionContext?: unknown): PoolClient | Pool {
    return (transactionContext as PoolClient) || pool;
  }

async save(reservation: Reservation, transactionContext?: unknown): Promise<Reservation> {
  const executor = this.getExecutor(transactionContext);

  const query = `
    INSERT INTO reservas (
      id, evento_id, ticket_type_id, usuario_id, cantidad_tickets, estado, codigo_ticket, reservado_en, pagado_en, checked_in_en
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (id) DO UPDATE SET
      estado = EXCLUDED.estado,
      pagado_en = EXCLUDED.pagado_en,
      checked_in_en = EXCLUDED.checked_in_en
    RETURNING *
  `;

  // Agregamos reservation.eventId como el segundo parámetro ($2)
  const result = await executor.query(query, [
    reservation.id,
    reservation.eventId,      // <--- AÑADIDO: El nuevo campo obligatorio
    reservation.ticketTypeId,
    reservation.usuarioId,
    reservation.cantidadTickets,
    reservation.estado,
    reservation.codigoTicket,
    reservation.reservadoEn,
    reservation.pagadoEn,
    reservation.checkedInEn
  ]);

  return this.mapToEntity(result.rows[0]);
}

  async findByIdForUpdate(id: string, transactionContext: unknown): Promise<Reservation | null> {
    const executor = transactionContext as PoolClient;
    const result = await executor.query(
      'SELECT * FROM reservas WHERE id = $1 FOR UPDATE',
      [id]
    );
    return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
  }

  async findObsoleteReservations(transactionContext?: unknown): Promise<Reservation[]> {
    const executor = this.getExecutor(transactionContext);
    const result = await executor.query(`
      SELECT * FROM reservas 
      WHERE estado = 'PENDIENTE_PAGO' 
        AND reservado_en <= NOW() - INTERVAL '15 minutes'
    `);
    return result.rows.map(row => this.mapToEntity(row));
  }

  async findById(id: string, transactionContext?: unknown): Promise<Reservation | null> {
    const executor = this.getExecutor(transactionContext);
    const result = await executor.query('SELECT * FROM reservas WHERE id = $1', [id]);
    return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
  }

  // Métodos de lectura ahora también aceptan contexto opcional
  async findByEvent(eventId: string, transactionContext?: unknown): Promise<Reservation[]> {
    const executor = this.getExecutor(transactionContext);
    const query = `
      SELECT r.* FROM reservas r
      JOIN ticket_types t ON r.ticket_type_id = t.id
      WHERE t.evento_id = $1 ORDER BY r.reservado_en DESC
    `;
    const result = await executor.query(query, [eventId]);
    return result.rows.map(row => this.mapToEntity(row));
  }

  async findByUser(userId: string, transactionContext?: unknown): Promise<Reservation[]> {
    const executor = this.getExecutor(transactionContext);
    const result = await executor.query('SELECT * FROM reservas WHERE usuario_id = $1 ORDER BY reservado_en DESC', [userId]);
    return result.rows.map(row => this.mapToEntity(row));
  }

  async findByTicketCode(code: string, transactionContext?: unknown): Promise<Reservation | null> {
    const executor = this.getExecutor(transactionContext);
    const result = await executor.query('SELECT * FROM reservas WHERE codigo_ticket = $1', [code]);
    return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
  }
  
  async delete(id: string, transactionContext?: unknown): Promise<void> {
    const executor = this.getExecutor(transactionContext);
    await executor.query('DELETE FROM reservas WHERE id = $1', [id]);
  }

  private mapToEntity(row: any): Reservation {
    return new Reservation(
      row.id, row.evento_id, row.ticket_type_id, row.usuario_id,
      Number(row.cantidad_tickets), row.estado, row.codigo_ticket,
      new Date(row.reservado_en),
      row.pagado_en ? new Date(row.pagado_en) : undefined,
      row.checked_in_en ? new Date(row.checked_in_en) : undefined
    );
  }
}