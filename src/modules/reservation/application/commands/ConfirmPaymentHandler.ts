// src/modules/reservation/application/commands/ConfirmPaymentHandler.ts
import { ConfirmPaymentCommand } from './ConfirmPaymentCommand';
import { ReservationTransactionService } from '../../infrastructure/services/ReservationTransactionService';

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
    await this.reservationTransactionService.confirmPayment(command.reservationId,command.usuarioId);

    return {
      reservationId: command.reservationId,
      usuarioId: command.usuarioId,
      estado: "CONFIRMADA"
    };
  }
}