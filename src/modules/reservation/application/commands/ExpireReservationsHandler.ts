import pool from '@shared/infrastructure/database/connection'; // Inyectamos el pool para la orquestación transaccional
import { IReservationRepository } from '../../domain/repositories/IReservationRepository';
import { ExpireReservationsCommand } from './ExpireReservationsCommand';
import { domainEventBus } from '@shared/infrastructure/messaging/DomainEventBus';

export class ExpireReservationsHandler {
  constructor(private reservationRepository: IReservationRepository) {}

  async execute(command: ExpireReservationsCommand): Promise<number> {
    console.log('[Handler] Iniciando escaneo de reservaciones obsoletas...');

    // 1. Tomamos una conexión exclusiva del pool para asegurar la atomicidad del lote
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 2. Traemos las entidades reales en estado 'PENDIENTE_PAGO' que ya expiraron
      const obsoleteReservations = await this.reservationRepository.findObsoleteReservations(client);

      if (obsoleteReservations.length === 0) {
        await client.query('COMMIT');
        return 0;
      }

      console.log(`[Handler] Procesando ${obsoleteReservations.length} reservaciones obsoletas en memoria...`);

      const expiredIds: string[] = [];
      const ticketTypeUpdates: { [ticketTypeId: string]: number } = {};

      // 3. Pipelining / Batching en Memoria RAM (DDD Puro)
      for (const reservation of obsoleteReservations) {
        // Ejecuta la regla de negocio y acumula internamente 'DomainEventNames.RESERVATION.EXPIRED'
        reservation.expirar();

        // Agrupamos el ID para la query masiva de actualización de estado
        expiredIds.push(reservation.id);

        // Consolidamos cuántos cupos acumulados hay que devolver a cada tipo de ticket específico
        ticketTypeUpdates[reservation.ticketTypeId] = 
          (ticketTypeUpdates[reservation.ticketTypeId] || 0) + reservation.cantidadTickets;
      }

      // 4. PERSISTENCIA EN LOTE (Mínimos viajes de red hacia PostgreSQL)
      
      // Query 1: Actualización masiva de estados de reservaciones
      await client.query(
        "UPDATE reservas SET estado = 'EXPIRADA' WHERE id = ANY($1)",
        [expiredIds]
      );

      // Query 2: Devolución masiva de stock a la tabla ticket_types (una query por tipo de entrada afectado)
      for (const [ticketTypeId, cantidadALiberar] of Object.entries(ticketTypeUpdates)) {
        await client.query(
          `UPDATE ticket_types 
           SET reservas_pendientes = reservas_pendientes - $1 
           WHERE id = $2`,
          [cantidadALiberar, ticketTypeId]
        );
      }

      // 5. Consolidamos la transacción de forma segura en la base de datos
      await client.query('COMMIT');
      console.log('[Handler] Transacción consolidada con éxito en la Base de Datos.');

      // 6. FLUJO REACTIVO SEGURO (Post-Commit)
      // Ahora que la BD es consistente, disparamos los eventos legítimos acumulados en las entidades
      obsoleteReservations.forEach(reservation => {
        const events = reservation.pullDomainEvents();
        events.forEach(event => {
          domainEventBus.publish(event.eventName, event);
        });
      });

      console.log(`[Handler] Éxito: Se despacharon eventos reactivos para ${obsoleteReservations.length} reservaciones.`);
      return obsoleteReservations.length;

    } catch (error) {
      // Si algo falla, revertimos todo el lote para evitar desincronizaciones de aforo
      await client.query('ROLLBACK');
      console.error('[Handler] Error crítico en lote de expiración. Rollback ejecutado:', error);
      throw error;
    } finally {
      // Liberamos la conexión para que regrese de inmediato al pool de la app
      client.release();
    }
  }
}