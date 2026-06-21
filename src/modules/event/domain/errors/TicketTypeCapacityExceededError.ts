import { ValidationError } from '@shared/domain/errors/ValidationError';

export class TicketTypeCapacityExceededError extends ValidationError {
  constructor(nombreTicket: string) {
    super(`No hay suficientes cupos disponibles para el ticket tipo: ${nombreTicket}.`);
    this.name = 'TicketTypeCapacityExceededError';
  }
}