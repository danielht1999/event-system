// src/modules/event/application/commands/AddTicketTypeToEventCommand.ts

export class AddTicketTypeToEventCommand {
  readonly ticketTypeId: string;
  readonly eventId: string;
  readonly organizadorId: string;
  readonly nombre: string;
  readonly precio: number;
  readonly capacidad: number;

  constructor(data: { 
    ticketTypeId: string; 
    eventId: string; 
    organizadorId: string; 
    nombre: string; 
    precio: number; 
    capacidad: number; 
  }) {
    if (!data.ticketTypeId || !data.eventId || !data.organizadorId || !data.nombre?.trim()) {
      throw new Error('Identificadores y nombre son campos obligatorios');
    }
    if (data.precio < 0) throw new Error('El precio del ticket no puede ser negativo');
    if (data.capacidad <= 0) throw new Error('La capacidad del ticket debe ser mayor a 0');

    this.ticketTypeId = data.ticketTypeId;
    this.eventId = data.eventId;
    this.organizadorId = data.organizadorId;
    this.nombre = data.nombre.trim();
    this.precio = data.precio;
    this.capacidad = data.capacidad;
  }
}