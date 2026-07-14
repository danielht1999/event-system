import { Pool } from 'pg';
import { hasTestDatabase, pool as sharedTestPool } from '../support/dbTestHelpers';
import { PostgresReadinessChecker } from '../../../src/infrastructure/health/PostgresReadinessChecker';

const maybeDescribe = hasTestDatabase ? describe : describe.skip;

maybeDescribe('PostgresReadinessChecker (requiere DATABASE_URL real)', () => {
  afterAll(async () => {
    await sharedTestPool.end();
  });

  it('check() devuelve true contra un Postgres alcanzable', async () => {
    const checker = new PostgresReadinessChecker(sharedTestPool);
    expect(await checker.check()).toBe(true);
  });

  it('check() devuelve false (no lanza) contra un Postgres inalcanzable', async () => {
    // Puerto deliberadamente incorrecto — nada escuchando ahí.
    const unreachablePool = new Pool({
      connectionString: 'postgres://payment_user:payment_pass@localhost:1/payment_service',
      connectionTimeoutMillis: 1000,
    });
    const checker = new PostgresReadinessChecker(unreachablePool);

    expect(await checker.check()).toBe(false);

    await unreachablePool.end();
  }, 10000);
});