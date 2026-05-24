// src/modules/reservation/application/commands/ConfirmPaymentCommand.ts
export class ConfirmPaymentCommand {
    readonly reservationId: string;
    readonly usuarioId: string;

    constructor(data: { reservationId: string; usuarioId: string }) {
    if (!data.reservationId || !data.usuarioId) {
      throw new Error('Reservacion y usuario requeridos');
    }
    this.reservationId = data.reservationId;
    this.usuarioId = data.usuarioId;
  }
}