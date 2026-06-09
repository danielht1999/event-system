import { DomainError } from './DomainError';
import { ErrorCategory } from './ErrorCategory';

export class ConflictError extends DomainError {
  readonly category = ErrorCategory.CONFLICT;
  readonly code: string = 'CONFLICT';

  constructor(message = 'Conflict occurred') {
    super(message);
  }
}