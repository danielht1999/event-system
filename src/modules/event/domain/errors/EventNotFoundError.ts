import { NotFoundError } from '@shared/domain/errors';

export class EventNotFoundError extends NotFoundError {
  override readonly code: string = 'EVENT_NOT_FOUND';

  constructor(eventId: string) {
    super(`Event with ID [${eventId}] was not found.`);
  }
}