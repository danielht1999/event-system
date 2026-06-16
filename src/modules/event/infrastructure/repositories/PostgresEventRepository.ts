// src/modules/event/infrastructure/repositories/PostgresEventRepository.ts

import pool from '@shared/infrastructure/database/connection';
import { IEventRepository } from '../../domain/repositories/IEventRepository';
import { Event } from '../../domain/entities/Event';
import { EventDate } from '../../domain/value-objects/EventDate';
import { domainEventBus } from '@shared/infrastructure/messaging/DomainEventBus';
import { IDomainEvent } from '@shared/domain/IDomainEvent';

export class PostgresEventRepository
  implements IEventRepository
{
  async save(event: Event): Promise<Event> {
    const query = `
      INSERT INTO eventos (
        id,
        titulo,
        descripcion,
        fecha,
        lugar,
        organizador_id,
        estado
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7
      )
      ON CONFLICT (id) DO UPDATE SET
        titulo = EXCLUDED.titulo,
        descripcion = EXCLUDED.descripcion,
        fecha = EXCLUDED.fecha,
        lugar = EXCLUDED.lugar,
        estado = EXCLUDED.estado
      RETURNING *
    `;

    const result = await pool.query(query, [
      event.id,
      event.titulo,
      event.descripcion,
      event.fecha.value,
      event.lugar,
      event.organizadorId,
      event.estado
    ]);

    const domainEvents: IDomainEvent[] =
      event.pullDomainEvents();

    domainEvents.forEach(domainEvent => {
      domainEventBus.publish(
        domainEvent.eventName,
        domainEvent
      );
    });

    return this.mapToEntity(result.rows[0]);
  }

  async findById(
    id: string
  ): Promise<Event | null> {
    const result = await pool.query(
      `
      SELECT *
      FROM eventos
      WHERE id = $1
      `,
      [id]
    );

    return result.rows[0]
      ? this.mapToEntity(result.rows[0])
      : null;
  }

  async findByIdForUpdate(
    id: string
  ): Promise<Event | null> {
    const result = await pool.query(
      `
      SELECT *
      FROM eventos
      WHERE id = $1
      FOR UPDATE
      `,
      [id]
    );

    return result.rows[0]
      ? this.mapToEntity(result.rows[0])
      : null;
  }

  async findAll(): Promise<Event[]> {
    const result = await pool.query(
      `
      SELECT *
      FROM eventos
      ORDER BY fecha ASC
      `
    );

    return result.rows.map(row =>
      this.mapToEntity(row)
    );
  }

  async findByOrganizerId(
    organizerId: string
  ): Promise<Event[]> {
    const result = await pool.query(
      `
      SELECT *
      FROM eventos
      WHERE organizador_id = $1
      ORDER BY fecha ASC
      `,
      [organizerId]
    );

    return result.rows.map(row =>
      this.mapToEntity(row)
    );
  }

  async delete(id: string): Promise<boolean> {
    const result = await pool.query(
      `
      DELETE FROM eventos
      WHERE id = $1
      `,
      [id]
    );

    return (result.rowCount ?? 0) > 0;
  }

  async exists(id: string): Promise<boolean> {
    const result = await pool.query(
      `
      SELECT 1
      FROM eventos
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    return result.rows.length > 0;
  }

  private mapToEntity(row: any): Event {
    return new Event(
      row.id,
      row.titulo,
      row.descripcion,
      EventDate.reconstruct(
        new Date(row.fecha)
      ),
      row.lugar,
      row.organizador_id,
      row.estado,
      new Date(row.creado_en)
    );
  }
}