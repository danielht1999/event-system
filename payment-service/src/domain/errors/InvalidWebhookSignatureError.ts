import { DomainError } from './AppError';
import { ErrorCategory } from './ErrorCategory';

export class InvalidWebhookSignatureError extends DomainError {
  readonly category = ErrorCategory.UNAUTHORIZED;
  readonly code = 'INVALID_WEBHOOK_SIGNATURE';
  // 400, no 401 — Stripe espera 400 en firma inválida (regla explícita del contrato).
  // Es justo el caso que exige mantener httpStatus por-error y no derivado de category.
  readonly httpStatus = 400;

  constructor(message = 'La firma Stripe-Signature no pudo ser verificada.', options?: { cause?: unknown }) {
    super(message, options);
  }
}