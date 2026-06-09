import { DomainError } from './DomainError';
import { ErrorCategory } from './ErrorCategory';

export class NotFoundError extends DomainError {
  readonly category = ErrorCategory.NOT_FOUND;
  readonly code: string = 'NOT_FOUND';

  constructor(message = 'Resource not found') {
    super(message);
  }
}