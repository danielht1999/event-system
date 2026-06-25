// src/modules/event/infrastructure/repositories/PostgresTicketTypeRepository.ts

import pool from '@shared/infrastructure/database/connection';
import { PoolClient, Pool } from 'pg'; 
import { TicketType, TicketTypeStatus } from '../../domain/entities/TicketType';
import { ITicketTypeRepository } from '../../domain/repositories/ITicketTypeRepository';
import { Capacity } from '../../domain/value-objects/Capacity';

export class PostgresTicketTypeRepository implements ITicketTypeRepository {
  
  private getExecutor(transactionContext?: unknown): PoolClient | Pool {
    return (transactionContext as PoolClient) || pool;
  }

  async save(ticketType: TicketType, transactionContext?: unknown): Promise<TicketType> {
    const executor = this.getExecutor(transactionContext);

    const query = `
      INSERT INTO ticket_types (
        id, evento_id, nombre, precio, capacidad, 
        reservas_pendientes, reservas_confirmadas, estado, creado_en
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        nombre = EXCLUDED.nombre,
        precio = EXCLUDED.precio,
        capacidad = EXCLUDED.capacidad,
        reservas_pendientes = EXCLUDED.reservas_pendientes,
        reservas_confirmadas = EXCLUDED.reservas_confirmadas,
        estado = EXCLUDED.estado
      RETURNING *
    `;

    const result = await executor.query(query, [
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

    return this.mapToEntity(result.rows[0]);
  }

  async findById(id: string, transactionContext?: unknown): Promise<TicketType | null> {
    const executor = this.getExecutor(transactionContext);

    const result = await executor.query(
      `SELECT * FROM ticket_types WHERE id = $1`,
      [id]
    );

    return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
  }

  async findByEventId(eventId: string, transactionContext?: unknown): Promise<TicketType[]> {
    const executor = this.getExecutor(transactionContext);

    const result = await executor.query(
      `SELECT * FROM ticket_types WHERE evento_id = $1 ORDER BY creado_en ASC`,
      [eventId]
    );

    return result.rows.map(row => this.mapToEntity(row));
  }

  async findByIdForUpdate(id: string, transactionContext: unknown): Promise<TicketType | null> {
    const client = transactionContext as PoolClient;

    const result = await client.query(
      `SELECT * FROM ticket_types WHERE id = $1 FOR UPDATE`,
      [id]
    );

    return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
  }

  private mapToEntity(row: any): TicketType {
    return TicketType.reconstruct(
      row.id,
      row.evento_id,
      row.nombre,
      Number(row.precio),
      new Capacity(Number(row.capacidad)),
      Number(row.reservas_pendientes),
      Number(row.reservas_confirmadas),
      row.estado as TicketTypeStatus,
      new Date(row.creado_en)
    );
  }
}