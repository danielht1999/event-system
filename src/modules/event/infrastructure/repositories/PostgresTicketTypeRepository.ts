// src/modules/event/infrastructure/repositories/PostgresTicketTypeRepository.ts

import pool from '@shared/infrastructure/database/connection';
import { domainEventBus } from '@shared/infrastructure/messaging/DomainEventBus';

import { TicketType } from '../../domain/entities/TicketType';
import { ITicketTypeRepository } from '../../domain/repositories/ITicketTypeRepository';
import { Capacity } from '../../domain/value-objects/Capacity';

export class PostgresTicketTypeRepository
  implements ITicketTypeRepository
{
  async save(ticketType: TicketType): Promise<TicketType> {
    const query = `
      INSERT INTO ticket_types (
        id,
        evento_id,
        nombre,
        precio,
        capacidad_maxima,
        reservas_pendientes,
        reservas_confirmadas,
        estado,
        creado_en
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9
      )
      ON CONFLICT (id) DO UPDATE SET
        nombre = EXCLUDED.nombre,
        precio = EXCLUDED.precio,
        capacidad_maxima = EXCLUDED.capacidad_maxima,
        reservas_pendientes = EXCLUDED.reservas_pendientes,
        reservas_confirmadas = EXCLUDED.reservas_confirmadas,
        estado = EXCLUDED.estado
      RETURNING *
    `;

    const result = await pool.query(query, [
      ticketType.id,
      ticketType.eventId,
      ticketType.nombre,
      ticketType.precio,
      ticketType.capacidadMaxima.value,
      ticketType.reservasPendientes,
      ticketType.reservasConfirmadas,
      ticketType.estado,
      ticketType.creadoEn
    ]);

    this.dispatchEvents(ticketType);

    return this.mapToEntity(result.rows[0]);
  }

  async findById(id: string): Promise<TicketType | null> {
    const result = await pool.query(
      `
      SELECT *
      FROM ticket_types
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
  ): Promise<TicketType | null> {
    const result = await pool.query(
      `
      SELECT *
      FROM ticket_types
      WHERE id = $1
      FOR UPDATE
      `,
      [id]
    );

    return result.rows[0]
      ? this.mapToEntity(result.rows[0])
      : null;
  }

  async findByEventId(
    eventId: string
  ): Promise<TicketType[]> {
    const result = await pool.query(
      `
      SELECT *
      FROM ticket_types
      WHERE evento_id = $1
      ORDER BY creado_en ASC
      `,
      [eventId]
    );

    return result.rows.map(row =>
      this.mapToEntity(row)
    );
  }

  private dispatchEvents(
    ticketType: TicketType
  ): void {
    const events = ticketType.pullDomainEvents();

    events.forEach(event =>
      domainEventBus.publish(
        event.eventName,
        event
      )
    );
  }

  private mapToEntity(row: any): TicketType {
    return new TicketType(
      row.id,
      row.evento_id,
      row.nombre,
      Number(row.precio),
      new Capacity(Number(row.capacidad_maxima)),
      Number(row.reservas_pendientes),
      Number(row.reservas_confirmadas),
      row.estado,
      new Date(row.creado_en)
    );
  }
}