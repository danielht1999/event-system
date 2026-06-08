export abstract class DomainError extends Error {
  abstract readonly code: string;
  
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// Ejemplo de error específico de tu negocio
export class EventCapacityExceededError extends DomainError {
  readonly code = 'EVENT_CAPACITY_EXCEEDED';
  
  constructor(eventId: string) {
    super(`El evento con ID ${eventId} no tiene suficientes cupos disponibles.`);
  }
}