import { UnauthorizedError } from '@shared/domain/errors';

export class InvalidCredentialsError extends UnauthorizedError {
  override readonly code: string = 'INVALID_CREDENTIALS';

  constructor(message = 'Invalid email or password.') {
    super(message);
  }
}