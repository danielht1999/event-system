// src/modules/reservation/application/commands/CancelReservationCommand.ts
export class CancelReservationCommand {
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