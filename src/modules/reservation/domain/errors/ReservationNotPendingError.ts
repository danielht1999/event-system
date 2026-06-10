import { ConflictError } from '@shared/domain/errors';

export class ReservationNotPendingError extends ConflictError {
  override readonly code: string = 'RESERVATION_NOT_PENDING';

  constructor(reservationId: string) {
    super(`Reservation [${reservationId}] cannot complete payment because it is not in PENDING status.`);
  }
}