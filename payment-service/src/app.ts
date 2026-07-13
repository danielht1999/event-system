import express, { Request, Response, Express } from 'express';
import { CreatePaymentHandler } from './application/commands/CreatePaymentHandler';
import { IPaymentRepository } from './domain/repositories/IPaymentRepository';
import { StripeWebhookController } from './infrastructure/webhooks/StripeWebhookController';
import { buildPaymentsRouter } from './api/routes/payments.routes';
import { errorHandler } from './api/middlewares/errorHandler';

export interface AppDependencies {
  createPaymentHandler: CreatePaymentHandler;
  paymentRepository: IPaymentRepository;
  hmacSecret: string;
  stripeWebhookController: StripeWebhookController;
}

/**
 * Construye el Express app sin efectos secundarios (no hace listen(), no
 * arranca el OutboxWorker). Separado de server.ts para que los tests de
 * integración puedan levantar el app completo con fakes, sin Postgres/Redis/
 * Stripe reales.
 */
export function buildApp(deps: AppDependencies): Express {
  const app = express();

  // Regla de oro #9: /webhooks/stripe necesita el body crudo, no parseado
  // como JSON — este middleware va ANTES de cualquier express.json() global.
  app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), deps.stripeWebhookController.handle);

  app.use(
    express.json({
      verify: (req, _res, buf) => {
        (req as Request).rawBody = buf;
      },
    }),
  );

  app.use('/', buildPaymentsRouter(deps.createPaymentHandler, deps.paymentRepository, deps.hmacSecret));

  app.get('/metrics', (_req: Request, res: Response) => {
    res.status(200).type('text/plain').send('# payment-service metrics placeholder\n');
  });

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', service: 'payment-service' });
  });

  app.use(errorHandler);

  return app;
}