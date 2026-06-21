// src/modules/event/application/queries/GetEventsHandler.ts
import { PaginatedResult } from '@shared/application/query/PaginatedResult';
import { EventDTO, IEventQueryService } from '../services/IEventQueryService';
import { GetEventsQuery } from './GetEventsQuery';

export class GetEventsHandler {
  constructor(
    private eventQueryService: IEventQueryService
  ) {}

  /**
   * Ahora recibe el query completo, permitiendo filtrar, ordenar y paginar
   * en una sola llamada al servicio.
   */
  async execute(
    query: GetEventsQuery
  ): Promise<PaginatedResult<EventDTO>> {
    // Llamamos al método unificado 'find' en lugar de 'findAll'
    return this.eventQueryService.find(query);
  }
}