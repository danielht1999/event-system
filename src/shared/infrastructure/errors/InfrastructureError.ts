import { AppError } from '@shared/errors';
import { ErrorCategory } from '@shared/errors';

export abstract class InfrastructureError extends AppError {
  readonly category = ErrorCategory.SERVICE_UNAVAILABLE;

  constructor(
    message: string,
    cause?: unknown
  ) {
    super(message, { cause });
  }
}