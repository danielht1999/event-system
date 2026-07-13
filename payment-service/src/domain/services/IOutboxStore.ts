import { EventEnvelope } from '../events/EventEnvelope';

/**
 * Escritura transaccional del outbox — NUNCA publica directo al broker.
 * transacción. Solo el OutboxWorker (infraestructura) publica al broker.
 */
export interface IOutboxStore {
  append(event: EventEnvelope, tx: unknown): Promise<void>;
}
