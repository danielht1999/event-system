import { randomUUID } from 'node:crypto';
import { IOutboxStore } from '../../domain/services/IOutboxStore';
import { EventEnvelope } from '../../domain/events/EventEnvelope';
import { asClient } from '../database/connection';

export class OutboxStore implements IOutboxStore {
  async append(event: EventEnvelope, tx: unknown): Promise<void> {
    const client = asClient(tx);
    await client.query(
      `INSERT INTO outbox_events (id, event_id, event_type, payload, dispatched)
       VALUES ($1, $2, $3, $4, FALSE)`,
      [randomUUID(), event.eventId, event.eventType, JSON.stringify(event)],
    );
  }
}
