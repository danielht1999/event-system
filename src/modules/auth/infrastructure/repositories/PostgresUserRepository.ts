// src/modules/auth/infrastructure/repositories/PostgresUserRepository.ts
import pool from '@shared/infrastructure/database/connection';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/entities/User';
import { domainEventBus } from '@shared/infrastructure/messaging/DomainEventBus';

export class PostgresUserRepository implements IUserRepository {
  
  /**
   * Mapeador interno para transformar los datos relacionales de la BD 
   * en una instancia de la entidad rica de dominio User.
   */
  private mapToEntity(row: any): User {
    return new User(
      row.id,
      row.email,
      row.nombre,
      row.rol,
      row.creado_en
    );
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT id, email, nombre, rol, creado_en FROM usuarios WHERE email = $1',
      [email]
    );
    if (!result.rows[0]) return null;
    return this.mapToEntity(result.rows[0]);
  }

  async findById(id: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT id, email, nombre, rol, creado_en FROM usuarios WHERE id = $1',
      [id]
    );
    if (!result.rows[0]) return null;
    return this.mapToEntity(result.rows[0]);
  }

  async emailExists(email: string): Promise<boolean> {
    const result = await pool.query('SELECT 1 FROM usuarios WHERE email = $1 LIMIT 1', [email]);
    return result.rows.length > 0;
  }

  // =========================================================================
  // CASO DE USO: AUTENTICACIÓN (LOGIN)
  // Recupera de forma aislada el hash para el Handler de Login.
  // =========================================================================
  async findByEmailWithPassword(email: string): Promise<{ user: User; passwordHash: string } | null> {
    const result = await pool.query(
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

  // =========================================================================
  // CASO DE USO: REGISTRO
  // Persiste el usuario nuevo inyectando su hash por primera vez.
  // =========================================================================
  async create(user: User, passwordHash: string): Promise<User> {
    const query = `
      INSERT INTO usuarios (id, email, nombre, rol, password_hash, creado_en)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, nombre, rol, creado_en
    `;

    const result = await pool.query(query, [
      user.id,
      user.email,
      user.nombre,
      user.rol,
      passwordHash,
      user.creadoEn
    ]);

    this.dispatchEvents(user);

    return this.mapToEntity(result.rows[0]);
  }

  // =========================================================================
  // CASO DE USO: CORE DOMINIO (Sincronización de Perfil / Roles)
  // Modifica los datos de un usuario ya existente de forma segura.
  // =========================================================================
  async save(user: User): Promise<User> {
    const query = `
      UPDATE usuarios
      SET email = $2,
          nombre = $3,
          rol = $4
      WHERE id = $1
      RETURNING id, email, nombre, rol, creado_en
    `;

    const result = await pool.query(query, [
      user.id,
      user.email,
      user.nombre,
      user.rol
    ]);

    if (result.rows.length === 0) {
      throw new Error(`UserWithIdNotFound: ${user.id}`);
    }

    this.dispatchEvents(user);

    return this.mapToEntity(result.rows[0]);
  }

  /**
   * Helper para extraer y despachar los eventos acumulados en la entidad
   * hacia el bus de eventos global.
   */
  private dispatchEvents(user: User): void {
    const domainEvents = user.pullDomainEvents();
    domainEvents.forEach((domainEvent) => {
      domainEventBus.publish(domainEvent.eventName, domainEvent);
    });
  }
}