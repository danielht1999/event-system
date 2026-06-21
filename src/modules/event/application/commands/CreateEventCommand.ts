export interface TicketTypeInput {
  nombre: string;
  precio: number;
  capacidadTotal: number;
}

export class CreateEventCommand {
  readonly titulo: string;
  readonly descripcion: string;
  readonly fecha: string;  
  readonly lugar: string;
  readonly organizadorId: string;
  readonly tickets: TicketTypeInput[];

  constructor(data: {
    titulo: string;
    descripcion: string;
    fecha: Date | string;
    lugar: string;
    organizadorId: string;
    tickets: TicketTypeInput[];
  }) {
    if (!data.titulo?.trim()) throw new Error('Título requerido');
    
    const fechaObj = new Date(data.fecha);
    if (isNaN(fechaObj.getTime())) throw new Error('Fecha inválida');
    if (fechaObj <= new Date()) throw new Error('Fecha debe ser futura');
    
    if (!Array.isArray(data.tickets) || data.tickets.length === 0) {
      throw new Error('El evento debe tener al menos un tipo de ticket configurado');
    }

    // Validar de forma preventiva las estructuras internas de los tickets
    for (const ticket of data.tickets) {
      if (!ticket.nombre?.trim()) throw new Error('El nombre del tipo de ticket es requerido');
      if (ticket.precio < 0) throw new Error('El precio del ticket no puede ser negativo');
      if (ticket.capacidadTotal <= 0) throw new Error('La capacidad del ticket debe ser mayor a 0');
    }
    
    this.titulo = data.titulo.trim();
    this.descripcion = data.descripcion || '';
    this.fecha = fechaObj.toISOString();  
    this.lugar = data.lugar;
    this.organizadorId = data.organizadorId;
    this.tickets = data.tickets.map(t => ({
      nombre: t.nombre.trim(),
      precio: t.precio,
      capacidadTotal: t.capacidadTotal
    }));
  }
}