import pool from '@shared/infrastructure/database/connection';
import { PoolClient, Pool } from 'pg';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/entities/User';

export class PostgresUserRepository implements IUserRepository {

  /**
   * Helper para obtener el cliente de transacción o el pool global.
   */
  private getExecutor(transactionContext?: unknown): PoolClient | Pool {
    return (transactionContext as PoolClient) || pool;
  }

  private mapToEntity(row: any): User {
    return new User(
      row.id,
      row.email,
      row.nombre,
      row.rol,
      row.creado_en
    );
  }

  async findByEmail(email: string, transactionContext?: unknown): Promise<User | null> {
    const executor = this.getExecutor(transactionContext);
    const result = await executor.query(
      'SELECT id, email, nombre, rol, creado_en FROM usuarios WHERE email = $1',
      [email]
    );
    if (!result.rows[0]) return null;
    return this.mapToEntity(result.rows[0]);
  }

  async findById(id: string, transactionContext?: unknown): Promise<User | null> {
    const executor = this.getExecutor(transactionContext);
    const result = await executor.query(
      'SELECT id, email, nombre, rol, creado_en FROM usuarios WHERE id = $1',
      [id]
    );
    if (!result.rows[0]) return null;
    return this.mapToEntity(result.rows[0]);
  }

  async emailExists(email: string, transactionContext?: unknown): Promise<boolean> {
    const executor = this.getExecutor(transactionContext);
    const result = await executor.query('SELECT 1 FROM usuarios WHERE email = $1 LIMIT 1', [email]);
    return result.rows.length > 0;
  }

  async findByEmailWithPassword(email: string, transactionContext?: unknown): Promise<{ user: User; passwordHash: string } | null> {
    const executor = this.getExecutor(transactionContext);
    const result = await executor.query(
      'SELECT id, email, nombre, password_hash, rol, creado_en FROM usuarios WHERE email = $1',
      [email]
    );
    
    const row = result.rows[0];
    if (!row) return null;

    return {
      user: this.mapToEntity(row),
      passwordHash: row.password_hash
    };
  }

  async create(user: User, passwordHash: string, transactionContext?: unknown): Promise<User> {
    const executor = this.getExecutor(transactionContext);
    const query = `
      INSERT INTO usuarios (id, email, nombre, rol, password_hash, creado_en)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, nombre, rol, creado_en
    `;

    const result = await executor.query(query, [
      user.id,
      user.email,
      user.nombre,
      user.rol,
      passwordHash,
      user.creadoEn
    ]);

    return this.mapToEntity(result.rows[0]);
  }

  async save(user: User, transactionContext?: unknown): Promise<User> {
    const executor = this.getExecutor(transactionContext);
    const query = `
      UPDATE usuarios
      SET email = $2,
          nombre = $3,
          rol = $4
      WHERE id = $1
      RETURNING id, email, nombre, rol, creado_en
    `;

    const result = await executor.query(query, [
      user.id,
      user.email,
      user.nombre,
      user.rol
    ]);

    if (result.rows.length === 0) {
      throw new Error(`UserWithIdNotFound: ${user.id}`);
    }

    return this.mapToEntity(result.rows[0]);
  }
}