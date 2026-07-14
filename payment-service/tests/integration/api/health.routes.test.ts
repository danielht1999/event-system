import request from 'supertest';
import { buildApp } from '../../../src/app';
import { CreatePaymentHandler } from '../../../src/application/commands/CreatePaymentHandler';
import { InMemoryPaymentRepository } from '../../support/InMemoryPaymentRepository';
import { FakeUnitOfWork, FakePaymentGateway, FakeReadinessChecker } from '../../support/fakes';
import { StripeWebhookController } from '../../../src/infrastructure/webhooks/StripeWebhookController';

function buildTestApp(readinessChecker: FakeReadinessChecker) {
  const repo = new InMemoryPaymentRepository();
  const createPaymentHandler = new CreatePaymentHandler(new FakeUnitOfWork(), repo, new FakePaymentGateway());
  const stripeWebhookControllerStub = { handle: (_req: any, res: any) => res.status(200).end() } as unknown as StripeWebhookController;

  return buildApp({
    createPaymentHandler,
    paymentRepository: repo,
    hmacSecret: 'unused-in-this-suite',
    stripeWebhookController: stripeWebhookControllerStub,
    readinessChecker,
  });
}

describe('GET /health', () => {
  it('siempre responde 200, incluso si el readinessChecker diría que no está listo (liveness ≠ readiness)', async () => {
    const app = buildTestApp(new FakeReadinessChecker(false));
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('GET /ready', () => {
  it('responde 200 { status: "ready" } cuando el checker dice que sí', async () => {
    const app = buildTestApp(new FakeReadinessChecker(true));
    const res = await request(app).get('/ready');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ready' });
  });

  it('responde 503 { status: "not-ready" } cuando el checker dice que no', async () => {
    const app = buildTestApp(new FakeReadinessChecker(false));
    const res = await request(app).get('/ready');
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: 'not-ready' });
  });

  it('no filtra detalles internos en la respuesta (sin stack, sin connection string)', async () => {
    const app = buildTestApp(new FakeReadinessChecker(false));
    const res = await request(app).get('/ready');
    const body = JSON.stringify(res.body);
    expect(body).not.toMatch(/postgres:\/\//);
    expect(body).not.toMatch(/at\s+.*\(.*:\d+:\d+\)/); // forma típica de una línea de stack trace
  });
});