// src/modules/event/infrastructure/repositories/PostgresEventRepository.ts
import pool from '@shared/infrastructure/database/connection';
import { IEventRepository, EventUpdateData } from '../../domain/repositories/IEventRepository';
import { Event } from '../../domain/entities/Event';
import { EventDate } from '../../domain/value-objects/EventDate';
import { Capacity } from '../../domain/value-objects/Capacity';
import { domainEventBus } from '@shared/infrastructure/messaging/DomainEventBus';

export class PostgresEventRepository implements IEventRepository {
  
  async save(event: Event): Promise<Event> {
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

    // Leemos a través de los getters debido a que las propiedades son private
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

    // Despacho automático de la bolsa de eventos acumulados en el dominio
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
      [organizerId]
    );
    return result.rows.map(row => this.mapToEntity(row));
  }

  // =========================================================================
  // MANTENIMIENTO: Cambios puramente planos vía DTO EventUpdateData
  // =========================================================================
  async updateData(id: string, data: EventUpdateData): Promise<Event | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.titulo !== undefined) {
      fields.push(`titulo = $${idx++}`);
      values.push(data.titulo);
    }
    if (data.descripcion !== undefined) {
      fields.push(`descripcion = $${idx++}`);
      values.push(data.descripcion);
    }
    if (data.lugar !== undefined) {
      fields.push(`lugar = $${idx++}`);
      values.push(data.lugar);
    }

    if (fields.length === 0) return this.findById(id);

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

  /**
   * Reconstruye la entidad rica de dominio mapeando el orden exacto del constructor.
   */
  private mapToEntity(row: any): Event {
    return new Event(
      row.id,
      row.titulo,
      row.descripcion,
      EventDate.reconstruct(new Date(row.fecha)),
      row.lugar,
      new Capacity(row.capacidad_total),
      Number(row.precio),
      row.organizador_id,
      row.reservas_confirmadas,
      row.reservas_pendientes,
      row.estado,
      new Date(row.creado_en)
    );
  }
}