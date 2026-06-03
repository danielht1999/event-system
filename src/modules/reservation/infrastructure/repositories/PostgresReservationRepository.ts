// src/modules/reservation/infrastructure/repositories/PostgresReservationRepository.ts
import pool from '@shared/infrastructure/database/connection';
import { IReservationRepository } from '../../domain/repositories/IReservationRepository';
import { Reservation } from '../../domain/entities/Reservation';

export class PostgresReservationRepository implements IReservationRepository {
  async save(reservation: Reservation): Promise<void> {  
    const client = await pool.connect();
    try {
    await client.query('BEGIN');
    await client.query(`INSERT INTO reservas (id, evento_id, usuario_id, cantidad_tickets, estado, codigo_ticket, reservado_en, pagado_en, checked_in_en)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        reservation.id,              
        reservation.eventoId,        
        reservation.usuarioId,       
        reservation.cantidadTickets, 
        reservation.estado,          
        reservation.codigoTicket,    
        reservation.reservadoEn,     
        reservation.pagadoEn,        
        reservation.checkedInEn      
      ]);
    await client.query(
      `UPDATE eventos SET reservas_pendientes = reservas_pendientes + $1 WHERE id = $2`,
      [reservation.cantidadTickets, reservation.eventoId] 
    );
     await client.query('COMMIT');
   } catch (error) {
     await client.query('ROLLBACK');
     throw error;
   } finally {
     client.release();
   }
 }

   async findById(id: string): Promise<Reservation | null> {
    const result = await pool.query(
      'SELECT * FROM reservas WHERE id = $1',
      [id]
    );
    return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
  }

  async findByEvent(eventId: string): Promise<Reservation[]> {
    const result = await pool.query(
      'SELECT * FROM reservas WHERE evento_id = $1',
      [eventId]
    );
    return result.rows.map(row => this.mapToEntity(row));
  }

  async findByUser(userId: string): Promise<Reservation[]> {
    const result = await pool.query(
      'SELECT * FROM reservas WHERE usuario_id = $1',
      [userId]
    );
    return result.rows.map(row => this.mapToEntity(row));
  }

  async findByTicketCode(code: string): Promise<Reservation | null> {
    const result = await pool.query(
      'SELECT * FROM reservas WHERE codigo_ticket = $1',
      [code]
    );
    return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
  }

  async update(reservation: Reservation): Promise<void> {
    await pool.query(
    `UPDATE reservas 
     SET estado = $1, pagado_en = $2, checked_in_en = $3
     WHERE id = $4`,
    [reservation.estado, reservation.pagadoEn, reservation.checkedInEn, reservation.id]
  );
  }
  
  async delete(id: string): Promise<void> {
    const result = await pool.query(
      'DELETE FROM reservas WHERE id = $1',
      [id]
    );
  }

  async expireObsoleteReservations(): Promise<number> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Tu query atómica exacta
      const resultado = await client.query(`
        WITH reservas_expiradas AS (
          UPDATE reservas
          SET estado = 'EXPIRADA'
          WHERE estado = 'PENDIENTE_PAGO'
            AND reservado_en <= NOW() - INTERVAL '15 minutes'
          RETURNING evento_id, cantidad_tickets
        )
        UPDATE eventos e
        SET reservas_pendientes = e.reservas_pendientes - sub.total_tickets
        FROM (
          SELECT 
            evento_id,
            SUM(cantidad_tickets) AS total_tickets
          FROM reservas_expiradas
          GROUP BY evento_id
        ) sub
        WHERE e.id = sub.evento_id
        RETURNING e.id;
      `);

      await client.query('COMMIT');
      return resultado.rowCount || 0;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private mapToEntity(row: any): Reservation {
    return new Reservation(
      row.id,
      row.evento_id,
      row.usuario_id,
      row.cantidad_tickets,
      row.estado,
      row.codigo_ticket,
      row.reservado_en,
      row.pagado_en,
      row.checked_in_en
    );
        }
 }


