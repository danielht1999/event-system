import pool from '@shared/infrastructure/database/connection';
import { IEventQueryService, EventDTO } from '../../application/services/IEventQueryService';
import { GetEventsQuery } from '../../application/queries/GetEventsQuery';
import { PaginatedResult } from '@shared/application/query/PaginatedResult';
import { Pagination } from '@shared/application/query/Pagination';

export class PostgresEventQueryService implements IEventQueryService {

  async find(query: GetEventsQuery): Promise<PaginatedResult<EventDTO>> {
    const { page, limit, offset } = Pagination.normalize(query);
    const { owner, status } = query;

    const whereClauses: string[] = [];
    const params: any[] = [];

    // Construcción dinámica del WHERE
    if (owner) {
      params.push(owner);
      whereClauses.push(`e.organizador_id = $${params.length}`);
    }

    if (status) {
      params.push(status);
      whereClauses.push(`e.estado = $${params.length}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // 1. Conteo total (dinámico)
    const countQuery = `SELECT COUNT(*) as total FROM eventos e ${whereSql}`;
    const countResult = await pool.query(countQuery, params);
    const totalItems = Number(countResult.rows[0].total);

    // 2. Datos (dinámico)
    // Usamos $${params.length + 1} para LIMIT y $${params.length + 2} para OFFSET
    const dataQuery = `
      SELECT 
        e.id, e.titulo, e.descripcion, e.fecha, e.lugar,
        e.organizador_id as "organizadorId", e.estado,
        COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'id', t.id, 'nombre', t.nombre, 'precio', t.precio,
              'capacidadMaxima', t.capacidad_maxima,
              'reservasPendientes', t.reservas_pendientes,
              'reservasConfirmadas', t.reservas_confirmadas,
              'cuposDisponibles', (t.capacidad_maxima - t.reservas_confirmadas - t.reservas_pendientes),
              'estado', t.estado
            )
          ) FILTER (WHERE t.id IS NOT NULL), '[]'::jsonb
        ) as "tickets"
      FROM (
        SELECT * FROM eventos e ${whereSql} 
        ORDER BY e.fecha ASC 
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      ) e
      LEFT JOIN ticket_types t ON e.id = t.evento_id
      GROUP BY e.id, e.titulo, e.descripcion, e.fecha, e.lugar, e.organizador_id, e.estado
      ORDER BY e.fecha ASC
    `;

    const result = await pool.query(dataQuery, [...params, limit, offset]);

    return {
      items: result.rows,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      page,
      limit
    };
  }
}