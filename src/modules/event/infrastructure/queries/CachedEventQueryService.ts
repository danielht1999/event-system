import { IEventQueryService, EventDTO } from '../../application/services/IEventQueryService';
import { GetEventsQuery } from '../../application/queries/GetEventsQuery';
import { cacheService } from '@shared/infrastructure/cache/cache.service';
import { PaginatedResult } from '@shared/application/query/PaginatedResult';
import { Pagination } from '@shared/application/query/Pagination';

export class CachedEventQueryService implements IEventQueryService {
  private readonly TTL_EVENTS = 300; 

  constructor(
    private readonly originQueryService: IEventQueryService
  ) {}

  async find(query: GetEventsQuery): Promise<PaginatedResult<EventDTO>> {
    const { page, limit } = Pagination.normalize(query);
    
    // Generación dinámica de la clave de caché basada en TODOS los parámetros de filtro
    // Serializamos el query para asegurar unicidad
    const cacheKey = `events:find:${JSON.stringify({ 
      ...query, 
      page, 
      limit 
    })}`;

    const cachedResult = await cacheService.get<PaginatedResult<EventDTO>>(cacheKey);
    
    if (cachedResult) {
      console.log(`[Cache Hit] -> Resultados recuperados de Redis para filtros: ${cacheKey}`);
      return cachedResult;
    }

    console.log(`[Cache Miss] -> Consultando en PostgreSQL para: ${cacheKey}`);
    const result = await this.originQueryService.find(query);

    if (result && result.items.length > 0) {
      await cacheService.set(cacheKey, result, this.TTL_EVENTS);
    }

    return result;
  }
}