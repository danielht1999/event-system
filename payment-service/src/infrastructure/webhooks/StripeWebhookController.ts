import { Request, Response } from 'express';
import Stripe from 'stripe';
import { StripeSignatureVerifier } from './StripeSignatureVerifier';
import { ConfirmPaymentHandler } from '../../application/commands/ConfirmPaymentHandler';
import { ConfirmPaymentCommand } from '../../application/commands/ConfirmPaymentCommand';
import { FailPaymentHandler } from '../../application/commands/FailPaymentHandler';
import { FailPaymentCommand, PaymentFailureReason } from '../../application/commands/FailPaymentCommand';
import { IProcessedStripeEventsRepository } from '../../domain/repositories/IProcessedStripeEventsRepository';
import { InvalidWebhookSignatureError } from '../../domain/errors';

/**
 * Flujo (PAYMENT_SERVICE_CONTRACTS.md, sección 2, POST /webhooks/stripe):
 * 1. Verificar Stripe-Signature sobre el body crudo → si falla, 400, nada persiste.
 * 2. Deduplicar por stripeEvent.id contra processed_stripe_events.
 * 3. Mapear el tipo de evento al comando correspondiente.
 * 4. Ejecutar el handler (misma transacción: Payment + outbox_events).
 * 5. Insertar en processed_stripe_events.
 * 6. Responder 200 aunque el OutboxWorker no haya publicado aún (async, no bloquea).
 *
 * El dedup ya no toca el `pool` de Postgres directamente — recibe
 * IProcessedStripeEventsRepository inyectado, igual que el resto de puertos
 * del proyecto. Esto es lo que permite testear este controller con un fake,
 * sin una base real (ver tests/integration/webhook/).
 */
export class StripeWebhookController {
  constructor(
    private readonly verifier: StripeSignatureVerifier,
    private readonly confirmPaymentHandler: ConfirmPaymentHandler,
    private readonly failPaymentHandler: FailPaymentHandler,
    private readonly processedEventsRepository: IProcessedStripeEventsRepository,
  ) {}

  handle = async (req: Request, res: Response): Promise<void> => {
    const signature = req.headers['stripe-signature'];
    let event: Stripe.Event;

    try {
      if (typeof signature !== 'string') throw new InvalidWebhookSignatureError();
      // req.body debe ser el Buffer crudo — configurado en server.ts/app.ts con
      // express.raw() exclusivamente para esta ruta (regla de oro #9).
      event = this.verifier.constructEvent(req.body as Buffer, signature);
    } catch (err) {
      res.status(400).json({ status: 'fail', category: 'UNAUTHORIZED', code: 'INVALID_WEBHOOK_SIGNATURE', message: 'Firma inválida.' });
      return;
    }

    const alreadyProcessed = await this.processedEventsRepository.exists(event.id);
    if (alreadyProcessed) {
      res.status(200).json({ received: true, deduped: true });
      return;
    }

    try {
      const paymentId = await this.dispatch(event);
      await this.processedEventsRepository.markProcessed(event.id, paymentId);
      res.status(200).json({ received: true });
    } catch (err) {
      // Cualquier fallo aquí → 500, Stripe reintentará automáticamente.
      // eslint-disable-next-line no-console
      console.error('[StripeWebhookController] error procesando evento', event.id, err);
      res.status(500).json({ status: 'fail', category: 'INTERNAL', code: 'WEBHOOK_PROCESSING_FAILED', message: 'Error interno procesando el evento.' });
    }
  };

  /** Devuelve el paymentId resuelto (para trazabilidad en processed_stripe_events), o null si el evento no aplica a este dominio. */
  private async dispatch(event: Stripe.Event): Promise<string | null> {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object as Stripe.PaymentIntent;
        await this.confirmPaymentHandler.execute(new ConfirmPaymentCommand(intent.id));
        // metadata.paymentId fue seteado por CreatePaymentHandler al crear el
        // intent (ver StripePaymentGateway) — Stripe lo devuelve tal cual en
        // cada evento posterior, no hace falta ir a buscarlo a la base.
        return intent.metadata?.paymentId ?? null;
      }
      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent;
        const reason = this.mapFailureReason(intent.last_payment_error?.code);
        await this.failPaymentHandler.execute(new FailPaymentCommand(intent.id, reason));
        return intent.metadata?.paymentId ?? null;
      }
      default:
        // Tipo de evento no relevante para este dominio — se ignora silenciosamente,
        // pero igual se marca como procesado para no reintentar indefinidamente.
        return null;
    }
  }

  private mapFailureReason(stripeCode: string | undefined): PaymentFailureReason {
    switch (stripeCode) {
      case 'card_declined':
        return 'card_declined';
      case 'insufficient_funds':
        return 'insufficient_funds';
      default:
        return 'unknown';
    }
  }
}