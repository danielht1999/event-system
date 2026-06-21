// src/modules/event/application/commands/CancelEventCommand.ts

export class CancelEventCommand {
  readonly eventId: string;
  readonly organizerId: string;

  constructor(data: { eventId: string; organizerId: string }) {
    if (!data.eventId || !data.organizerId) {
      throw new Error('El ID del evento y el ID del organizador son requeridos');
    }
    this.eventId = data.eventId;
    this.organizerId = data.organizerId;
  }
}