import pool from '@shared/infrastructure/database/connection';
import { PoolClient, Pool } from 'pg'; 
import { IEventRepository, EventUpdateData } from '../../domain/repositories/IEventRepository'; 
import { Event, EventStatus } from '../../domain/entities/Event';

export class PostgresEventRepository implements IEventRepository {

  // Método ayudante centralizado para obtener el ejecutor
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
        id, titulo, descripcion, fecha, lugar, organizador_id, estado
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        titulo = EXCLUDED.titulo,
        descripcion = EXCLUDED.descripcion,
        fecha = EXCLUDED.fecha,
        lugar = EXCLUDED.lugar,
        estado = EXCLUDED.estado
      RETURNING *
    `;

    const result = await executor.query(query, [
      event.id,
      event.titulo,
      event.descripcion,
      event.fecha.value,
      event.lugar,
      event.organizadorId,
      event.estado
    ]);
    return this.mapToEntity(result.rows[0]);
  }

  // =========================================================================
  // IMPLEMENTACIÓN: UPDATE PARCIAL DINÁMICO (EventUpdateData)
  // =========================================================================
  async updateData(id: string, data: EventUpdateData, transactionContext?: unknown): Promise<Event | null> { 
    const executor = this.getExecutor(transactionContext);

    const fields: string[] = [];
    const values: any[] = [];
    let queryIndex = 1;

    if (data.titulo !== undefined) {
      fields.push(`titulo = $${queryIndex++}`);
      values.push(data.titulo);
    }
    if (data.descripcion !== undefined) {
      fields.push(`descripcion = $${queryIndex++}`);
      values.push(data.descripcion);
    }
    if (data.lugar !== undefined) {
      fields.push(`lugar = $${queryIndex++}`);
      values.push(data.lugar);
    }

    if (fields.length === 0) {
      return await this.findById(id, transactionContext); // Cambia el throw por el retorno directo
    }

    values.push(id);
    const query = `
      UPDATE eventos 
      SET ${fields.join(', ')} 
      WHERE id = $${queryIndex} 
      RETURNING *
    `;

    const result = await executor.query(query, values);
    if (result.rows.length === 0) {
      return null; 
    }

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

    return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
  }

  async findByIdForUpdate(id: string, transactionContext: unknown): Promise<Event | null> {
    const executor = transactionContext as PoolClient;

    const result = await executor.query(
      `SELECT * FROM eventos WHERE id = $1 FOR UPDATE`,
      [id]
    );

    return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
  }

  async findAll(transactionContext?: unknown): Promise<Event[]> {
    const executor = this.getExecutor(transactionContext);
    const result = await executor.query(`SELECT * FROM eventos ORDER BY fecha ASC`);
    return result.rows.map(row => this.mapToEntity(row));
  }

  async findByOrganizerId(organizerId: string, transactionContext?: unknown): Promise<Event[]> {
    const executor = this.getExecutor(transactionContext);
    const result = await executor.query(
      `SELECT * FROM eventos WHERE organizador_id = $1 ORDER BY fecha ASC`,
      [organizerId]
    );
    return result.rows.map(row => this.mapToEntity(row));
  }

  // =========================================================================
  // COMANDOS AUXILIARES
  // =========================================================================
  async delete(id: string, transactionContext?: unknown): Promise<boolean> {
    const executor = this.getExecutor(transactionContext);
    const result = await executor.query(`DELETE FROM eventos WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async exists(id: string, transactionContext?: unknown): Promise<boolean> {
    const executor = this.getExecutor(transactionContext);
    const result = await executor.query(`SELECT 1 FROM eventos WHERE id = $1 LIMIT 1`, [id]);
    return result.rows.length > 0;
  }

 private mapToEntity(row: any): Event {
  // El dominio (Event.reconstruct) se encargará de envolverlo en su Value Object internamente.
  return Event.reconstruct(
    row.id,
    row.titulo,
    row.descripcion,
    new Date(row.fecha), // Mandamos el Date nativo directamente
    row.lugar,
    row.organizador_id,
    row.estado as EventStatus,
    new Date(row.creado_en)
  );
}}
