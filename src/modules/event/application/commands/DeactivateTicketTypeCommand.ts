// src/modules/event/application/commands/DeactivateTicketTypeCommand.ts
export class DeactivateTicketTypeCommand {
  readonly eventId: string;
  readonly ticketTypeId: string;
  readonly organizadorId: string;

  constructor(data: { eventId: string; ticketTypeId: string; organizadorId: string }) {
    if (!data.eventId || !data.ticketTypeId || !data.organizadorId) {
      throw new Error('Todos los IDs son requeridos para desactivar el ticket');
    }
    this.eventId = data.eventId;
    this.ticketTypeId = data.ticketTypeId;
    this.organizadorId = data.organizadorId;
  }
}