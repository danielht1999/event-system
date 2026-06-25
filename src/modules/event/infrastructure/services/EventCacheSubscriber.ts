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
      DomainEventNames.EVENT.CREATED,
      DomainEventNames.EVENT.UPDATED,
      DomainEventNames.EVENT.STATUS_UPDATED,
      DomainEventNames.EVENT.CANCELLED,
      DomainEventNames.EVENT.FINISHED,

      DomainEventNames.RESERVATION.CREATED,
      DomainEventNames.RESERVATION.CANCELLED,
      DomainEventNames.RESERVATION.EXPIRED
    ];

    cacheInvalidationEvents.forEach((eventName) => {
      domainEventBus.listen(
        eventName as any,
        async (_event: IDomainEvent) => {
          try {
            // Por ahora sólo existe una caché global de eventos.
            // Cuando se implemente caché granular, aquí se podrán
            // invalidar claves específicas por eventId u organizerId.
            await cacheService.delete('events:all');

            console.log(
              `[Cache Subscriber] Redis invalidado ante ${eventName}`
            );
          } catch (error) {
            console.error(
              `[Cache Subscriber] Error al limpiar Redis en ${eventName}:`,
              error
            );
          }
        }
      );
    });
  }
}