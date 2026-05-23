// src/modules/event/application/queries/GetEventsHandler.ts
import { IEventRepository } from '../../domain/repositories/IEventRepository';

interface EventDTO {
  id: string
  titulo: string
  descripcion: string
  fecha: Date
  lugar: string
  capacidadTotal: number
  precio: number
  organizadorId: string
  reservasConfirmadas: number
  reservasPendientes: number
  cuposDisponibles: number
  estado: string
}

export class GetEventsHandler {
  constructor(
    private eventRepository: IEventRepository
  ) {}

  async execute(): Promise<EventDTO[]> {
    const events = await this.eventRepository.findAll();
    
    return events.map(event => ({
      id: event.id,
      titulo: event.titulo,
      descripcion: event.descripcion,
      fecha: event.fecha.value,
      lugar: event.lugar,
      capacidadTotal: event.capacidadTotal.value,
      precio: event.precio,
      organizadorId: event.organizadorId,
      reservasConfirmadas: event.reservasConfirmadas,
      reservasPendientes: event.reservasPendientes,
      cuposDisponibles: event.cuposDisponibles,
      estado: event.estado
    }))
  }
}