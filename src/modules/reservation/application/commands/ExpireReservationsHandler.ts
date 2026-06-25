// src/modules/reservation/application/commands/ExpireReservationsHandler.ts

import pool from '@shared/infrastructure/database/connection';
import { IReservationRepository } from '../../domain/repositories/IReservationRepository';
import { ExpireReservationsCommand } from './ExpireReservationsCommand';
import { domainEventBus } from '@shared/infrastructure/messaging/DomainEventBus';
import { DomainEventName } from '@shared/domain/DomainEventNames';
import { IDomainEvent } from '@shared/domain/IDomainEvent';
import { DomainEventPayloadMap } from '@shared/domain/DomainEventPayloads';

export class ExpireReservationsHandler {
  constructor(private reservationRepository: IReservationRepository) {}

  async execute(command: ExpireReservationsCommand): Promise<number> {
    console.log('[Handler] Iniciando escaneo de reservaciones obsoletas...');

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const obsoleteReservations = await this.reservationRepository.findObsoleteReservations(client);

      if (obsoleteReservations.length === 0) {
        await client.query('COMMIT');
        return 0;
      }

      console.log(`[Handler] Procesando ${obsoleteReservations.length} reservaciones obsoletas en memoria...`);

      const expiredIds: string[] = [];
      const ticketTypeUpdates: Record<string, number> = {};

      for (const reservation of obsoleteReservations) {
        reservation.expirar();
        expiredIds.push(reservation.id);

        const key = `${reservation.eventId}:${reservation.ticketTypeId}`;
        ticketTypeUpdates[key] =
          (ticketTypeUpdates[key] || 0) + reservation.cantidadTickets;
      }

      await client.query(
        "UPDATE reservas SET estado = 'EXPIRADA' WHERE id = ANY($1)",
        [expiredIds]
      );

      for (const [key, cantidadALiberar] of Object.entries(ticketTypeUpdates)) {
        const [eventoId, ticketTypeId] = key.split(':');
        await client.query(
          `UPDATE ticket_types 
           SET reservas_pendientes = reservas_pendientes - $1 
           WHERE id = $2 
           AND evento_id = $3`,
          [cantidadALiberar, ticketTypeId, eventoId]
        );
      }

      await client.query('COMMIT');
      console.log('[Handler] Transacción consolidada con éxito en la Base de Datos.');

      // ✅ RECOLECTAR Y TIPAR EVENTOS
      const typedEvents: IDomainEvent<any>[] = [];

      for (const reservation of obsoleteReservations) {
        const rawEvents = reservation.pullDomainEvents();
        for (const event of rawEvents) {
          typedEvents.push(event);
        }
      }

      // ✅ Emitir eventos con tipado seguro
      for (const event of typedEvents) {
        // ✅ Cast a DomainEventName (los eventos válidos están en el mapa)
        domainEventBus.publish(
          event.eventName as DomainEventName,
          event as IDomainEvent<any>
        );
      }

      console.log(
        `[Handler] Éxito: Se despacharon eventos reactivos para ${obsoleteReservations.length} reservaciones.`
      );
      return obsoleteReservations.length;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[Handler] Error crítico en lote de expiración. Rollback ejecutado:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}