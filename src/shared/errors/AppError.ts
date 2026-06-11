import { ErrorCategory } from './ErrorCategory';

export abstract class AppError extends Error {
  abstract readonly category: ErrorCategory;
  abstract readonly code: string;

  readonly cause?: unknown;

  constructor(
    message: string,
    options?: {
      cause?: unknown;
    }
  ) {
    super(message);

    this.name = this.constructor.name;
    this.cause = options?.cause;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace?.(this, this.constructor);
  }
}
