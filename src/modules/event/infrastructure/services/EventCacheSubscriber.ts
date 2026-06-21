import { domainEventBus } from '@shared/infrastructure/messaging/DomainEventBus';
import { cacheService } from '@shared/infrastructure/cache/cache.service';
import { IDomainEvent } from '@shared/domain/IDomainEvent';
import { DomainEventNames } from '@shared/domain/DomainEventNames'; 

export class EventCacheSubscriber {
  constructor() {
    this.setupListeners();
  }

  private setupListeners(): void {
    // Unificamos todos los eventos válidos que requieren invalidación de caché de lectura
    const cacheInvalidationEvents = [
      // Módulo EVENT (Refactorizado)
      DomainEventNames.EVENT.CREATED,      //Limpia la cartelera al crear el evento + tickets de forma atómica
      DomainEventNames.EVENT.CANCELLED, 
      DomainEventNames.EVENT.STATUS_UPDATED,
      
      // Módulo RESERVATION (Mantienen la invalidación reactiva por movimiento de stock)
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
          
          // Ejecución en paralelo de borrado
          await Promise.all([
            cacheService.delete('events:all'),
            cacheService.delete(`events:organizer:${organizerId}`)
          ]);

          console.log(`[Cache Subscriber] Redis invalidado con éxito ante: ${eventName} (Organizador: ${organizerId})`);
        } catch (error) {
          // Tu principio Fail-Safe intacto: la caída de caché jamás tumba el flujo principal
          console.error(`[Cache Subscriber] Error crítico al limpiar Redis en ${eventName}:`, error);
        }
      });
    });
  }
}