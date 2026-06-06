// src/modules/event/infrastructure/controllers/EventController.ts
import { Request, Response } from 'express';
import { AuthRequest } from '@shared/api/middlewares/auth';
import { CreateEventCommand } from '../../application/commands/CreateEventCommand';
import { CreateEventHandler } from '../../application/commands/CreateEventHandler';
import { IEventRepository,EventUpdateData } from '../../domain/repositories/IEventRepository';
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
      const { id } = req.params;
      const event = await this.eventRepository.findById(id);
      
      if (!event) {
        res.status(404).json({ success: false, message: 'Evento no encontrado' });
        return;
      }
      
      res.json({
        success: true,
        data: {
          capacidadTotal: event.capacidadTotal.value,
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

  // Actualizar evento (solo ORGANIZADOR) - Mantiene actualización parcial de textos planos
  actualizar = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const organizerId = req.user?.id;
      
      // 1. Validar la existencia previa del evento
      const event = await this.eventRepository.findById(id);
      
      if (!event) {
        res.status(404).json({ success: false, message: 'Evento no encontrado' });
        return;
      }
      
      // 2. Control de autoría/acceso de dominio
      if (event.organizadorId !== organizerId) {
        res.status(403).json({ success: false, message: 'No tienes permiso para editar este evento' });
        return;
      }
      
      // 3. Sanitización y mapeo explícito al DTO plano EventUpdateData
      // Esto previene mutaciones masivas accidentales o maliciosas desde el cliente HTTP
      const updateData: EventUpdateData = {
        titulo: req.body.titulo !== undefined ? String(req.body.titulo).trim() : undefined,
        descripcion: req.body.descripcion !== undefined ? String(req.body.descripcion).trim() : undefined,
        lugar: req.body.lugar !== undefined ? String(req.body.lugar).trim() : undefined
      };
      
      // 4. Ejecución del query especializado de infraestructura para datos planos
      const updatedEvent = await this.eventRepository.updateData(id, updateData);
      
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

  // REFACTORIZADO: Publicar evento pasando por Dominio
  publicar = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
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
      
      // 1. Ejecutamos la validación y cambio de estado dentro de la entidad
      event.publicar(); 
      
      // 2. Guardamos la entidad mutada. Esto dispara automáticamente la invalidación de caché
      const savedEvent = await this.eventRepository.save(event);
      
      res.json({
        success: true,
        message: 'Evento publicado exitosamente',
        data: savedEvent
      });
    } catch (error: any) {
      // Si la entidad tira el error de "Solo se pueden publicar eventos en borrador", respondemos 400
      const status = error.message.includes('estado BORRADOR') ? 400 : 500;
      res.status(status).json({
        success: false,
        message: 'Error al publicar evento',
        error: error.message
      });
    }
  };
  // REFACTORIZADO: Cancelar evento pasando por Dominio (No borra la fila)
  cancelar = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
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
      
      // 1. Transicionamos el estado a CANCELADA en el dominio
      event.cancelar();
      
      // 2. Persistimos los cambios usando save() en lugar de eliminar el registro
      const savedEvent = await this.eventRepository.save(event);
      
      res.json({
        success: true,
        message: 'Evento cancelado exitosamente',
        data: savedEvent
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
  };
}