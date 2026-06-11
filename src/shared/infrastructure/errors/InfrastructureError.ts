import { AppError } from '@shared/errors';

export abstract class InfrastructureError extends AppError {

  constructor(
    message: string,
    options?: {
      cause?: unknown;
    }
  ) {
    super(message, options);
  }
}