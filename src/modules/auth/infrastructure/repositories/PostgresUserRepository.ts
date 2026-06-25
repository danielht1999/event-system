// src/modules/auth/infrastructure/repositories/PostgresUserRepository.ts

import pool from '@shared/infrastructure/database/connection';
import { PoolClient, Pool } from 'pg';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User, UserRole } from '../../domain/entities/User';

export class PostgresUserRepository implements IUserRepository {

  private getExecutor(transactionContext?: unknown): PoolClient | Pool {
    return (transactionContext as PoolClient) || pool;
  }

  /**
   * ✅ RECONSTITUIR desde DB usando el Factory Method
   */
  private mapToEntity(row: any): User {
    return User.reconstitute({
      id: row.id,
      email: row.email,
      nombre: row.nombre,
      rol: row.rol as UserRole,
      creadoEn: new Date(row.creado_en),
      passwordHash: row.password_hash
    });
  }

  // =========================================================================
  // MÉTODOS DE LECTURA
  // =========================================================================

  async findByEmail(email: string, transactionContext?: unknown): Promise<User | null> {
    const executor = this.getExecutor(transactionContext);
    const result = await executor.query(
      'SELECT id, email, nombre, rol, password_hash, creado_en FROM usuarios WHERE email = $1',
      [email.toLowerCase()]
    );
    if (!result.rows[0]) return null;
    return this.mapToEntity(result.rows[0]);
  }

  async findById(id: string, transactionContext?: unknown): Promise<User | null> {
    const executor = this.getExecutor(transactionContext);
    const result = await executor.query(
      'SELECT id, email, nombre, rol, password_hash, creado_en FROM usuarios WHERE id = $1',
      [id]
    );
    if (!result.rows[0]) return null;
    return this.mapToEntity(result.rows[0]);
  }

  async emailExists(email: string, transactionContext?: unknown): Promise<boolean> {
    const executor = this.getExecutor(transactionContext);
    const result = await executor.query(
      'SELECT 1 FROM usuarios WHERE email = $1 LIMIT 1',
      [email.toLowerCase()]
    );
    return result.rows.length > 0;
  }

  async findByEmailWithPassword(email: string, transactionContext?: unknown): Promise<{ user: User; passwordHash: string } | null> {
    const executor = this.getExecutor(transactionContext);
    const result = await executor.query(
      'SELECT id, email, nombre, password_hash, rol, creado_en FROM usuarios WHERE email = $1',
      [email.toLowerCase()]
    );
    
    const row = result.rows[0];
    if (!row) return null;

    return {
      user: this.mapToEntity(row),
      passwordHash: row.password_hash
    };
  }

  // =========================================================================
  // MÉTODOS DE ESCRITURA
  // =========================================================================

  /**
   * ✅ CREATE - Usa el passwordHash que ya está en el User
   */
  async create(user: User, transactionContext?: unknown): Promise<User> {
    const executor = this.getExecutor(transactionContext);
    
    if (!user.passwordHash) {
      throw new Error('No se puede crear un usuario sin password hash');
    }

    const query = `
      INSERT INTO usuarios (id, email, nombre, rol, password_hash, creado_en)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, nombre, rol, password_hash, creado_en
    `;

    const result = await executor.query(query, [
      user.id,
      user.email,
      user.nombre,
      user.rol,
      user.passwordHash, // ✅ Usamos el hash del User
      user.creadoEn
    ]);

    return this.mapToEntity(result.rows[0]);
  }

  /**
   * ✅ SAVE - Actualiza todos los campos
   */
  async save(user: User, transactionContext?: unknown): Promise<User> {
    const executor = this.getExecutor(transactionContext);
    
    const query = `
      UPDATE usuarios
      SET email = $2,
          nombre = $3,
          rol = $4,
          password_hash = $5
      WHERE id = $1
      RETURNING id, email, nombre, rol, password_hash, creado_en
    `;

    const result = await executor.query(query, [
      user.id,
      user.email,
      user.nombre,
      user.rol,
      user.passwordHash || null
    ]);

    if (result.rows.length === 0) {
      throw new Error(`Usuario con id ${user.id} no encontrado`);
    }

    return this.mapToEntity(result.rows[0]);
  }
}