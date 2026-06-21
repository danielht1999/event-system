// src/shared/infrastructure/messaging/DomainEventBus.ts

import { EventEmitter } from 'events';
import { IDomainEvent } from '@shared/domain/IDomainEvent';
import { DomainEventPayloadMap } from '@shared/domain/DomainEventPayloads';

/** 
 * EXPLICACIÓN DEL CAMBIO:
 * Anteriormente, se utilizaba genéricos planos basados en `keyof DomainEventPayloadMap`. 
 * A medida que el mapa de payloads creció en la Fase 1 para incluir sub-namespaces anidados 
 * (como TICKET_TYPE y PAYMENT), TypeScript expandió la inferencia de las claves a:
 * `string | number | symbol` para cubrir estructuras de objetos calculados complejos.
 *
 * Como el `EventEmitter` nativo de Node.js restringe estrictamente sus nombres de eventos a 
 * un contrato de tipo `string | symbol`, la suite de Typescript arrojaba un error de compilación.
 * * SOLUCIÓN:
 * Se extrae de forma explícita un tipo unificado `DomainEventName` aplicando una intersección 
 * estricta con `string`. Esto filtra y garantiza al compilador que solo operamos con cadenas de 
 * texto legibles, eliminando la ambigüedad y blindando los métodos `publish` y `listen`.
 */
type DomainEventName = keyof DomainEventPayloadMap & string;

class DomainEventBus {
  private bus = new EventEmitter();

  constructor() {
    // Elevamos el límite nativo de listeners para evitar advertencias de Node si el sistema escala
    this.bus.setMaxListeners(50);
  }

  /**
   * Los repositorios y servicios usan este método para gritar que algo pasó.
   * Se añade soporte genérico <K> para validar que si el publicador conoce el tipo estático,
   * el payload coincida exactamente con la interfaz del mapa.
   */
  publish<K extends DomainEventName>(
    eventName: string, 
    event: IDomainEvent<DomainEventPayloadMap[K]> | IDomainEvent
  ): void {
    this.bus.emit(eventName, event);
  }

  /**
   * MÁGIA DE TS: Al elegir un evento 'K' del mapa (restringido a string), 
   * infiere el tipo de su data automáticamente sin colisionar con el EventEmitter.
   */
  listen<K extends DomainEventName>(
    eventName: K,
    callback: (event: IDomainEvent<DomainEventPayloadMap[K]>) => void
  ): void {
    this.bus.on(eventName, callback);
  }
}

// Exportamos una instancia única (Singleton) para asegurar que toda la app use el mismo canal
export const domainEventBus = new DomainEventBus();