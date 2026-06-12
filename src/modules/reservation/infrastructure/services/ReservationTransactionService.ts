// src/modules/reservation/infrastructure/services/ReservationTransactionService.ts
import { Pool } from 'pg';
import { Reservation } from '../../domain/entities/Reservation';
import { domainEventBus } from '@shared/infrastructure/messaging/DomainEventBus';
import { IDomainEvent } from '@shared/domain/IDomainEvent';
import { EventNotFoundError, EventCapacityExceededError } from '../../../event/domain/errors';
import { ReservationNotFoundError, ReservationOwnershipError } from '../../domain/errors';
import { logger } from '@shared/infrastructure/logging/winston';//para medir duracion del lock

export class ReservationTransactionService {
  constructor(private pool: Pool) {}

  // 1. Crear Reservación - Ahora devuelve la entidad para despachar eventos de forma segura
  async createReservation(reservation: Reservation): Promise<Reservation> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      // ⏱️ INICIA EL CRONÓMETRO DE ESPERA DEL LOCK
      const startLock = performance.now();
      const resultado = await client.query('SELECT * FROM eventos WHERE id = $1 FOR UPDATE', [reservation.eventoId]);        
      // ⏱️ TERMINA EL CRONÓMETRO (En cuanto Postgres da luz verde)
      const lockDurationMs = performance.now() - startLock;

      //--------------
      // Si el bloqueo tarda más de 100ms, lo catalogamos como una alerta de contención
      if (lockDurationMs > 1000) {
        logger.error('LOCK CRÍTICO', {
          eventoId: reservation.eventoId,
          durationMs: lockDurationMs.toFixed(2)
        });
      }
      else if (lockDurationMs > 100) {
        logger.warn('LOCK LENTO', {
          eventoId: reservation.eventoId,
          durationMs: lockDurationMs.toFixed(2)
        });
      }

      //--------------
      
      if (resultado.rows.length === 0) {
        throw new EventNotFoundError(reservation.eventoId);
      }

      const evento = resultado.rows[0];
      
      if (evento.capacidad_total < evento.reservas_confirmadas + evento.reservas_pendientes + reservation.cantidadTickets) {
        throw new EventCapacityExceededError(reservation.eventoId);
      }

      await client.query(
        `INSERT INTO reservas (id, evento_id, usuario_id, cantidad_tickets, estado, codigo_ticket, reservado_en, pagado_en, checked_in_en)
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
        ]
      );
      
      await client.query(`UPDATE eventos SET reservas_pendientes = reservas_pendientes + $1 WHERE id = $2`,
        [reservation.cantidadTickets, reservation.eventoId] 
      );

      await client.query('COMMIT');

      const organizerId = evento.organizador_id;

      // Extracción y publicación segura post-COMMIT de los eventos acumulados al crear la reserva
      const domainEvents: IDomainEvent[] = reservation.pullDomainEvents();
      domainEvents.forEach((domainEvent) => {
        domainEvent.data = {
          ...domainEvent.data,
          organizerId: organizerId
        };
        domainEventBus.publish(domainEvent.eventName, domainEvent);
      });

      return reservation;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // 2. Confirmar Pago - Devuelve la entidad mutada
  async confirmPayment(reservationId: string, userId: string): Promise<Reservation> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const resultado = await client.query('SELECT * FROM reservas WHERE id = $1 FOR UPDATE', [reservationId]);        
        
      if (resultado.rows.length === 0) {
        throw new ReservationNotFoundError(reservationId);
      }

      const row = resultado.rows[0];
      if (row.usuario_id !== userId) {
        throw new ReservationOwnershipError(reservationId, userId);
      }

      // Obtenemos el evento para extraer su organizador antes del commit
      const resultadoEvento = await client.query('SELECT organizador_id FROM eventos WHERE id = $1', [row.evento_id]);
      const organizerId = resultadoEvento.rows[0]?.organizador_id;

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

      reservation.confirmarPago();

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

      // Extracción y publicación segura de eventos inyectando el contexto de infraestructura necesario
      const domainEvents: IDomainEvent[] = reservation.pullDomainEvents();
      domainEvents.forEach((domainEvent) => {
        domainEvent.data = {
          ...domainEvent.data,
          organizerId: organizerId
        };
        domainEventBus.publish(domainEvent.eventName, domainEvent);
      });

      return reservation; 
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // 3. Cancelar Reservación
  async cancelReservation(reservationId: string, userId: string): Promise<Reservation> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const resultado = await client.query('SELECT * FROM reservas WHERE id = $1 FOR UPDATE', [reservationId]);
      
      if (resultado.rows.length === 0) {
        throw new ReservationNotFoundError(reservationId);
      }

      const row = resultado.rows[0];
      if (row.usuario_id !== userId) {
        throw new ReservationOwnershipError(reservationId, userId);
      }

      // Obtenemos el evento para extraer su organizador antes del commit
      const resultadoEvento = await client.query('SELECT organizador_id FROM eventos WHERE id = $1', [row.evento_id]);
      const organizerId = resultadoEvento.rows[0]?.organizador_id;

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
      reservation.cancelar();

      await client.query(
        `UPDATE reservas SET estado = $1 WHERE id = $2`,
        [reservation.estado, reservation.id]
      );
      
      if (estadoAnterior === 'PENDIENTE_PAGO') {
        await client.query(
          `UPDATE eventos SET reservas_pendientes = reservas_pendientes - $1 WHERE id = $2`,
          [reservation.cantidadTickets, reservation.eventoId]
        );
      }
      
      await client.query('COMMIT');

      // Extracción y publicación segura de eventos inyectando el contexto de infraestructura necesario
      const domainEvents: IDomainEvent[] = reservation.pullDomainEvents();
      domainEvents.forEach((domainEvent) => {
        domainEvent.data = {
          ...domainEvent.data,
          organizerId: organizerId
        };
        domainEventBus.publish(domainEvent.eventName, domainEvent);
      });

      return reservation;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}