import { ErrorCategory } from './ErrorCategory';

/**
 * Clase base para todo error de dominio de payment-service.
 * `httpStatus` se mantiene por-error (no derivado de `category`) a propósito:
 * es la única forma limpia de expresar la excepción del contrato donde
 * InvalidHmacSignatureError y InvalidWebhookSignatureError comparten
 * category UNAUTHORIZED pero difieren en código HTTP (401 vs 400).
 */
export abstract class AppError extends Error {
  abstract readonly category: ErrorCategory;
  abstract readonly code: string;
  abstract readonly httpStatus: number;
  readonly cause?: unknown;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = this.constructor.name;
    this.cause = options?.cause;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace?.(this, this.constructor);
  }

  toResponse() {
    return {
      status: 'fail' as const,
      category: this.category,
      code: this.code,
      message: this.message,
    };
  }
}

export abstract class DomainError extends AppError {}