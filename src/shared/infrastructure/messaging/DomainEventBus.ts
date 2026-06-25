// src/shared/infrastructure/messaging/DomainEventBus.ts

import { EventEmitter } from 'events';
import { IDomainEvent } from '@shared/domain/IDomainEvent';
import { DomainEventName } from '@shared/domain/DomainEventNames';
import { DomainEventPayloadMap } from '@shared/domain/DomainEventPayloads';

/**
 * DomainEventBus - Sistema de eventos de dominio tipado
 * 
 * PROPS: 
 * - 100% type-safe: el compilador valida que eventName y payload coincidan
 * - No permite eventos genéricos sin tipar
 * - Soporta todos los eventos definidos en DomainEventPayloadMap
 */
class DomainEventBus {
  private bus = new EventEmitter();

  constructor() {
    this.bus.setMaxListeners(50);
  }

  /**
   * ✅ PUBLISH - Emite un evento de dominio con payload tipado
   * 
   * @example
   * domainEventBus.publish(DomainEventNames.EVENT.CREATED, {
   *   eventName: DomainEventNames.EVENT.CREATED,
   *   occurredOn: new Date(),
   *   data: {
   *     eventId: '123',
   *     organizerId: '456',
   *     titulo: 'Mi evento',
   *     // ... todos los campos requeridos
   *   }
   * });
   */
  publish<K extends DomainEventName>(
    eventName: K,
    event: IDomainEvent<DomainEventPayloadMap[K]>
  ): void {
    this.bus.emit(eventName, event);
  }

  /**
   * ✅ LISTEN - Escucha eventos de dominio con callback tipado
   * 
   * @example
   * domainEventBus.listen(DomainEventNames.EVENT.CREATED, (event) => {
   *   // event.data tiene tipo EventCreatedPayload
   *   console.log(event.data.eventId);
   * });
   */
  listen<K extends DomainEventName>(
    eventName: K,
    callback: (event: IDomainEvent<DomainEventPayloadMap[K]>) => void
  ): void {
    this.bus.on(eventName, callback);
  }

  /**
   * ✅ ONCE - Escucha un evento una sola vez
   */
  once<K extends DomainEventName>(
    eventName: K,
    callback: (event: IDomainEvent<DomainEventPayloadMap[K]>) => void
  ): void {
    this.bus.once(eventName, callback);
  }

  /**
   * ✅ REMOVE LISTENER - Elimina un listener específico
   */
  removeListener<K extends DomainEventName>(
    eventName: K,
    callback: (event: IDomainEvent<DomainEventPayloadMap[K]>) => void
  ): void {
    this.bus.removeListener(eventName, callback);
  }

  /**
   * ✅ REMOVE ALL LISTENERS - Elimina todos los listeners de un evento
   */
  removeAllListeners(eventName?: DomainEventName): void {
    if (eventName) {
      this.bus.removeAllListeners(eventName);
    } else {
      this.bus.removeAllListeners();
    }
  }
}

// Exportamos una instancia única (Singleton)
export const domainEventBus = new DomainEventBus();