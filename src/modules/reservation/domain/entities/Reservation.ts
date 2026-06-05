// src/modules/reservation/domain/entities/Reservation.ts
import { IDomainEvent } from '@shared/domain/IDomainEvent';

export type ReservationStatus = 
  | 'PENDIENTE_PAGO'
  | 'CONFIRMADA'
  | 'CANCELADA'
  | 'EXPIRADA'
  | 'CHECKED_IN';

export class Reservation {
  private _domainEvents: IDomainEvent[] = [];

  constructor(
    public readonly id: string,
    public readonly eventoId: string,
    public readonly usuarioId: string,
    public readonly cantidadTickets: number,
    private _estado: ReservationStatus,
    public readonly codigoTicket: string,
    public reservadoEn: Date = new Date(),
    public pagadoEn?: Date,
    public checkedInEn?: Date
  ) {
    this.validateQuantity();
  }

  private validateQuantity(): void {
    if (this.cantidadTickets <= 0) {
      throw new Error('La cantidad de tickets debe ser mayor a 0');
    }
    if (this.cantidadTickets > 4) {
      throw new Error('No se pueden reservar mas de 4 tickets por persona');
    }
  }

  get estado(): ReservationStatus {
    return this._estado;
  }

  public recordEvent(name: string, data: any): void {
    this._domainEvents.push({
      eventName: name,
      occurredOn: new Date(),
      data
    });
  }

  public pullDomainEvents(): IDomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }

  // =========================================================================
  // ACCIONES EXPLICITAS DE NEGOCIO (MUTADORES)
  // =========================================================================

  public confirmarPago(): void {
    if (this._estado !== 'PENDIENTE_PAGO') {
      throw new Error('Solo se pueden confirmar reservas en estado pendiente');
    }
    this._estado = 'CONFIRMADA';
    this.pagadoEn = new Date();

    this.recordEvent('ReservationConfirmed', {
      reservationId: this.id,
      eventoId: this.eventoId,
      cantidadTickets: this.cantidadTickets
    });
  }

  public cancelar(): void {
    if (this._estado === 'CHECKED_IN') {
      throw new Error('No se puede cancelar una reserva ya utilizada');
    }
    
    const estadoAnterior = this._estado;
    this._estado = 'CANCELADA';

    this.recordEvent('ReservationCancelled', {
      reservationId: this.id,
      eventoId: this.eventoId,
      cantidadTickets: this.cantidadTickets,
      debeLiberarCupos: estadoAnterior === 'PENDIENTE_PAGO' || estadoAnterior === 'CONFIRMADA'
    });
  }

  public hacerCheckIn(): void {
    if (this._estado !== 'CONFIRMADA') {
      throw new Error('Solo se puede hacer check-in de reservas confirmadas');
    }
    this._estado = 'CHECKED_IN';
    this.checkedInEn = new Date();

    this.recordEvent('ReservationCheckedIn', {
      reservationId: this.id,
      eventoId: this.eventoId
    });
  }

  public expirar(): void {
    if (this._estado === 'EXPIRADA') return;
    if (this._estado !== 'PENDIENTE_PAGO') {
      throw new Error(`Solo las reservas PENDIENTE_PAGO pueden expirar, estado actual: ${this._estado}`);
    }

    this._estado = 'EXPIRADA';

    this.recordEvent('ReservationExpired', {
      reservationId: this.id,
      eventoId: this.eventoId,
      cantidadTickets: this.cantidadTickets
    });
  }
}