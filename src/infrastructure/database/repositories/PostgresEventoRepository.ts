import { Pool } from 'pg';
import { Evento } from '../../../domain/entities/Evento';
import { IEventoRepository } from '../../../domain/repositories/IEventoRepository';
import { Capacidad } from '../../../domain/value-objects/Capacidad';
import { FechaEvento } from '../../../domain/value-objects/FechaEvento';
import pool from '../connection';

export class PostgresEventoRepository implements IEventoRepository {
  async save(evento: Evento): Promise<void> {
    const query = `
      INSERT INTO eventos (id, organizador_id, titulo, descripcion, lugar, fecha, capacidad_total, precio, estado, reservas_confirmadas, reservas_pendientes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        titulo = EXCLUDED.titulo,
        descripcion = EXCLUDED.descripcion,
        lugar = EXCLUDED.lugar,
        fecha = EXCLUDED.fecha,
        capacidad_total = EXCLUDED.capacidad_total,
        precio = EXCLUDED.precio,
        estado = EXCLUDED.estado,
        reservas_confirmadas = EXCLUDED.reservas_confirmadas,
        reservas_pendientes = EXCLUDED.reservas_pendientes
    `;
    
    await pool.query(query, [
      evento.id,
      evento.organizadorId,
      evento.titulo,
      evento.descripcion,
      evento.lugar,
      evento.fecha,
      evento.capacidad,
      evento.precio,
      evento.estado,
      (evento as any)._reservasConfirmadas || 0,
      (evento as any)._reservasPendientes || 0
    ]);
  }

  async findById(id: string): Promise<Evento | null> {
    const result = await pool.query('SELECT * FROM eventos WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return new Evento(
      row.id,
      row.organizador_id,
      row.titulo,
      row.descripcion,
      row.lugar,
      new FechaEvento(row.fecha),
      new Capacidad(row.capacidad_total),
      parseFloat(row.precio),
      row.estado,
      row.reservas_confirmadas,
      row.reservas_pendientes,
      row.creado_en
    );
  }

  async findAll(): Promise<Evento[]> {
    const result = await pool.query('SELECT * FROM eventos ORDER BY fecha ASC');
    return result.rows.map(row => new Evento(
      row.id,
      row.organizador_id,
      row.titulo,
      row.descripcion,
      row.lugar,
      new FechaEvento(row.fecha),
      new Capacidad(row.capacidad_total),
      parseFloat(row.precio),
      row.estado,
      row.reservas_confirmadas,
      row.reservas_pendientes,
      row.creado_en
    ));
  }

  async findByOrganizador(organizadorId: string): Promise<Evento[]> {
    const result = await pool.query(
      'SELECT * FROM eventos WHERE organizador_id = $1 ORDER BY fecha ASC',
      [organizadorId]
    );
    return result.rows.map(row => new Evento(
      row.id,
      row.organizador_id,
      row.titulo,
      row.descripcion,
      row.lugar,
      new FechaEvento(row.fecha),
      new Capacidad(row.capacidad_total),
      parseFloat(row.precio),
      row.estado,
      row.reservas_confirmadas,
      row.reservas_pendientes,
      row.creado_en
    ));
  }

  async findPublicados(): Promise<Evento[]> {
    const result = await pool.query('SELECT * FROM eventos WHERE estado = $1 ORDER BY fecha ASC', ['PUBLICADO']);
    return result.rows.map(row => new Evento(
      row.id,
      row.organizador_id,
      row.titulo,
      row.descripcion,
      row.lugar,
      new FechaEvento(row.fecha),
      new Capacidad(row.capacidad_total),
      parseFloat(row.precio),
      row.estado,
      row.reservas_confirmadas,
      row.reservas_pendientes,
      row.creado_en
    ));
  }

  async update(evento: Evento): Promise<void> {
    await this.save(evento);
  }

  async delete(id: string): Promise<void> {
    await pool.query('DELETE FROM eventos WHERE id = $1', [id]);
  }
}