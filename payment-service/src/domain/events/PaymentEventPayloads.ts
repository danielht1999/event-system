export interface PaymentConfirmedPayload {
  paymentId: string;
  reservationId: string;
  amountCents: number; // entero, centavos — nunca pesos con decimales, nunca float
  currency: string; // ISO 4217, por ahora siempre 'MXN'
  provider: 'stripe';
  providerReference: string; // PaymentIntent.id
  confirmedAt: string;
}

export type PaymentFailureReason =
  | 'card_declined'
  | 'insufficient_funds'
  | 'gateway_timeout'
  | 'expired_intent'
  | 'unknown';

export interface PaymentFailedPayload {
  paymentId: string;
  reservationId: string;
  reason: PaymentFailureReason;
  failedAt: string;
}

export interface PaymentRefundedPayload {
  paymentId: string;
  reservationId: string;
  amountCents: number;
  refundedAt: string;
}
