import pool from './connection';
import { runMigrations } from './migrate';

async function resetDatabase() {
  console.log('Eliminando esquema público...');

  await pool.query(`
    DROP SCHEMA public CASCADE;
    CREATE SCHEMA public;
  `);

  console.log('Base reiniciada');

  await runMigrations();

  await pool.end();
}

resetDatabase().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});