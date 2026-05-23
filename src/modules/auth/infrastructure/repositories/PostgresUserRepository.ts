// src/modules/auth/infrastructure/repositories/PostgresUserRepository.ts
import pool from '@shared/infrastructure/database/connection';
import { IUserRepository, UserRecord } from '../../domain/repositories/IUserRepository';


export class PostgresUserRepository implements IUserRepository {
   async findByEmail(email: string): Promise<UserRecord | null> {
    const result = await pool.query(
      'SELECT id, email, nombre, password_hash, rol, creado_en FROM usuarios WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const result = await pool.query(
      'SELECT id, email, nombre, password_hash, rol, creado_en FROM usuarios WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

 async save(user: Omit<UserRecord, 'creado_en'>): Promise<UserRecord> {
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
