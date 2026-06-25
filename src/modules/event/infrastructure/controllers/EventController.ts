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
import { 
  ValidationError,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError
} from '@shared/domain/errors';
import { EventNotFoundError } from '@modules/event/domain/errors';

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

    const {
      owner,
      search,
      status,
      sortBy,
      sortOrder,
      page,
      limit
    } = req.query;

    let ownerFilter = undefined;
    let statusFilter = undefined;

    // ============================================================
    // LÓGICA DE FILTRADO POR OWNER
    // ============================================================
    
    if (owner === 'me') {
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'No autorizado - Se requiere autenticación para ver tus eventos'
        });
        return;
      }
      ownerFilter = userId;
      
      // Si el organizador especifica un status, lo respetamos
      if (status) {
        statusFilter = status as string;
      }
      // Si no hay status, NO filtramos por status (ver todos)
      
    } else {
      // ✅ Modo público: solo eventos publicados
      statusFilter = 'PUBLICADA';
      
      // Si el usuario intenta filtrar por status que no sea 'PUBLICADA'
      if (status && status !== 'PUBLICADA') {
        res.status(400).json({
          success: false,
          message: 'Los eventos no publicados solo son visibles para el organizador',
          details: ['Usa ?owner=me para ver tus eventos en borrador o cancelados']
        });
        return;
      }
      
      // Si el usuario especifica 'PUBLICADA' explícitamente, lo aceptamos
      if (status === 'PUBLICADA') {
        statusFilter = 'PUBLICADA';
      }
    }

    // ============================================================
    // CONSTRUIR QUERY (SOLO PARÁMETROS SOPORTADOS)
    // ============================================================
    
    const query: GetEventsQuery = {
      // Paginación
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      
      // Filtros
      owner: ownerFilter,
      status: statusFilter,
      search: search as string,
      
      // Ordenamiento
      sortBy: (sortBy as 'date' | 'title' | 'price' | 'createdAt') || 'date',
      sortOrder: (sortOrder as 'asc' | 'desc') || 'asc'
    };

    const result = await this.getEventsHandler.execute(query);

    res.json({
      success: true,
      ...result,
      filters: {
        owner: owner || 'public',
        status: statusFilter,
        search: search || null,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder
      }
    });
    
  } catch (error: any) {
    this.handleError(res, error, 'Error al listar eventos');
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
      this.handleError(res, error, 'Error al obtener el evento');
    }
  };

  getAvailability = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.getEventAvailabilityHandler.execute(id);

      res.json({ success: true, data: result });
    } catch (error: any) {
      this.handleError(res, error, 'Error al ver disponibilidad');
    }
  };

  // =========================================================================
  // MUTACIONES (COMMANDS)
  // =========================================================================

  create = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const organizerId = req.user?.id;
      if (!organizerId) {
        res.status(401).json({ 
          success: false, 
          message: 'No autorizado' 
        });
        return;
      }

      // ✅ Confiamos en el validador HTTP
      const command = new CreateEventCommand({
        titulo: req.body.titulo,
        descripcion: req.body.descripcion,
        fecha: req.body.fecha,
        lugar: req.body.lugar,
        capacidadTotal: req.body.capacidadTotal,
        organizadorId: organizerId,
        tickets: req.body.tickets
      });

      const result = await this.createEventHandler.execute(command);

      res.status(201).json({
        success: true,
        message: 'Evento creado exitosamente',
        data: result
      });
    } catch (error: any) {
      this.handleError(res, error, 'Error al crear el evento');
    }
  };

  update = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const organizerId = req.user?.id;
      
      if (!organizerId) {
        res.status(401).json({ 
          success: false, 
          message: 'No autorizado' 
        });
        return;
      }

      // ✅ Agregar capacidadTotal al Command
      const command = new UpdateEventCommand({
        eventId: id,
        organizadorId: organizerId,
        titulo: req.body.titulo,
        descripcion: req.body.descripcion,
        lugar: req.body.lugar,
        fecha: req.body.fecha,
        capacidadTotal: req.body.capacidadTotal // ✅ NUEVO
      });

      await this.updateEventHandler.execute(command);

      res.json({
        success: true,
        message: 'Evento actualizado exitosamente'
      });
    } catch (error: any) {
      this.handleError(res, error, 'Error al actualizar el evento');
    }
  };

  publish = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const organizerId = req.user?.id;
      
      if (!organizerId) {
        res.status(401).json({ 
          success: false, 
          message: 'No autorizado' 
        });
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
      this.handleError(res, error, 'Error al publicar el evento');
    }
  };

  cancel = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const organizerId = req.user?.id;
      
      if (!organizerId) {
        res.status(401).json({ 
          success: false, 
          message: 'No autorizado' 
        });
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
      this.handleError(res, error, 'Error al cancelar el evento');
    }
  };

  // =========================================================================
  // MANEJO CENTRALIZADO DE ERRORES
  // =========================================================================

  /**
   * ✅ Centralizador de manejo de errores
   * Usa tipos de error (instancias) en lugar de string matching
   */
  private handleError(res: Response, error: any, defaultMessage: string): void {
    // ✅ Errores de validación (400)
    if (error instanceof ValidationError) {
      res.status(400).json({
        success: false,
        message: error.message
      });
      return;
    }

    // ✅ No encontrado (404)
    if (error instanceof NotFoundError || error instanceof EventNotFoundError) {
      res.status(404).json({
        success: false,
        message: error.message
      });
      return;
    }

    // ✅ Prohibido (403)
    if (error instanceof ForbiddenError) {
      res.status(403).json({
        success: false,
        message: error.message
      });
      return;
    }

    // ✅ No autorizado (401)
    if (error instanceof UnauthorizedError) {
      res.status(401).json({
        success: false,
        message: error.message
      });
      return;
    }

    // ✅ Error genérico (500)
    console.error('Error no manejado:', error);
    res.status(500).json({
      success: false,
      message: defaultMessage,
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
}