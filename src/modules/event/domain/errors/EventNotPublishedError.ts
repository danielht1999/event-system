import { ConflictError } from '@shared/domain/errors';

export class EventNotPublishedError extends ConflictError {
  override readonly code: string = 'EVENT_NOT_PUBLISHED';

  constructor(eventId: string) {
    super(`Event [${eventId}] is not published yet.`);
  }
}