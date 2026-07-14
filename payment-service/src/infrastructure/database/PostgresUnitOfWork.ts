import { PoolClient } from 'pg';
import { IUnitOfWork } from '../../domain/services/IUnitOfWork';
import { pool } from './connection';

export class PostgresUnitOfWork implements IUnitOfWork {
  async execute<T>(fn: (tx: unknown) => Promise<T>): Promise<T> {
    const client: PoolClient = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
