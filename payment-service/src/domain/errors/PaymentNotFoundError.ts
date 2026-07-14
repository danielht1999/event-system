import { DomainError } from './AppError';
import { ErrorCategory } from './ErrorCategory';

export class PaymentNotFoundError extends DomainError {
  readonly category = ErrorCategory.NOT_FOUND;
  readonly code = 'PAYMENT_NOT_FOUND';
  readonly httpStatus = 404;

  constructor(identifier: string, options?: { cause?: unknown }) {
    super(`No se encontró el pago solicitado (${identifier}).`, options);
  }
}