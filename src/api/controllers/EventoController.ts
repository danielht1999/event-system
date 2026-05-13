// src/api/controllers/EventoController.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { CreateEventCommand } from '../../application/commands/CreateEventCommand';
import { CreateEventHandler } from '../../application/handlers/CreateEventHandler';
import { IEventoRepository } from '../../domain/repositories/IEventoRepository';
import { ListarEventosHandler } from '../../application/handlers/ListarEventosHandler';
import { ListarEventosCommand } from '../../application/commands/ListarEventosCommand';

export class EventoController {
  constructor(
  private createEventHandler: CreateEventHandler,
  private eventoRepository: IEventoRepository,
  private listarEventosHandler: ListarEventosHandler
  ){}

  // Listar todos los eventos (público)
  listar = async (req: Request, res: Response): Promise<void> => {
  try {
    const command = new ListarEventosCommand();
    const result = await this.listarEventosHandler.execute(command);
    
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
      if (!this.eventoRepository) {
        res.status(500).json({ success: false, message: 'Repositorio no disponible' });
        return;
      }
      
      const { id } = req.params;
      const evento = await this.eventoRepository.findById(id);
      
      if (!evento) {
        res.status(404).json({ success: false, message: 'Evento no encontrado' });
        return;
      }
      
      res.json({
        success: true,
        data: evento
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
      if (!this.eventoRepository) {
        res.status(500).json({ success: false, message: 'Repositorio no disponible' });
        return;
      }
      
      const { id } = req.params;
      const evento = await this.eventoRepository.findById(id);
      
      if (!evento) {
        res.status(404).json({ success: false, message: 'Evento no encontrado' });
        return;
      }
      
      // TODO: Obtener reservas actuales de otro repositorio      
      res.json({
        success: true,
        data: {
          capacidadTotal: evento.capacidadTotal,
          cuposDisponibles: evento.cuposDisponibles,
          estaLleno: evento.estaLleno()
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
      const organizadorId = req.user?.id
      
      if (!organizadorId) {
        res.status(401).json({ success: false, message: 'No autorizado' });
        return;
      }

      const command = new CreateEventCommand({
        ...req.body,
        organizadorId
      });

      const evento = await this.createEventHandler.execute(command);

      res.status(201).json({
        success: true,
        message: 'Evento creado exitosamente',
        data: evento
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
      if (!this.eventoRepository) {
        res.status(500).json({ success: false, message: 'Repositorio no disponible' });
        return;
      }
      
      const { id } = req.params;
      const organizadorId = req.user?.id;
      
      // Verificar que el evento existe y pertenece al organizador
      const evento = await this.eventoRepository.findById(id);
      
      if (!evento) {
        res.status(404).json({ success: false, message: 'Evento no encontrado' });
        return;
      }
      
      if (evento.organizadorId !== organizadorId) {
        res.status(403).json({ success: false, message: 'No tienes permiso para editar este evento' });
        return;
      }
      
      const eventoActualizado = await this.eventoRepository.update(id, req.body);
      
      res.json({
        success: true,
        message: 'Evento actualizado exitosamente',
        data: eventoActualizado
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
      if (!this.eventoRepository) {
        res.status(500).json({ success: false, message: 'Repositorio no disponible' });
        return;
      }
      
      const { id } = req.params;
      const organizadorId = req.user?.id;
      
      const evento = await this.eventoRepository.findById(id);
      
      if (!evento) {
        res.status(404).json({ success: false, message: 'Evento no encontrado' });
        return;
      }
      
      if (evento.organizadorId !== organizadorId) {
        res.status(403).json({ success: false, message: 'No tienes permiso para publicar este evento' });
        return;
      }
      
      // TODO: Agregar campo 'publicado' a la entidad Evento
      const eventoActualizado = await this.eventoRepository.update(id, { publicado: true } as any);
      
      res.json({
        success: true,
        message: 'Evento publicado exitosamente',
        data: eventoActualizado
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
      if (!this.eventoRepository) {
        res.status(500).json({ success: false, message: 'Repositorio no disponible' });
        return;
      }
      
      const { id } = req.params;
      const organizadorId = req.user?.id;
      
      const evento = await this.eventoRepository.findById(id);
      
      if (!evento) {
        res.status(404).json({ success: false, message: 'Evento no encontrado' });
        return;
      }
      
      if (evento.organizadorId !== organizadorId) {
        res.status(403).json({ success: false, message: 'No tienes permiso para cancelar este evento' });
        return;
      }
      
      await this.eventoRepository.delete(id);
      
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
}