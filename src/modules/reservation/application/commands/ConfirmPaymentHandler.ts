// src/modules/reservation/application/commands/ConfirmPaymentHandler.ts
import { ConfirmPaymentCommand } from './ConfirmPaymentCommand';
import { ReservationTransactionService } from '../../infrastructure/services/ReservationTransactionService';
import { domainEventBus } from '@shared/infrastructure/messaging/DomainEventBus'; 

export interface ReservationResult {
  reservationId: string;
  usuarioId: string;
  estado: string;
}

export class ConfirmPaymentHandler {
  constructor(
    private reservationTransactionService: ReservationTransactionService
  ) {}

  async execute(command: ConfirmPaymentCommand): Promise<ReservationResult> {
    // 1. Transacción e inversión de control con el Dominio
    const reservation = await this.reservationTransactionService.confirmPayment(
      command.reservationId,
      command.usuarioId
    );

    // 2. Extraemos los eventos acumulados en la entidad
    const events = reservation.pullDomainEvents();

    // 3. Despachamos uno a uno usando la firma real de tu DomainEventBus
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