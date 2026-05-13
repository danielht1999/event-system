// infrastructure/repositories/PostgresUserRepository.ts
import pool from '../database/connection';
import { IUserRepository, User } from '../../domain/repositories/IUserRepository';

export class PostgresUserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT id, email, nombre, password_hash, rol, creado_en FROM usuarios WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  async findById(id: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT id, email, nombre, password_hash, rol, creado_en FROM usuarios WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async save(user: Omit<User, 'creado_en'>): Promise<User> {
    const result = await pool.query(
      `INSERT INTO usuarios (id, email, nombre, password_hash, rol)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, nombre, rol, creado_en`,
      [user.id, user.email, user.nombre, user.password_hash, user.rol]
    );
    return result.rows[0];
  }

  async emailExists(email: string): Promise<boolean> {
    const result = await pool.query('SELECT 1 FROM usuarios WHERE email = $1 LIMIT 1', [email]);
    return result.rows.length > 0;
  }
}
