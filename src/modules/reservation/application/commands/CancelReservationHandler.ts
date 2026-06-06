// src/modules/reservation/application/commands/CancelReservationHandler.ts
import { CancelReservationCommand } from './CancelReservationCommand';
import { ReservationTransactionService } from '../../infrastructure/services/ReservationTransactionService';
import { domainEventBus } from '@shared/infrastructure/messaging/DomainEventBus'; 

export interface ReservationResult {
  reservationId: string;
  usuarioId: string;
  estado: string;
}

export class CancelReservationHandler {
  constructor(
    private reservationTransactionService: ReservationTransactionService
  ) {}

  async execute(command: CancelReservationCommand): Promise<ReservationResult> {
    // 1. Transacción de cancelación y retorno de entidad rica
    const reservation = await this.reservationTransactionService.cancelReservation(
      command.reservationId,
      command.usuarioId
    );

    // 2. Extraemos los eventos
    const events = reservation.pullDomainEvents();

    // 3. Despachamos al bus existente
    events.forEach(event => {
      domainEventBus.publish(event.eventName, event);
    });

    return {
      reservationId: reservation.id,
      usuarioId: reservation.usuarioId,
      estado: reservation.estado
    };
  }
}