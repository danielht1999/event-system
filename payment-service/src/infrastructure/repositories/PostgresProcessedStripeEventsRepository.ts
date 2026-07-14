import { IProcessedStripeEventsRepository } from '../../domain/repositories/IProcessedStripeEventsRepository';
import { pool } from '../database/connection';

export class PostgresProcessedStripeEventsRepository implements IProcessedStripeEventsRepository {
  async exists(stripeEventId: string): Promise<boolean> {
    const { rows } = await pool.query('SELECT 1 FROM processed_stripe_events WHERE stripe_event_id = $1', [
      stripeEventId,
    ]);
    return rows.length > 0;
  }

  async markProcessed(stripeEventId: string, paymentId: string | null): Promise<void> {
    await pool.query(
      'INSERT INTO processed_stripe_events (stripe_event_id, payment_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [stripeEventId, paymentId],
    );
  }
}