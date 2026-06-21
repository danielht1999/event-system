import { ValidationError } from '@shared/domain/errors/ValidationError';

export class TicketTypeNotFoundError extends ValidationError {
  constructor(ticketTypeId: string) {
    super(`El tipo de ticket con ID '${ticketTypeId}' no existe.`);
    this.name = 'TicketTypeNotFoundError';
  }
}