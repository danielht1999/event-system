import { ConflictError } from '@shared/domain/errors';

export class EventNotInDraftError extends ConflictError {
  override readonly code: string = 'EVENT_NOT_IN_DRAFT';

  constructor(eventId: string) {
    super(`Event [${eventId}] cannot be modified because it is no longer in draft status.`);
  }
}