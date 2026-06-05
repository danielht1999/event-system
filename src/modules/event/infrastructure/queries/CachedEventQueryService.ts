// src/modules/event/infrastructure/queries/CachedEventQueryService.ts
import { IEventQueryService, EventDTO } from '../../application/services/IEventQueryService';
import { cacheService } from '@shared/infrastructure/cache/cache.service';

export class CachedEventQueryService implements IEventQueryService {
  // Configuración de tiempos de vida (TTL) en segundos
  private readonly TTL_ALL_EVENTS = 300; // 5 minutos para el catálogo general
  private readonly TTL_ORGANIZER_EVENTS = 600; // 10 minutos para el catálogo por organizador

  constructor(
    // Inversión de dependencias: recibimos el PostgresEventQueryService real
    private readonly originQueryService: IEventQueryService
  ) {}

  /**
   * Obtiene todos los eventos de la plataforma utilizando caché (Redis)
   */
  async findAll(): Promise<EventDTO[]> {
    const cacheKey = 'events:all';

    // 1. Intentar recuperar de la caché
    const cachedEvents = await cacheService.get<EventDTO[]>(cacheKey);
    if (cachedEvents) {
      console.log('[Cache Hit] -> Catálogo general recuperado de Redis');
      return cachedEvents;
    }

    console.log('[Cache Miss] -> Consultando catálogo general en PostgreSQL...');
    
    // 2. Si no hay caché, delegar en el servicio original de Postgres
    const events = await this.originQueryService.findAll();

    // 3. Guardar en caché el resultado para las próximas solicitudes
    if (events && events.length > 0) {
      await cacheService.set(cacheKey, events, this.TTL_ALL_EVENTS);
    }

    return events;
  }

  /**
   * Obtiene los eventos filtrados por organizador utilizando caché dinámica
   */
  async findByOrganizer(organizerId: string): Promise<EventDTO[]> {
    const cacheKey = `events:organizer:${organizerId}`;

    // 1. Intentar recuperar de la caché usando la llave segmentada por ID
    const cachedOrganizerEvents = await cacheService.get<EventDTO[]>(cacheKey);
    if (cachedOrganizerEvents) {
      console.log(`[Cache Hit] -> Eventos del organizador [${organizerId}] desde Redis`);
      return cachedOrganizerEvents;
    }

    console.log(`[Cache Miss] -> Consultando eventos del organizador [${organizerId}] en PostgreSQL...`);

    // 2. Delegar en la base de datos si no existe en caché
    const events = await this.originQueryService.findByOrganizer(organizerId);

    // 3. Guardar en caché de forma segmentada
    if (events && events.length > 0) {
      await cacheService.set(cacheKey, events, this.TTL_ORGANIZER_EVENTS);
    }

    return events;
  }
}