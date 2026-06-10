import { ConflictError } from '@shared/domain/errors';

export class EmailAlreadyRegisteredError extends ConflictError {
  override readonly code: string = 'EMAIL_ALREADY_REGISTERED';

  constructor(email: string) {
    super(`The email '${email}' is already registered.`);
  }
}