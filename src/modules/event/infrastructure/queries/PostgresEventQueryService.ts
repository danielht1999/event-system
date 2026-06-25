// src/modules/event/infrastructure/queries/PostgresEventQueryService.ts

import pool from '@shared/infrastructure/database/connection';
import { IEventQueryService, EventDTO } from '../../application/services/IEventQueryService';
import { GetEventsQuery } from '../../application/queries/GetEventsQuery';
import { PaginatedResult } from '@shared/application/query/PaginatedResult';
import { Pagination } from '@shared/application/query/Pagination';

export class PostgresEventQueryService implements IEventQueryService {

 async find(query: GetEventsQuery): Promise<PaginatedResult<EventDTO>> {
    const { page, limit, offset } = Pagination.normalize(query);
    const {
      owner,
      search,
      status,
      sortBy,
      sortOrder
    } = query;

    // ============================================================
    // 1. CONSTRUIR FILTROS DINÁMICOS (SOLO LOS SOPORTADOS)
    // ============================================================
    
    const whereClauses: string[] = [];
    const params: any[] = [];

    // ✅ Filtro por owner
    if (owner) {
      params.push(owner);
      whereClauses.push(`e.organizador_id = $${params.length}`);
    }

    // ✅ Filtro por status
    if (status) {
      params.push(status);
      whereClauses.push(`e.estado = $${params.length}`);
    }

    // ✅ Búsqueda por texto (título o descripción)
    if (search) {
      params.push(`%${search}%`);
      whereClauses.push(`(e.titulo ILIKE $${params.length} OR e.descripcion ILIKE $${params.length})`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // ============================================================
    // 2. CONSTRUIR QUERY DE COUNT
    // ============================================================
    
    const countQuery = `SELECT COUNT(*) as total FROM eventos e ${whereSql}`;
    const countResult = await pool.query(countQuery, params);
    const totalItems = Number(countResult.rows[0].total);

    if (totalItems === 0) {
      return {
        items: [],
        totalItems: 0,
        totalPages: 0,
        page,
        limit
      };
    }

    // ============================================================
    // 3. CONSTRUIR QUERY DE DATOS CON ORDENAMIENTO
    // ============================================================
    
    // ✅ Mapeo de campos de ordenamiento
    const sortFieldMap: Record<string, string> = {
      'date': 'e.fecha',
      'title': 'e.titulo',
      'price': 'e.fecha', // Fallback: el precio requiere JOIN
      'createdAt': 'e.creado_en'
    };
    
    let orderByClause = '';
    let joinClause = '';
    
    if (sortBy === 'price') {
      // ✅ Ordenar por precio mínimo del evento
      joinClause = `
        LEFT JOIN (
          SELECT evento_id, MIN(precio) as min_precio
          FROM ticket_types
          GROUP BY evento_id
        ) tt ON tt.evento_id = e.id
      `;
      orderByClause = `ORDER BY tt.min_precio ${sortOrder || 'asc'}`;
    } else {
      const field = sortFieldMap[sortBy || 'date'] || 'e.fecha';
      orderByClause = `ORDER BY ${field} ${sortOrder || 'asc'}`;
    }

    // ============================================================
    // 4. CONSTRUIR QUERY PRINCIPAL CON PAGINACIÓN
    // ============================================================
    
    const dataQuery = `
      SELECT 
        e.id as "id",
        e.titulo as "titulo",
        e.descripcion as "descripcion",
        e.fecha as "fecha",
        e.lugar as "lugar",
        e.capacidad_total as "capacidadTotal",
        e.organizador_id as "organizadorId",
        e.estado as "estado",
        COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'id', t.id,
              'nombre', t.nombre,
              'precio', t.precio,
              'capacidadMaxima', t.capacidad,
              'reservasPendientes', t.reservas_pendientes,
              'reservasConfirmadas', t.reservas_confirmadas,
              'cuposDisponibles', (t.capacidad - t.reservas_confirmadas - t.reservas_pendientes),
              'estado', t.estado
            )
          ) FILTER (WHERE t.id IS NOT NULL), '[]'::jsonb
        ) as "tickets"
      FROM (
        SELECT * FROM eventos e 
        ${joinClause}
        ${whereSql} 
        ${orderByClause}
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      ) e
      LEFT JOIN ticket_types t ON e.id = t.evento_id
      GROUP BY e.id, e.titulo, e.descripcion, e.fecha, e.lugar, e.capacidad_total, e.organizador_id, e.estado
      ${orderByClause}
    `;

    const dataParams = [...params, limit, offset];
    const result = await pool.query(dataQuery, dataParams);

    // ============================================================
    // 5. CALCULAR TOTAL DE PÁGINAS
    // ============================================================
    
    const totalPages = Math.ceil(totalItems / limit);

    return {
      items: result.rows,
      totalItems,
      totalPages,
      page,
      limit
    };
  }
}