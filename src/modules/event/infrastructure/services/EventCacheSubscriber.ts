// src/modules/event/infrastructure/services/EventCacheSubscriber.ts
import { domainEventBus } from '@shared/infrastructure/messaging/DomainEventBus';
import { cacheService } from '@shared/infrastructure/cache/cache.service';
import { IDomainEvent } from '@shared/domain/IDomainEvent';
import { DomainEventNames } from '@shared/domain/DomainEventNames'; 

export class EventCacheSubscriber {
  constructor() {
    this.setupListeners();
  }

  private setupListeners(): void {
    // Unificamos todos los eventos que requieren la misma estrategia de invalidación de caché
    const cacheInvalidationEvents = [
      // Módulo EVENT
      DomainEventNames.EVENT.CANCELLED, 
      DomainEventNames.EVENT.SEATS_PROVISIONED, 
      DomainEventNames.EVENT.STATUS_UPDATED,
      
      // Módulo RESERVATION (Ahora enriquecidos con organizerId en el payload)
      DomainEventNames.RESERVATION.CREATED,
      DomainEventNames.RESERVATION.CANCELLED,
      DomainEventNames.RESERVATION.EXPIRED
    ];

    cacheInvalidationEvents.forEach((eventName) => {
      domainEventBus.listen(eventName as any, async (event: IDomainEvent) => {
        try {
          // Extraemos organizerId de forma segura. 
          const { organizerId } = event.data;

          if (!organizerId) {
            console.warn(`[Cache Subscriber] Advertencia: Se recibió ${eventName} sin organizerId.`);
            return;
          }
          await Promise.all([
            cacheService.delete('events:all'),
            cacheService.delete(`events:organizer:${organizerId}`)
          ]);

          console.log(`[Cache Subscriber] Redis invalidado con éxito ante: ${eventName} (Organizador: ${organizerId})`);
        } catch (error) {
          // Mantienes tu principio Fail-Safe intacto
          console.error(`[Cache Subscriber] Error crítico al limpiar Redis en ${eventName}:`, error);
        }
      });
    });
  }
}