import { DomainError } from './AppError';
import { ErrorCategory } from './ErrorCategory';

export class InvalidPaymentStateError extends DomainError {
  readonly category = ErrorCategory.CONFLICT;
  readonly code = 'INVALID_PAYMENT_STATE';
  readonly httpStatus = 409;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
  }
}