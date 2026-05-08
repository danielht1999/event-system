import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Evento } from '../../domain/entities/Evento';
import { Capacidad } from '../../domain/value-objects/Capacidad';
import { FechaEvento } from '../../domain/value-objects/FechaEvento';
import { PostgresEventoRepository } from '../../infrastructure/database/repositories/PostgresEventoRepository';

const eventoRepository = new PostgresEventoRepository();

export class EventoController {
  async listarEventos(req: Request, res: Response) {
    const eventos = await eventoRepository.findPublicados();
    res.json({
      success: true,
      count: eventos.length,
      data: eventos.map(e => ({
        id: e.id,
        titulo: e.titulo,
        descripcion: e.descripcion,
        fecha: e.fecha,
        lugar: e.lugar,
        precio: e.precio,
        cuposDisponibles: e.cuposDisponibles,
        estado: e.estado
      }))
    });
  }

  async obtenerEvento(req: Request, res: Response) {
    const { id } = req.params;
    const evento = await eventoRepository.findById(id);
    
    if (!evento) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado' });
    }
    
    res.json({
      success: true,
      data: {
        id: evento.id,
        titulo: evento.titulo,
        descripcion: evento.descripcion,
        fecha: evento.fecha,
        lugar: evento.lugar,
        capacidad: evento.capacidad,
        precio: evento.precio,
        cuposDisponibles: evento.cuposDisponibles,
        estado: evento.estado
      }
    });
  }

  async verDisponibilidad(req: Request, res: Response) {
    const { id } = req.params;
    const evento = await eventoRepository.findById(id);
    
    if (!evento) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado' });
    }
    
    res.json({
      success: true,
      data: {
        eventoId: evento.id,
        titulo: evento.titulo,
        cuposTotales: evento.capacidad,
        cuposDisponibles: evento.cuposDisponibles,
        estaLleno: evento.estaLleno
      }
    });
  }

  async crearEvento(req: Request, res: Response) {
    const { titulo, descripcion, fecha, lugar, capacidad, precio } = req.body;
    const organizadorId = (req as any).user?.id;

    if (!organizadorId) {
      return res.status(401).json({ success: false, message: 'Debes iniciar sesión para crear eventos' });
    }
    
    try {
      const evento = new Evento(
        uuidv4(),
        organizadorId,
        titulo,
        descripcion,
        lugar,
        new FechaEvento(new Date(fecha)),
        new Capacidad(capacidad),
        precio,
        'BORRADOR'
      );
      
      await eventoRepository.save(evento);
      
      res.status(201).json({
        success: true,
        message: 'Evento creado exitosamente',
        data: { 
          id: evento.id, 
          titulo: evento.titulo, 
          lugar: evento.lugar, 
          fecha: evento.fecha, 
          estado: evento.estado 
        }
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async publicarEvento(req: Request, res: Response) {
    const { id } = req.params;
    const usuarioId = (req as any).user?.id;
    
    const evento = await eventoRepository.findById(id);
    
    if (!evento) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado' });
    }
    
    // Verificar que el usuario es el organizador
    if (evento.organizadorId !== usuarioId) {
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permiso para publicar este evento' 
      });
    }
    
    try {
      evento.publicar();
      await eventoRepository.update(evento);
      res.json({ 
        success: true, 
        message: 'Evento publicado exitosamente', 
        data: { id: evento.id, estado: evento.estado } 
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async actualizarEvento(req: Request, res: Response) {
    const { id } = req.params;
    const updates = req.body;
    const usuarioId = (req as any).user?.id;
    
    const evento = await eventoRepository.findById(id);
    
    if (!evento) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado' });
    }
    
    if (evento.organizadorId !== usuarioId) {
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permiso para actualizar este evento' 
      });
    }
    
    if (updates.titulo) evento.titulo = updates.titulo;
    if (updates.descripcion) evento.descripcion = updates.descripcion;
    if (updates.lugar) evento.lugar = updates.lugar;
    if (updates.precio !== undefined) evento.precio = updates.precio;
    
    await eventoRepository.update(evento);
    res.json({ success: true, message: 'Evento actualizado exitosamente' });
  }

  async cancelarEvento(req: Request, res: Response) {
    const { id } = req.params;
    const usuarioId = (req as any).user?.id;
    
    const evento = await eventoRepository.findById(id);
    
    if (!evento) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado' });
    }
    
    if (evento.organizadorId !== usuarioId) {
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permiso para cancelar este evento' 
      });
    }
    
    evento.cancelar();
    await eventoRepository.update(evento);
    res.json({ success: true, message: 'Evento cancelado exitosamente' });
  }
}