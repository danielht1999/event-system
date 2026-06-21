// src/modules/event/application/commands/UpdateEventCommand.ts

export class UpdateEventCommand {
  readonly eventId: string;
  readonly organizadorId: string;
  readonly titulo?: string;
  readonly descripcion?: string;
  readonly fecha?: string;
  readonly lugar?: string;

  constructor(data: {
    eventId: string;
    organizadorId: string;
    titulo?: string;
    descripcion?: string;
    fecha?: Date | string;
    lugar?: string;
  }) {
    if (!data.eventId || !data.organizadorId) {
      throw new Error('El ID del evento y del organizador son requeridos');
    }

    if (data.fecha) {
      const fechaObj = new Date(data.fecha);
      if (isNaN(fechaObj.getTime())) {
        throw new Error('Fecha inválida');
      }
      this.fecha = fechaObj.toISOString();
    }

    this.eventId = data.eventId;
    this.organizadorId = data.organizadorId;
    this.titulo = data.titulo?.trim();
    this.descripcion = data.descripcion;
    this.lugar = data.lugar?.trim();
  }
}