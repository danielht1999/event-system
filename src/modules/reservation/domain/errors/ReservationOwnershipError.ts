import { ForbiddenError } from '@shared/domain/errors';

export class ReservationOwnershipError extends ForbiddenError {
  override readonly code: string = 'RESERVATION_OWNERSHIP_ERROR';

  constructor(reservationId: string, userId: string) {
    super(`User [${userId}] does not have permission to access or modify reservation [${reservationId}].`);
  }
}