import { InfrastructureError } from './InfrastructureError';

export class EmailDeliveryError extends InfrastructureError {
  readonly code = 'EMAIL_DELIVERY_ERROR';

  constructor(
    message = 'Failed to deliver email',
    cause?: unknown
  ) {
    super(message, { cause });
  }
}