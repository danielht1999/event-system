import { DomainError } from './DomainError';
import { ErrorCategory } from './ErrorCategory';

export class ValidationError extends DomainError {
  readonly category = ErrorCategory.VALIDATION;
  readonly code: string = 'VALIDATION_ERROR';

  constructor(
    message = 'Validation failed',
    public readonly details?: unknown
  ) {
    super(message);
  }
}