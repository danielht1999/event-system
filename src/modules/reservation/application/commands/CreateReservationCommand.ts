// src/modules/reservation/application/commands/CreateReservationCommand.ts
export class CreateReservationCommand {
  readonly eventoId: string;
  readonly ticketTypeId: string; 
  readonly cantidadTickets: number;
  readonly usuarioId: string;

  constructor(data: { eventoId: string; ticketTypeId: string; cantidadTickets: number; usuarioId: string }) {
    if (!data.eventoId || !data.ticketTypeId || !data.usuarioId) {
      throw new Error('Evento, tipo de ticket y usuario son requeridos');
    }
    if (data.cantidadTickets < 1 || data.cantidadTickets > 4) {
      throw new Error('Solo puedes comprar entre 1 y 4 tickets por vez');
    }
    this.eventoId = data.eventoId;
    this.ticketTypeId = data.ticketTypeId;
    this.cantidadTickets = data.cantidadTickets;
    this.usuarioId = data.usuarioId;
  }
}