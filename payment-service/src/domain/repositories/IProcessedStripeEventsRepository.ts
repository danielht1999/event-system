/**
 * Puerto para el dedup de webhooks de Stripe (processed_stripe_events).
 * Antes StripeWebhookController importaba el `pool` de Postgres directamente
 * — funcionaba, pero lo volvía imposible de testear sin una base real y
 * violaba el mismo principio de inyección que ya aplicamos en todo lo demás.
 */
export interface IProcessedStripeEventsRepository {
  exists(stripeEventId: string): Promise<boolean>;
  markProcessed(stripeEventId: string, paymentId: string | null): Promise<void>;
}