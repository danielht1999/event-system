// src/infrastructure/repositories/PostgresEventoRepository.ts
import pool from '../database/connection';
import { IEventoRepository } from '../../domain/repositories/IEventoRepository';
import { Evento } from '../../domain/entities/Evento';
import { FechaEvento } from '../../domain/value-objects/FechaEvento';
import { Capacidad } from '../../domain/value-objects/Capacidad';

export class PostgresEventoRepository implements IEventoRepository {
  async save(evento: Evento): Promise<Evento> {
    const result = await pool.query(
      `INSERT INTO eventos (id, titulo, descripcion, fecha, lugar, capacidad_total, precio, organizador_id,reservas_confirmadas,reservas_pendientes,estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        evento.id,
        evento.titulo,
        evento.descripcion,
        evento.fecha.value,
        evento.lugar,
        evento.capacidadTotal.value,
        evento.precio,
        evento.organizadorId,
        evento.reservasConfirmadas,
        evento.reservasPendientes,
        evento.estado
      ]
    );
    return this.mapToEntity(result.rows[0]);
  }

  async findById(id: string): Promise<Evento | null> {
    const result = await pool.query(
      'SELECT * FROM eventos WHERE id = $1',
      [id]
    );
    return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
  }

  async findByIdForUpdate(id: string): Promise<Evento | null> {
    const result = await pool.query(
      'SELECT * FROM eventos WHERE id = $1 FOR UPDATE',
      [id]
    );
    return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
  }

  async findAll(): Promise<Evento[]> {
    const result = await pool.query(
      'SELECT * FROM eventos ORDER BY fecha ASC'
    );
    return result.rows.map(row => this.mapToEntity(row));
  }

  async findByOrganizadorId(organizadorId: string): Promise<Evento[]> {
    const result = await pool.query(
      'SELECT * FROM eventos WHERE organizador_id = $1 ORDER BY fecha ASC',
      [organizadorId]
    );
    return result.rows.map(row => this.mapToEntity(row));
  }

  async update(id: string, evento: Partial<Evento>): Promise<Evento | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (evento.titulo !== undefined) {
      fields.push(`titulo = $${idx++}`);
      values.push(evento.titulo);
    }
    if (evento.descripcion !== undefined) {
      fields.push(`descripcion = $${idx++}`);
      values.push(evento.descripcion);
    }
    if (evento.fecha !== undefined) {
      fields.push(`fecha = $${idx++}`);
      values.push(evento.fecha.value);
    }
    if (evento.lugar !== undefined) {
      fields.push(`lugar = $${idx++}`);
      values.push(evento.lugar);
    }
    if (evento.capacidadTotal !== undefined) {
      fields.push(`capacidad_total = $${idx++}`);
      values.push(evento.capacidadTotal.value);
    }
    if (evento.precio !== undefined) {
      fields.push(`precio = $${idx++}`);
      values.push(evento.precio);
    }

    if (fields.length === 0) return null;

    values.push(id);
    const query = `
      UPDATE eventos 
      SET ${fields.join(', ')} 
      WHERE id = $${idx}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM eventos WHERE id = $1',
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async exists(id: string): Promise<boolean> {
    const result = await pool.query(
      'SELECT 1 FROM eventos WHERE id = $1 LIMIT 1',
      [id]
    );
    return result.rows.length > 0;
  }

  private mapToEntity(row: any): Evento {
    return new Evento(
      row.id,
      row.titulo,
      row.descripcion,
      FechaEvento.reconstruir(new Date(row.fecha)),
      row.lugar,
      new Capacidad(row.capacidad_total),
      row.precio,
      row.organizador_id,
      row.reservas_confirmadas,
      row.reservas_pendientes,
      row.estado
    );
  }
}