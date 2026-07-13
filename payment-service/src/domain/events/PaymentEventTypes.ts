export const PaymentEventTypes = {
  PAYMENT_CONFIRMED: 'payment.confirmed',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_REFUNDED: 'payment.refunded',
} as const;

export type PaymentEventType = (typeof PaymentEventTypes)[keyof typeof PaymentEventTypes];
