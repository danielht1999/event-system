// src/modules/event/application/queries/GetEventsHandler.ts

import { PaginatedResult } from '@shared/application/query/PaginatedResult';
import { EventoListDTO, IEventQueryService } from '../services/IEventQueryService';
import { GetEventsQuery } from './GetEventsQuery';

export class GetEventsHandler {
  constructor(
    private eventQueryService: IEventQueryService
  ) {}

  /**
   * Ejecuta la consulta de eventos para el listado.
   * Devuelve datos optimizados (sin tickets anidados).
   */
  async execute(
    query: GetEventsQuery
  ): Promise<PaginatedResult<EventoListDTO>> {
    return this.eventQueryService.find(query);
  }
}