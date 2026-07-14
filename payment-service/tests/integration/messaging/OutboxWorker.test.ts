import { hasTestDatabase, ensureMigrations, pool } from '../support/dbTestHelpers';
import { randomUUID } from 'node:crypto';
import Redis from 'ioredis';
import { OutboxWorker } from '../../../src/infrastructure/messaging/OutboxWorker';
import { RedisStreamsPublisher } from '../../../src/infrastructure/messaging/RedisStreamsPublisher';
import { EventEnvelope } from '../../../src/domain/events/EventEnvelope';
import { PaymentEventTypes } from '../../../src/domain/events/PaymentEventTypes';

const hasRedis = !!process.env.REDIS_URL;
const maybeDescribe = hasTestDatabase && hasRedis ? describe : describe.skip;
const STREAM = 'payments.events'; // mismo nombre hardcoded que OutboxWorker usa internamente

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

if (!hasTestDatabase || !hasRedis) {
  // eslint-disable-next-line no-console
  console.warn(
    '[OutboxWorker.test] DATABASE_URL y/o REDIS_URL no definidas — se salta esta suite. ' +
      'Corre "npm run test:db" con Postgres y Redis levantados para ejecutarla.',
  );
}

maybeDescribe('OutboxWorker (requiere DATABASE_URL y REDIS_URL reales)', () => {
  let publisher: RedisStreamsPublisher;
  let inspector: Redis;
  let worker: OutboxWorker | undefined;

  beforeAll(async () => {
    await ensureMigrations();
    publisher = new RedisStreamsPublisher(process.env.REDIS_URL as string);
    inspector = new Redis(process.env.REDIS_URL as string);
  });

  beforeEach(async () => {
    await pool.query('TRUNCATE TABLE outbox_events RESTART IDENTITY CASCADE');
    await inspector.del(STREAM);
  });

  afterEach(() => {
    worker?.stop();
    worker = undefined;
  });

  afterAll(async () => {
    await inspector.del(STREAM);
    await inspector.quit();
    await publisher.disconnect();
    await pool.end();
  });

  it('publica un evento PENDIENTE del outbox a Redis Streams y lo marca dispatched', async () => {
    const eventId = randomUUID();
    const envelope: EventEnvelope = {
      eventId,
      eventType: PaymentEventTypes.PAYMENT_CONFIRMED,
      schemaVersion: 1,
      occurredAt: new Date().toISOString(),
      correlationId: 'res_outbox_1',
      producer: 'payment-service',
      payload: { paymentId: 'pay_outbox_1', reservationId: 'res_outbox_1' },
    };

    // Simula lo que ConfirmPaymentHandler + OutboxStore ya dejaron escrito
    // en la misma transacción — el worker solo debe leer y despachar esto.
    await pool.query(
      `INSERT INTO outbox_events (id, event_id, event_type, payload, dispatched)
       VALUES ($1, $2, $3, $4, FALSE)`,
      [randomUUID(), envelope.eventId, envelope.eventType, JSON.stringify(envelope)],
    );

    worker = new OutboxWorker(publisher);
    worker.start();

    // El worker sondea cada 1s (POLL_INTERVAL_MS) — esperamos hasta 3s.
    let dispatched = false;
    for (let i = 0; i < 6; i++) {
      const { rows } = await pool.query('SELECT dispatched FROM outbox_events WHERE event_id = $1', [eventId]);
      if (rows[0]?.dispatched) {
        dispatched = true;
        break;
      }
      await sleep(500);
    }
    expect(dispatched).toBe(true);

    const entries = await inspector.xrange(STREAM, '-', '+');
    expect(entries.length).toBeGreaterThan(0);

    const match = entries.find(([, fields]) => {
      const raw = fields[fields.indexOf('event') + 1];
      return JSON.parse(raw).eventId === eventId;
    });
    expect(match).toBeDefined();
  }, 10000);

  it('no vuelve a despachar un evento que ya tiene dispatched = TRUE', async () => {
    const eventId = randomUUID();
    await pool.query(
      `INSERT INTO outbox_events (id, event_id, event_type, payload, dispatched, dispatched_at)
       VALUES ($1, $2, $3, $4, TRUE, now())`,
      [randomUUID(), eventId, PaymentEventTypes.PAYMENT_CONFIRMED, JSON.stringify({ eventId })],
    );

    worker = new OutboxWorker(publisher);
    worker.start();
    await sleep(1500);

    const entries = await inspector.xrange(STREAM, '-', '+');
    const found = entries.some(([, fields]) => {
      const raw = fields[fields.indexOf('event') + 1];
      return JSON.parse(raw).eventId === eventId;
    });
    expect(found).toBe(false);
  }, 5000);
});