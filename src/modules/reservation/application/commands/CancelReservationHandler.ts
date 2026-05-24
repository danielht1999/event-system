// src/modules/reservation/application/commands/CancelReservationHandler.ts
import { CancelReservationCommand } from './CancelReservationCommand';
import { ReservationTransactionService } from '../../infrastructure/services/ReservationTransactionService';

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
    await this.reservationTransactionService.cancelReservation(command.reservationId,command.usuarioId);

    return {
      reservationId: command.reservationId,
      usuarioId: command.usuarioId,
      estado: "CANCELADA"
    };
  }
}