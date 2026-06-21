import { Request, Response } from 'express';
import { AuthRequest } from '@shared/api/middlewares/auth';
import { CreateTicketTypeCommand } from '../../application/commands/CreateTicketTypeCommand';
import { CreateTicketTypeHandler } from '../../application/commands/CreateTicketTypeHandler';
import { UpdateTicketTypeCommand } from '../../application/commands/UpdateTicketTypeCommand';
import { UpdateTicketTypeHandler } from '../../application/commands/UpdateTicketTypeHandler';
import { IncreaseTicketCapacityCommand } from '../../application/commands/IncreaseTicketCapacityCommand';
import { IncreaseTicketCapacityHandler } from '../../application/commands/IncreaseTicketCapacityHandler';
import { DeactivateTicketTypeCommand } from '../../application/commands/DeactivateTicketTypeCommand';
import { DeactivateTicketTypeHandler } from '../../application/commands/DeactivateTicketTypeHandler';
import { GetTicketTypesByEventHandler } from '../../application/queries/GetTicketTypesByEventHandler';
import { GetTicketTypeByIdHandler } from '../../application/queries/GetTicketTypeByIdHandler';

export class TicketTypeController {
  constructor(
    private readonly createTicketTypeHandler: CreateTicketTypeHandler,
    private readonly updateTicketTypeHandler: UpdateTicketTypeHandler,
    private readonly increaseTicketCapacityHandler: IncreaseTicketCapacityHandler,
    private readonly deactivateTicketTypeHandler: DeactivateTicketTypeHandler,
    private readonly getTicketTypesByEventHandler: GetTicketTypesByEventHandler,
    private readonly getTicketTypeByIdHandler: GetTicketTypeByIdHandler
  ) {}

  // =========================================================================
  // MUTACIONES (COMMANDS)
  // =========================================================================

  crear = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { eventId } = req.params;
      const organizerId = req.user?.id;
      if (!organizerId) {
        res.status(401).json({ success: false, message: 'No autorizado' });
        return;
      }

      const command = new CreateTicketTypeCommand({
        ...req.body,
        eventId,
        organizadorId: organizerId
      });

      const result = await this.createTicketTypeHandler.execute(command);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  actualizar = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { eventId, id } = req.params;
      const organizerId = req.user?.id;
      if (!organizerId) {
        res.status(401).json({ success: false, message: 'No autorizado' });
        return;
      }

      const command = new UpdateTicketTypeCommand({
        eventId,
        ticketTypeId: id,
        organizadorId: organizerId,
        nombre: req.body.nombre,
        precio: req.body.precio
      });

      await this.updateTicketTypeHandler.execute(command);
      res.json({ success: true, message: 'Ticket actualizado exitosamente' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  incrementarCapacidad = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { eventId, id } = req.params;
      const organizerId = req.user?.id;
      if (!organizerId) {
        res.status(401).json({ success: false, message: 'No autorizado' });
        return;
      }

      const command = new IncreaseTicketCapacityCommand({
        eventId,
        ticketTypeId: id,
        organizadorId: organizerId,
        nuevaCapacidad: req.body.nuevaCapacidad
      });

      await this.increaseTicketCapacityHandler.execute(command);
      res.json({ success: true, message: 'Capacidad incrementada exitosamente' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  desactivar = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { eventId, id } = req.params;
      const organizerId = req.user?.id;
      if (!organizerId) {
        res.status(401).json({ success: false, message: 'No autorizado' });
        return;
      }

      const command = new DeactivateTicketTypeCommand({
        eventId,
        ticketTypeId: id,
        organizadorId: organizerId
      });

      await this.deactivateTicketTypeHandler.execute(command);
      res.json({ success: true, message: 'Ticket desactivado de forma segura' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  // =========================================================================
  // CONSULTAS (QUERIES)
  // =========================================================================

  listarPorEvento = async (req: Request, res: Response): Promise<void> => {
    try {
      const { eventId } = req.params;
      const result = await this.getTicketTypesByEventHandler.execute(eventId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  obtenerPorId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.getTicketTypeByIdHandler.execute(id);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  };
}