import { IUnitOfWork } from '../../src/domain/services/IUnitOfWork';
import { IOutboxStore } from '../../src/domain/services/IOutboxStore';
import { IPaymentGatewayService, CreateIntentResult } from '../../src/domain/services/IPaymentGatewayService';
import { IProcessedStripeEventsRepository } from '../../src/domain/repositories/IProcessedStripeEventsRepository';
import { Money } from '../../src/domain/entities/Money';
import { EventEnvelope } from '../../src/domain/events/EventEnvelope';

/** No hay transacción real: solo ejecuta la función con tx=undefined. */
export class FakeUnitOfWork implements IUnitOfWork {
  async execute<T>(fn: (tx: unknown) => Promise<T>): Promise<T> {
    return fn(undefined);
  }
}

/** Guarda los envelopes en memoria para poder aserter sobre ellos en los tests. */
export class FakeOutboxStore implements IOutboxStore {
  readonly appended: EventEnvelope[] = [];

  async append(event: EventEnvelope): Promise<void> {
    this.appended.push(event);
  }
}

/**
 * Simula Stripe sin red: genera un providerReference/clientSecret
 * deterministas y predecibles para los tests. Respeta la idea de
 * idempotencia nativa (mismo paymentId en metadata → mismo resultado).
 */
export class FakePaymentGateway implements IPaymentGatewayService {
  readonly calls: Array<{ money: Money; paymentId: string }> = [];
  private readonly intentsByPaymentId = new Map<string, CreateIntentResult>();

  async createPaymentIntent(params: {
    money: Money;
    metadata: { reservationId: string; paymentId: string };
  }): Promise<CreateIntentResult> {
    this.calls.push({ money: params.money, paymentId: params.metadata.paymentId });

    const existing = this.intentsByPaymentId.get(params.metadata.paymentId);
    if (existing) return existing; // misma idempotencia que Stripe real vía idempotencyKey

    const result: CreateIntentResult = {
      providerReference: `pi_fake_${params.metadata.paymentId}`,
      clientSecret: `pi_fake_${params.metadata.paymentId}_secret_test`,
    };
    this.intentsByPaymentId.set(params.metadata.paymentId, result);
    return result;
  }
}

/** In-memory: reemplaza PostgresProcessedStripeEventsRepository en tests. */
export class FakeProcessedStripeEventsRepository implements IProcessedStripeEventsRepository {
  readonly processed = new Map<string, string | null>();

  async exists(stripeEventId: string): Promise<boolean> {
    return this.processed.has(stripeEventId);
  }

  async markProcessed(stripeEventId: string, paymentId: string | null): Promise<void> {
    this.processed.set(stripeEventId, paymentId);
  }
}