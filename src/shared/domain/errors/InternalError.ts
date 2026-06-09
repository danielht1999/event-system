import { DomainError } from './DomainError';
import { ErrorCategory } from './ErrorCategory';

export class InternalError extends DomainError {
  readonly category = ErrorCategory.INTERNAL;
  readonly code: string = 'INTERNAL_ERROR';

  constructor(message = 'An internal server error occurred') {
    super(message);
  }
}