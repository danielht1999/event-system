import { ErrorCategory } from './ErrorCategory';

export abstract class DomainError extends Error {
  abstract readonly category: ErrorCategory;
  abstract readonly code: string;

  constructor(message: string) {
    super(message);

    this.name = this.constructor.name;

    Object.setPrototypeOf(this, new.target.prototype);

    Error.captureStackTrace?.(this, this.constructor);
  }
}