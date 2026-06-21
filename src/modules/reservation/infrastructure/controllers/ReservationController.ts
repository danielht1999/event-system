// src/modules/reservation/infrastructure/controllers/ReservationController.ts

import { Response } from 'express';
import { AuthRequest } from '@shared/api/middlewares/auth';
import { CreateReservationCommand } from '../../application/commands/CreateReservationCommand';
import { CreateReservationHandler } from '../../application/commands/CreateReservationHandler';
import { ConfirmPaymentCommand } from '../../application/commands/ConfirmPaymentCommand';
import { ConfirmPaymentHandler } from '../../application/commands/ConfirmPaymentHandler';
import { CancelReservationCommand } from '../../application/commands/CancelReservationCommand';
import { CancelReservationHandler } from '../../application/commands/CancelReservationHandler';
import { GetReservationsHandler } from '../../application/queries/GetReservationsHandler';
import { GetReservationsQuery } from '../../application/queries/GetReservationsQuery';
import { ReservationSortField } from '../../application/queries/ReservationSortField';
import { RESERVATION_QUERY_CAPABILITIES } from '../../application/queries/ReservationQueryCapabilities';

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

        owner:
          RESERVATION_QUERY_CAPABILITIES.ownerFilter && req.query.owner === 'me'
            ? userId
            : undefined,

        status:
          RESERVATION_QUERY_CAPABILITIES.statusFilter
            ? (req.query.status as string)
            : undefined,

        sortBy:
          RESERVATION_QUERY_CAPABILITIES.sorting &&
          req.query.sortBy
            ? (req.query.sortBy as ReservationSortField)
            : 'createdAt',

        sortOrder:
          RESERVATION_QUERY_CAPABILITIES.sorting
            ? (req.query.sortOrder === 'asc' ? 'asc' : 'desc')
            : 'desc'
      };

      const result =
        await this.getReservationsHandler.execute(query);

      res.json({
        success: true,
        ...result
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error al listar reservas',
        error: error.message
      });
    }
  };

  createReservation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const usuarioId = req.user?.id;

      if (!usuarioId) {
        res.status(401).json({
          success: false,
          message: 'No autorizado'
        });
        return;
      }

      if (!req.body.eventoId || !req.body.ticketTypeId || !req.body.cantidadTickets) {
        res.status(400).json({
          success: false,
          message: 'Faltan campos requeridos: eventoId, ticketTypeId, cantidadTickets'
        });
        return;
      }

      const command = new CreateReservationCommand({
        eventoId: req.body.eventoId,
        ticketTypeId: req.body.ticketTypeId,
        cantidadTickets: Number(req.body.cantidadTickets),
        usuarioId
      });

      const result =
        await this.createReservationHandler.execute(command);

      res.status(201).json({
        success: true,
        message: 'Reserva creada exitosamente',
        data: result
      });

    } catch (error: any) {
      const isClientError =
        error.message.includes('evento') ||
        error.message.includes('ticket') ||
        error.message.includes('capacidad');

      res.status(isClientError ? 400 : 500).json({
        success: false,
        message: error.message
      });
    }
  };

  confirmPayment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'No autorizado'
        });
        return;
      }

      const command = new ConfirmPaymentCommand({
        reservationId: id,
        usuarioId: userId
      });

      const result =
        await this.confirmPaymentHandler.execute(command);

      res.json({
        success: true,
        message: 'Pago confirmado exitosamente',
        data: result
      });

    } catch (error: any) {
      const status =
        error.message.includes('encontrada') ? 404 :
        error.message.includes('permiso') ? 403 :
        error.message.includes('pendiente') ? 400 : 500;

      res.status(status).json({
        success: false,
        message: error.message
      });
    }
  };

  cancelReservation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'No autorizado'
        });
        return;
      }

      const command = new CancelReservationCommand({
        reservationId: id,
        usuarioId: userId
      });

      const result =
        await this.cancelReservationHandler.execute(command);

      res.json({
        success: true,
        message: 'Reserva cancelada exitosamente',
        data: result
      });

    } catch (error: any) {
      const status =
        error.message.includes('encontrada') ? 404 :
        error.message.includes('permiso') ? 403 :
        error.message.includes('pendiente') ? 400 : 500;

      res.status(status).json({
        success: false,
        message: error.message
      });
    }
  };
}