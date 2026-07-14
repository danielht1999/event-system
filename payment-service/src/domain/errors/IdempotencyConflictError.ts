import { DomainError } from './AppError';
import { ErrorCategory } from './ErrorCategory';

export class IdempotencyConflictError extends DomainError {
  readonly category = ErrorCategory.CONFLICT;
  readonly code = 'IDEMPOTENCY_CONFLICT';
  readonly httpStatus = 409;

  constructor(idempotencyKey: string, options?: { cause?: unknown }) {
    super(`La Idempotency-Key '${idempotencyKey}' ya fue usada con un cuerpo de petición distinto.`, options);
  }
}