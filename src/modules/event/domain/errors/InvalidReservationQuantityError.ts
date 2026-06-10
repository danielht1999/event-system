// src/modules/event/domain/errors/InvalidReservationQuantityError.ts
import { ConflictError } from '@shared/domain/errors';

export class InvalidReservationQuantityError extends ConflictError {
  override readonly code: string = 'INVALID_RESERVATION_QUANTITY';

  constructor(requested: number, maxAllowed: number = 4) {
    super(`Cannot reserve ${requested} tickets. Maximum allowed per person is ${maxAllowed}.`);
  }
}