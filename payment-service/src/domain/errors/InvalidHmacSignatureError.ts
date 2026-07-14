import { DomainError } from './AppError';
import { ErrorCategory } from './ErrorCategory';

export class InvalidHmacSignatureError extends DomainError {
  readonly category = ErrorCategory.UNAUTHORIZED;
  readonly code = 'INVALID_HMAC_SIGNATURE';
  readonly httpStatus = 401;

  constructor(message = 'Firma HMAC inválida o timestamp fuera de ventana.', options?: { cause?: unknown }) {
    super(message, options);
  }
}