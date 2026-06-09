import { ConflictError } from '@shared/domain/errors';

export class EventCapacityExceededError extends ConflictError {
  override readonly code: string = 'EVENT_CAPACITY_EXCEEDED';

  constructor(eventId: string) {
    super(`Event ${eventId} has no available capacity`);
  }
}