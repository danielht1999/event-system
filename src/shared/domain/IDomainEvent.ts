// src/shared/domain/IDomainEvent.ts

// Ahora recibe una 'T' que por defecto es any por compatibilidad, pero puede ser estricta
export interface IDomainEvent<T = any> {
  eventName: string;
  occurredOn: Date;
  data: T; 
}