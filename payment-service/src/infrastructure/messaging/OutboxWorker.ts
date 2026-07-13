import { pool } from '../database/connection';
import { IEventPublisher } from '../../domain/services/IEventPublisher';
import { EventEnvelope } from '../../domain/events/EventEnvelope';

const PAYMENTS_STREAM = 'payments.events';
const POLL_INTERVAL_MS = 1000;
const BATCH_SIZE = 20;

interface OutboxRow {
  id: string;
  event_id: string;
  payload: EventEnvelope;
}

/**
 * Publica al broker las filas pendientes de outbox_events. Nunca escribe
 * estado de dominio — solo lee lo que ConfirmPaymentHandler/FailPaymentHandler
 * ya persistieron en la misma transacción que el Payment 
 * Corre como loop propio, igual patrón que reservationExpiry.worker.ts en el
 * monolito: proceso aislado, reinicios independientes sin downtime de la API.
 */
export class OutboxWorker {
  private running = false;
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly publisher: IEventPublisher) {}

  start(): void {
    this.running = true;
    this.tick();
  }

  stop(): void {
    this.running = false;
    if (this.timer) clearTimeout(this.timer);
  }

  private tick(): void {
    if (!this.running) return;
    this.dispatchPendingBatch()
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[OutboxWorker] error despachando batch:', err);
      })
      .finally(() => {
        this.timer = setTimeout(() => this.tick(), POLL_INTERVAL_MS);
      });
  }

  private async dispatchPendingBatch(): Promise<void> {
    const { rows } = await pool.query<OutboxRow>(
      `SELECT id, event_id, payload FROM outbox_events
       WHERE dispatched = FALSE
       ORDER BY created_at ASC
       LIMIT $1`,
      [BATCH_SIZE],
    );

    for (const row of rows) {
      await this.publisher.publish(PAYMENTS_STREAM, row.payload);
      await pool.query(
        `UPDATE outbox_events SET dispatched = TRUE, dispatched_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [row.id],
      );
    }
  }
}
