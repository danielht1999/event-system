import { env } from '../../config/env.loader';

import { PostgresUnitOfWork } from '../database/PostgresUnitOfWork';
import { pool } from '../database/connection';
import { PostgresReadinessChecker } from '../health/PostgresReadinessChecker';
import { PostgresPaymentRepository } from '../repositories/PostgresPaymentRepository';
import { PostgresProcessedStripeEventsRepository } from '../repositories/PostgresProcessedStripeEventsRepository';
import { StripePaymentGateway } from '../gateways/StripePaymentGateway';
import { OutboxStore } from '../messaging/OutboxStore';
import { RedisStreamsPublisher } from '../messaging/RedisStreamsPublisher';
import { OutboxWorker } from '../messaging/OutboxWorker';
import { StripeSignatureVerifier } from '../webhooks/StripeSignatureVerifier';
import { StripeWebhookController } from '../webhooks/StripeWebhookController';

import { CreatePaymentHandler } from '../../application/commands/CreatePaymentHandler';
import { ConfirmPaymentHandler } from '../../application/commands/ConfirmPaymentHandler';
import { FailPaymentHandler } from '../../application/commands/FailPaymentHandler';

/**
 * Único lugar que conoce implementaciones concretas
 * Las variables de entorno ya vienen validadas por config/env.loader.ts —
 * este archivo no vuelve a validar nada, solo cablea dependencias.
 */
export function buildContainer() {
  const uow = new PostgresUnitOfWork();
  const paymentRepository = new PostgresPaymentRepository();
  const paymentGateway = new StripePaymentGateway(env.STRIPE_SECRET_KEY);
  const outboxStore = new OutboxStore();
  const eventPublisher = new RedisStreamsPublisher(env.REDIS_URL);

  const createPaymentHandler = new CreatePaymentHandler(uow, paymentRepository, paymentGateway);
  const confirmPaymentHandler = new ConfirmPaymentHandler(uow, paymentRepository, outboxStore);
  const failPaymentHandler = new FailPaymentHandler(uow, paymentRepository, outboxStore);

  const stripeSignatureVerifier = new StripeSignatureVerifier(env.STRIPE_SECRET_KEY, env.STRIPE_WEBHOOK_SECRET);
  const processedStripeEventsRepository = new PostgresProcessedStripeEventsRepository();
  const stripeWebhookController = new StripeWebhookController(
    stripeSignatureVerifier,
    confirmPaymentHandler,
    failPaymentHandler,
    processedStripeEventsRepository,
  );

  const outboxWorker = new OutboxWorker(eventPublisher);
  const readinessChecker = new PostgresReadinessChecker(pool);

  return {
    hmacSecret: env.PAYMENT_SERVICE_HMAC_SECRET,
    paymentRepository,
    createPaymentHandler,
    confirmPaymentHandler,
    failPaymentHandler,
    stripeWebhookController,
    outboxWorker,
    readinessChecker,
  };
}