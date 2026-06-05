// src/modules/event/infrastructure/repositories/PostgresEventRepository.ts
import pool from '@shared/infrastructure/database/connection';
import { IEventRepository } from '../../domain/repositories/IEventRepository';
import { Event } from '../../domain/entities/Event';
import { EventDate } from '../../domain/value-objects/EventDate';
import { Capacity } from '../../domain/value-objects/Capacity';
import { domainEventBus } from '@shared/infrastructure/messaging/DomainEventBus'; // <-- 1. Importamos el Bus compartido

export class PostgresEventRepository implements IEventRepository {
  async save(event: Event): Promise<Event> {
    // Query modificada con UPSERT (ON CONFLICT) para soportar inserciones y actualizaciones lógicas
    const query = `
      INSERT INTO eventos (
        id, titulo, descripcion, fecha, lugar, capacidad_total, 
        precio, organizador_id, reservas_confirmadas, reservas_pendientes, estado
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        titulo = EXCLUDED.titulo,
        descripcion = EXCLUDED.descripcion,
        fecha = EXCLUDED.fecha,
        lugar = EXCLUDED.lugar,
        capacidad_total = EXCLUDED.capacidad_total,
        precio = EXCLUDED.precio,
        reservas_confirmadas = EXCLUDED.reservas_confirmadas,
        reservas_pendientes = EXCLUDED.reservas_pendientes,
        estado = EXCLUDED.estado
      RETURNING *
    `;

    const result = await pool.query(query, [
      event.id,
      event.titulo,
      event.descripcion,
      event.fecha.value,
      event.lugar,
      event.capacidadTotal.value,
      event.precio,
      event.organizadorId,
      event.reservasConfirmadas,
      event.reservasPendientes,
      event.estado
    ]);

    // DESPACHO DE EVENTOS: Si Postgres guardó/actualizó bien, vaciamos la entidad y publicamos
    const domainEvents = event.pullDomainEvents();
    
    domainEvents.forEach((domainEvent) => {
      domainEventBus.publish(domainEvent.eventName, domainEvent);
    });

    return this.mapToEntity(result.rows[0]);
  }

  async findById(id: string): Promise<Event | null> {
    const result = await pool.query(
      'SELECT * FROM eventos WHERE id = $1',
      [id]
    );
    return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
  }

  async findByIdForUpdate(id: string): Promise<Event | null> {
    const result = await pool.query(
      'SELECT * FROM eventos WHERE id = $1 FOR UPDATE',
      [id]
    );
    return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
  }

  async findAll(): Promise<Event[]> {
    const result = await pool.query(
      'SELECT * FROM eventos ORDER BY fecha ASC'
    );
    return result.rows.map(row => this.mapToEntity(row));
  }

  async findByOrganizerId(organizerId: string): Promise<Event[]> {
    const result = await pool.query(
      'SELECT * FROM eventos WHERE organizador_id = $1 ORDER BY fecha ASC',
      [organizerId] // Bug corregido: ahora usa dinámicamente organizerId
    );
    return result.rows.map(row => this.mapToEntity(row));
  }

  async update(id: string, event: Partial<Event>): Promise<Event | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (event.titulo !== undefined) {
      fields.push(`titulo = $${idx++}`);
      values.push(event.titulo);
    }
    if (event.descripcion !== undefined) {
      fields.push(`descripcion = $${idx++}`);
      values.push(event.descripcion);
    }
    if (event.fecha !== undefined) {
      fields.push(`fecha = $${idx++}`);
      values.push(event.fecha.value);
    }
    if (event.lugar !== undefined) {
      fields.push(`lugar = $${idx++}`);
      values.push(event.lugar);
    }
    if (event.capacidadTotal !== undefined) {
      fields.push(`capacidad_total = $${idx++}`);
      values.push(event.capacidadTotal.value);
    }
    if (event.precio !== undefined) {
      fields.push(`precio = $${idx++}`);
      values.push(event.precio);
    }
    if (event.estado !== undefined) {
      fields.push(`estado = $${idx++}`);
      values.push(event.estado);
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

  private mapToEntity(row: any): Event {
    return new Event(
      row.id,
      row.titulo,
      row.descripcion,
      EventDate.reconstruct(new Date(row.fecha)),
      row.lugar,
      new Capacity(row.capacidad_total),
      row.precio,
      row.organizador_id,
      row.reservas_confirmadas,
      row.reservas_pendientes,
      row.estado
    );
  }
}