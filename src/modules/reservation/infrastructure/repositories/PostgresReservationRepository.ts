// src/modules/reservation/infrastructure/repositories/PostgresReservationRepository.ts
import pool from '@shared/infrastructure/database/connection';
import { IReservationRepository } from '../../domain/repositories/IReservationRepository';
import { Reservation } from '../../domain/entities/Reservation';
import { domainEventBus } from '@shared/infrastructure/messaging/DomainEventBus';

export class PostgresReservationRepository implements IReservationRepository {
  
  // =========================================================================
  // UPSERT: Guarda o Sincroniza el estado de la reserva y despacha eventos
  // =========================================================================
  async save(reservation: Reservation): Promise<Reservation> {  
    const query = `
      INSERT INTO reservas (
        id, evento_id, usuario_id, cantidad_tickets, estado, codigo_ticket, reservado_en, pagado_en, checked_in_en
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        estado = EXCLUDED.estado,
        pagado_en = EXCLUDED.pagado_en,
        checked_in_en = EXCLUDED.checked_in_en
      RETURNING *
    `;

    // Leemos usando los getters públicos y camelCase estrictos de la entidad
    const result = await pool.query(query, [
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

    // DESPACHO REACTIVO DE EVENTOS DE DOMINIO:
    // La mutación de cupos de eventos se delega a los listeners de estos eventos
    const domainEvents = reservation.pullDomainEvents();
    domainEvents.forEach((domainEvent) => {
      domainEventBus.publish(domainEvent.eventName, domainEvent);
    });

    return this.mapToEntity(result.rows[0]);
  }

  async findById(id: string): Promise<Reservation | null> {
    const result = await pool.query(
      'SELECT * FROM reservas WHERE id = $1',
      [id]
    );
    return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
  }

  // =========================================================================
  // BLOQUEO CONCURRENTE: Requerido por la interfaz para evitar condiciones de carrera
  // =========================================================================
  async findByIdForUpdate(id: string): Promise<Reservation | null> {
    const result = await pool.query(
      'SELECT * FROM reservas WHERE id = $1 FOR UPDATE',
      [id]
    );
    return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
  }

  async findByEvent(eventId: string): Promise<Reservation[]> {
    const result = await pool.query(
      'SELECT * FROM reservas WHERE evento_id = $1 ORDER BY reservado_en DESC',
      [eventId]
    );
    return result.rows.map(row => this.mapToEntity(row));
  }

  async findByUser(userId: string): Promise<Reservation[]> {
    const result = await pool.query(
      'SELECT * FROM reservas WHERE usuario_id = $1 ORDER BY reservado_en DESC',
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
  
  async delete(id: string): Promise<void> {
    await pool.query(
      'DELETE FROM reservas WHERE id = $1',
      [id]
    );
  }

  // =========================================================================
  // WORKER: Expiración masiva en base de datos
  // =========================================================================
  async expireObsoleteReservations(): Promise<Reservation[]> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const resultado = await client.query(`
        WITH reservas_expiradas AS (
          UPDATE reservas
          SET estado = 'EXPIRADA'
          WHERE estado = 'PENDIENTE_PAGO'
            AND reservado_en <= NOW() - INTERVAL '15 minutes'
          RETURNING *
        ),
        actualizar_eventos AS (
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
        )
        SELECT * FROM reservas_expiradas;
      `);

      await client.query('COMMIT');
      
      // RECONSTRUCCIÓN DDD: Mapeamos forzando 'PENDIENTE_PAGO' para el ciclo de vida del Handler
      return resultado.rows.map(row => new Reservation(
        row.id,
        row.evento_id,
        row.usuario_id,
        Number(row.cantidad_tickets),
        'PENDIENTE_PAGO', // <-- Estado previo para engañar al Dominio de forma segura
        row.codigo_ticket,
        new Date(row.reservado_en),
        row.pagado_en ? new Date(row.pagado_en) : undefined,
        row.checked_in_en ? new Date(row.checked_in_en) : undefined
      ));
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Mapeador adaptado al constructor rico de la entidad Reservation
   */
  private mapToEntity(row: any): Reservation {
    return new Reservation(
      row.id,
      row.evento_id,
      row.usuario_id,
      Number(row.cantidad_tickets),
      row.estado,
      row.codigo_ticket,
      new Date(row.reservado_en),
      row.pagado_en ? new Date(row.pagado_en) : undefined,
      row.checked_in_en ? new Date(row.checked_in_en) : undefined
    );
  }
}