import { NotFoundError } from '@shared/domain/errors';

export class ReservationNotFoundError extends NotFoundError {
  override readonly code: string = 'RESERVATION_NOT_FOUND';

  constructor(reservationId: string) {
    super(`Reservation with ID [${reservationId}] was not found.`);
  }
}