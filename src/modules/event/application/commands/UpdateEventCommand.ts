// src/modules/event/application/commands/UpdateEventCommand.ts
import { ValidationError } from '@shared/domain/errors';

export class UpdateEventCommand {
  readonly eventId: string;
  readonly organizadorId: string;
  readonly titulo?: string;
  readonly descripcion?: string;
  readonly fecha?: string;
  readonly lugar?: string;
  readonly capacidadTotal?: number;

  constructor(data: {
    eventId: string;
    organizadorId: string;
    titulo?: string;
    descripcion?: string;
    fecha?: Date | string;
    lugar?: string;
    capacidadTotal?: number;
  }) {
    if (!data.eventId) {
      throw new ValidationError('El ID del evento es requerido');
    }
    if (!data.organizadorId) {
      throw new ValidationError('El ID del organizador es requerido');
    }

    if (data.fecha) {
      const fechaObj = new Date(data.fecha);
      if (isNaN(fechaObj.getTime())) {
        throw new ValidationError('Fecha inválida');
      }
      if (fechaObj <= new Date()) {
        throw new ValidationError('La fecha debe ser en el futuro');
      }
      this.fecha = fechaObj.toISOString();
    }

    // Solo validamos formato, no reglas de negocio
    if (data.capacidadTotal !== undefined) {
      if (!Number.isInteger(data.capacidadTotal)) {
        throw new ValidationError('capacidadTotal debe ser un número entero');
      }
      if (data.capacidadTotal < 0) {
        throw new ValidationError('capacidadTotal no puede ser negativo');
      }
      this.capacidadTotal = data.capacidadTotal;
    }

    this.eventId = data.eventId;
    this.organizadorId = data.organizadorId;
    this.titulo = data.titulo?.trim();
    this.descripcion = data.descripcion?.trim();
    this.lugar = data.lugar?.trim();
  }
}