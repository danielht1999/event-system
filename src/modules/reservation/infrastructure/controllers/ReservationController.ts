// src/modules/reservation/infrastructure/controllers/ReservationController.ts
import { Response } from 'express';
import { AuthRequest } from '@shared/api/middlewares/auth';
import pool from '@shared/infrastructure/database/connection';
import { CreateReservationCommand } from '../../application/commands/CreateReservationCommand';
import { CreateReservationHandler } from '../../application/commands/CreateReservationHandler';

export class ReservationController {
  constructor(
    private createReservationHandler: CreateReservationHandler
  ) {}

  // Comprar ticket (crear reserva)
  createReservation = async (req: AuthRequest, res: Response): Promise<void> => {    
    try {
      const usuarioId = req.user?.id;
      if (!usuarioId) {
        res.status(401).json({ success: false, message: 'No autorizado' });
        return;
      }
      
      // Validación básica de existencia de campos
      if (!req.body.eventoId || !req.body.cantidadTickets) {
        res.status(400).json({
          success: false,
          message: 'Faltan campos requeridos: eventoId, cantidadTickets'
        });
        return;
      }
      
      const command = new CreateReservationCommand({
        eventoId: req.body.eventoId,
        cantidadTickets: req.body.cantidadTickets,
        usuarioId: usuarioId
      });
      const result = await this.createReservationHandler.execute(command);

      res.status(201).json({
        success: true,
        message: 'Reserva creada exitosamente',
        data: result
      });
    } catch (error: any) {
      const isClientError = error.message.includes('evento') || 
                            error.message.includes('tickets');
      const status = isClientError ? 400 : 500;
      res.status(status).json({ success: false, message: error.message });     
    }
  }

  // Confirmar pago (simulado)
  confirmPayment = async (req: AuthRequest, res: Response): Promise<any> => {
    const { id } = req.params;
    const usuarioId = req.user?.id;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const reservaResult = await client.query(
        'SELECT * FROM reservas WHERE id = $1 FOR UPDATE',
        [id]
      );

      if (reservaResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Reserva no encontrada'
        });
      }

      const reserva = reservaResult.rows[0];

      if (reserva.usuario_id !== usuarioId) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para confirmar esta reserva'
        });
      }

      if (reserva.estado !== 'PENDIENTE_PAGO') {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `La reserva ya está ${reserva.estado}`
        });
      }

      // Confirmar pago
      await client.query(
        `UPDATE reservas SET estado = 'CONFIRMADA', pagado_en = NOW() WHERE id = $1`,
        [id]
      );

      // Actualizar reservas confirmadas del evento
      await client.query(
        `UPDATE eventos 
         SET reservas_confirmadas = reservas_confirmadas + $1,
             reservas_pendientes = reservas_pendientes - $1
         WHERE id = $2`,
        [reserva.cantidad_tickets, reserva.evento_id]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: '¡Pago confirmado! Tu ticket ha sido emitido.',
        data: {
          id: reserva.id,
          estado: 'CONFIRMADA',
          codigoTicket: reserva.codigo_ticket
        }
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      res.status(500).json({
        success: false,
        message: 'Error al confirmar pago',
        error: error.message
      });
    } finally {
      client.release();
    }
  }

  // Mis reservas (historial de compras)
  myReservations = async (req: AuthRequest, res: Response): Promise<void> => {
    const usuarioId = req.user?.id;

    try {
      const result = await pool.query(
        `SELECT r.*, e.titulo as evento_titulo, e.fecha as evento_fecha, e.lugar as evento_lugar
         FROM reservas r
         JOIN eventos e ON r.evento_id = e.id
         WHERE r.usuario_id = $1
         ORDER BY r.reservado_en DESC`,
        [usuarioId]
      );

      res.json({
        success: true,
        count: result.rows.length,
        data: result.rows.map(r => ({
          id: r.id,
          eventoId: r.evento_id,
          eventoTitulo: r.evento_titulo,
          eventoFecha: r.evento_fecha,
          eventoLugar: r.evento_lugar,
          cantidadTickets: r.cantidad_tickets,
          estado: r.estado,
          codigoTicket: r.codigo_ticket,
          reservadoEn: r.reservado_en,
          pagadoEn: r.pagado_en
        }))
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener reservas'
      });
    }
  }

  // Cancelar reserva
  cancelReservation = async (req: AuthRequest, res: Response): Promise<any> => {
    const { id } = req.params;
    const usuarioId = req.user?.id;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const reservaResult = await client.query(
        'SELECT * FROM reservas WHERE id = $1 FOR UPDATE',
        [id]
      );

      if (reservaResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Reserva no encontrada'
        });
      }

      const reserva = reservaResult.rows[0];

      if (reserva.usuario_id !== usuarioId) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para cancelar esta reserva'
        });
      }

      if (reserva.estado === 'CONFIRMADA') {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'No puedes cancelar una reserva ya confirmada'
        });
      }

      if (reserva.estado === 'CANCELADA') {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'La reserva ya está cancelada'
        });
      }

      await client.query(
        `UPDATE reservas SET estado = 'CANCELADA' WHERE id = $1`,
        [id]
      );

      await client.query(
        `UPDATE eventos SET reservas_pendientes = reservas_pendientes - $1 WHERE id = $2`,
        [reserva.cantidad_tickets, reserva.evento_id]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Reserva cancelada exitosamente'
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      res.status(500).json({
        success: false,
        message: 'Error al cancelar reserva'
      });
    } finally {
      client.release();
    }
  }
}