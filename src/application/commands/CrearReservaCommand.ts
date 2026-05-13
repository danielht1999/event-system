// src/application/commands/CrearReservaCommand.ts
export class CrearReservaCommand {
    readonly eventoId: string;
    readonly cantidadTickets: number;
    readonly usuarioId: string;

    constructor(data: { eventoId: string; cantidadTickets: number; usuarioId: string }) {
    if (!data.eventoId || !data.usuarioId) {
      throw new Error('Evento y usuario requeridos');
    }
    if (data.cantidadTickets < 1 || data.cantidadTickets > 4) {
      throw new Error('Solo puedes comprar entre 1 y 4 tickets por vez');
    }
    this.eventoId = data.eventoId;
    this.usuarioId = data.usuarioId;
    this.cantidadTickets = data.cantidadTickets;
  }
}