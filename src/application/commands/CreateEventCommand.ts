// src/application/commands/CreateEventCommand.ts
export class CreateEventCommand {
  readonly titulo: string;
  readonly descripcion: string;
  readonly fecha: string;  
  readonly lugar: string;
  readonly capacidadTotal: number;
  readonly precio: number;
  readonly organizadorId: string;

  constructor(data: {
    titulo: string;
    descripcion: string;
    fecha: Date | string;
    lugar: string;
    capacidadTotal: number;
    precio: number;
    organizadorId: string;
  }) {
    if (!data.titulo?.trim()) throw new Error('Título requerido');
    
    const fechaObj = new Date(data.fecha);
    if (isNaN(fechaObj.getTime())) throw new Error('Fecha inválida');
    if (fechaObj <= new Date()) throw new Error('Fecha debe ser futura');
    if (data.capacidadTotal <= 0) throw new Error('Capacidad debe ser mayor a 0');
    
    this.titulo = data.titulo.trim();
    this.descripcion = data.descripcion || '';
    this.fecha = fechaObj.toISOString();  
    this.lugar = data.lugar;
    this.capacidadTotal = data.capacidadTotal;
    this.precio = data.precio || 0;
    this.organizadorId = data.organizadorId;
  }
}