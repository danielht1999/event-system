// src/modules/reservation/infrastructure/queries/PostgresReservationQueryService.ts
import pool from '@shared/infrastructure/database/connection';
import { IReservationQueryService, ReservationDTO, TicketEmailDTO } from '../../application/services/IReservationQueryService';

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

  public async findTicketEmailData(reservationId: string): Promise<TicketEmailDTO | null> {
  const query = `
    SELECT
      u.email AS to,
      u.nombre AS client_name,
      e.titulo AS event_name,
      e.fecha AS event_date,
      e.lugar AS event_location,
      r.codigo_ticket AS ticket_code,
      r.cantidad_tickets AS ticket_quantity,
      (r.cantidad_tickets * e.precio) AS total_amount
    FROM reservas r
    INNER JOIN usuarios u
      ON u.id = r.usuario_id
    INNER JOIN eventos e
      ON e.id = r.evento_id
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
    totalAmount: Number(row.total_amount),
  };
}
}