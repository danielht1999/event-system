import { randomUUID } from 'node:crypto';
import { hasTestDatabase, ensureMigrations, truncateAll, pool } from '../support/dbTestHelpers';
import { PostgresPaymentRepository } from '../../../src/infrastructure/repositories/PostgresPaymentRepository';
import { Payment } from '../../../src/domain/entities/Payment';
import { Money } from '../../../src/domain/entities/Money';

const maybeDescribe = hasTestDatabase ? describe : describe.skip;

if (!hasTestDatabase) {
  // eslint-disable-next-line no-console
  console.warn(
    '[PostgresPaymentRepository.test] DATABASE_URL no está definida — se salta esta suite. ' +
      'Corre "npm run test:db" con Postgres levantado para ejecutarla.',
  );
}

maybeDescribe('PostgresPaymentRepository (requiere DATABASE_URL real)', () => {
  const repo = new PostgresPaymentRepository();

  beforeAll(async () => {
    await ensureMigrations();
  });

  beforeEach(async () => {
    await truncateAll();
  });

  afterAll(async () => {
    await pool.end();
  });

  // id y reservation_id son UUID en el schema — no vale usar strings tipo
  // 'pay_1' aunque las fakes en memoria de tests/unit sí lo permitan.
  function buildPayment(overrides: { id?: string; reservationId?: string; providerReference?: string } = {}) {
    const reservationId = overrides.reservationId ?? randomUUID();
    return Payment.create({
      id: overrides.id ?? randomUUID(),
      reservationId,
      usuarioId: randomUUID(),
      money: Money.fromCents(15000, 'MXN'),
      idempotencyKey: `reservation:${reservationId}`,
      providerReference: overrides.providerReference,
    });
  }

  it('save() + findById() hace round-trip completo (Money, estado, providerReference)', async () => {
    const payment = buildPayment({ providerReference: 'pi_pg_1' });
    await repo.save(payment);

    const found = await repo.findById(payment.id);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(payment.id);
    expect(found!.reservationId).toBe(payment.reservationId);
    expect(found!.money.amountCents).toBe(15000);
    expect(found!.money.currency).toBe('MXN');
    expect(found!.estado).toBe('PENDIENTE');
    expect(found!.providerReference).toBe('pi_pg_1');
  });

  it('findById() con id inexistente devuelve null', async () => {
    const found = await repo.findById('00000000-0000-0000-0000-000000000000');
    expect(found).toBeNull();
  });

  it('findByReservationId() encuentra por reserva', async () => {
    const payment = buildPayment();
    await repo.save(payment);
    const found = await repo.findByReservationId(payment.reservationId);
    expect(found!.id).toBe(payment.id);
  });

  it('findByIdempotencyKey() encuentra por idempotency key', async () => {
    const payment = buildPayment();
    await repo.save(payment);
    const found = await repo.findByIdempotencyKey(payment.idempotencyKey);
    expect(found!.id).toBe(payment.id);
  });

  it('findByProviderReference() encuentra por provider reference', async () => {
    const payment = buildPayment({ providerReference: 'pi_pg_2' });
    await repo.save(payment);
    const found = await repo.findByProviderReference('pi_pg_2');
    expect(found!.id).toBe(payment.id);
  });

  it('save() sobre un Payment existente actualiza estado (ON CONFLICT DO UPDATE, no duplica filas)', async () => {
    const payment = buildPayment({ providerReference: 'pi_pg_3' });
    await repo.save(payment);

    payment.aprobar('pi_pg_3');
    await repo.save(payment);

    const found = await repo.findById(payment.id);
    expect(found!.estado).toBe('APROBADO');

    const { rows } = await pool.query('SELECT count(*)::int AS n FROM payments WHERE id = $1', [payment.id]);
    expect(rows[0].n).toBe(1);
  });

  it('reservation_id es UNIQUE: una reserva no puede tener dos Payments (invariante de negocio)', async () => {
    const reservationId = randomUUID();
    const a = buildPayment({ reservationId });
    const b = Payment.create({
      id: randomUUID(),
      reservationId, // misma reserva, distinto Payment
      usuarioId: randomUUID(),
      money: Money.fromCents(1, 'MXN'),
      idempotencyKey: `reservation:${reservationId}:retry`,
    });

    await repo.save(a);
    await expect(repo.save(b)).rejects.toThrow();
  });

  it('idempotency_key es UNIQUE', async () => {
    const sharedKey = `reservation:${randomUUID()}`;
    const a = Payment.create({
      id: randomUUID(),
      reservationId: randomUUID(),
      usuarioId: randomUUID(),
      money: Money.fromCents(1000, 'MXN'),
      idempotencyKey: sharedKey,
    });
    const b = Payment.create({
      id: randomUUID(),
      reservationId: randomUUID(),
      usuarioId: randomUUID(),
      money: Money.fromCents(1000, 'MXN'),
      idempotencyKey: sharedKey, // mismo key
    });

    await repo.save(a);
    await expect(repo.save(b)).rejects.toThrow();
  });
});