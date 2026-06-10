import { NotFoundError } from '@shared/domain/errors';

export class UserNotFoundError extends NotFoundError {
  override readonly code: string = 'USER_NOT_FOUND';

  constructor(identifier: string) {
    super(`User with identifier [${identifier}] was not found.`);
  }
}