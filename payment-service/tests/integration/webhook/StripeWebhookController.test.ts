import request from 'supertest';
import Stripe from 'stripe';
import { buildApp } from '../../../src/app';
import { StripeWebhookController } from '../../../src/infrastructure/webhooks/StripeWebhookController';
import { StripeSignatureVerifier } from '../../../src/infrastructure/webhooks/StripeSignatureVerifier';
import { ConfirmPaymentHandler } from '../../../src/application/commands/ConfirmPaymentHandler';
import { FailPaymentHandler } from '../../../src/application/commands/FailPaymentHandler';
import { CreatePaymentHandler } from '../../../src/application/commands/CreatePaymentHandler';
import { InMemoryPaymentRepository } from '../../support/InMemoryPaymentRepository';
import { FakeUnitOfWork, FakeOutboxStore, FakePaymentGateway, FakeProcessedStripeEventsRepository, FakeReadinessChecker } from '../../support/fakes';
import { Payment } from '../../../src/domain/entities/Payment';
import { Money } from '../../../src/domain/entities/Money';

const WEBHOOK_SECRET = 'whsec_test_secret';

/**
 * `StripeSignatureVerifier.constructEvent` es 100% local (crypto, sin red) —
 * el `stripeSecretKey` que recibe el constructor de Stripe.js NO se usa para
 * verificar webhooks, así que podemos pasar un valor cualquiera aquí.
 */
function buildWebhookHarness() {
  const repo = new InMemoryPaymentRepository();
  const outbox = new FakeOutboxStore();
  const confirmHandler = new ConfirmPaymentHandler(new FakeUnitOfWork(), repo, outbox);
  const failHandler = new FailPaymentHandler(new FakeUnitOfWork(), repo, outbox);
  const verifier = new StripeSignatureVerifier('sk_test_dummy', WEBHOOK_SECRET);
  const processedEvents = new FakeProcessedStripeEventsRepository();
  const controller = new StripeWebhookController(verifier, confirmHandler, failHandler, processedEvents);

  const createHandler = new CreatePaymentHandler(new FakeUnitOfWork(), repo, new FakePaymentGateway());

  const app = buildApp({
    createPaymentHandler: createHandler,
    paymentRepository: repo,
    hmacSecret: 'unused-in-this-suite',
    stripeWebhookController: controller,
    readinessChecker: new FakeReadinessChecker(true),
  });

  return { app, repo, outbox };
}
/** Firma localmente un payload como lo haría Stripe, sin llamar a su API. */
function signStripePayload(payload: object): { rawBody: string; signatureHeader: string } {
  const rawBody = JSON.stringify(payload);
  const signatureHeader = Stripe.webhooks.generateTestHeaderString({
    payload: rawBody,
    secret: WEBHOOK_SECRET,
  });
  return { rawBody, signatureHeader };
}

function fakeStripeEvent(type: string, paymentIntent: Partial<Stripe.PaymentIntent>) {
  return {
    id: `evt_${Math.random().toString(36).slice(2)}`,
    object: 'event',
    type,
    data: { object: { object: 'payment_intent', ...paymentIntent } },
  };
}

describe('POST /webhooks/stripe', () => {
  it('payment_intent.succeeded con firma válida → 200, aprueba el pago, escribe al outbox', async () => {
    const { app, repo, outbox } = buildWebhookHarness();
    await repo.save(
      Payment.create({
        id: 'pay_1',
        reservationId: 'res_1',
        usuarioId: 'user_1',
        money: Money.fromCents(15000, 'MXN'),
        idempotencyKey: 'reservation:res_1',
        providerReference: 'pi_123',
      }),
    );

    const event = fakeStripeEvent('payment_intent.succeeded', {
      id: 'pi_123',
      metadata: { reservationId: 'res_1', paymentId: 'pay_1' },
    });
    const { rawBody, signatureHeader } = signStripePayload(event);

    const res = await request(app)
      .post('/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', signatureHeader)
      .send(rawBody);

    expect(res.status).toBe(200);
    const payment = await repo.findByProviderReference('pi_123');
    expect(payment!.estado).toBe('APROBADO');
    expect(outbox.appended).toHaveLength(1);
  });

  it('firma inválida → 400, no persiste nada', async () => {
    const { app, outbox } = buildWebhookHarness();
    const event = fakeStripeEvent('payment_intent.succeeded', {
      id: 'pi_999',
      metadata: { reservationId: 'res_x', paymentId: 'pay_x' },
    });
    const rawBody = JSON.stringify(event);

    const res = await request(app)
      .post('/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 't=1,v1=firmaInventada')
      .send(rawBody);

    expect(res.status).toBe(400);
    expect(outbox.appended).toHaveLength(0);
  });

  it('payment_intent.payment_failed → 200, rechaza el pago', async () => {
    const { app, repo, outbox } = buildWebhookHarness();
    await repo.save(
      Payment.create({
        id: 'pay_2',
        reservationId: 'res_2',
        usuarioId: 'user_1',
        money: Money.fromCents(15000, 'MXN'),
        idempotencyKey: 'reservation:res_2',
        providerReference: 'pi_456',
      }),
    );

    const event = fakeStripeEvent('payment_intent.payment_failed', {
      id: 'pi_456',
      metadata: { reservationId: 'res_2', paymentId: 'pay_2' },
      last_payment_error: { code: 'card_declined' } as Stripe.PaymentIntent.LastPaymentError,
    });
    const { rawBody, signatureHeader } = signStripePayload(event);

    const res = await request(app)
      .post('/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', signatureHeader)
      .send(rawBody);

    expect(res.status).toBe(200);
    const payment = await repo.findByProviderReference('pi_456');
    expect(payment!.estado).toBe('RECHAZADO');
    expect(outbox.appended[0].eventType).toBe('payment.failed');
  });

  it('evento de tipo no relevante → 200, no toca el dominio', async () => {
    const { app, outbox } = buildWebhookHarness();
    const event = fakeStripeEvent('charge.refunded', { id: 'pi_000' });
    const { rawBody, signatureHeader } = signStripePayload(event);

    const res = await request(app)
      .post('/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', signatureHeader)
      .send(rawBody);

    expect(res.status).toBe(200);
    expect(outbox.appended).toHaveLength(0);
  });
});