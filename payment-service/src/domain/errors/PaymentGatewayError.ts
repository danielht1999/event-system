import { DomainError } from './AppError';
import { ErrorCategory } from './ErrorCategory';

export class PaymentGatewayError extends DomainError {
  readonly category = ErrorCategory.GATEWAY_ERROR;
  readonly code = 'PAYMENT_GATEWAY_ERROR';
  readonly httpStatus = 502;

  // el error crudo de Stripe nunca se expone al cliente.
  // Se pasa como `cause` (no como `message`) para que solo llegue a logs
  // internos, nunca a la respuesta HTTP (toResponse() no serializa `cause`).
  constructor(message = 'La pasarela de pago no pudo procesar la solicitud.', options?: { cause?: unknown }) {
    super(message, options);
  }
}