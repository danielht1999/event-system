/* eslint-disable @typescript-eslint/no-var-requires */
// Todo este archivo usa require() en vez de `import` a propósito: los
// `import` de TypeScript se hoistean al tope del archivo compilado sin
// importar el orden en que se escriben en el código fuente. Si dotenv.config()
// se escribiera "antes" de un `import { pool } from '.../connection'`, ese
// import igual terminaría ejecutándose primero en el JS compilado, y el
// Pool de pg se construiría con process.env.DATABASE_URL todavía vacío.
// require() no se hoistea — se ejecuta en el orden exacto en que aparece,
// así que esto garantiza que dotenv.config() corre antes de que connection.ts
// lea la variable de entorno.
require('dotenv').config();

import type { Pool } from 'pg';

const fs = require('fs');
const path = require('path');
const { pool } = require('../../../src/infrastructure/database/connection') as { pool: Pool };

export { pool };

/** Si no hay DATABASE_URL, estos tests se saltan (describe.skip) en vez de fallar. */
export const hasTestDatabase = !!process.env.DATABASE_URL;

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', '..', 'src', 'infrastructure', 'database', 'migrations');

/** Idempotente (CREATE TABLE IF NOT EXISTS) — seguro de correr en cada suite. */
export async function ensureMigrations(): Promise<void> {
  if (!hasTestDatabase) return;
  const files: string[] = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f: string) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql: string = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    await pool.query(sql);
  }
}

export async function truncateAll(): Promise<void> {
  await pool.query('TRUNCATE TABLE outbox_events, processed_stripe_events, payments RESTART IDENTITY CASCADE');
}