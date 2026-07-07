// src/modules/event/infrastructure/queries/PostgresEventQueryService.ts

import pool from '@shared/infrastructure/database/connection';
import { 
  IEventQueryService, 
  EventoListDTO, 
  EventoDetalleDTO,
  EventoManagementDTO 
} from '../../application/services/IEventQueryService';
import { GetEventsQuery } from '../../application/queries/GetEventsQuery';
import { PaginatedResult } from '@shared/application/query/PaginatedResult';
import { Pagination } from '@shared/application/query/Pagination';

export class PostgresEventQueryService implements IEventQueryService {

  // ============================================================
  // MÉTODO PARA LISTADO - OPTIMIZADO SIN TICKETS ANIDADOS
  // ============================================================

  async find(query: GetEventsQuery): Promise<PaginatedResult<EventoListDTO>> {
    const { page, limit, offset } = Pagination.normalize(query);
    const {
      owner,
      search,
      status,
      sortBy,
      sortOrder
    } = query;

    // ============================================================
    // 1. CONSTRUIR FILTROS DINÁMICOS
    // ============================================================
    
    const whereClauses: string[] = [];
    const params: any[] = [];

    if (owner) {
      params.push(owner);
      whereClauses.push(`e.organizador_id = $${params.length}`);
    }

    if (status) {
      params.push(status);
      whereClauses.push(`e.estado = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      whereClauses.push(`(e.titulo ILIKE $${params.length} OR e.descripcion ILIKE $${params.length})`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // ============================================================
    // 2. QUERY DE COUNT
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
    
    const sortFieldMap: Record<string, string> = {
      'date': 'e.fecha',
      'title': 'e.titulo',
      'price': 'precio_minimo',
      'createdAt': 'e.creado_en'
    };
    
    let orderByClause = '';
    let joinClause = '';
    let selectJoin = '';
    
    if (sortBy === 'price') {
      // ✅ Ordenar por precio mínimo (necesita subconsulta)
      joinClause = `
        LEFT JOIN (
          SELECT 
            evento_id, 
            MIN(precio) as precio_minimo,
            SUM(capacidad - reservas_confirmadas - reservas_pendientes) as cupos_disponibles
          FROM ticket_types
          GROUP BY evento_id
        ) tt ON tt.evento_id = e.id
      `;
      selectJoin = `
        , COALESCE(tt.precio_minimo, 0) as "precioMinimo",
        COALESCE(tt.cupos_disponibles, 0) as "cuposDisponibles"
      `;
      orderByClause = `ORDER BY tt.precio_minimo ${sortOrder || 'asc'}`;
    } else {
      // ✅ Ordenar por campos del evento (con subconsultas)
      selectJoin = `
        , COALESCE(
          (SELECT MIN(precio) FROM ticket_types WHERE evento_id = e.id),
          0
        ) as "precioMinimo",
        COALESCE(
          (SELECT SUM(capacidad - reservas_confirmadas - reservas_pendientes) 
           FROM ticket_types WHERE evento_id = e.id),
          0
        ) as "cuposDisponibles"
      `;
      const field = sortFieldMap[sortBy || 'date'] || 'e.fecha';
      orderByClause = `ORDER BY ${field} ${sortOrder || 'asc'}`;
    }

    // ============================================================
    // 4. QUERY PRINCIPAL - SIN TICKETS ANIDADOS
    // ============================================================
    
    const dataQuery = `
      SELECT 
        e.id as "id",
        e.titulo as "titulo",
        e.lugar as "lugar",
        e.fecha as "fecha",
        e.estado as "estado"
        ${selectJoin}
      FROM eventos e
      ${joinClause}
      ${whereSql}
      ${orderByClause}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
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

  // ============================================================
  // MÉTODO PARA DETALLE - CON TICKETS COMPLETOS
  // ============================================================

  async findById(id: string): Promise<EventoDetalleDTO | null> {
    const query = `
      SELECT 
        e.id as "id",
        e.titulo as "titulo",
        e.descripcion as "descripcion",
        e.fecha as "fecha",
        e.lugar as "lugar",
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
      FROM eventos e
      LEFT JOIN ticket_types t ON e.id = t.evento_id
      WHERE e.id = $1
      GROUP BY e.id, e.titulo, e.descripcion, e.fecha, e.lugar, e.organizador_id, e.estado
    `;

    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) return null;
    
    return result.rows[0];
  }

  // ============================================================
  // MÉTODO PARA GESTIÓN DE ORGANIZADOR - EVENTOS CON TICKETS
  // ============================================================

  async findManagement(
    organizerId: string, 
    query: GetEventsQuery
  ): Promise<PaginatedResult<EventoManagementDTO>> {
    const { page, limit, offset } = Pagination.normalize(query);
    const { search, status, sortBy, sortOrder } = query;

    // 1. CONSTRUIR FILTROS DINÁMICOS
    const whereClauses: string[] = [`e.organizador_id = $1`];
    const params: any[] = [organizerId];

    if (status) {
      params.push(status);
      whereClauses.push(`e.estado = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      whereClauses.push(`(e.titulo ILIKE $${params.length} OR e.descripcion ILIKE $${params.length})`);
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

    // 2. QUERY DE CONTEO TOTAL
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

    // 3. MAPEO DE ORDENAMIENTO
    const sortFieldMap: Record<string, string> = {
      'date': 'e.fecha',
      'title': 'e.titulo',
      'createdAt': 'e.creado_en'
    };
    const field = sortFieldMap[sortBy || 'date'] || 'e.fecha';
    const orderByClause = `ORDER BY ${field} ${sortOrder || 'asc'}`;

    // 4. QUERY PRINCIPAL CORREGIDA
    const dataQuery = `
      SELECT 
        e.id as "id",
        e.titulo as "titulo",
        e.descripcion as "descripcion",
        e.fecha as "fecha",
        e.lugar as "lugar",
        e.organizador_id as "organizadorId", -- ✅ Seleccionado
        e.estado as "estado",
        e.creado_en as "creadoEn",
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
      FROM eventos e
      LEFT JOIN ticket_types t ON e.id = t.evento_id
      ${whereSql}
      GROUP BY e.id, e.titulo, e.descripcion, e.fecha, e.lugar, e.organizador_id, e.estado, e.creado_en -- ✅ Agregado al GROUP BY
      ${orderByClause}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const dataParams = [...params, limit, offset];
    const result = await pool.query(dataQuery, dataParams);
    const totalPages = Math.ceil(totalItems / limit);

    return {
      items: result.rows as EventoManagementDTO[],
      totalItems,
      totalPages,
      page,
      limit
    };
  }
}