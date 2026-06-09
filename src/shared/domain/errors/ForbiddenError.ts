import { DomainError } from './DomainError';
import { ErrorCategory } from './ErrorCategory';

export class ForbiddenError extends DomainError {
  readonly category = ErrorCategory.FORBIDDEN;
  readonly code: string = 'FORBIDDEN';

  constructor(message = 'You do not have permission to perform this action') {
    super(message);
  }
}