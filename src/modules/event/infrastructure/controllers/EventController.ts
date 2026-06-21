// src/modules/event/infrastructure/controllers/EventController.ts
import { Request, Response } from 'express';
import { AuthRequest } from '@shared/api/middlewares/auth';
import { CreateEventCommand } from '@modules/event/application/commands/CreateEventCommand';
import { CreateEventHandler } from '@modules/event/application/commands/CreateEventHandler';
import { UpdateEventCommand } from '@modules/event/application/commands/UpdateEventCommand';
import { UpdateEventHandler } from '@modules/event/application/commands/UpdateEventHandler';
import { GetEventsHandler } from '@modules/event/application/queries/GetEventsHandler';
import { GetEventsQuery } from '@modules/event/application/queries/GetEventsQuery'; 
import { GetEventByIdHandler } from '@modules/event/application/queries/GetEventByIdHandler';
import { GetEventAvailabilityHandler } from '@modules/event/application/queries/GetEventAvailabilityHandler';
import { PublishEventCommand } from '@modules/event/application/commands/PublishEventCommand';
import { PublishEventHandler } from '@modules/event/application/commands/PublishEventHandler';
import { CancelEventCommand } from '@modules/event/application/commands/CancelEventCommand';
import { CancelEventHandler } from '@modules/event/application/commands/CancelEventHandler';
import { EVENT_QUERY_CAPABILITIES } from '@modules/event/application/queries/EventQueryCapabilities';

export class EventController {
  constructor(
    private readonly createEventHandler: CreateEventHandler,
    private readonly updateEventHandler: UpdateEventHandler,
    private readonly getEventsHandler: GetEventsHandler,
    private readonly getEventByIdHandler: GetEventByIdHandler,
    private readonly getEventAvailabilityHandler: GetEventAvailabilityHandler,
    private readonly publishEventHandler: PublishEventHandler,
    private readonly cancelEventHandler: CancelEventHandler
  ) {}

  // =========================================================================
  // CONSULTAS (QUERIES) CON PAGINACIÓN
  // =========================================================================

  list = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;

    const requestedOwner = req.query.owner as string | undefined;
    const requestedStatus = req.query.status as string | undefined;

    let ownerFilter = undefined;

    if (EVENT_QUERY_CAPABILITIES.ownerFilter) {
      if (requestedOwner === 'me') {
        if (!userId) {
          res.status(401).json({
            success: false,
            message: 'No autorizado'
          });
          return;
        }
        ownerFilter = userId;
      } else {
        ownerFilter = requestedOwner;
      }
    }

    const query: GetEventsQuery = {
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,

      status: EVENT_QUERY_CAPABILITIES.statusFilter
        ? requestedStatus
        : undefined,

      owner: ownerFilter
    };

    const result =
      await this.getEventsHandler.execute(query);

    res.json({
      success: true,
      ...result
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error al listar eventos',
      error: error.message
    });
  }
};
  // =========================================================================
  // CONSULTAS (QUERIES)
  // =========================================================================  

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.getEventByIdHandler.execute(id);
      
      res.json({ success: true, data: result });
    } catch (error: any) {
      const status = error.name === 'NotFoundError' || error.message.includes('not found') ? 404 : 500;
      res.status(status).json({
        success: false,
        message: error.message
      });
    }
  };

  getAvailability = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.getEventAvailabilityHandler.execute(id);
      
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error al ver disponibilidad',
        error: error.message
      });
    }
  };

  // =========================================================================
  // MUTACIONES (COMMANDS)
  // =========================================================================

  create = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const organizerId = req.user?.id;
      if (!organizerId) {
        res.status(401).json({ success: false, message: 'No autorizado' });
        return;
      }

      const command = new CreateEventCommand({
        ...req.body,
        organizadorId: organizerId
      });

      const eventId = await this.createEventHandler.execute(command);

      res.status(201).json({
        success: true,
        message: 'Evento creado exitosamente',
        data: { id: eventId }
      });
    } catch (error: any) {
      const status = error.name === 'ValidationError' || error.message.includes('requerido') ? 400 : 500;
      res.status(status).json({
        success: false,
        message: error.message
      });
    }
  };

  update = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const organizerId = req.user?.id;
      if (!organizerId) {
        res.status(401).json({ success: false, message: 'No autorizado' });
        return;
      }

      const command = new UpdateEventCommand({
        eventId: id,
        organizadorId: organizerId,
        titulo: req.body.titulo,
        descripcion: req.body.descripcion,
        lugar: req.body.lugar,
        fecha: req.body.fecha
      });

      await this.updateEventHandler.execute(command);
      
      res.json({
        success: true,
        message: 'Evento actualizado exitosamente'
      });
    } catch (error: any) {
      const status = error.name === 'ForbiddenError' ? 403 
                   : error.name === 'NotFoundError' ? 404 : 400;
      
      res.status(status).json({
        success: false,
        message: error.message
      });
    }
  };

  publish = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const organizerId = req.user?.id;
      if (!organizerId) {
        res.status(401).json({ success: false, message: 'No autorizado' });
        return;
      }
      
      const command = new PublishEventCommand({
        eventId: id,
        organizerId: organizerId
      });

      await this.publishEventHandler.execute(command);

      res.json({ 
        success: true, 
        message: 'Evento publicado exitosamente' 
      });
    } catch (error: any) {
      const status = error.name === 'ForbiddenError' ? 403 
                   : error.name === 'NotFoundError' ? 404 : 400;
      res.status(status).json({ success: false, message: error.message });
    }
  };

  cancel = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const organizerId = req.user?.id;
      if (!organizerId) {
        res.status(401).json({ success: false, message: 'No autorizado' });
        return;
      }

      const command = new CancelEventCommand({
        eventId: id,
        organizerId: organizerId
      });

      await this.cancelEventHandler.execute(command);

      res.json({ 
        success: true, 
        message: 'Evento cancelado exitosamente' 
      });
    } catch (error: any) {
      const status = error.name === 'ForbiddenError' ? 403 
                   : error.name === 'NotFoundError' ? 404 : 400;
      res.status(status).json({ success: false, message: error.message });
    }
  };
}