// src/modules/reservation/infrastructure/controllers/ReservationController.ts
import { Response } from 'express';
import { AuthRequest } from '@shared/api/middlewares/auth';
import pool from '@shared/infrastructure/database/connection';
import { CreateReservationCommand } from '../../application/commands/CreateReservationCommand';
import { CreateReservationHandler } from '../../application/commands/CreateReservationHandler';
import { ConfirmPaymentCommand } from '../../application/commands/ConfirmPaymentCommand';
import { ConfirmPaymentHandler } from '../../application/commands/ConfirmPaymentHandler';
import { CancelReservationCommand } from '../../application/commands/CancelReservationCommand';
import { CancelReservationHandler } from '../../application/commands/CancelReservationHandler';

export class ReservationController {
  constructor(
    private createReservationHandler: CreateReservationHandler,
    private confirmPaymentHandler: ConfirmPaymentHandler,
    private cancelReservationHandler: CancelReservationHandler
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
  
  confirmPayment = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'No autorizado' });
      return;
    }

    const command = new ConfirmPaymentCommand({
      reservationId: id,
      usuarioId: userId
    });

    const result = await this.confirmPaymentHandler.execute(command);

    res.json({
      success: true,
      message: 'Pago confirmado exitosamente',
      data: result
    });
  } catch (error: any) {
    const status = error.message.includes('encontrada') ? 404 :
                   error.message.includes('permiso') ? 403 :
                   error.message.includes('pendiente') ? 400 : 500;
    res.status(status).json({ success: false, message: error.message });
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
    try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'No autorizado' });
      return;
    }

    const command = new CancelReservationCommand({
      reservationId: id,
      usuarioId: userId
    });

    const result = await this.cancelReservationHandler.execute(command);

    res.json({
      success: true,
      message: 'Cancelacion confirmado exitosamente',
      data: result
    });
  } catch (error: any) {
    const status = error.message.includes('encontrada') ? 404 :
                   error.message.includes('permiso') ? 403 :
                   error.message.includes('pendiente') ? 400 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
  }
}