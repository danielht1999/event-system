import { DomainError } from './AppError';
import { ErrorCategory } from './ErrorCategory';

export class ValidationError extends DomainError {
  readonly category = ErrorCategory.VALIDATION;
  readonly code = 'VALIDATION_ERROR';
  readonly httpStatus = 400;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
  }
}