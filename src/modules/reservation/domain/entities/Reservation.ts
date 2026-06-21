// src/modules/reservation/domain/entities/Reservation.ts

import { IDomainEvent } from '@shared/domain/IDomainEvent';
import { DomainEventNames } from '@shared/domain/DomainEventNames';
import { ValidationError } from '@shared/domain/errors';

import {
  ReservationNotPendingError,
  ReservationAlreadyCancelledError,
  ReservationCheckedInError
} from '../errors';

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
    public readonly eventId: string,
    public readonly ticketTypeId: string,
    public readonly usuarioId: string,
    public readonly cantidadTickets: number,
    private _estado: ReservationStatus,
    public readonly codigoTicket: string,
    public readonly reservadoEn: Date = new Date(),
    private _pagadoEn?: Date,
    private _checkedInEn?: Date
  ) {
    this.validateQuantity();
  }

  // FACTORY

  public static create(props: {
    id: string;
    eventId: string;
    ticketTypeId: string;
    usuarioId: string;
    cantidadTickets: number;
    codigoTicket: string;
  }): Reservation {
    const reservation = new Reservation(
      props.id,
      props.eventId,
      props.ticketTypeId,
      props.usuarioId,
      props.cantidadTickets,
      'PENDIENTE_PAGO',
      props.codigoTicket,
      new Date()
    );

    reservation.recordEvent(
      DomainEventNames.RESERVATION.CREATED,
      {
        reservationId: reservation.id,
        eventId: reservation.eventId,
        ticketTypeId: reservation.ticketTypeId,
        cantidadTickets: reservation.cantidadTickets
      }
    );
    return reservation;
  }

  // VALIDACIONES

  private validateQuantity(): void {
    if (this.cantidadTickets <= 0) {
      throw new ValidationError(
        'La cantidad de tickets debe ser mayor a 0'
      );
    }

    if (this.cantidadTickets > 4) {
      throw new ValidationError(
        'No se pueden reservar más de 4 tickets por persona'
      );
    }
  }

  // GETTERS DE LECTURA SEGURA

  get estado(): ReservationStatus {
    return this._estado;
  }

  get pagadoEn(): Date | undefined {
    return this._pagadoEn;
  }

  get checkedInEn(): Date | undefined {
    return this._checkedInEn;
  }

  // EVENTOS DE DOMINIO

  public recordEvent(
    name: string,
    data: any
  ): void {
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

  // ACCIONES DE NEGOCIO

  public confirmarPago(): void {
    if (this._estado !== 'PENDIENTE_PAGO') {
      throw new ReservationNotPendingError(this.id);
    }
    this._estado = 'CONFIRMADA';
    this._pagadoEn = new Date();
    this.recordEvent(
      DomainEventNames.RESERVATION.CONFIRMED,
      {
        reservationId: this.id,
        eventId: this.eventId,
        ticketTypeId: this.ticketTypeId,
        cantidadTickets: this.cantidadTickets
      }
    );
  }

  public cancelar(): void {
    if (this._estado === 'CHECKED_IN') {
      throw new ReservationCheckedInError(this.id);
    }
    if (this._estado === 'CANCELADA') {
      throw new ReservationAlreadyCancelledError(this.id);
    }
    const estadoAnterior = this._estado;
    this._estado = 'CANCELADA';
    this.recordEvent(
      DomainEventNames.RESERVATION.CANCELLED,
      {
        reservationId: this.id,
        eventId: this.eventId,
        ticketTypeId: this.ticketTypeId,
        cantidadTickets: this.cantidadTickets,
        debeLiberarCupos:
          estadoAnterior === 'PENDIENTE_PAGO' ||
          estadoAnterior === 'CONFIRMADA'
      }
    );
  }

  public hacerCheckIn(): void {
    if (this._estado !== 'CONFIRMADA') {
      if (this._estado === 'CANCELADA') {
        throw new ReservationAlreadyCancelledError(this.id);
      }
      throw new ReservationNotPendingError(this.id);
    }
    this._estado = 'CHECKED_IN';
    this._checkedInEn = new Date();

    this.recordEvent(
      DomainEventNames.RESERVATION.CHECKED_IN,
      {
        reservationId: this.id,
        eventId: this.eventId,
        ticketTypeId: this.ticketTypeId
      }
    );
  }

  public expirar(): void {
    if (this._estado === 'EXPIRADA') {
      return;
    }
    if (this._estado !== 'PENDIENTE_PAGO') {
      throw new ReservationNotPendingError(this.id);
    }
    this._estado = 'EXPIRADA';
    this.recordEvent(DomainEventNames.RESERVATION.EXPIRED,
      {
        reservationId: this.id,
        eventId: this.eventId,
        ticketTypeId: this.ticketTypeId,
        cantidadTickets: this.cantidadTickets
      }
    );
  }
}