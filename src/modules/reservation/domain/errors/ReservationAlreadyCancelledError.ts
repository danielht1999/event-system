import { ConflictError } from '@shared/domain/errors';

export class ReservationAlreadyCancelledError extends ConflictError {
  override readonly code: string = 'RESERVATION_ALREADY_CANCELLED';

  constructor(reservationId: string) {
    super(`Reservation [${reservationId}] has already been cancelled.`);
  }
}