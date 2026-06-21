import { InfrastructureError} from './InfrastructureError';
import { ErrorCategory } from '@shared/errors';

export class QrGenerationError extends InfrastructureError {
 readonly category = ErrorCategory.INTERNAL;
  readonly code = 'QR_GENERATION_ERROR';

  constructor(
    ticketCode: string,
    cause?: unknown
  ) {
    super(
      `Failed to generate QR code for ticket [${ticketCode}]`,
      { cause }
    );
  }
}