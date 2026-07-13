import request from 'supertest';
import { buildApp } from '../../../src/app';
import { CreatePaymentHandler } from '../../../src/application/commands/CreatePaymentHandler';
import { InMemoryPaymentRepository } from '../../support/InMemoryPaymentRepository';
import { FakeUnitOfWork, FakePaymentGateway } from '../../support/fakes';
import { signRequest } from '../../support/signRequest';
import { StripeWebhookController } from '../../../src/infrastructure/webhooks/StripeWebhookController';

const HMAC_SECRET = 'test-secret';

function buildTestApp() {
  const repo = new InMemoryPaymentRepository();
  const gateway = new FakePaymentGateway();
  const createPaymentHandler = new CreatePaymentHandler(new FakeUnitOfWork(), repo, gateway);

  // El webhook no se ejercita en este archivo (ver StripeWebhookController.test.ts),
  // pero buildApp lo requiere para montar la ruta — se le pasa un stub inerte.
  const stripeWebhookControllerStub = { handle: (_req: any, res: any) => res.status(200).end() } as unknown as StripeWebhookController;

  const app = buildApp({
    createPaymentHandler,
    paymentRepository: repo,
    hmacSecret: HMAC_SECRET,
    stripeWebhookController: stripeWebhookControllerStub,
  });

  return { app, repo };
}

function payload() {
  return {
    reservationId: '11111111-1111-1111-1111-111111111111',
    usuarioId: '22222222-2222-2222-2222-222222222222',
    amountCents: 15000,
    currency: 'MXN',
  };
}

describe('POST /payments', () => {
  it('GET /health responde 200 sin autenticación', async () => {
    const { app } = buildTestApp();
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('crea el pago con firma HMAC válida → 201', async () => {
    const { app } = buildTestApp();
    const body = payload();
    const rawBody = JSON.stringify(body);
    const headers = signRequest(HMAC_SECRET, rawBody);

    const res = await request(app)
      .post('/payments')
      .set('Idempotency-Key', `reservation:${body.reservationId}`)
      .set('X-Timestamp', headers['X-Timestamp'])
      .set('X-Signature', headers['X-Signature'])
      .send(body);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('PENDIENTE');
    expect(res.body.paymentId).toBeDefined();
    expect(res.body.clientSecret).toBeDefined();
  });

  it('rechaza firma HMAC inválida → 401', async () => {
    const { app } = buildTestApp();
    const body = payload();

    const res = await request(app)
      .post('/payments')
      .set('Idempotency-Key', `reservation:${body.reservationId}`)
      .set('X-Timestamp', Date.now().toString())
      .set('X-Signature', '0'.repeat(64))
      .send(body);

    expect(res.status).toBe(401);
    expect(res.body.category).toBe('UNAUTHORIZED');
  });

  it('rechaza timestamp fuera de la ventana de 5 minutos (anti-replay) → 401', async () => {
    const { app } = buildTestApp();
    const body = payload();
    const rawBody = JSON.stringify(body);
    const staleTimestamp = (Date.now() - 10 * 60 * 1000).toString(); // 10 min atrás
    const headers = signRequest(HMAC_SECRET, rawBody, staleTimestamp);

    const res = await request(app)
      .post('/payments')
      .set('Idempotency-Key', `reservation:${body.reservationId}`)
      .set('X-Timestamp', headers['X-Timestamp'])
      .set('X-Signature', headers['X-Signature'])
      .send(body);

    expect(res.status).toBe(401);
  });

  it('rechaza body inválido (Joi) → 400', async () => {
    const { app } = buildTestApp();
    const body = { ...payload(), amountCents: -5 };
    const rawBody = JSON.stringify(body);
    const headers = signRequest(HMAC_SECRET, rawBody);

    const res = await request(app)
      .post('/payments')
      .set('Idempotency-Key', 'reservation:x')
      .set('X-Timestamp', headers['X-Timestamp'])
      .set('X-Signature', headers['X-Signature'])
      .send(body);

    expect(res.status).toBe(400);
  });

  it('falta el header Idempotency-Key → 400', async () => {
    const { app } = buildTestApp();
    const body = payload();
    const rawBody = JSON.stringify(body);
    const headers = signRequest(HMAC_SECRET, rawBody);

    const res = await request(app)
      .post('/payments')
      .set('X-Timestamp', headers['X-Timestamp'])
      .set('X-Signature', headers['X-Signature'])
      .send(body);

    expect(res.status).toBe(400);
  });

  it('GET /payments/:id devuelve el pago recién creado', async () => {
    const { app } = buildTestApp();
    const body = payload();
    const rawBody = JSON.stringify(body);
    const createHeaders = signRequest(HMAC_SECRET, rawBody);

    const createRes = await request(app)
      .post('/payments')
      .set('Idempotency-Key', `reservation:${body.reservationId}`)
      .set('X-Timestamp', createHeaders['X-Timestamp'])
      .set('X-Signature', createHeaders['X-Signature'])
      .send(body);

    const getHeaders = signRequest(HMAC_SECRET, '');
    const getRes = await request(app)
      .get(`/payments/${createRes.body.paymentId}`)
      .set('X-Timestamp', getHeaders['X-Timestamp'])
      .set('X-Signature', getHeaders['X-Signature']);

    expect(getRes.status).toBe(200);
    expect(getRes.body.status).toBe('PENDIENTE');
    expect(getRes.body.amountCents).toBe(15000);
  });

  it('GET /payments/:id con id inexistente → 404', async () => {
    const { app } = buildTestApp();
    const getHeaders = signRequest(HMAC_SECRET, '');

    const res = await request(app)
      .get('/payments/00000000-0000-0000-0000-000000000000')
      .set('X-Timestamp', getHeaders['X-Timestamp'])
      .set('X-Signature', getHeaders['X-Signature']);

    expect(res.status).toBe(404);
  });
});