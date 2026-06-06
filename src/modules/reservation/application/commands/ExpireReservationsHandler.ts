// src/modules/reservation/application/commands/ExpireReservationsHandler.ts
import { IReservationRepository } from '../../domain/repositories/IReservationRepository';
import { ExpireReservationsCommand } from './ExpireReservationsCommand';
import { domainEventBus } from '@shared/infrastructure/messaging/DomainEventBus';

export class ExpireReservationsHandler {
  constructor(private reservationRepository: IReservationRepository) {}

  async execute(command: ExpireReservationsCommand): Promise<number> {
    console.log('[Handler] Ejecutando ExpireReservationsCommand...');
    
    // 1. Obtenemos las reservas preparadas en estado 'PENDIENTE_PAGO'
    const obsoleteReservations = await this.reservationRepository.expireObsoleteReservations();
    
    if (obsoleteReservations.length === 0) {
      return 0;
    }

    // 2. FLUJO REACTIVO SEGURO: Muta la entidad y dispara eventos legítimos
    obsoleteReservations.forEach(reservation => {
      // La entidad ejecuta su transición interna real y registra 'ReservationExpired'
      reservation.expirar(); 

      // Sacamos los eventos generados auténticamente por el dominio
      const events = reservation.pullDomainEvents();
      events.forEach(event => {
        domainEventBus.publish(event.eventName, event);
      });
    });

    console.log(`[Handler] Éxito: Se despacharon eventos para ${obsoleteReservations.length} reservaciones.`);
    
    return obsoleteReservations.length;
  }
}