import { ConflictError } from '@shared/domain/errors';

export class ReservationCheckedInError extends ConflictError {
  override readonly code: string = 'RESERVATION_CHECKED_IN';

  constructor(reservationId: string) {
    super(`Reservation [${reservationId}] cannot be altered because the user has already checked in.`);
  }
}