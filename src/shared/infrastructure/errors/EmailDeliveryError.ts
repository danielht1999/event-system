import { InfrastructureError} from './InfrastructureError';
import { ErrorCategory } from '@shared/errors';

export class EmailDeliveryError extends InfrastructureError {
  public readonly category = ErrorCategory.SERVICE_UNAVAILABLE;
  public readonly code = 'EMAIL_DELIVERY_ERROR';

  constructor(recipient: string, ticketCode: string, originalError?: unknown) {
    super(
      `No se pudo enviar el ticket digital a [${recipient}]. Control ID: ${ticketCode}.`,
      { cause: originalError }
    );
  }
}