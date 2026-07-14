import { DomainError } from './AppError';
import { ErrorCategory } from './ErrorCategory';

export class InvalidMoneyError extends DomainError {
  readonly category = ErrorCategory.VALIDATION;
  readonly code = 'INVALID_MONEY';
  readonly httpStatus = 400;

  constructor(message: string) {
    super(message);
  }
}