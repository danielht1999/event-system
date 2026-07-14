import Stripe from 'stripe';

/**
 * No usa HMAC propio — usa la verificación nativa del SDK de Stripe
 * (constructEvent), que valida `Stripe-Signature` contra STRIPE_WEBHOOK_SECRET.
 * Requiere el body crudo 
 */
export class StripeSignatureVerifier {
  private readonly stripe: Stripe;

  constructor(
    stripeSecretKey: string,
    private readonly webhookSecret: string,
  ) {
    this.stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });
  }

  /** Lanza si la firma no verifica; el caller debe traducir eso a 400. */
  constructEvent(rawBody: Buffer, signatureHeader: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(rawBody, signatureHeader, this.webhookSecret);
  }
}
