// src/shared/infrastructure/messaging/DomainEventBus.ts
import { EventEmitter } from 'events';
import { IDomainEvent } from '@shared/domain/IDomainEvent';

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

  // Los suscriptores usan este método para quedarse escuchando un evento específico
  listen(eventName: string, callback: (event: IDomainEvent) => void): void {
    this.bus.on(eventName, callback);
  }
}

// Exportamos una instancia única (Singleton) para asegurar que toda la app use el mismo canal
export const domainEventBus = new DomainEventBus();