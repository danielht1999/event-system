export type EstadoReserva = 
  | 'PENDIENTE_PAGO'
  | 'CONFIRMADA'
  | 'CANCELADA'
  | 'EXPIRADA'
  | 'CHECKED_IN';

export class Reserva {
  constructor(
    public readonly id: string,
    public readonly eventoId: string,
    public readonly usuarioId: string,
    public readonly cantidadTickets: number,
    private _estado: EstadoReserva,
    public readonly codigoTicket: string,
    public reservadoEn: Date = new Date(),
    public pagadoEn?: Date,
    public checkedInEn?: Date
  ) {
    this.validarCantidad();
  }

  private validarCantidad(): void {
    if (this.cantidadTickets <= 0) {
      throw new Error('La cantidad de tickets debe ser mayor a 0');
    }
    if (this.cantidadTickets > 4) {
      throw new Error('No se pueden reservar mas de 4 tickets por persona');
    }
  }

  get estado(): EstadoReserva {
    return this._estado;
  }

  public confirmarPago(): void {
    if (this._estado !== 'PENDIENTE_PAGO') {
      throw new Error('Solo se pueden confirmar reservas en estado pendiente');
    }
    this._estado = 'CONFIRMADA';
    this.pagadoEn = new Date();
  }

  public cancelar(): void {
    if (this._estado === 'CHECKED_IN') {
      throw new Error('No se puede cancelar una reserva ya utilizada');
    }
    this._estado = 'CANCELADA';
  }

  public hacerCheckIn(): void {
    if (this._estado !== 'CONFIRMADA') {
      throw new Error('Solo se puede hacer check-in de reservas confirmadas');
    }
    this._estado = 'CHECKED_IN';
    this.checkedInEn = new Date();
  }
}
