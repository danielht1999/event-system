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

  async confirmPayment(reservationId: string, userId: string): Promise<void>{
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const resultado = await client.query('SELECT * FROM reservas WHERE id = $1 FOR UPDATE',
        [reservationId]);    
        
      // 1. Verificar existencia
      if (resultado.rows.length === 0) {
        throw new Error('Reserva no encontrada');
      }

      // 2. Verificar usario
      const reserva = resultado.rows[0];
      if (reserva.usuario_id !== userId) {
        throw new Error('No tienes permiso para confirmar esta reserva');
      }
      //veriifica estado del tciket
      if (reserva.estado !== 'PENDIENTE_PAGO') {
        throw new Error('La reserva no está pendiente de pago');
      }

      await client.query(
        `UPDATE reservas SET estado = 'CONFIRMADA', pagado_en = NOW() WHERE id = $1`,
        [reservationId]
      );
      await client.query(
        `UPDATE eventos 
        SET reservas_confirmadas = reservas_confirmadas + $1,
            reservas_pendientes = reservas_pendientes - $1
        WHERE id = $2`,
        [reserva.cantidad_tickets, reserva.evento_id]
      );     
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async cancelReservation(reservationId: string, userId: string): Promise<void> {
  const client = await this.pool.connect();
  try {
    await client.query('BEGIN');
    const resultado = await client.query(
      'SELECT * FROM reservas WHERE id = $1 FOR UPDATE',
      [reservationId]
    );
    
    // 1. Verificar existencia
    if (resultado.rows.length === 0) {
      throw new Error('Reserva no encontrada');
    }

    // 2. Verificar usuario
    const reserva = resultado.rows[0];
    if (reserva.usuario_id !== userId) {
      throw new Error('No tienes permiso para cancelar esta reserva');
    }
    
    // 3. Verificar estado del ticket
    if (reserva.estado === 'CONFIRMADA') {
      throw new Error('No puedes cancelar una reserva ya confirmada');
    }
    if (reserva.estado === 'CANCELADA') {
      throw new Error('La reserva ya está cancelada');
    }

    // 4. Actualizar estado de la reserva
    await client.query(
      `UPDATE reservas SET estado = 'CANCELADA' WHERE id = $1`,
      [reservationId]
    );
    
    // 5. Solo resta pendientes si estaba en PENDIENTE_PAGO
    if (reserva.estado === 'PENDIENTE_PAGO') {
      await client.query(
        `UPDATE eventos 
         SET reservas_pendientes = reservas_pendientes - $1 
         WHERE id = $2`,
        [reserva.cantidad_tickets, reserva.evento_id]
      );
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  }
}
