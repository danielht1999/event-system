// src/modules/event/application/queries/GetManagementEventsHandler.ts

import { PaginatedResult } from '@shared/application/query/PaginatedResult';
import { EventoManagementDTO, IEventQueryService } from '../services/IEventQueryService';
import { GetEventsQuery } from './GetEventsQuery';

export class GetManagementEventsHandler {
  constructor(
    private readonly eventQueryService: IEventQueryService
  ) {}

  /**
   * Ejecuta la consulta de eventos para la sección de administración del organizador.
   * Devuelve datos paginados con el detalle completo de sus tickets.
   */
  async execute(
    organizerId: string,
    query: GetEventsQuery
  ): Promise<PaginatedResult<EventoManagementDTO>> {
    return this.eventQueryService.findManagement(organizerId, query);
  }
}