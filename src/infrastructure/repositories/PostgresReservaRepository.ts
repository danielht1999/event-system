// src/infrastructure/repositories/PostgresReservaRepository.ts
import pool from '../database/connection';
import { IReservaRepository } from '../../domain/repositories/IReservaRepository';
import { Reserva } from "../../domain/entities/Reserva";

export class PostgresReservaRepository implements IReservaRepository {
  async save(reserva: Reserva): Promise<void> {          
    const client = await pool.connect();
    try {
    await client.query('BEGIN');
    await client.query(`INSERT INTO reservas (id, evento_id, usuario_id, cantidad_tickets, estado, codigo_ticket, reservado_en, pagado_en, checked_in_en)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        reserva.id,              
        reserva.eventoId,        
        reserva.usuarioId,       
        reserva.cantidadTickets, 
        reserva.estado,          
        reserva.codigoTicket,    
        reserva.reservadoEn,     
        reserva.pagadoEn,        
        reserva.checkedInEn      
      ]);
    await client.query(
      `UPDATE eventos SET reservas_pendientes = reservas_pendientes + $1 WHERE id = $2`,
      [reserva.cantidadTickets, reserva.eventoId] 
    );
     await client.query('COMMIT');
   } catch (error) {
     await client.query('ROLLBACK');
     throw error;
   } finally {
     client.release();
   }
 }

  async findById(id: string): Promise<Reserva | null>{
    const result = await pool.query(
      'SELECT * FROM reservas WHERE id = $1',
      [id]
    );
    return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
  }

  async findByEvento(eventoId: string): Promise<Reserva[]>{
    const result = await pool.query(
      'SELECT * FROM reservas WHERE evento_id = $1',
      [eventoId]
    );
    return result.rows.map(row => this.mapToEntity(row));
  }

  async findByUsuario(usuarioId: string): Promise<Reserva[]>{
    const result = await pool.query(
      'SELECT * FROM reservas WHERE usuario_id = $1',
      [usuarioId]
    );
    return result.rows.map(row => this.mapToEntity(row));
  }

  async findByCodigoTicket(codigo: string): Promise<Reserva | null>{
    const result = await pool.query(
      'SELECT * FROM reservas WHERE codigo_ticket = $1',
      [codigo]
    );
    return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
  }

  async update(reserva: Reserva): Promise<void>{
    await pool.query(
    `UPDATE reservas 
     SET estado = $1, pagado_en = $2, checked_in_en = $3
     WHERE id = $4`,
    [reserva.estado, reserva.pagadoEn, reserva.checkedInEn, reserva.id]
  );
  }
  
  async delete(id: string): Promise<void>{
    const result = await pool.query(
      'DELETE FROM reservas WHERE id = $1',
      [id]
    );
  }

  private mapToEntity(row: any): Reserva {
            return new Reserva(
            row.id,
            row.evento_id, 
            row.usuario_id, 
            row.cantidad_tickets, 
            row.estado, 
            row.codigo_ticket, 
            row.reservado_en, 
            row.pagado_en, 
            row.checked_in_en
            );
        }
 }


