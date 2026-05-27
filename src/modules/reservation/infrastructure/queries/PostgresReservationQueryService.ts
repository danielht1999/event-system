// src/modules/reservation/infrastructure/queries/PostgresReservationQueryService.ts
import pool from '@shared/infrastructure/database/connection';
import { IReservationQueryService, ReservationDTO } from '../../application/services/IReservationQueryService';

export class PostgresReservationQueryService implements IReservationQueryService {
  
  async findByUser(userId: string): Promise<ReservationDTO[]> {
    const result = await pool.query(`
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
      JOIN eventos e ON r.evento_id = e.id
      WHERE r.usuario_id = $1
      ORDER BY r.reservado_en DESC
    `, [userId]);
    
    return result.rows;
  }
}