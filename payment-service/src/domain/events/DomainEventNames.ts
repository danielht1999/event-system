/**
 * Nombres de eventos de DOMINIO internos (los que emite Payment.pullDomainEvents()).
 * No confundir con el `eventType` del EventEnvelope publicado al broker
 */
export const DomainEventNames = {
  PAYMENT: {
    APPROVED: 'payment.approved',
    REJECTED: 'payment.rejected',
    REFUNDED: 'payment.refunded',
  },
} as const;
