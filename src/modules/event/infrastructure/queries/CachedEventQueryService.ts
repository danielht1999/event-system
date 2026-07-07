// src/modules/event/infrastructure/queries/CachedEventQueryService.ts

import {
  IEventQueryService,
  EventoListDTO,
  EventoDetalleDTO,
  EventoManagementDTO
} from '../../application/services/IEventQueryService';

import { GetEventsQuery } from '../../application/queries/GetEventsQuery';
import { cacheService } from '@shared/infrastructure/cache/cache.service';
import { PaginatedResult } from '@shared/application/query/PaginatedResult';
import { Pagination } from '@shared/application/query/Pagination';

export class CachedEventQueryService implements IEventQueryService {
  private readonly TTL_EVENTS = 300;

  constructor(
    private readonly originQueryService: IEventQueryService
  ) {}

  // ============================================================
  // LISTADO PÚBLICO
  // ============================================================

  async find(query: GetEventsQuery): Promise<PaginatedResult<EventoListDTO>> {
    const { page, limit } = Pagination.normalize(query);

    const cacheKey = `events:list:${JSON.stringify({
      ...query,
      page,
      limit
    })}`;

    const cachedResult =
      await cacheService.get<PaginatedResult<EventoListDTO>>(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    const result = await this.originQueryService.find(query);

    if (result.items.length > 0) {
      await cacheService.set(cacheKey, result, this.TTL_EVENTS);
    }

    return result;
  }

  // ============================================================
  // DETALLE PÚBLICO
  // ============================================================

  async findById(id: string): Promise<EventoDetalleDTO | null> {
    return this.originQueryService.findById(id);
  }

  // ============================================================
  // PANEL DEL ORGANIZADOR
  // ============================================================

  async findManagement(
    organizerId: string,
    query: GetEventsQuery
  ): Promise<PaginatedResult<EventoManagementDTO>> {

    const { page, limit } = Pagination.normalize(query);

    const cacheKey = `events:management:${organizerId}:${JSON.stringify({
      ...query,
      page,
      limit
    })}`;

    const cachedResult =
      await cacheService.get<PaginatedResult<EventoManagementDTO>>(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    const result =
      await this.originQueryService.findManagement(organizerId, query);

    if (result.items.length > 0) {
      await cacheService.set(cacheKey, result, this.TTL_EVENTS);
    }

    return result;
  }
}