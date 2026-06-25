// src/modules/reservation/infrastructure/queries/PostgresReservationQueryService.ts

import pool from '@shared/infrastructure/database/connection';
import { Pagination } from '@shared/application/query/Pagination';
import { PaginatedResult } from '@shared/application/query/PaginatedResult';

import {
  IReservationQueryService,
  ReservationDTO,
  TicketEmailDTO
} from '../../application/services/IReservationQueryService';

import { GetReservationsQuery } from '../../application/queries/GetReservationsQuery';

export class PostgresReservationQueryService
  implements IReservationQueryService {

  public async getReservations(
    query: GetReservationsQuery
  ): Promise<PaginatedResult<ReservationDTO>> {

    const { owner, status, sortBy, sortOrder = 'desc' } = query;

    const { page, limit, offset } = Pagination.normalize(query);

    const whereClauses: string[] = [];
    const params: unknown[] = [];

    if (owner) {
      params.push(owner);
      whereClauses.push(`r.usuario_id = $${params.length}`);
    }

    if (status) {
      params.push(status);
      whereClauses.push(`r.estado = $${params.length}`);
    }

    const whereSql =
      whereClauses.length > 0
        ? `WHERE ${whereClauses.join(' AND ')}`
        : '';

    const countResult = await pool.query(
      `
      SELECT COUNT(*)
      FROM reservas r
      ${whereSql}
      `,
      params
    );

    const totalItems = Number(countResult.rows[0].count);

    const sortFieldMap: Record<string, string> = {
      createdAt: 'r.reservado_en',
      eventDate: 'e.fecha',
      status: 'r.estado'
    };

    const safeSortBy =
      sortFieldMap[sortBy ?? 'createdAt']
      ?? 'r.reservado_en';

    const safeSortOrder =
      sortOrder === 'asc'
        ? 'ASC'
        : 'DESC';

    const querySql = `
      SELECT
        r.id,
        r.evento_id as "eventoId",
        r.usuario_id as "usuarioId",
        r.cantidad_tickets as "cantidadTickets",
        r.estado,
        r.codigo_ticket as "codigoTicket",
        r.reservado_en as "reservadoEn",
        r.pagado_en as "pagadoEn",
        r.checked_in_en as "checkedInEn",

        e.titulo as "eventoTitulo",
        e.fecha as "eventoFecha",
        e.lugar as "eventoLugar"

      FROM reservas r

      INNER JOIN eventos e
        ON e.id = r.evento_id

      ${whereSql}

      ORDER BY ${safeSortBy} ${safeSortOrder}

      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `;

    const result = await pool.query(
      querySql,
      [...params, limit, offset]
    );

    return {
      items: result.rows,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      page,
      limit
    };
  }

  public async findTicketEmailData(
    reservationId: string
  ): Promise<TicketEmailDTO | null> {

    // ✅ CORREGIDO: Agregar INNER JOIN con ticket_types y usar tt.precio
    const query = `
      SELECT
        u.email AS to,
        u.nombre AS client_name,

        e.titulo AS event_name,
        e.fecha AS event_date,
        e.lugar AS event_location,

        r.codigo_ticket AS ticket_code,
        r.cantidad_tickets AS ticket_quantity,

        (r.cantidad_tickets * tt.precio) AS total_amount

      FROM reservas r

      INNER JOIN usuarios u
        ON u.id = r.usuario_id

      INNER JOIN eventos e
        ON e.id = r.evento_id

      INNER JOIN ticket_types tt
        ON tt.id = r.ticket_type_id

      WHERE r.id = $1

      LIMIT 1
    `;

    const result = await pool.query(query, [reservationId]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      to: row.to,
      clientName: row.client_name,
      eventName: row.event_name,
      eventDate: row.event_date,
      eventLocation: row.event_location,
      ticketCode: row.ticket_code,
      ticketQuantity: Number(row.ticket_quantity),
      totalAmount: Number(row.total_amount)
    };
  }
}