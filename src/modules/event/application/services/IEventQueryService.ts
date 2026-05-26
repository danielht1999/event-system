// src/modules/event/application/services/IEventQueryService.ts

export interface EventDTO {
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

export interface IEventQueryService {
  findAll(): Promise<EventDTO[]>
  findByOrganizer(organizerId: string): Promise<EventDTO[]>
}