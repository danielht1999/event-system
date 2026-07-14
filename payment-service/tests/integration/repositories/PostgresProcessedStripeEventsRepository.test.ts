import { randomUUID } from 'node:crypto';
import { hasTestDatabase, ensureMigrations, truncateAll, pool } from '../support/dbTestHelpers';
import { PostgresProcessedStripeEventsRepository } from '../../../src/infrastructure/repositories/PostgresProcessedStripeEventsRepository';
import { PostgresPaymentRepository } from '../../../src/infrastructure/repositories/PostgresPaymentRepository';
import { Payment } from '../../../src/domain/entities/Payment';
import { Money } from '../../../src/domain/entities/Money';

const maybeDescribe = hasTestDatabase ? describe : describe.skip;

maybeDescribe('PostgresProcessedStripeEventsRepository (requiere DATABASE_URL real)', () => {
  const repo = new PostgresProcessedStripeEventsRepository();
  const paymentRepo = new PostgresPaymentRepository();

  beforeAll(async () => {
    await ensureMigrations();
  });

  beforeEach(async () => {
    await truncateAll();
  });

  afterAll(async () => {
    await pool.end();
  });

  it('exists() es false para un evento nunca visto', async () => {
    expect(await repo.exists('evt_nunca_visto')).toBe(false);
  });

  it('markProcessed() + exists() → true', async () => {
    await repo.markProcessed('evt_1', null);
    expect(await repo.exists('evt_1')).toBe(true);
  });

  it('markProcessed() es idempotente: un segundo intento con el mismo id no lanza (ON CONFLICT DO NOTHING)', async () => {
    await repo.markProcessed('evt_2', null);
    await expect(repo.markProcessed('evt_2', null)).resolves.not.toThrow();
  });

  it('markProcessed() con payment_id válido lo persiste (FK contra payments)', async () => {
    const reservationId = randomUUID();
    const payment = Payment.create({
      id: randomUUID(),
      reservationId,
      usuarioId: randomUUID(),
      money: Money.fromCents(1000, 'MXN'),
      idempotencyKey: `reservation:${reservationId}`,
    });
    await paymentRepo.save(payment);

    await repo.markProcessed('evt_3', payment.id);

    const { rows } = await pool.query('SELECT payment_id FROM processed_stripe_events WHERE stripe_event_id = $1', [
      'evt_3',
    ]);
    expect(rows[0].payment_id).toBe(payment.id);
  });

  it('markProcessed() con un payment_id que no existe viola la FK (eventos irrelevantes deben usar null, no inventar un id)', async () => {
    await expect(
      repo.markProcessed('evt_4', '00000000-0000-0000-0000-000000000000'),
    ).rejects.toThrow();
  });

  it('borrar el Payment referenciado deja payment_id en NULL (ON DELETE SET NULL, no CASCADE)', async () => {
    const reservationId = randomUUID();
    const payment = Payment.create({
      id: randomUUID(),
      reservationId,
      usuarioId: randomUUID(),
      money: Money.fromCents(1000, 'MXN'),
      idempotencyKey: `reservation:${reservationId}`,
    });
    await paymentRepo.save(payment);
    await repo.markProcessed('evt_5', payment.id);

    await pool.query('DELETE FROM payments WHERE id = $1', [payment.id]);

    const { rows } = await pool.query('SELECT payment_id FROM processed_stripe_events WHERE stripe_event_id = $1', [
      'evt_5',
    ]);
    // el registro de auditoría sigue existiendo, solo perdió la referencia
    expect(rows).toHaveLength(1);
    expect(rows[0].payment_id).toBeNull();
  });
});