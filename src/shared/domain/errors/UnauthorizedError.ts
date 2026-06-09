import { DomainError } from './DomainError';
import { ErrorCategory } from './ErrorCategory';

export class UnauthorizedError extends DomainError {
  readonly category = ErrorCategory.UNAUTHORIZED;
  readonly code: string = 'UNAUTHORIZED';

  constructor(message = 'Unauthorized') {
    super(message);
  }
}