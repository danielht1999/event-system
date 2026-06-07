// src/shared/infrastructure/messaging/DomainEventBus.ts
import { EventEmitter } from 'events';
import { IDomainEvent } from '@shared/domain/IDomainEvent';
import { DomainEventPayloadMap } from '@shared/domain/DomainEventPayloads';

class DomainEventBus {
  private bus = new EventEmitter();

  constructor() {
    // Elevamos el límite nativo de listeners para evitar advertencias de Node si el sistema escala
    this.bus.setMaxListeners(50);
  }

  // Los repositorios usan este método para gritar que algo pasó
  publish(eventName: string, event: IDomainEvent): void {
    this.bus.emit(eventName, event);
  }

  // MÁGIA DE TS: Al elegir un evento 'K' del mapa, infiere el tipo de su data automáticamente
  listen<K extends keyof DomainEventPayloadMap>(
    eventName: K,
    callback: (event: IDomainEvent<DomainEventPayloadMap[K]>) => void
  ): void {
    this.bus.on(eventName, callback);
  }
}

// Exportamos una instancia única (Singleton) para asegurar que toda la app use el mismo canal
export const domainEventBus = new DomainEventBus();