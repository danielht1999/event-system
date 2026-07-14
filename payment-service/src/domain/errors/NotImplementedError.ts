import { DomainError } from './AppError';
import { ErrorCategory } from './ErrorCategory';

export class NotImplementedError extends DomainError {
  readonly category = ErrorCategory.INTERNAL;
  readonly code = 'NOT_IMPLEMENTED';
  readonly httpStatus = 501;

  constructor(feature: string) {
    super(`'${feature}' no está implementado en esta fase.`);
  }
}