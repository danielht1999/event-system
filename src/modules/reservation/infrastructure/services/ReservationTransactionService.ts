// src/modules/reservation/infrastructure/services/ReservationTransactionService.ts
import { Pool } from 'pg';
import { Reservation } from '../../domain/entities/Reservation';

export class ReservationTransactionService {
  constructor(private pool: Pool) {}

  // 1. Crear Reservación sigue un patrón transaccional fuerte
  async createReservation(reservation: Reservation): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const resultado = await client.query('SELECT * FROM eventos WHERE id = $1 FOR UPDATE', [reservation.eventoId]);        
        
      if (resultado.rows.length === 0) {
        throw new Error('Evento no encontrado');
      }

      const evento = resultado.rows[0];
      // Mantenemos la protección de aforo en la base de datos por concurrencia real
      if (evento.capacidad_total < evento.reservas_confirmadas + evento.reservas_pendientes + reservation.cantidadTickets) {
        throw new Error('No hay cupos suficientes');
      }

      await client.query(
        `INSERT INTO reservas (id, evento_id, usuario_id, cantidad_tickets, estado, codigo_ticket, reservado_en, pagado_en, checked_in_en)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          reservation.id,              
          reservation.eventoId,        
          reservation.usuarioId,       
          reservation.cantidadTickets, 
          reservation.estado, // Toma el estado controlado por la entidad ('PENDIENTE_PAGO')
          reservation.codigoTicket,    
          reservation.reservadoEn,     
          reservation.pagadoEn,        
          reservation.checkedInEn      
        ]
      );
      
      await client.query(`UPDATE eventos SET reservas_pendientes = reservas_pendientes + $1 WHERE id = $2`,
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

  // 2. Confirmar Pago ENRIQUECIDO CON DOMINIO Rich 
  async confirmPayment(reservationId: string, userId: string): Promise<Reservation> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const resultado = await client.query('SELECT * FROM reservas WHERE id = $1 FOR UPDATE', [reservationId]);        
        
      if (resultado.rows.length === 0) {
        throw new Error('Reserva no encontrada');
      }

      const row = resultado.rows[0];
      if (row.usuario_id !== userId) {
        throw new Error('No tienes permiso para confirmar esta reserva');
      }

      // Reconstruimos la entidad de dominio original a partir de la fila SQL
      const reservation = new Reservation(
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

      // EL NÚCLEO DDD: Delegamos la mutación a la entidad.
      // Aquí se valida la invariante interna y nace el evento 'ReservationConfirmed'
      reservation.confirmarPago();

      // Persistimos el estado real dictado por la entidad
      await client.query(
        `UPDATE reservas SET estado = $1, pagado_en = $2 WHERE id = $3`,
        [reservation.estado, reservation.pagadoEn, reservation.id]
      );

      await client.query(
        `UPDATE eventos 
         SET reservas_confirmadas = reservas_confirmadas + $1,
             reservas_pendientes = reservas_pendientes - $1
         WHERE id = $2`,
        [reservation.cantidadTickets, reservation.eventoId]
      );     
      
      await client.query('COMMIT');
      return reservation; // Devolvemos la entidad con sus eventos listos para ser publicados
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // 3. Cancelar Reservación ENRIQUECIDA CON DOMINIO Rich
  async cancelReservation(reservationId: string, userId: string): Promise<Reservation> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const resultado = await client.query('SELECT * FROM reservas WHERE id = $1 FOR UPDATE', [reservationId]);
      
      if (resultado.rows.length === 0) {
        throw new Error('Reserva no encontrada');
      }

      const row = resultado.rows[0];
      if (row.usuario_id !== userId) {
        throw new Error('No tienes permiso para cancelar esta reserva');
      }

      // Reconstruimos la entidad
      const reservation = new Reservation(
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

      const estadoAnterior = reservation.estado;

      //Muta la entidad de forma segura y genera 'ReservationCancelled'
      reservation.cancelar();

      await client.query(
        `UPDATE reservas SET estado = $1 WHERE id = $2`,
        [reservation.estado, reservation.id]
      );
      
      // Solo resta pendientes si estaba en PENDIENTE_PAGO antes del cambio
      if (estadoAnterior === 'PENDIENTE_PAGO') {
        await client.query(
          `UPDATE eventos SET reservas_pendientes = reservas_pendientes - $1 WHERE id = $2`,
          [reservation.cantidadTickets, reservation.eventoId]
        );
      }
      
      await client.query('COMMIT');
      return reservation;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}