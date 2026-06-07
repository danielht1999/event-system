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
    const cacheInvalidationEvents = [
      DomainEventNames.EVENT.CANCELLED, 
      DomainEventNames.EVENT.SEATS_PROVISIONED, 
      DomainEventNames.EVENT.STATUS_UPDATED
    ];

    cacheInvalidationEvents.forEach((eventName) => {
      // Nota: Le pasamos 'any' temporalmente aquí al listen porque estamos iterando un array dinámico,
      // pero ya está usando el nombre de evento correcto del catálogo.
      domainEventBus.listen(eventName as any, async (event: IDomainEvent) => {
        try {
          const { organizerId } = event.data;

          // Limpieza selectiva y en paralelo en Redis para no bloquear el hilo de ejecución
          await Promise.all([
            cacheService.delete('events:all'),
            cacheService.delete(`events:organizer:${organizerId}`)
          ]);

          console.log(`[Cache Subscriber] Redis invalidado con éxito ante: ${eventName} (Organizador: ${organizerId})`);
        } catch (error) {
          // Principio Fail-Safe: si Redis falla, la app no se cae porque los datos ya están seguros en Postgres
          console.error(`[Cache Subscriber] Error crítico al limpiar Redis en ${eventName}:`, error);
        }
      });
    });
  }
}