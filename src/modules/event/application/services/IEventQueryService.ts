import { PaginatedResult } from '@shared/application/query/PaginatedResult';
import { GetEventsQuery } from '../queries/GetEventsQuery';

export interface TicketTypeDTO {
  id: string;
  nombre: string;
  precio: number;
  capacidadMaxima: number;
  reservasPendientes: number;
  reservasConfirmadas: number;
  cuposDisponibles: number;
  estado: string;
}

export interface EventDTO {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  lugar: string;
  organizadorId: string;
  estado: string;
  tickets: TicketTypeDTO[];
}

export interface IEventQueryService {
  /**
   * Busca eventos aplicando filtros dinámicos basados en GetEventsQuery.
   * Esto reemplaza a findAll y findByOrganizer.
   */
  find(query: GetEventsQuery): Promise<PaginatedResult<EventDTO>>;
}