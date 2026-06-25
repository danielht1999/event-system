import pool from '@shared/infrastructure/database/connection';
import { PoolClient, Pool } from 'pg';
import { IEventRepository} from '../../domain/repositories/IEventRepository';
import { Event, EventStatus } from '../../domain/entities/Event';

export class PostgresEventRepository implements IEventRepository {

  private getExecutor(transactionContext?: unknown): PoolClient | Pool {
    return (transactionContext as PoolClient) || pool;
  }

  // =========================================================================
  // PERSISTENCIA (UPSERT)
  // =========================================================================

  async save(event: Event, transactionContext?: unknown): Promise<Event> {
    const executor = this.getExecutor(transactionContext);
    const query = `
      INSERT INTO eventos (
        id,
        titulo,
        descripcion,
        fecha,
        lugar,
        capacidad_total,
        organizador_id,
        estado
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        titulo = EXCLUDED.titulo,
        descripcion = EXCLUDED.descripcion,
        fecha = EXCLUDED.fecha,
        lugar = EXCLUDED.lugar,
        capacidad_total = EXCLUDED.capacidad_total,
        estado = EXCLUDED.estado
      RETURNING *
    `;
    const result = await executor.query(query, [
      event.id,
      event.titulo,
      event.descripcion,
      event.fecha.value,
      event.lugar,
      event.capacidadTotal,
      event.organizadorId,
      event.estado
    ]);
    return this.mapToEntity(result.rows[0]);
  }
  // =========================================================================
  // BÚSQUEDAS
  // =========================================================================

  async findById(id: string, transactionContext?: unknown): Promise<Event | null> {
    const executor = this.getExecutor(transactionContext);
    const result = await executor.query(
      `SELECT * FROM eventos WHERE id = $1`,
      [id]
    );
    return result.rows[0]
      ? this.mapToEntity(result.rows[0])
      : null;
  }

  async findByIdForUpdate(id: string, transactionContext: unknown): Promise<Event | null> {
    const executor = transactionContext as PoolClient;
    const result = await executor.query(
      `SELECT * FROM eventos WHERE id = $1 FOR UPDATE`,
      [id]
    );
    return result.rows[0]
      ? this.mapToEntity(result.rows[0])
      : null;
  }

  // =========================================================================
  // COMANDOS AUXILIARES
  // =========================================================================

  async delete(id: string, transactionContext?: unknown): Promise<boolean> {
    const executor = this.getExecutor(transactionContext);
    const result = await executor.query(
      `DELETE FROM eventos WHERE id = $1`,
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async exists(id: string, transactionContext?: unknown): Promise<boolean> {
    const executor = this.getExecutor(transactionContext);
    const result = await executor.query(
      `SELECT 1 FROM eventos WHERE id = $1 LIMIT 1`,
      [id]
    );
    return result.rows.length > 0;
  }

  // =========================================================================
  // MAPPER
  // =========================================================================

  private mapToEntity(row: any): Event {
    return Event.reconstruct(
      row.id,
      row.titulo,
      row.descripcion,
      new Date(row.fecha),
      row.lugar,
      row.capacidad_total,
      row.organizador_id,
      row.estado as EventStatus,
      new Date(row.creado_en)
    );
  }
}