// src/modules/reservation/infrastructure/controllers/ReservationController.ts

import { Response } from 'express';
import { AuthRequest } from '@shared/api/middlewares/auth';
import { CreateReservationCommand } from '../../application/commands/CreateReservationCommand';
import { ConfirmPaymentCommand } from '../../application/commands/ConfirmPaymentCommand';
import { CancelReservationCommand } from '../../application/commands/CancelReservationCommand';
import { GetReservationsQuery } from '../../application/queries/GetReservationsQuery';
import { ReservationSortField } from '../../application/queries/ReservationSortField';
import { RESERVATION_QUERY_CAPABILITIES } from '../../application/queries/ReservationQueryCapabilities';

// Asumiendo que usas un Bus o manteniendo tus Handlers aislados pero desacoplados de strings
import { CreateReservationHandler } from '../../application/commands/CreateReservationHandler';
import { ConfirmPaymentHandler } from '../../application/commands/ConfirmPaymentHandler';
import { CancelReservationHandler } from '../../application/commands/CancelReservationHandler';
import { GetReservationsHandler } from '../../application/queries/GetReservationsHandler';

export class ReservationController {
  constructor(
    private readonly createReservationHandler: CreateReservationHandler,
    private readonly confirmPaymentHandler: ConfirmPaymentHandler,
    private readonly cancelReservationHandler: CancelReservationHandler,
    private readonly getReservationsHandler: GetReservationsHandler
  ) {}

  list = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      const query: GetReservationsQuery = {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        owner: RESERVATION_QUERY_CAPABILITIES.ownerFilter && req.query.owner === 'me' ? userId : undefined,
        status: RESERVATION_QUERY_CAPABILITIES.statusFilter ? (req.query.status as string) : undefined,
        sortBy: RESERVATION_QUERY_CAPABILITIES.sorting && req.query.sortBy ? (req.query.sortBy as ReservationSortField) : 'createdAt',
        sortOrder: RESERVATION_QUERY_CAPABILITIES.sorting ? (req.query.sortOrder === 'asc' ? 'asc' : 'desc') : 'desc'
      };

      const result = await this.getReservationsHandler.execute(query);

      res.json({
        success: true,
        ...result
      });
    } catch (error: any) {
      this.handleError(res, error, 'Error al listar reservas');
    }
  };

  createReservation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const usuarioId = req.user?.id;
      if (!usuarioId) {
        res.status(401).json({ success: false, message: 'No autorizado' });
        return;
      }

      // Confiamos en el validador Joi (reservation.validator.ts). 
      // Eliminamos la validación manual duplicada de req.body.
      const command = new CreateReservationCommand({
        eventoId: req.body.eventoId,
        ticketTypeId: req.body.ticketTypeId,
        cantidadTickets: req.body.cantidadTickets, // Confiamos en el tipo ya validado por Joi
        usuarioId
      });

      const result = await this.createReservationHandler.execute(command);

      res.status(201).json({
        success: true,
        message: 'Reserva creada exitosamente',
        data: result
      });
    } catch (error: any) {
      this.handleError(res, error, 'Error al crear la reserva');
    }
  };

  confirmPayment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ success: false, message: 'No autorizado' });
        return;
      }

      const command = new ConfirmPaymentCommand({ reservationId: id, usuarioId: userId });
      const result = await this.confirmPaymentHandler.execute(command);

      res.json({
        success: true,
        message: 'Pago confirmado exitosamente',
        data: result
      });
    } catch (error: any) {
      this.handleError(res, error, 'Error al confirmar pago');
    }
  };

  cancelReservation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ success: false, message: 'No autorizado' });
        return;
      }

      const command = new CancelReservationCommand({ reservationId: id, usuarioId: userId });
      const result = await this.cancelReservationHandler.execute(command);

      res.json({
        success: true,
        message: 'Reserva cancelada exitosamente',
        data: result
      });
    } catch (error: any) {
      this.handleError(res, error, 'Error al cancelar reserva');
    }
  };

  /**
   * Centralizador de mapeo de errores polimórficos basados en clases (Instancias),
   * no en coincidencia de strings (que rompe tests al cambiar textos).
   */
  private handleError(res: Response, error: any, defaultMessage: string): void {
    // TIP: Cambia esto por tus clases reales de excepciones de dominio (ej: AppError, NotFoundError)
    if (error.name === 'NotFoundError' || error.message.includes('encontrada')) {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    if (error.name === 'UnauthorizedError' || error.message.includes('permiso')) {
      res.status(403).json({ success: false, message: error.message });
      return;
    }
    if (error.name === 'ValidationError' || error.message.includes('pendiente') || error.message.includes('capacidad')) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }

    res.status(500).json({
      success: false,
      message: defaultMessage,
      error: error.message
    });
  }
}