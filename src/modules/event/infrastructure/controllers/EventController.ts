// src/modules/event/infrastructure/controllers/EventController.ts
import { Request, Response } from 'express';
import { AuthRequest } from '@shared/api/middlewares/auth';
import { CreateEventCommand } from '../../application/commands/CreateEventCommand';
import { CreateEventHandler } from '../../application/commands/CreateEventHandler';
import { IEventRepository } from '../../domain/repositories/IEventRepository';
import { GetEventsHandler } from '../../application/queries/GetEventsHandler';
import { GetEventsByOrganizerHandler } from '../../application/queries/GetEventsByOrganizerHandler';

export class EventController {
  constructor(
    private createEventHandler: CreateEventHandler,
    private eventRepository: IEventRepository,
    private getEventsHandler: GetEventsHandler,
    private getEventsByOrganizerHandler: GetEventsByOrganizerHandler
  ) {}

  // Listar todos los eventos (público)
  listar = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.getEventsHandler.execute();
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error al listar eventos',
        error: error.message
      });
    }
  };

  // Obtener un evento por ID (público)
  obtener = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!this.eventRepository) {
        res.status(500).json({ success: false, message: 'Repositorio no disponible' });
        return;
      }
      
      const { id } = req.params;
      const event = await this.eventRepository.findById(id);
      
      if (!event) {
        res.status(404).json({ success: false, message: 'Evento no encontrado' });
        return;
      }
      
      res.json({
        success: true,
        data: event
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener evento',
        error: error.message
      });
    }
  };

  // Ver disponibilidad de cupos (público)
  verDisponibilidad = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!this.eventRepository) {
        res.status(500).json({ success: false, message: 'Repositorio no disponible' });
        return;
      }
      
      const { id } = req.params;
      const event = await this.eventRepository.findById(id);
      
      if (!event) {
        res.status(404).json({ success: false, message: 'Evento no encontrado' });
        return;
      }
      
      // TODO: Obtener reservas actuales de otro repositorio      
      res.json({
        success: true,
        data: {
          capacidadTotal: event.capacidadTotal,
          cuposDisponibles: event.cuposDisponibles,
          estaLleno: event.estaLleno()
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error al ver disponibilidad',
        error: error.message
      });
    }
  };

  // Crear evento (solo ORGANIZADOR)
  crear = async (req: AuthRequest, res: Response): Promise<void> => {
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

      const event = await this.createEventHandler.execute(command);

      res.status(201).json({
        success: true,
        message: 'Evento creado exitosamente',
        data: event
      });
    } catch (error: any) {
      const status = error.message.includes('requerido') || 
                     error.message.includes('futura') ||
                     error.message.includes('mayor a 0') ? 400 : 500;
      
      res.status(status).json({
        success: false,
        message: error.message
      });
    }
  };

  // Actualizar evento (solo ORGANIZADOR)
  actualizar = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!this.eventRepository) {
        res.status(500).json({ success: false, message: 'Repositorio no disponible' });
        return;
      }
      
      const { id } = req.params;
      const organizerId = req.user?.id;
      
      // Verificar que el evento existe y pertenece al organizador
      const event = await this.eventRepository.findById(id);
      
      if (!event) {
        res.status(404).json({ success: false, message: 'Evento no encontrado' });
        return;
      }
      
      if (event.organizadorId !== organizerId) {
        res.status(403).json({ success: false, message: 'No tienes permiso para editar este evento' });
        return;
      }
      
      const updatedEvent = await this.eventRepository.update(id, req.body);
      
      res.json({
        success: true,
        message: 'Evento actualizado exitosamente',
        data: updatedEvent
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error al actualizar evento',
        error: error.message
      });
    }
  };

  // Publicar evento (cambiar estado a publicado)
  publicar = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!this.eventRepository) {
        res.status(500).json({ success: false, message: 'Repositorio no disponible' });
        return;
      }
      
      const { id } = req.params;
      const organizerId = req.user?.id;
      
      const event = await this.eventRepository.findById(id);
      
      if (!event) {
        res.status(404).json({ success: false, message: 'Evento no encontrado' });
        return;
      }
      
      if (event.organizadorId !== organizerId) {
        res.status(403).json({ success: false, message: 'No tienes permiso para publicar este evento' });
        return;
      }
      
      const updatedEvent = await this.eventRepository.update(id, { estado: 'PUBLICADA' } as any);
      
      res.json({
        success: true,
        message: 'Evento publicado exitosamente',
        data: updatedEvent
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error al publicar evento',
        error: error.message
      });
    }
  };

  // Cancelar evento (solo ORGANIZADOR)
  cancelar = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!this.eventRepository) {
        res.status(500).json({ success: false, message: 'Repositorio no disponible' });
        return;
      }
      
      const { id } = req.params;
      const organizerId = req.user?.id;
      
      const event = await this.eventRepository.findById(id);
      
      if (!event) {
        res.status(404).json({ success: false, message: 'Evento no encontrado' });
        return;
      }
      
      if (event.organizadorId !== organizerId) {
        res.status(403).json({ success: false, message: 'No tienes permiso para cancelar este evento' });
        return;
      }
      
      await this.eventRepository.delete(id);
      
      res.json({
        success: true,
        message: 'Evento cancelado exitosamente'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error al cancelar evento',
        error: error.message
      });
    }
  };

  misEventos = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizerId = req.user?.id;
    
    if (!organizerId) {
      res.status(401).json({ success: false, message: 'No autorizado' });
      return;
    }
    const result = await this.getEventsByOrganizerHandler.execute(organizerId);

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error al listar eventos del organizador',
      error: error.message
    });
  }
}
}