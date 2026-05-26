// src/modules/event/infrastructure/services/PostgresEventQueryService.ts
import pool from '@shared/infrastructure/database/connection';
import { IEventQueryService, EventDTO } from '../../application/services/IEventQueryService';

export class PostgresEventQueryService implements IEventQueryService {
  
  async findAll(): Promise<EventDTO[]> {
    const result = await pool.query(`
      SELECT 
        id, 
        titulo, 
        descripcion, 
        fecha, 
        lugar,
        capacidad_total as "capacidadTotal",
        precio,
        organizador_id as "organizadorId",
        reservas_confirmadas as "reservasConfirmadas",
        reservas_pendientes as "reservasPendientes",
        capacidad_total - reservas_confirmadas - reservas_pendientes as "cuposDisponibles",
        estado
      FROM eventos
      ORDER BY fecha ASC
    `);
    
    return result.rows; 
  }

  async findByOrganizer(organizerId: string): Promise<EventDTO[]> {
    const result = await pool.query(`
      SELECT 
        id, 
        titulo, 
        descripcion, 
        fecha, 
        lugar,
        capacidad_total as "capacidadTotal",
        precio,
        organizador_id as "organizadorId",
        reservas_confirmadas as "reservasConfirmadas",
        reservas_pendientes as "reservasPendientes",
        capacidad_total - reservas_confirmadas - reservas_pendientes as "cuposDisponibles",
        estado
      FROM eventos
      WHERE organizador_id = $1
      ORDER BY fecha ASC
    `, [organizerId]);
    
    return result.rows;
  }
}