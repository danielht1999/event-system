// src/modules/event/application/queries/GetEventsByOrganizerHandler.ts
import { IEventRepository } from '../../domain/repositories/IEventRepository';
import { GetEventsByOrganizerQuery } from './GetEventsByOrganizerQuery';

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

export class GetEventsByOrganizerHandler {
  constructor(
    private eventRepository: IEventRepository
  ) {}

  async execute(query: GetEventsByOrganizerQuery): Promise<EventDTO[]> {
    const events = await this.eventRepository.findByOrganizerId(query.organizerId);    
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
    }));
  }
}