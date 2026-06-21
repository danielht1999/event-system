// src/modules/event/application/commands/IncreaseTicketCapacityCommand.ts

export class IncreaseTicketCapacityCommand {
  readonly eventId: string;
  readonly ticketTypeId: string;
  readonly organizadorId: string;
  readonly nuevaCapacidad: number;

  constructor(data: { eventId: string; ticketTypeId: string; organizadorId: string; nuevaCapacidad: number }) {
    if (!data.eventId || !data.ticketTypeId || !data.organizadorId) {
      throw new Error('Todos los IDs son obligatorios');
    }
    if (!data.nuevaCapacidad || data.nuevaCapacidad <= 0) {
      throw new Error('La capacidad debe ser un número entero mayor a 0');
    }
    this.eventId = data.eventId;
    this.ticketTypeId = data.ticketTypeId;
    this.organizadorId = data.organizadorId;
    this.nuevaCapacidad = data.nuevaCapacidad;
  }
}