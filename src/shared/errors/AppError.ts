import { ErrorCategory } from './ErrorCategory';

export abstract class AppError extends Error {
  public abstract readonly category: ErrorCategory;
  public abstract readonly code: string;
  public readonly cause?: unknown;

  constructor(
    message: string,
    options?: { cause?: unknown }
  ) {
    super(message);
    this.name = this.constructor.name;
    this.cause = options?.cause;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace?.(this, this.constructor);
  }
}