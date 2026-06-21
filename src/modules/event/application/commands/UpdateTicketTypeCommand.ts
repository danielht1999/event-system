// src/modules/event/application/commands/UpdateTicketTypeCommand.ts

export class UpdateTicketTypeCommand {
  readonly eventId: string;
  readonly ticketTypeId: string;
  readonly organizadorId: string;
  readonly nombre?: string;
  readonly precio?: number;

  constructor(data: { eventId: string; ticketTypeId: string; organizadorId: string; nombre?: string; precio?: number }) {
    this.eventId = data.eventId;
    this.ticketTypeId = data.ticketTypeId;
    this.organizadorId = data.organizadorId;
    this.nombre = data.nombre?.trim();
    this.precio = data.precio;
  }
}