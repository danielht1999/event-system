// src/modules/reservation/infrastructure/services/ReservationTransactionService.ts
import { Pool } from 'pg';
import { Reservation } from '../../domain/entities/Reservation';

export class ReservationTransactionService {
  constructor(private pool: Pool) {}

  async createReservation(reservation: Reservation): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const resultado = await client.query('SELECT * FROM eventos WHERE id = $1 FOR UPDATE',
        [reservation.eventoId]);    
        
      // 1. Verificar existencia
      if (resultado.rows.length === 0) {
        throw new Error('Evento no encontrado');
      }

      // 2. Verificar cupos
      const evento = resultado.rows[0];
      if (evento.capacidad_total < evento.reservas_confirmadas + evento.reservas_pendientes + reservation.cantidadTickets) {
        throw new Error('No hay cupos suficientes');
      }

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
      
      await client.query(`UPDATE eventos SET reservas_pendientes = reservas_pendientes + $1 WHERE id = $2`,
        [reservation.cantidadTickets, reservation.eventoId] 
      )
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
