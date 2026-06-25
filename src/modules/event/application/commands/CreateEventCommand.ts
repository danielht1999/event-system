// src/modules/event/application/commands/CreateEventCommand.ts

import { ValidationError } from '@shared/domain/errors';

export interface TicketTypeInput {
  nombre: string;
  precio: number;
  capacidad: number;
}

export class CreateEventCommand {
  readonly titulo: string;
  readonly descripcion: string;
  readonly fecha: string;
  readonly lugar: string;
  readonly capacidadTotal: number;
  readonly organizadorId: string;
  readonly tickets: TicketTypeInput[];

  constructor(data: {
    titulo: string;
    descripcion: string;
    fecha: Date | string;
    lugar: string;
    capacidadTotal: number;
    organizadorId: string;
    tickets: TicketTypeInput[];
  }) {
    if (!data.titulo?.trim() || data.titulo.trim().length < 5) {
      throw new ValidationError('Título requerido (mínimo 5 caracteres)');
    }

    if (!data.descripcion?.trim()) {
      throw new ValidationError('Descripción requerida');
    }

    if (!data.lugar?.trim()) {
      throw new ValidationError('Lugar requerido');
    }

    if (!data.organizadorId) {
      throw new ValidationError('El ID del organizador es requerido');
    }

    const fechaObj = new Date(data.fecha);
    if (isNaN(fechaObj.getTime())) {
      throw new ValidationError('Fecha inválida');
    }
    if (fechaObj <= new Date()) {
      throw new ValidationError('Fecha debe ser futura');
    }

    if (data.capacidadTotal <= 0) {
      throw new ValidationError('La capacidad total del evento debe ser mayor a 0');
    }
    if (data.capacidadTotal > 10000) {
      throw new ValidationError('La capacidad total del evento no puede ser mayor a 10000');
    }

    if (!Array.isArray(data.tickets) || data.tickets.length === 0) {
      throw new ValidationError('El evento debe tener al menos un tipo de ticket configurado');
    }

    const capacidadAsignada = data.tickets.reduce((sum, ticket) => sum + ticket.capacidad, 0);
    if (capacidadAsignada > data.capacidadTotal) {
      throw new ValidationError('La capacidad total asignada a los tickets excede la capacidad del evento');
    }

    for (const ticket of data.tickets) {
      if (!ticket.nombre?.trim()) {
        throw new ValidationError('El nombre del tipo de ticket es requerido');
      }
      if (ticket.precio < 0) {
        throw new ValidationError('El precio del ticket no puede ser negativo');
      }
      if (ticket.capacidad <= 0) {
        throw new ValidationError('La capacidad del ticket debe ser mayor a 0');
      }
    }

    this.titulo = data.titulo.trim();
    this.descripcion = data.descripcion?.trim() || '';
    this.fecha = fechaObj.toISOString();
    this.lugar = data.lugar.trim();
    this.capacidadTotal = data.capacidadTotal;
    this.organizadorId = data.organizadorId;
    this.tickets = data.tickets.map(t => ({
      nombre: t.nombre.trim(),
      precio: t.precio,
      capacidad: t.capacidad
    }));
  }
}